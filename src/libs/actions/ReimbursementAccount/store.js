import Onyx from 'react-native-onyx';
import lodashGet from 'lodash/get';
import ONYXKEYS from '../../../ONYXKEYS';

/** Reimbursement account actively being set up */
let reimbursementAccountInSetup = {};
Onyx.connect({
    key: ONYXKEYS.REIMBURSEMENT_ACCOUNT,
    callback: (val) => {
        reimbursementAccountInSetup = lodashGet(val, 'achData', {});
    },
});

let reimbursementAccountWorkspaceID = null;
Onyx.connect({
    key: ONYXKEYS.REIMBURSEMENT_ACCOUNT_WORKSPACE_ID,
    callback: (val) => {
        reimbursementAccountWorkspaceID = val;
    },
});

let credentials;
Onyx.connect({
    key: ONYXKEYS.CREDENTIALS,
    callback: (val) => {
        credentials = val;
    },
});

function getReimbursementAccountInSetup() {
    return reimbursementAccountInSetup;
}

function getCredentials() {
    return credentials;
}

function getReimbursementAccountWorkspaceID() {
    return reimbursementAccountWorkspaceID;
}

export {
    getReimbursementAccountInSetup,
    getCredentials,
    getReimbursementAccountWorkspaceID,
};
