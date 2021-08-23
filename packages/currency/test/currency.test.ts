/* eslint-disable no-magic-numbers */
import { RequestLogicTypes } from '@requestnetwork/types';
import { Currency, getAllSupportedCurrencies } from '../src';

describe('api/currency', () => {
  describe('getAllSupportedCurrencies', () => {
    it('returns ETH', () => {
      expect(getAllSupportedCurrencies().ETH[0]).toMatchObject({
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      });
    });

    it('returns BTC', () => {
      expect(getAllSupportedCurrencies().BTC[0]).toEqual({
        decimals: 8,
        name: 'Bitcoin',
        network: 'mainnet',
        symbol: 'BTC',
      });
    });

    it('returns SAI', () => {
      expect(getAllSupportedCurrencies().ERC20.find(({ symbol }) => symbol === 'SAI')).toEqual({
        address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
        decimals: 18,
        name: 'Sai Stablecoin v1.0',
        symbol: 'SAI',
        network: 'mainnet',
      });
    });

    it('returns Celo cUSD', () => {
      expect(getAllSupportedCurrencies().ERC20.find(({ symbol }) => symbol === 'cUSD')).toEqual({
        address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        decimals: 18,
        name: 'Celo Dollar',
        symbol: 'cUSD',
        network: 'celo',
      });
    });

    it('returns INDA', () => {
      expect(getAllSupportedCurrencies().ERC20.find(({ symbol }) => symbol === 'INDA')).toEqual({
        address: '0x433d86336dB759855A66cCAbe4338313a8A7fc77',
        decimals: 2,
        name: 'Indacoin',
        symbol: 'INDA',
        network: 'mainnet',
      });
    });

    it('returns CTBK', () => {
      expect(getAllSupportedCurrencies().ERC20.find(({ symbol }) => symbol === 'CTBK')).toEqual({
        address: '0x995d6A8C21F24be1Dd04E105DD0d83758343E258',
        decimals: 18,
        name: 'Central Bank Token',
        symbol: 'CTBK',
        network: 'rinkeby',
      });
    });

    it('returns EUR', () => {
      expect(getAllSupportedCurrencies().ISO4217.find(({ symbol }) => symbol === 'EUR')).toEqual({
        decimals: 2,
        name: 'Euro',
        symbol: 'EUR',
      });
    });
  });

  describe('Currency.getDecimals()', () => {
    it('returns the correct number of decimals', () => {
      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        }).getDecimals(),
      ).toEqual(18);
    });

    it('throws for invalid currencies', () => {
      expect(() =>
        new Currency({
          type: 'BANANA' as RequestLogicTypes.CURRENCY,
          value: 'SPLIT',
        } as RequestLogicTypes.ICurrency).getDecimals(),
      ).toThrow();
    });

    it('returns the correct number of decimals for a supported ERC20', () => {
      expect(
        new Currency({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI
        }).getDecimals(),
      ).toEqual(18);
    });

    it('throws for a non-supported ERC20', () => {
      expect(() =>
        new Currency({
          network: 'private',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x9FBDa871d559710256a2502A2517b794B482Db40', // local ERC20 contract
        }).getDecimals(),
      ).toThrow();
    });

    it('returns the correct number of decimals for a a celo ERC20', () => {
      expect(
        new Currency({
          network: 'celo',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x765DE816845861e75A25fCA122bb6898B8B1282a', // Celo Dollar
        }).getDecimals(),
      ).toEqual(18);
    });

    it('return the correct currency for USD and EUR strings', () => {
      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'USD',
        }).getDecimals(),
      ).toEqual(2);

      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'EUR',
        }).getDecimals(),
      ).toEqual(2);
    });

    it('throws for unknown ISO4217 currency', () => {
      expect(() =>
        new Currency({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'YOYO',
        }).getDecimals(),
      ).toThrow(`Unsupported ISO currency YOYO`);
    });

    it('returns the correct number of decimals for BTC & testnet BTC', () => {
      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        }).getDecimals(),
      ).toEqual(8);

      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
          network: 'testnet',
        }).getDecimals(),
      ).toEqual(8);
    });

    it('returns the correct number of decimals for ETH & rinkeby ETH', () => {
      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        }).getDecimals(),
      ).toEqual(18);

      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
          network: 'rinkeby',
        }).getDecimals(),
      ).toEqual(18);
    });

    it('returns the correct number of decimals for native tokens', () => {
      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'MATIC',
          network: 'matic',
        }).getDecimals(),
      ).toEqual(18);

      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'xDAI',
          network: 'xdai',
        }).getDecimals(),
      ).toEqual(18);
    });

    it('throws for invalid native tokens', () => {
      const currency = new Currency({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'DOGE',
      });
      expect(() => currency.getDecimals()).toThrowError('Currency ETH - DOGE not implemented');
    });
  });

  describe('Currency.getSymbol()', () => {
    describe('Native', () => {
      it('ETH', () => {
        expect(
          new Currency({
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'ETH',
          }).getSymbol(),
        ).toEqual('ETH');
      });

      it('ETH with wrong value', () => {
        expect(
          new Currency({
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'not ETH',
          }).getSymbol(),
        ).toEqual('ETH');
      });

      it('Other EVM networks', () => {
        expect(
          new Currency({
            type: RequestLogicTypes.CURRENCY.ETH,
            network: 'matic',
            value: 'anything',
          }).getSymbol(),
        ).toEqual('MATIC');

        expect(
          new Currency({
            type: RequestLogicTypes.CURRENCY.ETH,
            network: 'rinkeby',
            value: 'anything',
          }).getSymbol(),
        ).toEqual('ETH-rinkeby');
      });

      it('BTC', () => {
        expect(
          new Currency({
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
          }).getSymbol(),
        ).toEqual('BTC');
      });

      it('BTC testnet', () => {
        expect(
          new Currency({
            type: RequestLogicTypes.CURRENCY.BTC,
            value: 'BTC',
            network: 'testnet',
          }).getSymbol(),
        ).toEqual('BTC-testnet');
      });
    });
    describe('ERC20', () => {
      it('DAI', () => {
        expect(
          new Currency({
            type: RequestLogicTypes.CURRENCY.ERC20,
            value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            network: 'mainnet',
          }).getSymbol(),
        ).toEqual('DAI');
      });
      it('DAI matic', () => {
        expect(
          new Currency({
            type: RequestLogicTypes.CURRENCY.ERC20,
            value: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
            network: 'matic',
          }).getSymbol(),
        ).toEqual('DAI');
      });
      it('FAU rinkeby', () => {
        expect(
          new Currency({
            type: RequestLogicTypes.CURRENCY.ERC20,
            value: '0xFab46E002BbF0b4509813474841E0716E6730136',
            network: 'rinkeby',
          }).getSymbol(),
        ).toEqual('FAU');
      });
    });
  });

  describe('Currency.fromSymbol()', () => {
    it('return the correct currency for ETH string', () => {
      expect(Currency.fromSymbol('ETH')).toMatchObject({
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
        network: 'mainnet',
      });
    });

    it('return the correct currency for BTC string', () => {
      expect(Currency.fromSymbol('BTC')).toMatchObject({
        type: RequestLogicTypes.CURRENCY.BTC,
        value: 'BTC',
        network: 'mainnet',
      });
    });

    it('return the correct currency for SAI string', () => {
      expect(Currency.fromSymbol('SAI')).toEqual({
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
      });
    });

    it('return the correct currency for REQ string', () => {
      expect(Currency.fromSymbol('REQ')).toEqual({
        network: 'mainnet',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
      });
    });

    it('return the correct currency for cUSD-celo string', () => {
      expect(Currency.fromSymbol('cUSD')).toEqual({
        network: 'celo',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      });
    });

    it('return the correct currency for CUSD-celo string (with alternative casing)', () => {
      expect(Currency.fromSymbol('CUSD', 'celo')).toEqual({
        network: 'celo',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      });
    });

    it('return the correct currency for cGLD-celo string', () => {
      expect(Currency.fromSymbol('cGLD')).toEqual({
        network: 'celo',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      });
    });

    it('return the correct currency for CELO-celo string', () => {
      expect(Currency.fromSymbol('CELO')).toEqual({
        network: 'celo',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'CELO',
      });
    });

    it('return the correct currency for CTBK-rinkeby string', () => {
      expect(Currency.fromSymbol('CTBK')).toEqual({
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x995d6A8C21F24be1Dd04E105DD0d83758343E258',
      });
    });
    it('return the correct currency for DAI-matic string', () => {
      expect(Currency.fromSymbol('DAI', 'matic')).toEqual({
        network: 'matic',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      });
    });
    it('return the correct currency for NEAR', () => {
      expect(Currency.fromSymbol('NEAR')).toEqual({
        network: 'aurora',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'NEAR',
      });
    });
    it('return the correct currency for NEAR-testnet', () => {
      expect(Currency.fromSymbol('NEAR-testnet')).toEqual({
        network: 'aurora-testnet',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'NEAR-testnet',
      });
    });

    it('return the correct currency for USD and EUR strings', () => {
      expect(Currency.fromSymbol('USD')).toEqual({
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'USD',
      });

      expect(Currency.fromSymbol('EUR')).toEqual({
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'EUR',
      });
    });

    describe('errors and edge cases', () => {
      it('throws for SAI not on mainnet', () => {
        expect(() => Currency.fromSymbol('SAI-rinkeby')).toThrow();
      });

      it('throws for an unsupported currency', () => {
        expect(() => Currency.fromSymbol('XXXXXXX')).toThrow();
      });

      it('supports a token that exists on two chains', () => {
        expect(Currency.fromSymbol('DAI')).toEqual({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        });
        expect(Currency.fromSymbol('DAI', 'mainnet')).toEqual({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        });
        expect(Currency.fromSymbol('DAI', 'matic')).toEqual({
          network: 'matic',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        });
      });

      it('throws for empty symbol', () => {
        expect(() => Currency.fromSymbol('')).toThrow(`Cannot guess currency from empty symbol.`);
      });

      it('Unsupported network should throw', () => {
        expect(() => Currency.fromSymbol('ETH', 'UNSUPPORTED')).toThrow(
          "The currency symbol 'ETH' on UNSUPPORTED is unknown or not supported",
        );
      });
    });
  });

  describe('Currency.toString()', () => {
    it('return "ETH" string for ETH currency', () => {
      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
          network: 'mainnet',
        }).toString(),
      ).toEqual('ETH');
    });

    it('return "ETH-rinkeby" string for ETH on rinkeby currency', () => {
      expect(
        new Currency({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH-rinkeby',
        }).toString(),
      ).toEqual('ETH-rinkeby');
    });

    it('return "MATIC" string for MATIC currency', () => {
      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'MATIC',
          network: 'matic',
        }).toString(),
      ).toEqual('MATIC-matic');
    });

    it('return "FTM" string for FTM currency', () => {
      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'FTM',
          network: 'fantom',
        }).toString(),
      ).toEqual('FTM-fantom');
    });

    it('return "BTC" string for BTC currency', () => {
      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
          network: 'mainnet',
        }).toString(),
      ).toEqual('BTC');
    });

    it('return "BTC-testnet" string for BTC currency on testnet', () => {
      expect(
        new Currency({
          network: 'testnet',
          type: RequestLogicTypes.CURRENCY.BTC,
          value: 'BTC',
        }).toString(),
      ).toEqual('BTC-testnet');
    });

    it('return the "SAI" string for SAI currency', () => {
      expect(
        new Currency({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
        }).toString(),
      ).toEqual('SAI');
    });

    it('return the "REQ" string for REQ currency', () => {
      expect(
        new Currency({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
        }).toString(),
      ).toEqual('REQ');
    });

    it('return the "CUSD-celo" string for Celo CUSD currency', () => {
      expect(
        new Currency({
          network: 'celo',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        }).toString(),
      ).toEqual('cUSD-celo');
    });

    it('return the "CTBK-rinkeby" string for CTBK currency', () => {
      expect(
        new Currency({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x995d6A8C21F24be1Dd04E105DD0d83758343E258',
        }).toString(),
      ).toEqual('CTBK-rinkeby');
    });

    it('return the correct strings for USD and EUR currency', () => {
      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'USD',
        }).toString(),
      ).toEqual('USD');

      expect(
        new Currency({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'EUR',
        }).toString(),
      ).toEqual('EUR');
    });

    it('return unknown for REQ not on mainnet', () => {
      expect(
        new Currency({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
        }).toString(),
      ).toEqual('unknown');
    });

    it('return unknown unsupported currency', () => {
      expect(
        new Currency({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x1111111111111111111111111111111111111111',
        }).toString(),
      ).toEqual('unknown');
    });

    it('return unknown for Celo CUSD on mainnet', () => {
      expect(
        new Currency({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        }).toString(),
      ).toEqual('unknown');
    });

    it('return default if type unkown', () => {
      expect(
        new Currency({
          type: 'unknown' as RequestLogicTypes.CURRENCY,
          value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        }).toString(),
      ).toEqual('unknown');
    });
  });

  describe('getCurrencyHash', () => {
    const ethDefault = new Currency({
      type: RequestLogicTypes.CURRENCY.ETH,
      value: 'eth',
    });
    const ethMainnet = new Currency({
      type: RequestLogicTypes.CURRENCY.ETH,
      value: 'eth',
      network: 'mainnet',
    });
    const ethRinkeby = new Currency({
      type: RequestLogicTypes.CURRENCY.ETH,
      value: 'eth',
      network: 'rinkeby',
    });

    const btcDefault = new Currency({
      type: RequestLogicTypes.CURRENCY.BTC,
      value: 'btc',
    });
    const btcMainnet = new Currency({
      type: RequestLogicTypes.CURRENCY.BTC,
      value: 'btc',
      network: 'mainnet',
    });
    const btcRinkeby = new Currency({
      type: RequestLogicTypes.CURRENCY.BTC,
      value: 'btc',
      network: 'testnet',
    });

    const DAI = new Currency({
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35',
    });

    describe('ETH currency hash', () => {
      it('can get currency hash of eth', () => {
        const ethAddressHash = '0xf5af88e117747e87fc5929f2ff87221b1447652e';

        expect(ethDefault.getHash()).toBe(ethAddressHash);
        expect(ethMainnet.getHash()).toBe(ethAddressHash);
        expect(ethRinkeby.getHash()).toBe(ethAddressHash);
      });
    });

    describe('BTC currency hash', () => {
      it('can get currency hash of BTC', () => {
        const btcAddressHash = '0x03049758a18d1589388d7a74fb71c3fcce11d286';

        expect(btcDefault.getHash()).toBe(btcAddressHash);
        expect(btcMainnet.getHash()).toBe(btcAddressHash);
        expect(btcRinkeby.getHash()).toBe(btcAddressHash);
      });
    });

    describe('FIAT currency hash', () => {
      it('can get currency hash of USD', () => {
        expect(Currency.fromSymbol('USD').getHash()).toBe(
          '0x775eb53d00dd0acd3ec1696472105d579b9b386b',
        );
      });
      it('can get currency hash of EUR', () => {
        expect(Currency.fromSymbol('EUR').getHash()).toBe(
          '0x17b4158805772ced11225e77339f90beb5aae968',
        );
      });
      it('can get currency hash of SGD', () => {
        expect(Currency.fromSymbol('SGD').getHash()).toBe(
          '0xce80759e72fe1d3c07be79ffecc76a7a9b46c641',
        );
      });
      it('can get currency hash of CHF', () => {
        expect(Currency.fromSymbol('CHF').getHash()).toBe(
          '0xfac26e3fd40adcdc6652f705d983b4830c00716c',
        );
      });
      it('can get currency hash of GBP', () => {
        expect(Currency.fromSymbol('GBP').getHash()).toBe(
          '0x013f29832cd6525c4c6df81c2aae8032a1ff2db2',
        );
      });
    });

    describe('ERC20 currency hash', () => {
      it('can get currency hash of ERC20', () => {
        expect(DAI.getHash()).toBe('0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35');
      });
    });
  });

  describe('Currency.from()', () => {
    describe('mainnet', () => {
      it('ETH from ETH', () => {
        expect(Currency.from('ETH')).toMatchObject({
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        });
      });

      it('DAI from DAI', () => {
        expect(Currency.from('DAI')).toMatchObject({
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          network: 'mainnet',
        });
        expect(Currency.from('DAI').toString()).toEqual('DAI');
      });

      it('REQ from REQ', () => {
        expect(Currency.from('REQ')).toMatchObject({
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
          network: 'mainnet',
        });
      });

      it('MPH from MPH', () => {
        expect(Currency.from('MPH')).toMatchObject({
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8888801aF4d980682e47f1A9036e589479e835C5',
          network: 'mainnet',
        });
      });

      it('INDA from INDA', () => {
        expect(Currency.from('INDA')).toMatchObject({
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x433d86336dB759855A66cCAbe4338313a8A7fc77',
          network: 'mainnet',
        });
      });

      it('DAI from 0x6B175474E89094C44Da98b954EedeAC495271d0F', () => {
        expect(Currency.from('0x6B175474E89094C44Da98b954EedeAC495271d0F')).toMatchObject({
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          network: 'mainnet',
        });
      });

      it('fetches extra-currency from address (INDA)', () => {
        expect(Currency.from('0x433d86336db759855a66ccabe4338313a8a7fc77')).toMatchObject({
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x433d86336dB759855A66cCAbe4338313a8A7fc77',
          network: 'mainnet',
        });
      });

      it('EUR from EUR', () => {
        expect(Currency.from('EUR')).toMatchObject({
          type: RequestLogicTypes.CURRENCY.ISO4217,
          value: 'EUR',
        });
      });
    });

    describe('rinkeby', () => {
      it('FAU from FAU', () => {
        expect(Currency.from('FAU')).toMatchObject({
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0xFab46E002BbF0b4509813474841E0716E6730136',
          network: 'rinkeby',
        });
        expect(Currency.from('FAU').toString()).toEqual('FAU-rinkeby');
      });

      it('FAU from FAU-rinkeby', () => {
        expect(Currency.from('FAU-rinkeby')).toMatchObject({
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0xFab46E002BbF0b4509813474841E0716E6730136',
          network: 'rinkeby',
        });
      });

      it('CTBK from CTBK', () => {
        expect(Currency.from('CTBK')).toMatchObject({
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x995d6A8C21F24be1Dd04E105DD0d83758343E258',
          network: 'rinkeby',
        });
      });

      it('CTBK from CTBK-rinkeby', () => {
        expect(Currency.from('CTBK-rinkeby')).toEqual({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x995d6A8C21F24be1Dd04E105DD0d83758343E258',
        });
      });
    });

    describe('Celo', () => {
      it('return the correct currency for cUSD-celo string', () => {
        expect(Currency.from('cUSD-celo')).toEqual({
          network: 'celo',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        });
      });

      it('return the correct currency for CUSD-celo string (with alternative casing)', () => {
        expect(Currency.from('CUSD-celo')).toEqual({
          network: 'celo',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        });
      });

      it('return the correct currency for cGLD-celo string', () => {
        expect(Currency.from('cGLD-celo')).toEqual({
          network: 'celo',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x471EcE3750Da237f93B8E339c536989b8978a438',
        });
      });

      it('return the correct currency for CELO-celo string', () => {
        expect(Currency.from('CELO-celo')).toEqual({
          network: 'celo',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'CELO',
        });
      });
      it('return the correct currency for DAI-matic string', () => {
        expect(Currency.from('DAI-matic')).toEqual({
          network: 'matic',
          type: RequestLogicTypes.CURRENCY.ERC20,
          value: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        });
      });
    });

    describe('native tokens', () => {
      describe('Bitcoin', () => {
        it('BTC', () => {
          expect(Currency.from('BTC')).toEqual({
            network: 'mainnet',
            type: 'BTC',
            value: 'BTC',
          });
        });
        it('BTC-mainnet', () => {
          expect(Currency.from('BTC-mainnet')).toEqual({
            network: 'mainnet',
            type: 'BTC',
            value: 'BTC',
          });
        });
        it('BTC-testnet', () => {
          expect(Currency.from('BTC-testnet')).toEqual({
            network: 'testnet',
            type: 'BTC',
            value: 'BTC-testnet',
          });
        });
      });
      describe('ETH', () => {
        it('ETH', () => {
          expect(Currency.from('ETH')).toEqual({
            network: 'mainnet',
            type: 'ETH',
            value: 'ETH',
          });
        });
        it('ETH-mainnet', () => {
          expect(Currency.from('ETH-mainnet')).toEqual({
            network: 'mainnet',
            type: 'ETH',
            value: 'ETH',
          });
        });
        it('ETH-rinkeby', () => {
          expect(Currency.from('ETH-rinkeby')).toEqual({
            network: 'rinkeby',
            type: 'ETH',
            value: 'ETH-rinkeby',
          });
        });
      });
      describe('EVM-compatible', () => {
        it('MATIC', () => {
          expect(Currency.from('MATIC')).toEqual({
            network: 'matic',
            type: 'ETH',
            value: 'MATIC',
          });
        });
        it('MATIC-matic', () => {
          expect(Currency.from('MATIC-matic')).toEqual({
            network: 'matic',
            type: 'ETH',
            value: 'MATIC',
          });
        });
        it('CELO', () => {
          expect(Currency.from('CELO')).toEqual({
            network: 'celo',
            type: 'ETH',
            value: 'CELO',
          });
        });
        it('FUSE', () => {
          expect(Currency.from('FUSE')).toEqual({
            network: 'fuse',
            type: 'ETH',
            value: 'FUSE',
          });
        });
        it('xDAI', () => {
          expect(Currency.from('xDAI')).toEqual({
            network: 'xdai',
            type: 'ETH',
            value: 'xDAI',
          });
        });
        it('FTM', () => {
          expect(Currency.from('FTM')).toEqual({
            network: 'fantom',
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'FTM',
          });
        });
        it('NEAR', () => {
          expect(Currency.from('NEAR')).toEqual({
            network: 'aurora',
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'NEAR',
          });
        });
        it('NEAR-testnet', () => {
          expect(Currency.from('NEAR-testnet')).toEqual({
            network: 'aurora-testnet',
            type: RequestLogicTypes.CURRENCY.ETH,
            value: 'NEAR-testnet',
          });
        });
      });
    });

    describe('errors and edge cases', () => {
      it('does not persist state between calls', () => {
        expect(Currency.from('ETH')).toEqual({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        });
        expect(Currency.from('ETH-rinkeby')).toEqual({
          network: 'rinkeby',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH-rinkeby',
        });
        expect(Currency.from('ETH')).toEqual({
          network: 'mainnet',
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        });
      });

      it('throws for empty string', () => {
        expect(() => Currency.from('')).toThrow(`Cannot guess currency from empty string.`);
      });

      it('Unsupported currencies should throw', () => {
        expect(() => Currency.from('UNSUPPORTED')).toThrow(
          "The currency symbol 'UNSUPPORTED' is unknown or not supported",
        );
      });
    });
  });
});
