module.exports = {
  apps: [{
    name: "catalogo-jonatas",
    script: "node_modules/.bin/next",
    args: "start --port 3000",
    env: {
      NODE_ENV: "production",
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "512M",
  }],
};
