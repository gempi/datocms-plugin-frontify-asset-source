import { RenderAssetSourceCtx } from "datocms-plugin-sdk";
import { useContext, useEffect } from "react";
import { useQuery } from "urql";
import { AppContext } from "../../AppContext";
import { LibraryAssetsQuery } from "../../lib/queries";

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
  ctx,
  libraryId,
  variables,
  searchTerm,
  sortBy,
  selectedIds,
  onToggle,
}: PageProps) {
  const { setHasMore, setLoading } = useContext(AppContext);
  const [{ data }] = useQuery({
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
            className={styles.asset}
            style={{
              position: "relative",
              cursor: "pointer",
              outline: selected
                ? "3px solid var(--accent-color, #1a73e8)"
                : "none",
              outlineOffset: -3,
            }}
          >
            {selected && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  zIndex: 2,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "var(--accent-color, #1a73e8)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ✓
              </div>
            )}
            <div className={styles.assetInfo}>
              <div className={styles.assetDetail}>{asset.title}</div>
            </div>
            <img
              style={{
                aspectRatio: "1/1",
                height: "100%",
                width: "100%",
                objectFit: "cover",
                lineHeight: 0,
              }}
              src={asset.previewThumb}
              alt=""
            />
          </div>
        );
      })}
    </>
  );
}

export default Page;
