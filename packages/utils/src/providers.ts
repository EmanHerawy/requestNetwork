import { providers, constants } from 'ethers';

type ProviderFactory = (network: string | undefined) => providers.Provider | string;

let warned = false;
/**
 * @param network the network to connect to
 * @param defaultFactory the defaultFactory to use as fallback if needed
 */
type CurrentProviderFactory = (
  network: string | undefined,
  defaultFactory: ProviderFactory,
) => providers.Provider | string;

/**
 * Default API_KEYS configuration, can be overriden using initPaymentDetectionApiKeys
 */
let providersApiKeys: Record<string, string | (() => string)> = {
  // fallback to Ethers v4 default projectId
  infura: () => process.env.RN_INFURA_KEY || '7d0d81d0919f4f05b9ab6634be01ee73',
};

/**
 * @param defaultProviderOptions Default Provider Options as specified in https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider  */
const initPaymentDetectionApiKeys = (defaultProviderOptions?: typeof providersApiKeys): void => {
  providersApiKeys = { ...providersApiKeys, ...defaultProviderOptions };
};

/**
 * Define default URLs for networks supported by Request payment detection but not by ethers' Infura Provider
 */
const networkRpcs: Record<string, string> = {
  private: providers.JsonRpcProvider.defaultUrl(),
  matic: 'https://polygon-rpc.com/',
  fantom: 'https://rpc.ftm.tools',
  fuse: 'https://rpc.fuse.io',
  bsctest: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  bsc: 'https://bsc-dataseed1.binance.org/',
  xdai: 'https://gnosischain-rpc.gateway.pokt.network/',
  celo: 'https://forno.celo.org',
  'arbitrum-rinkeby': 'https://rinkeby.arbitrum.io/rpc',
  'arbitrum-one': 'https://arb1.arbitrum.io/rpc',
  avalanche: 'https://api.avax.network/ext/bc/C/rpc',
  optimism: 'https://mainnet.optimism.io',
  moonbeam: 'https://moonbeam.public.blastapi.io',
};

/**
 * @see getDefaultProvider
 */
const defaultProviderFactory: ProviderFactory = (network: string | undefined) => {
  if (!network) {
    network = 'homestead';
  }

  // Returns environment variable override
  const envVar = process?.env ? process.env[`RN_WEB3_RPC_URL_${network.toUpperCase()}`] : null;
  if (envVar) {
    return envVar;
  }

  // check default RPCs
  if (networkRpcs[network]) {
    return networkRpcs[network];
  }

  // use infura, if supported
  try {
    // try getting the URL for the given network. Will throw if not supported.
    providers.InfuraProvider.getUrl(providers.getNetwork(network), {});
    const apiKey =
      typeof providersApiKeys.infura === 'function'
        ? providersApiKeys.infura()
        : providersApiKeys.infura;

    if (!apiKey && !warned) {
      console.warn(`No API Key specified for Infura, using ethers default API key.
      This is not recommended for Production environments.
      To override Infura's default api key, use RN_INFURA_KEY environment variable, or call
      initPaymentDetectionApiKeys({ infura: () => "myApiKey" });
      `);
      warned = true;
    }
    return new providers.InfuraProvider(network, apiKey);
  } catch (e) {
    // suppress errors
  }

  if (!warned) {
    console.warn(
      `No provider is specified for network ${network}, using ethers default provider. 
      This is not recommended for Production environments.
      Use setProviderFactory to override the default provider`,
    );
    warned = true;
  }
  // use getDefaultProvider to keep the original behaviour
  return providers.getDefaultProvider(network, providersApiKeys);
};

/**
 * Defines the behaviour to obtain a Provider for a given Network.
 * May be overridden using setProviderFactory
 */
let currentProviderFactory: CurrentProviderFactory = defaultProviderFactory;

/**
 * Override the default providerFactory, which relies mainly on Infura.
 * @param providerFactory if not specify, will reset to the default factory
 */
const setProviderFactory = (providerFactory?: CurrentProviderFactory): void => {
  currentProviderFactory = providerFactory || defaultProviderFactory;
};

/**
 * Returns a Web3 Provider for the given `network`.
 *
 * Configuration options:
 * - Specify `RN_WEB3_RPC_URL_[NETWORK]` environment variable to override the default behaviour
 * - Specify `RN_INFURA_KEY` to override the default Infura API KEY (recommended)
 * - Use `initPaymentDetectionApiKeys` to override Infura API KEY when `RN_INFURA_KEY` is not usable
 * - Use `setProviderFactory` for more complex configurations with multiple networks
 *
 * @param network the blockchain network. See https://chainid.network/chains.json `network` field for reference
 */
const getDefaultProvider = (network?: string): providers.Provider => {
  const provider = currentProviderFactory(network, defaultProviderFactory);
  if (typeof provider === 'string') {
    return new providers.StaticJsonRpcProvider(provider);
  }
  return provider;
};

const getCeloProvider = (): providers.Provider => {
  const provider = new providers.JsonRpcProvider('https://forno.celo.org');
  const originalBlockFormatter = provider.formatter._block;
  provider.formatter._block = (value: any, format: any) => {
    return originalBlockFormatter(
      {
        gasLimit: constants.Zero,
        ...value,
      },
      format,
    );
  };
  return provider;
};

export default {
  setProviderFactory,
  initPaymentDetectionApiKeys,
  getDefaultProvider,
  getCeloProvider,
  networkRpcs,
};
