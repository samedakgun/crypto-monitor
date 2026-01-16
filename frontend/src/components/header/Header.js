import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import SymbolSelector from './SymbolSelector';
import TimeframeSelector from './TimeframeSelector';
import ThemeToggle from './ThemeToggle';
import { useToolStore } from '../../store/toolStore';
function Header({ wsConnected }) {
    const { activeTool, frvpRange, isSelectingFRVP } = useToolStore();
    return (_jsxs("header", { className: "header", children: [_jsxs("div", { className: "title", children: [_jsx("span", { className: "brand", children: "Crypto Monitor" }), _jsx("span", { className: `status-dot ${wsConnected ? 'online' : 'offline'}` }), activeTool !== 'select' && (_jsx("span", { className: "active-tool-badge", children: activeTool.toUpperCase() }))] }), _jsxs("div", { className: "selectors", children: [_jsx(SymbolSelector, {}), _jsx(TimeframeSelector, {}), isSelectingFRVP && !frvpRange && (_jsx("span", { className: "tool-hint", children: "Click and drag on chart to select FRVP range" })), frvpRange && (_jsx("span", { className: "tool-info", children: "FRVP Active" }))] }), _jsx("div", { className: "actions", children: _jsx(ThemeToggle, {}) })] }));
}
export default Header;
