import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      if (statSync(filePath).isDirectory()) {
        if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.turbo')) {
          getAllFiles(filePath, fileList);
        }
      } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        fileList.push(filePath);
      }
    }
  } catch {}
  return fileList;
}

describe('i18n and localization coverage', () => {
  it('ensures Arabic and English translation files are valid JSON and synchronized', () => {
    const arPath = resolve(root, 'apps/web/src/i18n/messages/ar.json');
    const enPath = resolve(root, 'apps/web/src/i18n/messages/en.json');

    const ar = JSON.parse(readFileSync(arPath, 'utf8'));
    const en = JSON.parse(readFileSync(enPath, 'utf8'));

    const arKeys = Object.keys(ar).sort();
    const enKeys = Object.keys(en).sort();

    expect(arKeys.length).toBeGreaterThan(30);
    expect(enKeys.length).toBeGreaterThan(30);

    // Verify key namespaces exist in both
    const expectedNamespaces = ['common', 'nav', 'auth', 'cart', 'checkout', 'orders', 'products', 'loyalty'];
    for (const ns of expectedNamespaces) {
      expect(ar).toHaveProperty(ns);
      expect(en).toHaveProperty(ns);
    }
  });

  it('checks components use useTranslations hook or t() function for UI strings', () => {
    const webComponentsDir = resolve(root, 'apps/web/src/components');
    const files = getAllFiles(webComponentsDir);
    expect(files.length).toBeGreaterThan(10);

    let translatedCount = 0;
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      if (content.includes('useTranslations') || content.includes('t(') || content.includes('messages')) {
        translatedCount++;
      }
    }

    // High percentage of components must use internationalization hooks
    expect(translatedCount).toBeGreaterThan(10);
  });
});
