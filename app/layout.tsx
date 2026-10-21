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
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Taraba State University`,
    description: siteDescription,
  },
  other: {
    "theme-color": "#0f1f3d",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="flex flex-col min-h-screen">
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}