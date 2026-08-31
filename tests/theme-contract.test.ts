import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

const canonicalTokens = [
  '--color-primary:        #B8860B',
  '--color-primary-dark:   #9A7209',
  '--color-primary-light:  #D4AF37',
  '--color-bg:             #FAF7EF',
  '--color-bg-secondary:   #F3EEE3',
  '--color-bg-card:        #FFFDF8',
  '--color-bg-elevated:    #FFFFFF',
  '--color-text-primary:   #1C1917',
  '--color-text-secondary: #57534E',
  '--color-text-muted:     #A8A29E',
  '--color-border:         #E8DCC3',
  '--color-border-accent:  #D7BE79',
];

describe('canonical light visual identity', () => {
  it.each(['web', 'admin', 'helper', 'partner'])('%s app exposes the exact shared light tokens', (app) => {
    const css = read(`apps/${app}/src/app/globals.css`);
    expect(css).toContain('color-scheme: light');
    for (const token of canonicalTokens) expect(css).toContain(token);
    expect(css).not.toContain('[data-theme="dark"]');
  });

  it('keeps native mobile light-only with no persisted theme model', () => {
    const preferences = read('apps/mobile/contexts/PreferencesContext.tsx');
    const tailwind = read('apps/mobile/tailwind.config.js');
    const appConfig = JSON.parse(read('apps/mobile/app.json')) as {
      expo: { userInterfaceStyle?: string; splash?: { backgroundColor?: string } };
    };

    expect(preferences).toContain("'--color-background': '250 247 239'");
    expect(preferences).not.toMatch(/ThemePreference|resolvedTheme|setTheme|colorThemes|eurostore_theme/);
    expect(tailwind).not.toContain('darkMode');
    expect(appConfig.expo.userInterfaceStyle).toBe('light');
    expect(appConfig.expo.splash?.backgroundColor).toBe('#FAF7EF');
  });

  it('keeps shared primitives on semantic light tokens', () => {
    const shared = [
      read('packages/ui/src/components/Button.tsx'),
      read('packages/ui/src/components/Input.tsx'),
      read('packages/ui/src/components/Toast.tsx'),
    ].join('\n');

    expect(shared).toContain('bg-background-elevated');
    expect(shared).toContain('text-text-primary');
    expect(shared).not.toMatch(/#C9A84C|#A67C2E|#E8D28A|#0F0F0F|#121414|#1A1A1A/);
    expect(read('packages/ui/src/components/Toast.tsx')).toContain('theme="light"');
  });

  it('declares the current design contract as light-only in handoff sources', () => {
    const design = read('_handoff/DESIGN.md');
    const rules = read('_handoff/CODEX_LOCAL_RULES.md');
    const strategy = read('_handoff/PROJECT_STRATEGY.md');

    expect(design).toContain('Light only');
    expect(design).toContain("background: '#FAF7EF'");
    expect(rules).toContain('جميع التطبيقات تستخدم هوية فاتحة ثابتة');
    expect(strategy).toContain('Dark mode, system theme resolution, black page surfaces');
    expect(strategy).not.toContain('Dark mode primary');
  });

  it('uses light install chrome for web and native manifests', () => {
    const manifest = JSON.parse(read('apps/web/public/manifest.json')) as {
      background_color?: string;
      theme_color?: string;
    };
    expect(manifest.background_color).toBe('#FAF7EF');
    expect(manifest.theme_color).toBe('#FFFDF8');
  });
});
