import { jsx as _jsx } from "react/jsx-runtime";
import { useSettingsStore } from '../../store/settingsStore';
function ThemeToggle() {
    const { theme, toggleTheme } = useSettingsStore();
    return (_jsx("button", { className: "pill", onClick: toggleTheme, type: "button", children: theme === 'dark' ? 'Dark' : 'Light' }));
}
export default ThemeToggle;
