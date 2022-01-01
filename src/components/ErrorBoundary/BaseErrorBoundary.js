import React from 'react';
import PropTypes from 'prop-types';
import BootSplash from '../../libs/BootSplash';
import GenericErrorPage from '../../pages/GenericErrorPage';
import * as Session from '../../libs/actions/Session';

const propTypes = {
    /* A message posted to `logError` (along with error data) when this component intercepts an error */
    errorMessage: PropTypes.string.isRequired,

    /* A function to perform the actual logging since different platforms support different tools */
    logError: PropTypes.func,

    /* Actual content wrapped by this error boundary */
    children: PropTypes.node.isRequired,
};

const defaultProps = {
    logError: () => {},
};

/**
 * This component captures an error in the child component tree and logs it to the server
 * It can be used to wrap the entire app as well as to wrap specific parts for more granularity
 * @see {@link https://reactjs.org/docs/error-boundaries.html#where-to-place-error-boundaries}
 */
class BaseErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {hasError: false};
        this.onRefresh = this.onRefresh.bind(this);
        this.onSignOut = this.onSignOut.bind(this);
    }

    static getDerivedStateFromError() {
        // Update state so the next render will show the fallback UI.
        return {hasError: true};
    }

    componentDidCatch(error, errorInfo) {
        this.props.logError(this.props.errorMessage, error, errorInfo);

        // We hide the splash screen since the error might happened during app init
        BootSplash.hide({fade: true});
    }

    onRefresh() {
        this.setState({hasError: false});
    }

    onSignOut() {
        Session.signOut();
        this.onRefresh();
    }

    render() {
        if (this.state.hasError) {
            // For the moment we've decided not to render any fallback UI
            return <GenericErrorPage onRefresh={this.onRefresh} onSignOut={this.onSignOut} />;
        }

        return this.props.children;
    }
}

BaseErrorBoundary.propTypes = propTypes;
BaseErrorBoundary.defaultProps = defaultProps;

export default BaseErrorBoundary;
