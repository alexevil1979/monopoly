/**
 * PM2 ecosystem — Monopoly Online.
 * Usage: pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: 'monopoly-online',
      script: 'src/index.js',
      cwd: __dirname,
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '400M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
