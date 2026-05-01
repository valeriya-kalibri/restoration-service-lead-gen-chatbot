import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";



export const metadata: Metadata = {
  title: "Kalibri - Restoration Lead Capture",
  description: "AI-powered lead capture chatbot for restoration and emergency home service businesses.",
};

// comment: this initiate the font that was imported from google fonts 
const montserratFont = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["500", "600", "700", "800", "900"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserratFont.className} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
