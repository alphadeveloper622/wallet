import React from 'react';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import PropTypes from 'prop-types';
import * as StyleUtils from '../styles/StyleUtils';

const propTypes = {
    // Should we dim the view
    shouldDim: PropTypes.bool.isRequired,

    // Content to render
    children: PropTypes.node.isRequired,

    // Array of style objects
    // eslint-disable-next-line react/forbid-prop-types
    style: PropTypes.arrayOf(PropTypes.object),

    // The value to use for the opacity when the view is dimmed
    dimmingValue: PropTypes.number,
};

const defaultProps = {
    style: [],
    dimmingValue: 0.5,
};

const OpacityView = (props) => {
    const opacity = useSharedValue(1);
    const opacityStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    React.useEffect(() => {
        if (props.shouldDim) {
            opacity.value = withTiming(props.dimmingValue, {duration: 50});
        } else {
            opacity.value = withTiming(1, {duration: 50});
        }
    }, [props.shouldDim, props.dimmingValue, opacity]);

    return (
        <Animated.View
            style={[opacityStyle, ...StyleUtils.parseStyleAsArray(props.style)]}
        >
            {props.children}
        </Animated.View>
    );
};

OpacityView.displayName = 'OpacityView';
OpacityView.propTypes = propTypes;
OpacityView.defaultProps = defaultProps;
export default OpacityView;
