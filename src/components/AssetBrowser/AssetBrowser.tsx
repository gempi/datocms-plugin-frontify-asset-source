import { RenderAssetSourceCtx } from "datocms-plugin-sdk";
import { Button, Canvas, Spinner, TextInput } from "datocms-react-ui";
import { useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "urql";
import { AppContext } from "../../AppContext";
import { useRef } from "react";
import Page from "../Page/Page";
import { BrandsQuery, BrandLibrariesQuery } from "../../lib/queries";

interface Brand {
  id: string;
  name: string;
}

interface BrandsData {
  brands: Brand[];
}

interface Library {
  id: string;
  name: string;
}

interface LibrariesData {
  brand: {
    libraries: {
      total: number;
      items: Library[];
    };
  };
}

type AssetBrowserProps = {
  ctx: RenderAssetSourceCtx;
};

function AssetBrowser({ ctx }: AssetBrowserProps) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const { hasMore, loading, setLoading } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLibraryId, setSelectedLibraryId] = useState("");
  const [pageVariables, setPageVariables] = useState([
    {
      page: 1,
      hasNext: true,
    },
  ]);

  const [{ data: brandsData, error: brandsError }] = useQuery<BrandsData>({
    query: BrandsQuery,
  });

  const brand = brandsData?.brands?.[0];

  // Assets are scoped to a library (the brand-level search resolver is broken
  // server-side), so resolve the brand's libraries and pick one.
  const [{ data: librariesData, error: librariesError }] =
    useQuery<LibrariesData>({
      query: BrandLibrariesQuery,
      pause: !brand,
      variables: { id: brand?.id },
    });

  const libraries = useMemo(
    () => librariesData?.brand?.libraries?.items ?? [],
    [librariesData]
  );

  // Default to the first library once loaded. A picker is only shown when the
  // brand has more than one library (most brands have exactly one).
  useEffect(() => {
    if (!selectedLibraryId && libraries.length > 0) {
      setSelectedLibraryId(libraries[0].id);
    }
  }, [libraries, selectedLibraryId]);

  // Reset pagination whenever the search term or the selected library changes.
  useEffect(() => {
    setPageVariables([{ page: 1, hasNext: true }]);
  }, [selectedLibraryId, searchTerm]);

  const error = brandsError || librariesError;
  useEffect(() => {
    if (error) {
      ctx.alert(error.message);
      setLoading(false);
    }
  }, [error, ctx, setLoading]);

  return (
    <Canvas ctx={ctx}>
      <div style={{ paddingBottom: 8 }}>
        {libraries.length > 1 && (
          <select
            value={selectedLibraryId}
            onChange={(e) => setSelectedLibraryId(e.target.value)}
            style={{ marginBottom: 8, width: "100%", padding: 8 }}
          >
            {libraries.map((library) => (
              <option key={library.id} value={library.id}>
                {library.name}
              </option>
            ))}
          </select>
        )}
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
              libraryId={selectedLibraryId}
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
