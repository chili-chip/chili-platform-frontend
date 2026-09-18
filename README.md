# Chili Platform — Frontend 🌶️

Angular client for **Chili Platform**: store, community, creator, and marketplace around the **vgc zero** handheld. Deployed to Cloudflare Pages.

---

## Routes

| Path | Screen |
|---|---|
| `/` | Landing page with vgc zero hero |
| `/store` | Chilichip store placeholder |
| `/marketplace` | Marketplace placeholder |
| `/creator` | Web creator placeholder (auth required) |
| `/community` | Forum categories + threads |
| `/community/post/:id` | Thread + comments |
| `/login` `/register` | Auth |
| `/profile/:username` | Public profile |

Auth uses JWT in `localStorage`, an HTTP interceptor, and Angular Signals for `currentUser`.

---

## Local development

```bash
npm install
npm start                 # http://localhost:4200
```

`ng serve` proxies `/api` to the Worker at `http://localhost:8787`. Point `src/environments/environment.ts` at a remote API if needed.

```bash
npm run build
npx wrangler pages deploy dist/chili-platform/browser --project-name=chili-platform
```

---

## License

MIT. See `LICENSE`.
