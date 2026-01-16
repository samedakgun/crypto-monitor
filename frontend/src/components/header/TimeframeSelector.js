import { jsx as _jsx } from "react/jsx-runtime";
import { useMarketStore } from '../../store/marketStore';
const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h'];
function TimeframeSelector() {
    const { selectedInterval, setInterval } = useMarketStore();
    return (_jsx("div", { className: "timeframe", children: TIMEFRAMES.map((tf) => (_jsx("button", { className: `pill ${selectedInterval === tf ? 'active' : ''}`, onClick: () => setInterval(tf), type: "button", children: tf }, tf))) }));
}
export default TimeframeSelector;
