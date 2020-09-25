import Str from '../../Str';
import CONST from '../../../CONST';

const EXPENSIFY_ICON_URL = `${CONST.CLOUDFRONT_URL}/images/favicon-2019.png`;
const DEFAULT_DELAY = 4000;

/* ====== Private Functions ====== */

/**
 * Checks if the user has granted permission to show local notifications
 *
 * @return {Promise}
 */
function canUseLocalNotifications() {
    return new Promise((resolve) => {
        // They have no local notifications so we can't use this feature
        if (!window.Notification) {
            return resolve(false);
        }

        // Check if they previously granted or denied us access to send a notification
        const permissionGranted = Notification.permission === 'granted';

        if (permissionGranted || Notification.permission === 'denied') {
            return resolve(permissionGranted);
        }

        // Check their global preferences for local notifications and ask permission if they have none
        Notification.requestPermission()
            .then((status) => {
                resolve(status === 'granted');
            });
    });
}

/**
 * Light abstraction around local push notifications.
 * Checks for permission before determining whether to send.
 *
 * @param {Object} params
 * @param {String} params.title
 * @param {String} params.body
 * @param {String} [params.icon] Default to Expensify logo
 * @param {Number} [params.delay]
 * @param {Function} [params.onClick]
 * @param {String} [params.tag]
 *
 * @return {Promise} - resolves with Notification object or undefined
 */
function push({
    title,
    body,
    delay = DEFAULT_DELAY,
    onClick = () => {},
    tag = '',
    icon = EXPENSIFY_ICON_URL,
}) {
    return new Promise((resolve) => {
        if (!title || !body) {
            throw new Error('LocalNotification must include title and body parameter.');
        }

        canUseLocalNotifications().then((canUseNotifications) => {
            if (!canUseNotifications) {
                resolve();
                return;
            }

            const notification = new Notification(title, {
                body,
                icon,
                tag,
            });

            // If we pass in a delay param greater than 0 the notification
            // will auto-close after the specified time.
            if (delay > 0) {
                setTimeout(notification.close.bind(notification), delay);
            }

            notification.onclick = (event) => {
                event.preventDefault();
                onClick();
                window.parent.focus();
                window.focus();
                notification.close();
            };

            resolve(notification);
        });
    });
}

/**
 * LocalNotification
 * @namespace
 */
export default {
    /**
     * Create a report comment notification
     *
     * @param {Object} params
     * @param {Object} params.reportAction
     * @param {Function} params.onClick
     */
    pushReportCommentNotification({reportAction, onClick}) {
        const {person, message} = reportAction;
        const plainTextPerson = Str.htmlDecode(person.map(f => f.text).join());

    // Specifically target the comment part of the message
    const plainTextMessage = Str.htmlDecode((message.find(f => f.type === 'COMMENT') || {}).text);

    push({
        title: `New message from ${plainTextPerson}`,
        body: plainTextMessage,
        delay: 0,
        onClick,
    });
};
