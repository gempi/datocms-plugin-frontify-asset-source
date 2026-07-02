import { RenderAssetSourceCtx } from "datocms-plugin-sdk";
import { useContext, useEffect } from "react";
import { useQuery } from "urql";
import { AppContext } from "../../AppContext";

import styles from "./Page.module.css";

type PageProps = {
  ctx: RenderAssetSourceCtx;
  libraryId: string;
  variables: any;
  searchTerm: any;
  sortBy: string;
  selectedIds: Set<string>;
  onToggle: (asset: any) => void;
};

function Page({
  libraryId,
  variables,
  searchTerm,
  sortBy,
  selectedIds,
  onToggle,
}: PageProps) {
  const { setHasMore, setLoading } = useContext(AppContext);

  // Frontify's Library.assets returns an empty `items` array (with a non-zero
  // `total`) when browsing without a search term under RELEVANCE (and other
  // sorts) — relevance has nothing to rank against. NEWEST is the only sort that
  // reliably returns assets while browsing, so force it whenever the search box
  // is empty; the user's chosen sort still applies once they actually search.
  const hasSearch = typeof searchTerm === "string" && searchTerm.trim() !== "";
  const effectiveSort = hasSearch ? sortBy : "NEWEST";

  const [{ data }] = useQuery({
    query: `
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
            query: {
              search: $search
              sortBy: $sortBy
              types: [IMAGE]
            }
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
    `,
    pause: !libraryId,
    variables: {
      id: libraryId,
      limit: 30,
      page: variables.page,
      search: searchTerm,
      sortBy: effectiveSort,
    },
  });

  useEffect(() => {
    setLoading(true);

    if (data?.library?.assets) {
      setHasMore(data.library.assets.hasNextPage);
      setLoading(false);
    }
  }, [data, setHasMore, setLoading]);

  return (
    <>
      {data?.library?.assets?.items?.map((asset: any) => {
        const selected = selectedIds.has(asset.id);
        return (
          <div
            key={asset.id}
            onClick={() => onToggle(asset)}
            className={`${styles.asset} ${selected ? styles.selected : ""}`}
          >
            {selected && (
              <div aria-hidden="true" className={styles.assetSelectedIndicator}>
                ✓
              </div>
            )}
            <div className={styles.assetInfo}>
              <div className={styles.assetDetail}>{asset.title}</div>
            </div>
            <img
              className={styles.assetImage}
              src={asset.previewThumb}
              alt={asset.alternativeText}
            />
          </div>
        );
      })}
    </>
  );
}

export default Page;
