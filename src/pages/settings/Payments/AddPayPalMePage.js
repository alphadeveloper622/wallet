import React, {useState} from 'react';
import {View} from 'react-native';
import _ from 'underscore';
import CONST from '../../../CONST';
import ROUTES from '../../../ROUTES';
import HeaderWithCloseButton from '../../../components/HeaderWithCloseButton';
import Text from '../../../components/Text';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Navigation from '../../../libs/Navigation/Navigation';
import styles from '../../../styles/styles';
import withLocalize, {withLocalizePropTypes} from '../../../components/withLocalize';
import Button from '../../../components/Button';
import FixedFooter from '../../../components/FixedFooter';
import Growl from '../../../libs/Growl';
import TextInput from '../../../components/TextInput';
import * as ValidationUtils from '../../../libs/ValidationUtils';
import * as User from '../../../libs/actions/User';

const AddPayPalMePage = (props) => {

    const [payPalMeUsername, setPayPalMeUsername] = useState('');
    const [payPalMeUsernameError, setPayPalMeUsernameError] = useState(false);

    /**
     * Sets the payPalMe username and error data for the current user
     */
    const setPayPalMeData = () => {
        if (!ValidationUtils.isValidPaypalUsername(payPalMeUsername)) {
            setPayPalMeUsernameError(true);
            return;
        }
        setPayPalMeUsernameError(false);
        User.addPaypalMeAddress(payPalMeUsername);

        Growl.show(props.translate('addPayPalMePage.growlMessageOnSave'), CONST.GROWL.SUCCESS, 3000);
        Navigation.navigate(ROUTES.SETTINGS_PAYMENTS);
    };

    focusPayPalMeInput() {
        if (!this.payPalMeInputRef) {
            return;
        }

        this.payPalMeInputRef.focus();
    }

    return (
        <ScreenWrapper onEntryTransitionEnd={this.focusPayPalMeInput}>
            <HeaderWithCloseButton
                title={this.props.translate('common.payPalMe')}
                shouldShowBackButton
                onBackButtonPress={() => Navigation.navigate(ROUTES.SETTINGS_PAYMENTS)}
                onCloseButtonPress={() => Navigation.dismissModal(true)}
            />
            <View style={[styles.flex1, styles.p5]}>
                <View style={[styles.flex1]}>
                    <Text style={[styles.mb4]}>
                        {this.props.translate('addPayPalMePage.enterYourUsernameToGetPaidViaPayPal')}
                    </Text>
                    <TextInput
                        ref={el => this.payPalMeInputRef = el}
                        label={this.props.translate('addPayPalMePage.payPalMe')}
                        autoCompleteType="off"
                        autoCorrect={false}
                        value={payPalMeUsername}
                        placeholder={this.props.translate('addPayPalMePage.yourPayPalUsername')}
                        onChangeText={(text) => { setPayPalMeUsername(text); setPayPalMeUsernameError(false); }}
                        returnKeyType="done"
                        hasError={payPalMeUsernameError}
                        errorText={payPalMeUsernameError ? this.props.translate('addPayPalMePage.formatError') : ''}
                    />
                </View>
            </View>
            <FixedFooter>
                <Button
                    success
                    onPress={setPayPalMeData}
                    pressOnEnter
                    style={[styles.mt3]}
                    isDisabled={_.isEmpty(payPalMeUsername.trim())}
                    text={this.props.translate('addPayPalMePage.addPayPalAccount')}
                />
            </FixedFooter>
        </ScreenWrapper>
    );
}

AddPayPalMePage.propTypes = {...withLocalizePropTypes};
AddPayPalMePage.displayName = 'AddPayPalMePage';

export default withLocalize(AddPayPalMePage);
