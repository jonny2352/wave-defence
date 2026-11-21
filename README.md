# Wave Defence

A mobile-first tower-defence / shooter built with **Phaser 3 + Vite** (plain JavaScript).
Hold the castle: your hero auto-fires at the nearest enemy while you spend credits on hero
upgrades and towers. Every 5th wave is a boss wave. Made for portrait phones (iPhone Safari),
no external assets: all art and sound is generated in code.

## Run locally

```bash
npm install
npm run dev        # serves on your LAN (vite --host)
```

Vite prints a `Network:` URL such as `http://192.168.1.20:5173/`. Open that on your phone
(same WiFi). Other scripts:

```bash
npm run build      # static site into dist/
npm run preview    # serve dist/ locally (also on LAN)
npm run icons      # regenerate the home-screen icons in public/
```

## Tune the balance

Everything numeric is in **[`src/config.js`](src/config.js)**: hero stats and upgrade costs,
enemy HP/speed/damage/credits, wave scaling (`WAVES`), tower stats per level (`TOWERS`),
base HP and repair cost, economy, build-slot positions and screen layout.

## Swap in real art

Every look is defined in **[`src/visuals.js`](src/visuals.js)**. It draws shapes into textures with
fixed keys (`enemy_grunt`, `enemy_runner`, `enemy_brute`, `enemy_boss`, `tower_archer_0..2`,
`tower_cannon_0..2`, `tower_frost_0..2`, `wall_0..2`, `hero`, `hero_gun`, `proj_arrow`, `bg`,
`castle`, ...). Entities only ever use those keys.

To use sprites, put PNGs in `public/assets/` and load them in `BootScene.preload()` with the
**same keys**:

```js
this.load.image('enemy_grunt', 'assets/grunt.png');
```

`generateTextures()` skips any key that already exists, so your image wins and no game code
changes. Hit radii and sizes come from `config.js` (`radius`) so adjust those if your sprites differ.

## Project layout

```
src/
  config.js          all balance + layout numbers
  state.js           game state + economy (credits, base HP, hero upgrades, best score)
  audio.js           Web Audio sound effects + mute (persisted)
  visuals.js         every entity's look, in one place
  WaveManager.js     builds and spawns each wave
  scenes/            Boot, Title, Game, UI (HUD + panel + pause), GameOver
  entities/          Hero, Enemy (grunt/runner/brute/boss via config), Tower (archer/cannon/frost/wall via config), Projectile (pooled)
  ui/Button.js       touch buttons
```

## Deploy (Cloudflare Pages, free)

1. Push this repo to GitHub.
2. Cloudflare dashboard > **Workers & Pages** > **Create** > **Pages** > **Connect to Git**.
3. Pick the `wave-defence` repo and the `main` branch.
4. Build settings:
   - **Framework preset:** None (or Vite)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. **Save and Deploy.** You get a `https://wave-defence-xxxx.pages.dev` URL, and every push to
   `main` redeploys automatically (other branches get preview URLs).

## Fallback: GitHub Pages

A workflow is included at `.github/workflows/deploy-pages.yml`. It is **dormant**: it only runs
manually. To use it, set **Settings > Pages > Source** to **GitHub Actions**, then run it from the
Actions tab (or uncomment the `push:` trigger in the file for auto-deploys). The site will be at
`https://<user>.github.io/wave-defence/`. Asset paths are relative, so the sub-path works.

## Add to Home Screen (iPhone)

Open the site in Safari > Share > **Add to Home Screen**. It then launches full-screen with the
castle icon. Audio starts after your first tap (an iOS requirement).
