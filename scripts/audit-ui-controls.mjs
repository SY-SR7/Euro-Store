import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const appNames = ['web', 'admin', 'helper', 'partner', 'mobile'];
const nativeTags = new Set(['button', 'input', 'textarea', 'select', 'a']);
const componentTags = new Set(['Link', 'TouchableOpacity', 'Pressable', 'TextInput']);
const modalTags = new Set(['Modal', 'ConfirmDialog']);

function filesUnder(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.expo') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...filesUnder(full));
    else if (/\.(tsx|jsx)$/.test(entry.name)) result.push(full);
  }
  return result;
}

function tagName(node) {
  return node.tagName?.getText() ?? '';
}

function attributes(node) {
  const result = {};
  for (const property of node.attributes.properties) {
    if (!ts.isJsxAttribute(property)) continue;
    const name = property.name.getText();
    if (!property.initializer) result[name] = true;
    else if (ts.isStringLiteral(property.initializer)) result[name] = property.initializer.text;
    else if (ts.isJsxExpression(property.initializer)) result[name] = property.initializer.expression?.getText() ?? '';
  }
  return result;
}

function visibleText(node) {
  if (!ts.isJsxElement(node)) return '';
  const parts = [];
  function collect(child) {
    if (ts.isJsxText(child)) {
      const value = child.getText().replace(/\s+/g, ' ').trim();
      if (value) parts.push(value);
    } else if (ts.isJsxExpression(child) && child.expression) {
      const value = child.expression.getText();
      if (!/^(?:false|null|undefined)$/.test(value)) parts.push(`{${value}}`);
    } else if (ts.isJsxElement(child)) {
      child.children.forEach(collect);
    } else if (ts.isJsxSelfClosingElement(child) && ['img', 'Image'].includes(tagName(child))) {
      const alt = attributes(child).alt;
      if (alt) parts.push(`{${alt}}`);
    }
  }
  node.children.forEach(collect);
  return parts.join(' ').slice(0, 240);
}

function ancestorTag(node, expected) {
  let current = node.parent;
  while (current) {
    if ((ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) && expected.has(tagName(ts.isJsxElement(current) ? current.openingElement : current))) {
      return tagName(ts.isJsxElement(current) ? current.openingElement : current);
    }
    current = current.parent;
  }
  return null;
}

const controls = [];
const issues = [];
for (const app of appNames) {
  const appRoot = path.join(root, 'apps', app);
  for (const file of filesUnder(appRoot)) {
    const sourceText = fs.readFileSync(file, 'utf8');
    const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
      if (opening) {
        const tag = tagName(opening);
        if (nativeTags.has(tag) || componentTags.has(tag) || modalTags.has(tag)) {
          const attrs = attributes(opening);
          const position = source.getLineAndCharacterOfPosition(opening.getStart(source));
          const record = {
            app,
            file: path.relative(root, file).replaceAll('\\', '/'),
            line: position.line + 1,
            tag,
            text: visibleText(node),
            attributes: attrs,
            inForm: Boolean(ancestorTag(opening, new Set(['form']))),
            inModal: Boolean(modalTags.has(tag) || ancestorTag(opening, modalTags)),
          };
          controls.push(record);

          const handler = attrs.onClick || attrs.onPress || attrs.onChange || attrs.onChangeText || attrs.onSubmit;
          if ((tag === 'button' || tag === 'TouchableOpacity' || tag === 'Pressable') && !handler && attrs.type !== 'submit' && !attrs.asChild && !attrs.disabled && !(tag === 'button' && record.inForm)) {
            issues.push({ severity: 'high', rule: 'interactive-without-action', ...record });
          }
          if ((tag === 'a' || tag === 'Link') && !attrs.href) {
            issues.push({ severity: 'high', rule: 'link-without-href', ...record });
          }
          if (typeof attrs.href === 'string' && /^(#|javascript:)/i.test(attrs.href)) {
            issues.push({ severity: 'high', rule: 'unsafe-or-placeholder-href', ...record });
          }
          if (attrs.target === '_blank' && !String(attrs.rel ?? '').match(/noopener|noreferrer/)) {
            issues.push({ severity: 'medium', rule: 'external-link-without-rel', ...record });
          }
          if (tag === 'button' && record.inForm && attrs.type === undefined) {
            issues.push({ severity: 'medium', rule: 'implicit-submit-button', ...record });
          }
          if ((tag === 'button' || tag === 'TouchableOpacity' || tag === 'Pressable') && !record.text && !attrs['aria-label'] && !attrs.accessibilityLabel && !attrs.title) {
            issues.push({ severity: 'medium', rule: 'unlabelled-icon-control', ...record });
          }
          if ((tag === 'a' || tag === 'Link') && !record.text && !attrs['aria-label'] && !attrs.title) {
            issues.push({ severity: 'medium', rule: 'unlabelled-icon-link', ...record });
          }
          if ((tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'TextInput') && !attrs.name && !attrs.id && !attrs['aria-label'] && !attrs.accessibilityLabel && !attrs.placeholder && !ancestorTag(opening, new Set(['label']))) {
            issues.push({ severity: 'low', rule: 'input-without-identifying-attribute', ...record });
          }
          if (handler && /=>\s*\{\s*\}/.test(String(handler))) {
            issues.push({ severity: 'high', rule: 'empty-handler', ...record });
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}

const byApp = Object.fromEntries(appNames.map((app) => {
  const appControls = controls.filter((item) => item.app === app);
  return [app, {
    controls: appControls.length,
    inputs: appControls.filter((item) => ['input', 'textarea', 'select', 'TextInput'].includes(item.tag)).length,
    links: appControls.filter((item) => ['a', 'Link'].includes(item.tag)).length,
    modals: appControls.filter((item) => item.inModal).length,
    issues: issues.filter((item) => item.app === app).length,
  }];
}));

const payload = { generatedAt: new Date().toISOString(), totals: { controls: controls.length, issues: issues.length }, byApp, controls, issues };
const output = process.argv[2] ? path.resolve(root, process.argv[2]) : path.join(root, '_handoff', 'CODEX_UI_CONTROL_INVENTORY_2026-08-28.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, output), ...payload.totals, byApp }, null, 2));
