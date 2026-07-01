import type { NewUpload, RenderAssetSourceCtx } from "datocms-plugin-sdk";
import {
  buildImportUrl,
  ImportSettings,
  toImportFilename,
} from "./importSettings";
import { buildFieldMetadata } from "./assetMetadata";

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
