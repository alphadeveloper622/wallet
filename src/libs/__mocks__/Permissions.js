import _ from 'underscore';
import CONST from '../../CONST';

/**
 * This module is mocked in tests because all the permission methods call canUseAllBetas() and that will
 * always return true because Environment.isDevelopment() is always true when running tests. It's not possible
 * to mock canUseAllBetas() directly because it's not an exported method and we don't want to export it just
 * so it can be mocked.
 */

export default {
    ...(jest.requireActual('../Permissions')),
    canUsePolicyExpenseChat: betas => _.contains(betas, CONST.BETAS.POLICY_EXPENSE_CHAT),
};
