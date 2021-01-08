import Onyx from 'react-native-onyx';
import {fetchAccountDetails, signIn} from '../../src/libs/actions/Session';
import * as API from '../../src/libs/API';
import HttpUtils from '../../src/libs/HttpUtils';
import waitForPromisesToResolve from '../utils/waitForPromisesToResolve';
import ONYXKEYS from '../../src/ONYXKEYS';

// Set up manual mocks for methods used in the actions so our test does not fail.
jest.mock('../../src/libs/Notification/PushNotification', () => ({
    // There is no need for a jest.fn() since we don't need to make assertions against it.
    register: () => {},
}));

// We are mocking this method so that we can later test to see if it was called and what arguments it was called with.
// We test HttpUtils.xhr() since this means that our API command turned into a network request and isn't only queued.
jest.mock('../../src/libs/HttpUtils', () => ({
    xhr: jest.fn(),
}));

test('Authenticate is called with saved credentials when a session expires', () => {
    const TEST_USER_LOGIN = 'test@testguy.com';
    const TEST_AUTH_TOKEN = '12345';

    // Set up mock responses for all APIs that will be called. The next time this command is called it will return
    // jsonCode: 200 and the response here. We are setting a mock command
    API.setMockCommand('GetAccountStatus', jest.fn(() => Promise.resolve({
        jsonCode: 200,
        accountExists: true,
        canAccessExpensifyCash: true,
        requiresTwoFactorAuth: false,
    })));

    let credentials;
    Onyx.connect({
        key: ONYXKEYS.CREDENTIALS,
        callback: val => credentials = val,
    });

    let session;
    Onyx.connect({
        key: ONYXKEYS.SESSION,
        callback: val => session = val,
    });

    // Simulate user entering their login and populating the credentials.login
    fetchAccountDetails(TEST_USER_LOGIN);

    // Note: In order for this test to work we must return a promise! It will pass even with
    // failing assertions if we remove the return keyword.
    return waitForPromisesToResolve()
        .then(() => {
            // Next we will simulate signing in and make sure all API calls in this flow succeed
            const authenticateMock = jest.fn(() => Promise.resolve({
                jsonCode: 200,
                accountID: 1,
                authToken: TEST_AUTH_TOKEN,
                email: TEST_USER_LOGIN,
            }));
            API.setMockCommand('Authenticate', authenticateMock);

            // There's no need to use a jest.fn() here since we do not need to test whether this was called
            // but must provide this response so the credentials are set after calling signIn()
            API.setMockCommand('CreateLogin', () => Promise.resolve({
                jsonCode: 200,
                accountID: 1,
                authToken: TEST_AUTH_TOKEN,
                email: TEST_USER_LOGIN,
            }));
            signIn('Password1');
            expect(authenticateMock.mock.calls.length).toBe(1);
            return waitForPromisesToResolve();
        })
        .then(() => {
            // Verify that our credentials were saved and that our session data is correct
            expect(credentials.login).toBe(TEST_USER_LOGIN);
            expect(credentials.autoGeneratedLogin).not.toBeUndefined();
            expect(credentials.autoGeneratedPassword).not.toBeUndefined();
            expect(session.authToken).toBe(TEST_AUTH_TOKEN);
            expect(session.accountID).toBe(1);
            expect(session.email).toBe(TEST_USER_LOGIN);

            // At this point we have an authToken. To simulate it expiring we'll just make another
            // request and mock the response so it returns 407. Once this happens we should attempt
            // to Re-Authenticate with the stored credentials. We will also reset all the mocks we've set
            // so that we can test that Authenticate is getting called via HttpUtils.xhr() and not just
            // being put into the queue. If we do not clear the API mocks then xhr() will not be called
            // and we will just return the mock response we set for Authenticate previously.
            API.resetMockCommands();
            API.setMockCommand('Get', () => Promise.resolve({
                jsonCode: 407,
            }));
            return API.Get({returnValueList: 'chatList'});
        })
        .then(() => {
            // Finally, we verify we made this request and the command is Authenticate. If this assertion
            // fails in the future it doesn't necessarily mean that Authenticate wasn't called e.g. maybe
            // another API call has been added and needs to be mocked. But if that is not the case...
            // then it's possible we are about to break the re-authentication flow.
            expect(HttpUtils.xhr.mock.calls.length).toBe(1);

            // Note: jest.fn() arguments are stored as a two dimensional array. [0][0] refers to the first
            // argument of the first call made to our xhr() mock function.
            expect(HttpUtils.xhr.mock.calls[0][0]).toBe('Authenticate');
        });
});
