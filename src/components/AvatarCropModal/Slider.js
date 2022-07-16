import PropTypes from 'prop-types';
import React from 'react';
import {View} from 'react-native';
import {PanGestureHandler} from 'react-native-gesture-handler';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import styles from '../../styles/styles';
import gestureHandlerPropTypes from './gestureHandlerPropTypes';

const propTypes = {
    /** React-native-reanimated lib handler which executes when the user is panning slider */
    onGestureEventHandler: gestureHandlerPropTypes,

    /** X position of the slider knob */
    sliderValue: PropTypes.shape({value: PropTypes.number}),
};

const defaultProps = {
    onGestureEventHandler: () => {},
    sliderValue: {},
};

// This component can't be written using class since reanimated API uses hooks.
const Slider = (props) => {
    // A reanimated memoized style, which tracks
    // a translateX shared value and updates the slider position.
    const rSliderStyle = useAnimatedStyle(() => ({
        transform: [{translateX: props.sliderValue.value}],
    }));

    return (
        <View style={[styles.sliderLine]}>
            <PanGestureHandler onGestureEvent={props.onGestureEventHandler}>
                <Animated.View style={[styles.sliderKnob, rSliderStyle]} />
            </PanGestureHandler>
        </View>
    );
};

Slider.displayName = 'Slider';
Slider.propTypes = propTypes;
Slider.defaultProps = defaultProps;
export default Slider;
