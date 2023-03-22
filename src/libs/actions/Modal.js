import Onyx from 'react-native-onyx';
import ONYXKEYS from '../../ONYXKEYS';

let closeModal;
let onModalClose;

/**
 * Allows other parts of the app to call modal close function
 *
 * @param {Function} [onClose]
 */
function setCloseModal(onClose) {
    closeModal = onClose;
}

/**
 * Close modal in other parts of the app
 *
 * @param {Function} [onClose]
 * @param {Boolean} isNavigating
 */
function close(onClose, isNavigating = true) {
    if (!closeModal) {
        if (onClose) { onClose(); }
        onModalClose = null;
        return;
    }
    onModalClose = onClose;
    closeModal(isNavigating);
}

function onModalDidClose() {
    if (!onModalClose) { return; }
    onModalClose();
    onModalClose = null;
}

/**
 * Allows other parts of the app to know when a modal has been opened or closed
 *
 * @param {Boolean} isVisible
 */
function setModalVisibility(isVisible) {
    Onyx.merge(ONYXKEYS.MODAL, {isVisible});
}

/**
 * Allows other parts of app to know that an alert modal is about to open.
 * This will trigger as soon as a modal is opened but not yet visible while animation is running.
 *
 * @param {Boolean} isVisible
 */
function willAlertModalBecomeVisible(isVisible) {
    Onyx.merge(ONYXKEYS.MODAL, {willAlertModalBecomeVisible: isVisible});
}

export {
    setCloseModal,
    close,
    onModalDidClose,
    setModalVisibility,
    willAlertModalBecomeVisible,
};
