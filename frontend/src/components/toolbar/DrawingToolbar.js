import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useToolStore, TOOLS } from '../../store/toolStore';
function DrawingToolbar() {
    const { activeTool, setActiveTool, magnetEnabled, toggleMagnet, startFRVPSelection, frvpRange, cancelFRVPSelection } = useToolStore();
    const handleToolClick = (tool) => {
        if (tool === 'frvp') {
            if (activeTool === 'frvp') {
                cancelFRVPSelection();
            }
            else {
                startFRVPSelection();
            }
        }
        else {
            setActiveTool(tool);
        }
    };
    // Araçları gruplandır
    const selectionTools = TOOLS.filter((t) => ['select', 'crosshair'].includes(t.id));
    const lineTools = TOOLS.filter((t) => ['vertical', 'horizontal', 'trendline'].includes(t.id));
    const shapeTools = TOOLS.filter((t) => ['rectangle', 'measure'].includes(t.id));
    const analysisTools = TOOLS.filter((t) => ['frvp'].includes(t.id));
    return (_jsxs("aside", { className: "left-rail", children: [_jsx("div", { className: "rail-brand", children: "CM" }), _jsx("div", { className: "tool-group", children: selectionTools.map((tool) => (_jsx("button", { className: `rail-btn ${activeTool === tool.id ? 'active' : ''}`, onClick: () => handleToolClick(tool.id), title: `${tool.name} (${tool.shortcut})`, children: _jsx("span", { className: "rail-icon", children: tool.icon }) }, tool.id))) }), _jsx("div", { className: "rail-divider" }), _jsx("div", { className: "tool-group", children: lineTools.map((tool) => (_jsx("button", { className: `rail-btn ${activeTool === tool.id ? 'active' : ''}`, onClick: () => handleToolClick(tool.id), title: `${tool.name} (${tool.shortcut})`, children: _jsx("span", { className: "rail-icon", children: tool.icon }) }, tool.id))) }), _jsx("div", { className: "rail-divider" }), _jsx("div", { className: "tool-group", children: shapeTools.map((tool) => (_jsx("button", { className: `rail-btn ${activeTool === tool.id ? 'active' : ''}`, onClick: () => handleToolClick(tool.id), title: `${tool.name} (${tool.shortcut})`, children: _jsx("span", { className: "rail-icon", children: tool.icon }) }, tool.id))) }), _jsx("div", { className: "rail-divider" }), _jsx("div", { className: "tool-group", children: analysisTools.map((tool) => (_jsx("button", { className: `rail-btn ${activeTool === tool.id ? 'active' : ''} ${frvpRange ? 'has-data' : ''}`, onClick: () => handleToolClick(tool.id), title: `${tool.name} (${tool.shortcut})`, children: _jsx("span", { className: "rail-icon", children: tool.icon }) }, tool.id))) }), _jsx("div", { className: "rail-spacer" }), _jsx("div", { className: "tool-group", children: _jsx("button", { className: `rail-btn magnet-btn ${magnetEnabled ? 'active' : ''}`, onClick: toggleMagnet, title: `Magnet Mode (${magnetEnabled ? 'ON' : 'OFF'})`, children: _jsx("span", { className: "rail-icon", children: "\uD83E\uDDF2" }) }) }), frvpRange && (_jsx("div", { className: "tool-group", children: _jsx("button", { className: "rail-btn clear-btn", onClick: cancelFRVPSelection, title: "Clear FRVP", children: _jsx("span", { className: "rail-icon", children: "\u2715" }) }) }))] }));
}
export default DrawingToolbar;
