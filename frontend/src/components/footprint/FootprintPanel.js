import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function FootprintPanel({ footprint }) {
    const maxVolume = Math.max(...footprint.cells.map((c) => c.totalVolume), 1);
    const totalBuy = footprint.cells.reduce((sum, c) => sum + c.buyVolume, 0);
    const totalSell = footprint.cells.reduce((sum, c) => sum + c.sellVolume, 0);
    return (_jsxs("div", { className: "panel footprint", children: [_jsx("div", { className: "panel-head", children: _jsxs("div", { children: [_jsx("h3", { children: "Volume Footprint" }), _jsxs("p", { children: ["CVD: ", footprint.cumulativeDelta.toFixed(2)] })] }) }), _jsx("div", { className: "table-wrap", children: _jsxs("table", { className: "footprint-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Price" }), _jsx("th", { children: "Buy" }), _jsx("th", { children: "Sell" }), _jsx("th", { children: "Delta" }), _jsx("th", { children: "Total" }), _jsx("th", { children: "Vol" })] }) }), _jsx("tbody", { children: footprint.cells
                                .slice()
                                .sort((a, b) => b.price - a.price)
                                .map((cell, idx) => {
                                const volumePercent = (cell.totalVolume / maxVolume) * 100;
                                const isDeltaPositive = cell.delta >= 0;
                                return (_jsxs("tr", { children: [_jsx("td", { children: cell.price.toFixed(2) }), _jsx("td", { className: "buy", children: cell.buyVolume.toFixed(2) }), _jsx("td", { className: "sell", children: cell.sellVolume.toFixed(2) }), _jsxs("td", { className: isDeltaPositive ? 'buy' : 'sell', children: [cell.delta > 0 ? '+' : '', cell.delta.toFixed(2)] }), _jsx("td", { children: cell.totalVolume.toFixed(2) }), _jsx("td", { children: _jsx("div", { className: "bar-bg", children: _jsx("div", { className: `bar-fill ${isDeltaPositive ? 'buy' : 'sell'}`, style: { width: `${volumePercent}%` } }) }) })] }, `${cell.price}-${idx}`));
                            }) })] }) }), _jsxs("div", { className: "summary", children: [_jsxs("div", { children: [_jsx("span", { className: "label", children: "Total Buy" }), _jsx("span", { className: "value buy", children: totalBuy.toFixed(2) })] }), _jsxs("div", { children: [_jsx("span", { className: "label", children: "Total Sell" }), _jsx("span", { className: "value sell", children: totalSell.toFixed(2) })] }), _jsxs("div", { children: [_jsx("span", { className: "label", children: "Delta" }), _jsxs("span", { className: `value ${footprint.cumulativeDelta >= 0 ? 'buy' : 'sell'}`, children: [footprint.cumulativeDelta >= 0 ? '+' : '', footprint.cumulativeDelta.toFixed(2)] })] })] })] }));
}
export default FootprintPanel;
