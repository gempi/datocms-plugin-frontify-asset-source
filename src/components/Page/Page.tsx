import { RenderAssetSourceCtx } from "datocms-plugin-sdk";
import { useEffect } from "react";
import { useQuery } from "urql";
import { useAssetBrowser } from "../../contexts/AssetBrowserContext";
import * as stylex from "@stylexjs/stylex";
import { SortValue } from "../AssetBrowser/AssetBrowser";
import { graphql, type ResultOf } from "gql.tada";

const LibraryAssetFragment = graphql(`
  fragment LibraryAsset on Image @_unmask {
    id
    title
    description
    filename
    previewThumb: previewUrl(width: 300, height: 300)
    previewMaster: previewUrl(width: 2560)
    author
    alternativeText
    externalId
    expiresAt
    focalPoint
    tags {
      value
    }
    copyright {
      status
      notice
    }
    licenses {
      title
    }
  }
`);

const LibraryAssetsQuery = graphql(
  `
    query LibraryAssets(
      $id: ID!
      $limit: Int
      $page: Int
      $search: String
      $sortBy: AssetQueryFilterSortType
    ) {
      library(id: $id) {
        assets(
          limit: $limit
          page: $page
          query: { search: $search, sortBy: $sortBy, types: [IMAGE] }
        ) {
          hasNextPage
          page
          total
          items {
            __typename
            ... on Image {
              ...LibraryAsset
            }
          }
        }
      }
    }
  `,
  [LibraryAssetFragment],
);

export type LibraryAsset = ResultOf<typeof LibraryAssetFragment>;

type PageProps = {
  ctx: RenderAssetSourceCtx;
  libraryId: string;
  variables: {
    page: number;
    hasNext: boolean;
  };
  searchTerm: string;
  sortBy: SortValue;
  selectedIds: Set<string>;
  onToggle: (asset: LibraryAsset) => void;
};

export default function Page({
  libraryId,
  variables,
  searchTerm,
  sortBy,
  selectedIds,
  onToggle,
}: PageProps) {
  const { setHasMore, setLoading } = useAssetBrowser();

  const [{ data, fetching }] = useQuery({
    query: LibraryAssetsQuery,
    pause: !libraryId,
    variables: {
      id: libraryId,
      limit: 30,
      page: variables.page,
      search: searchTerm,
      sortBy,
    },
  });

  const assets = data?.library?.assets;
  const items = assets?.items;

  useEffect(() => {
    setLoading(fetching);

    if (assets) {
      setHasMore(assets.hasNextPage);
    } else {
      setHasMore(false);
    }
  }, [assets, fetching, setHasMore, setLoading]);

  if (!items?.length && !fetching) {
    return <p>No assets found{searchTerm ? ` for "${searchTerm}"` : ""}.</p>;
  }

  const imageItems = (items ?? []).flatMap((asset) =>
    asset?.__typename === "Image" ? [asset] : [],
  );

  return imageItems.map((asset) => {
    const selected = selectedIds.has(asset.id);
    const previewThumb =
      typeof asset.previewThumb === "string" ? asset.previewThumb : undefined;

    return (
      <div
        role="button"
        key={asset.id}
        onClick={() => onToggle(asset)}
        {...stylex.props(styles.asset, selected && styles.selected)}
      >
        {selected && (
          <div
            aria-hidden="true"
            {...stylex.props(styles.assetSelectedIndicator)}
          >
            ✓
          </div>
        )}
        <div {...stylex.props(styles.assetInfo)}>
          <div {...stylex.props(styles.assetDetail)}>{asset.title}</div>
        </div>
        <img
          {...stylex.props(styles.assetImage)}
          src={previewThumb}
          alt={asset.alternativeText ?? undefined}
        />
      </div>
    );
  });
}

const styles = stylex.create({
  asset: {
    position: "relative",
    cursor: "pointer",
    outlineOffset: -3,
  },
  selected: {
    outline: "3px solid var(--accent-color, #1a73e8)",
  },
  assetInfo: {
    transition: "0.3s",
    transitionProperty: "opacity",
    transitionDuration: "0.3s",
    transitionTimingFunction: "linear",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    color: "white",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    opacity: {
      default: 0,
      ":hover": "1",
    },
  },

  assetDetail: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  assetImage: {
    aspectRatio: "1/1",
    height: "100%",
    width: "100%",
    objectFit: "cover",
    lineHeight: 0,
  },
  assetSelectedIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: "50%",
    backgroundColor: "var(--accent-color, #1a73e8)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    lineHeight: 1,
  },
});
