# Cloudflare Pages Dashboard Settings

Use these values if connecting the GitHub repo from the Cloudflare dashboard.

Repository:

```text
Karmicmurphy/Ollie_Twis_Holo_workshop
```

Project name:

```text
ollie-twis-holo-workshop
```

Framework preset:

```text
None / Static HTML
```

Build command:

```bash
npm run build
```

Build output directory:

```text
dist
```

Root directory:

```text
/
```

Environment variables:

```text
TWIS_REMOTE_HULL_MODE=public-shell
TWIS_ALLOW_AI=false
TWIS_ALLOW_REMOTE_WRITE=false
```

Manual CLI deploy from PC:

```bash
git clone https://github.com/Karmicmurphy/Ollie_Twis_Holo_workshop.git
cd Ollie_Twis_Holo_workshop
npm install
npm run build
npx wrangler login
npx wrangler pages deploy dist --project-name ollie-twis-holo-workshop
```

Do not set Cloudflare as source authority. The local Workshop data remains the source of truth.
