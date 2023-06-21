import _ from 'underscore';
import React from 'react';
import {View, ScrollView} from 'react-native';
import HeaderWithBackButton from '../../components/HeaderWithBackButton';
import Navigation from '../../libs/Navigation/Navigation';
import ROUTES from '../../ROUTES';
import styles from '../../styles/styles';
import Text from '../../components/Text';
import ScreenWrapper from '../../components/ScreenWrapper';
import withLocalize, {withLocalizePropTypes} from '../../components/withLocalize';
import withWindowDimensions, {windowDimensionsPropTypes} from '../../components/withWindowDimensions';
import MenuItem from '../../components/MenuItem';
import compose from '../../libs/compose';
import * as Illustrations from '../../components/Icon/Illustrations';

const propTypes = {
    ...withLocalizePropTypes,
    ...windowDimensionsPropTypes,
};

const menuItems = [
    {
        translationKey: 'loungeAccessPage.coffeePromo',
        icon: Illustrations.CoffeeMug,
    },
    {
        translationKey: 'loungeAccessPage.networkingPromo',
        icon: Illustrations.ChatBubbles,
    },
    {
        translationKey: 'loungeAccessPage.viewsPromo',
        icon: Illustrations.SanFrancisco,
    },
];

function LoungeAccessPage(props) {
    const illustrationStyle = props.isSmallScreenWidth
        ? {
              width: props.windowWidth,
              height: 0.64 * props.windowWidth,
          }
        : {};

    return (
        <ScreenWrapper includeSafeAreaPaddingBottom={false}>
            {({safeAreaPaddingBottomStyle}) => (
                <>
                    <HeaderWithBackButton
                        title={props.translate('loungeAccessPage.loungeAccess')}
                        onBackButtonPress={() => Navigation.goBack(ROUTES.SETTINGS)}
                    />
                    <ScrollView contentContainerStyle={safeAreaPaddingBottomStyle}>
                        <View style={illustrationStyle}>
                            <Illustrations.Lounge />
                        </View>
                        <View style={styles.pageWrapperNotCentered}>
                            <Text
                                style={[styles.textHeadline, styles.preWrap, styles.mb2]}
                                numberOfLines={2}
                            >
                                {props.translate('loungeAccessPage.headline')}
                            </Text>
                            <Text style={styles.baseFontStyle}>{props.translate('loungeAccessPage.description')}</Text>
                        </View>
                        {_.map(menuItems, (item) => (
                            <MenuItem
                                key={item.translationKey}
                                title={props.translate(item.translationKey)}
                                icon={item.icon}
                                iconWidth={60}
                                iconHeight={60}
                                iconStyles={[styles.mr3, styles.ml3]}
                            />
                        ))}
                    </ScrollView>
                </>
            )}
        </ScreenWrapper>
    );
}

LoungeAccessPage.propTypes = propTypes;
LoungeAccessPage.displayName = 'LoungeAccessPage';

export default compose(withLocalize, withWindowDimensions)(LoungeAccessPage);
