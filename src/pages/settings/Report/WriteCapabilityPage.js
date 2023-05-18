import React from 'react';
import _ from 'underscore';
import ScreenWrapper from '../../../components/ScreenWrapper';
import HeaderWithCloseButton from '../../../components/HeaderWithCloseButton';
import withLocalize, {withLocalizePropTypes} from '../../../components/withLocalize';
import styles from '../../../styles/styles';
import OptionsList from '../../../components/OptionsList';
import Navigation from '../../../libs/Navigation/Navigation';
import compose from '../../../libs/compose';
import withReportOrNotFound from '../../home/report/withReportOrNotFound';
import reportPropTypes from '../../reportPropTypes';
import ROUTES from '../../../ROUTES';
import * as Report from '../../../libs/actions/Report';
import * as Expensicons from '../../../components/Icon/Expensicons';
import themeColors from '../../../styles/themes/default';

const propTypes = {
    ...withLocalizePropTypes,

    /** The report for which we are setting write capability */
    report: reportPropTypes.isRequired,
};
const greenCheckmark = {src: Expensicons.Checkmark, color: themeColors.success};

const WriteCapabilityPage = (props) => {
    const writeCapabilityOptions = _.map(props.translate('reportSettings.writeCapability'), (preference, key) => ({
        value: key,
        text: preference,
        keyForList: key,

        // Include the green checkmark icon to indicate the currently selected value
        customIcon: key === props.report.writeCapability ? greenCheckmark : null,

        // This property will make the currently selected value have bold text
        boldStyle: key === props.report.writeCapability,
    }));

    return (
        <ScreenWrapper includeSafeAreaPaddingBottom={false}>
            <HeaderWithCloseButton
                title={props.translate('reportSettings.writeCapability.label')}
                shouldShowBackButton
                onBackButtonPress={() => Navigation.navigate(ROUTES.getReportSettingsRoute(props.report.reportID))}
                onCloseButtonPress={() => Navigation.dismissModal(true)}
            />
            <OptionsList
                sections={[{data: writeCapabilityOptions}]}
                onSelectRow={(option) => Report.updateWriteCapabilityAndNavigate(props.report.reportID, props.report.writeCapability, option.value)}
                hideSectionHeaders
                optionHoveredStyle={{
                    ...styles.hoveredComponentBG,
                    ...styles.mhn5,
                    ...styles.ph5,
                }}
                shouldHaveOptionSeparator
                shouldDisableRowInnerPadding
                contentContainerStyles={[styles.ph5]}
            />
        </ScreenWrapper>
    );
};

WriteCapabilityPage.displayName = 'WriteCapabilityPage';
WriteCapabilityPage.propTypes = propTypes;

export default compose(withLocalize, withReportOrNotFound)(WriteCapabilityPage);
