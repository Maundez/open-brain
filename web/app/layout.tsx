import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import NavLinks from "@/components/NavLinks";
import "./globals.css";

const font = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Digital Brain",
  description: "Personal intelligence console",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={font.variable}>
      <body>
        <div className="min-h-screen max-w-[1400px] mx-auto px-4 py-6">
          <header className="mb-6">
            <h1 className="text-amber text-lg font-bold tracking-tight">
              Digital Brain
            </h1>
            <p className="text-text-muted text-xs mt-1">
              personal intelligence console
            </p>
            <NavLinks />
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
