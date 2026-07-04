import React from "react";
import "./global.css";

export const metadata = {
  title: "CrossCheck Dashboard",
  description: "Reputation and payment verification layer for AI coding agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0B0D19] min-h-screen">
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>
      </body>
    </html>
  );
}
