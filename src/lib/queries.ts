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
  query LibraryAssets($id: ID!, $limit: Int, $page: Int, $search: String) {
    library(id: $id) {
        assets(limit: $limit, page: $page, query: {
          search: $search
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
                    downloadUrl
                    previewUrl(width: 500, height: 500)
                    author
                    tags {
                        value
                    }
                    copyright {
                        status
                        notice
                    }
                }
            }
        }
      }
  }
`;
