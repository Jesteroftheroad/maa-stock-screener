import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "MAA · AI Stock Screener",
  description: "AI-powered stock screener for US and Canadian markets. Discover undervalued, momentum, and dividend stocks instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        <Providers>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
