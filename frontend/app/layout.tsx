import type { Metadata } from "next";
import { Black_Ops_One, IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";

const display = Black_Ops_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const sans = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Siege Command Center",
  description: "Automated AI red-teaming command center for LLM chatbot endpoints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
