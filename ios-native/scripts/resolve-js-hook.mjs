// Node module-resolution hook that retries extension-less relative imports
// with ".js" appended, so the web app's Vite-style modules
// (e.g. `import ... from './pronunciation'`) load under plain Node.
// Registered by generate-fixtures.mjs before it imports the src/ modules.

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../');
    if (relative && !specifier.endsWith('.js') && err?.code === 'ERR_MODULE_NOT_FOUND') {
      return nextResolve(`${specifier}.js`, context);
    }
    throw err;
  }
}
