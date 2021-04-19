import _ from 'underscore';
import React from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import lodashGet from 'lodash/get';
import {
    Clipboard as ClipboardIcon, LinkCopy, Mail, Pencil, Trashcan, Checkmark,
} from '../../../components/Icon/Expensicons';
import getReportActionContextMenuStyles from '../../../styles/getReportActionContextMenuStyles';
import ReportActionContextMenuItem from './ReportActionContextMenuItem';
import ReportActionPropTypes from './ReportActionPropTypes';
import Clipboard from '../../../libs/Clipboard';
import {isReportMessageAttachment} from '../../../libs/reportUtils';
import {deleteReportAction} from '../../../libs/actions/Report';
import {withOnyx} from 'react-native-onyx';
import ONYXKEYS from '../../../ONYXKEYS';

const propTypes = {
    // The ID of the report this report action is attached to.
    // eslint-disable-next-line react/no-unused-prop-types
    reportID: PropTypes.number.isRequired,

    // The report action this context menu is attached to.
    reportAction: PropTypes.shape(ReportActionPropTypes),

    // If true, this component will be a small, row-oriented menu that displays icons but not text.
    // If false, this component will be a larger, column-oriented menu that displays icons alongside text in each row.
    isMini: PropTypes.bool,

    // Controls the visibility of this component.
    isVisible: PropTypes.bool,

    // The session of the logged in person
    session: PropTypes.shape({
        // Email of the logged in person
        email: PropTypes.string,
    }),
};

const defaultProps = {
    reportAction: {},
    isMini: false,
    isVisible: false,
    session: {},
};

class ReportActionContextMenu extends React.Component {
    constructor(props) {
        super(props);

        /**
         * A list of all the context actions in this menu.
         */
        this.contextActions = [
            // Copy to clipboard
            {
                text: 'Copy to Clipboard',
                icon: ClipboardIcon,
                successText: 'Copied!',
                successIcon: Checkmark,
                shouldShow: true,

                // If return value is true, we switch the `text` and `icon` on
                // `ReportActionContextMenuItem` with `successText` and `successIcon` which will fallback to
                // the `text` and `icon`
                onPress: () => {
                    const message = _.last(lodashGet(this.props.reportAction, 'message', null));
                    const html = lodashGet(message, 'html', '');
                    const text = lodashGet(message, 'text', '');
                    const isAttachment = _.has(this.props.reportAction, 'isAttachment')
                        ? this.props.reportAction.isAttachment
                        : isReportMessageAttachment(text);
                    if (!isAttachment) {
                        Clipboard.setString(text);
                    } else {
                        Clipboard.setString(html);
                    }
                },
            },

            // Copy chat link
            {
                text: 'Copy Link',
                icon: LinkCopy,
                shouldShow: false,
                onPress: () => {},
            },

            // Mark as Unread
            {
                text: 'Mark as Unread',
                icon: Mail,
                shouldShow: false,
                onPress: () => {},
            },

            // Edit Comment
            {
                text: 'Edit Comment',
                icon: Pencil,
                shouldShow: false,
                onPress: () => {},
            },

            // Delete Comment
            {
                text: 'Delete Comment',
                icon: Trashcan,
                shouldShow: this.props.reportAction.actorEmail === this.props.session.email,
                onPress: () => deleteReportAction(this.props.reportID, this.props.reportAction),
            },
        ];

        this.wrapperStyle = getReportActionContextMenuStyles(this.props.isMini);
    }

    render() {
        return this.props.isVisible && (
            <View style={this.wrapperStyle}>
                {this.contextActions.map(contextAction => contextAction.shouldShow && (
                    <ReportActionContextMenuItem
                        icon={contextAction.icon}
                        text={contextAction.text}
                        successIcon={contextAction.successIcon}
                        successText={contextAction.successText}
                        isMini={this.props.isMini}
                        key={contextAction.text}
                        onPress={() => contextAction.onPress()}
                    />
                ))}
            </View>
        );
    }
}

ReportActionContextMenu.propTypes = propTypes;
ReportActionContextMenu.defaultProps = defaultProps;

export default withOnyx({
    session: {
        key: ONYXKEYS.SESSION,
    },
})(ReportActionContextMenu);
