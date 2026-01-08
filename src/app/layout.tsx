import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import MobileBlocker from "./components/mobile-blocker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const metadataBaseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ?? "http://explore.acmvit.in";
const metadataBase = new URL(metadataBaseUrl);

export const metadata: Metadata = {
  title: {
    template: "%s | OCS '26",
    default: "OCS '26 | ACM-VIT",
  },
  description:
    "The ACM-VIT Organizing Committee Selections 2026 portal is your gateway to VIT's most dynamic tech chapter. Make an impact!",
  keywords: [
    "ACM",
    "VIT",
    "Vellore Institute of Technology",
    "Organising Committee Selections",
    "OCS",
    "Selections",
    "ACM Selections",
    "Selections",
    "Selection Portal",
    "Association for Computing Machinery-VIT",
    "ACM VIT Selections",
    "College Selection Portal",
    "Clubs and Chapters",
    "VIT Clubs and Chapters",
    "ACM India",
    "Academic Committee Selections",
    "Best Chapter in VIT",
    "Top clubs and chapters at VIT",
    "ACM-VIT",
    "Association for Computing Machinery",
    "International Chapter",
  ],
  metadataBase,
  openGraph: {
    images: [{ url: new URL("/opengraph.png", metadataBase) }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased overflow-hidden`}
        style={{ fontFamily: "var(--font-poppins), sans-serif" }}
      >
        <MobileBlocker />
        <div className="mobile-content w-full h-full">{children}</div>
      </body>
    </html>
  );
}
