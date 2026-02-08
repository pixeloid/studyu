import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "StudyU Fotóstúdió",
    template: "%s | StudyU Fotóstúdió",
  },
  description: "Professzionális fotóstúdió Budapesten. Foglaljon online időpontot fotózáshoz!",
  keywords: ["fotóstúdió", "Budapest", "fotózás", "stúdió bérlés", "professzionális fotózás"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
