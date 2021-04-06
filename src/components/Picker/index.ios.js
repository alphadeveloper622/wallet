import React from 'react';
import RNPickerSelect from 'react-native-picker-select';

import styles from '../../styles/styles';
import * as pickerPropTypes from './pickerPropTypes';

const Picker = ({
    onChange,
    items,
    useDisabledStyles,
    placeholder,
    value,
    icon,
}) => (
    <RNPickerSelect
        onValueChange={onChange}
        items={items}
        style={useDisabledStyles ? {
            ...styles.picker,
            inputIOS: [styles.picker.inputIOS, styles.textInput, styles.disabledTextInput],
        } : styles.picker}
        useNativeAndroidPickerStyle={false}
        placeholder={placeholder}
        value={value}
        Icon={icon}
    />
);

Picker.propTypes = pickerPropTypes.propTypes;
Picker.defaultProps = pickerPropTypes.defaultProps;
Picker.displayName = 'Picker';

export default Picker;
