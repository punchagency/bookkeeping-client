import type { Metadata } from "next";
import { Afacad_Flux } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ReactHotToaster } from "react-hot-toast";
import Providers from "./providers";
import "./globals.css";

const afacadFlux = Afacad_Flux({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Punch Bookkeeping Demo",
  description: "Mx Project Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={` ${afacadFlux.className} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster position="top-center" />
        <ReactHotToaster />
      </body>
    </html>
  );
}
