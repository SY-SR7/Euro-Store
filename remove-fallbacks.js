const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Match t('key', { fallback: 'text' }) or tCommon('key', { fallback: 'text' })
      const regex = /(t|tCommon|tAuth|tNav)\(\s*['"]([^'"]+)['"]\s*,\s*\{\s*fallback\s*:\s*['"]([^'"]+)['"]\s*\}\s*\)/g;
      
      content = content.replace(regex, (match, fn, key, fallback) => {
        changed = true;
        return `${fn}('${key}')`;
      });

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Cleaned fallbacks in: ${fullPath}`);
      }
    }
  }
}

processDir('apps/web/src');
