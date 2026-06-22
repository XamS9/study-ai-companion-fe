// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle's generated `migrations.js` imports the raw `.sql` migration files as
// strings, so Metro must treat `.sql` as a source asset. Required for the
// on-device migrator (`drizzle-orm/expo-sqlite/migrator`) to run at boot.
config.resolver.sourceExts.push('sql');

module.exports = config;
