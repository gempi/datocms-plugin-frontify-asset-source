import { RenderAssetSourceCtx } from "datocms-plugin-sdk";
import { useContext, useEffect } from "react";
import { useQuery } from "urql";
import { AppContext } from "../../AppContext";
import { LibraryAssetsQuery } from "../../lib/queries";

import styles from "./Page.module.css";

// Web-sensible import target. DatoCMS rehosts the bytes and serves responsive
// variants from its own CDN, so we import a single ~2560px WebP master.
const IMPORT_FORMAT = "webp";
const IMPORT_QUALITY = "82";

// Add format + quality to a Frontify CDN preview URL. Uses URL parsing (not
// string concat) so it is robust regardless of the URL's existing query string.
function buildImportUrl(previewMaster: string): string {
  const url = new URL(previewMaster);
  url.searchParams.set("format", IMPORT_FORMAT);
  url.searchParams.set("quality", IMPORT_QUALITY);
  return url.toString();
}

// Match the imported file's extension to the format we actually import.
function toWebpFilename(filename: string | null | undefined, id: string): string {
  const base = (filename ?? id).replace(/\.[a-z0-9]{2,4}$/i, "");
  return `${base}.${IMPORT_FORMAT}`;
}

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
        // Import a web-sized WebP derivative from Frontify's (unsigned,
        // CORS-enabled) CDN rather than the raw original. `previewMaster` is a
        // media.ffycdn.net URL capped at 2560px; we add format + quality on top.
        url: buildImportUrl(asset.previewMaster),
        filename: toWebpFilename(asset.filename, asset.id),
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
