import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import MobileBlocker from "./components/mobile-blocker";

// Loader removed from global layout; rendered only in landing page

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

export const metadata: Metadata = {
  title: "Browser",
  description: "ACM-VIT's Enrollments Portal for the year 2026",
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
        <div className="hidden lg:block w-full h-full">{children}</div>
      </body>
    </html>
  );
}
