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

export type ValidParameters = {
  token: Token;
};

export default function ConfigScreen({ ctx }: Props) {
  const parameters = ctx.plugin.attributes.parameters as ValidParameters;
  const token: Token = parameters.token;

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
                  const newToken = await refresh(token);

                  ctx.updatePluginParameters({
                    token: newToken,
                  });
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
                  await revoke(token);

                  ctx.updatePluginParameters({
                    token: null,
                  });
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
