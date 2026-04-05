// app/layout.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alpenwiese — Social Media Agent",
  description: "KI-gestütztes Instagram-Management für Alpenwiese Medizinal Cannabis",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Playfair+Display:wght@700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", background: "#FAFDF6" }}>
        {children}
      </body>
    </html>
  );
}
