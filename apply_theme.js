const fs = require('fs');
const path = require('path');

const tailwindConfig = `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
        },
        background: {
          DEFAULT: 'var(--color-bg)',
          secondary: 'var(--color-bg-secondary)',
          card: 'var(--color-bg-card)',
          elevated: 'var(--color-bg-elevated)',
        },
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        border: {
          DEFAULT: 'var(--color-border)',
          accent: 'var(--color-border-accent)',
        }
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
`;

const globalCss = `@tailwind base;
@tailwind utilities;
@tailwind components;

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Manrope:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');

:root {
  --color-primary:        #C9A84C;
  --color-primary-dark:   #A67C2E;
  --color-primary-light:  #E8D28A;
  
  --color-bg:             #121414;
  --color-bg-secondary:   #1A1C1C;
  --color-bg-card:        #1E2020;
  --color-bg-elevated:    #242424;
  
  --color-text-primary:   #E2E2E2;
  --color-text-secondary: #9CA3AF;
  --color-text-muted:     #6B7280;
  
  --color-border:         #2E2E2E;
  --color-border-accent:  #4D4637;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: 'Manrope', 'Noto Naskh Arabic', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
[dir="rtl"] body { font-family: 'Noto Naskh Arabic', 'Manrope', system-ui, sans-serif; }

.font-headline { font-family: 'Playfair Display', 'Noto Naskh Arabic', Georgia, serif; }

::-webkit-scrollbar       { width: 5px; }
::-webkit-scrollbar-track { background: var(--color-bg); }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-primary); }

:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
::selection    { background: rgba(201,168,76,0.2); }
`;

const apps = ['web', 'admin', 'helper', 'partner'];
for (const app of apps) {
  const tailwindPath = path.join(process.cwd(), 'apps', app, 'tailwind.config.ts');
  const cssPath = path.join(process.cwd(), 'apps', app, 'src', 'app', 'globals.css');
  
  if (fs.existsSync(tailwindPath)) {
    fs.writeFileSync(tailwindPath, tailwindConfig);
    console.log('Updated', tailwindPath);
  }
  if (fs.existsSync(cssPath)) {
    fs.writeFileSync(cssPath, globalCss);
    console.log('Updated', cssPath);
  }
}
