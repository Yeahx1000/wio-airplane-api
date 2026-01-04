# misc folder

This folder containes files mainly used on setup, makes things easier to setup and maintain.

## scripts

### ingest-airports.ts

used to ingest airport data from CSV into Postgres. you can run it with:

```bash
 `npm run ingest`.
```

### warm-cache.ts

used to warm the cache for the first time, can be used to warm the cache after a new deployment, if not done, requests, particularly to `/airports/route` will be much slower at first.

```bash
 `npm run warm-cache`.
```
