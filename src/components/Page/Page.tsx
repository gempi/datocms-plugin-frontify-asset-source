import { RenderAssetSourceCtx } from "datocms-plugin-sdk";
import { useEffect } from "react";
import { useQuery, gql } from "urql";
import { useAssetBrowser } from "../../contexts/AssetBrowserContext";
import * as stylex from "@stylexjs/stylex";
import { SortValue } from "../AssetBrowser/AssetBrowser";

const LIBRARY_ASSETS_QUERY = gql`
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
            id
            title
            description
            filename
            previewThumb: previewUrl(width: 300, height: 300)
            previewMaster: previewUrl(width: 2560)
            author
            alternativeText
            isDecorative
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
        }
      }
    }
  }
`;

type PageProps = {
  ctx: RenderAssetSourceCtx;
  libraryId: string;
  variables: any;
  searchTerm: string;
  sortBy: SortValue;
  selectedIds: Set<string>;
  onToggle: (asset: any) => void;
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
    query: LIBRARY_ASSETS_QUERY,
    pause: !libraryId,
    variables: {
      id: libraryId,
      limit: 30,
      page: variables.page,
      search: searchTerm,
      sortBy,
    },
  });

  useEffect(() => {
    setLoading(fetching);

    if (data?.library?.assets) {
      setHasMore(data.library.assets.hasNextPage);
    } else {
      setHasMore(false);
    }
  }, [data, fetching, setHasMore, setLoading]);

  return (
    <>
      {data?.library?.assets?.items?.map((asset: any) => {
        const selected = selectedIds.has(asset.id);
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
              src={asset.previewThumb}
              alt={asset.alternativeText}
            />
          </div>
        );
      })}
    </>
  );
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
    visibility: "hidden",
    opacity: 0,
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
    zIndex: 2,
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
