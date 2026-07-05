import type { NewUpload, RenderAssetSourceCtx } from "datocms-plugin-sdk";
import { buildFieldMetadata } from "./assetMetadata";
import { ImportFormat, ImportSettings } from "../utils/config";

/** Build the DatoCMS upload payload for a single Frontify image asset. */
export function buildUpload(
  asset: any,
  settings: ImportSettings,
  locales: string[],
): NewUpload {
  return {
    resource: {
      url: buildImportUrl(asset.previewMaster, settings),
      filename: toImportFilename(asset.filename, asset.id, settings.format),
    },
    author: asset.author ?? undefined,
    notes: asset.description ?? undefined,
    tags: (asset.tags ?? []).map((tag: any) => tag.value),
    copyright: asset.copyright?.notice ?? undefined,
    default_field_metadata: buildFieldMetadata(asset, locales),
  };
}

// `selectMultiple` is a newer host method that is not part of the SDK types;
// feature-detect it at runtime (mirrors DatoCMS's official ai-asset-source
// helper) and otherwise fall back to one select() call per upload.
type BatchSelectionContext = RenderAssetSourceCtx & {
  selectMultiple?: (uploads: NewUpload[]) => void;
};

/** Send one or more uploads to DatoCMS in a single user action. */
export function selectUploads(
  ctx: RenderAssetSourceCtx,
  uploads: NewUpload[],
): void {
  const batchCtx = ctx as BatchSelectionContext;
  if (uploads.length > 1 && typeof batchCtx.selectMultiple === "function") {
    batchCtx.selectMultiple(uploads);
    return;
  }
  for (const upload of uploads) {
    ctx.select(upload);
  }
}

/** Rewrite a filename's extension to match the imported format. */
export function toImportFilename(
  filename: string | null | undefined,
  id: string,
  format: ImportFormat,
): string {
  const base = (filename ?? id).replace(/\.[a-z0-9]{2,4}$/i, "");
  return `${base}.${importExtension(format)}`;
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
  settings: ImportSettings,
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
