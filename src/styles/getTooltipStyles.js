import spacing from './utilities/spacing';
import styles from './styles';
import colors from './colors';
import themeColors from './themes/default';
import fontFamily from './fontFamily';
import variables from './variables';
import roundToNearestMultipleOfFour from './roundToNearestMultipleOfFour';

// This defines the proximity with the edge of the window in which tooltips should not be displayed.
// If a tooltip is too close to the edge of the screen, we'll shift it towards the center.
const GUTTER_WIDTH = variables.gutterWidth;

// The height of a tooltip pointer
const POINTER_HEIGHT = 4;

// The width of a tooltip pointer
const POINTER_WIDTH = 12;

/**
 * Compute the amount the tooltip needs to be horizontally shifted in order to keep it from displaying in the gutters.
 *
 * @param {Number} windowWidth - The width of the window.
 * @param {Number} xOffset - The distance between the left edge of the window
 *                           and the left edge of the wrapped component.
 * @param {Number} componentWidth - The width of the wrapped component.
 * @param {Number} tooltipWidth - The width of the tooltip itself.
 * @param {Number} [manualShiftHorizontal] - Any additional amount to manually shift the tooltip to the left or right.
 *                                         A positive value shifts it to the right,
 *                                         and a negative value shifts it to the left.
 * @returns {Number}
 */
function computeHorizontalShift(windowWidth, xOffset, componentWidth, tooltipWidth, manualShiftHorizontal) {
    // First find the left and right edges of the tooltip (by default, it is centered on the component).
    const componentCenter = xOffset + componentWidth / 2 + manualShiftHorizontal;
    const tooltipLeftEdge = componentCenter - tooltipWidth / 2;
    const tooltipRightEdge = componentCenter + tooltipWidth / 2;

    if (tooltipLeftEdge < GUTTER_WIDTH) {
        // Tooltip is in left gutter, shift right by a multiple of four.
        return roundToNearestMultipleOfFour(GUTTER_WIDTH - tooltipLeftEdge);
    }

    if (tooltipRightEdge > windowWidth - GUTTER_WIDTH) {
        // Tooltip is in right gutter, shift left by a multiple of four.
        return roundToNearestMultipleOfFour(windowWidth - GUTTER_WIDTH - tooltipRightEdge);
    }

    // Tooltip is not in the gutter, so no need to shift it horizontally
    return 0;
}

/**
 * Determines if there is an overlapping element at the top of a given coordinate.
 *
 * @param {Number} xOffset - The distance between the left edge of the window
 *                           and the left edge of the wrapped component.
 * @param {Number} yOffset - The distance between the top edge of the window
 *                           and the top edge of the wrapped component.
 * @param {Element} tooltip - The reference to the tooltip's root element
 * @returns {Boolean}
 */
function isOverlappingAtTop(xOffset, yOffset, tooltip) {
    if (typeof document.elementFromPoint !== 'function') {
        return false;
    }

    const element = document.elementFromPoint(xOffset, yOffset);

    // Ensure it's not the already rendered element of this very tooltip, so the tooltip doesn't try to "avoid" itself
    if (!element || tooltip.contains(element)) {
        return false;
    }

    const rect = element.getBoundingClientRect();

    // Ensure it's not overlapping with another element by checking if the yOffset is greater than the top of the element
    // and less than the bottom of the element
    return yOffset > rect.top && yOffset < rect.bottom;
}

/**
 * Generate styles for the tooltip component.
 *
 * @param {Number} currentSize - The current size of the tooltip used in the scaling animation.
 * @param {Number} windowWidth - The width of the window.
 * @param {Number} xOffset - The distance between the left edge of the window
 *                           and the left edge of the wrapped component.
 * @param {Number} yOffset - The distance between the top edge of the window
 *                           and the top edge of the wrapped component.
 * @param {Number} tooltipTargetWidth - The width of the tooltip's target
 * @param {Number} tooltipTargetHeight - The height of the tooltip's target
 * @param {Number} maxWidth - The tooltip's max width.
 * @param {Number} tooltipWidth - The measured width of the tooltip
 * @param {Number} tooltipHeight - The measured height of the tooltip
 * @param {Number} tooltipContentWidth - The tooltip's inner content measured width.
 * @param {Number} [manualShiftHorizontal] - Any additional amount to manually shift the tooltip to the left or right.
 *                                         A positive value shifts it to the right,
 *                                         and a negative value shifts it to the left.
 * @param {Number} [manualShiftVertical] - Any additional amount to manually shift the tooltip up or down.
 *                                       A positive value shifts it down, and a negative value shifts it up.
 * @param {Element} tooltip - The reference to the tooltip's root element
 * @returns {Object}
 */
export default function getTooltipStyles(
    currentSize,
    windowWidth,
    xOffset,
    yOffset,
    tooltipTargetWidth,
    tooltipTargetHeight,
    maxWidth,
    tooltipWidth,
    tooltipHeight,
    tooltipContentWidth,
    manualShiftHorizontal = 0,
    manualShiftVertical = 0,
    tooltip,
) {
    // Determine if the tooltip should display below the wrapped component.
    // If either a tooltip will try to render within GUTTER_WIDTH logical pixels of the top of the screen,
    // Or the wrapped component is overlapping at top-left with another element
    // we'll display it beneath its wrapped component rather than above it as usual.
    const shouldShowBelow = yOffset - tooltipHeight < GUTTER_WIDTH || isOverlappingAtTop(xOffset, yOffset, tooltip);

    // Determine if we need to shift the tooltip horizontally to prevent it
    // from displaying too near to the edge of the screen.
    const horizontalShift = computeHorizontalShift(windowWidth, xOffset, tooltipTargetWidth, tooltipWidth, manualShiftHorizontal);

    // Determine if we need to shift the pointer horizontally to prevent it from being too near to the edge of the tooltip
    // We shift it to the right a bit if the tooltip is positioned on the extreme left
    // and shift it to left a bit if the tooltip is positioned on the extreme right.
    const horizontalShiftPointer =
        horizontalShift > 0
            ? Math.max(-horizontalShift, -(tooltipWidth / 2) + POINTER_WIDTH / 2 + variables.componentBorderRadiusSmall)
            : Math.min(-horizontalShift, tooltipWidth / 2 - POINTER_WIDTH / 2 - variables.componentBorderRadiusSmall);

    const tooltipVerticalPadding = spacing.pv1;
    const tooltipFontSize = variables.fontSizeSmall;

    // We calculate wrapper width based on the tooltip's inner text width so the wrapper is just big enough to fit text and prevent white space.
    // If the text width is less than the maximum available width, add horizontal padding.
    // Note: tooltipContentWidth ignores the fractions (OffsetWidth) so add 1px to fit the text properly.
    const rootWrapperWidth = tooltipContentWidth && tooltipContentWidth + spacing.ph2.paddingHorizontal * 2 + 1;

    const isTooltipSizeReady = tooltipWidth !== 0 && tooltipHeight !== 0;

    // Hide the tooltip entirely if it's size hasn't finished measuring yet. This prevents UI jank where the tooltip flashes close to its expected position.
    const opacity = isTooltipSizeReady ? 1 : 0;

    const scale = !isTooltipSizeReady ? 1 : currentSize;
    let rootWrapperTop = 0;
    let rootWrapperLeft = 0;

    if (isTooltipSizeReady) {
        // Because it uses fixed positioning, the top-left corner of the tooltip is aligned
        // with the top-left corner of the window by default.
        // we will use yOffset to position the tooltip relative to the Wrapped Component
        // So we need to shift the tooltip vertically and horizontally to position it correctly.
        //
        // First, we'll position it vertically.
        // To shift the tooltip down, we'll give `top` a positive value.
        // To shift the tooltip up, we'll give `top` a negative value.
        rootWrapperTop = shouldShowBelow
            ? // We need to shift the tooltip down below the component. So shift the tooltip down (+) by...
              yOffset + tooltipTargetHeight + POINTER_HEIGHT + manualShiftVertical
            : // We need to shift the tooltip up above the component. So shift the tooltip up (-) by...
              yOffset - (tooltipHeight + POINTER_HEIGHT) + manualShiftVertical;

        // Next, we'll position it horizontally.
        // we will use xOffset to position the tooltip relative to the Wrapped Component
        // To shift the tooltip right, we'll give `left` a positive value.
        // To shift the tooltip left, we'll give `left` a negative value.
        //
        // So we'll:
        //   1) Shift the tooltip right (+) to the center of the component,
        //      so the left edge lines up with the component center.
        //   2) Shift it left (-) to by half the tooltip's width,
        //      so the tooltip's center lines up with the center of the wrapped component.
        //   3) Add the horizontal shift (left or right) computed above to keep it out of the gutters.
        //   4) Lastly, add the manual horizontal shift passed in as a parameter.
        rootWrapperLeft = xOffset + (tooltipTargetWidth / 2 - tooltipWidth / 2) + horizontalShift + manualShiftHorizontal;
    }

    return {
        animationStyle: {
            // remember Transform causes a new Local cordinate system
            // https://drafts.csswg.org/css-transforms-1/#transform-rendering
            // so Position fixed children will be relative to this new Local cordinate system
            transform: [{scale}],
        },
        rootWrapperStyle: {
            position: 'fixed',
            backgroundColor: themeColors.heading,
            borderRadius: variables.componentBorderRadiusSmall,
            ...tooltipVerticalPadding,
            ...spacing.ph2,
            zIndex: variables.tooltipzIndex,
            width: rootWrapperWidth,
            maxWidth,
            top: rootWrapperTop,
            left: rootWrapperLeft,
            opacity,

            // We are adding this to prevent the tooltip text from being selected and copied on CTRL + A.
            ...styles.userSelectNone,
        },
        textStyle: {
            color: themeColors.textReversed,
            fontFamily: fontFamily.EXP_NEUE,
            fontSize: tooltipFontSize,
            overflow: 'hidden',
            lineHeight: variables.lineHeightSmall,
        },
        pointerWrapperStyle: {
            position: 'fixed',

            // By default, the pointer's top-left will align with the top-left of the tooltip tooltip.
            //
            // To align it vertically, we'll:
            //   If the pointer should be below the tooltip tooltip, shift the pointer down (+) by the tooltip height,
            //   so that the top of the pointer lines up with the bottom of the tooltip
            //
            //   OR if the pointer should be above the tooltip tooltip, then the pointer up (-) by the pointer's height
            //   so that the bottom of the pointer lines up with the top of the tooltip
            top: shouldShowBelow ? -POINTER_HEIGHT : tooltipHeight,

            // To align it horizontally, we'll:
            //   1) Shift the pointer to the right (+) by the half the rootWrapperWidth's width,
            //      so the left edge of the pointer lines up with the rootWrapperWidth's center.
            //   2) To the left (-) by half the pointer's width,
            //      so the pointer's center lines up with the rootWrapperWidth's center.
            //   3) Due to the tip start from the left edge of tooltip Tooltip so we have to remove the
            //      horizontalShift which is added to adjust it into the Window
            left: horizontalShiftPointer + (tooltipWidth / 2 - POINTER_WIDTH / 2),

            opacity,
        },
        pointerStyle: {
            width: 0,
            height: 0,
            backgroundColor: colors.transparent,
            borderStyle: 'solid',
            borderLeftWidth: POINTER_WIDTH / 2,
            borderRightWidth: POINTER_WIDTH / 2,
            borderTopWidth: POINTER_HEIGHT,
            borderLeftColor: colors.transparent,
            borderRightColor: colors.transparent,
            borderTopColor: themeColors.heading,
            ...(shouldShowBelow ? styles.flipUpsideDown : {}),
        },
    };
}
