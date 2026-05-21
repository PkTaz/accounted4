const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Avoid Hermes / Metro issues with Supabase package exports
config.resolver.unstable_enablePackageExports = false;

const supabasePackages = ['@supabase/supabase-js', '@supabase/auth-js', '@supabase/postgrest-js'];

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (supabasePackages.some((pkg) => moduleName === pkg || moduleName.startsWith(`${pkg}/`))) {
    const resolved = require.resolve('@supabase/supabase-js/dist/index.cjs');
    if (moduleName === '@supabase/supabase-js') {
      return { type: 'sourceFile', filePath: resolved };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
