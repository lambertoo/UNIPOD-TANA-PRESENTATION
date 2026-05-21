import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Visitor Counter",
  description: "Real-time visitor counting dashboard with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-gray-950 text-white min-h-screen">
        <div className="flex">
          <Navigation />
          <main className="flex-1 p-6 ml-56">{children}</main>
        </div>
      </body>
    </html>
  );
}
