import _ from 'underscore';
import lodashGet from 'lodash/get';
import PropTypes from 'prop-types';
import React, {useCallback, useState, useEffect, useRef, useLayoutEffect, useMemo} from 'react';
import {AppState, Linking} from 'react-native';
import Onyx, {withOnyx} from 'react-native-onyx';

import * as Report from './libs/actions/Report';
import BootSplash from './libs/BootSplash';
import * as ActiveClientManager from './libs/ActiveClientManager';
import ONYXKEYS from './ONYXKEYS';
import NavigationRoot from './libs/Navigation/NavigationRoot';
import migrateOnyx from './libs/migrateOnyx';
import PushNotification from './libs/Notification/PushNotification';
import UpdateAppModal from './components/UpdateAppModal';
import Visibility from './libs/Visibility';
import GrowlNotification from './components/GrowlNotification';
import * as Growl from './libs/Growl';
import StartupTimer from './libs/StartupTimer';
import Log from './libs/Log';
import ConfirmModal from './components/ConfirmModal';
import compose from './libs/compose';
import withLocalize, {withLocalizePropTypes} from './components/withLocalize';
import * as User from './libs/actions/User';
import NetworkConnection from './libs/NetworkConnection';
import Navigation from './libs/Navigation/Navigation';
import DeeplinkWrapper from './components/DeeplinkWrapper';
import PopoverReportActionContextMenu from './pages/home/report/ContextMenu/PopoverReportActionContextMenu';
import * as ReportActionContextMenu from './pages/home/report/ContextMenu/ReportActionContextMenu';
import SplashScreenHider from './components/SplashScreenHider';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import {withNetwork} from './components/OnyxProvider';
import networkPropTypes from './components/networkPropTypes';

// This lib needs to be imported, but it has nothing to export since all it contains is an Onyx connection
// eslint-disable-next-line no-unused-vars
import UnreadIndicatorUpdater from './libs/UnreadIndicatorUpdater';

Onyx.registerLogger(({level, message}) => {
    if (level === 'alert') {
        Log.alert(message);
        console.error(message);
    } else {
        Log.info(message);
    }
});

const propTypes = {
    /* Onyx Props */

    /** Session info for the currently logged in user. */
    session: PropTypes.shape({
        /** Currently logged in user authToken */
        authToken: PropTypes.string,

        /** Currently logged in user accountID */
        accountID: PropTypes.number,
    }),

    /** Whether a new update is available and ready to install. */
    updateAvailable: PropTypes.bool,

    /** Tells us if the sidebar has rendered */
    isSidebarLoaded: PropTypes.bool,

    /** Information about a screen share call requested by a GuidesPlus agent */
    screenShareRequest: PropTypes.shape({
        /** Access token required to join a screen share room, generated by the backend */
        accessToken: PropTypes.string,

        /** Name of the screen share room to join */
        roomName: PropTypes.string,
    }),

    /** Props to detect online status */
    network: networkPropTypes.isRequired,

    /** Whether the app is waiting for the server's response to determine if a room is public */
    isCheckingPublicRoom: PropTypes.bool,

    ...withLocalizePropTypes,
};

const defaultProps = {
    session: {
        authToken: null,
        accountID: null,
    },
    updateAvailable: false,
    isSidebarLoaded: false,
    screenShareRequest: null,
    isCheckingPublicRoom: true,
};

function Expensify(props) {
    const appStateChangeListener = useRef(null);
    const [isNavigationReady, setIsNavigationReady] = useState(false);
    const [isOnyxMigrated, setIsOnyxMigrated] = useState(false);
    const [isSplashHidden, setIsSplashHidden] = useState(false);

    const isAuthenticated = useMemo(() => Boolean(lodashGet(props.session, 'authToken', null)), [props.session]);
    const shouldInit = isNavigationReady && (!isAuthenticated || props.isSidebarLoaded) && !props.isCheckingPublicRoom;
    const shouldHideSplash = shouldInit && !isSplashHidden;

    const initializeClient = () => {
        if (!Visibility.isVisible()) {
            return;
        }

        ActiveClientManager.init();
    };

    const setNavigationReady = useCallback(() => {
        setIsNavigationReady(true);

        // Navigate to any pending routes now that the NavigationContainer is ready
        Navigation.setIsNavigationReady();
    }, []);

    const onSplashHide = useCallback(() => {
        setIsSplashHidden(true);
    }, []);

    useLayoutEffect(() => {
        // Initialize this client as being an active client
        ActiveClientManager.init();

        // Used for the offline indicator appearing when someone is offline
        NetworkConnection.subscribeToNetInfo();
    }, []);

    useEffect(() => {
        setTimeout(() => {
            BootSplash.getVisibilityStatus().then((status) => {
                const appState = AppState.currentState;
                Log.info('[BootSplash] splash screen status', false, {appState, status});

                if (status === 'visible') {
                    const propsToLog = _.omit(props, ['children', 'session']);
                    propsToLog.isAuthenticated = isAuthenticated;
                    Log.alert('[BootSplash] splash screen is still visible', {propsToLog}, false);
                }
            });
        }, 30 * 1000);

        // This timer is set in the native layer when launching the app and we stop it here so we can measure how long
        // it took for the main app itself to load.
        StartupTimer.stop();

        // Run any Onyx schema migrations and then continue loading the main app
        migrateOnyx().then(() => {
            // In case of a crash that led to disconnection, we want to remove all the push notifications.
            if (!isAuthenticated) {
                PushNotification.clearNotifications();
            }

            setIsOnyxMigrated(true);
        });

        appStateChangeListener.current = AppState.addEventListener('change', initializeClient);

        // If the app is opened from a deep link, get the reportID (if exists) from the deep link and navigate to the chat report
        Linking.getInitialURL().then((url) => Report.openReportFromDeepLink(url, isAuthenticated, props.network.isOffline));

        // Open chat report from a deep link (only mobile native)
        Linking.addEventListener('url', (state) => Report.openReportFromDeepLink(state.url, isAuthenticated, props.network.isOffline));

        return () => {
            if (!appStateChangeListener.current) {
                return;
            }
            appStateChangeListener.current.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- we don't want this effect to run again
    }, []);

    // Display a blank page until the onyx migration completes
    if (!isOnyxMigrated) {
        return null;
    }

    return (
        <DeeplinkWrapper>
            {shouldInit && (
                <>
                    <KeyboardShortcutsModal />
                    <GrowlNotification ref={Growl.growlRef} />
                    <PopoverReportActionContextMenu ref={ReportActionContextMenu.contextMenuRef} />
                    {/* We include the modal for showing a new update at the top level so the option is always present. */}
                    {props.updateAvailable ? <UpdateAppModal /> : null}
                    {props.screenShareRequest ? (
                        <ConfirmModal
                            title={props.translate('guides.screenShare')}
                            onConfirm={() => User.joinScreenShare(props.screenShareRequest.accessToken, props.screenShareRequest.roomName)}
                            onCancel={User.clearScreenShareRequest}
                            prompt={props.translate('guides.screenShareRequest')}
                            confirmText={props.translate('common.join')}
                            cancelText={props.translate('common.decline')}
                            isVisible
                        />
                    ) : null}
                </>
            )}

            {!props.isCheckingPublicRoom && (
                <NavigationRoot
                    onReady={setNavigationReady}
                    authenticated={isAuthenticated}
                />
            )}

            {shouldHideSplash && <SplashScreenHider onHide={onSplashHide} />}
        </DeeplinkWrapper>
    );
}

Expensify.propTypes = propTypes;
Expensify.defaultProps = defaultProps;
export default compose(
    withLocalize,
    withOnyx({
        isCheckingPublicRoom: {
            key: ONYXKEYS.IS_CHECKING_PUBLIC_ROOM,
            initWithStoredValues: false,
        },
        session: {
            key: ONYXKEYS.SESSION,
        },
        updateAvailable: {
            key: ONYXKEYS.UPDATE_AVAILABLE,
            initWithStoredValues: false,
        },
        isSidebarLoaded: {
            key: ONYXKEYS.IS_SIDEBAR_LOADED,
        },
        screenShareRequest: {
            key: ONYXKEYS.SCREEN_SHARE_REQUEST,
        },
    }),
    withNetwork(),
)(Expensify);
