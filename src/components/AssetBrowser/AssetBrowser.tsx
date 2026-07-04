import { RenderAssetSourceCtx } from "datocms-plugin-sdk";
import {
  Button,
  Canvas,
  SelectInput,
  Spinner,
  TextInput,
} from "datocms-react-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, gql } from "urql";
import { useAssetBrowser } from "../../contexts/AssetBrowserContext";
import Page from "../Page/Page";
import { buildUpload, selectUploads } from "../../lib/buildUpload";
import { normalizeConfigParameters } from "../../utils/config";
import * as stylex from "@stylexjs/stylex";

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

const BRANDS_QUERY = gql`
  query {
    brands {
      id
      name
    }
  }
`;

const BRAND_LIBRARIES_QUERY = gql`
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
`;

export type SortValue =
  | "RELEVANCE"
  | "NEWEST"
  | "OLDEST"
  | "TITLE_ASCENDING"
  | "TITLE_DESCENDING";

const SORT_OPTIONS: SelectOption[] = [
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
  const { hasMore, loading, setLoading } = useAssetBrowser();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortValue>("NEWEST");
  const [selected, setSelected] = useState<Map<string, any>>(new Map());
  const [pageVariables, setPageVariables] = useState([
    {
      page: 1,
      hasNext: true,
    },
  ]);

  const [{ data: brandsData, error: brandsError, fetching: fetchingBrands }] =
    useQuery<BrandsData>({
      query: BRANDS_QUERY,
    });

  const brand = brandsData?.brands?.[0];

  const [
    { data: librariesData, error: librariesError, fetching: fetchingLibraries },
  ] = useQuery<LibrariesData>({
    query: BRAND_LIBRARIES_QUERY,
    pause: !brand,
    variables: { id: brand?.id },
  });

  const error = brandsError || librariesError;

  const libraries = useMemo(
    () => librariesData?.brand?.libraries?.items ?? [],
    [librariesData],
  );

  const libraryOptions = useMemo<SelectOption[]>(
    () =>
      libraries.map((library) => ({ label: library.name, value: library.id })),
    [libraries],
  );

  useEffect(() => {
    if (!selectedLibraryId && libraries.length > 0) {
      setSelectedLibraryId(libraries[0].id);
    }
  }, [libraries, selectedLibraryId]);

  useEffect(() => {
    setPageVariables([{ page: 1, hasNext: true }]);
  }, [selectedLibraryId, searchTerm, sortBy]);

  useEffect(() => {
    setLoading(fetchingBrands || fetchingLibraries);
  }, [fetchingBrands, fetchingLibraries, setLoading]);

  useEffect(() => {
    if (error) {
      ctx.alert(error.message);
    }
  }, [error, ctx]);

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
    setSelected(new Map());
  };

  return (
    <Canvas ctx={ctx}>
      <div {...stylex.props(styles.contentWrapper)}>
        {libraries.length > 1 && (
          <div {...stylex.props(styles.libraryPicker)}>
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
          {...stylex.props(styles.searchForm)}
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const form = e.currentTarget;
            const formData = new FormData(form);
            const searchTerm = formData.get("searchTerm") as string;

            setSearchTerm(searchTerm);
          }}
        >
          <TextInput
            name="searchTerm"
            type="text"
            placeholder="Search assets"
          />
          <Button buttonSize="xs" type="submit" buttonType="primary">
            Search
          </Button>
        </form>
        <div {...stylex.props(styles.sortControls)}>
          <label htmlFor="frontify-sort">Sort by</label>
          <SelectInput<SelectOption>
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
      {selected.size > 0 && (
        <div {...stylex.props(styles.actionBar)}>
          <span>{selected.size} selected</span>
          <div {...stylex.props(styles.selectedActions)}>
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
      <div {...stylex.props(styles.container)}>
        {loading && (
          <div {...stylex.props(styles.loadingOverlay)}>
            <Spinner size={48} placement="centered" />
          </div>
        )}

        <div {...stylex.props(styles.assetGrid)}>
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
          {...stylex.props(styles.loadMoreButton)}
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

const styles = stylex.create({
  contentWrapper: {
    paddingBottom: 8,
  },
  libraryPicker: {
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
  sortSelectWrapper: {
    flex: 1,
    maxWidth: 240,
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  assetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },
  loadMoreButton: {
    marginTop: 12,
  },
});
