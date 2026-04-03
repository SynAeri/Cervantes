// Root layout for La Mancha PWA
// Includes PWA manifest and meta tags

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWARegister } from "./components/PWARegister";

export const metadata: Metadata = {
  title: "La Mancha - Scholarly Assessment System",
  description: "Narrative formative assessment platform for teachers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "La Mancha",
  },
};

export const viewport: Viewport = {
  themeColor: "#cfbdff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
