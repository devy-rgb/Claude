import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Performance Dashboard",
  description: "Meta spend vs RedTrack revenue — true ROAS, CPA and profit by campaign and ad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
