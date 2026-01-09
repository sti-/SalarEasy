import "./globals.css";
import Navigation from "./components/Navigation";
import type { ReactNode } from "react";

export const metadata = {
  title: "My First Project",
  description: "A Next.js app",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#f8f9fa' }}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}



