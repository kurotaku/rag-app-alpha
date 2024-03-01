const path = require('path');
const { i18n } = require('./next-i18next.config');
module.exports = { i18n };

module.exports = {
  env: {
    NEXTAUTH_URL: process.env?.NEXTAUTH_URL || 'http://localhost:3000',
  },
  webpack(config) {
    config.resolve.alias['~'] = path.resolve(__dirname);
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|svg)$/,
      loader: 'url-loader',
      options: {
        limit: 100000,
      },
    });
    return config;
  },
};
