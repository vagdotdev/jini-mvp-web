# Jini MVP Web

Live shopping MVP: Next.js app in **`web/`**, product brief and journal at repo root.

- **Product brief:** [JINI_LIVE_PROJECT_BRIEF.md](./JINI_LIVE_PROJECT_BRIEF.md)
- **Run the app:** [web/README.md](./web/README.md)
- **Journal snapshot:** [pjournal/25th-April-6am.md](./pjournal/25th-April-6am.md)
- **Deploy (Vercel):** [VERCEL.md](./VERCEL.md) — CLI + dashboard; production alias **`https://web-chi-neon-59.vercel.app`** (set `NEXT_PUBLIC_APP_URL` to this in Vercel env, then redeploy)

## Git / GitHub (`vagdotdev` / `jini-mvp-web`)

GitHub CLI is installed at **`/opt/homebrew/bin/gh`**. This repo is on branch **`main`**.

### One-time login (you must do this once in a real terminal)

```bash
/opt/homebrew/bin/gh auth login
```

Pick **GitHub.com** → **HTTPS** → **Login with a web browser**.  
After that, `gh` can create repos and push from this machine (including from Cursor’s terminal).

### Create the repo + push (after login)

```bash
cd /Users/vagdev/Documents/jinimvpweb
./scripts/github-sync.sh
```

That creates **`https://github.com/vagdotdev/jini-mvp-web`** if it does not exist yet, sets **`origin`**, and pushes **`main`**.

### Let Cursor / agents run `gh` without a browser next time

Create a **classic PAT** (or fine-grained token) on GitHub with **`repo`** scope. In Cursor, add an environment variable **`GH_TOKEN`** = that token (do **not** commit it). Then non-interactive commands like `gh repo view` and `git push` work in agent runs.
