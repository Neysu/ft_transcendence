"use client";

import { useMemo } from "react";

type ProfileComicBubbleProps = {
  text: string;
  className?: string;
  compact?: boolean;
};

export function ProfileComicBubble({ text, className = "", compact = false }: ProfileComicBubbleProps) {
  const formattedText = useMemo(() => {
    const normalized = text.replace(/\r\n/g, "\n");
    if (normalized.includes("\n")) {
      return normalized;
    }
    const maxCharsPerLine = compact ? 24 : 30;
    const words = normalized.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return normalized;
    }
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
        continue;
      }
      const candidate = `${currentLine} ${word}`;
      if (candidate.length <= maxCharsPerLine) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines.join("\n");
  }, [compact, text]);

  return (
    <div
      className={`relative max-w-[min(72vw,420px)] rounded-2xl border-2 shadow-[3px_3px_0_0_rgba(15,23,42,0.18)] ${
        compact ? "px-2.5 py-1.5" : "px-3 py-2"
      } ${className}`}
      style={{
        backgroundColor: "var(--profile-bubble-bg)",
        borderColor: "var(--profile-bubble-border)",
        color: "var(--profile-bubble-text)",
      }}
    >
      <p className={`whitespace-pre-wrap break-words text-center font-semibold leading-snug ${compact ? "text-xs" : "text-sm"}`}>
        {formattedText}
      </p>
      <span
        className={`absolute left-1/2 -translate-x-1/2 rotate-45 border-r-2 border-b-2 ${
          compact ? "-bottom-1.5 h-3 w-3" : "-bottom-2 h-4 w-4"
        }`}
        style={{
          backgroundColor: "var(--profile-bubble-bg)",
          borderColor: "var(--profile-bubble-border)",
        }}
      />
    </div>
  );
}
