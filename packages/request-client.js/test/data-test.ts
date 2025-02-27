import MultiFormat from '@requestnetwork/multi-format';
import {
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
  SignatureProviderTypes,
  SignatureTypes,
  TransactionTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import AxiosMockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { Types } from '../src';

export const arbitraryTimestamp = 1549953337;

export const payee = {
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  signatureParams: {
    method: SignatureTypes.METHOD.ECDSA,
    privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  },
};

export const payer = {
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0xf17f52151ebef6c7334fad080c5704d77216b732',
  },
  signatureParams: {
    method: SignatureTypes.METHOD.ECDSA,
    privateKey: '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
  },
};

export const delegate = {
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE',
  },
};

export const parameters: RequestLogicTypes.ICreateParameters = {
  currency: {
    network: 'testnet',
    type: RequestLogicTypes.CURRENCY.BTC,
    value: 'BTC',
  },
  expectedAmount: '100000000000',
  extensionsData: [
    {
      action: 'create',
      id: 'pn-testnet-bitcoin-address-based',
      parameters: { paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v' },
      version: '0.1.0',
    },
  ],
  payee: payee.identity,
  payer: payer.identity,
  timestamp: arbitraryTimestamp,
};
export const parametersWithDeclarative: RequestLogicTypes.ICreateParameters = {
  currency: {
    network: 'testnet',
    type: RequestLogicTypes.CURRENCY.BTC,
    value: 'BTC',
  },
  expectedAmount: '100000000000',
  extensionsData: [
    {
      action: 'create',
      id: 'pn-any-declarative',
      parameters: {
        paymentInfo: {
          BIC: 'SABAIE2D',
          IBAN: 'FR89370400440532013000',
        },
      },
      version: '0.1.0',
    },
  ],
  payee: payee.identity,
  payer: payer.identity,
  timestamp: arbitraryTimestamp,
};
const parametersWithDeclarativeNoPaymentInfo: RequestLogicTypes.ICreateParameters = {
  ...parametersWithDeclarative,
  extensionsData: [
    {
      action: 'create',
      id: 'pn-any-declarative',
      parameters: {},
      version: '0.1.0',
    },
  ],
};

export const parametersWithoutExtensionsData: RequestLogicTypes.ICreateParameters = {
  currency: {
    network: 'testnet',
    type: RequestLogicTypes.CURRENCY.BTC,
    value: 'BTC',
  },
  expectedAmount: '100000000000',
  payee: payee.identity,
  payer: payer.identity,
  timestamp: arbitraryTimestamp,
};
export const parametersUSDWithoutExtensionsData: RequestLogicTypes.ICreateParameters = {
  currency: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'USD',
  },
  // 345.67 USD
  expectedAmount: '34567',
  payee: payee.identity,
  payer: payer.identity,
  timestamp: arbitraryTimestamp,
};
export const parametersWithoutExtensionsDataForSigning: RequestLogicTypes.ICreateParameters = {
  currency: {
    network: 'testnet',
    type: RequestLogicTypes.CURRENCY.BTC,
    value: 'BTC',
  },
  expectedAmount: '100000000000',
  extensionsData: [],
  payee: payee.identity,
  payer: payer.identity,
  timestamp: arbitraryTimestamp,
};

export const data = {
  name: RequestLogicTypes.ACTION_NAME.CREATE,
  parameters,
  version: '2.0.3',
};
const dataWithoutExtensionsData = {
  name: RequestLogicTypes.ACTION_NAME.CREATE,
  parameters: parametersWithoutExtensionsDataForSigning,
  version: '2.0.3',
};
const dataWithDeclarative = {
  name: RequestLogicTypes.ACTION_NAME.CREATE,
  parameters: parametersWithDeclarative,
  version: '2.0.3',
};
const dataWithDeclarativeNoPaymentInfo = {
  name: RequestLogicTypes.ACTION_NAME.CREATE,
  parameters: parametersWithDeclarativeNoPaymentInfo,
  version: '2.0.3',
};

export const action: RequestLogicTypes.IAction = Utils.signature.sign(
  dataWithDeclarative,
  payee.signatureParams,
);
const actionWithoutExtensionsData: RequestLogicTypes.IAction = Utils.signature.sign(
  dataWithoutExtensionsData,
  payee.signatureParams,
);
const actionWithoutPaymentInfo: RequestLogicTypes.IAction = Utils.signature.sign(
  dataWithDeclarativeNoPaymentInfo,
  payee.signatureParams,
);

export const timestampedTransaction: TransactionTypes.ITimestampedTransaction = {
  state: TransactionTypes.TransactionState.CONFIRMED,
  timestamp: arbitraryTimestamp,
  transaction: { data: JSON.stringify(action) },
};
export const timestampedTransactionWithoutExtensionsData: TransactionTypes.ITimestampedTransaction =
  {
    state: TransactionTypes.TransactionState.PENDING,
    timestamp: arbitraryTimestamp,
    transaction: { data: JSON.stringify(actionWithoutExtensionsData) },
  };
export const timestampedTransactionWithoutExtensionsDataConfirmed: TransactionTypes.ITimestampedTransaction =
  {
    state: TransactionTypes.TransactionState.CONFIRMED,
    timestamp: arbitraryTimestamp,
    transaction: { data: JSON.stringify(actionWithoutExtensionsData) },
  };
export const timestampedTransactionWithoutPaymentInfo: TransactionTypes.ITimestampedTransaction = {
  state: TransactionTypes.TransactionState.CONFIRMED,
  timestamp: arbitraryTimestamp,
  transaction: { data: JSON.stringify(actionWithoutPaymentInfo) },
};

export const actionRequestId = MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(action));

export const anotherCreationAction: RequestLogicTypes.IAction = Utils.signature.sign(
  data,
  payer.signatureParams,
);

export const anotherCreationTransactionConfirmed: TransactionTypes.ITimestampedTransaction = {
  state: TransactionTypes.TransactionState.PENDING,
  timestamp: arbitraryTimestamp,
  transaction: { data: JSON.stringify(anotherCreationAction) },
};

const dataSecondRequest = {
  name: RequestLogicTypes.ACTION_NAME.CREATE,
  parameters: {
    currency: {
      network: 'rinkeby',
      type: RequestLogicTypes.CURRENCY.ETH,
      value: 'ETH',
    },
    expectedAmount: '123400000000000000',
    extensionsData: [],
    payee: payee.identity,
    timestamp: 1544426030,
  },
  version: '2.0.3',
};

export const actionCreationSecondRequest: RequestLogicTypes.IAction = Utils.signature.sign(
  dataSecondRequest,
  payee.signatureParams,
);

export const timestampedTransactionSecondRequest: TransactionTypes.ITimestampedTransaction = {
  state: TransactionTypes.TransactionState.PENDING,
  timestamp: arbitraryTimestamp,
  transaction: { data: JSON.stringify(actionCreationSecondRequest) },
};

export const actionRequestIdSecondRequest = MultiFormat.serialize(
  Utils.crypto.normalizeKeccak256Hash(actionCreationSecondRequest),
);

export const declarativePaymentNetwork: PaymentTypes.PaymentNetworkCreateParameters = {
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {
    paymentInfo: {
      BIC: 'SABAIE2D',
      IBAN: 'FR89370400440532013000',
    },
  },
};
export const declarativePaymentNetworkNoPaymentInfo: PaymentTypes.PaymentNetworkCreateParameters = {
  id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  parameters: {},
};

export const signatureParametersPayee: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};
export const signatureParametersPayer: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.METHOD.ECDSA,
  privateKey: '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
};
export const signatureParametersDelegate: SignatureTypes.ISignatureParameters = {
  method: Types.Signature.METHOD.ECDSA,
  privateKey: '0x8d5366123cb560bb606379f90a0bfd4769eecc0557f1b362dcae9012b548b1e5',
};

export const fakeSignatureProvider: SignatureProviderTypes.ISignatureProvider = {
  sign: (data: any, signer: IdentityTypes.IIdentity): any => {
    if (signer.value === payee.identity.value) {
      return Utils.signature.sign(data, signatureParametersPayee);
    } else if (signer.value === payer.identity.value) {
      return Utils.signature.sign(data, signatureParametersPayer);
    } else {
      return Utils.signature.sign(data, signatureParametersDelegate);
    }
  },
  supportedIdentityTypes: [IdentityTypes.TYPE.ETHEREUM_ADDRESS],
  supportedMethods: [SignatureTypes.METHOD.ECDSA],
};

export const mockAxiosRequestNode = (): AxiosMockAdapter => {
  const mockAxios = new AxiosMockAdapter(axios);
  mockAxios.onPost('/persistTransaction').reply(200, { result: {} });
  mockAxios.onGet('/getTransactionsByChannelId').reply(200, {
    result: { transactions: [timestampedTransactionWithoutExtensionsData] },
  });
  mockAxios.onGet('/getConfirmedTransaction').reply(200, { result: {} });
  return mockAxios;
};
