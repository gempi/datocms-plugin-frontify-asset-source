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
  tokenObtainedAt?: number | null;
  importSettings?: ImportSettings;
};

export type NormalizedConfigParameters = {
  token: Token | null;
  // Unix time in ms when the token was issued. Null for tokens stored before it was tracked.
  tokenObtainedAt: number | null;
  importSettings: ImportSettings;
};

export type AuthCredentials = {
  domain: string;
  accessToken: string;
};

const defaultConfigParameters: NormalizedConfigParameters = {
  token: null,
  tokenObtainedAt: null,
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
    tokenObtainedAt:
      typeof parameters.tokenObtainedAt === "number" && Number.isFinite(parameters.tokenObtainedAt)
        ? parameters.tokenObtainedAt
        : null,
    importSettings: {
      format: resolveImageOutputFormat(parameters.importSettings?.format),
      maxWidth: resolveMaxWidth(parameters.importSettings?.maxWidth),
      quality: resolveImageQuality(parameters.importSettings?.quality),
    },
  };
}

function resolveTokenLifetimeMs(token: Token): number | null {
  const expiresIn = token.bearerToken?.expiresIn;
  return typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0
    ? expiresIn * 1000
    : null;
}

// Refresh once half of the token lifetime has passed, or when the issue time is unknown.
export function isTokenRefreshDue(
  { token, tokenObtainedAt }: NormalizedConfigParameters,
  now: number,
): boolean {
  if (!token) {
    return false;
  }

  const lifetimeMs = resolveTokenLifetimeMs(token);

  if (tokenObtainedAt === null || lifetimeMs === null) {
    return true;
  }

  return now - tokenObtainedAt >= lifetimeMs / 2;
}

export function isTokenExpired(
  { token, tokenObtainedAt }: NormalizedConfigParameters,
  now: number,
): boolean {
  if (!token || tokenObtainedAt === null) {
    return false;
  }

  const lifetimeMs = resolveTokenLifetimeMs(token);

  return lifetimeMs !== null && now - tokenObtainedAt >= lifetimeMs;
}

export function resolveAuthCredentials(token: Token | null): AuthCredentials | null {
  const bearerToken = token?.bearerToken;
  const domain = typeof bearerToken?.domain === "string" ? bearerToken.domain.trim() : "";
  const accessToken =
    typeof bearerToken?.accessToken === "string" ? bearerToken.accessToken.trim() : "";

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
  return isImageOutputFormat(value) ? value : defaultConfigParameters.importSettings.format;
}

function isImageOutputFormat(value: unknown): value is ImportFormat {
  return (
    typeof value === "string" &&
    importFormatValues.includes(value as (typeof importFormatValues)[number])
  );
}
