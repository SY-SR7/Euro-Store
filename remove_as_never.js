const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('apps/admin/src');
let changedFiles = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Match `as never` in the context of Supabase calls
  const newContent = content.replace(/\s*as\s+never/g, '');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedFiles++;
  }
});
console.log('Removed `as never` from files:', changedFiles);
