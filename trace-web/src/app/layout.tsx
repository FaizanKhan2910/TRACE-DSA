import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Serif,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "TRACE — Search Kunal Kushwaha’s Java and DSA lessons",
  description:
    "Search Kunal Kushwaha’s Java and DSA lessons, find the exact timestamp, and check answers against the original video.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="radiant"
      className={`${bricolage.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${jakartaSans.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full overflow-x-hidden selection:bg-[#ff4d0a] selection:text-[#060709]">
        {children}
      </body>
    </html>
  );
}
