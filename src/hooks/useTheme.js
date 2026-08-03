import { useCallback, useEffect, useState } from "react";

const THEME_KEY = "mpg_theme";

const getInitial = () => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : "dark"; // brand default
};

export function useTheme() {
    const [theme, setTheme] = useState(getInitial);

    useEffect(() => {
        document.documentElement.classList.toggle("light", theme === "light");
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
    return { theme, toggle, isDark: theme === "dark" };
}
