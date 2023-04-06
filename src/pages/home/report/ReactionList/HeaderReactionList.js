import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import styles from '../../../../styles/styles';
import withLocalize, {withLocalizePropTypes} from '../../../../components/withLocalize';
import Text from '../../../../components/Text';
import Icon from '../../../../components/Icon';
import * as Expensicons from '../../../../components/Icon/Expensicons';
import * as StyleUtils from '../../../../styles/StyleUtils';
import {
    propTypes as reactionPropTypes,
    defaultProps as reactionDefaultProps,
} from './reactionPropTypes';
import compose from '../../../../libs/compose';
import withWindowDimensions from '../../../../components/withWindowDimensions';

const propTypes = {
    ...reactionPropTypes,
    ...withLocalizePropTypes,
};

const defaultProps = {
    ...reactionDefaultProps,
};

const HeaderReactionList = props => (
    <View style={[styles.flexRow, styles.justifyContentBetween, styles.alignItemsCenter, styles.emojiReactionListHeader, !props.isSmallScreenWidth && styles.pt4]}>
        <View style={styles.flexRow}>
            <View style={[styles.emojiReactionListHeaderBubble, StyleUtils.getEmojiReactionListHeaderBubbleStyle(props.hasUserReacted)]}>
                <Text style={[styles.emojiReactionText, StyleUtils.getEmojiReactionTextStyle(props.sizeScale)]}>
                    {props.emojiCodes.join('')}
                </Text>
                <Text style={[styles.reactionCounterText, StyleUtils.getEmojiReactionCounterTextStyle(props.hasUserReacted, props.sizeScale)]}>
                    {props.emojiCount}
                </Text>
            </View>
            <Text style={styles.reactionListHeaderText}>{`:${props.emojiName}:`}</Text>
        </View>

        {props.isSmallScreenWidth && (
            <TouchableOpacity
                onPress={props.onClose}
                accessibilityRole="button"
                accessibilityLabel={props.translate('common.close')}
            >
                <Icon src={Expensicons.Close} />
            </TouchableOpacity>
        )}
    </View>
);

HeaderReactionList.propTypes = propTypes;
HeaderReactionList.defaultProps = defaultProps;
HeaderReactionList.displayName = 'HeaderReactionList';

export default compose(
    withWindowDimensions,
    withLocalize,
)(HeaderReactionList);

