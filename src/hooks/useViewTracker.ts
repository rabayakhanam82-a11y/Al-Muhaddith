import { useEffect } from "react";
import type { HadithNode } from "../types";
import { useLibrary } from "../state/LibraryContext";
import { VIEW_COMMIT_MS, VIEW_THRESHOLD } from "../data/constants";

/**
 * Global Reactive Auditing Engine, IntersectionObserver based.
 * A card that remains visible (>= threshold) for 3 continuous seconds
 * commits a view into IndexedDB and updates the history trail.
 */
export function useViewTracker(nodes: HadithNode[]) {
  const { commitView } = useLibrary();

  useEffect(() => {
    const container = document.getElementById("hadith-cards-container");
    if (!container || nodes.length === 0) return;

    const entryTimestamps = new Map<string, number>();
    const committed = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id =
            entry.target instanceof HTMLElement
              ? entry.target.dataset.id
              : undefined;
          if (!id) continue;

          if (entry.isIntersecting) {
            if (!entryTimestamps.has(id)) {
              entryTimestamps.set(id, Date.now());
            }
          } else {
            const since = entryTimestamps.get(id);
            entryTimestamps.delete(id);
            if (
              since !== undefined &&
              Date.now() - since >= VIEW_COMMIT_MS &&
              !committed.has(id)
            ) {
              committed.add(id);
              const node = nodes.find((n) => n.id === id);
              if (node) void commitView(node);
            }
          }
        }
      },
      { root: null, threshold: VIEW_THRESHOLD },
    );

    const scan = () => {
      container
        .querySelectorAll<HTMLElement>("[data-hadith-card]")
        .forEach((card) => observer.observe(card));
    };

    scan();
    const mutation = new MutationObserver(scan);
    mutation.observe(container, { childList: true, subtree: false });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, [nodes, commitView]);
}
