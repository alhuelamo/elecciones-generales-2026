# Elecciones Generales 2026

Static site where a voter finds their municipality and sees the Congreso and Senado candidacies for the 29 November 2026 general election, in Spanish, Catalan, Basque and Galician. The Basque and Galician UI strings are machine-translated; each page shows a notice with a link to report translation errors.

**Live site: <https://alhuelamo.com/elecciones-generales-2026/>**

Unofficial and independent: not affiliated with any party, institution or electoral administration.

## Requirements

- Node 24 with corepack enabled (`corepack enable`); Yarn 4 is pinned in `web/package.json`
- [uv](https://docs.astral.sh/uv/) for the Python pipeline (Python 3.12 is installed by uv)

## Web (`web/`)

```sh
cd web
yarn install
yarn dev            # local dev server
yarn test           # vitest (jsdom)
yarn build          # tsc -b && vite build
yarn format:check   # prettier
```

## Pipeline (`pipeline/`)

```sh
cd pipeline
uv run elecciones fetch   # download automatic sources into data/raw/
uv run elecciones build   # generate web/public/data/
uv run pytest
```

## Data sources

- Candidacies: BOE-A-2026-23103, <https://www.boe.es/diario_boe/xml.php?id=BOE-A-2026-23103>
- Convocation and seats: Real Decreto 806/2026, BOE-A-2026-20742
- Municipalities: INE codmun, <https://www.ine.es/daco/daco42/codmun/26codmun.xlsx>
- Islands: `pipeline/data/vendor/municipios_islas.csv` from codeforspain/ds-organizacion-administrativa (vendored)
- 2023 results: Ministerio del Interior, <https://infoelectoral.interior.gob.es/> (manual download into `pipeline/data/raw/results_2023/`)
- Party logos: Wikimedia Commons

## License

MIT. See [LICENSE](LICENSE).
