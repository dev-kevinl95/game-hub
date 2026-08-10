import type { Metadata } from "next";
import { Bungee, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bungee = Bungee({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Game Hub - Kevl95",
    template: "%s | Game Hub",
  },
  description: "Juega a tus juegos HTML5 favoritos gratis en tu navegador.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${bungee.variable}`}
    >
      <body>
        <header className="app-header">
          <div className="header-inner">
            <Link href="/" className="brand">
              Game Developer
            </Link>
            <nav className="main-nav">
              <Link href="/" className="nav-link">
                Inicio
              </Link>
              <Link href="/blog" className="nav-link">
                Blog
              </Link>
              <Link href="/admin" className="nav-link">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="site-main">{children}</main>
        <footer className="app-footer">Una plataforma web desarrollada con Next.js para mostrar y jugar mis proyectos de videojuegos directamente desde el navegador.</footer>
      </body>
    </html>
  );
}