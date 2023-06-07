import React, {useCallback, useEffect, useRef, useMemo} from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import {withOnyx} from 'react-native-onyx';
import _ from 'underscore';
import lodashGet from 'lodash/get';
import MoneyRequestConfirmationList from '../../../components/MoneyRequestConfirmationList';
import CONST from '../../../CONST';
import ScreenWrapper from '../../../components/ScreenWrapper';
import styles from '../../../styles/styles';
import Navigation from '../../../libs/Navigation/Navigation';
import ROUTES from '../../../ROUTES';
import * as ReportScrollManager from '../../../libs/ReportScrollManager';
import * as IOU from '../../../libs/actions/IOU';
import compose from '../../../libs/compose';
import * as ReportUtils from '../../../libs/ReportUtils';
import * as OptionsListUtils from '../../../libs/OptionsListUtils';
import withLocalize from '../../../components/withLocalize';
import HeaderWithBackButton from '../../../components/HeaderWithBackButton';
import ONYXKEYS from '../../../ONYXKEYS';
import withCurrentUserPersonalDetails, {withCurrentUserPersonalDetailsDefaultProps, withCurrentUserPersonalDetailsPropTypes} from '../../../components/withCurrentUserPersonalDetails';
import reportPropTypes from '../../reportPropTypes';
import personalDetailsPropType from '../../personalDetailsPropType';

const propTypes = {
    report: reportPropTypes,

    /** Holds data related to Money Request view state, rather than the underlying Money Request data. */
    iou: PropTypes.shape({
        amount: PropTypes.number,
        currency: PropTypes.string,
        comment: PropTypes.string,
        participants: PropTypes.arrayOf(
            PropTypes.shape({
                login: PropTypes.string,
                isPolicyExpenseChat: PropTypes.bool,
                isOwnPolicyExpenseChat: PropTypes.bool,
                selected: PropTypes.bool,
            }),
        ),
    }),

    /** Personal details of all users */
    personalDetails: personalDetailsPropType,

    ...withCurrentUserPersonalDetailsPropTypes,
};

const defaultProps = {
    report: {},
    personalDetails: {},
    iou: {
        amount: 0,
        currency: CONST.CURRENCY.USD,
        comment: '',
        participants: [],
    },
    ...withCurrentUserPersonalDetailsDefaultProps,
};

const MoneyRequestConfirmPage = (props) => {
    const iouType = useRef(lodashGet(props.route, 'params.iouType', ''));
    const reportID = useRef(lodashGet(props.route, 'params.reportID', ''));

    // eslint-disable-next-line rulesdir/prefer-early-return
    useEffect(() => {
        if (_.isEmpty(props.iou.participants) || props.iou.amount === 0) {
            Navigation.goBack(ROUTES.getMoneyRequestRoute(iouType.current, reportID.current));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const navigateBack = () => {
        let fallback;
        if (reportID.current) {
            fallback = ROUTES.getMoneyRequestRoute(iouType.current, reportID.current);
        } else {
            fallback = ROUTES.getMoneyRequestParticipantsRoute(iouType.current);
        }
        Navigation.goBack(fallback);
    };

    const createTransaction = useCallback(
        (selectedParticipants) => {
            const trimmedComment = props.iou.comment.trim();

            // IOUs created from a group report will have a reportID param in the route.
            // Since the user is already viewing the report, we don't need to navigate them to the report
            if (iouType.current === CONST.IOU.MONEY_REQUEST_TYPE.SPLIT && CONST.REGEX.NUMBER.test(reportID.current)) {
                IOU.splitBill(selectedParticipants, props.currentUserPersonalDetails.login, props.iou.amount, trimmedComment, props.iou.currency, reportID.current);
                return;
            }

            // If the request is created from the global create menu, we also navigate the user to the group report
            if (iouType.current === CONST.IOU.MONEY_REQUEST_TYPE.SPLIT) {
                IOU.splitBillAndOpenReport(selectedParticipants, props.currentUserPersonalDetails.login, props.iou.amount, trimmedComment, props.iou.currency);
                return;
            }

            IOU.requestMoney(props.report, props.iou.amount, props.iou.currency, props.currentUserPersonalDetails.login, selectedParticipants[0], trimmedComment);
        },
        [props.iou.amount, props.iou.comment, props.currentUserPersonalDetails.login, props.iou.currency, props.report],
    );

    /**
     * Checks if user has a GOLD wallet then creates a paid IOU report on the fly
     *
     * @param {String} paymentMethodType
     */
    const sendMoney = useCallback(
        (paymentMethodType) => {
            const currency = props.iou.currency;
            const trimmedComment = props.iou.comment.trim();
            const participant = props.iou.participants[0];

            if (paymentMethodType === CONST.IOU.PAYMENT_TYPE.ELSEWHERE) {
                IOU.sendMoneyElsewhere(props.report, props.iou.amount, currency, trimmedComment, props.currentUserPersonalDetails.login, participant);
                return;
            }

            if (paymentMethodType === CONST.IOU.PAYMENT_TYPE.PAYPAL_ME) {
                IOU.sendMoneyViaPaypal(props.report, props.iou.amount, currency, trimmedComment, props.currentUserPersonalDetails.login, participant);
                return;
            }

            if (paymentMethodType === CONST.IOU.PAYMENT_TYPE.EXPENSIFY) {
                IOU.sendMoneyWithWallet(props.report, props.iou.amount, currency, trimmedComment, props.currentUserPersonalDetails.login, participant);
            }
        },
        [props.iou.amount, props.iou.comment, props.iou.participants, props.iou.currency, props.currentUserPersonalDetails.login, props.report],
    );

    const participants = useMemo(
        () =>
            lodashGet(props.iou, ['participants', 0, 'isPolicyExpenseChat'], false)
                ? OptionsListUtils.getPolicyExpenseReportOptions(props.iou.participants[0])
                : OptionsListUtils.getParticipantsOptions(props.iou.participants, props.personalDetails),
        // The rule can't recognize that we are accessing participants from props.iou, so let's ignore the warning
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.iou.participants, props.personalDetails],
    );

    return (
        <ScreenWrapper includeSafeAreaPaddingBottom={false}>
            {({safeAreaPaddingBottomStyle}) => (
                <View style={[styles.flex1, safeAreaPaddingBottomStyle]}>
                    <HeaderWithBackButton
                        title={props.translate('iou.cash')}
                        onBackButtonPress={navigateBack}
                    />
                    <MoneyRequestConfirmationList
                        hasMultipleParticipants={iouType.current === CONST.IOU.MONEY_REQUEST_TYPE.SPLIT}
                        participants={participants}
                        iouAmount={props.iou.amount}
                        onConfirm={(selectedParticipants) => {
                            createTransaction(selectedParticipants);
                            ReportScrollManager.scrollToBottom();
                        }}
                        onSendMoney={(paymentMethodType) => {
                            sendMoney(paymentMethodType);
                            ReportScrollManager.scrollToBottom();
                        }}
                        onSelectParticipant={(option) => {
                            const newParticipants = _.map(props.iou.participants, (participant) => {
                                if (participant.login === option.login) {
                                    return {...participant, selected: !participant.selected};
                                }
                                return participant;
                            });
                            IOU.setMoneyRequestParticipants(newParticipants);
                        }}
                        iouType={iouType.current}
                        reportID={reportID.current}
                        // The participants can only be modified when the action is initiated from directly within a group chat and not the floating-action-button.
                        // This is because when there is a group of people, say they are on a trip, and you have some shared expenses with some of the people,
                        // but not all of them (maybe someone skipped out on dinner). Then it's nice to be able to select/deselect people from the group chat bill
                        // split rather than forcing the user to create a new group, just for that expense. The reportID is empty, when the action was initiated from
                        // the floating-action-button (since it is something that exists outside the context of a report).
                        canModifyParticipants={!_.isEmpty(reportID.current)}
                        policyID={props.report.policyID}
                        bankAccountRoute={ReportUtils.getBankAccountRoute(props.report)}
                    />
                </View>
            )}
        </ScreenWrapper>
    );
};

MoneyRequestConfirmPage.displayName = 'MoneyRequestConfirmPage';
MoneyRequestConfirmPage.propTypes = propTypes;
MoneyRequestConfirmPage.defaultProps = defaultProps;

export default compose(
    withCurrentUserPersonalDetails,
    withLocalize,
    withOnyx({
        report: {
            key: ({route}) => `${ONYXKEYS.COLLECTION.REPORT}${lodashGet(route, 'params.reportID', '')}`,
        },
        iou: {
            key: ONYXKEYS.IOU,
        },
        personalDetails: {
            key: ONYXKEYS.PERSONAL_DETAILS,
        },
    }),
)(MoneyRequestConfirmPage);
