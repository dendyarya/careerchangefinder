// PM2 app for staging. Installed as /var/www/careerchangefinder/staging/ecosystem.config.cjs
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
      env: { NODE_ENV: "production", PORT: "3101", HOSTNAME: "127.0.0.1", SITE_ENV: "staging" },
    },
  ],
};
