# Chili Platform — Frontend 🌶️

Angular client for **Chili Platform**: store, community, creator, and marketplace around the **vgc zero** handheld. Deployed to Cloudflare Pages.

---

## Routes

| Path | Screen |
|---|---|
| `/` | Landing page with vgc zero hero |
| `/store` | Hardware catalog and cart |
| `/store/checkout` | Review cart and start Stripe Checkout |
| `/store/checkout/success` | Confirm Stripe session and show receipt |
| `/store/checkout/cancel` | Canceled checkout return |
| `/marketplace` | Browse listed games: search, tags, categories, free or paid. Tiles show the rating average and count |
| `/marketplace/:slug` | Listed game page, one library rating with an optional comment, and card checkout |
| `/games/:id` | Game page. A listed game continues at its marketplace slug |
| `/marketplace/sales` | Creator balance and embedded payouts (auth) |
| `/marketplace/checkout/success` | Confirm a game payment |
| `/marketplace/checkout/cancel` | Canceled game checkout |
| `/play/:id` | Play a library game in the web player (auth) |
| `/creator` | Bitsy editor with the citsy runtime (auth required) |
| `/community` | Forum categories + threads |
| `/community/post/:id` | Thread + comments |
| `/login` `/register` | Auth |
| `/verify-email` | Confirm the link from the verification email, or resend it |
| `/forgot-password` | Ask for a password reset link |
| `/reset-password` | Set a new password from the reset link |
| `/profile/:username` | Tabs for your orders, library, and projects. A public profile shows released games |
| `/profile/:username/listing` | List a released game (your profile only) |

Auth uses JWT in `localStorage`, an HTTP interceptor, and Angular Signals for `currentUser`.

---

## Local development

```bash
npm install
npm start                 # http://localhost:4200
```

`ng serve` proxies `/api` to the Worker at `http://localhost:8787`. Point `src/environments/environment.ts` at a remote API if needed.

The landing hero loads `public/models/vgc-zero.glb`.

## Environments

| | Production | Dev |
| --- | --- | --- |
| Branch | `main` | `dev` |
| Site | https://platform.chilichip.eu | https://platform-dev.chilichip.eu |
| Pages project | `chili-platform` | `chili-platform-dev` |
| API | `environment.prod.ts` | `environment.dev.ts` |
| Build | `npm run build:prod` | `npm run build:dev` |
| Deploy | `npm run pages:prod` | `npm run pages:dev` |

Feature branches merge into `dev`, which deploys to dev. When dev looks right, merge `dev` into `main` to release it to production. Each deploy script refuses to run from the other environment's branch (on Cloudflare's git builds it reads `CF_PAGES_BRANCH`), builds with that environment's API URL, and uploads to its own Pages project. The `chili-platform-dev` project's production branch is `dev`.

GitHub Actions (`.github/workflows/build.yml`) builds both configurations and runs the tests on every pull request and on pushes to `dev` and `main`. A push to `dev` then uploads the dev build to `chili-platform-dev`, and a push to `main` uploads the production build to `chili-platform`. Both need `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets. Cloudflare's own Git builds are off; Actions is the only thing that deploys.

---

## License

MIT. See `LICENSE`.
