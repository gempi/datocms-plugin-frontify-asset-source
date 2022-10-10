import { connect, RenderAssetSourceCtx } from "datocms-plugin-sdk";
import { render } from "./utils/render";
import ConfigScreen, { ValidParameters } from "./entrypoints/ConfigScreen";
import "datocms-react-ui/styles.css";
import AssetBrowser from "./components/AssetBrowser/AssetBrowser";
import { createClient, Provider } from "urql";
import AppProvider from "./AppContext";
import { useEffect } from "react";

connect({
  renderConfigScreen(ctx) {
    return render(<ConfigScreen ctx={ctx} />);
  },
  assetSources() {
    return [
      {
        id: "frontify",
        name: "Frontify",
        icon: {
          type: "svg",
          viewBox: "0 0 53 50",
          content:
            '<path d="M51.0248 33.1169L45.264 29.8701C44.7702 29.5455 44.441 29.0584 44.441 28.4091V21.9156C44.441 20.6169 43.7826 19.3182 42.4658 18.6688L36.705 15.4221C36.3758 15.2597 36.0466 14.6104 36.0466 14.1234V7.62987C36.0466 6.33117 35.3882 5.03247 34.0714 4.38312L26.6646 0L19.0932 4.38312C17.941 5.03247 17.118 6.33117 17.118 7.62987V14.1234C17.118 14.7727 16.7888 15.2597 16.295 15.5844L10.5342 18.8312C9.38199 19.4805 8.55901 20.7792 8.55901 22.0779V28.5714C8.55901 29.2208 8.22981 29.7078 7.73602 30.0325L1.97516 33.2792C0.822982 33.9286 0 35.2273 0 36.526V45.1299L7.57143 49.513C8.7236 50.1623 10.205 50.1623 11.3571 49.513L17.118 46.2662C17.6118 45.9416 18.2702 45.9416 18.764 46.2662L24.5248 49.513C25.1832 49.8377 25.8416 50 26.5 50C27.1584 50 27.8168 49.8377 28.4752 49.513L34.236 46.2662C34.7298 45.9416 35.3882 45.9416 35.882 46.2662L41.6429 49.513C42.795 50.1623 44.2764 50.1623 45.4286 49.513L53 45.1299V36.526C53 35.0649 52.3416 33.9286 51.0248 33.1169ZM33.9068 7.62987V14.1234C33.9068 15.4221 34.5652 16.7208 35.882 17.3701L41.6429 20.6169C42.1367 20.9416 42.4658 21.4286 42.4658 22.0779V28.5714C42.4658 29.8701 43.1242 31.1688 44.441 31.8182L50.2019 35.0649C50.6957 35.3896 51.0248 35.8766 51.0248 36.526V42.6948L27.8168 29.5455V3.24675L33.0839 6.16883C33.5776 6.49351 33.9068 6.98052 33.9068 7.62987ZM3.12733 35.0649L8.8882 31.8182C10.0404 31.1688 10.8634 29.8701 10.8634 28.5714V22.0779C10.8634 21.4286 11.1925 20.9416 11.6863 20.6169L17.4472 17.3701C18.5994 16.7208 19.4224 15.4221 19.4224 14.1234V7.62987C19.4224 6.98052 19.7516 6.49351 20.2453 6.16883L25.677 3.08442V29.3831L2.30435 42.6948V36.526C2.30435 35.8766 2.63354 35.3896 3.12733 35.0649ZM44.2764 47.5649C43.7826 47.8896 43.1242 47.8896 42.6304 47.5649L36.8696 44.3182C35.7174 43.6688 34.236 43.6688 33.0839 44.3182L27.323 47.5649C26.8292 47.8896 26.1708 47.8896 25.677 47.5649L19.9162 44.3182C18.764 43.6688 17.2826 43.6688 16.1304 44.3182L10.3696 47.5649C9.87578 47.8896 9.21739 47.8896 8.7236 47.5649L3.45652 44.4805L26.6646 31.3312L49.8727 44.4805L44.2764 47.5649Z" fill="#2D3232"></path>',
        },
        modal: {
          width: "xl",
        },
      },
    ];
  },
  renderAssetSource(sourceId: string, ctx: RenderAssetSourceCtx) {
    const parameters = ctx.plugin.attributes.parameters as ValidParameters;
    const domain = parameters.token?.bearerToken?.domain;
    const accessToken = parameters.token?.bearerToken?.accessToken;

    if (!accessToken || !domain) {
      ctx.alert("Please check your plugin settings!");
      return null;
    }

    const client = createClient({
      url: `https://${domain}/graphql`,
      fetchOptions: () => {
        return {
          headers: {
            "X-Frontify-Beta": "enabled",
            Authorization: accessToken ? `Bearer ${accessToken}` : "",
          },
        };
      },
    });

    render(
      <AppProvider>
        <Provider value={client}>
          <AssetBrowser ctx={ctx} />
        </Provider>
      </AppProvider>
    );
  },
});
