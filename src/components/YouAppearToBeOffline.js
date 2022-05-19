import React from 'react';
import {View} from 'react-native';
import {withNetwork} from './OnyxProvider';
import networkPropTypes from './networkPropTypes';
import Icon from './Icon';
import * as Expensicons from './Icon/Expensicons';
import variables from '../styles/variables';
import Text from './Text';
import styles from '../styles/styles';
import compose from '../libs/compose';
import withLocalize, {withLocalizePropTypes} from './withLocalize';

const propTypes = {
    /** Information about the network */
    network: networkPropTypes.isRequired,

    ...withLocalizePropTypes,
};

const YouAppearToBeOffline = (props) => {
    if (!props.network.isOffline) {
        //return null;
    }
    return (
        <View style={[styles.flexRow]}>
            <Icon
                src={Expensicons.Offline}
                width={variables.iconSizeExtraSmall}
                height={variables.iconSizeExtraSmall}
            />
            <Text style={[styles.ml2, styles.chatItemComposeSecondaryRowSubText]}>
                {props.translate('reportActionCompose.youAppearToBeOffline')}
            </Text>
        </View>
    );
};

YouAppearToBeOffline.propTypes = propTypes;
YouAppearToBeOffline.displayName = 'YouAppearToBeOffline';

export default compose(
    withLocalize,
    withNetwork(),
)(YouAppearToBeOffline);
