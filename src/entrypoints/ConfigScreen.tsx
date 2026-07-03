import type { RenderConfigScreenCtx } from "datocms-plugin-sdk";
import {
  Button,
  Canvas,
  FieldGroup,
  TextField,
  Form,
  SelectField,
} from "datocms-react-ui";
import {
  authorize,
  refresh,
  revoke,
  Token,
} from "@frontify/frontify-authenticator";
import { useState } from "react";
import { Form as FormHandler, Field } from "react-final-form";
import * as stylex from "@stylexjs/stylex";
import {
  normalizeConfigParameters,
  NormalizedConfigParameters,
} from "../utils/config";

type Props = {
  ctx: RenderConfigScreenCtx;
};

export default function ConfigScreen({ ctx }: Props) {
  const parameters = normalizeConfigParameters(
    ctx.plugin.attributes.parameters,
  );
  console.log("parameters ConfigScreen", parameters);
  const token = parameters.token;

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  return (
    <Canvas ctx={ctx}>
      {token ? (
        <>
          <div {...stylex.props(styles.buttonRow)}>
            <Button
              type="button"
              fullWidth
              buttonSize="s"
              buttonType="primary"
              disabled={isRefreshing}
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  const newToken = await refresh(token!);

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

            <Button
              type="button"
              fullWidth
              buttonSize="s"
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

          <FormHandler<NormalizedConfigParameters>
            initialValues={parameters}
            onSubmit={async (values) => {
              try {
                await ctx.updatePluginParameters(values);
                ctx.notice("Settings updated successfully!");
              } catch (err) {
                ctx.alert("Something went wrong while saving settings.");
              }
            }}
          >
            {({ handleSubmit, submitting, dirty }) => (
              <Form onSubmit={handleSubmit}>
                <p>
                  Assets are imported as a web-sized derivative from Frontify's
                  CDN (not the raw original)
                </p>
                <FieldGroup>
                  <Field name="importSettings.quality">
                    {({ input, meta: { error } }) => (
                      <TextField
                        id="quality"
                        label="Quality (1 - 100)"
                        hint="Default 82"
                        error={error}
                        textInputProps={{
                          min: 1,
                          max: 100,
                          step: 1,
                          type: "number",
                        }}
                        {...input}
                        onChange={(value) =>
                          input.onChange(Number.parseInt(value, 10))
                        }
                      />
                    )}
                  </Field>
                  <Field name="importSettings.maxWidth">
                    {({ input, meta: { error } }) => (
                      <TextField
                        id="maxWidth"
                        label="Max width in pixels"
                        hint="Default 2560"
                        error={error}
                        textInputProps={{
                          type: "number",
                        }}
                        {...input}
                        onChange={(value) =>
                          input.onChange(Number.parseInt(value, 10))
                        }
                      />
                    )}
                  </Field>
                  <Field name="importSettings.format">
                    {({ input, meta: { error } }) => {
                      const formatOptions = [
                        {
                          label: "Optimized WebP (recommended)",
                          value: "webp",
                        },
                        { label: "Optimized JPEG", value: "jpeg" },
                      ];

                      return (
                        <SelectField
                          id="format"
                          label="Format"
                          hint="Default WebP"
                          selectInputProps={{
                            value: formatOptions.find(
                              (opt) => opt.value === input.value,
                            ),
                            options: formatOptions,
                          }}
                          error={error}
                          multiple={false}
                          {...input}
                          onChange={(option: any) =>
                            input.onChange(option.value)
                          }
                          value={formatOptions.find(
                            (opt) => opt.value === input.value,
                          )}
                        />
                      );
                    }}
                  </Field>
                </FieldGroup>
                <Button
                  type="submit"
                  fullWidth
                  buttonSize="l"
                  buttonType="primary"
                  disabled={submitting || !dirty}
                >
                  Save settings
                </Button>
              </Form>
            )}
          </FormHandler>
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
    </Canvas>
  );
}

const styles = stylex.create({
  buttonRow: {
    marginBlockEnd: 24,
    display: "flex",
    gap: 12,
  },
});
