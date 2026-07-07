"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgb(var(--surface))",
            color: "rgb(var(--ink))",
            border: "1px solid rgb(var(--border))",
          },
        }}
      />
    </ThemeProvider>
  );
}
