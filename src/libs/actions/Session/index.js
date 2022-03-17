import Onyx from 'react-native-onyx';
import Str from 'expensify-common/lib/str';
import _ from 'underscore';
import lodashGet from 'lodash/get';
import ONYXKEYS from '../../../ONYXKEYS';
import redirectToSignIn from '../SignInRedirect';
import * as API from '../../API';
import CONFIG from '../../../CONFIG';
import Log from '../../Log';
import PushNotification from '../../Notification/PushNotification';
import Timing from '../Timing';
import CONST from '../../../CONST';
import Navigation from '../../Navigation/Navigation';
import ROUTES from '../../../ROUTES';
import * as Localize from '../../Localize';
import * as Network from '../../Network';
import UnreadIndicatorUpdater from '../../UnreadIndicatorUpdater';
import Timers from '../../Timers';
import * as Pusher from '../../Pusher/pusher';
import NetworkConnection from '../../NetworkConnection';
import * as User from '../User';
import * as ValidationUtils from '../../ValidationUtils';

let credentials = {};
Onyx.connect({
    key: ONYXKEYS.CREDENTIALS,
    callback: val => credentials = val,
});

/**
 * Sets API data in the store when we make a successful "Authenticate"/"CreateLogin" request
 *
 * @param {Object} data
 * @param {String} data.accountID
 * @param {String} data.authToken
 * @param {String} data.email
 */
function setSuccessfulSignInData(data) {
    PushNotification.register(data.accountID);
    Onyx.merge(ONYXKEYS.SESSION, {
        shouldShowComposeInput: true,
        ..._.pick(data, 'authToken', 'accountID', 'email', 'encryptedAuthToken'),
    });
}

/**
 * Create an account for the user logging in.
 * This will send them a notification with a link to click on to validate the account and set a password
 *
 * @param {String} login
 */
function createAccount(login) {
    Onyx.merge(ONYXKEYS.SESSION, {error: ''});

    API.User_SignUp({
        email: login,
    }).then((response) => {
        if (response.jsonCode === 200) {
            return;
        }

        let errorMessage = response.message || `Unknown API Error: ${response.jsonCode}`;
        if (!response.message && response.jsonCode === 405) {
            errorMessage = 'Cannot create an account that is under a controlled domain';
        }
        Onyx.merge(ONYXKEYS.SESSION, {error: errorMessage});
        Onyx.merge(ONYXKEYS.CREDENTIALS, {login: null});
    });
}

/**
 * Clears the Onyx store and redirects user to the sign in page
 */
function signOut() {
    Log.info('Flushing logs before signing out', true, {}, true);
    if (credentials && credentials.autoGeneratedLogin) {
        // Clean up the login that we created
        API.DeleteLogin({
            partnerUserID: credentials.autoGeneratedLogin,
            partnerName: CONFIG.EXPENSIFY.PARTNER_NAME,
            partnerPassword: CONFIG.EXPENSIFY.PARTNER_PASSWORD,
            shouldRetry: false,
        })
            .catch(error => Onyx.merge(ONYXKEYS.SESSION, {error: error.message}));
    }
    Onyx.set(ONYXKEYS.SESSION, null);
    Onyx.set(ONYXKEYS.CREDENTIALS, null);
    Timing.clearData();
}

function signOutAndRedirectToSignIn() {
    signOut();
    redirectToSignIn();
    Log.info('Redirecting to Sign In because signOut() was called');
}

/**
 * Reopen the account and send the user a link to set password
 *
 * @param {String} [login]
 */
function reopenAccount(login = credentials.login) {
    Onyx.merge(ONYXKEYS.ACCOUNT, {loading: true});
    API.User_ReopenAccount({email: login})
        .finally(() => {
            Onyx.merge(ONYXKEYS.ACCOUNT, {loading: false});
        });
}

/**
 * Resend the validation link to the user that is validating their account
 *
 * @param {String} [login]
 */
function resendValidationLink(login = credentials.login) {
    Onyx.merge(ONYXKEYS.ACCOUNT, {loading: true});
    API.ResendValidateCode({email: login})
        .finally(() => {
            Onyx.merge(ONYXKEYS.ACCOUNT, {loading: false});
        });
}

/**
 * Checks the API to see if an account exists for the given login
 *
 * @param {String} login
 */
function fetchAccountDetails(login) {
    Onyx.merge(ONYXKEYS.ACCOUNT, {...CONST.DEFAULT_ACCOUNT_DATA, loading: true});

    API.GetAccountStatus({email: login, forceNetworkRequest: true})
        .then((response) => {
            if (response.jsonCode === 200) {
                Onyx.merge(ONYXKEYS.CREDENTIALS, {
                    login: response.normalizedLogin,
                });
                Onyx.merge(ONYXKEYS.ACCOUNT, {
                    accountExists: response.accountExists,
                    validated: response.validated,
                    closed: response.isClosed,
                    forgotPassword: false,
                    validateCodeExpired: false,
                });

                if (!response.accountExists) {
                    createAccount(login);
                } else if (response.isClosed) {
                    reopenAccount(login);
                } else if (!response.validated) {
                    resendValidationLink(login);
                }
            } else if (response.jsonCode === 402) {
                Onyx.merge(ONYXKEYS.ACCOUNT, {
                    error: ValidationUtils.isNumericWithSpecialChars(login)
                        ? Localize.translateLocal('messages.errorMessageInvalidPhone')
                        : Localize.translateLocal('loginForm.error.invalidFormatEmailLogin'),
                });
            } else {
                Onyx.merge(ONYXKEYS.ACCOUNT, {error: response.message});
            }
        })
        .catch(() => {
            Onyx.merge(ONYXKEYS.ACCOUNT, {error: Localize.translateLocal('session.offlineMessageRetry')});
        })
        .finally(() => {
            Onyx.merge(ONYXKEYS.ACCOUNT, {loading: false});
        });
}

/**
 *
 * Will create a temporary login for the user in the passed authenticate response which is used when
 * re-authenticating after an authToken expires.
 *
 * @param {String} authToken
 * @param {String} email
 * @return {Promise}
 */
function createTemporaryLogin(authToken, email) {
    const autoGeneratedLogin = Str.guid('expensify.cash-');
    const autoGeneratedPassword = Str.guid();

    return API.CreateLogin({
        authToken,
        partnerName: CONFIG.EXPENSIFY.PARTNER_NAME,
        partnerPassword: CONFIG.EXPENSIFY.PARTNER_PASSWORD,
        partnerUserID: autoGeneratedLogin,
        partnerUserSecret: autoGeneratedPassword,
        shouldRetry: false,
        forceNetworkRequest: true,
        email,
        includeEncryptedAuthToken: true,
    })
        .then((createLoginResponse) => {
            if (createLoginResponse.jsonCode !== 200) {
                throw new Error(createLoginResponse.message);
            }

            setSuccessfulSignInData(createLoginResponse);

            // If we have an old generated login for some reason
            // we should delete it before storing the new details
            if (credentials && credentials.autoGeneratedLogin) {
                API.DeleteLogin({
                    partnerUserID: credentials.autoGeneratedLogin,
                    partnerName: CONFIG.EXPENSIFY.PARTNER_NAME,
                    partnerPassword: CONFIG.EXPENSIFY.PARTNER_PASSWORD,
                    shouldRetry: false,
                })
                    .catch(Log.info);
            }

            Onyx.merge(ONYXKEYS.CREDENTIALS, {
                autoGeneratedLogin,
                autoGeneratedPassword,
            });
            Network.unpauseRequestQueue();
            return createLoginResponse;
        })
        .catch((error) => {
            Onyx.merge(ONYXKEYS.ACCOUNT, {error: error.message});
        })
        .finally(() => {
            Onyx.merge(ONYXKEYS.ACCOUNT, {loading: false});
        });
}

/**
 * Sign the user into the application. This will first authenticate their account
 * then it will create a temporary login for them which is used when re-authenticating
 * after an authToken expires.
 *
 * @param {String} password
 * @param {String} [twoFactorAuthCode]
 */
function signIn(password, twoFactorAuthCode) {
    Onyx.merge(ONYXKEYS.ACCOUNT, {...CONST.DEFAULT_ACCOUNT_DATA, loading: true});

    API.Authenticate({
        useExpensifyLogin: true,
        partnerName: CONFIG.EXPENSIFY.PARTNER_NAME,
        partnerPassword: CONFIG.EXPENSIFY.PARTNER_PASSWORD,
        partnerUserID: credentials.login,
        partnerUserSecret: password,
        twoFactorAuthCode,
        email: credentials.login,
    })
        .then(({authToken, email}) => {
            createTemporaryLogin(authToken, email);
        })
        .catch((error) => {
            if (error.message === 'passwordForm.error.twoFactorAuthenticationEnabled') {
                Onyx.merge(ONYXKEYS.ACCOUNT, {requiresTwoFactorAuth: true, loading: false});
                return;
            }
            Onyx.merge(ONYXKEYS.ACCOUNT, {error: Localize.translateLocal(error.message), loading: false});
        });
}

/**
 * Uses a short lived authToken to continue a user's session from OldDot
 *
 * @param {String} accountID
 * @param {String} email
 * @param {String} shortLivedToken
 * @param {String} exitTo
 */
function signInWithShortLivedToken(accountID, email, shortLivedToken) {
    Onyx.merge(ONYXKEYS.ACCOUNT, {...CONST.DEFAULT_ACCOUNT_DATA, loading: true});

    createTemporaryLogin(shortLivedToken, email).then((response) => {
        Onyx.merge(ONYXKEYS.SESSION, {
            accountID,
            email,
        });
        if (response.jsonCode === 200) {
            User.getUserDetails();
            Onyx.merge(ONYXKEYS.ACCOUNT, {success: true});
        } else {
            const error = lodashGet(response, 'message', 'Unable to login.');
            Onyx.merge(ONYXKEYS.ACCOUNT, {error});
        }
    }).finally(() => {
        Onyx.merge(ONYXKEYS.ACCOUNT, {loading: false});
    });
}

/**
 * User forgot the password so let's send them the link to reset their password
 */
function resetPassword() {
    Onyx.merge(ONYXKEYS.ACCOUNT, {loading: true, forgotPassword: true});
    API.ResetPassword({email: credentials.login})
        .finally(() => {
            Onyx.merge(ONYXKEYS.ACCOUNT, {loading: false, validateCodeExpired: false});
        });
}

/**
 * Set the password for the current account.
 * Then it will create a temporary login for them which is used when re-authenticating
 * after an authToken expires.
 *
 * @param {String} password
 * @param {String} validateCode
 * @param {Number} accountID
 */
function setPassword(password, validateCode, accountID) {
    Onyx.merge(ONYXKEYS.ACCOUNT, {...CONST.DEFAULT_ACCOUNT_DATA, loading: true, validateCodeExpired: false});
    API.SetPassword({
        password,
        validateCode,
        accountID,
    })
        .then((response) => {
            if (response.jsonCode === 200) {
                createTemporaryLogin(response.authToken, response.email);
                return;
            }

            // This request can fail if the password is not complex enough
            Onyx.merge(ONYXKEYS.ACCOUNT, {error: response.message});
        })
        .catch((response) => {
            if (response.title !== CONST.PASSWORD_PAGE.ERROR.VALIDATE_CODE_FAILED) {
                return;
            }

            const login = lodashGet(response, 'data.email', null);
            Onyx.merge(ONYXKEYS.ACCOUNT, {accountExists: true, validateCodeExpired: true, error: null});

            // The login might not be set if the user hits a url in a new session. We set it here to ensure calls to resendValidationLink() will succeed.
            if (login) {
                Onyx.merge(ONYXKEYS.CREDENTIALS, {login});
            }
            Navigation.navigate(ROUTES.HOME);
        })
        .finally(() => {
            Onyx.merge(ONYXKEYS.ACCOUNT, {loading: false});
        });
}

/**
 * Clear the credentials and partial sign in session so the user can taken back to first Login step
 */
function clearSignInData() {
    Onyx.multiSet({
        [ONYXKEYS.ACCOUNT]: null,
        [ONYXKEYS.CREDENTIALS]: null,
    });
}

/**
 * Put any logic that needs to run when we are signed out here. This can be triggered when the current tab or another tab signs out.
 */
function cleanupSession() {
    // We got signed out in this tab or another so clean up any subscriptions and timers
    NetworkConnection.stopListeningForReconnect();
    UnreadIndicatorUpdater.stopListeningForReportChanges();
    PushNotification.deregister();
    PushNotification.clearNotifications();
    Pusher.disconnect();
    Timers.clearAll();
}

function clearAccountMessages() {
    Onyx.merge(ONYXKEYS.ACCOUNT, {error: '', success: ''});
}

/**
 * Calls change password and signs if if successful. Otherwise, we request a new magic link
 * if we know the account email. Otherwise or finally we redirect to the root of the nav.
 * @param {String} authToken
 * @param {String} password
 */
function changePasswordAndSignIn(authToken, password) {
    Onyx.merge(ONYXKEYS.ACCOUNT, {validateSessionExpired: false});
    API.ChangePassword({
        authToken,
        password,
    })
        .then((responsePassword) => {
            Onyx.merge(ONYXKEYS.USER_SIGN_UP, {authToken: null});
            if (responsePassword.jsonCode === 200) {
                signIn(password);
                return;
            }
            if (responsePassword.jsonCode === 407 && !credentials.login) {
                // authToken has expired, and we don't have the email set to request a new magic link.
                // send user to login page to enter email.
                Navigation.navigate(ROUTES.HOME);
                return;
            }
            if (responsePassword.jsonCode === 407) {
                // authToken has expired, and we have the account email, so we request a new magic link.
                Onyx.merge(ONYXKEYS.ACCOUNT, {accountExists: true, validateCodeExpired: true, error: null});
                resetPassword();
                Navigation.navigate(ROUTES.HOME);
                return;
            }
            Onyx.merge(ONYXKEYS.SESSION, {error: 'setPasswordPage.passwordNotSet'});
        });
}

/**
 * Call set or change password based on if we have an auth token
 * @param {Number} accountID
 * @param {String} validateCode
 * @param {String} password
 * @param {String} authToken
 */

function setOrChangePassword(accountID, validateCode, password, authToken) {
    if (authToken) {
        changePasswordAndSignIn(authToken, password);
        return;
    }
    setPassword(password, validateCode, accountID);
}

/**
 * @param {Number} accountID
 * @param {String} validateCode
 * @param {String} login
 * @param {String} authToken
 */
function validateEmail(accountID, validateCode) {
    Onyx.merge(ONYXKEYS.USER_SIGN_UP, {isValidating: true});
    Onyx.merge(ONYXKEYS.SESSION, {error: ''});
    API.ValidateEmail({
        accountID,
        validateCode,
    })
        .then((responseValidate) => {
            if (responseValidate.jsonCode === 200) {
                Onyx.merge(ONYXKEYS.USER_SIGN_UP, {authToken: responseValidate.authToken});
                Onyx.merge(ONYXKEYS.ACCOUNT, {accountExists: true, validated: true});
                Onyx.merge(ONYXKEYS.CREDENTIALS, {login: responseValidate.email});
                return;
            }
            if (responseValidate.jsonCode === 666) {
                Onyx.merge(ONYXKEYS.ACCOUNT, {accountExists: true, validated: true});
            }
            if (responseValidate.jsonCode === 401) {
                Onyx.merge(ONYXKEYS.SESSION, {error: 'setPasswordPage.setPasswordLinkInvalid'});
            }
        })
        .finally(Onyx.merge(ONYXKEYS.USER_SIGN_UP, {isValidating: false}));
}

// It's necessary to throttle requests to reauthenticate since calling this multiple times will cause Pusher to
// reconnect each time when we only need to reconnect once. This way, if an authToken is expired and we try to
// subscribe to a bunch of channels at once we will only reauthenticate and force reconnect Pusher once.
const reauthenticatePusher = _.throttle(() => {
    Log.info('[Pusher] Re-authenticating and then reconnecting');
    API.reauthenticate('Push_Authenticate')
        .then(Pusher.reconnect)
        .catch(() => {
            console.debug(
                '[PusherConnectionManager]',
                'Unable to re-authenticate Pusher because we are offline.',
            );
        });
}, 5000, {trailing: false});

/**
 * @param {String} socketID
 * @param {String} channelName
 * @param {Function} callback
 */
function authenticatePusher(socketID, channelName, callback) {
    Log.info('[PusherConnectionManager] Attempting to authorize Pusher', false, {channelName});

    API.Push_Authenticate({
        socket_id: socketID,
        channel_name: channelName,
        shouldRetry: false,
        forceNetworkRequest: true,
    })
        .then((data) => {
            if (data.jsonCode === 407) {
                callback(new Error('Expensify session expired'), {auth: ''});

                // Attempt to refresh the authToken then reconnect to Pusher
                reauthenticatePusher();
                return;
            }

            if (data.jsonCode !== 200) {
                Log.hmmm('[PusherConnectionManager] Unable to authenticate Pusher for some reason other than expired session');
                return;
            }

            Log.info(
                '[PusherConnectionManager] Pusher authenticated successfully',
                false,
                {channelName},
            );
            callback(null, data);
        })
        .catch((error) => {
            Log.info('[PusherConnectionManager] Unhandled error: ', false, {channelName});
            callback(error, {auth: ''});
        });
}

/**
 * @param {Boolean} shouldShowComposeInput
 */
function setShouldShowComposeInput(shouldShowComposeInput) {
    Onyx.merge(ONYXKEYS.SESSION, {shouldShowComposeInput});
}

export {
    fetchAccountDetails,
    setOrChangePassword,
    setPassword,
    signIn,
    signInWithShortLivedToken,
    signOut,
    signOutAndRedirectToSignIn,
    reopenAccount,
    resendValidationLink,
    resetPassword,
    clearSignInData,
    cleanupSession,
    clearAccountMessages,
    validateEmail,
    authenticatePusher,
    reauthenticatePusher,
    setShouldShowComposeInput,
    changePasswordAndSignIn,
};
