import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "../components/theme-provider"; 
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { Toaster } from 'sonner';




export const metadata: Metadata = {
  title: "Zume",
  description: "AI for your repo",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>

    <html lang="en"  suppressHydrationWarning className={`${geist.variable}`} >
      <body>
      <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Toaster/>
        </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
