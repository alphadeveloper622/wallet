import {useCallback, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {Animated, Easing, StatusBar, StyleSheet} from 'react-native';
import BootSplash from '../../libs/BootSplash';
import Logo from '../../../assets/images/new-expensify-dark.svg';
import styles from '../../styles/styles';

const propTypes = {
    /** Splash screen has been hidden */
    onHide: PropTypes.func,
};

const defaultProps = {
    onHide: () => {},
};

const SplashScreenHider = (props) => {
    const {onHide} = props;

    const [opacity] = useState(() => new Animated.Value(1));
    const [scale] = useState(() => new Animated.Value(1));
    const hideHasBeenCalled = useRef(false);

    const hide = useCallback(() => {
        // hide can only be called once
        if (hideHasBeenCalled.current) {
            return;
        }

        hideHasBeenCalled.current = true;

        BootSplash.hide().then(() => {
            Animated.timing(scale, {
                duration: 200,
                easing: Easing.back(2),
                toValue: 0,
                useNativeDriver: true,
            }).start();

            Animated.timing(opacity, {
                duration: 250,
                easing: Easing.out(Easing.ease),
                toValue: 0,
                useNativeDriver: true,
            }).start(() => {
                onHide();
            });
        });
    }, [opacity, scale, onHide]);

    return (
        <Animated.View
            onLayout={hide}
            style={[
                StyleSheet.absoluteFill,
                styles.splashScreenHider,
                {
                    opacity,

                    // Apply negative margins to center the logo on window (instead of screen)
                    marginTop: -(StatusBar.currentHeight || 0),
                    marginBottom: -(BootSplash.navigationBarHeight || 0),
                },
            ]}
        >
            <Animated.View
                style={{
                    transform: [{scale}],
                }}
            >
                <Logo
                    viewBox="0 0 100 100"
                    width={100}
                    height={100}
                />
            </Animated.View>
        </Animated.View>
    );
};

SplashScreenHider.displayName = 'SplashScreenHider';
SplashScreenHider.propTypes = propTypes;
SplashScreenHider.defaultProps = defaultProps;

export default SplashScreenHider;
