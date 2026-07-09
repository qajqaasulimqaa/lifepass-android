// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js's ESM build lazy-loads @opentelemetry/api through a
// dynamic `import(variable)`, which Hermes cannot compile ("Invalid expression
// encountered") — so release/production bundles (which run hermesc) fail while
// dev bundles (JS served by Metro) don't. Disabling package-exports resolution
// makes Metro resolve supabase (and friends) to their CommonJS `main` build,
// which uses require() and compiles cleanly. Required for EAS preview/production
// builds to succeed.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
