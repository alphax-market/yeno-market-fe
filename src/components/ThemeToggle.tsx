import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (

    isDark ? <Sun size={20}  onClick={() => setTheme(isDark ? "light" : "dark")}/> : <Moon size={20}  onClick={() => setTheme(isDark ? "light" : "dark")}/>
    // <Button
    //   variant="ghost"
    //   size="icon"
    //   onClick={() => setTheme(isDark ? "light" : "dark")}
    //   aria-label="Toggle theme"
    // >
    //   {isDark ? <Sun size={20} /> : <Moon size={20} />}
    // </Button>
  );
}
