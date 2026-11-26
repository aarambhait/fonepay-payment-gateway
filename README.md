# Nepal Payment Docs

Community-written developer guides for integrating Nepal payment gateways.
Currently covers **Fonepay Dynamic QR** and **Checkout by Fonepay**. More gateways welcome.

> Unofficial. Not affiliated with Fonepay or any bank. Always confirm against the official documents you receive from them.

## Develop

Requires Node.js 26 (LTS), see `.nvmrc`.

```bash
npm install
npm run dev          # http://localhost:4321/
```

| Command | Purpose |
|---|---|
| `npm test` | Runs the signing and parsing tests for the example code |
| `npm run typecheck` | Strict TypeScript check of `examples/` and `tests/` |
| `npm run build` | Builds the static site into `dist/` |
| `npm run check:links` | Verifies every internal link and anchor in `dist/` (run after build) |

## Layout

```
src/content/docs/<provider>/   Pages, grouped by gateway (MDX)
examples/                      Runnable example code, imported into pages with ?raw
tests/                         Tests for the example code
```

Adding a gateway: see [`about/contributing`](src/content/docs/about/contributing.mdx).

## Deploy

Hosted on Cloudflare as a Workers static-assets site (`wrangler.jsonc`).

```bash
npx wrangler login      # or set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
npm run deploy          # builds, then runs wrangler deploy
```

CI (`.github/workflows/ci.yml`) runs tests, typecheck, build and the link check on every push and pull request.
To deploy automatically, connect the repository in the Cloudflare dashboard (Workers & Pages > Create > Import a repository) with build command `npm run build` and deploy command `npx wrangler deploy`.

## Never commit secrets

Vendor documents and Postman collections often contain real-looking keys, tokens and passwords. Use placeholders. `*.pem` and `*.key` are git-ignored.
