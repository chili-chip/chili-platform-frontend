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

```bash
npm run build
npx wrangler pages deploy dist/chili-platform/browser --project-name=chili-platform
```

---

## License

MIT. See `LICENSE`.
