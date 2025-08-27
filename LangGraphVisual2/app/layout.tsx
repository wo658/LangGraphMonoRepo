import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastContainer } from "@/components/toast-container"
import { AppHeader } from "@/components/app-header"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "LangGraph GUI ",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem
          disableTransitionOnChange={false}
        >
          <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
            <ToastContainer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
