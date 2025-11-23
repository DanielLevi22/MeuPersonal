"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-14 h-8 bg-surface-highlight rounded-full border border-border" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-14 h-8 bg-surface-highlight rounded-full p-1 transition-colors border border-border hover:border-primary/50 cursor-pointer"
      aria-label="Toggle Theme"
    >
      <motion.div
        className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-black text-xs"
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {isDark ? "🌙" : "☀️"}
      </motion.div>
    </button>
  );
}
