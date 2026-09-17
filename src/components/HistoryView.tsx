import { useState } from "react";
import { HISTORY_ERAS, SCHOLAR_METHODS } from "../data/history";
import { useLibrary } from "../state/LibraryContext";

/**
 * History of Hadith module: interactive timeline across the classic
 * compilation hubs, with Asma al-Rijal methodology layers.
 */
export function HistoryView() {
  const [eraIndex, setEraIndex] = useState(0);
  const [hubIndex, setHubIndex] = useState(0);

  const era = HISTORY_ERAS[eraIndex];

  return (
    <div className="space-y-8">
      <section className="panel border-l-4 border-l-gold p-6 sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
          Epistemological History
        </p>
        <h1 className="mt-2 text-2xl font-bold text-parchment sm:text-3xl">
          How the Ummah preserved the Prophet's ﷺ words
        </h1>
        <p className="mt-3 max-w-3xl leading-relaxed text-stone-mid">
          From memorized hearts to graded canonical books: trace the
          documentation methodology, the great transmission hubs, and the
          biographical evaluation science (Asma al-Rijal) that powers every
          grading badge in this app.
        </p>
      </section>

      {/* Era tabs */}
      <div className="flex flex-wrap gap-2">
        {HISTORY_ERAS.map((e, i) => (
          <button
            key={e.id}
            onClick={() => {
              setEraIndex(i);
              setHubIndex(0);
            }}
            className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              eraIndex === i
                ? "border-gold bg-gold-faint text-gold shadow-sm"
                : "border-hairline text-stone-mid hover:border-gold-muted hover:text-parchment"
            }`}
          >
            {e.epoch}
            <span className="ml-2 font-normal opacity-70">{e.period}</span>
          </button>
        ))}
      </div>

      <section className="panel p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gold">{era.epoch}</h2>
        <p className="mt-2 leading-relaxed text-stone-mid">{era.summary}</p>

        <div className="timeline mt-8 border-l border-hairline pl-8">
          {era.hubs.map((h, i) => (
            <div key={h.id} className="timeline-node relative pb-8">
              <span
                aria-hidden="true"
                className="absolute -left-[37px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold shadow-sm"
              />
              <button
                onClick={() => setHubIndex(i)}
                className="text-left"
              >
                <p className="timeline-title font-semibold text-gold hover:underline">
                  {h.city} · {h.region}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-stone-mid/70">
                  {h.period}
                </p>
              </button>

              {hubIndex === i && (
                <div className="mt-3 rounded-xl border border-hairline bg-ink-sunken/60 p-4">
                  <p className="text-sm font-semibold text-parchment">
                    {h.headline}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-mid">
                    {h.body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {h.scholars.map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-hairline bg-ink-sunken px-2.5 py-0.5 text-[11px] font-medium text-stone-mid"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Methodology layers */}
      <section aria-label="Documentation methodology">
        <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
          Asma al-Rijal · Evaluation Methodology
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {SCHOLAR_METHODS.map((m) => (
            <div key={m.id} className="rounded-xl border border-hairline bg-ink-sunken p-5 transition-all hover:border-gold-muted">
              <h3 className="font-semibold text-gold">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-mid">
                {m.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
          Your Reading Trail
        </h2>
        <ReadingTrail />
      </section>
    </div>
  );
}

function ReadingTrail() {
  const { history, views } = useLibrary();
  if (history.length === 0) {
    return (
      <p className="text-sm text-stone-mid">
        Narrations you dwell on for a few seconds will chart your personal
        history here.
      </p>
    );
  }
  return (
    <ol className="space-y-2">
      {history.slice(0, 12).map((h) => (
        <li
          key={h.id}
          className="flex items-center justify-between rounded-lg bg-black/20 px-4 py-2.5 text-sm"
        >
          <span className="truncate text-stone-mid">
            {h.collectionKey}-{h.id.split("-").slice(1).join("-")}
          </span>
          <span className="shrink-0 text-[11px] text-stone-mid/70">
            {views.get(h.id) ?? 0} views ·{" "}
            {new Date(h.visitedAt).toLocaleTimeString()}
          </span>
        </li>
      ))}
    </ol>
  );
}
