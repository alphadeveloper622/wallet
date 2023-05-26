import React from 'react';
import {View, Text} from 'react-native';
import Button from './Button';
import AvatarWithDisplayName from './AvatarWithDisplayName';
import ExpensifyWordmark from './ExpensifyWordmark';
import compose from '../libs/compose';
import withWindowDimensions, {windowDimensionsPropTypes} from './withWindowDimensions';
import withLocalize, {withLocalizePropTypes} from './withLocalize';
import reportPropTypes from '../pages/reportPropTypes';
import CONST from '../CONST';
import styles from '../styles/styles';

const propTypes = {
    /** The report currently being looked at */
    report: reportPropTypes,

    ...windowDimensionsPropTypes,
    ...withLocalizePropTypes,
};

const defaultProps = {
    report: null,
};

const AnonymousReportFooter = (props) => (
    <View style={styles.anonymousRoomFooter}>
        <View>
            <AvatarWithDisplayName
                report={props.report}
                size={CONST.AVATAR_SIZE.MEDIUM}
            />
        </View>
        <View style={[styles.flexRow, styles.alignItemsCenter]}>
            <View style={styles.mr2}>
                <View style={[props.isSmallScreenWidth ? styles.alignItemsStart : styles.alignItemsEnd]}>
                    <ExpensifyWordmark style={styles.anonymousRoomFooterLogo} />
                </View>
                <Text style={[styles.textNormal, styles.textWhite]}>{props.translate('anonymousReportFooter.logoTagline')}</Text>
            </View>
            <View style={styles.anonymousRoomFooterSignInButton}>
                <Button
                    medium
                    success
                    text={props.translate('common.signIn')}
                />
            </View>
        </View>
    </View>
);

AnonymousReportFooter.propTypes = propTypes;
AnonymousReportFooter.defaultProps = defaultProps;
AnonymousReportFooter.displayName = 'AnonymousReportFooter';

export default compose(withWindowDimensions, withLocalize)(AnonymousReportFooter);
