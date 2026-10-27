# Deploy and launch (Tahap 10)

Two sites on the same VPS, deployed by `.github/workflows/deploy.yml`:

| Branch | Site | Port | Notes |
|---|---|---|---|
| `staging` | https://staging.careerchangefinder.com | 3101 | password, `noindex`, `SITE_ENV=staging` |
| `main` | https://careerchangefinder.com | 3100 | `SITE_ENV=production`; the `production` environment requires approval |

Each run: `npm ci`, `npm audit`, type check, lint, unit tests → download O*NET and re-check all data →
`next build` → `npm run qa` → on-demand pages and sitemaps checked on a read-only build → release with
`MANIFEST.sha256` → rsync to the VPS → `activate` (checksums, read-only, switch, PM2 restart, health check,
automatic rollback).

**Day to day:** changes go to `staging` first. After they are checked there, `main` is fast-forwarded to
`staging` and the production deploy is approved in GitHub Actions.

## On the VPS

| Path | What |
|---|---|
| `/var/www/careerchangefinder/<env>/releases/<sha>-<run>` | releases (read-only once active; newest 3 kept) |
| `/var/www/careerchangefinder/<env>/current` | symlink to the live release |
| `/var/www/careerchangefinder/<env>/ecosystem.config.cjs` | PM2 app `ccf-staging` / `ccf-production` |
| `/home/ccf/bin/ccf-gate` | forced command for the deploy key: only rsync (rrsync) or `activate` |
| `/home/ccf/bin/ccf-activate` | checksum check, switch, restart, health check, rollback |
| `/home/ccf/bin/ccf-integrity` | hourly cron: live files still match their checksums, no extra files |
| `/etc/nginx/sites-available/careerchangefinder.com`, `…/staging.careerchangefinder.com` | the only Nginx site files we add |
| `/etc/nginx/snippets/ccf-cloudflare-realip.conf` | Cloudflare ranges, so logs show the visitor IP |
| `/etc/ssl/careerchangefinder/origin.{pem,key}` | Cloudflare Origin Certificate |
| `/etc/nginx/.htpasswd-ccf-staging` | staging password |

Everything is created by `deploy/setup-vps.sh` (tested on Ubuntu 24.04 with Nginx 1.24). It never edits
other sites' files; if `nginx -t` fails with our sites, it disables them again.

## Launch steps

Secrets never go into chat or screenshots: private keys, the origin key, passwords.

1. **GitHub branches.** Repo → Settings → General → Default branch: rename `tahap-2-data` to `main`.
   Then the `staging` branch is created from `main`.
2. **GitHub environments.** Settings → Environments:
   - `staging`: Deployment branches = `staging` only.
   - `production`: Deployment branches = `main` only; Required reviewers = you.
3. **Cloudflare.** The domain must use Cloudflare's nameservers.
   - SSL/TLS → Overview: **Full (strict)**. Edge Certificates: Always Use HTTPS on.
   - SSL/TLS → Origin Server → Create Certificate: RSA, hostnames `careerchangefinder.com` and
     `*.careerchangefinder.com`, 15 years. On the VPS, paste the certificate into
     `/etc/ssl/careerchangefinder/origin.pem` and the private key into `/etc/ssl/careerchangefinder/origin.key`
     (`sudo mkdir -p /etc/ssl/careerchangefinder && sudo nano …`).
   - DNS: `A staging → <VPS IP>`, Proxied.
4. **VPS setup.** Upload `ccf-server-setup.tar.gz` (made by `deploy/make-bundle.sh`) to the VPS, then:
   `mkdir ~/ccf-setup && tar -xzf ccf-server-setup.tar.gz -C ~/ccf-setup && cd ~/ccf-setup && sudo bash setup-vps.sh`.
   It asks for a staging username and password. At the end it prints the values for step 5.
5. **GitHub secrets** (both environments, or once at repository level): `VPS_HOST`, `VPS_PORT`, `VPS_USER`,
   `VPS_KNOWN_HOSTS` (printed by the script), and `VPS_SSH_KEY` = the full content of
   `/root/ccf-deploy-key/id_ed25519` (`sudo cat` it on the server and copy it straight into GitHub).
   Then delete it on the server: `sudo rm -r /root/ccf-deploy-key`.
6. **First staging deploy.** Push to `staging`; watch Actions → Deploy. Open https://staging.careerchangefinder.com
   with the staging password and check a few pages.
7. **SSH password login off.** After you have logged in with an SSH key: `sudo bash setup-vps.sh --harden-ssh`,
   keep that session open and test a new key login in a second window.
8. **Production.** Cloudflare DNS: `A @ → <VPS IP>` and `CNAME www → careerchangefinder.com`, both Proxied.
   Fast-forward `main` to `staging`, approve the deployment in Actions, then check https://careerchangefinder.com,
   `/robots.txt` and `/sitemap.xml`.
9. **Google.** Search Console, Analytics and AdSense: `docs/ads-consent.md`. The IDs go in the `production`
   environment as **variables** (not secrets): `GOOGLE_SITE_VERIFICATION`, `GA_MEASUREMENT_ID`,
   `ADSENSE_CLIENT`, then redeploy `main`.

## Roll back by hand

```bash
sudo -u ccf ls -1t /var/www/careerchangefinder/production/releases   # pick an older release id
sudo -u ccf /home/ccf/bin/ccf-activate production <release-id>
```

## Keystatic (optional, later)

The CMS admin stays off on production (Nginx returns 404 for `/keystatic`). To use it, create the GitHub App,
set its three secrets on the server, put `/keystatic` behind Cloudflare Access, and remove the two
`location ^~ … keystatic` blocks from the production Nginx file.
