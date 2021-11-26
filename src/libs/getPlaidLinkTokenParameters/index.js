import ROUTES from '../../ROUTES';
import * as Url from '../Url';
import CONST from '../../CONST';

export default () => {
    const bankAccountRoute = window.location.href.includes('personal') ? ROUTES.BANK_ACCOUNT_PERSONAL : Url.removeTrailingForwardSlash(ROUTES.getBankAccountRoute());
    return {redirect_uri: `${CONST.NEW_EXPENSIFY_URL}/${bankAccountRoute}`};
};
