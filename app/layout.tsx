import type { Metadata } from "next";
import { Bungee, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { AdminLink } from "@/components/AdminLink";
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
            <nav className="main-nav">
              <Link href="/" className="nav-link">
                Inicio
              </Link>
              <Link href="/blog" className="nav-link">
                Blog
              </Link>
              <AdminLink />
            </nav>
          </div>
        </header>
        <main className="site-main">{children}</main>
        <footer className="app-footer">
          <p className="footer-text">
            Una plataforma web desarrollada con Next.js para mostrar y jugar mis proyectos de videojuegos directamente desde el navegador.
          </p>
          <div className="footer-socials">
            <a
              href="https://github.com/dev-kevinl95"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/eder-kevin-larico-osco-60225a229/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social"
              aria-label="LinkedIn"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05a3.75 3.75 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0Z" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@ederkevinlaricoosco1235"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social"
              aria-label="YouTube"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
              </svg>
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}