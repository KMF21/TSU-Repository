import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

export const metadata = {
  title: "TSU Postgraduate Repository",
  description: "Digital repository for Taraba State University postgraduate research.",
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