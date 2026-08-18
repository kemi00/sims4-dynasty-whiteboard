# The Sims 4 | Family Trees Whiteboard

Interactive family-tree whiteboard for Sims 4 households. Pre-loaded with 344 sims across households and worlds. Drag sims, draw connections, filter by game pack, and save your work.

## Requirements

- [pnpm](https://pnpm.io/) (npm is not used in this project)

## Local development

```bash
pnpm install
pnpm dev
```

Open the URL shown in the terminal (typically [http://localhost:5173](http://localhost:5173)).

## Build

```bash
pnpm build
pnpm preview
```

## Save / load

- **Save .json** — downloads your current board state (node positions, edges you added, hidden packs).
- **Load** — restores a previously saved `.json` file.



## Deploy

Production site: *(Vercel URL added after deploy)*

## Stack

- React + TypeScript
- Vite
- pnpm
- Hosted on Vercel



## License

Source code in this repository is licensed under the [MIT License](LICENSE).

That license applies to the whiteboard app, layout engine, and build scripts only. It does **not** apply to bundled sim data or third-party content — see below.

## Data & third-party content

The shipped app uses processed roster data in `src/data/whiteboard.json`. That data is **not** MIT-licensed.


| Content                                               | Source                                                                                                | Notes                                                                                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Sim roster (names, households, life stages, metadata) | **[u/SkyChips2Go](https://www.reddit.com/user/SkyChips2Go/)**                                         | Derived from their public spreadsheet; the `.xlsx` is **not** in this repo — see [data/README.md](data/README.md) to rebuild locally |
| Relationship links                                    | In-game data (owned packs) + [The Sims Wiki](https://sims.fandom.com/wiki/The_Sims_4) (unowned packs) | Wiki content is typically [CC BY-SA](https://creativecommons.org/licenses/by-sa/3.0/)                                                  |
| Sims names & characters                               | Electronic Arts / Maxis                                                                               | Fan project; not affiliated with or endorsed by EA                                                                                     |


This is a non-commercial fan tool. See EA’s [Fan Content Guidelines](https://help.ea.com/en/help/faq/fan-content-guidelines/).

To refresh roster fields from the spreadsheet after downloading it locally:

```bash
pnpm build:data
```



## Credits



### Sim roster

The pre-made sim roster comes from **[u/SkyChips2Go](https://www.reddit.com/user/SkyChips2Go/)** on Reddit:

- [Comprehensive list of 437+ premade Sims 4 sims](https://www.reddit.com/r/Sims4/comments/1rff9ly/i_made_a_comprehensive_list_of_all_437_premade/) (r/Sims4)
- [Google Drive folder](https://drive.google.com/drive/folders/1iEBslkMdUs2uyw1Ij15rH5gKiPEg5sv4?usp=sharing) — spreadsheet and portraits
- [u/SkyChips2Go on Reddit](https://www.reddit.com/user/SkyChips2Go/)



### Relationship links

Links between sims were sourced from in-game relationships (packs I own) and [The Sims Wiki](https://sims.fandom.com/wiki/The_Sims_4) (packs I don't).

### This project

Board layout and whiteboard features are original to [this repository](https://github.com/kemi00/sims4-dynasty-whiteboard).
