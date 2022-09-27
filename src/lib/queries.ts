export const BrandLevelSearchQuery = `
  query BrandLevelSearch($id: ID!, $limit: Int, $page: Int, $term: String) {
    brand(id: $id) {
        search(limit: $limit, page: $page, query: {
          term: $term
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

export const BrandsQuery = `
  query {
    brands {
        id
        name
      }
  }
`;
