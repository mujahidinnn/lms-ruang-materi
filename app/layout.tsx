import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import ServiceWorker from "@/components/ServiceWorker";
import { Babylonica, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Plus Jakarta Sans: a geometric sans drawn for Jakarta, round enough for
// the pastel UI and solid in bold headings.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const babylonica = Babylonica({
  variable: "--font-signature",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · Ruang Belajar Interaktif`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "materi belajar interaktif",
    "slide interaktif",
    "pptx ke web",
    "belajar git",
    "belajar html css javascript",
    "presentasi interaktif",
    "ruang materi",
  ],
  authors: [{ name: "Mujahidin", url: "https://mujahidin.my.id" }],
  alternates: {
    canonical: SITE_URL,
  },
  icons: { apple: "/icons/apple-touch-icon.png" },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · Ruang Belajar Interaktif`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · Ruang Belajar Interaktif`,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#f2f1f7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${geistMono.variable} ${babylonica.variable} h-full antialiased`}
      // data-theme is set by the script below before React hydrates.
      suppressHydrationWarning
    >
      <head>
        {/* Applies a saved theme before first paint, so there is no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("ruang-materi:tema");if(t==="dark")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        {children}
        <ServiceWorker />
        {/* Cookieless page views (GUIDELINE, Privacy); no-op outside Vercel. */}
        <Analytics />
      </body>
    </html>
  );
}
