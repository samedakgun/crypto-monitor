import { useSettingsStore } from '../../store/settingsStore';

function ThemeToggle() {
  const { theme, toggleTheme } = useSettingsStore();

  return (
    <button className="pill" onClick={toggleTheme} type="button">
      {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}

export default ThemeToggle;
