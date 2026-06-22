module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Drizzle's generated `migrations.js` imports the raw `.sql` files. This
    // plugin inlines their contents as strings at build time; without it Metro
    // (which treats `.sql` as a source ext, see metro.config.js) hands the SQL
    // to Babel as JavaScript and parsing fails with "Missing semicolon".
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
