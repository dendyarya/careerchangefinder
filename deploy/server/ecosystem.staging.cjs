// PM2 app for staging. Installed as /var/www/careerchangefinder/staging/ecosystem.config.cjs
// Keystatic (CMS) secrets live outside the repo and the release, in keystatic.env next to this file
// (written by "setup-vps.sh --keystatic", root:ccf 640). Without that file Keystatic stays off (404).
// eslint-disable-next-line @typescript-eslint/no-require-imports -- PM2 loads this file as plain CommonJS
const fs = require("fs");
const secrets = {};
try {
  for (const line of fs.readFileSync("/var/www/careerchangefinder/staging/keystatic.env", "utf8").split("\n")) {
    const m = line.match(/^(KEYSTATIC_[A-Z_]+)=(.+)$/);
    if (m) secrets[m[1]] = m[2].trim();
  }
} catch {
  // no file: CMS off
}

module.exports = {
  apps: [
    {
      name: "ccf-staging",
      cwd: "/var/www/careerchangefinder/staging/current",
      script: "server.js",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "1G",
      time: true,
      env: { NODE_ENV: "production", PORT: "3101", HOSTNAME: "127.0.0.1", SITE_ENV: "staging", ...secrets },
    },
  ],
};
