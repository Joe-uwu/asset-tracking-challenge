import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Asset tracking — challenge starter",
  description: "Take-home: build the user experience on top of the asset tracking API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="bg-slate-100 text-slate-900 [font-family:var(--font-plex-sans)]">
        <header className="border-b border-slate-800 bg-[#0f1724] text-slate-100">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
            <a href="/" className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-100">
              Asset tracking
            </a>
            <RoleSwitcher />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-6">
          <div className="min-h-[calc(100vh-8rem)] rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
