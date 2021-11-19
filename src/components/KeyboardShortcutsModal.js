import React from 'react';
import {View} from 'react-native';
import _ from 'underscore';
import HeaderWithCloseButton from './HeaderWithCloseButton';
import Text from './Text';
import Modal from './Modal';
import CONST from '../CONST';
import styles from '../styles/styles';
import withWindowDimensions, {windowDimensionsPropTypes} from './withWindowDimensions';
import withLocalize, {withLocalizePropTypes} from './withLocalize';
import compose from '../libs/compose';
import KeyboardShortcut from '../libs/KeyboardShortcut';


const propTypes = {
    /** prop to fetch screen width */
    ...windowDimensionsPropTypes,

    /** props to fetch translation functions */
    ...withLocalizePropTypes,
};

class KeyboardShortcutsModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isOpen: false,
        };

        this.showKeyboardShortcutModal = this.showKeyboardShortcutModal.bind(this);
        this.hideKeyboardShortcutModal = this.hideKeyboardShortcutModal.bind(this);
    }

    componentDidMount() {
        const shortcutModifiers = KeyboardShortcut.getShortcutModifiers(['CTRL']);
        this.unsubscribeShortcutModal = KeyboardShortcut.subscribe('?', () => {
            this.showKeyboardShortcutModal();
        }, 'openShortcutDialog', shortcutModifiers, true);
    }

    componentWillUnmount() {
        if (!this.unsubscribeShortcutModal) {
            return;
        }
        this.unsubscribeShortcutModal();
    }

    showKeyboardShortcutModal() {
        this.setState({isOpen: true});
    }

    hideKeyboardShortcutModal() {
        this.setState({isOpen: false});
    }

    renderRow(shortcut, isFirstRow) {
        return (
            <View
                style={[
                    styles.keyboardShortcutTableRow,
                    styles.flex1,
                    isFirstRow && styles.keyboardShortcutTableFirstRow,
                ]}
                key={shortcut.key}
            >
                <View style={[styles.dFlex, styles.p2, styles.keyboardShortcutTablePrefix]}>
                    <Text>{shortcut.key}</Text>
                </View>
                <View style={[styles.flex1, styles.p2, styles.alignSelfStretch]}>
                    <Text>{this.props.translate(`keyboardShortcutModal.shortcuts.${shortcut.descriptionKey}`)}</Text>
                </View>
            </View>
        );
    }

    render() {
        const shortcuts = KeyboardShortcut.getKeyboardShortcuts();
        const modalType = this.props.isSmallScreenWidth ? CONST.MODAL.MODAL_TYPE.BOTTOM_DOCKED : CONST.MODAL.MODAL_TYPE.CENTERED;
        return (
            <Modal
                isVisible={this.state.isOpen}
                type={modalType}
                containerStyle={styles.keyboardShortcutModalContainer}
                onClose={() => this.hideKeyboardShortcutModal()}
            >
                <HeaderWithCloseButton title={this.props.translate('keyboardShortcutModal.title')} onCloseButtonPress={() => this.hideKeyboardShortcutModal()} />
                <View style={[styles.p5, styles.pt0]}>
                    <Text style={styles.mb5}>{this.props.translate('keyboardShortcutModal.subtitle')}</Text>
                    <View style={[styles.keyboardShortcutTableWrapper]}>
                        <View style={[styles.alignItemsCenter, styles.keyboardShortcutTableContainer]}>
                            {_.map(shortcuts, (shortcut, index) => {
                                const isFirstRow = index === 0;
                                return this.renderRow(shortcut, isFirstRow);
                            })}
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }
}

KeyboardShortcutsModal.propTypes = propTypes;

export default compose(
    withWindowDimensions,
    withLocalize,
)(KeyboardShortcutsModal);
