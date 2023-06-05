import React, {useEffect} from 'react';
import {View} from 'react-native';
import {withOnyx} from 'react-native-onyx';
import PropTypes from 'prop-types';
import lodashGet from 'lodash/get';
import withLocalize, {withLocalizePropTypes} from '../../components/withLocalize';
import compose from '../../libs/compose';
import HeaderWithCloseButton from '../../components/HeaderWithCloseButton';
import Navigation from '../../libs/Navigation/Navigation';
import ScreenWrapper from '../../components/ScreenWrapper';
import styles from '../../styles/styles';
import ONYXKEYS from '../../ONYXKEYS';
import Permissions from '../../libs/Permissions';
import ROUTES from '../../ROUTES';
import MenuItemWithTopDescription from '../../components/MenuItemWithTopDescription';
import reportPropTypes from '../reportPropTypes';
import * as TaskUtils from '../../libs/actions/Task';
import * as OptionsListUtils from '../../libs/OptionsListUtils';
import FormAlertWithSubmitButton from '../../components/FormAlertWithSubmitButton';

const propTypes = {
    /** Task Creation Data */
    task: PropTypes.shape({
        assignee: PropTypes.string,
        shareDestination: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
        parentReportID: PropTypes.string,
    }),

    /** Beta features list */
    betas: PropTypes.arrayOf(PropTypes.string),

    /** All of the personal details for everyone */
    personalDetails: PropTypes.objectOf(
        PropTypes.shape({
            /** Display name of the person */
            displayName: PropTypes.string,

            /** Avatar URL of the person */
            avatar: PropTypes.string,

            /** Login of the person */
            login: PropTypes.string,
        }),
    ),

    /** Current user session */
    session: PropTypes.shape({
        email: PropTypes.string.isRequired,
    }),

    /** All reports shared with the user */
    reports: PropTypes.objectOf(reportPropTypes),

    ...withLocalizePropTypes,
};

const defaultProps = {
    betas: [],
    task: {},
    personalDetails: {},
    reports: {},
    session: {},
};

const NewTaskPage = (props) => {
    const [assignee, setAssignee] = React.useState({});
    const [shareDestination, setShareDestination] = React.useState({});
    const [submitError, setSubmitError] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState(props.translate('newTaskPage.confirmError'));
    const [parentReport, setParentReport] = React.useState({});

    useEffect(() => {
        setSubmitError(false);

        // If we have an assignee, we want to set the assignee data
        // If there's an issue with the assignee chosen, we want to notify the user
        if (props.task.assignee) {
            const assigneeDetails = lodashGet(OptionsListUtils.getPersonalDetailsForLogins([props.task.assignee], props.personalDetails), props.task.assignee);
            if (!assigneeDetails) {
                setSubmitError(true);
                return setErrorMessage(props.translate('newTaskPage.assigneeError'));
            }
            const displayDetails = TaskUtils.getAssignee(assigneeDetails);
            setAssignee(displayDetails);
        }

        // We only set the parentReportID if we are creating a task from a report
        // this allows us to go ahead and set that report as the share destination
        // and disable the share destination selector
        if (props.task.parentReportID) {
            TaskUtils.setShareDestinationValue(props.task.parentReportID);
        }

        // If we have a share destination, we want to set the parent report and
        // the share destination data
        if (props.task.shareDestination) {
            setParentReport(lodashGet(props.reports, `report_${props.task.shareDestination}`, {}));
            const displayDetails = TaskUtils.getShareDestination(props.task.shareDestination, props.reports, props.personalDetails);
            setShareDestination(displayDetails);
        }
    }, [props]);

    // On submit, we want to call the createTask function and wait to validate
    // the response
    function onSubmit() {
        if (!props.task.title || !props.task.shareDestination) {
            setSubmitError(true);
            return;
        }

        TaskUtils.createTaskAndNavigate(props.session.email, parentReport.reportID, props.task.title, props.task.description, props.task.assignee);
    }

    if (!Permissions.canUseTasks(props.betas)) {
        Navigation.dismissModal();
        return null;
    }

    return (
        <ScreenWrapper>
            <HeaderWithCloseButton
                title={props.translate('newTaskPage.confirmTask')}
                onCloseButtonPress={() => Navigation.dismissModal()}
                shouldShowBackButton
                onBackButtonPress={() => Navigation.goBack()}
            />
            <View style={[styles.mt5, styles.containerWithSpaceBetween]}>
                <View style={styles.mb5}>
                    <MenuItemWithTopDescription
                        description={props.translate('newTaskPage.title')}
                        title={props.task.title}
                        onPress={() => Navigation.navigate(ROUTES.NEW_TASK_TITLE)}
                        shouldShowRightIcon
                    />
                    <MenuItemWithTopDescription
                        description={props.translate('newTaskPage.description')}
                        title={props.task.description}
                        onPress={() => Navigation.navigate(ROUTES.NEW_TASK_DESCRIPTION)}
                        shouldShowRightIcon
                    />
                    <MenuItemWithTopDescription
                        label={assignee.displayName ? props.translate('newTaskPage.assignee') : ''}
                        description={assignee.displayName ? assignee.displayName : props.translate('newTaskPage.assignee')}
                        title={assignee.subtitle || ''}
                        icon={assignee.icons}
                        onPress={() => Navigation.navigate(ROUTES.NEW_TASK_ASSIGNEE)}
                        shouldShowRightIcon
                    />
                </View>
                <View style={styles.mb5}>
                    <MenuItemWithTopDescription
                        label={shareDestination.displayName ? props.translate('newTaskPage.shareSomewhere') : ''}
                        description={shareDestination.displayName ? shareDestination.displayName : props.translate('newTaskPage.shareSomewhere')}
                        title={shareDestination.subtitle || ''}
                        icon={shareDestination.icons}
                        onPress={() => Navigation.navigate(ROUTES.NEW_TASK_SHARE_DESTINATION)}
                        shouldShowRightIcon
                    />
                </View>
                <FormAlertWithSubmitButton
                    isAlertVisible={submitError}
                    message={errorMessage}
                    onSubmit={() => onSubmit()}
                    enabledWhenOffline
                    buttonText={props.translate('newTaskPage.confirmTask')}
                    containerStyles={[styles.mh0, styles.mt5, styles.flex1, styles.ph5]}
                />
            </View>
        </ScreenWrapper>
    );
};

NewTaskPage.displayName = 'NewTaskPage';
NewTaskPage.propTypes = propTypes;
NewTaskPage.defaultProps = defaultProps;

export default compose(
    withOnyx({
        betas: {
            key: ONYXKEYS.BETAS,
        },
        task: {
            key: ONYXKEYS.TASK,
        },
        reports: {
            key: ONYXKEYS.COLLECTION.REPORT,
        },
        personalDetails: {
            key: ONYXKEYS.PERSONAL_DETAILS,
        },
        session: {
            key: ONYXKEYS.SESSION,
        },
    }),
    withLocalize,
)(NewTaskPage);
