"use client";

import { ExternalLink } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { NewsItem } from "@/types";

interface NewsSectionProps {
  news: NewsItem[];
}

export function NewsSection({ news }: NewsSectionProps) {
  if (!news?.length) return null;

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Latest News</h3>
      <div className="space-y-3">
        {news.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 group hover:opacity-80 transition-opacity"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors" style={{ color: "var(--text)" }}>
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--muted)" }}>
                <span>{item.publisher}</span>
                <span>·</span>
                <span>{timeAgo(item.published_at)}</span>
              </div>
            </div>
            <ExternalLink size={12} className="flex-shrink-0 mt-1 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color: "var(--muted)" }} />
          </a>
        ))}
      </div>
    </div>
  );
}
