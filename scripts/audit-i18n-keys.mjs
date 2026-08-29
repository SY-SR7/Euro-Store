import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const apps = ['web', 'admin', 'helper', 'partner'];

function filesUnder(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', '.next'].includes(entry.name)) return [];
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(full) : /\.(?:ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

function messagesFor(app, locale) {
  const sharedFile = path.join(root, 'packages', 'shared', 'src', 'messages', `${locale}.json`);
  const shared = JSON.parse(fs.readFileSync(sharedFile, 'utf8'));
  if (!['web', 'admin'].includes(app)) return shared;
  const localFile = path.join(root, 'apps', app, 'src', 'i18n', 'messages', `${locale}.json`);
  const local = JSON.parse(fs.readFileSync(localFile, 'utf8'));
  return mergeTrees(shared, local);
}

function mergeTrees(base, override) {
  const output = { ...base };
  for (const [key, value] of Object.entries(override)) {
    output[key] = value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])
      ? mergeTrees(base[key], value)
      : value;
  }
  return output;
}

function hasPath(object, dottedPath) {
  let value = object;
  for (const segment of dottedPath.split('.')) {
    if (!value || typeof value !== 'object' || !(segment in value)) return false;
    value = value[segment];
  }
  return typeof value === 'string' || typeof value === 'number';
}

const issues = [];
let checked = 0;
for (const app of apps) {
  const ar = messagesFor(app, 'ar');
  const en = messagesFor(app, 'en');
  for (const file of filesUnder(path.join(root, 'apps', app, 'src'))) {
    const sourceText = fs.readFileSync(file, 'utf8');
    const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const translators = new Map();

    function unwrap(expression) {
      return ts.isAwaitExpression(expression) ? expression.expression : expression;
    }

    function discover(node) {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        const initializer = unwrap(node.initializer);
        if (ts.isCallExpression(initializer) && ts.isIdentifier(initializer.expression) && ['useTranslations', 'getTranslations'].includes(initializer.expression.text)) {
          const namespace = initializer.arguments[0];
          translators.set(node.name.text, namespace && ts.isStringLiteralLike(namespace) ? namespace.text : '');
        }
      }
      ts.forEachChild(node, discover);
    }
    discover(source);

    function inspect(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && translators.has(node.expression.text)) {
        const keyArg = node.arguments[0];
        if (keyArg && ts.isStringLiteralLike(keyArg)) {
          const namespace = translators.get(node.expression.text);
          const key = namespace ? `${namespace}.${keyArg.text}` : keyArg.text;
          checked += 1;
          const missing = [];
          if (!hasPath(ar, key)) missing.push('ar');
          if (!hasPath(en, key)) missing.push('en');
          if (missing.length) {
            const position = source.getLineAndCharacterOfPosition(node.getStart(source));
            issues.push({ app, file: path.relative(root, file).replaceAll('\\', '/'), line: position.line + 1, key, missing });
          }
        }
      }
      ts.forEachChild(node, inspect);
    }
    inspect(source);
  }
}

const output = path.join(root, '_handoff', 'CODEX_I18N_KEY_AUDIT_2026-08-28.json');
fs.writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), checked, issues }, null, 2) + '\n');
console.log(JSON.stringify({ output: path.relative(root, output), checked, issues: issues.length }, null, 2));
for (const issue of issues) console.log(`${issue.app} | ${issue.file}:${issue.line} | ${issue.key} | missing ${issue.missing.join(',')}`);
