import React from 'react';
import {View} from 'react-native';
import {withOnyx} from 'react-native-onyx';
import PropTypes from 'prop-types';
import ONYXKEYS from '../../../ONYXKEYS';
import RoomHeaderAvatars from '../../../components/RoomHeaderAvatars';
import ReportWelcomeText from '../../../components/ReportWelcomeText';
import * as ReportUtils from '../../../libs/reportUtils';
import styles from '../../../styles/styles';
import * as Expensicons from '../../../components/Icon/Expensicons';
import LargeDualAvatars from '../../../components/LargeDualAvatars';

const propTypes = {
    /** The report currently being looked at */
    report: PropTypes.shape({
        /**  Avatars corresponding to a chat */
        icons: PropTypes.arrayOf(PropTypes.string),

        /** Whether the user is not an admin of policyExpenseChat chat */
        isOwnPolicyExpenseChat: PropTypes.bool,
    }),
};
const defaultProps = {
    report: {},
};

const ReportActionItemCreated = (props) => {
    const isChatRoom = ReportUtils.isChatRoom(props.report);
    const isPolicyExpenseChat = ReportUtils.isPolicyExpenseChat(props.report);
    return (
        <View style={[
            styles.chatContent,
            styles.pb8,
            styles.p5,
        ]}
        >
            <View style={[styles.justifyContentCenter, styles.alignItemsCenter, styles.flex1]}>
                {
                    isPolicyExpenseChat && !props.report.isOwnPolicyExpenseChat ? (
                        <LargeDualAvatars
                            avatarImageURLs={props.report.icons}
                            avatarTooltips={[]}
                            defaultSubscriptIcon={() => Expensicons.Workspace}
                        />
                    ) : (
                        <RoomHeaderAvatars
                            avatarImageURLs={props.report.icons}
                            isChatRoom={isChatRoom}
                            isPolicyExpenseChat={isPolicyExpenseChat}
                            isArchivedRoom={ReportUtils.isArchivedRoom(props.report)}
                        />
                    )
                }
                <ReportWelcomeText report={props.report} shouldIncludeParticipants={!isChatRoom} />
            </View>
        </View>
    );
};

ReportActionItemCreated.defaultProps = defaultProps;
ReportActionItemCreated.propTypes = propTypes;
ReportActionItemCreated.displayName = 'ReportActionItemCreated';

export default withOnyx({
    report: {
        key: ({reportID}) => `${ONYXKEYS.COLLECTION.REPORT}${reportID}`,
    },
})(ReportActionItemCreated);
