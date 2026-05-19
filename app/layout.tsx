import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";
import { TopNav } from "@/components/top-nav";

import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Your Science Guide",
  description: "Student lessons and parent portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        <ThemeScript />
        <ThemeProvider>
          <TopNav />
          <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
