# Chili Platform — Frontend 🌶️

The frontend client for **Chili Platform**, an end-to-end retro gaming ecosystem. This Angular web application powers the web-based game editor, digital marketplace, community forums, and hardware store.

---

## ✨ Key Features

* **🛒 Chilichip Store UI:** Browse and order the **vgc zero** retro handheld console, DIY hardware kits, and accessories.
* **💬 Community & Forums:** Engage in discussions, read devlogs, share pixel art, and interact directly with indie creators.
* **🛠️ Web Game Creator:** Embedded browser studio based on a custom fork of [Bitsy](https://bitsy.org), optimized for tile/sprite editing, dialogue scripting, and instant vgc zero compilation previews.
* **🏷️ Marketplace:** Discover, play (in-browser via WebAssembly), purchase, and download indie retro games.

---

## 🛠️ Tech Stack

* **Framework:** Angular (TypeScript, RxJS)
* **Game Runtime:** WebAssembly / Emscripten (for in-browser ROM preview & playback)
* **Styling:** SCSS, Angular Material / Custom Design System
* **Deployment & Hosting:** Cloudflare Pages

---

## 🏗️ Directory Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── core/            # Services, guards, interceptors, and models
│   │   ├── shared/          # Reusable UI components, pipes, and directives
│   │   ├── features/
│   │   │   ├── store/       # Chilichip physical store components
│   │   │   ├── community/   # Forum, devlogs, and creator profiles
│   │   │   ├── creator/     # Web game editor (Bitsy fork)
│   │   │   └── marketplace/ # Digital marketplace & player UI
│   │   ├── app.component.ts
│   │   └── app.routes.ts
│   ├── assets/              # Icons, images, and WebAssembly binaries
│   └── styles/              # Global SCSS variables and theme configurations
├── angular.json
├── package.json
└── tsconfig.json
```

---

## 🚀 Development Setup

### Prerequisites

* **Node.js**: `v20.x` or higher
* **npm** or **pnpm**
* **Angular CLI**: `npm install -g @angular/cli`
* **Wrangler CLI** (for local Cloudflare emulation): `npm install -g wrangler`

### Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/chili-platform-frontend.git
   cd chili-platform-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   ng serve
   ```
   Navigate to `http://localhost:4200/` in your browser.

4. **Environment Configuration:**
   Copy `.env.example` or set environment variables in `src/environments/environment.ts` to point to your backend API endpoint:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:8787/api' // Points to local Cloudflare Worker backend
   };
   ```

---

## ☁️ Building & Deployment

### Build for Production

```bash
ng build --configuration production
```
The compiled assets will be placed in the `dist/` directory.

### Deploy to Cloudflare Pages

```bash
wrangler pages deploy dist/frontend/browser --project-name=chili-platform
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
