# Brand logos

Put the official logo files here. They show up in both apps automatically after the next build:
the careers navigation, hero, entity cards, job cards and pages, footer, the portal sign-in and the sidebar.

| File | Used on | Official source |
| --- | --- | --- |
| `infolks-group.svg` | light backgrounds | https://infolksgroup.com/images/logo/logo.svg |
| `infolks-group-white.svg` | dark backgrounds (footer, sidebar, sign-in) | https://infolksgroup.com/images/logo/logo-white.svg |
| `infolks.svg` | Infolks | https://infolks.info/images/home/logo_new.svg |
| `dataways.svg` | Dataways | https://dataways.ai/images/logo/logo.svg |
| `webfolks.svg` | Webfolks | the logo from https://webfolks.in (no link yet) |
| `medrays.svg` | Medrays | the logo from https://medrays.ai |

- Names must match exactly (lower case). `.svg` is best; `.png` or `.webp` also work.
- Optional: `infolks-white.svg`, `webfolks-white.svg`, `dataways-white.svg` and `medrays-white.svg`
  are used on dark backgrounds. Without them, the normal logo sits on a small white tile.
- A logo HR uploads for an entity in **Website Content** takes priority over the file here.
- Until a file is present, a monogram in the entity's colours is shown instead.

## Linked logos

When no file is here, `index.js` links the official logos straight from the group's websites
(Infolks Group, Infolks and Dataways). Webfolks and Medrays have no link yet. If a linked logo cannot load,
the monogram is shown instead.
