import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { CurrencyManager } from '@requestnetwork/currency';
import {
  TestERC20__factory,
  TestERC20,
  FakeSwapRouter__factory,
  FakeSwapRouter,
  AggregatorMock__factory,
  Erc20ConversionProxy,
  ERC20SwapToConversion,
  ChainlinkConversionPath,
} from '../../src/types';
import {
  chainlinkConversionPath as chainlinkConvArtifact,
  erc20ConversionProxy as erc20ConversionProxyArtifact,
  erc20SwapConversionArtifact,
} from '../../src/lib';

use(solidity);

describe('contract: ERC20SwapToConversion', () => {
  let from: string;
  let to: string;
  let builder: string;
  let adminSigner: Signer;
  let signer: Signer;

  const currencyManager = CurrencyManager.getDefault();
  const USDhash = currencyManager.fromSymbol('USD')!.hash;
  const exchangeRateOrigin = Math.floor(Date.now() / 1000);
  const referenceExample = '0xaaaa';

  let paymentNetworkErc20: TestERC20;
  let spentErc20: TestERC20;
  let erc20ConversionProxy: Erc20ConversionProxy;
  let swapConversionProxy: ERC20SwapToConversion;
  let initialFromBalance: BigNumber;
  let fakeSwapRouter: FakeSwapRouter;
  let chainlinkConversion: ChainlinkConversionPath;
  let defaultSwapRouterAddress: string;
  let requestSwapFees = BigNumber.from(5);

  const fiatDecimal = BigNumber.from('100000000');
  const erc20Decimal = BigNumber.from('1000000000000000000');

  const erc20Liquidity = erc20Decimal.mul(100);

  before(async () => {
    [, from, to, builder] = (await ethers.getSigners()).map((s) => s.address);
    [adminSigner, signer] = await ethers.getSigners();
    chainlinkConversion = chainlinkConvArtifact.connect(network.name, adminSigner);
    erc20ConversionProxy = erc20ConversionProxyArtifact.connect(network.name, adminSigner);
    swapConversionProxy = erc20SwapConversionArtifact.connect(network.name, adminSigner);

    await swapConversionProxy.updateConversionPathAddress(chainlinkConversion.address);
    await swapConversionProxy.updateRequestSwapFees(requestSwapFees);
  });

  beforeEach(async () => {
    paymentNetworkErc20 = await new TestERC20__factory(adminSigner).deploy(erc20Decimal.mul(10000));
    spentErc20 = await new TestERC20__factory(adminSigner).deploy(erc20Decimal.mul(1000));

    // deploy fake chainlink conversion path, for 1 USD = 3 paymentNetworkERC20
    const aggTest = await new AggregatorMock__factory(adminSigner).deploy(300000000, 8, 60);
    await chainlinkConversion.updateAggregator(
      USDhash,
      paymentNetworkErc20.address,
      aggTest.address,
    );

    // Deploy a fake router and feed it with 200 payment ERC20 + 100 requested ERC20
    // The fake router fakes 2 payment ERC20 = 1 requested ERC20
    fakeSwapRouter = await new FakeSwapRouter__factory(adminSigner).deploy();

    await spentErc20.transfer(fakeSwapRouter.address, erc20Liquidity);
    await paymentNetworkErc20.transfer(fakeSwapRouter.address, erc20Liquidity.mul(2));

    defaultSwapRouterAddress = await swapConversionProxy.swapRouter();
    await swapConversionProxy.setRouter(fakeSwapRouter.address);
    await swapConversionProxy.approveRouterToSpend(spentErc20.address);
    await swapConversionProxy.approvePaymentProxyToSpend(
      paymentNetworkErc20.address,
      erc20ConversionProxy.address,
    );
    swapConversionProxy = await swapConversionProxy.connect(signer);

    // give payer some token
    await spentErc20.transfer(from, erc20Decimal.mul(600));
    spentErc20 = TestERC20__factory.connect(spentErc20.address, signer);
    initialFromBalance = await spentErc20.balanceOf(from);
    await spentErc20.approve(swapConversionProxy.address, initialFromBalance);
  });

  afterEach(async () => {
    swapConversionProxy = swapConversionProxy.connect(adminSigner);
    await swapConversionProxy.setRouter(defaultSwapRouterAddress);
    // The contract should never keep any fund
    const contractPaymentCcyBalance = await paymentNetworkErc20.balanceOf(
      swapConversionProxy.address,
    );
    const contractRequestCcyBalance = await spentErc20.balanceOf(swapConversionProxy.address);
    expect(contractPaymentCcyBalance.toNumber()).to.equals(0);
    expect(contractRequestCcyBalance.toNumber()).to.equals(0);
  });

  const expectPayerBalanceUnchanged = async () => {
    const finalFromBalance = await spentErc20.balanceOf(from);
    expect(finalFromBalance.toString()).to.equals(initialFromBalance.toString());
  };

  it('converts, swaps and pays the request', async function () {
    // Simulate request payment for 10 (fiat) + 1 (fiat) fee, in paymentNetworkErc20
    await expect(
      swapConversionProxy.swapTransferWithReference(
        erc20ConversionProxy.address,
        to,
        fiatDecimal.mul(10),
        erc20Decimal.mul(70),
        [spentErc20.address, paymentNetworkErc20.address], // _uniswapPath
        [USDhash, paymentNetworkErc20.address], // _chainlinkPath
        referenceExample,
        fiatDecimal.mul(1),
        builder,
        exchangeRateOrigin + 1000, // _uniswapDeadline. 100 -> 1000: Too low value may lead to error (network dependent)
        0, // _chainlinkMaxRateTimespan
      ),
    )
      .to.emit(erc20ConversionProxy, 'TransferWithConversionAndReference')
      .withArgs(
        fiatDecimal.mul(10).toString(),
        ethers.utils.getAddress(USDhash),
        ethers.utils.keccak256(referenceExample),
        fiatDecimal.mul(1).toString(),
        '0',
      )
      .to.emit(erc20ConversionProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        ethers.utils.getAddress(paymentNetworkErc20.address),
        ethers.utils.getAddress(to),
        erc20Decimal.mul(10).mul(3).toString(),
        ethers.utils.keccak256(referenceExample),
        erc20Decimal.mul(1).mul(3).toString(),
        ethers.utils.getAddress(builder),
      );

    const requestSwapFeesAmountInPaymentNetworkErc20 = erc20Decimal
      // Request amount to pay (10 + 1 (fee) USD)
      .mul(11)
      // USD to expected token ( * 3)
      .mul(3)
      // Compute the swap fees ( 0.5 %) - in expected token
      .mul(requestSwapFees)
      .div(1000);

    // Compute the swap fees ( * 2) - in payent token
    const requestSwapFeesAmountInSpentToken = requestSwapFeesAmountInPaymentNetworkErc20.mul(2);

    const finalBuilderBalance = await paymentNetworkErc20.balanceOf(builder);
    const finalIssuerBalance = await paymentNetworkErc20.balanceOf(to);
    const finalPayerBalance = await spentErc20.balanceOf(from);

    // 66 = (10 + 1) (USD) * 3 (ExpectedToken) * 2 (SpentToken)
    expect(
      initialFromBalance.sub(finalPayerBalance).toString(),
      'payer balance is wrong',
    ).to.equals(erc20Decimal.mul(66).add(requestSwapFeesAmountInSpentToken).toString());
    expect(finalBuilderBalance.toString(), 'builder balance is wrong').to.equals(
      erc20Decimal.mul(3).add(requestSwapFeesAmountInPaymentNetworkErc20).toString(),
    );
    expect(finalIssuerBalance.toString(), 'issuer balance is wrong').to.equals(
      erc20Decimal.mul(30).toString(),
    );
  });

  it('does not pay anyone if I swap 0', async function () {
    await expect(
      swapConversionProxy.swapTransferWithReference(
        erc20ConversionProxy.address,
        to,
        0,
        0,
        [spentErc20.address, paymentNetworkErc20.address], // _uniswapPath
        [USDhash, paymentNetworkErc20.address], // _chainlinkPath
        referenceExample,
        0,
        builder,
        exchangeRateOrigin + 1000, // _uniswapDeadline. 100 -> 1000: Too low value may lead to error (network dependent)
        0, // _chainlinkMaxRateTimespan
      ),
    )
      .to.emit(erc20ConversionProxy, 'TransferWithConversionAndReference')
      .withArgs(
        '0',
        ethers.utils.getAddress(USDhash),
        ethers.utils.keccak256(referenceExample),
        '0',
        '0',
      )
      .to.emit(erc20ConversionProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        ethers.utils.getAddress(paymentNetworkErc20.address),
        ethers.utils.getAddress(to),
        '0',
        ethers.utils.keccak256(referenceExample),
        '0',
        builder,
      );

    const finalBuilderBalance = await paymentNetworkErc20.balanceOf(builder);
    const finalIssuerBalance = await paymentNetworkErc20.balanceOf(to);
    expect(finalBuilderBalance.toNumber()).to.equals(0);
    expect(finalIssuerBalance.toNumber()).to.equals(0);
  });

  it('cannot swap with a too low maximum spent', async function () {
    await expect(
      swapConversionProxy.swapTransferWithReference(
        erc20ConversionProxy.address,
        to,
        fiatDecimal.mul(10),
        erc20Decimal.mul(50), // Too low
        [spentErc20.address, paymentNetworkErc20.address], // _uniswapPath
        [USDhash, paymentNetworkErc20.address], // _chainlinkPath
        referenceExample,
        fiatDecimal.mul(1),
        builder,
        exchangeRateOrigin + 1000, // _uniswapDeadline. 100 -> 1000: Too low value may lead to error (network dependent)
        0, // _chainlinkMaxRateTimespan
      ),
    ).to.be.revertedWith('UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
    await expectPayerBalanceUnchanged();
  });

  it('cannot swap with a past deadline', async function () {
    await expect(
      swapConversionProxy.swapTransferWithReference(
        erc20ConversionProxy.address,
        to,
        fiatDecimal.mul(10),
        erc20Decimal.mul(50),
        [spentErc20.address, paymentNetworkErc20.address], // _uniswapPath
        [USDhash, paymentNetworkErc20.address], // _chainlinkPath
        referenceExample,
        fiatDecimal.mul(1),
        builder,
        exchangeRateOrigin - 15, // past _uniswapDeadline
        0, // _chainlinkMaxRateTimespan
      ),
    ).to.be.revertedWith('UniswapV2Router: EXPIRED');
    await expectPayerBalanceUnchanged();
  });

  it('cannot swap more tokens than liquidity', async function () {
    const tooHighAmount = 100;

    expect(erc20Liquidity.lt(initialFromBalance), 'Test irrelevant with low balance').to.be.true;
    expect(
      erc20Liquidity.lt(erc20Decimal.mul(tooHighAmount).mul(3)),
      'Test irrelevant with low amount',
    ).to.be.true;
    await expect(
      swapConversionProxy.swapTransferWithReference(
        erc20ConversionProxy.address,
        to,
        fiatDecimal.mul(tooHighAmount),
        initialFromBalance,
        [spentErc20.address, paymentNetworkErc20.address], // _uniswapPath
        [USDhash, paymentNetworkErc20.address], // _chainlinkPath
        referenceExample,
        fiatDecimal.mul(1),
        builder,
        exchangeRateOrigin + 1000, // _uniswapDeadline. 100 -> 1000: Too low value may lead to error (network dependent)
        0, // _chainlinkMaxRateTimespan
      ),
    ).to.be.revertedWith('UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
    await expectPayerBalanceUnchanged();
  });

  it('cannot swap more tokens than allowance', async function () {
    await spentErc20.approve(swapConversionProxy.address, erc20Decimal.mul(60));

    await expect(
      swapConversionProxy.swapTransferWithReference(
        erc20ConversionProxy.address,
        to,
        fiatDecimal.mul(10),
        erc20Decimal.mul(66),
        [spentErc20.address, paymentNetworkErc20.address], // _uniswapPath
        [USDhash, paymentNetworkErc20.address], // _chainlinkPath
        referenceExample,
        fiatDecimal.mul(1),
        builder,
        exchangeRateOrigin + 100, // _unisapDeadline
        0, // _chainlinkMaxRateTimespan
      ),
    ).to.be.revertedWith('Could not transfer payment token from swapper-payer');
    await expectPayerBalanceUnchanged();
  });

  it('Should not swap with a bad proxy address', async function () {
    // Simulate request payment for 10 (fiat) + 1 (fiat) fee, in paymentNetworkErc20
    await expect(
      swapConversionProxy.swapTransferWithReference(
        chainlinkConversion.address, // random address that is not a conversion proxy
        to,
        fiatDecimal.mul(10),
        erc20Decimal.mul(70),
        [spentErc20.address, paymentNetworkErc20.address], // _uniswapPath
        [USDhash, paymentNetworkErc20.address], // _chainlinkPath
        referenceExample,
        fiatDecimal.mul(1),
        builder,
        exchangeRateOrigin + 1000, // _uniswapDeadline. 100 -> 1000: Too low value may lead to error (network dependent)
        0, // _chainlinkMaxRateTimespan
      ),
    ).to.be.revertedWith('Invalid payment proxy');
  });
});
