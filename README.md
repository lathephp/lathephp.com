# lathephp.com

The website of Lathe, an admin panel builder for Laravel: a landing page and
the docs. The docs pages are not kept here. The build reads the `docs/` folder
of [lathephp/lathe](https://github.com/lathephp/lathe) and writes plain static
files to `dist/`, which Cloudflare Pages serves. There is no server code.

Each file `docs/<folder>/<name>.md` becomes the page `/docs/<folder>/<name>`.
Its front matter gives the `title`, `description` and `order`. Each folder is
one section of the sidebar.

## Build locally

You need Node 24 and pnpm.

```bash
pnpm install
```

Build from a local checkout of lathephp/lathe:

```bash
LATHE_DOCS_DIR=../lathe/docs pnpm build
```

Or build from a tag or branch of lathephp/lathe. The build clones only its
`docs/` folder over https, so git must be able to read the repository:

```bash
LATHE_DOCS_REF=main pnpm build
```

`LATHE_DOCS_DIR` wins when both are set. For a dev server with live reload of
the docs, run `LATHE_DOCS_DIR=../lathe/docs pnpm dev`.

## Checks

| Command | What it checks |
| --- | --- |
| `pnpm check:words` | The predecessor's name is in no tracked file, file name, `dist/` file or commit message, and the product is never called part of Laravel. |
| `LATHE_DOCS_DIR=... pnpm check:smoke` | Builds the site, then checks that `dist/` holds the landing page, `/docs` and the doc pages, has no server code, and has the right landing page title. |
| `pnpm check:links` | Every internal link in `dist/` points at a built file, and every `#anchor` names an id on its page. Run it after a build. |
| `LATHE_DOCS_DIR=... pnpm test:browser` | Serves `dist/` and opens it in Chromium: the sidebar, the configuration and commands pages, search, trailing slashes and the landing page links. Run it after a build. |
| `pnpm typecheck` | TypeScript. |

Every pull request runs the word check, the build smoke test and the link
check (`.github/workflows/pr.yml`).

## Releases and deploys

`.github/workflows/deploy.yml` builds the site on every push to `main` and
when a Lathe release sends a `lathe-release` repository dispatch with
`{"tag": "<release tag>"}`. A dispatch builds that tag. A push builds the
latest release of lathephp/lathe, or `main` when there is no release yet. The
workflow uploads `dist/` as an artifact and deploys it to the Cloudflare Pages
project `lathephp-com`, which serves `lathephp.com`. It reads the repository secrets
`CLOUDFLARE_API_TOKEN` (a token that can edit Pages on that account) and
`CLOUDFLARE_ACCOUNT_ID`.

## Licence

MIT, see [LICENSE](LICENSE).
