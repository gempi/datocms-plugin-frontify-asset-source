import { RenderAssetSourceCtx } from "datocms-plugin-sdk";
import {
  Button,
  Canvas,
  SelectInput,
  Spinner,
  TextInput,
} from "datocms-react-ui";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "urql";
import { AppContext } from "../../AppContext";
import { useRef } from "react";
import Page from "../Page/Page";
import { getImportSettings } from "../../lib/importSettings";
import { buildUpload, selectUploads } from "../../lib/buildUpload";
import styles from "./AssetBrowser.module.css";

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

type SelectOption = { label: string; value: string };

const SORT_OPTIONS: SelectOption[] = [
  { label: "Relevance", value: "RELEVANCE" },
  { label: "Newest first", value: "NEWEST" },
  { label: "Oldest first", value: "OLDEST" },
  { label: "Title A–Z", value: "TITLE_ASCENDING" },
  { label: "Title Z–A", value: "TITLE_DESCENDING" },
];

type AssetBrowserProps = {
  ctx: RenderAssetSourceCtx;
};

function AssetBrowser({ ctx }: AssetBrowserProps) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const { hasMore, loading, setLoading } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLibraryId, setSelectedLibraryId] = useState("");
  // Default to NEWEST, not RELEVANCE: on open the search box is empty, and
  // Frontify's Library.assets returns no items for a relevance sort without a
  // query term (see Page.tsx). NEWEST is the only sort that reliably browses.
  const [sortBy, setSortBy] = useState("NEWEST");
  const [selected, setSelected] = useState<Map<string, any>>(new Map());
  const [pageVariables, setPageVariables] = useState([
    {
      page: 1,
      hasNext: true,
    },
  ]);

  const [{ data: brandsData, error: brandsError }] = useQuery<BrandsData>({
    query: `
      query {
        brands {
            id
            name
          }
      }
    `,
  });

  const brand = brandsData?.brands?.[0];

  // Assets are scoped to a library (the brand-level search resolver is broken
  // server-side), so resolve the brand's libraries and pick one.
  const [{ data: librariesData, error: librariesError }] =
    useQuery<LibrariesData>({
      query: `
        query BrandLibraries($id: ID!) {
          brand(id: $id) {
            libraries(limit: 100, page: 1) {
              total
              items {
                id
                name
              }
            }
          }
        }
      `,
      pause: !brand,
      variables: { id: brand?.id },
    });

  const libraries = useMemo(
    () => librariesData?.brand?.libraries?.items ?? [],
    [librariesData],
  );

  const libraryOptions = useMemo<SelectOption[]>(
    () =>
      libraries.map((library) => ({ label: library.name, value: library.id })),
    [libraries],
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
  }, [selectedLibraryId, searchTerm, sortBy]);

  const error = brandsError || librariesError;
  useEffect(() => {
    if (error) {
      ctx.alert(error.message);
      setLoading(false);
    }
  }, [error, ctx, setLoading]);

  // Clear the selection when switching libraries.
  useEffect(() => {
    setSelected(new Map());
  }, [selectedLibraryId]);

  const toggleSelect = useCallback((asset: any) => {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(asset.id)) {
        next.delete(asset.id);
      } else {
        next.set(asset.id, asset);
      }
      return next;
    });
  }, []);

  const selectedIds = useMemo(() => new Set(selected.keys()), [selected]);

  const handleUploadSelected = () => {
    const assets = Array.from(selected.values());
    if (assets.length === 0) {
      return;
    }
    const importSettings = getImportSettings(ctx.plugin.attributes.parameters);
    const uploads = assets.map((asset) =>
      buildUpload(asset, importSettings, ctx.site.attributes.locales),
    );
    selectUploads(ctx, uploads);
    ctx.notice(
      `Imported ${uploads.length} asset${uploads.length > 1 ? "s" : ""}.`,
    );
    setSelected(new Map());
  };

  return (
    <Canvas ctx={ctx}>
      <div className={styles.contentWrapper}>
        {libraries.length > 1 && (
          <div className={styles.libraryPicker}>
            <SelectInput<SelectOption>
              options={libraryOptions}
              value={
                libraryOptions.find(
                  (option) => option.value === selectedLibraryId,
                ) ?? null
              }
              onChange={(option) => {
                if (option) {
                  setSelectedLibraryId(option.value);
                }
              }}
            />
          </div>
        )}
        <form
          className={styles.searchForm}
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
        <div className={styles.sortControls}>
          <label htmlFor="frontify-sort">Sort by</label>
          <div className={styles.sortSelectWrapper}>
            <SelectInput<SelectOption>
              inputId="frontify-sort"
              options={SORT_OPTIONS}
              value={
                SORT_OPTIONS.find((option) => option.value === sortBy) ??
                SORT_OPTIONS[0]
              }
              onChange={(option) => {
                if (option) {
                  setSortBy(option.value);
                }
              }}
            />
          </div>
        </div>
      </div>
      {selected.size > 0 && (
        <div className={styles.actionBar}>
          <span>{selected.size} selected</span>
          <div className={styles.selectedActions}>
            <Button buttonSize="s" onClick={() => setSelected(new Map())}>
              Clear
            </Button>
            <Button
              buttonSize="s"
              buttonType="primary"
              onClick={handleUploadSelected}
            >
              Upload selected
            </Button>
          </div>
        </div>
      )}
      <div className={styles.container}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <Spinner size={48} placement="centered" />
          </div>
        )}

        <div className={styles.assetGrid}>
          {pageVariables.map((variables, i) => (
            <Page
              ctx={ctx}
              key={i}
              variables={variables}
              libraryId={selectedLibraryId}
              searchTerm={searchTerm}
              sortBy={sortBy}
              selectedIds={selectedIds}
              onToggle={toggleSelect}
            />
          ))}
        </div>
      </div>

      {hasMore && (
        <Button
          className={styles.loadMoreButton}
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
