import PropTypes from 'prop-types';
import moment from 'moment';
import CONST from '../../CONST';

const calendarPickerPropType = {
    /** An initial value of date */
    value: PropTypes.objectOf(Date),

    /** A minimum date (oldest) allowed to select */
    minDate: PropTypes.objectOf(Date),

    /** A maximum date (earliest) allowed to select */
    maxDate: PropTypes.objectOf(Date),

    /** Default year to be set in the calendar picker. Used with navigation to set the correct year after going back to the view with calendar */
    defaultYear: PropTypes.string,

    /** A function that is called when the date changed inside the calendar component */
    onChanged: PropTypes.func,

    /** A function called when the date is selected */
    onSelected: PropTypes.func,

    /** Callback function to call when year is pressed */
    onYearPressed: PropTypes.func,
};

const defaultCalendarPickerPropType = {
    value: new Date(),
    minDate: moment().year(CONST.CALENDAR_PICKER.MIN_YEAR).toDate(),
    maxDate: moment().year(CONST.CALENDAR_PICKER.MAX_YEAR).toDate(),
    defaultYear: null,
    onChanged: () => {},
    onSelected: () => {},
    onYearPressed: () => {},
};

export {calendarPickerPropType, defaultCalendarPickerPropType};
