import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lapidary",
  description: "Private Obsidian vault web interface",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
