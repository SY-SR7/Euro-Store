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
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('apps/admin/src/app/api');
let changedFiles = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Match return NextResponse.json({ error: 'database_error' }, { status: 500 });
  const regex = /NextResponse\.json\(\{\s*error:\s*'database_error'\s*\}\s*,\s*\{\s*status:\s*(\d+)\s*\}\)/g;
  const newContent = content.replace(regex, (match, status) => {
    return `NextResponse.json({ error: error?.message || 'database_error' }, { status: ${status} })`;
  });
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedFiles++;
  }
});
console.log('Changed files:', changedFiles);
