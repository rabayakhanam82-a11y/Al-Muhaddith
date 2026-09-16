import { useMemo } from "react";

/** Renders text with blueprint `search-highlight` spans around regex matches. */
export function HighlightedText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const parts = useMemo(() => {
    if (!query.trim()) return [{ text, match: false }];
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      return text
        .split(new RegExp(`(${escaped})`, "gi"))
        .map((part) => ({ text: part, match: part.toLowerCase() === query.toLowerCase() }));
    } catch {
      return [{ text, match: false }];
    }
  }, [text, query]);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.match ? (
          <mark key={i} className="search-highlight bg-transparent">
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </span>
  );
}
