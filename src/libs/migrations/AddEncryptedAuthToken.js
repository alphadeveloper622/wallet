import _ from 'underscore';
import Onyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';
import {reauthenticate} from '../API';

const reauthenticateThrottled = _.throttle(reauthenticate, 5000);

/**
 * This migration adds an encryptedAuthToken to the SESSION key, if it is not present.
 *
 * @returns {Promise}
 */
export default function () {
    return new Promise((resolve) => {
        const connectionID = Onyx.connect({
            key: ONYXKEYS.SESSION,
            callback: (session) => {
                Onyx.disconnect(connectionID);

                if (session && !_.isEmpty(session.encryptedAuthToken)) {
                    console.debug('[Onyx Migration] Skipped migration AddEncryptedAuthToken');
                    return resolve();
                }

                if (!session || !session.authToken) {
                    console.debug('[Onyx Migration] Skipped migration AddEncryptedAuthToken');
                    return resolve();
                }

                // If there is an auth token but no encrypted auth token, reauthenticate.
                if (session.authToken && _.isUndefined(session.encryptedAuthToken)) {
                    return reauthenticateThrottled('Onyx_Migration_AddEncryptedAuthToken')
                        .then(() => {
                            console.debug('[Onyx Migration] Ran migration AddEncryptedAuthToken');
                        });
                }

                return resolve();
            },
        });
    });
}
