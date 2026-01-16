import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function Loading({ message = 'Loading...', fullScreen = false }) {
    const containerStyle = fullScreen
        ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(11, 16, 26, 0.95)',
            zIndex: 1000,
        }
        : {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
        };
    return (_jsx("div", { style: containerStyle, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { className: "loading-spinner" }), _jsx("p", { style: { color: '#9fb0c7', marginTop: '16px', fontSize: '14px' }, children: message })] }) }));
}
export default Loading;
