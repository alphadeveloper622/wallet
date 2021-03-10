import lodashGet from 'lodash.get';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import Onyx, {withOnyx} from 'react-native-onyx';
import listenToStorageEvents from './libs/listenToStorageEvents';
import * as ActiveClientManager from './libs/ActiveClientManager';
import ONYXKEYS from './ONYXKEYS';
import NavigationRoot from './libs/Navigation/NavigationRoot';
import Log from './libs/Log';
import PushNotification from './libs/Notification/PushNotification';
import UpdateAppModal from './components/UpdateAppModal';

// Initialize the store when the app loads for the first time
Onyx.init({
    keys: ONYXKEYS,
    safeEvictionKeys: [ONYXKEYS.COLLECTION.REPORT_ACTIONS],
    initialKeyStates: {

        // Clear any loading and error messages so they do not appear on app startup
        [ONYXKEYS.SESSION]: {loading: false},
        [ONYXKEYS.ACCOUNT]: {loading: false, error: ''},
        [ONYXKEYS.NETWORK]: {isOffline: false},
    },
    registerStorageEventListener: (onStorageEvent) => {
        listenToStorageEvents(onStorageEvent);
    },
});
Onyx.registerLogger(({level, message}) => {
    if (level === 'alert') {
        Log.alert(message, 0, {}, false);
    } else {
        Log.client(message);
    }
});

const propTypes = {
    session: PropTypes.shape({
        authToken: PropTypes.string,
        accountID: PropTypes.number,
    }),

    // Version of newly downloaded update.
    version: PropTypes.string,
};

const defaultProps = {
    session: {
        authToken: null,
        accountID: null,
    },
    version: '',
};


class Expensify extends PureComponent {
    constructor(props) {
        super(props);

        // Initialize this client as being an active client
        ActiveClientManager.init();
    }

    componentDidUpdate(prevProps) {
        const previousAccountID = lodashGet(prevProps, 'session.accountID', null);
        const currentAccountID = lodashGet(this.props, 'session.accountID', null);
        if (currentAccountID && (currentAccountID !== previousAccountID)) {
            PushNotification.register(currentAccountID);
        }
    }

    render() {
        const authToken = lodashGet(this.props, 'session.authToken', null);
        return (
            <>
                {/* We include the modal for showing a new update at the top level so the option is always present. */}
                {this.props.version ? <UpdateAppModal updateVersion={this.props.version} /> : null}
                <NavigationRoot authenticated={Boolean(authToken)} />
            </>
        );
    }
}

Expensify.propTypes = propTypes;
Expensify.defaultProps = defaultProps;
export default withOnyx({
    session: {
        key: ONYXKEYS.SESSION,
    },
    version: {
        key: ONYXKEYS.UPDATE_VERSION,
        initWithStoredValues: false,
    },
})(Expensify);
