import type { Metadata } from "next";
import "./globals.css";
import { DM_Serif_Display, Noto_Serif_SC, Noto_Sans_SC } from "next/font/google";

const dmSerif = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
});

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LUMOS CREATIVE",
  description: "Creative Direction · Art Direction · Exhibition Design",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>*</text></svg>",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh"
      className={`${dmSerif.variable} ${notoSerif.variable} ${notoSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
