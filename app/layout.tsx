import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { DM_Sans } from "next/font/google";

import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
import { ActiveStudentProvider } from "@/components/family/active-student-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";

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
        <ClerkProvider appearance={{ theme: shadcn }}>
          <ThemeScript />
          <ThemeProvider>
            <AuthProvider>
              <ActiveStudentProvider>
                <AuthShell>{children}</AuthShell>
              </ActiveStudentProvider>
            </AuthProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
