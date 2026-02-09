import * as React from "react";

type Theme = "light" | "dark" | "system";

const ThemeContext = React.createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "system"
  );

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const applied = theme === "system" ? (systemDark ? "dark" : "light") : theme;

    root.classList.add(applied);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
