"use client";

import * as React from "react";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/hooks/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      <IconSun size={18} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <IconMoon size={18} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 