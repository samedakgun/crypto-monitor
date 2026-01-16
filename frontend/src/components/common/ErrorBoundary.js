import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsxs("div", { className: "panel", style: { padding: '20px', textAlign: 'center' }, children: [_jsx("h3", { style: { color: '#e0656a', marginBottom: '10px' }, children: "Something went wrong" }), _jsx("p", { style: { color: '#9fb0c7', fontSize: '14px', marginBottom: '10px' }, children: this.state.error?.message || 'An unexpected error occurred' }), _jsx("button", { className: "pill", onClick: () => this.setState({ hasError: false, error: null }), style: { marginTop: '10px' }, children: "Try Again" })] }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
