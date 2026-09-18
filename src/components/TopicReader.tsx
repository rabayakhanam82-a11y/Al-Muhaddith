import { useEffect, useMemo, useState } from "react";
import type { HadithNode } from "../types";
import {
  fetchEncHadith,
  resolveToReader,
  type EncHadith,
  type MatchCandidate,
  type ReaderResolution,
} from "../data/hadeethenc";

/**
 * Topic Reader (HadeethEnc layer): shows the encyclopedia record for a
 * narration, then the resolution system links it to the same hadith in the
 * app's own CDN-indexed reader. Resolution runs against the collections the
 * app has hydrated into memory; if none match, a HadeethEnc.com source link
 * is offered instead of a dead end.
 */
export function TopicReader({
  encId,
  language,
  indexBuckets,
  onOpenNode,
  onClose,
}: {
  encId: string | null;
  language: string;
  /** Hydrated nodes grouped per collection, used by the matching system. */
  indexBuckets: HadithNode[][];
  onOpenNode: (node: HadithNode) => void;
  onClose: () => void;
}) {
  const [record, setRecord] = useState<EncHadith | null>(null);
  const [failed, setFailed] = useState(false);
  const [resolution, setResolution] = useState<ReaderResolution | null>(null);
  const [matchNode, setMatchNode] = useState<HadithNode | null>(null);

  useEffect(() => {
    if (!encId) return;
    let alive = true;
    setRecord(null);
    setFailed(false);
    setResolution(null);
    setMatchNode(null);
    fetchEncHadith(encId, language)
      .then((r) => {
        if (!alive) return;
        setRecord(r);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [encId, language]);

  // Resolution pass: once the record and the index buckets are present,
  // match the ENC narration into the app's own collections.
  useEffect(() => {
    if (!record) return;
    const candidates: MatchCandidate[] = indexBuckets.flat().map((n) => ({
      id: n.id,
      collectionKey: n.collection,
      hadithNumber: n.hadithNumber,
      text: `${n.translatedText} ${n.sectionName}`.toLowerCase(),
      arabicText: n.arabicText,
    }));
    const res = resolveToReader(
      record.hadeethAr,
      `${record.hadeeth} ${record.title}`,
      candidates,
    );
    setResolution(res);
    if (res.node) {
      const hit = indexBuckets
        .flat()
        .find((n) => n.id === res.node?.id);
      setMatchNode(hit ?? null);
    }
  }, [record, indexBuckets]);

  const bucketsReady = useMemo(
    () => indexBuckets.some((b) => b.length > 0),
    [indexBuckets],
  );

  if (!encId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Topic reader from HadeethEnc"
    >
      <div
        className="panel max-h-[88vh] w-full max-w-3xl overflow-y-auto bg-ink-panel p-6 sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
              Topic Reader
            </p>
            <p className="mt-1 text-xs text-stone-mid">
              Encyclopedia of Translated Prophetic Hadiths (HadeethEnc.com)
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost border border-gold-muted text-xs" aria-label="Close topic reader">
            Close
          </button>
        </div>

        {failed && (
          <p className="border border-crimson/40 p-5 text-sm text-stone-mid">
            The encyclopedia record could not be loaded. Check the connection
            and try again.
          </p>
        )}

        {!failed && !record && (
          <p className="animate-soft-pulse p-5 text-sm text-stone-mid">
            Loading the encyclopedia record…
          </p>
        )}

        {record && (
          <div className="space-y-6">
            {record.hadeethAr && (
              <p className="arabic-text border-b border-hairline pb-5">
                {record.hadeethAr}
              </p>
            )}
            <p className="translation-text">{record.hadeeth}</p>

            {(record.attribution || record.grade) && (
              <p className="text-xs text-stone-mid">
                {record.grade}
                {record.grade && record.attribution ? " · " : ""}
                {record.attribution}
              </p>
            )}

            {record.explanation && (
              <div className="border-l-2 border-gold-muted pl-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-stone-mid">
                  Explanation (HadeethEnc.com)
                </p>
                <p className="text-sm leading-relaxed text-stone-mid">
                  {record.explanation}
                </p>
              </div>
            )}

            {/* Resolution system: route to the same hadith in the app's API */}
            <div className="border-t border-hairline pt-5">
              {!bucketsReady ? (
                <p className="text-xs text-stone-mid">
                  Open one of the six collections to link this narration into
                  the local reader index.
                </p>
              ) : resolution?.node ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => matchNode && onOpenNode(matchNode)}
                    disabled={!matchNode}
                    className="border border-gold bg-gold-faint px-4 py-2 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold-muted disabled:opacity-50"
                  >
                    Open in the local reader
                    {resolution.kind === "reference" ? " (matched reference)" : ""}
                  </button>
                  {matchNode && (
                    <span className="text-xs text-stone-mid">
                      Matched to {matchNode.collection} No. {matchNode.hadithNumber}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-stone-mid">
                  No counterpart found in the loaded collections. Read this
                  narration at{" "}
                  <a
                    href={`https://hadeethenc.com/app/#/hadeeth?hadeeth=${encodeURIComponent(record.id)}&lang=${encodeURIComponent(language)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold underline"
                  >
                    HadeethEnc.com
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
