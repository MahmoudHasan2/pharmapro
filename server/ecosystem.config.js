// PM2 process file. Run with: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'pharmacy-system-api',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '300M',
      autorestart: true,
      watch: false,
    },
  ],
};
