import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "SGDash",
  description:
    "Single-screen Singapore transport dashboard with clock, weather, MRT, and bus arrivals.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="h-full overflow-hidden bg-[color:var(--theme-background)] text-[color:var(--theme-foreground)]"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
