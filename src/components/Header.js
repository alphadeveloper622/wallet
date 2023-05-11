import React from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import _ from 'underscore';
import styles from '../styles/styles';
import Text from './Text';

const propTypes = {
    /** Title of the Header */
    title: PropTypes.string.isRequired,

    /** Subtitle of the header */
    subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),

    /** Additional text styles */
    // eslint-disable-next-line react/forbid-prop-types
    textStyles: PropTypes.arrayOf(PropTypes.object),
};

const defaultProps = {
    subtitle: '',
    textStyles: [],
};
const Header = (props) => (
    <View style={[styles.flex1, styles.flexRow]}>
        <View style={styles.mw100}>
            <Text
                numberOfLines={2}
                style={[styles.headerText, styles.textLarge, ...props.textStyles]}
            >
                {props.title}
            </Text>
            {/* If there's no subtitle then display a fragment to avoid an empty space which moves the main title */}
            {_.isString(props.subtitle)
                ? Boolean(props.subtitle) && (
                      <Text
                          style={[styles.mutedTextLabel, styles.pre]}
                          numberOfLines={1}
                      >
                          {props.subtitle}
                      </Text>
                  )
                : props.subtitle}
        </View>
    </View>
);

Header.displayName = 'Header';
Header.propTypes = propTypes;
Header.defaultProps = defaultProps;
export default Header;
