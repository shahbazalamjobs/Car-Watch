// import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/header";

import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "Car-Watch",
  description: "Find your dream Car",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});


export default function RootLayout({ children }) {
  return (

    <ClerkProvider>
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">

        <Header/>
        <main className="min-h-screen">
          {children}
        </main>  

        <Toaster richColors />

        <footer className="bg-blue-50 py-12"> 
          <div className="container mx-auto px-4 text-center text-gray-600">
            Made with ❤️ by Shahbaz
          </div> 
        </footer>

      </body>
    </html>
    </ClerkProvider>

  );
}
