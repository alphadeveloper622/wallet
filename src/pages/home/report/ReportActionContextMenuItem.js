import React, {memo} from 'react';
import PropTypes from 'prop-types';
import {Pressable} from 'react-native';
import Tooltip from '../../../components/Tooltip';
import Icon from '../../../components/Icon';
import getReportActionContextMenuItemStyles from '../../../styles/getReportActionContextMenuItemStyles';
import CONST from '../../../CONST';

/**
 * Get the string representation of a button's state.
 *
 * @param {Boolean} [isHovered]
 * @param {Boolean} [isPressed]
 * @returns {String}
 */
function getButtonState(isHovered = false, isPressed = false) {
    if (isPressed) {
        return CONST.BUTTON_STATES.PRESSED;
    }

    if (isHovered) {
        return CONST.BUTTON_STATES.HOVERED;
    }

    return CONST.BUTTON_STATES.DEFAULT;
}

const propTypes = {
    icon: PropTypes.elementType.isRequired,
    text: PropTypes.string.isRequired,
    isMini: PropTypes.bool,
};

const defaultProps = {
    isMini: false,
};

const ReportActionContextMenuItem = (props) => {
    const {getButtonStyle, getIconFillColor} = getReportActionContextMenuItemStyles(props.isMini);
    return (
        <Tooltip text={props.text}>
            <Pressable style={({hovered, pressed}) => getButtonStyle(getButtonState(hovered, pressed))}>
                {({hovered, pressed}) => (
                    <Icon
                        src={props.icon}
                        fill={getIconFillColor(getButtonState(hovered, pressed))}
                    />
                )}
            </Pressable>
        </Tooltip>
    );
};


ReportActionContextMenuItem.propTypes = propTypes;
ReportActionContextMenuItem.defaultProps = defaultProps;
ReportActionContextMenuItem.displayName = 'ReportActionContextMenuItem';

export default memo(ReportActionContextMenuItem);
