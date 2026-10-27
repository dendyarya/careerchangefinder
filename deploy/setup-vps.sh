#!/bin/bash
# One-time VPS setup for careerchangefinder.com (docs/deploy.md). Run as root from the unpacked bundle:
#   bash setup-vps.sh                 # app user, folders, Node, PM2, scripts, Nginx sites, deploy key
#   bash setup-vps.sh --harden-ssh    # later, separately: turn off SSH password login
#   bash setup-vps.sh --keystatic     # optional: CMS on staging (asks for the GitHub App keys)
# Tested on Ubuntu 24.04; written for Debian 12/13 and Ubuntu 22.04+ (no sudo needed when run as root).
# Safe to run again. It only creates or changes files that belong to this site:
#   user "ccf", /var/www/careerchangefinder, /etc/ssl/careerchangefinder (checks only),
#   /etc/nginx/sites-{available,enabled}/{careerchangefinder.com,staging.careerchangefinder.com},
#   /etc/nginx/snippets/ccf-cloudflare-realip.conf, /etc/nginx/.htpasswd-ccf-staging,
#   /etc/ssh/sshd_config.d/00-ccf-hardening.conf (only with --harden-ssh).
# Other sites' Nginx files are never edited. If "nginx -t" fails, our two site links are removed again.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
APP=ccf
ROOT=/var/www/careerchangefinder
SSL=/etc/ssl/careerchangefinder
SITES=(careerchangefinder.com staging.careerchangefinder.com)

say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
die() { printf '\n\033[31mSTOP: %s\033[0m\n' "$*" >&2; exit 1; }
[ "$(id -u)" = 0 ] || die "run as root (or with sudo)"
command -v apt-get >/dev/null || die "this script expects Ubuntu or Debian"

# ---------------------------------------------------------------- SSH hardening (separate step)
if [ "${1:-}" = "--harden-ssh" ]; then
  say "Turn off SSH password login"
  admin="${SUDO_USER:-root}"
  home=$(getent passwd "$admin" | cut -d: -f6)
  [ -s "$home/.ssh/authorized_keys" ] || die "$admin has no SSH key in $home/.ssh/authorized_keys. Add your key and test a key login first."
  echo "Before continuing, make sure you are logged in RIGHT NOW with an SSH key (not a password),"
  echo "and keep this session open until you have tested a new key login in a second window."
  read -r -p "Type YES to turn off password login: " ok
  [ "$ok" = "YES" ] || die "cancelled"
  cat > /etc/ssh/sshd_config.d/00-ccf-hardening.conf <<'CONF'
# careerchangefinder.com launch checklist: key-only SSH
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
CONF
  grep -qE '^\s*Include\s+/etc/ssh/sshd_config.d/\*\.conf' /etc/ssh/sshd_config \
    || die "sshd_config does not include sshd_config.d; add the three lines above to /etc/ssh/sshd_config by hand"
  if sshd -t; then
    systemctl reload ssh 2>/dev/null || systemctl reload sshd
    # sshd keeps the FIRST value it reads, so our file is named 00-… to win over e.g. 50-cloud-init.conf
    sshd -T | grep -E '^(passwordauthentication|kbdinteractiveauthentication|permitrootlogin) '
    sshd -T 2>/dev/null | grep '^passwordauthentication no' >/dev/null \
      || die "password login is still on: another setting in /etc/ssh/sshd_config comes before the Include line"
    echo "Done. Test a NEW key login in a second window before closing this one."
  else
    rm -f /etc/ssh/sshd_config.d/00-ccf-hardening.conf
    die "sshd config test failed; nothing changed"
  fi
  exit 0
fi

# ---------------------------------------------------------------- Keystatic on staging (separate step)
if [ "${1:-}" = "--keystatic" ]; then
  say "Keystatic CMS on staging: GitHub App keys"
  install -o "$APP" -g "$APP" -m 644 "$HERE/server/ecosystem.staging.cjs" "$ROOT/staging/ecosystem.config.cjs"
  read -r -p "GitHub App Client ID: " cid
  read -r -s -p "GitHub App Client secret (hidden): " csec; echo
  [[ "$cid" =~ ^[A-Za-z0-9.]{10,40}$ ]] || die "that does not look like a Client ID"
  [ ${#csec} -ge 30 ] || die "that does not look like a client secret"
  f="$ROOT/staging/keystatic.env"
  umask 077
  {
    echo "KEYSTATIC_GITHUB_CLIENT_ID=$cid"
    echo "KEYSTATIC_GITHUB_CLIENT_SECRET=$csec"
    echo "KEYSTATIC_SECRET=$(openssl rand -hex 32)"
  } > "$f"
  chown root:"$APP" "$f" && chmod 640 "$f"
  runuser -l "$APP" -c '. ~/.nvm/nvm.sh >/dev/null; pm2 delete ccf-staging >/dev/null 2>&1; pm2 start /var/www/careerchangefinder/staging/ecosystem.config.cjs >/dev/null && pm2 save >/dev/null'
  sleep 3
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3101/api/keystatic/github/login || true)
  echo "Keys saved in $f (root:$APP 640) and staging restarted. CMS login route answers: $code (302 = on, 404 = off)."
  exit 0
fi

# ---------------------------------------------------------------- 1. packages
say "1/9 Packages (rsync, curl, python3, cron)"
missing=()
for p in rsync curl python3 cron; do command -v "$p" >/dev/null || missing+=("$p"); done
command -v nginx >/dev/null || die "Nginx is not installed (the other sites should already use it)"
if [ ${#missing[@]} -gt 0 ]; then apt-get update -qq && apt-get install -y -qq "${missing[@]}"; fi
if ! command -v rrsync >/dev/null; then
  src=$(ls /usr/share/doc/rsync/scripts/rrsync* 2>/dev/null | head -1 || true)
  [ -n "$src" ] || die "rrsync not found (comes with rsync). Install a newer rsync or copy rrsync to /usr/bin."
  case "$src" in *.gz) gunzip -c "$src" > /usr/bin/rrsync ;; *) cp "$src" /usr/bin/rrsync ;; esac
  chmod 755 /usr/bin/rrsync
fi
echo "ok"

# ---------------------------------------------------------------- 2. app user and folders
say "2/9 User '$APP' and folders"
id "$APP" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$APP"
passwd -l "$APP" >/dev/null   # no password login for this user, ever
for env in staging production; do
  install -d -o "$APP" -g "$APP" -m 750 "$ROOT/$env" "$ROOT/$env/releases" "$ROOT/$env/cache"
done
chown "$APP:$APP" "$ROOT" && chmod 750 "$ROOT"
echo "ok"

# ---------------------------------------------------------------- 3. Node 22 and PM2 for the app user
say "3/9 Node.js 22 and PM2 (for user $APP only)"
runuser -l "$APP" -c '
  set -e
  export NVM_DIR="$HOME/.nvm"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | PROFILE=/dev/null bash >/dev/null
  fi
  . "$NVM_DIR/nvm.sh"
  nvm install 22 >/dev/null
  nvm alias default 22 >/dev/null
  command -v pm2 >/dev/null || npm install -g pm2@6 >/dev/null
  node -v; pm2 -v
'
NODE_BIN=$(runuser -l "$APP" -c '. ~/.nvm/nvm.sh >/dev/null; dirname "$(command -v node)"')
PM2_BIN=$(runuser -l "$APP" -c '. ~/.nvm/nvm.sh >/dev/null; command -v pm2')
env PATH="$PATH:$NODE_BIN" "$PM2_BIN" startup systemd -u "$APP" --hp "/home/$APP" >/dev/null
echo "PM2 starts with the server (service pm2-$APP)"

# ---------------------------------------------------------------- 4. deploy scripts and PM2 configs
say "4/9 Deploy scripts"
install -d -o "$APP" -g "$APP" -m 755 "/home/$APP/bin"
for f in ccf-gate ccf-activate ccf-integrity; do
  install -o root -g root -m 755 "$HERE/server/$f" "/home/$APP/bin/$f"
done
install -o "$APP" -g "$APP" -m 644 "$HERE/server/ecosystem.staging.cjs" "$ROOT/staging/ecosystem.config.cjs"
install -o "$APP" -g "$APP" -m 644 "$HERE/server/ecosystem.production.cjs" "$ROOT/production/ecosystem.config.cjs"
{ crontab -u "$APP" -l 2>/dev/null | grep -v ccf-integrity || true; echo "17 * * * * /home/$APP/bin/ccf-integrity"; } | crontab -u "$APP" -
echo "ok (scripts are owned by root, so the deploy key cannot change them)"

# ---------------------------------------------------------------- 5. deploy key (GitHub Actions)
say "5/9 Deploy key for GitHub Actions"
KEYDIR=/root/ccf-deploy-key
AUTH="/home/$APP/.ssh/authorized_keys"
install -d -o "$APP" -g "$APP" -m 700 "/home/$APP/.ssh"
if ! grep -q "ccf-github-deploy" "$AUTH" 2>/dev/null; then
  install -d -m 700 "$KEYDIR"
  [ -f "$KEYDIR/id_ed25519" ] || ssh-keygen -q -t ed25519 -N "" -C "ccf-github-deploy" -f "$KEYDIR/id_ed25519"
  echo "command=\"/home/$APP/bin/ccf-gate\",restrict $(cat "$KEYDIR/id_ed25519.pub")" >> "$AUTH"
  chown "$APP:$APP" "$AUTH" && chmod 600 "$AUTH"
  echo "New deploy key created. Its PRIVATE half is in $KEYDIR/id_ed25519 (see docs/deploy.md, step 5)."
else
  echo "deploy key already installed"
fi

# ---------------------------------------------------------------- 6. Cloudflare Origin Certificate
say "6/9 Cloudflare Origin Certificate"
install -d -m 755 "$SSL"
if [ -s "$SSL/origin.pem" ] && [ -s "$SSL/origin.key" ]; then
  chmod 644 "$SSL/origin.pem"; chmod 600 "$SSL/origin.key"
  openssl x509 -in "$SSL/origin.pem" -noout -subject -enddate || die "origin.pem is not a valid certificate"
  CERT_OK=1
else
  echo "Not found yet: $SSL/origin.pem and $SSL/origin.key (docs/deploy.md, step 3)."
  echo "Run this script again after adding them; Nginx sites are only enabled with a certificate."
  CERT_OK=0
fi

# ---------------------------------------------------------------- 7. Cloudflare visitor IPs for our logs
say "7/9 Cloudflare IP ranges (real visitor IP in our logs)"
tmp=$(mktemp)
{
  echo "# written by setup-vps.sh $(date -u +%F) from cloudflare.com/ips-v4 and ips-v6"
  for v in 4 6; do curl -fsS "https://www.cloudflare.com/ips-v$v" | sed -E 's/^(.+)$/set_real_ip_from \1;/'; echo; done
  echo "real_ip_header CF-Connecting-IP;"
} | grep -v '^$' > "$tmp"
grep -q set_real_ip_from "$tmp" || die "could not download the Cloudflare IP list"
install -m 644 "$tmp" /etc/nginx/snippets/ccf-cloudflare-realip.conf && rm -f "$tmp"
echo "ok"

# ---------------------------------------------------------------- 8. staging password
say "8/9 Staging password"
if [ ! -s /etc/nginx/.htpasswd-ccf-staging ]; then
  read -r -p "Staging username: " su
  hash=$(openssl passwd -apr1) || die "no password set"
  echo "$su:$hash" > /etc/nginx/.htpasswd-ccf-staging
  chown root:www-data /etc/nginx/.htpasswd-ccf-staging 2>/dev/null || true
  chmod 640 /etc/nginx/.htpasswd-ccf-staging
fi
echo "ok"

# ---------------------------------------------------------------- 9. Nginx sites
say "9/9 Nginx sites (only our two files)"
if [ "$CERT_OK" != 1 ]; then
  echo "skipped until the certificate is in place"
else
  ver=$(nginx -v 2>&1 | sed -E 's/.*nginx\/([0-9.]+).*/\1/')
  for s in "${SITES[@]}"; do
    conf="$HERE/nginx/$s.conf"
    if [ ! -s /proc/net/if_inet6 ]; then
      # no IPv6 on this server: drop the [::] listen lines
      sed -E '/listen \[::\]/d' "$conf" > "/tmp/ccf-$s.conf" && conf="/tmp/ccf-$s.conf"
    fi
    if [ "$(printf '%s\n1.25.1\n' "$ver" | sort -V | head -1)" != "1.25.1" ]; then
      # Nginx older than 1.25.1: "http2 on;" does not exist yet
      sed -E -e '/^\s*http2 on;/d' -e 's/listen (\[::\]:)?443 ssl;/listen \1443 ssl http2;/' "$conf" > "/etc/nginx/sites-available/$s"
    else
      install -m 644 "$conf" "/etc/nginx/sites-available/$s"
    fi
    ln -sfn "/etc/nginx/sites-available/$s" "/etc/nginx/sites-enabled/$s"
  done
  if nginx -t; then
    systemctl reload nginx && echo "Nginx reloaded"
  else
    for s in "${SITES[@]}"; do rm -f "/etc/nginx/sites-enabled/$s"; done
    nginx -t && systemctl reload nginx
    die "Nginx test failed with our sites; they were disabled again, other sites unchanged"
  fi
fi

say "Done"
port=$(sshd -T 2>/dev/null | awk '/^port /{print $2; exit}')
echo "GitHub secrets (docs/deploy.md, step 5):"
echo "  VPS_PORT        = ${port:-22}"
echo "  VPS_USER        = $APP"
echo "  VPS_HOST        = this server's public IP"
echo "  VPS_KNOWN_HOSTS = the line below, with <IP> replaced by that IP:"
key=$(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)
if [ "${port:-22}" = 22 ]; then echo "    <IP> $key"; else echo "    [<IP>]:$port $key"; fi
echo "  VPS_SSH_KEY     = contents of /root/ccf-deploy-key/id_ed25519 (copy it into GitHub, never into chat), then delete that file"
