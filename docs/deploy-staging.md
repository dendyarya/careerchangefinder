# Staging deploy (Tahap 10A)

`staging.careerchangefinder.com` — password-protected, never indexed. Every push to the `staging`
branch runs `.github/workflows/deploy-staging.yml`:

1. `npm ci`, `npm audit --audit-level=high`, type check, lint, unit tests
2. Download O*NET 31.0 and run `verify.py` + `verify_tests.py` (data vs official sources)
3. `next build` with `SITE_ENV=staging` (noindex everywhere)
4. `npm run qa` (SEO basics on every page, numbers on pages vs data)
5. Assemble the release with `MANIFEST.sha256`, rsync it to the VPS, run `activate`

## On the VPS

| Path | What |
|---|---|
| `/var/www/careerchangefinder/staging/releases/<sha>-<run>` | uploaded releases (read-only after activation; newest 3 kept) |
| `/var/www/careerchangefinder/staging/current` | symlink to the live release |
| `/var/www/careerchangefinder/staging/ecosystem.config.cjs` | PM2 app `ccf-staging`, port 3101 on 127.0.0.1 |
| `/home/ccf/bin/ccf-gate` | forced command for the deploy key: only rsync (via rrsync) or `activate` |
| `/home/ccf/bin/ccf-activate` | checksum check, read-only, switch, PM2 restart, health check, automatic rollback |
| `/home/ccf/bin/ccf-integrity` | hourly cron: live files still match checksums, no extra files |
| `/etc/nginx/sites-available/staging.careerchangefinder.com` | the only Nginx file added |
| `/etc/ssl/careerchangefinder/origin.{pem,key}` | Cloudflare Origin Certificate |
| `/etc/nginx/.htpasswd-ccf-staging` | staging password |

## Roll back by hand

```bash
ls -1t /var/www/careerchangefinder/staging/releases      # pick an older release id
~/bin/ccf-activate staging <release-id>
```

## GitHub secrets used

`VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS` (the server's public host key line, so the
runner refuses to connect to anything else).
