import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { JsonLd } from "@/components/json-ld";
import { ThemeProvider } from "@/components/theme-provider";
import {
  githubUrl,
  npmUrl,
  siteDescription,
  siteTitle,
  siteUrl,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  keywords: [
    "macOS keep awake lid closed",
    "mac prevent sleep close lid",
    "pmset disablesleep",
    "clamshell mode without external display",
    "caffeinate alternative",
    "menu bar keep awake",
    "cli for ai agents",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "awake",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "awake",
      operatingSystem: "macOS 13+",
      applicationCategory: "DeveloperApplication",
      description: siteDescription,
      url: siteUrl,
      downloadUrl: npmUrl,
      installUrl: npmUrl,
      sameAs: [githubUrl, npmUrl],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      license: "https://opensource.org/licenses/MIT",
      author: {
        "@type": "Organization",
        name: "Crafter Station",
        url: "https://crafterstation.com",
      },
    },
    {
      "@type": "WebSite",
      name: "awake",
      url: siteUrl,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <JsonLd data={jsonLd} />
        <Analytics />
      </body>
    </html>
  );
}
