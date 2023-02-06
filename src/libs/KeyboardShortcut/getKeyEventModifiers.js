import * as KeyCommand from 'react-native-key-command';

/**
 * Gets modifiers from a keyboard event.
 *
 * @param {Event} event
 * @returns {Array<String>}
 */
function getKeyEventModifiers(event) {
    if (event.modifierFlags === KeyCommand.constants.keyModifierControl) {
        return ['CONTROL'];
    }
    if (event.modifierFlags === KeyCommand.constants.keyModifierCommand) {
        return ['META'];
    }
    if (event.modifierFlags === KeyCommand.constants.keyModifierShiftControl) {
        return ['CMD', 'Shift'];
    }
    if (event.modifierFlags === KeyCommand.constants.keyModifierShiftCommand) {
        return ['CMD', 'Shift'];
    }

    return [];
}

export default getKeyEventModifiers;
