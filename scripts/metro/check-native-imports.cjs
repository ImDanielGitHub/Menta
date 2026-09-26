/* eslint-disable @typescript-eslint/no-require-imports -- Shared with Metro's CommonJS configuration. */
const path = require('node:path');
const { parse } = require('@babel/parser');

function getGuardedRequires(module) {
  const result = new Map();
  let ast;
  try {
    ast = parse(module.getSource().toString(), {
      sourceType: 'unambiguous',
      plugins: [/\.tsx?$/.test(module.path) ? 'typescript' : 'flow', 'jsx'],
    });
  } catch {
    // Do not exempt an unresolved import when its fallback cannot be verified.
    return result;
  }

  const visit = (node, guarded = false) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(child => visit(child, guarded));
      return;
    }
    if (node.type === 'TryStatement') {
      visit(node.block, guarded || Boolean(node.handler));
      visit(node.handler, guarded);
      visit(node.finalizer, guarded);
      return;
    }
    // A surrounding try block cannot catch a function invoked later.
    if (/Function|Method/.test(node.type ?? '')) guarded = false;
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      node.callee.name === 'require' &&
      node.arguments[0]?.type === 'StringLiteral'
    ) {
      const name = node.arguments[0].value;
      result.set(name, (result.get(name) ?? true) && guarded);
    }
    for (const [key, value] of Object.entries(node)) {
      if (key !== 'loc' && value && typeof value === 'object') {
        visit(value, guarded);
      }
    }
  };
  visit(ast);
  return result;
}

/**
 * Optional imports can become null dependency IDs in a successful Metro build.
 * Expo's native async import helper may throw before a package's Promise catch
 * runs, so those imports must not be shipped even if the dependency is optional.
 */
function checkNativeImports(graph, projectRoot) {
  const { dev, platform } = graph.transformOptions;
  if (dev || (platform !== 'ios' && platform !== 'android')) return;

  const unresolved = [];
  for (const module of graph.dependencies.values()) {
    let guardedRequires;
    for (const dependency of module.dependencies.values()) {
      if (dependency.absolutePath) continue;
      const { isOptional, asyncType } = dependency.data.data;
      // A direct synchronous require in try/catch throws inside that catch.
      // Dynamic import is different: its promise may never be returned, so a
      // subsequent .catch cannot protect module initialisation on native.
      if (isOptional === true && asyncType === null) {
        guardedRequires ??= getGuardedRequires(module);
        if (guardedRequires.get(dependency.data.name) === true) continue;
      }
      const source = path.relative(projectRoot, module.path);
      unresolved.push(`${source}: ${dependency.data.name}`);
    }
  }

  if (unresolved.length) {
    throw new Error(
      `Cannot ship ${platform} bundle with unresolved imports:\n` +
        unresolved.map(detail => `  - ${detail}`).join('\n') +
        '\nUse a native-compatible dependency or remove the import. ' +
        'Optional imports can still cause a fatal error on device.'
    );
  }
}

module.exports = { checkNativeImports };
