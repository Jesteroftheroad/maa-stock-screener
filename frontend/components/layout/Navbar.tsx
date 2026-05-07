"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Search, Eye, Terminal, Bookmark, BarChart2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalSearch } from "./GlobalSearch";
import { cn } from "@/lib/utils";

const links = [
  { href: "/",            label: "Dashboard",   icon: Activity,  accent: "#4488ff" },
  { href: "/screener",    label: "Screener",    icon: Search,    accent: "#4488ff" },
  { href: "/smart-money", label: "Smart Money", icon: Eye,       accent: "#aa44ff" },
  { href: "/deep-dive",   label: "Deep Dive",   icon: Terminal,  accent: "#00ff88" },
  { href: "/watchlist",   label: "Watchlist",   icon: Bookmark,  accent: "#ffcc44" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "rgba(5,8,22,0.88)",
        borderColor: "rgba(30,32,69,0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 1px 0 rgba(68,136,255,0.06), 0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-1 flex-shrink-0 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
            style={{
              background: "linear-gradient(135deg, #4488ff, #00ccff)",
              boxShadow: "0 0 14px rgba(68,136,255,0.4)",
            }}
          >
            <BarChart2 size={14} className="text-white" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-bold text-sm tracking-wide" style={{ color: "var(--text)" }}>
              MAA<span style={{ color: "#4488ff" }}>·AI</span>
            </span>
            <span className="text-[9px] tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              Market Intelligence
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          {links.map(({ href, label, icon: Icon, accent }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  active ? "" : "hover:bg-white/5"
                )}
                style={
                  active
                    ? {
                        background: `${accent}18`,
                        color: accent,
                        boxShadow: `0 0 12px ${accent}20`,
                        border: `1px solid ${accent}28`,
                      }
                    : {
                        color: "var(--muted)",
                        border: "1px solid transparent",
                      }
                }
              >
                <Icon size={14} />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <GlobalSearch />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
