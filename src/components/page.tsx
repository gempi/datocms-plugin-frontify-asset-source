import { useQuery } from "urql";
import { useEffect } from "react";
import * as stylex from "@stylexjs/stylex";
import type { SortValue } from "../lib/sort";
import { graphql, type ResultOf } from "gql.tada";
import { Button } from "datocms-react-ui";

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
export type PageVariables = { page: number };

type PageProps = {
  libraryId: string;
  variables: {
    page: number;
  };
  searchTerm: string;
  sortBy: SortValue;
  selectedIds: Set<string>;
  onToggle: (asset: LibraryAsset) => void;
  onLoadMore: (nextVariables: PageVariables) => void;
  onFetchingChange: (fetching: boolean) => void;
  isLastPage: boolean;
};

export default function Page({
  libraryId,
  variables,
  searchTerm,
  sortBy,
  selectedIds,
  onToggle,
  onLoadMore,
  onFetchingChange,
  isLastPage,
}: PageProps) {
  const [{ data, fetching }] = useQuery({
    query: LibraryAssetsQuery,
    pause: !libraryId,
    // Always revalidate: libraries can gain assets while the modal is open.
    requestPolicy: "cache-and-network",
    variables: {
      id: libraryId,
      limit: 16,
      page: variables.page,
      search: searchTerm,
      sortBy,
    },
  });

  useEffect(() => {
    if (!isLastPage) {
      return;
    }

    onFetchingChange(fetching);
    return () => {
      onFetchingChange(false);
    };
  }, [fetching, isLastPage, onFetchingChange]);

  const assets = data?.library?.assets;
  const items = assets?.items;

  if (!items?.length && !fetching) {
    return <p>No assets found{searchTerm ? ` for "${searchTerm}"` : ""}.</p>;
  }

  const imageItems = (items ?? []).flatMap((asset) =>
    asset?.__typename === "Image" ? [asset] : [],
  );

  return (
    <>
      <div {...stylex.props(styles.assetGrid)}>
        {imageItems.map((asset) => {
          const selected = selectedIds.has(asset.id);
          const previewThumb =
            typeof asset.previewThumb === "string" ? asset.previewThumb : undefined;

          return (
            <div
              key={asset.id}
              onClick={() => onToggle(asset)}
              {...stylex.props(styles.asset, selected && styles.selected)}
            >
              {selected ? (
                <div aria-hidden="true" {...stylex.props(styles.assetSelectedIndicator)}>
                  ✓
                </div>
              ) : null}
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
        })}
      </div>

      {isLastPage && assets?.hasNextPage ? (
        <Button
          buttonType="muted"
          fullWidth
          onClick={() => onLoadMore({ page: variables.page + 1 })}
        >
          Load more...
        </Button>
      ) : null}
    </>
  );
}

const styles = stylex.create({
  asset: {
    position: "relative",
    cursor: "pointer",
    outlineOffset: -3,
    contentVisibility: "auto",
    containIntrinsicSize: "auto 200px",
    borderRadius: "4px",
    boxShadow: "0 0 0 1px var(--color--border)",
  },
  assetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 24,
  },
  selected: {
    boxShadow: "0 0 0 3px var(--color--selected--border)",
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
    backgroundColor: "var(--accent-color, var(--color--selected--border))",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    lineHeight: 1,
    zIndex: 1,
  },
});
