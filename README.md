# Frontify asset source

Insert photos from your Frontify Account directly inside of your DatoCMS project

## Requirements

- Frontify Account

## GraphQL

### Update GraphQL schema

Set your Frontify domain and token in environment variables, then run:

```bash
gql-tada generate schema "https://$FRONTIFY_DOMAIN.frontify.com/graphql" \
	--header "Authorization: Bearer $FRONTIFY_TOKEN" \
	--output ./schema.graphql
```
