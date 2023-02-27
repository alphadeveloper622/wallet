import React from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import _ from 'underscore';
import styles from '../../styles/styles';
import FrequentlyUsed from '../../../assets/images/history.svg';
import Smiley from '../../../assets/images/emoji.svg';
import AnimalsAndNature from '../../../assets/images/emojiCategoryIcons/plant.svg';
import FoodAndDrink from '../../../assets/images/emojiCategoryIcons/hamburger.svg';
import TravelAndPlaces from '../../../assets/images/emojiCategoryIcons/plane.svg';
import Activities from '../../../assets/images/emojiCategoryIcons/soccer-ball.svg';
import Objects from '../../../assets/images/emojiCategoryIcons/light-bulb.svg';
import Symbols from '../../../assets/images/emojiCategoryIcons/peace-sign.svg';
import Flags from '../../../assets/images/emojiCategoryIcons/flag.svg';
import CategoryShortcutButton from './CategoryShortcutButton';
import getOperatingSystem from '../../libs/getOperatingSystem';
import CONST from '../../CONST';

const propTypes = {
    /** The function to call when an emoji is selected */
    onPress: PropTypes.func.isRequired,

    /** The emojis consisting emoji code and indices that the icons should link to */
    headerEmojis: PropTypes.arrayOf(PropTypes.number).isRequired,
};

const CategoryShortcutBar = (props) => {
    const icons = [Smiley, AnimalsAndNature, FoodAndDrink, TravelAndPlaces, Activities, Objects, Symbols, Flags];

    // If the user has frequently used emojis, there will be 9 headers, otherwise there will be 8
    // Or for Windows OS there will be 8 headers, otherwise there will be 7
    if (props.headerEmojis.length === 9 || (getOperatingSystem() === CONST.OS.WINDOWS && props.headerEmojis.length === 8)) {
        icons.unshift(FrequentlyUsed);
    }

    return (
        <View style={[styles.pt2, styles.ph4, styles.flexRow]}>
            {_.map(props.headerEmojis, (headerEmoji, i) => (
                <CategoryShortcutButton
                    icon={icons[i]}
                    onPress={() => props.onPress(headerEmoji.index)}
                    key={`categoryShortcut${i}`}
                    code={headerEmoji.code}
                />
            ))}
        </View>
    );
};
CategoryShortcutBar.propTypes = propTypes;
CategoryShortcutBar.displayName = 'CategoryShortcutBar';

export default CategoryShortcutBar;
