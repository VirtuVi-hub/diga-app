import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Delta — Knowledge Operating System",
  description: "A knowledge operating system for architecture projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-surface-primary text-text-primary">
        {children}
      </body>
    </html>
  );
}
