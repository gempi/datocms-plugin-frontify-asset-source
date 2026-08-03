import { RenderAssetSourceCtx } from "datocms-plugin-sdk";
import { Button, Canvas, SelectInput, Spinner, TextInput } from "datocms-react-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "urql";
import Page from "./page";
import type { LibraryAsset } from "./page";
import { buildUpload, selectUploads } from "../lib/build-upload";
import { normalizeConfigParameters } from "../utils/config";
import { SORT_OPTIONS, type SortValue } from "../lib/sort";
import * as stylex from "@stylexjs/stylex";
import { useDebounce } from "../hooks/use-debounce";
import { graphql } from "gql.tada";

type SelectOption<T = string> = {
  label: string;
  value: T;
};

const BrandsQuery = graphql(`
  query {
    brands {
      id
      name
    }
  }
`);

const BrandLibrariesQuery = graphql(`
  query BrandLibraries($id: ID!) {
    brand(id: $id) {
      id
      libraries(limit: 10, page: 1) {
        total
        items {
          id
          name
        }
      }
    }
  }
`);

type AssetBrowserProps = {
  ctx: RenderAssetSourceCtx;
};

export default function AssetBrowser({ ctx }: AssetBrowserProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedQuery = useDebounce(searchTerm, 500);

  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortValue>("NEWEST");
  const [selectedItems, setSelectedItems] = useState(() => new Map<string, LibraryAsset>());
  const [pageVariables, setPageVariables] = useState(() => [{ page: 1 }]);
  const [fetchingAssets, setFetchingAssets] = useState(false);

  const [{ data: brandsData, error: brandsError, fetching: fetchingBrands }] = useQuery({
    query: BrandsQuery,
  });

  const brands = brandsData?.brands;

  const brandsOptions = useMemo<SelectOption[]>(
    () =>
      brands
        ?.filter((brand) => brand != null)
        .map((brand) => ({ label: brand.name, value: brand.id })) ?? [],
    [brands],
  );

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  const effectiveBrandId = brandsOptions.some((option) => option.value === selectedBrandId)
    ? selectedBrandId
    : (brandsOptions[0]?.value ?? null);

  const [{ data: librariesData, error: librariesError, fetching: fetchingLibraries }] = useQuery({
    query: BrandLibrariesQuery,
    pause: !effectiveBrandId,
    requestPolicy: "cache-and-network",
    variables: { id: effectiveBrandId ?? "" },
  });

  const error = brandsError || librariesError;

  const libraries = useMemo(() => {
    if (librariesData?.brand?.id !== effectiveBrandId) {
      return [];
    }
    return librariesData?.brand?.libraries?.items ?? [];
  }, [librariesData, effectiveBrandId]);

  const libraryOptions = useMemo<SelectOption[]>(
    () =>
      libraries
        .filter((library) => library != null)
        .map((library) => ({ label: library.name, value: library.id })),
    [libraries],
  );

  const effectiveLibraryId = libraryOptions.some((option) => option.value === selectedLibraryId)
    ? selectedLibraryId
    : (libraryOptions[0]?.value ?? null);

  const loading = fetchingBrands || fetchingLibraries || fetchingAssets;

  useEffect(() => {
    setPageVariables([{ page: 1 }]);
  }, [debouncedQuery]);

  useEffect(() => {
    if (error) {
      ctx.alert(error.message);
    }
  }, [error, ctx]);

  const resetPages = () => setPageVariables([{ page: 1 }]);
  const clearSelection = () => setSelectedItems(new Map());

  const toggleSelect = useCallback((asset: LibraryAsset) => {
    setSelectedItems((current) => {
      const next = new Map(current);

      if (next.has(asset.id)) {
        next.delete(asset.id);
      } else {
        next.set(asset.id, asset);
      }
      return next;
    });
  }, []);

  const selectedIds = new Set(selectedItems.keys());

  const handleUploadSelected = () => {
    const assets = Array.from(selectedItems.values());

    if (assets.length === 0) {
      return;
    }

    const { importSettings } = normalizeConfigParameters(ctx.plugin.attributes.parameters);

    const uploads = assets.map((asset) =>
      buildUpload(asset, importSettings, ctx.site.attributes.locales),
    );

    selectUploads(ctx, uploads);

    ctx.notice(`Imported ${uploads.length} asset${uploads.length > 1 ? "s" : ""}.`);
    setSelectedItems(new Map());
  };

  return (
    <Canvas ctx={ctx}>
      {brands && brands.length > 1 ? (
        <div {...stylex.props(styles.picker)}>
          <SelectInput
            options={brandsOptions}
            value={brandsOptions.find((option) => option.value === effectiveBrandId) ?? null}
            onChange={(option) => {
              if (option) {
                setSelectedLibraryId(null);
                setSelectedBrandId(option.value);
                clearSelection();
                resetPages();
              }
            }}
          />
        </div>
      ) : null}
      {libraries.length > 1 ? (
        <div {...stylex.props(styles.picker)}>
          <SelectInput
            options={libraryOptions}
            value={libraryOptions.find((option) => option.value === effectiveLibraryId) ?? null}
            onChange={(option) => {
              if (option) {
                setSelectedLibraryId(option.value);
                clearSelection();
                resetPages();
              }
            }}
          />
        </div>
      ) : null}
      <div {...stylex.props(styles.searchForm)}>
        <TextInput
          name="searchTerm"
          type="search"
          placeholder="Search assets"
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
        />
      </div>
      <div {...stylex.props(styles.sortControls)}>
        <label htmlFor="frontify-sort">Sort by</label>
        <SelectInput
          name="frontify-sort"
          id="frontify-sort"
          value={SORT_OPTIONS.find((opt) => opt.value === sortBy)}
          options={SORT_OPTIONS}
          onChange={(option) => {
            if (option) {
              setSortBy(option.value as SortValue);
              resetPages();
            }
          }}
        />
      </div>
      {selectedItems.size > 0 ? (
        <div {...stylex.props(styles.actionBar)}>
          <span>{selectedItems.size} selected</span>
          <div {...stylex.props(styles.selectedActions)}>
            <Button buttonSize="s" onClick={() => setSelectedItems(new Map())}>
              Clear
            </Button>
            <Button buttonSize="s" buttonType="primary" onClick={handleUploadSelected}>
              Upload selected
            </Button>
          </div>
        </div>
      ) : null}
      <div {...stylex.props(styles.container)}>
        {loading ? (
          <div {...stylex.props(styles.loadingOverlay)}>
            <Spinner size={48} placement="centered" />
          </div>
        ) : null}

        <div {...stylex.props(styles.pageGrid)}>
          {effectiveLibraryId
            ? pageVariables.map((variables, i) => (
                <Page
                  key={`${effectiveBrandId ?? "brand"}-${effectiveLibraryId}-${variables.page}`}
                  variables={variables}
                  libraryId={effectiveLibraryId}
                  searchTerm={debouncedQuery}
                  sortBy={sortBy}
                  selectedIds={selectedIds}
                  onToggle={toggleSelect}
                  onLoadMore={(next) => setPageVariables((prev) => [...prev, next])}
                  onFetchingChange={setFetchingAssets}
                  isLastPage={i === pageVariables.length - 1}
                />
              ))
            : null}
        </div>
      </div>
    </Canvas>
  );
}

const styles = stylex.create({
  pageGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  picker: {
    marginBlockEnd: 8,
  },
  searchForm: {
    display: "flex",
    gap: 8,
  },
  sortControls: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBlockStart: 8,
  },
  actionBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "var(--border-color, #ddd)",
  },
  selectedActions: {
    display: "flex",
    gap: 8,
  },
  container: {
    position: "relative",
    minHeight: 200,
    marginBlockStart: 24,
  },
  loadingOverlay: {
    zIndex: 999,
    height: "100%",
    position: "absolute",
    width: "100%",
  },
});
