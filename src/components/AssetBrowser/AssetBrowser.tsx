import { RenderAssetSourceCtx } from "datocms-plugin-sdk";
import { Button, Canvas, Spinner, TextInput } from "datocms-react-ui";
import { useContext, useEffect, useState } from "react";
import { useQuery } from "urql";
import { AppContext } from "../../AppContext";
import { useRef } from "react";
import Page from "../Page/Page";
import { BrandsQuery } from "../../lib/queries";

interface Brand {
  id: string;
  name: string;
}

interface BrandsData {
  brands: Brand[];
}

type AssetBrowserProps = {
  ctx: RenderAssetSourceCtx;
};

function AssetBrowser({ ctx }: AssetBrowserProps) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const { hasMore, loading, setLoading } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageVariables, setPageVariables] = useState([
    {
      page: 1,
      hasNext: true,
    },
  ]);

  const [{ data: brandsData, error }] = useQuery<BrandsData>({
    query: BrandsQuery,
  });

  const brand = brandsData?.brands?.[0];

  useEffect(() => {
    if (error) {
      ctx.alert(error.message);
      setLoading(false);
    }
  }, [error, ctx, setLoading]);

  return (
    <Canvas ctx={ctx}>
      <div style={{ paddingBottom: 8 }}>
        <form
          style={{
            display: "flex",
            gap: "8px",
          }}
          onSubmit={(e) => {
            e.preventDefault();
            setSearchTerm(searchRef.current?.value || "");
          }}
        >
          <TextInput
            inputRef={searchRef}
            type="search"
            placeholder="Search assets"
          />
          <Button type="submit" buttonType="primary">
            Search
          </Button>
        </form>
      </div>
      <div style={{ position: "relative", minHeight: 200 }}>
        {loading && (
          <div
            style={{
              zIndex: 999,
              height: "100%",
              position: "absolute",
              width: "100%",
              background: "rgba(255,255,255,0.2)",
            }}
          >
            <Spinner size={48} placement="centered" />
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          {pageVariables.map((variables, i) => (
            <Page
              ctx={ctx}
              key={i}
              variables={variables}
              brand={brand}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      </div>

      {hasMore && (
        <Button
          style={{ marginTop: 12 }}
          buttonType="muted"
          fullWidth
          onClick={() =>
            setPageVariables([
              ...pageVariables,
              { page: pageVariables.length + 1, hasNext: false },
            ])
          }
        >
          Load more...
        </Button>
      )}
    </Canvas>
  );
}

export default AssetBrowser;
