# Day 42: Ship It — Phase 3 Capstone

Watch the video: *(not recorded yet)*

## The brief

A game only you can play isn't finished. Today Rider Rush goes on the internet, at a real address you can send to the group chat. When your friends paste the link, it shows a proper preview card. On a phone they can add it to their home screen like an app. And after every crash there's a **Share** button, so bragging about your score takes one tap.

`starter/` is the finished game from Day 41. Nothing about the gameplay changes today. This is the last 10% that decides whether people actually play it.

## What you'll use

- **A production build**: `vite build` turns the project into plain files (HTML, one small JavaScript file, one CSS file, images) that any web host can serve
- **`base: "./"`** in `vite.config.ts`, so every link in the build is relative and the game works in a sub-folder as well as at the root of a site
- **The `public/` folder**: files copied into the build unchanged, like icons and the preview image
- **Metadata**: a description, a `theme-color`, and Open Graph tags, which WhatsApp, X, Slack and iMessage read to draw the preview card
- **A web app manifest**: the name, colours and icons a phone uses when someone adds your game to their home screen
- **The Web Share API** (`navigator.share`): the phone's own share sheet, with the clipboard as a fallback where it doesn't exist
- **A performance budget**: a test that fails if the JavaScript grows past 50 KB. The whole game is about 10 KB, so there's lots of room, but you'll notice if something heavy sneaks in

## Steps

1. Build the starter as it is, and look at what comes out:

   ```bash
   npx vite build phase-3-browser/day-042-ship-it/starter
   ```

   Open `starter/dist/index.html` in a text editor. The links start with `/`, like `/assets/index-….js`. That only works at the very root of a website.
2. **`starter/vite.config.ts`**: set `base: "./"` and `build.target: "es2022"`. Build again: the links now start with `./`.
3. **`starter/index.html`**: fill in the TODOs in `<head>`. The files they point at are already in `public/`: `icon.svg`, `icon-192.png`, `icon-512.png`, `og-image.png` and `manifest.webmanifest`. Open `manifest.webmanifest` and read it too.
4. **`starter/share.ts`**: `shareText`, `shareScore` and `shareMessage`. The share sheet comes first; the clipboard is the fallback; closing the sheet isn't an error.
5. **`starter/app.ts`**: four small TODOs wire up the `#share` button and the `#toast` message.
6. Run the tests. One of the two test files runs a real production build and checks what comes out:

   ```bash
   npm test -- day-042
   ```

7. Check the build before you ship it:

   ```bash
   npx vite build phase-3-browser/day-042-ship-it/starter
   npx vite preview phase-3-browser/day-042-ship-it/starter
   ```

   To try it on your phone, add `--host` to the preview command and open the "Network" address it prints on a phone on the same Wi-Fi.

## Ship it

Pick one. Both are free for a project like this.

**Netlify Drop (quickest, no Git needed).** Go to [app.netlify.com/drop](https://app.netlify.com/drop), sign in, and drag your `starter/dist` folder onto the page. You get an address straight away, and you can rename the site in its settings.

**GitHub Pages (lives next to your code).** Create a new GitHub repository, copy the *contents* of `starter/dist` into it, and push. In the repository's settings, open **Pages** and deploy from the `main` branch. The game appears at `https://<your-username>.github.io/<repo-name>/`, a sub-folder, which is exactly why you set `base: "./"`.

Once it's live:

1. Change `og:image` in `index.html` to the full address, like `https://your-game.netlify.app/og-image.png`, then build and upload again. Many apps won't show a preview image from a relative path.
2. Paste your link into a chat with yourself and check the preview card.
3. On your phone, open the link and use *Add to Home Screen*. It opens full-screen, with your icon.
4. Send the link to three friends. Tell them your best score.

## When you're stuck

- **A blank page after deploying, and 404s in the console for `/assets/…`** — the build still uses absolute paths. Check `base: "./"` and build again.
- **The icons 404 in the build** — write them as `/icon.svg` in `index.html`. Vite only rewrites paths to files in `public/` that start with `/`.
- **No preview card** — apps cache previews, sometimes for days. Test with a new link (add `?v=2` to the end), and make sure `og:image` is a full `https://` address.
- **The Share button does nothing on a laptop** — most desktop browsers have no share sheet, so it copies instead. Look for the "Link copied" message under the game.
- **`navigator.share` throws on an `http://` page** — it only works on `https://` (and `localhost`). Your deployed site will be `https`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.

## Phase 3 is done

In 14 days you went from a link-in-bio page to two games you can send to anyone: HTML and CSS, a typed DOM, Vite, forms, `fetch`, `localStorage`, Canvas, pointer events, a game loop, a rules engine, animation, sound, accessibility, and a real deployment. Phase 4 takes your code off the page and onto the internet: APIs, secrets, and a bot that messages you every morning.
