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
import styles from "./ConfigScreen.module.css";

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

export default function ConfigScreen({ ctx }: Props) {
  const parameters = ctx.plugin.attributes.parameters as Parameters;
  const token = parameters.token;

  const initial = getImportSettings(parameters);
  const [format, setFormat] = useState<ImportFormat>(initial.format);
  const [maxWidth, setMaxWidth] = useState<string>(
    initial.maxWidth > 0 ? String(initial.maxWidth) : "",
  );
  const [quality, setQuality] = useState<string>(String(initial.quality));
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const saveImportSettings = async () => {
    setIsSaving(true);

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

    try {
      await ctx.updatePluginParameters({ ...parameters, importSettings });
      setMaxWidth(
        importSettings.maxWidth > 0 ? String(importSettings.maxWidth) : "",
      );
      setQuality(String(importSettings.quality));
      ctx.notice("Import settings saved.");
    } catch (err) {
      ctx.alert("Unable to save import settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Canvas ctx={ctx}>
      <>
        {token ? (
          <>
            <div className={styles.tokenInfo}>
              <b>Authorized Domain:</b> {token?.bearerToken?.domain}
            </div>

            <div className={styles.actionBlock}>
              <Button
                type="button"
                fullWidth
                buttonSize="l"
                buttonType="primary"
                disabled={isRefreshing}
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    const newToken = await refresh(token);

                    await ctx.updatePluginParameters({
                      ...parameters,
                      token: newToken,
                    });
                    ctx.notice("Successfully received a new token!");
                  } catch (err) {
                    await ctx.updatePluginParameters({
                      ...parameters,
                      token: null,
                    });
                    ctx.alert("Something went wrong. Please login again!");
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
              >
                Refresh token
              </Button>
            </div>
            <div className={styles.actionBlock}>
              <Button
                type="button"
                fullWidth
                buttonSize="l"
                buttonType="primary"
                disabled={isRevoking}
                onClick={async () => {
                  setIsRevoking(true);
                  try {
                    await revoke(token);
                    await ctx.updatePluginParameters({
                      ...parameters,
                      token: null,
                    });
                    ctx.notice("Successfully revoked your token!");
                  } catch (err) {
                    ctx.alert("Something went wrong while revoking access.");
                  } finally {
                    setIsRevoking(false);
                  }
                }}
              >
                Revoke access
              </Button>
            </div>
          </>
        ) : (
          <Button
            type="button"
            fullWidth
            buttonSize="l"
            buttonType="primary"
            disabled={isAuthenticating}
            onClick={async () => {
              setIsAuthenticating(true);
              try {
                const newToken: Token = await authorize({
                  clientId: "dato-cms",
                  scopes: ["basic:read"],
                });

                await ctx.updatePluginParameters({
                  ...parameters,
                  token: newToken,
                });
                ctx.notice("You logged in successfully");
              } catch (err) {
                ctx.alert("Something went wrong");
              } finally {
                setIsAuthenticating(false);
              }
            }}
          >
            Authorize
          </Button>
        )}

        <hr className={styles.divider} />

        <h3 className={styles.heading}>Import settings</h3>
        <p className={styles.description}>
          Assets are imported as a web-sized derivative from Frontify's CDN (not
          the raw original). Defaults: WebP, 2560&nbsp;px, quality 82.
        </p>

        <div className={styles.fieldGroup}>
          <label htmlFor="frontify-format" className={styles.label}>
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

        <div className={styles.fieldGroup}>
          <label htmlFor="frontify-max-width" className={styles.label}>
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

        <div className={styles.fieldGroupWide}>
          <label htmlFor="frontify-quality" className={styles.label}>
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

        <Button
          buttonType="primary"
          disabled={isSaving}
          type="button"
          onClick={saveImportSettings}
        >
          Save import settings
        </Button>
      </>
    </Canvas>
  );
}
