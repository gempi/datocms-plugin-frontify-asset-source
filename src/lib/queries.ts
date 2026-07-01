export const BrandsQuery = `
  query {
    brands {
        id
        name
      }
  }
`;

export const BrandLibrariesQuery = `
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

// Browses/searches assets within a single library.
//
// NOTE: this replaces the previous brand-level `search` query. Frontify's
// `Brand.search` resolver currently returns HTTP 500 ("Internal server error")
// for every variant, while `Library.assets` works. The search term argument is
// also named differently: `AssetQueryInput.search` (here) vs the old
// `BrandQueryInput.term`.
export const LibraryAssetsQuery = `
  query LibraryAssets($id: ID!, $limit: Int, $page: Int, $search: String, $sortBy: AssetQueryFilterSortType) {
    library(id: $id) {
        assets(limit: $limit, page: $page, query: {
          search: $search
          sortBy: $sortBy
          types: [IMAGE]
        }) {
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
`;
