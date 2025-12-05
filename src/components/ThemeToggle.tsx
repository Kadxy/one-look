"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center p-1 bg-zinc-200/50 dark:bg-zinc-800/50 backdrop-blur-sm rounded-full border border-zinc-200 dark:border-zinc-700/50">
      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-full transition-all ${theme === "system"
            ? "bg-white dark:bg-zinc-600 shadow-sm text-black dark:text-white"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        title="System"
      >
        <Monitor className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-full transition-all ${theme === "light"
            ? "bg-white shadow-sm text-amber-500"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        title="Light"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-full transition-all ${theme === "dark"
            ? "bg-zinc-600 shadow-sm text-indigo-400"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
        title="Dark"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}