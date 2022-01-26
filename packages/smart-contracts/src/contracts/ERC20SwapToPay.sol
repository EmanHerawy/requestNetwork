// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./legacy_openzeppelin/contracts/access/roles/WhitelistedRole.sol";
import "./lib/SafeERC20.sol";
import "./interfaces/ERC20FeeProxy.sol";

interface IUniswapV2Router02 {
  function swapTokensForExactTokens(
    uint amountOut,
    uint amountInMax,
    address[] calldata path,
    address to,
    uint deadline
  ) external returns (uint[] memory amounts);
}


/**
 * @title ERC20SwapToPay
 * @notice This contract swaps ERC20 tokens before paying a request thanks to a payment proxy
  */
contract ERC20SwapToPay is Context, Ownable, WhitelistedRole{
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  IUniswapV2Router02 public swapRouter;
  IERC20FeeProxy public paymentProxy;

  uint256 public immutable MAX_PERFORMANCE_FEE;
  uint256 public CURRENT_PERFORMANCE_FEE;
  address public PERFORMANCE_FEE_ADDRESS;

  error TransferFromFailed(IERC20 spentToken);
  error AllowanceToLow();
  error NotValidFeeAmount();

  modifier feeAmount(uint256 _newPerformanceFee) {
    if (
      _newPerformanceFee > MAX_PERFORMANCE_FEE || _newPerformanceFee == CURRENT_PERFORMANCE_FEE
    ) {
      revert NotValidFeeAmount();
    }
    _;
  }

  constructor(
    address _swapRouterAddress,
    address _paymentProxyAddress,
    //address _performanceFeeAddress,
    uint256 _currentPerformanceFee, // 50 = 0.5%
    uint256 _maxPerformanceFee // 1500 = 15%

  ){
    swapRouter = IUniswapV2Router02(_swapRouterAddress);
    paymentProxy = IERC20FeeProxy(_paymentProxyAddress);
    //PERFORMANCE_FEE_ADDRESS = _performanceFeeAddress;
    CURRENT_PERFORMANCE_FEE = _currentPerformanceFee.div(100);
    MAX_PERFORMANCE_FEE = _maxPerformanceFee.div(100); 
  }

  /**
  * @notice Authorizes the proxy to spend a new request currency (ERC20).
  * @param _erc20Address Address of an ERC20 used as a request currency
  */
  function approvePaymentProxyToSpend(address _erc20Address) public {
    IERC20 erc20 = IERC20(_erc20Address);
    uint256 max = 2**256 - 1;
    erc20.safeApprove(address(paymentProxy), max);
  }

  /**
  * @notice Authorizes the swap router to spend a new payment currency (ERC20).
  * @param _erc20Address Address of an ERC20 used for payment
  */
  function approveRouterToSpend(address _erc20Address) public {
    IERC20 erc20 = IERC20(_erc20Address);
    uint256 max = 2**256 - 1;
    erc20.safeApprove(address(swapRouter), max);
  }

  /**
  * @notice Performs a token swap between a payment currency and a request currency, and then
  *         calls a payment proxy to pay the request, including fees.
  * @param _to Transfer recipient = request issuer
  * @param _amount Amount to transfer in request currency
  * @param _amountInMax Maximum amount allowed to spend for currency swap, in payment currency.
            This amount should take into account the fees.
    @param _path, path of ERC20 tokens to swap from requestedToken to spentToken. The first
            address of the path should be the payment currency. The last element should be the
            request currency.
  * @param _paymentReference Reference of the payment related
  * @param _deadline Deadline for the swap to be valid
  */
  function swapTransferWithReference(
    address _to,
    uint256 _amount,      // requestedToken
    uint256 _amountInMax, // spentToken
    address[] calldata _path, // from requestedToken to spentToken
    bytes calldata _paymentReference,
    uint256 _deadline
  )
    external
  {
    IERC20 spentToken = IERC20(_path[0]);
    IERC20 requestedToken = IERC20(_path[_path.length-1]);

    uint256 _feeAmount = _calculatePerformanceFee(_amount);
    uint256 requestedTotalAmount = _amount + _feeAmount;

    if (spentToken.allowance(_msgSender(), address(this)) < _amountInMax) {
      revert AllowanceToLow();
    }

    if (!spentToken.safeTransferFrom(_msgSender(), address(this), _amountInMax)) {
      revert TransferFromFailed(spentToken);
    }

    // Allow the router to spend all this contract's spentToken
    if (spentToken.allowance(address(this), address(swapRouter)) < _amountInMax) {
      approveRouterToSpend(address(spentToken));
    }

    swapRouter.swapTokensForExactTokens(
      requestedTotalAmount,
      _amountInMax,
      _path,
      address(this),
      _deadline
    );

    // Allow the payment network to spend all this contract's requestedToken
    if (requestedToken.allowance(address(this),address(paymentProxy)) < requestedTotalAmount) {
      approvePaymentProxyToSpend(address(requestedToken));
    }

    // Pay the request and fees
    paymentProxy.transferFromWithReferenceAndFee(
      address(requestedToken),
      _to,
      _amount,
      _paymentReference,
      _feeAmount,
      PERFORMANCE_FEE_ADDRESS
    );

    // Give the change back to the payer, in both currencies (only spent token should remain)
    if (spentToken.balanceOf(address(this)) > 0) {
      spentToken.safeTransfer(_msgSender(), spentToken.balanceOf(address(this)));
    }

    if (requestedToken.balanceOf(address(this)) > 0) {
      requestedToken.safeTransfer(_msgSender(), requestedToken.balanceOf(address(this)));
    }
  }

  /**
   * Internal function to calculate the amount of fee to pay.
   * @param _amount The amount to calculate the fee of.
   */
  function _calculatePerformanceFee(uint256 _amount) internal view returns (uint256 _feeAmount) {
    _feeAmount = _amount.mul(CURRENT_PERFORMANCE_FEE).div(100);
  }

  /*
  * Admin functions to edit the router address or proxy address.
  */
  function setPaymentProxy(address _paymentProxyAddress) public onlyOwner {
    paymentProxy = IERC20FeeProxy(_paymentProxyAddress);
  }

  function setRouter(address _newSwapRouterAddress) public onlyOwner {
    swapRouter = IUniswapV2Router02(_newSwapRouterAddress);
  }

  /** 
   * Admin function to edit the performancefee address.
   * @param _newFeeAddress Address that receives the performance fees.
   */
  function setFeeAddress(address _newFeeAddress) public onlyWhitelisted {
    PERFORMANCE_FEE_ADDRESS = _newFeeAddress;
  }

  /** 
   * Admin function to edit the performancefee in %.
   * @param _newPerformanceFee  the value to set as new performance fee.
   * @dev performance fee is in %. Parameter value must be below MAX_PERFORMANCE_FEE, example: 1500 will be 15% performance fee. 50 will be 0.5% performance fee. 
   */
  function setPerformanceFee(uint256 _newPerformanceFee) 
    public
    onlyWhitelisted
    feeAmount(_newPerformanceFee)
  {
    CURRENT_PERFORMANCE_FEE = _newPerformanceFee;
  }

}
