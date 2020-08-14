import React from 'react';
import {View, Image} from 'react-native';
import PropTypes from 'prop-types';
import _ from 'underscore';
import Text from '../../../components/Text';
import ReportHistoryPropsTypes from './ReportHistoryPropsTypes';
import ReportHistoryItemMessage from './ReportHistoryItemMessage';
import ReportHistoryItemFragment from './ReportHistoryItemFragment';
import styles from '../../../style/StyleSheet';
import CONST from '../../../CONST';
import ReportHistoryItemDate from './ReportHistoryItemDate';

const propTypes = {
    // All the data of the history item
    historyItem: PropTypes.shape(ReportHistoryPropsTypes).isRequired,
};

const ReportHistoryItemSingle = ({historyItem}) => {
    const avatarUrl = historyItem.automatic
        ? `${CONST.CLOUDFRONT_URL}/images/icons/concierge_2019.svg`
        : historyItem.avatar;
    return (
        <View style={[styles.chatItem]}>
            <View style={[styles.chatItemLeft]}>
                <View style={[styles.historyItemAvatarWrapper]}>
                    <Image
                        source={{uri: avatarUrl}}
                        style={[styles.historyItemAvatar]}
                    />
                </View>
            </View>
            <View style={[styles.chatItemRight]}>
                <View style={[styles.chatItemMessageHeader]}>
                    {historyItem.person.map(fragment => (
                        <View key={_.uniqueId('person-', historyItem.sequenceNumber)}>
                            <ReportHistoryItemFragment
                                fragment={fragment}
                            />
                        </View>
                    ))}
                    <View>
                        <ReportHistoryItemDate timestamp={historyItem.timestamp} />
                    </View>
                </View>
                <View style={[styles.chatItemMessage]}>
                    <Text>
                        <ReportHistoryItemMessage historyItem={historyItem} />
                    </Text>
                </View>
            </View>
        </View>
    );
};

ReportHistoryItemSingle.propTypes = propTypes;

export default ReportHistoryItemSingle;
