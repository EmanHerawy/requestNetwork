import { Identity as IdentityTypes, RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

/**
 * Function to manage Request Logic Role
 */
export default {
  getRole,
};

/**
 * Function to get the role of an identity in an object
 *
 * @param any parameters the object to check
 * @param IIdentity identity the identity to check
 *
 * @returns Types.ROLE the role of identity in parameters
 */
function getRole(identity: IdentityTypes.IIdentity, parameters: any): Types.ROLE {
  if (parameters.payee && Utils.identity.areEqual(parameters.payee, identity)) {
    return Types.ROLE.PAYEE;
  }
  if (parameters.payer && Utils.identity.areEqual(parameters.payer, identity)) {
    return Types.ROLE.PAYER;
  }

  return Types.ROLE.THIRD_PARTY;
}
