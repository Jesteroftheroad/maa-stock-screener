"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Search, Bookmark, Activity, Terminal, Eye } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/",            label: "Dashboard",   icon: Activity },
  { href: "/screener",    label: "Screener",    icon: Search },
  { href: "/smart-money", label: "Smart Money", icon: Eye },
  { href: "/deep-dive",   label: "Deep Dive",   icon: Terminal },
  { href: "/watchlist",   label: "Watchlist",   icon: Bookmark },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b backdrop-blur-md"
         style={{ backgroundColor: "rgba(10,10,15,0.85)", borderColor: "var(--border)" }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <BarChart2 size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide hidden sm:block" style={{ color: "var(--text)" }}>
            MAA<span className="text-blue-400">·AI</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-muted-var hover:text-current hover:bg-white/5"
                )}
              >
                <Icon size={15} />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
