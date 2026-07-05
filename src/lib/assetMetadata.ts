// Maps a Frontify Image onto DatoCMS upload metadata.
//
// DatoCMS `default_field_metadata` is keyed per locale. Frontify has no
// per-locale alt/title, so we write the same values under every project
// locale. Anything without a native DatoCMS slot (Frontify id, license info,
// expiry, …) is stashed in `custom_data` — notably `frontify_asset_id`, which
// is the only reliable round-trip/dedup anchor (uploads have no writable
// external_id, and md5 dedup never matches because we import a derivative).

export interface FieldMetadata {
  alt: string | null;
  title: string | null;
  custom_data: Record<string, unknown>;
  focal_point?: { x: number; y: number };
}

// Frontify focalPoint is `[Float]`. DatoCMS expects normalized x/y in [0, 1];
// only map it when the values actually fall in that range, otherwise omit it
// (a wrong focal point would fail upload validation).
function toFocalPoint(
  focalPoint: unknown,
): { x: number; y: number } | undefined {
  if (Array.isArray(focalPoint) && focalPoint.length >= 2) {
    const [x, y] = focalPoint;
    if (
      typeof x === "number" &&
      typeof y === "number" &&
      x >= 0 &&
      x <= 1 &&
      y >= 0 &&
      y <= 1
    ) {
      return { x, y };
    }
  }
  return undefined;
}

/** Build the per-locale `default_field_metadata` map for `ctx.select()`. */
export function buildFieldMetadata(
  asset: any,
  locales: string[],
): Record<string, FieldMetadata> {
  const isDecorative = Boolean(asset.isDecorative);
  const alt = isDecorative
    ? ""
    : asset.alternativeText || asset.description || null;
  const title = asset.title || null;

  const customData: Record<string, unknown> = {
    frontify_asset_id: asset.id,
  };

  if (asset.externalId) {
    customData.frontify_external_id = asset.externalId;
  }

  if (asset.copyright?.status) {
    customData.frontify_copyright_status = asset.copyright.status;
  }

  if (isDecorative) {
    customData.frontify_is_decorative = true;
  }

  if (asset.expiresAt) {
    customData.frontify_expires_at = asset.expiresAt;
  }

  const licenseTitles = (asset.licenses ?? [])
    .map((license: any) => license?.title)
    .filter(Boolean);
  if (licenseTitles.length > 0) {
    customData.frontify_licenses = licenseTitles;
  }

  const focalPoint = toFocalPoint(asset.focalPoint);

  const perLocale: FieldMetadata = {
    alt,
    title,
    custom_data: customData,
    ...(focalPoint ? { focal_point: focalPoint } : {}),
  };

  const metadata: Record<string, FieldMetadata> = {};
  for (const locale of locales) {
    metadata[locale] = perLocale;
  }

  return metadata;
}
