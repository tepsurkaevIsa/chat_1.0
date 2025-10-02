import { Moon, Sun } from 'lucide-react';
import { useTheme } from './themeContext';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      className={`${styles.btn} ${className}`}
    >
      {theme === 'dark' ? (
        <Sun width={20} height={20} color="#f59e0b" />
      ) : (
        <Moon width={20} height={20} color="#374151" />
      )}
    </button>
  );
}

