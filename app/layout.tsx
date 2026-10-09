import { ClerkProvider } from "@clerk/nextjs";

import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const siteUrl = SITE_URL;
const siteName = SITE_NAME;
const siteDescription =
  "The official digital repository of Taraba State University postgraduate research — theses, dissertations, and scholarly work from every faculty, archived, searchable, and citable.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Taraba State University`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "Taraba State University",
    "TSU",
    "postgraduate research",
    "thesis repository",
    "dissertation archive",
    "Nigerian university research",
    "College of Postgraduate Studies",
    "Jalingo",
  ],
  authors: [{ name: "Taraba State University, College of Postgraduate Studies" }],
  creator: "KMFenterprise",
  publisher: "Taraba State University",
  applicationName: siteName,
  category: "education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/assets/tsu_logo1.png",
    shortcut: "/assets/tsu_logo1.png",
    apple: "/assets/tsu_logo1.png",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: siteUrl,
    siteName,
    title: `${siteName} | Taraba State University`,
    description: siteDescription,
    images: [
      {
        url: "/assets/tsu_logo1.png",
        width: 512,
        height: 512,
        alt: "Taraba State University",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${siteName} | Taraba State University`,
    description: siteDescription,
    images: ["/assets/tsu_logo1.png"],
  },
  other: {
    "theme-color": "#185fa5",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,500&family=IBM+Plex+Mono:wght@400;500&display=swap"
          />
        </head>
        <body className="flex flex-col min-h-screen">
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}