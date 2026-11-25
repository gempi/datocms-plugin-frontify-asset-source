# datocms-plugin-frontify-asset-source

## 0.3.7

### Patch Changes

- 0721867: Renew the Frontify access token automatically when an administrator opens the asset browser after half of its lifetime, show a clear message instead of a GraphQL error when it has expired, and stop the settings form from overwriting a refreshed token
- bef4a7b: Fix "Load more" button being cut off after a search because the modal height was measured before the asset tiles reached their rendered size
- bb74c14: Upgrade dependencies to their latest minor and patch versions

## 0.3.6

### Patch Changes

- 2f49efc: Upgrade oxfmt to fix critical tinypool prototype pollution advisories (dev dependency only)

## 0.3.5

### Patch Changes

- df7c594: Update dependencies and fix TypeScript build errors when plugin parameters are null

## 0.3.4

### Patch Changes

- 39cac04: Migrate Vite from v7 to v8
- fe992c4: Migrate Changesets from v2 to v3

## 0.3.3

### Patch Changes

- 0151f20: Remove tsbuildinfo

## 0.3.2

### Patch Changes

- 081ecca: Refactor workflows

## 0.3.1

### Patch Changes

- 7b62928: Add changeset workflow

## 0.3.0

### Minor Changes

- e5426cc: Fix Frontify asset browser brand and library selection to use derived effective IDs, avoiding stale library lists and resetting pagination only when the search query changes.
- a5278c1: Add oxlint and oxfmt with a pre-commit hook so linting and formatting run before each commit.
- ecf8d19: Add Changesets for package versioning and changelog generation.
