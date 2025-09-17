import type React from "react"
import type { Metadata } from "next"
import { LanguageProvider } from "@/contexts/language-context"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"
import "../styles/construction-report.css"

export const metadata: Metadata = {
  title: "ConstructVN - Construction Management System",
  description: "Professional construction project management system",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
