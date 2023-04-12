import PropTypes from 'prop-types';
import CONST from '../CONST';
import participantPropTypes from './participantPropTypes';
import avatarPropTypes from './avatarPropTypes';

export default PropTypes.shape({
    // Text to display
    text: PropTypes.string,

    /** Display the text of the option in bold font style */
    boldStyle: PropTypes.bool,

    // Alternate text to display
    alternateText: PropTypes.string,

    // Alternate text number of lines
    alternateTextMaxLines: PropTypes.number,

    // Array of icon information
    icons: PropTypes.arrayOf(avatarPropTypes),

    // Login (only present when there is a single participant)
    login: PropTypes.string,

    // reportID (only present when there is a matching report)
    reportID: PropTypes.string,

    // Whether the report has a draft comment or not
    hasDraftComment: PropTypes.bool,

    // Key used internally by React
    keyForList: PropTypes.string,

    // Search text we use to filter options
    searchText: PropTypes.string,

    // Whether the report is pinned or not
    isPinned: PropTypes.bool,

    // Whether the report corresponds to a chat room
    isChatRoom: PropTypes.bool,

    // Whether the option has an outstanding IOU
    hasOutstandingIOU: PropTypes.bool,

    // Custom icon to render on the right side of the option
    customIcon: PropTypes.shape({
        // The icon source
        src: PropTypes.func,

        // The color of the icon
        color: PropTypes.string,
    }),

    // List of participants of the report
    participantsList: PropTypes.arrayOf(participantPropTypes),

    // Descriptive text to be displayed besides selection element
    descriptiveText: PropTypes.string,

    // The type of option we have e.g. user or report
    type: PropTypes.string,

    // Text to show for tooltip
    tooltipText: PropTypes.string,

    /** If we need to show a brick road indicator or not */
    brickRoadIndicator: PropTypes.oneOf([CONST.BRICK_ROAD_INDICATOR_STATUS.ERROR, '']),

    // Phone number
    phoneNumber: PropTypes.string,

    // PayPal.Me link
    payPalMeAddress: PropTypes.string,
});
