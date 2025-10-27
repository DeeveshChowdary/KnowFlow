import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "KnowFlow",
  description: "Explain complex research papers with fast graphs and summaries",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {children}
      </body>
    </html>
  );
}
