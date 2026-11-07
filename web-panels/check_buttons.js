const fs = require('fs');

function checkFile(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const regex = /(?:onclick|onchange|oninput)="([^"]+)"/g;
  let m;
  const calls = new Set();
  while ((m = regex.exec(content)) !== null) {
    calls.add(m[1]);
  }
  return Array.from(calls);
}

console.log('--- clientApp.js calls: ---');
console.log(checkFile('clientApp.js'));

console.log('\n--- restaurantApp.js calls: ---');
console.log(checkFile('restaurantApp.js'));
