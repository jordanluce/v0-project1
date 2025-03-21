import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import OrientationAlert from "@/components/OrientationAlert"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Court360 | Professional Wheelchair Basketball Management",
  description: "Advanced coaching and team management platform for wheelchair basketball professionals",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <OrientationAlert />
        {children}
      </body>
    </html>
  )
}



import './globals.css'