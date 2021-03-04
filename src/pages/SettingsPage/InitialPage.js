import React from 'react';
import {
    TouchableOpacity,
    View,
} from 'react-native';
import PropTypes from 'prop-types';
import _ from 'underscore';
import {withOnyx} from 'react-native-onyx';
import Str from 'expensify-common/lib/str';
import styles from '../../styles/styles';
import Text from '../../components/Text';
import {signOut} from '../../libs/actions/Session';
import ONYXKEYS from '../../ONYXKEYS';
import {version} from '../../../package.json';
import AvatarWithIndicator from '../../components/AvatarWithIndicator';
import HeaderWithCloseButton from '../../components/HeaderWithCloseButton';
import {redirect, redirectToLastReport} from '../../libs/actions/App';
import {
    Gear, Lock, Profile, Wallet,
} from '../../components/Icon/Expensicons';
import HeaderGap from '../../components/HeaderGap';
import MenuItem from '../../components/MenuItem';
import ROUTES from '../../ROUTES';

const propTypes = {
    /* Onyx Props */
    // The personal details of the person who is logged in
    myPersonalDetails: PropTypes.shape({
        // Display name of the current user from their personal details
        displayName: PropTypes.string,

        // Avatar URL of the current user from their personal details
        avatar: PropTypes.string,
    }),

    // Information about the network
    network: PropTypes.shape({
        // Is the network currently offline or not
        isOffline: PropTypes.bool,
    }),

    // The session of the logged in person
    session: PropTypes.shape({
        // Email of the logged in person
        email: PropTypes.string,
    }),
};

const defaultProps = {
    myPersonalDetails: {},
    network: null,
    session: {},
};

const menuItems = [
    {
        title: 'Profile',
        icon: Profile,
        route: 'profile',
    },
    {
        title: 'Preferences',
        icon: Gear,
        route: 'preferences',
    },
    {
        title: 'Change Password',
        icon: Lock,
        route: 'password',
    },
    {
        title: 'Payments',
        icon: Wallet,
        route: 'payments',
    },
];

const InitialSettingsPage = ({
    myPersonalDetails,
    network,
    session,
}) => {
    // On the very first sign in or after clearing storage these
    // details will not be present on the first render so we'll just
    // return nothing for now.
    if (!myPersonalDetails || _.isEmpty(myPersonalDetails)) {
        return null;
    }
    return (
        <>
            <HeaderGap />
            <HeaderWithCloseButton
                title="Settings"
                onCloseButtonPress={redirectToLastReport}
            />
            <View
                pointerEvents="box-none"
                style={[
                    styles.settingsPageBackground,
                ]}
            >
                <View style={styles.pageWrapper}>
                    <View
                        style={[styles.mb3]}
                    >
                        <AvatarWithIndicator
                            size="large"
                            source={myPersonalDetails.avatar}
                            isActive={network && !network.isOffline}
                        />
                    </View>
                    <Text style={[styles.displayName, styles.mt1]} numberOfLines={1}>
                        {myPersonalDetails.displayName
                            ? myPersonalDetails.displayName
                            : Str.removeSMSDomain(session.email)}
                    </Text>
                    {myPersonalDetails.displayName && (
                    <Text style={[styles.settingsLoginName, styles.mt1]} numberOfLines={1}>
                        {Str.removeSMSDomain(session.email)}
                    </Text>
                    )}
                    {menuItems.map(item => (
                        <MenuItem
                            key={item.title}
                            title={item.title}
                            icon={item.icon}
                            onPress={() => redirect(ROUTES.getSettingsRoute(item.route))}
                            showRightArrow
                        />
                    ))}
                    <View style={[styles.ph5]}>
                        <TouchableOpacity
                            onPress={signOut}
                            style={[styles.button, styles.w100, styles.mt5]}
                        >
                            <Text style={[styles.buttonText]}>
                                Sign Out
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={[styles.chatItemMessageHeaderTimestamp]} numberOfLines={1}>
                    v
                    {version}
                </Text>
            </View>
        </>
    );
};

InitialSettingsPage.propTypes = propTypes;
InitialSettingsPage.defaultProps = defaultProps;
InitialSettingsPage.displayName = 'InitialSettingsPage';

export default withOnyx({
    myPersonalDetails: {
        key: ONYXKEYS.MY_PERSONAL_DETAILS,
    },
    network: {
        key: ONYXKEYS.NETWORK,
    },
    session: {
        key: ONYXKEYS.SESSION,
    },
})(InitialSettingsPage);
