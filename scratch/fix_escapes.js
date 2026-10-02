import fs from 'fs';

const filesToFix = [
  'src/app/(admin)/marketing/page.js',
  'src/app/(admin)/inventory/page.js',
  'src/app/(customer)/store/page.js'
];

for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace \` with `
    content = content.replace(/\\`/g, '`');
    // Replace \$ with $
    content = content.replace(/\\\$/g, '$');
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}
