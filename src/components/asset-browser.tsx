import { RenderAssetSourceCtx } from "datocms-plugin-sdk";
import {
  Button,
  Canvas,
  SelectInput,
  Spinner,
  TextInput,
} from "datocms-react-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "urql";
import Page from "./page";
import type { LibraryAsset } from "./page";
import { buildUpload, selectUploads } from "../lib/build-upload";
import { normalizeConfigParameters } from "../utils/config";
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

export type SortValue =
  | "RELEVANCE"
  | "NEWEST"
  | "OLDEST"
  | "TITLE_ASCENDING"
  | "TITLE_DESCENDING";

const SORT_OPTIONS: SelectOption<SortValue>[] = [
  { label: "Relevance", value: "RELEVANCE" },
  { label: "Newest first", value: "NEWEST" },
  { label: "Oldest first", value: "OLDEST" },
  { label: "Title A-Z", value: "TITLE_ASCENDING" },
  { label: "Title Z-A", value: "TITLE_DESCENDING" },
];

type AssetBrowserProps = {
  ctx: RenderAssetSourceCtx;
};

export default function AssetBrowser({ ctx }: AssetBrowserProps) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedQuery = useDebounce(searchTerm, 500);

  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(
    null,
  );
  const [sortBy, setSortBy] = useState<SortValue>("NEWEST");
  const [selectedItems, setSelectedItems] = useState<Map<string, LibraryAsset>>(
    new Map(),
  );
  const [pageVariables, setPageVariables] = useState([
    {
      page: 1,
    },
  ]);

  const [{ data: brandsData, error: brandsError, fetching: fetchingBrands }] =
    useQuery({
      query: BrandsQuery,
    });

  const brands = brandsData?.brands;

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  const [
    { data: librariesData, error: librariesError, fetching: fetchingLibraries },
  ] = useQuery({
    query: BrandLibrariesQuery,
    pause: !selectedBrandId,
    variables: { id: selectedBrandId ?? "" },
  });

  const error = brandsError || librariesError;

  const libraries = useMemo(
    () => librariesData?.brand?.libraries?.items ?? [],
    [librariesData],
  );

  const libraryOptions = useMemo<SelectOption[]>(
    () =>
      libraries
        .filter((library) => library != null)
        .map((library) => ({ label: library.name, value: library.id })),
    [libraries],
  );

  const brandsOptions = useMemo<SelectOption[]>(
    () =>
      brands
        ?.filter((brand) => brand != null)
        .map((brand) => ({ label: brand.name, value: brand.id })) ?? [],
    [brands],
  );

  useEffect(() => {
    if (brandsOptions.length > 0) {
      setSelectedBrandId(brandsOptions[0].value);
    }
  }, [brandsOptions]);

  useEffect(() => {
    if (libraryOptions.length > 0) {
      setSelectedLibraryId(libraryOptions[0].value);
    }
  }, [libraryOptions]);

  useEffect(() => {
    setPageVariables([{ page: 1 }]);
  }, [selectedLibraryId, debouncedQuery, sortBy]);

  useEffect(() => {
    setLoading(fetchingBrands || fetchingLibraries);
  }, [fetchingBrands, fetchingLibraries]);

  useEffect(() => {
    if (error) {
      ctx.alert(error.message);
    }
  }, [error, ctx]);

  useEffect(() => {
    setSelectedItems(new Map());
  }, [selectedLibraryId]);

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

  const selectedIds = useMemo(
    () => new Set(selectedItems.keys()),
    [selectedItems],
  );

  const handleUploadSelected = () => {
    const assets = Array.from(selectedItems.values());

    if (assets.length === 0) {
      return;
    }

    const { importSettings } = normalizeConfigParameters(
      ctx.plugin.attributes.parameters,
    );

    const uploads = assets.map((asset) =>
      buildUpload(asset, importSettings, ctx.site.attributes.locales),
    );

    selectUploads(ctx, uploads);

    ctx.notice(
      `Imported ${uploads.length} asset${uploads.length > 1 ? "s" : ""}.`,
    );
    setSelectedItems(new Map());
  };

  return (
    <Canvas ctx={ctx}>
      <div {...stylex.props(styles.contentWrapper)}>
        {brands && brands.length > 1 && (
          <div {...stylex.props(styles.picker)}>
            <SelectInput
              options={brandsOptions}
              value={
                brandsOptions.find(
                  (option) => option.value === selectedBrandId,
                ) ?? null
              }
              onChange={(option) => {
                if (option) {
                  setSelectedLibraryId(null);
                  setSelectedBrandId(option.value);
                }
              }}
            />
          </div>
        )}
        {libraries.length > 1 && (
          <div {...stylex.props(styles.picker)}>
            <SelectInput
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
              }
            }}
          />
        </div>
      </div>
      {selectedItems.size > 0 && (
        <div {...stylex.props(styles.actionBar)}>
          <span>{selectedItems.size} selected</span>
          <div {...stylex.props(styles.selectedActions)}>
            <Button buttonSize="s" onClick={() => setSelectedItems(new Map())}>
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
      <div {...stylex.props(styles.container)}>
        {loading && (
          <div {...stylex.props(styles.loadingOverlay)}>
            <Spinner size={48} placement="centered" />
          </div>
        )}

        {selectedLibraryId &&
          pageVariables.map((variables, i) => (
            <Page
              key={`${selectedBrandId ?? "brand"}-${selectedLibraryId}-${variables.page}`}
              ctx={ctx}
              variables={variables}
              libraryId={selectedLibraryId}
              searchTerm={debouncedQuery}
              sortBy={sortBy}
              selectedIds={selectedIds}
              onToggle={toggleSelect}
              onLoadMore={(next) => setPageVariables((prev) => [...prev, next])}
              isLastPage={i === pageVariables.length - 1}
            />
          ))}
      </div>
    </Canvas>
  );
}

const styles = stylex.create({
  contentWrapper: {
    paddingBottom: 8,
  },
  picker: {
    marginBottom: 8,
  },
  searchForm: {
    display: "flex",
    gap: 8,
  },
  sortControls: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  actionBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 8,
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
  },
  loadingOverlay: {
    zIndex: 999,
    height: "100%",
    position: "absolute",
    width: "100%",
  },
});
