// Import optimization settings.
//
// The plugin imports a web-sized derivative from Frontify's CDN rather than the
// raw original. These settings let editors tune the imported master; sensible
// defaults mean the plugin works without any configuration.

export type ImportFormat = "webp" | "jpeg";

export interface ImportSettings {
  /** Output format of the imported file. */
  format: ImportFormat;
  /** Longest-edge cap in px. `0` means no cap (full-resolution derivative). */
  maxWidth: number;
  /** Encoding quality, 1-100. */
  quality: number;
}

export const DEFAULT_IMPORT_SETTINGS: ImportSettings = {
  format: "webp",
  maxWidth: 2560,
  quality: 82,
};

function coerceMaxWidth(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  return DEFAULT_IMPORT_SETTINGS.maxWidth;
}

function coerceQuality(value: unknown): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 1 &&
    value <= 100
  ) {
    return Math.round(value);
  }
  return DEFAULT_IMPORT_SETTINGS.quality;
}

/** Read (and normalize) import settings from the plugin parameters. */
export function getImportSettings(parameters: unknown): ImportSettings {
  const raw =
    parameters && typeof parameters === "object"
      ? (parameters as { importSettings?: Partial<ImportSettings> })
          .importSettings
      : undefined;

  return {
    format: raw?.format === "jpeg" ? "jpeg" : "webp",
    maxWidth: coerceMaxWidth(raw?.maxWidth),
    quality: coerceQuality(raw?.quality),
  };
}

/** File extension matching the chosen output format. */
export function importExtension(format: ImportFormat): string {
  return format === "jpeg" ? "jpg" : "webp";
}

/**
 * Turn a Frontify CDN preview URL into the URL DatoCMS should import, applying
 * the configured format/size/quality. Uses URL parsing (not string concat) so
 * it is robust regardless of the URL's existing query string.
 */
export function buildImportUrl(
  previewUrl: string,
  settings: ImportSettings
): string {
  try {
    const url = new URL(previewUrl);
    if (settings.maxWidth > 0) {
      url.searchParams.set("width", String(settings.maxWidth));
    } else {
      url.searchParams.delete("width");
    }
    // The master derivative is bound by its longest edge; never force a height.
    url.searchParams.delete("height");
    url.searchParams.set("format", settings.format);
    url.searchParams.set("quality", String(settings.quality));
    return url.toString();
  } catch {
    return previewUrl;
  }
}

/** Rewrite a filename's extension to match the imported format. */
export function toImportFilename(
  filename: string | null | undefined,
  id: string,
  format: ImportFormat
): string {
  const base = (filename ?? id).replace(/\.[a-z0-9]{2,4}$/i, "");
  return `${base}.${importExtension(format)}`;
}
