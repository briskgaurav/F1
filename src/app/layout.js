import { Jura, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import LenisSmoothScroll from "@/components/Lenis/Lenis";

const jura = Jura({
  variable: "--font-jura",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "RIDE THE EXPERIENCE",
  description: "RIDE THE EXPERIENCE",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <LenisSmoothScroll />
      <body
        className={`${jura.variable} ${ibmPlexMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
