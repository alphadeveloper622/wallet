import React from 'react';
import PropTypes from 'prop-types';
import {useIsDrawerOpen} from '@react-navigation/drawer';
import getComponentDisplayName from '../libs/getComponentDisplayName';

export const withDrawerPropTypes = {
    isDrawerOpen: PropTypes.bool.isRequired,
};

export default function withDrawerState(WrappedComponent) {
    const WithDrawerState = (props) => {
        const isDrawerOpen = useIsDrawerOpen();

        return (
            <WrappedComponent
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
                ref={props.forwardedRef}
                isDrawerOpen={isDrawerOpen}
            />
        );
    };

    WithDrawerState.displayName = `withDrawerState(${getComponentDisplayName(WrappedComponent)})`;
    WithDrawerState.propTypes = {
        forwardedRef: PropTypes.oneOfType([
            PropTypes.func,
            PropTypes.shape({current: PropTypes.instanceOf(React.Component)}),
        ]),
    };
    WithDrawerState.defaultProps = {
        forwardedRef: undefined,
    };
    return React.forwardRef((props, ref) => (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <WithDrawerState {...props} forwardedRef={ref} />
    ));
}
