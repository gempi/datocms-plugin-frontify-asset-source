import { RenderConfigScreenCtx } from "datocms-plugin-sdk";
import { Button, Canvas, SelectInput, TextInput } from "datocms-react-ui";
import { useState } from "react";
import {
  authorize,
  Token,
  revoke,
  refresh,
} from "@frontify/frontify-authenticator";
import {
  DEFAULT_IMPORT_SETTINGS,
  getImportSettings,
  ImportFormat,
  ImportSettings,
} from "../lib/importSettings";

type Props = {
  ctx: RenderConfigScreenCtx;
};

type ImportParameters = { importSettings?: ImportSettings };
type FreshInstallationParameters = { token: null } & ImportParameters;
export type ValidParameters = { token: Token } & ImportParameters;

type Parameters = FreshInstallationParameters | ValidParameters;

type FormatOption = { label: string; value: ImportFormat };

const FORMAT_OPTIONS: FormatOption[] = [
  { label: "Optimized WebP (recommended)", value: "webp" },
  { label: "Optimized JPEG", value: "jpeg" },
];

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: "bold",
  marginBottom: 4,
};

export default function ConfigScreen({ ctx }: Props) {
  const parameters = ctx.plugin.attributes.parameters as Parameters;
  const token = parameters.token;

  const initial = getImportSettings(parameters);
  const [format, setFormat] = useState<ImportFormat>(initial.format);
  const [maxWidth, setMaxWidth] = useState<string>(
    initial.maxWidth > 0 ? String(initial.maxWidth) : ""
  );
  const [quality, setQuality] = useState<string>(String(initial.quality));

  const saveImportSettings = async () => {
    const parsedMaxWidth =
      maxWidth.trim() === "" ? 0 : Math.max(0, Math.round(Number(maxWidth)));
    const parsedQuality = Math.round(Number(quality));

    const importSettings: ImportSettings = {
      format,
      maxWidth: Number.isFinite(parsedMaxWidth)
        ? parsedMaxWidth
        : DEFAULT_IMPORT_SETTINGS.maxWidth,
      quality: Number.isFinite(parsedQuality)
        ? Math.min(100, Math.max(1, parsedQuality))
        : DEFAULT_IMPORT_SETTINGS.quality,
    };

    // Preserve the auth token when updating settings.
    await ctx.updatePluginParameters({ ...parameters, importSettings });
    setMaxWidth(
      importSettings.maxWidth > 0 ? String(importSettings.maxWidth) : ""
    );
    setQuality(String(importSettings.quality));
    ctx.notice("Import settings saved.");
  };

  return (
    <Canvas ctx={ctx}>
      <>
        {token ? (
          <>
            <div style={{ marginBottom: "24px" }}>
              <b>Authorized Domain:</b> {token?.bearerToken?.domain}
            </div>

            <div style={{ marginBottom: "24px" }}>
              <Button
                type="submit"
                fullWidth
                buttonSize="l"
                buttonType="primary"
                onClick={async () => {
                  try {
                    const newToken = await refresh(token);

                    ctx.updatePluginParameters({
                      ...parameters,
                      token: newToken,
                    });
                    ctx.notice("Successfully received a new token!");
                  } catch (err) {
                    ctx.updatePluginParameters({
                      ...parameters,
                      token: null,
                    });
                    ctx.notice("Something went wrong. Please login again!");
                  }
                }}
              >
                Refresh token
              </Button>
            </div>
            <div>
              <Button
                type="submit"
                fullWidth
                buttonSize="l"
                buttonType="primary"
                onClick={async () => {
                  try {
                    await revoke(token);

                    ctx.updatePluginParameters({
                      ...parameters,
                      token: null,
                    });
                    ctx.notice("Successfully revoked your token!");
                  } catch (err) {
                    ctx.notice("Something went wrong.");
                  }
                }}
              >
                Revoke access
              </Button>
            </div>
          </>
        ) : (
          <Button
            type="submit"
            fullWidth
            buttonSize="l"
            buttonType="primary"
            onClick={async () => {
              try {
                const newToken: Token = await authorize({
                  clientId: "dato-cms",
                  scopes: ["basic:read"],
                });

                ctx.updatePluginParameters({
                  ...parameters,
                  token: newToken,
                });
                ctx.notice("You logged in successfully");
              } catch (err) {
                ctx.alert("Something went wrong");
              }
            }}
          >
            Authorize
          </Button>
        )}

        <hr
          style={{
            margin: "32px 0",
            border: 0,
            borderTop: "1px solid var(--border-color)",
          }}
        />

        <h3 style={{ marginTop: 0 }}>Import settings</h3>
        <p style={{ marginTop: 0, color: "var(--light-body-color)" }}>
          Assets are imported as a web-sized derivative from Frontify's CDN (not
          the raw original). Defaults: WebP, 2560&nbsp;px, quality 82.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="frontify-format" style={labelStyle}>
            Format
          </label>
          <SelectInput<FormatOption>
            inputId="frontify-format"
            options={FORMAT_OPTIONS}
            value={
              FORMAT_OPTIONS.find((option) => option.value === format) ??
              FORMAT_OPTIONS[0]
            }
            onChange={(option) => {
              if (option) {
                setFormat(option.value);
              }
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="frontify-max-width" style={labelStyle}>
            Max. longest edge (px)
          </label>
          <TextInput
            id="frontify-max-width"
            type="number"
            min={0}
            placeholder="2560 — leave empty for no cap"
            value={maxWidth}
            onChange={(newValue) => setMaxWidth(newValue)}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label htmlFor="frontify-quality" style={labelStyle}>
            Quality (1–100)
          </label>
          <TextInput
            id="frontify-quality"
            type="number"
            min={1}
            max={100}
            value={quality}
            onChange={(newValue) => setQuality(newValue)}
          />
        </div>

        <Button buttonType="primary" onClick={saveImportSettings}>
          Save import settings
        </Button>
      </>
    </Canvas>
  );
}
