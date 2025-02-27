import { ethConversionArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import {
  getSignerAndGasPrice,
  updateChainlinkConversionPath,
  updatePaymentFeeProxyAddress,
} from './adminTasks';

/**
 * Updates the values of the chainlinkConversionPath and EthFeeProxy addresses if needed
 * @param contractAddress address of the ETHConversion Proxy
 * @param hre Hardhat runtime environment
 */
export const setupETHConversionProxy = async (
  contractAddress: string,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  // Setup contract parameters
  const EthConversionProxyContract = new hre.ethers.Contract(
    contractAddress,
    ethConversionArtifact.getContractAbi(),
  );
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network) => {
      try {
        const { signer, gasPrice } = await getSignerAndGasPrice(network, hre);
        const EthConversionProxyConnected = EthConversionProxyContract.connect(signer);
        await updatePaymentFeeProxyAddress(
          EthConversionProxyConnected,
          network,
          gasPrice,
          'native',
        );
        await updateChainlinkConversionPath(EthConversionProxyConnected, network, gasPrice);
        console.log(`Setup of EthConversionProxy successful on ${network}`);
      } catch (err) {
        console.warn(`An error occurred during the setup of EthConversionProxy on ${network}`);
        console.warn(err);
      }
    }),
  );
};
