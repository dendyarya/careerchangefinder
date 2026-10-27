#!/bin/bash
# Pack the files the VPS needs for the one-time setup (docs/deploy.md, step 4).
set -euo pipefail
cd "$(dirname "$0")"
out=${1:-ccf-server-setup.tar.gz}
tar -czf "$out" --owner=0 --group=0 setup-vps.sh server nginx
sha256sum "$out"
