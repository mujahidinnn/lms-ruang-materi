"use client";

import { Home, Layers, LayoutDashboard, LogIn, Route } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSignedIn } from "@/components/auth/useSignedIn";

// Phones: the main links as a floating pill at the bottom, within thumb reach.
// globals.css pads the body while it is on screen.
export default function MobileNav() {
  const path = usePathname();
  const signedIn = useSignedIn();
  const items = [
    { href: "/", label: "Beranda", icon: Home, on: path === "/" },
    { href: "/roadmap", label: "Roadmap", icon: Route, on: path.startsWith("/roadmap") },
    { href: "/flashcard", label: "Flashcard", icon: Layers, on: path.startsWith("/flashcard") },
    signedIn
      ? { href: "/dasbor", label: "Dasbor", icon: LayoutDashboard, on: ["/dasbor", "/nilai", "/profil"].some((p) => path.startsWith(p)) }
      : { href: "/masuk", label: "Masuk", icon: LogIn, on: path.startsWith("/masuk") },
  ];
  return (
    <nav
      aria-label="Navigasi utama"
      data-mobile-nav
      className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex w-fit gap-2 rounded-full bg-zinc-900/90 p-2 shadow-soft backdrop-blur sm:hidden"
    >
      {items.map(({ href, label, icon: Icon, on }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          aria-current={on ? "page" : undefined}
          className={`grid size-12 place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
            on ? "bg-zinc-50 text-zinc-950" : "bg-zinc-800 text-zinc-400 hover:text-zinc-50"
          }`}
        >
          <Icon aria-hidden className="size-5" />
        </Link>
      ))}
    </nav>
  );
}
