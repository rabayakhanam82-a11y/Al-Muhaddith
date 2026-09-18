import type { GradeEntry } from "../types";

/**
 * Grading framework: maps grade strings to a fixed color language
 * (Sahih mint, Hasan light mint, Da'if ochre, Mawdu' crimson).
 */

type BadgeVariant = "sahih" | "hasan" | "daif" | "mawdu" | "info";

function classifyGrade(grade: string): BadgeVariant {
  const normalized = grade.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized.includes("sahihmuslim") || normalized.includes("sahih")) return "sahih";
  if (normalized.includes("hasan")) return "hasan";
  if (normalized.includes("mawdu") || normalized.includes("fabricat") || normalized.includes("wad")) return "mawdu";
  if (normalized.includes("daif") || normalized.includes("daeef") || normalized.includes("weak") || normalized.includes("munkar")) return "daif";
  return "info";
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  sahih: "border-mint-sahih/50 text-mint-sahih bg-mint-sahih/10",
  hasan: "border-mint-hasan/50 text-mint-hasan bg-mint-hasan/10",
  daif: "border-ochre/50 text-ochre bg-ochre/10",
  mawdu: "border-crimson/50 text-crimson bg-crimson/10",
  info: "border-gold-muted text-gold bg-gold-faint",
};

export function GradeBadge({ grade }: { grade: GradeEntry }) {
  const variant = classifyGrade(grade.grade);
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider shadow-sm transition-colors ${BADGE_STYLES[variant]}`}
      title={`Graded by ${grade.name}`}
    >
      {grade.grade}
    </span>
  );
}

export function GraderBadge({ grade }: { grade: GradeEntry }) {
  return (
    <span className="inline-flex max-w-[220px] items-center truncate rounded-md border border-hairline bg-ink-sunken/80 px-2 py-0.5 text-[11px] font-medium text-stone-mid/90 transition-colors">
      {grade.name}
    </span>
  );
}
