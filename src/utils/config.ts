import { Token } from "@frontify/frontify-authenticator";

export type ImportFormat = "webp" | "jpeg";
const importFormatValues = ["webp", "jpeg"] as const;

export type ImportSettings = {
  format: ImportFormat;
  maxWidth: number;
  quality: number;
};

type ConfigParameters = {
  token?: Token | null;
  importSettings?: ImportSettings;
};

export type NormalizedConfigParameters = {
  token: Token | null;
  importSettings: ImportSettings;
};

export type AuthCredentials = {
  domain: string;
  accessToken: string;
};

const defaultConfigParameters: NormalizedConfigParameters = {
  token: null,
  importSettings: {
    format: "webp",
    maxWidth: 1920,
    quality: 80,
  },
};

export function normalizeConfigParameters(
  parameters: ConfigParameters = {},
): NormalizedConfigParameters {
  return {
    token: parameters.token ?? null,
    importSettings: {
      format: resolveImageOutputFormat(parameters.importSettings?.format),
      maxWidth: resolveMaxWidth(parameters.importSettings?.maxWidth),
      quality: resolveImageQuality(parameters.importSettings?.quality),
    },
  };
}

export function resolveAuthCredentials(
  token: Token | null,
): AuthCredentials | null {
  const bearerToken = token?.bearerToken;
  const domain =
    typeof bearerToken?.domain === "string" ? bearerToken.domain.trim() : "";
  const accessToken =
    typeof bearerToken?.accessToken === "string"
      ? bearerToken.accessToken.trim()
      : "";

  if (!domain || !accessToken) {
    return null;
  }

  return { domain, accessToken };
}

function resolveImageQuality(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultConfigParameters.importSettings.quality;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function resolveMaxWidth(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  return defaultConfigParameters.importSettings.maxWidth;
}

function resolveImageOutputFormat(value: unknown): ImportFormat {
  return isImageOutputFormat(value)
    ? value
    : defaultConfigParameters.importSettings.format;
}

function isImageOutputFormat(value: unknown): value is ImportFormat {
  return (
    typeof value === "string" &&
    importFormatValues.includes(value as (typeof importFormatValues)[number])
  );
}
