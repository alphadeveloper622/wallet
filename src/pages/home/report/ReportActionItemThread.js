import React from 'react';
import {View, Pressable, Text} from 'react-native';
import PropTypes from 'prop-types';
import _ from 'underscore';
import styles from '../../../styles/styles';
import * as Report from '../../../libs/actions/Report';
import withLocalize, {withLocalizePropTypes} from '../../../components/withLocalize';
import withWindowDimensions, {windowDimensionsPropTypes} from '../../../components/withWindowDimensions';

import CONST from '../../../CONST';
import avatarPropTypes from '../../../components/avatarPropTypes';
import MultipleAvatars from '../../../components/MultipleAvatars';
import Navigation from '../../../libs/Navigation/Navigation';
import ROUTES from '../../../ROUTES';
import compose from '../../../libs/compose';

const propTypes = {
    /** List of participant icons for the thread */
    icons: PropTypes.arrayOf(avatarPropTypes).isRequired,

    /** Number of comments under the thread */
    numberOfReplies: PropTypes.number.isRequired,

    /** Time of the most recent reply */
    mostRecentReply: PropTypes.string.isRequired,

    /** ID of child thread report */
    childReportID: PropTypes.string.isRequired,

    /** Is hovered */
    isHovered: PropTypes.bool.isRequired,

    ...withLocalizePropTypes,
    ...windowDimensionsPropTypes,
};

const ReportActionItemThread = (props) => {
    const numberReplies = props.numberOfReplies > 99 ? '99+' : `${props.numberOfReplies}`;
    const replyText = props.numberOfReplies === 1 ? props.translate('threads.reply') : props.translate('threads.replies');

    const timeStamp = props.isSmallScreenWidth ? props.datetimeToCalendarTimeShort(props.mostRecentReply) : props.datetimeToCalendarTime(props.mostRecentReply);

    return (
        <View style={[styles.chatItemMessage]}>
            <Pressable
                onPress={() => {
                    Report.openReport(props.childReportID);
                    Navigation.navigate(ROUTES.getReportRoute(props.childReportID));
                }}
            >
                <View style={[styles.flexRow, styles.alignItemsCenter, styles.mt2]}>
                    <MultipleAvatars
                        size={CONST.AVATAR_SIZE.SMALL}
                        icons={props.icons}
                        shouldStackHorizontally
                        avatarTooltips={_.map(props.icons, (icon) => icon.name)}
                        isHovered={props.isHovered}
                        isInReportView
                    />
                    <View style={[styles.flexRow, styles.lh140Percent, styles.alignItemsEnd]}>
                        <Text
                            selectable={false}
                            style={[styles.link, styles.ml2, styles.h4]}
                        >
                            {`${numberReplies} ${replyText}`}
                        </Text>
                        <Text
                            selectable={false}
                            style={[styles.ml2, styles.textMicroSupporting]}
                        >{`${props.translate('threads.lastReply')} ${timeStamp}`}</Text>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

ReportActionItemThread.propTypes = propTypes;
ReportActionItemThread.displayName = 'ReportActionItemThread';

export default compose(withLocalize, withWindowDimensions)(ReportActionItemThread);
