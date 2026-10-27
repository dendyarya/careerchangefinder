// PM2 app for production. Installed as /var/www/careerchangefinder/production/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "ccf-production",
      cwd: "/var/www/careerchangefinder/production/current",
      script: "server.js",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "1G",
      time: true,
      env: { NODE_ENV: "production", PORT: "3100", HOSTNAME: "127.0.0.1", SITE_ENV: "production" },
    },
  ],
};
