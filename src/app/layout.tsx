import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/context/LocaleProvider";

export const metadata: Metadata = {
  title: "LUMOS CREATIVE",
  description: "Creative Direction · Art Direction · Exhibition Design",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>*</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.cn" />
        <link rel="preconnect" href="https://fonts.gstatic.cn" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.cn/css2?family=DM+Sans:wght@300;400;500;700&family=DM+Serif+Display:ital@0;1&family=Noto+Serif+SC:wght@400;700&family=Noto+Sans+SC:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
