const fs = require('fs');
const path = require('path');

const globalCss = `@tailwind base;
@tailwind utilities;
@tailwind components;

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Manrope:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');

:root {
  /* Brand Gold */
  --color-primary:        #B8860B;
  --color-primary-dark:   #9A7209;
  --color-primary-light:  #D4AF37;
  
  /* Light Backgrounds */
  --color-bg:             #FAF7EF;
  --color-bg-secondary:   #F3EEE3;
  --color-bg-card:        #FFFDF8;
  --color-bg-elevated:    #FFFFFF;
  
  /* Dark text for light theme */
  --color-text-primary:   #1C1917;
  --color-text-secondary: #57534E;
  --color-text-muted:     #A8A29E;
  
  /* Subtle borders */
  --color-border:         #E8DCC3;
  --color-border-accent:  #D7BE79;

  /* Semantic */
  --color-error:          #DC2626;
  --color-success:        #15803D;
  --color-warning:        #F59E0B;
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
::selection    { background: rgba(184,134,11,0.18); }
`;

const apps = ['web', 'admin', 'helper', 'partner'];
for (const app of apps) {
  const cssPath = path.join(process.cwd(), 'apps', app, 'src', 'app', 'globals.css');
  if (fs.existsSync(cssPath)) {
    fs.writeFileSync(cssPath, globalCss);
    console.log('Updated', cssPath);
  }
}
