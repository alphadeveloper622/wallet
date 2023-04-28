import React, {
    useCallback,
    useEffect,
    useMemo,
    forwardRef,
} from 'react';
import {Pressable} from 'react-native';
import _ from 'underscore';
import Accessibility from '../../../libs/Accessibility';
import HapticFeedback from '../../../libs/HapticFeedback';
import KeyboardShortcut from '../../../libs/KeyboardShortcut';
import styles from '../../../styles/styles';
import cursor from '../../../styles/utilities/cursor';
import genericPressablePropTypes from './PropTypes';
import CONST from '../../../CONST';
import * as StyleUtils from '../../../styles/StyleUtils';

/**
 * Returns the cursor style based on the state of Pressable
 * @param {Boolean} isDisabled
 * @param {Boolean} isText
 * @returns {Object}
 */
const getCursorStyle = (isDisabled, isText) => {
    if (isDisabled) {
        return cursor.cursorDisabled;
    }

    if (isText) {
        return cursor.cursorText;
    }

    return cursor.cursorPointer;
};

const GenericPressable = forwardRef((props, ref) => {
    const {
        children,
        onPress,
        onLongPress,
        onKeyPress,
        disabled,
        style,
        accessibilityHint,
        shouldUseHapticsOnLongPress,
        shouldUseHapticsOnPress,
        nextFocusRef,
        keyboardShortcut,
        shouldUseAutoHitSlop,
        enableInScreenReaderStates,
        onPressIn,
        onPressOut,
        ...rest
    } = props;

    const isScreenReaderActive = Accessibility.useScreenReaderStatus();
    const [hitSlop, onLayout] = Accessibility.useAutoHitSlop();

    const isDisabled = useMemo(() => {
        let shouldBeDisabledByScreenReader = false;
        if (enableInScreenReaderStates === CONST.SCREEN_READER_STATES.ACTIVE) {
            shouldBeDisabledByScreenReader = !isScreenReaderActive;
        }

        if (enableInScreenReaderStates === CONST.SCREEN_READER_STATES.DISABLED) {
            shouldBeDisabledByScreenReader = isScreenReaderActive;
        }

        return props.disabled || shouldBeDisabledByScreenReader;
    }, [isScreenReaderActive, enableInScreenReaderStates, props.disabled]);

    const onLongPressHandler = useCallback(() => {
        if (isDisabled) {
            return;
        }
        if (!onLongPress) {
            return;
        }
        if (shouldUseHapticsOnLongPress) {
            HapticFeedback.longPress();
        }
        if (ref && ref.current) {
            ref.current.blur();
        }
        onLongPress();

        Accessibility.moveAccessibilityFocus(nextFocusRef);
    }, [shouldUseHapticsOnLongPress, onLongPress, nextFocusRef, ref, isDisabled]);

    const onPressHandler = useCallback(() => {
        if (isDisabled) {
            return;
        }
        if (shouldUseHapticsOnPress) {
            HapticFeedback.press();
        }
        if (ref && ref.current) {
            ref.current.blur();
        }
        onPress();

        Accessibility.moveAccessibilityFocus(nextFocusRef);
    }, [shouldUseHapticsOnPress, onPress, nextFocusRef, ref, isDisabled]);

    const onKeyPressHandler = useCallback((event) => {
        if (event.key !== 'Enter') {
            return;
        }
        onPressHandler();
    }, [onPressHandler]);

    useEffect(() => {
        if (!keyboardShortcut) {
            return () => {};
        }
        const {shortcutKey, descriptionKey, modifiers} = keyboardShortcut;
        return KeyboardShortcut.subscribe(shortcutKey, onPressHandler, descriptionKey, modifiers, true, false, 0, false);
    }, [keyboardShortcut, onPressHandler]);

    return (
        <Pressable
            hitSlop={shouldUseAutoHitSlop && hitSlop}
            onLayout={onLayout}
            ref={ref}
            onPress={!isDisabled && onPressHandler}
            onLongPress={!isDisabled && onLongPressHandler}
            onKeyPress={!isDisabled && onKeyPressHandler}
            onPressIn={!isDisabled && onPressIn}
            onPressOut={!isDisabled && onPressOut}
            style={state => [
                getCursorStyle(isDisabled, [props.accessibilityRole, props.role].includes('text')),
                props.style,
                isScreenReaderActive && StyleUtils.parseStyleFromFunction(props.screenReaderActiveStyle, state),
                state.focused && StyleUtils.parseStyleFromFunction(props.focusStyle, state),
                state.hovered && StyleUtils.parseStyleFromFunction(props.hoverStyle, state),
                state.pressed && StyleUtils.parseStyleFromFunction(props.pressStyle, state),
                isDisabled && [...StyleUtils.parseStyleFromFunction(props.disabledStyle, state), styles.noSelect],
            ]}

            // accessibility props
            accessibilityState={{
                disabled: isDisabled,
                ...props.accessibilityState,
            }}
            aria-disabled={isDisabled}
            aria-keyshortcuts={keyboardShortcut && `${keyboardShortcut.modifiers}+${keyboardShortcut.shortcutKey}`}

            // ios-only form of inputs
            onMagicTap={!isDisabled && onPressHandler}
            onAccessibilityTap={!isDisabled && onPressHandler}

            // eslint-disable-next-line react/jsx-props-no-spreading
            {...rest}
        >
            {state => (_.isFunction(props.children) ? props.children({...state, isScreenReaderActive, isDisabled}) : props.children)}
        </Pressable>
    );
});

GenericPressable.displayName = 'GenericPressable';
GenericPressable.propTypes = genericPressablePropTypes.pressablePropTypes;
GenericPressable.defaultProps = genericPressablePropTypes.defaultProps;

export default GenericPressable;
