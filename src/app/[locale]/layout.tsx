import type { Metadata } from "next";
import { DM_Serif_Display, Noto_Serif_SC, Noto_Sans_SC } from "next/font/google";
import "../globals.css";

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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      {/* Custom Cursor Canvas */}
      <canvas id="cursor-canvas"></canvas>

      {/* Splash Screen */}
      <div id="splash">
        <canvas id="splash-canvas"></canvas>
        <div className="splash-text-wrap">
          <div className="splash-brand" id="splash-brand">LUMOS CREATIVE</div>
          <div className="splash-sub" id="splash-sub">里面是·创意事务</div>
        </div>
      </div>

      {children}
    </>
  );
}
