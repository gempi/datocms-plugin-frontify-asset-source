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
};

function Page({ ctx, libraryId, variables, searchTerm }: PageProps) {
  const { setHasMore, setLoading } = useContext(AppContext);
  const [{ data }] = useQuery({
    query: LibraryAssetsQuery,
    pause: !libraryId,
    variables: {
      id: libraryId,
      limit: 30,
      page: variables.page,
      search: searchTerm,
    },
  });

  const handleSelect = (asset: any) => {
    ctx.select({
      resource: {
        url: asset.downloadUrl,
        filename: asset.filename,
      },
      author: asset.author,
      notes: asset.description,
      tags: (asset.tags ?? []).map((tag: any) => tag.value),
      copyright: asset.copyright?.notice,
    });
  };

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
        return (
          <div
            key={asset.id}
            onClick={() => handleSelect(asset)}
            className={styles.asset}
            style={{
              position: "relative",
              cursor: "pointer",
            }}
          >
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
              src={asset.previewUrl}
              alt=""
            />
          </div>
        );
      })}
    </>
  );
}

export default Page;
