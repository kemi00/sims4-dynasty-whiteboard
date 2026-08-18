# Source spreadsheet (not in repo)

The pre-made sim roster spreadsheet is maintained by [**u/SkyChips2Go**](https://www.reddit.com/user/SkyChips2Go/) and is **not** included in this repository. Only the processed output in `src/data/whiteboard.json` is shipped with the app.

## Rebuild roster data locally

1. Download the spreadsheet from [SkyChips2Go's Google Drive folder](https://drive.google.com/drive/folders/1iEBslkMdUs2uyw1Ij15rH5gKiPEg5sv4?usp=sharing).
2. Save it as `data/premade-sims.xlsx` (this path is gitignored).
3. Run:

```bash
pnpm build:data
```

You can also pass a custom path:

```bash
node scripts/build-data.mjs /path/to/premade-sims.xlsx
```
