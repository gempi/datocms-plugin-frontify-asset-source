import { RenderAssetSourceCtx } from "datocms-plugin-sdk";
import { refresh, type Token } from "@frontify/frontify-authenticator";
import { Canvas, Spinner } from "datocms-react-ui";
import { useEffect, useMemo, useState } from "react";
import { cacheExchange, Client, fetchExchange, Provider } from "urql";
import AssetBrowser from "./asset-browser";
import {
  isTokenExpired,
  isTokenRefreshDue,
  normalizeConfigParameters,
  resolveAuthCredentials,
} from "../utils/config";

type AssetSourceProps = {
  ctx: RenderAssetSourceCtx;
};

type RefreshState =
  | { status: "skipped" }
  | { status: "refreshing" }
  | { status: "failed" }
  | { status: "refreshed"; token: Token };

// Each refresh returns a new refresh token, so the stored one is used at most once.
// Kept at module level to survive re-renders and StrictMode double effects within one modal.
let refreshRequest: Promise<Token> | null = null;

const refreshStoredToken = (ctx: RenderAssetSourceCtx) => {
  refreshRequest ??= (async () => {
    const { token } = normalizeConfigParameters(ctx.plugin.attributes.parameters ?? {});

    if (!token) {
      throw new Error("No Frontify token stored.");
    }

    const newToken = await refresh(token);

    await ctx.updatePluginParameters({
      ...ctx.plugin.attributes.parameters,
      token: newToken,
      tokenObtainedAt: Date.now(),
    });

    return newToken;
  })();

  return refreshRequest;
};

export default function AssetSource({ ctx }: AssetSourceProps) {
  const parameters = normalizeConfigParameters(ctx.plugin.attributes.parameters ?? {});
  // Only users who may edit the schema can store a refreshed token for everyone else.
  const canRefreshToken = ctx.currentRole.meta.final_permissions.can_edit_schema;

  const [openedAt] = useState(() => Date.now());
  const [refreshState, setRefreshState] = useState<RefreshState>(() =>
    canRefreshToken && isTokenRefreshDue(parameters, openedAt)
      ? { status: "refreshing" }
      : { status: "skipped" },
  );

  useEffect(() => {
    if (refreshState.status !== "refreshing") {
      return;
    }

    refreshStoredToken(ctx)
      .then((token) => setRefreshState({ status: "refreshed", token }))
      .catch(() => {
        setRefreshState({ status: "failed" });
        ctx.alert(
          'Could not renew the Frontify access token. If no assets load, click "Refresh token" in the plugin settings.',
        );
      });
  }, [refreshState.status, ctx]);

  const auth = resolveAuthCredentials(
    refreshState.status === "refreshed" ? refreshState.token : parameters.token,
  );

  const client = useMemo(
    () =>
      auth
        ? new Client({
            url: `https://${auth.domain}/graphql`,
            exchanges: [cacheExchange, fetchExchange],
            preferGetMethod: false,
            fetchOptions: () => ({
              headers: {
                "X-Frontify-Beta": "enabled",
                Authorization: `Bearer ${auth.accessToken}`,
              },
            }),
          })
        : null,
    [auth?.domain, auth?.accessToken],
  );

  if (refreshState.status === "refreshing") {
    return (
      <Canvas ctx={ctx}>
        <Spinner size={48} placement="centered" />
      </Canvas>
    );
  }

  if (!client || (refreshState.status !== "refreshed" && isTokenExpired(parameters, openedAt))) {
    return (
      <Canvas ctx={ctx}>
        <p>
          The Frontify access token has expired. Ask an administrator to click "Refresh token" in
          the plugin settings.
        </p>
      </Canvas>
    );
  }

  return (
    <Provider value={client}>
      <AssetBrowser ctx={ctx} />
    </Provider>
  );
}
