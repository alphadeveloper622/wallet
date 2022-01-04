import _ from 'underscore';
import lodashGet from 'lodash/get';
import React from 'react';
import {View, Image, ScrollView} from 'react-native';
import {withOnyx} from 'react-native-onyx';
import PropTypes from 'prop-types';
import HeaderWithCloseButton from '../../components/HeaderWithCloseButton';
import MenuItem from '../../components/MenuItem';
import * as Expensicons from '../../components/Icon/Expensicons';
import styles from '../../styles/styles';
import TextLink from '../../components/TextLink';
import Icon from '../../components/Icon';
import colors from '../../styles/colors';
import Navigation from '../../libs/Navigation/Navigation';
import CONST from '../../CONST';
import AddPlaidBankAccount from '../../components/AddPlaidBankAccount';
import CheckboxWithLabel from '../../components/CheckboxWithLabel';
import withLocalize, {withLocalizePropTypes} from '../../components/withLocalize';
import exampleCheckImage from './exampleCheckImage';
import Text from '../../components/Text';
import ExpensiTextInput from '../../components/ExpensiTextInput';
import * as BankAccounts from '../../libs/actions/BankAccounts';
import ONYXKEYS from '../../ONYXKEYS';
import compose from '../../libs/compose';
import * as ReimbursementAccountUtils from '../../libs/ReimbursementAccountUtils';
import ReimbursementAccountForm from './ReimbursementAccountForm';
import reimbursementAccountPropTypes from './reimbursementAccountPropTypes';
import WorkspaceSection from '../workspace/WorkspaceSection';
import * as ValidationUtils from '../../libs/ValidationUtils';
import * as Illustrations from '../../components/Icon/Illustrations';

import ExpensiForm from '../../components/ExpensiForm';
import ExpensiFormFormAlertWithSubmitButton from '../../components/ExpensiFormFormAlertWithSubmitButton';

const propTypes = {
    /** Bank account currently in setup */
    // eslint-disable-next-line react/no-unused-prop-types
    reimbursementAccount: reimbursementAccountPropTypes.isRequired,

    reimbursementAccountDraft: PropTypes.object,

    /** The OAuth URI + stateID needed to re-initialize the PlaidLink after the user logs into their bank */
    receivedRedirectURI: PropTypes.string,

    /** During the OAuth flow we need to use the plaidLink token that we initially connected with */
    plaidLinkOAuthToken: PropTypes.string,

    ...withLocalizePropTypes,
};

const defaultProps = {
    receivedRedirectURI: null,
    plaidLinkOAuthToken: '',
    reimbursementAccountDraft: {},
};

class BankAccountStep extends React.Component {
    constructor(props) {
        super(props);

        this.toggleTerms = this.toggleTerms.bind(this);
        this.addManualAccount = this.addManualAccount.bind(this);
        this.addPlaidAccount = this.addPlaidAccount.bind(this);
        this.state = {
            // One of CONST.BANK_ACCOUNT.SETUP_TYPE
            hasAcceptedTerms: ReimbursementAccountUtils.getDefaultStateForField(props, 'acceptTerms', true),
            // routingNumber: ReimbursementAccountUtils.getDefaultStateForField(props, 'routingNumber'),
            // accountNumber: ReimbursementAccountUtils.getDefaultStateForField(props, 'accountNumber'),
        };
    }

    toggleTerms() {
        this.setState((prevState) => {
            const hasAcceptedTerms = !prevState.hasAcceptedTerms;
            BankAccounts.updateReimbursementAccountDraft({acceptTerms: hasAcceptedTerms});
            return {hasAcceptedTerms};
        });
        this.clearError('hasAcceptedTerms');
    }

    /**
     * @returns {Boolean}
     */
    validate(values) {
        const errors = {};

        if (!CONST.BANK_ACCOUNT.REGEX.SWIFT_BIC.test(lodashGet(values, 'routingNumber', '').trim()) || !ValidationUtils.isValidRoutingNumber(lodashGet(values, 'routingNumber', ''))) {
            errors.routingNumber = 'reimbursementAccount.errors.routingNumber';
        }
        // These are taken from BankCountry.js in Web-Secure
        if (!CONST.BANK_ACCOUNT.REGEX.IBAN.test(lodashGet(values, 'accountNumber', '').trim())) {
            errors.accountNumber = 'reimbursementAccount.errors.accountNumber';
        }
        // if (!values.hasAcceptedTerms) {
        //     errors.hasAcceptedTerms = true;
        // }

        // BankAccounts.setBankAccountFormValidationErrors(errors);
        return errors;
    }

    addManualAccount(values, formFunctions) {
        // if (!this.validate()) {
        //     BankAccounts.showBankAccountErrorModal();
        //     return;
        // }

        BankAccounts.setupWithdrawalAccount({
            ...values,
            setupType: CONST.BANK_ACCOUNT.SETUP_TYPE.MANUAL,

            // Note: These are hardcoded as we're not supporting AU bank accounts for the free plan
            country: CONST.COUNTRY.US,
            currency: CONST.CURRENCY.USD,
            fieldsType: CONST.BANK_ACCOUNT.FIELDS_TYPE.LOCAL,
        }, formFunctions);
    }

    /**
     * @param {Object} params
     * @param {Object} params.account
     * @param {String} params.account.bankName
     * @param {Boolean} params.account.isSavings
     * @param {String} params.account.addressName
     * @param {String} params.account.ownershipType
     * @param {String} params.account.accountNumber
     * @param {String} params.account.routingNumber
     * @param {String} params.account.plaidAccountID
     */
    addPlaidAccount(params) {
        BankAccounts.setupWithdrawalAccount({
            acceptTerms: true,
            setupType: CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID,

            // Params passed via the Plaid callback when an account is selected
            plaidAccessToken: params.plaidLinkToken,
            accountNumber: params.account.accountNumber,
            routingNumber: params.account.routingNumber,
            plaidAccountID: params.account.plaidAccountID,
            ownershipType: params.account.ownershipType,
            isSavings: params.account.isSavings,
            bankName: params.bankName,
            addressName: params.account.addressName,
            mask: params.account.mask,

            // Note: These are hardcoded as we're not supporting AU bank accounts for the free plan
            country: CONST.COUNTRY.US,
            currency: CONST.CURRENCY.USD,
            fieldsType: CONST.BANK_ACCOUNT.FIELDS_TYPE.LOCAL,
        });
    }

    render() {
        // Disable bank account fields once they've been added in db so they can't be changed
        const isFromPlaid = this.props.achData.setupType === CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID;
        const shouldDisableInputs = Boolean(this.props.achData.bankAccountID) || isFromPlaid;
        const shouldReinitializePlaidLink = this.props.plaidLinkOAuthToken && this.props.receivedRedirectURI && this.props.achData.subStep !== CONST.BANK_ACCOUNT.SUBSTEP.MANUAL;
        const subStep = shouldReinitializePlaidLink ? CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID : this.props.achData.subStep;

        return (
            <View style={[styles.flex1, styles.justifyContentBetween]}>
                <HeaderWithCloseButton
                    title={this.props.translate('workspace.common.bankAccount')}
                    stepCounter={subStep ? {step: 1, total: 5} : undefined}
                    onCloseButtonPress={Navigation.dismissModal}
                    onBackButtonPress={() => {
                        // If we have a subStep then we will remove otherwise we will go back
                        if (subStep) {
                            BankAccounts.setBankAccountSubStep(null);
                            return;
                        }
                        Navigation.goBack();
                    }}
                    shouldShowBackButton
                />
                {!subStep && (
                    <ScrollView style={[styles.flex1]}>
                        <WorkspaceSection
                            icon={Illustrations.BankMouseGreen}
                            title={this.props.translate('workspace.bankAccount.streamlinePayments')}
                        />
                        <Text style={[styles.mh5, styles.mb5]}>
                            {this.props.translate('bankAccount.toGetStarted')}
                        </Text>
                        <MenuItem
                            icon={Expensicons.Bank}
                            title={this.props.translate('bankAccount.connectOnlineWithPlaid')}
                            onPress={() => BankAccounts.setBankAccountSubStep(CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID)}
                            disabled={this.props.isPlaidDisabled || !this.props.user.validated}
                            shouldShowRightIcon
                        />
                        {this.props.isPlaidDisabled && (
                            <Text style={[styles.formError, styles.mh5]}>
                                {this.props.translate('bankAccount.error.tooManyAttempts')}
                            </Text>
                        )}
                        <MenuItem
                            icon={Expensicons.Paycheck}
                            title={this.props.translate('bankAccount.connectManually')}
                            disabled={!this.props.user.validated}
                            onPress={() => BankAccounts.setBankAccountSubStep(CONST.BANK_ACCOUNT.SETUP_TYPE.MANUAL)}
                            shouldShowRightIcon
                        />
                        {!this.props.user.validated && (
                            <View style={[styles.flexRow, styles.alignItemsCenter, styles.m4]}>
                                <Text style={[styles.mutedTextLabel, styles.mr4]}>
                                    <Icon src={Expensicons.Exclamation} fill={colors.red} />
                                </Text>
                                <Text style={styles.mutedTextLabel}>
                                    {this.props.translate('bankAccount.validateAccountError')}
                                </Text>
                            </View>
                        )}
                        <View style={[styles.m5, styles.flexRow, styles.justifyContentBetween]}>
                            <TextLink href="https://use.expensify.com/privacy">
                                {this.props.translate('common.privacy')}
                            </TextLink>
                            <View style={[styles.flexRow, styles.alignItemsCenter]}>
                                <TextLink
                                    // eslint-disable-next-line max-len
                                    href="https://community.expensify.com/discussion/5677/deep-dive-how-expensify-protects-your-information/"
                                >
                                    {this.props.translate('bankAccount.yourDataIsSecure')}
                                </TextLink>
                                <View style={[styles.ml1]}>
                                    <Icon src={Expensicons.Lock} fill={colors.blue} />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                )}
                {subStep === CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID && (
                    <AddPlaidBankAccount
                        text={this.props.translate('bankAccount.plaidBodyCopy')}
                        onSubmit={this.addPlaidAccount}
                        onExitPlaid={() => BankAccounts.setBankAccountSubStep(null)}
                        receivedRedirectURI={this.props.receivedRedirectURI}
                        plaidLinkOAuthToken={this.props.plaidLinkOAuthToken}
                    />
                )}
                {subStep === CONST.BANK_ACCOUNT.SETUP_TYPE.MANUAL && (
                    <ExpensiForm
                        name={ONYXKEYS.REIMBURSEMENT_ACCOUNT}    
                        // defaultValues={this.props.reimbursementAccountDraft}
                        validate={this.validate}
                        onSubmit={this.addManualAccount}
                        style={[styles.flex1, styles.mh5]}
                    >
                        <Text style={[styles.mb5]}>
                            {this.props.translate('bankAccount.checkHelpLine')}
                        </Text>
                        <Image
                            resizeMode="contain"
                            style={[styles.exampleCheckImage, styles.mb5]}
                            source={exampleCheckImage(this.props.preferredLocale)}
                        />
                        <ExpensiTextInput
                            name="routingNumber"
                            label={this.props.translate('bankAccount.routingNumber')}
                            keyboardType={CONST.KEYBOARD_TYPE.NUMBER_PAD}
                            // value={this.state.routingNumber}
                            // onChangeText={value => this.clearErrorAndSetValue('routingNumber', value)}
                            disabled={shouldDisableInputs}
                            // errorText={this.getErrorText('routingNumber')}
                        />
                        <ExpensiTextInput
                            name="accountNumber"
                            containerStyles={[styles.mt4]}
                            label={this.props.translate('bankAccount.accountNumber')}
                            keyboardType={CONST.KEYBOARD_TYPE.NUMBER_PAD}
                            // value={this.state.accountNumber}
                            // onChangeText={value => this.clearErrorAndSetValue('accountNumber', value)}
                            disabled={shouldDisableInputs}
                            shouldSaveDraft={false}
                            // errorText={this.getErrorText('accountNumber')}
                        />
                        <CheckboxWithLabel
                            style={[styles.mb4, styles.mt5]}
                            isChecked={this.state.hasAcceptedTerms}
                            onPress={this.toggleTerms}
                            LabelComponent={() => (
                                <View style={[styles.flexRow, styles.alignItemsCenter]}>
                                    <Text>
                                        {this.props.translate('common.iAcceptThe')}
                                    </Text>
                                    <TextLink href="https://use.expensify.com/terms">
                                        {`Expensify ${this.props.translate('common.termsOfService')}`}
                                    </TextLink>
                                </View>
                            )}
                            // hasError={this.getErrors().hasAcceptedTerms}
                        />
                        <ExpensiFormFormAlertWithSubmitButton
                            success
                            pressOnEnter
                            buttonText={"Save & continue"}
                            // onPress={props.onSubmit}
                            // isDisabled={props.isDisabled}
                            // isLoading={props.isLoading}
                        />
                    </ExpensiForm>
                )}
            </View>
        );
    }
}

BankAccountStep.propTypes = propTypes;
BankAccountStep.defaultProps = defaultProps;

export default compose(
    withLocalize,
    withOnyx({
        reimbursementAccount: {
            key: ONYXKEYS.REIMBURSEMENT_ACCOUNT,
        },
        reimbursementAccountDraft: {
            key: `${ONYXKEYS.REIMBURSEMENT_ACCOUNT}_draft`,
        },
        user: {
            key: ONYXKEYS.USER,
        },
    }),
)(BankAccountStep);
