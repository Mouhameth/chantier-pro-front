import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ToastProvider } from "@/lib/providers/ToastProvider";
import { SearchProvider } from "@/lib/providers/SearchProvider";
import { TokenSyncProvider } from "@/components/providers/TokenSyncProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChantierPro - Gestion de chantiers professionnelle",
  description: "Plateforme moderne de gestion de chantiers de construction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <QueryProvider>
            <TokenSyncProvider />
            <SearchProvider>
              {children}
              <ToastProvider />
            </SearchProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
