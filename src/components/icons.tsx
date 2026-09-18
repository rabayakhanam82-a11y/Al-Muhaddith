/**
 * Icon system: real downloaded SVG assets (Tabler outline set, MIT) imported
 * raw and inlined, so every glyph is a hand-checked vector file in
 * src/assets/icons rather than CSS drawings or emojis.
 */
import menuSvg from "../assets/icons/menu-2.svg?raw";
import searchSvg from "../assets/icons/search.svg?raw";
import homeSvg from "../assets/icons/home.svg?raw";
import bookSvg from "../assets/icons/book-2.svg?raw";
import bookmarkSvg from "../assets/icons/bookmark.svg?raw";
import historySvg from "../assets/icons/history.svg?raw";
import settingsSvg from "../assets/icons/settings.svg?raw";
import xSvg from "../assets/icons/x.svg?raw";
import chevronDownSvg from "../assets/icons/chevron-down.svg?raw";
import arrowRightSvg from "../assets/icons/arrow-right.svg?raw";
import languageSvg from "../assets/icons/language.svg?raw";
import eyeSvg from "../assets/icons/eye.svg?raw";
import bookmarkFilledSvg from "../assets/icons/bookmark-filled.svg?raw";
import foldersSvg from "../assets/icons/folders.svg?raw";
import linkSvg from "../assets/icons/link.svg?raw";
import externalLinkSvg from "../assets/icons/external-link.svg?raw";
import sitemapSvg from "../assets/icons/sitemap.svg?raw";

/** Inlines a downloaded SVG source with a configurable pixel size. */
function Svg({ src, size }: { src: string; size: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-full transition-transform"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: src }}
    />
  );
}

type IconProps = { size?: number };

export function MenuIcon({ size = 20 }: IconProps) {
  return <Svg src={menuSvg} size={size} />;
}

export function SearchIcon({ size = 16 }: IconProps) {
  return <Svg src={searchSvg} size={size} />;
}

export function HomeIcon({ size = 18 }: IconProps) {
  return <Svg src={homeSvg} size={size} />;
}

export function BookIcon({ size = 18 }: IconProps) {
  return <Svg src={bookSvg} size={size} />;
}

export function BookmarkIcon({ size = 18 }: IconProps) {
  return <Svg src={bookmarkSvg} size={size} />;
}

export function HistoryIcon({ size = 18 }: IconProps) {
  return <Svg src={historySvg} size={size} />;
}

export function SettingsIcon({ size = 16 }: IconProps) {
  return <Svg src={settingsSvg} size={size} />;
}

export function XIcon({ size = 16 }: IconProps) {
  return <Svg src={xSvg} size={size} />;
}

export function ChevronDownIcon({ size = 14 }: IconProps) {
  return <Svg src={chevronDownSvg} size={size} />;
}

export function ArrowRightIcon({ size = 14 }: IconProps) {
  return <Svg src={arrowRightSvg} size={size} />;
}

export function LanguageIcon({ size = 18 }: IconProps) {
  return <Svg src={languageSvg} size={size} />;
}

export function EyeIcon({ size = 14 }: IconProps) {
  return <Svg src={eyeSvg} size={size} />;
}

export function BookmarkFilledIcon({ size = 15 }: IconProps) {
  return <Svg src={bookmarkFilledSvg} size={size} />;
}

export function FoldersIcon({ size = 15 }: IconProps) {
  return <Svg src={foldersSvg} size={size} />;
}

export function LinkIcon({ size = 15 }: IconProps) {
  return <Svg src={linkSvg} size={size} />;
}

export function ExternalLinkIcon({ size = 15 }: IconProps) {
  return <Svg src={externalLinkSvg} size={size} />;
}

export function SitemapIcon({ size = 15 }: IconProps) {
  return <Svg src={sitemapSvg} size={size} />;
}

/**
 * Typographic collection mark: the collection's initial Arabic letter set in
 * the display serif inside a hairline square. Purely a letter, not an emoji.
 */
export function CollectionGlyph({
  glyph,
  size = "md",
}: {
  glyph: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-5 w-5 text-[11px] rounded" : "h-7 w-7 text-sm rounded-md";
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center border border-hairline bg-ink-sunken font-arabic leading-none text-gold shadow-sm ${box}`}
    >
      {glyph}
    </span>
  );
}
