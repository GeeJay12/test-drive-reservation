import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "NEVO Test Drive Reservation",
  description: "Book test drive slots and check availability in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`bg-slate-950 text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
