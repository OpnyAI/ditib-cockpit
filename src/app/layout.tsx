// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DITIB Cockpit",
  description: "Verwaltung und Cockpit für DITIB Gemeinden",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen">
        {/* Dezenter Top-Glow / Header-Hint (token-basiert) */}
        <div className="pointer-events-none fixed left-0 right-0 top-0 z-[-1] h-24 border-b border-[rgb(var(--border))]/40 bg-[rgb(var(--surface))]/40 backdrop-blur" />
        {children}
      </body>
    </html>
  );
}
