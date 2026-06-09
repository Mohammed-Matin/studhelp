import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            className={`relative flex items-center justify-center w-9 h-9 rounded-lg border border-theme transition-all duration-300 hover:bg-theme-hover ${className}`}
        >
            <Sun
                className={`w-4 h-4 text-amber-500 absolute transition-all duration-300 ${
                    isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                }`}
            />
            <Moon
                className={`w-4 h-4 text-cyan-400 absolute transition-all duration-300 ${
                    isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                }`}
            />
        </button>
    );
};

export default ThemeToggle;
