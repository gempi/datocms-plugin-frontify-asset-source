import { RenderConfigScreenCtx } from "datocms-plugin-sdk";
import { Canvas, Button } from "datocms-react-ui";
import {
  authorize,
  Token,
  revoke,
  refresh,
} from "@frontify/frontify-authenticator";

type Props = {
  ctx: RenderConfigScreenCtx;
};

type FreshInstallationParameters = { token: null };
export type ValidParameters = { token: Token };

type Parameters = FreshInstallationParameters | ValidParameters;

export default function ConfigScreen({ ctx }: Props) {
  const parameters = ctx.plugin.attributes.parameters as Parameters;
  const token = parameters.token;

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
                      token: newToken,
                    });
                    ctx.notice("Successfully received a new token!");
                  } catch (err) {
                    ctx.updatePluginParameters({
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
      </>
    </Canvas>
  );
}
