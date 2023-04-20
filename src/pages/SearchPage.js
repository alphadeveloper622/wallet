import _ from 'underscore';
import React, {Component} from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import OptionsSelector from '../components/OptionsSelector';
import * as OptionsListUtils from '../libs/OptionsListUtils';
import ONYXKEYS from '../ONYXKEYS';
import styles from '../styles/styles';
import Navigation from '../libs/Navigation/Navigation';
import ROUTES from '../ROUTES';
import withWindowDimensions, {windowDimensionsPropTypes} from '../components/withWindowDimensions';
import * as Report from '../libs/actions/Report';
import HeaderWithCloseButton from '../components/HeaderWithCloseButton';
import ScreenWrapper from '../components/ScreenWrapper';
import Timing from '../libs/actions/Timing';
import CONST from '../CONST';
import withLocalize, {withLocalizePropTypes} from '../components/withLocalize';
import compose from '../libs/compose';
import personalDetailsPropType from './personalDetailsPropType';
import reportPropTypes from './reportPropTypes';
import Performance from '../libs/Performance';
import FullScreenLoadingIndicator from '../components/FullscreenLoadingIndicator';

const propTypes = {
    /* Onyx Props */

    /** Beta features list */
    betas: PropTypes.arrayOf(PropTypes.string),

    /** All of the personal details for everyone */
    personalDetails: personalDetailsPropType,

    /** All reports shared with the user */
    reports: PropTypes.objectOf(reportPropTypes),

    /** Indicates whether report data is ready */
    isLoadingReportData: PropTypes.bool,

    /** Window Dimensions Props */
    ...windowDimensionsPropTypes,

    ...withLocalizePropTypes,
};

const defaultProps = {
    betas: [],
    personalDetails: {},
    reports: {},
    isLoadingReportData: true,
};

class SearchPage extends Component {
    constructor(props) {
        super(props);

        Timing.start(CONST.TIMING.SEARCH_RENDER);
        Performance.markStart(CONST.TIMING.SEARCH_RENDER);

        this.searchRendered = this.searchRendered.bind(this);
        this.selectReport = this.selectReport.bind(this);
        this.onChangeText = this.onChangeText.bind(this);
        this.debouncedUpdateOptions = _.debounce(this.updateOptions.bind(this), 75);

        const {
            recentReports,
            personalDetails,
            userToInvite,
        } = OptionsListUtils.getSearchOptions(
            props.reports,
            props.personalDetails,
            '',
            props.betas,
        );

        this.state = {
            searchValue: '',
            headerMessage: '',
            recentReports,
            personalDetails,
            userToInvite,
        };
    }

    componentDidUpdate(prevProps) {
        if (_.isEqual(prevProps.reports, this.props.reports) && _.isEqual(prevProps.personalDetails, this.props.personalDetails)) {
            return;
        }
        this.updateOptions();
    }

    onChangeText(searchValue = '') {
        this.setState({searchValue}, this.debouncedUpdateOptions);
    }

    /**
     * Returns the sections needed for the OptionsSelector
     *
     * @returns {Array}
     */
    getSections() {
        const sections = [];
        let indexOffset = 0;

        if (this.state.recentReports.length > 0) {
            sections.push(({
                data: this.state.recentReports,
                shouldShow: true,
                indexOffset,
            }));
            indexOffset += this.state.recentReports.length;
        }

        if (this.state.personalDetails.length > 0) {
            sections.push(({
                data: this.state.personalDetails,
                shouldShow: true,
                indexOffset,
            }));
            indexOffset += this.state.recentReports.length;
        }

        if (this.state.userToInvite) {
            sections.push(({
                data: [this.state.userToInvite],
                shouldShow: true,
                indexOffset,
            }));
        }

        return sections;
    }

    searchRendered() {
        Timing.end(CONST.TIMING.SEARCH_RENDER);
        Performance.markEnd(CONST.TIMING.SEARCH_RENDER);
    }

    updateOptions() {
        const {
            recentReports,
            personalDetails,
            userToInvite,
        } = OptionsListUtils.getSearchOptions(
            this.props.reports,
            this.props.personalDetails,
            this.state.searchValue.trim(),
            this.props.betas,
        );
        this.setState((prevState) => {
            const headerMessage = OptionsListUtils.getHeaderMessage(
                (recentReports.length + personalDetails.length) !== 0,
                Boolean(userToInvite),
                prevState.searchValue,
            );
            return ({
                headerMessage,
                userToInvite,
                recentReports,
                personalDetails,
            });
        });
    }

    /**
     * Reset the search value and redirect to the selected report
     *
     * @param {Object} option
     */
    selectReport(option) {
        if (!option) {
            return;
        }

        if (option.reportID) {
            this.setState({
                searchValue: '',
            }, () => {
                Navigation.navigate(ROUTES.getReportRoute(option.reportID));
            });
        } else {
            Report.navigateToAndOpenReport([option.login]);
        }
    }

    render() {
        const sections = this.getSections();
        return (
            <ScreenWrapper includeSafeAreaPaddingBottom={false}>
                {({didScreenTransitionEnd, safeAreaPaddingBottomStyle}) => (
                    <>
                        <HeaderWithCloseButton
                            title={this.props.translate('common.search')}
                            onCloseButtonPress={() => Navigation.dismissModal(true)}
                        />
                        <View style={[styles.flex1, styles.w100, styles.pRelative]}>
                            {didScreenTransitionEnd ? (
                                <OptionsSelector
                                    sections={sections}
                                    value={this.state.searchValue}
                                    onSelectRow={this.selectReport}
                                    onChangeText={this.onChangeText}
                                    headerMessage={this.state.headerMessage}
                                    hideSectionHeaders
                                    showTitleTooltip
                                    shouldShowOptions={!this.props.isLoadingReportData}
                                    placeholderText={this.props.translate('optionsSelector.nameEmailOrPhoneNumber')}
                                    onLayout={this.searchRendered}
                                    safeAreaPaddingBottomStyle={safeAreaPaddingBottomStyle}
                                />
                            ) : (
                                <FullScreenLoadingIndicator />
                            )}
                        </View>
                    </>
                )}
            </ScreenWrapper>
        );
    }
}

SearchPage.propTypes = propTypes;
SearchPage.defaultProps = defaultProps;

export default compose(
    withLocalize,
    withWindowDimensions,
    withOnyx({
        reports: {
            key: ONYXKEYS.COLLECTION.REPORT,
        },
        personalDetails: {
            key: ONYXKEYS.PERSONAL_DETAILS,
        },
        betas: {
            key: ONYXKEYS.BETAS,
        },
        isLoadingReportData: {
            key: ONYXKEYS.IS_LOADING_REPORT_DATA,
        },
    }),
)(SearchPage);
