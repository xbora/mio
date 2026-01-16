import "@radix-ui/themes/styles.css";
import "./globals.css";

import type { Metadata } from "next";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";

export const metadata: Metadata = {
  title: "Mio — Build Your Personal AI",
  description: "One AI instead of 100 apps. Name it, give it skills, own it.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "Mio — Build Your Personal AI",
    description: "One AI instead of 100 apps. Name it, give it skills, own it.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Mio — Build Your Personal AI",
    description: "One AI instead of 100 apps. Name it, give it skills, own it.",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthKitProvider>
          {children}
        </AuthKitProvider>
      </body>
    </html>
  );
}
