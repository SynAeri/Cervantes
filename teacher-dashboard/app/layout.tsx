// Root layout for La Mancha PWA
// Includes PWA manifest and meta tags

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWARegister } from "./components/PWARegister";
import { AuthProvider } from "../lib/auth-context";

export const metadata: Metadata = {
  title: "Cervantes - Scholarly Assessment System",
  description: "Narrative formative assessment platform for teachers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cervantes",
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
