import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMarketStore } from '../../store/marketStore';
const SYMBOLS = [
    { symbol: 'BTCUSDT', name: 'Bitcoin' },
    { symbol: 'ETHUSDT', name: 'Ethereum' },
    { symbol: 'BNBUSDT', name: 'BNB' },
    { symbol: 'SOLUSDT', name: 'Solana' },
    { symbol: 'XRPUSDT', name: 'Ripple' },
];
function SymbolSelector() {
    const { selectedSymbol, setSymbol } = useMarketStore();
    return (_jsxs("label", { className: "field", children: [_jsx("span", { className: "field-label", children: "Symbol" }), _jsx("select", { className: "input", value: selectedSymbol, onChange: (e) => setSymbol(e.target.value), children: SYMBOLS.map((s) => (_jsxs("option", { value: s.symbol, children: [s.symbol, " \u2014 ", s.name] }, s.symbol))) })] }));
}
export default SymbolSelector;
