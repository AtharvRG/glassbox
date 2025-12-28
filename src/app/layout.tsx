import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GlassBox | Algorithmic X-Ray",
  description: "Debug non-deterministic systems with decision transparency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        {children}
        <Script src="https://js.puter.com/v2/" strategy="beforeInteractive" />
      </body>
    </html>
  );
}