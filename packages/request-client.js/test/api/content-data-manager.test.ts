import { AdvancedLogicTypes } from '@requestnetwork/types';

import ContentDataExtension from '../../src/api/content-data-extension';

import * as TestData from './data-for-content-data-extension';
import { IAdvancedLogicExtensions } from '@requestnetwork/types/src/advanced-logic-types';

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions: jest.fn(),
  getNativeTokenExtensionForNetwork: jest.fn(),
  getAnyToNativeTokenExtensionForNetwork: jest.fn(),
  extensions: {
    contentData: { createCreationAction: jest.fn() },
  } as any as IAdvancedLogicExtensions,
};

let contentDataExtension: ContentDataExtension;

// Most of the tests are done as integration tests in ../index.test.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/content-data-extension', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    contentDataExtension = new ContentDataExtension(mockAdvancedLogic);
  });
  describe('createExtensionsDataForCreation', () => {
    it('can createExtensionsDataForCreation', async () => {
      const content = { what: 'ever', content: 'it', is: true };
      const spy = jest.spyOn(mockAdvancedLogic.extensions.contentData, 'createCreationAction');

      contentDataExtension.createExtensionsDataForCreation(content);

      expect(spy).toHaveBeenCalledTimes(1);
    });
    it('can createExtensionsDataForCreation with data format', async () => {
      const content = TestData;
      const spy = jest.spyOn(mockAdvancedLogic.extensions.contentData, 'createCreationAction');

      contentDataExtension.createExtensionsDataForCreation(content);

      expect(spy).toHaveBeenCalledTimes(1);
    });
    it('cannot createExtensionsDataForCreation with content data following data-format but wrong', async () => {
      const content = { meta: { format: 'rnf_invoice', version: '0.0.2' } };

      expect(() => {
        contentDataExtension.createExtensionsDataForCreation(content);
      }).toThrowError();
    });
  });
});
