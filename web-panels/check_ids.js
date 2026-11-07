const fs = require('fs');

function checkIds(htmlFile, jsFile) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const js = fs.readFileSync(jsFile, 'utf8');

  const regex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let m;
  const ids = new Set();
  while ((m = regex.exec(js)) !== null) {
    ids.add(m[1]);
  }

  const missing = [];
  for (const id of ids) {
    if (!html.includes('id="' + id + '"') && !html.includes("id='" + id + "'")) {
      missing.push(id);
    }
  }

  return { all: Array.from(ids), missing };
}

console.log('=== CLIENT APP IDS ===');
const clientRes = checkIds('clientApp.js', 'clientFront.js');
console.log('Total IDs queried in clientFront.js:', clientRes.all.length);
console.log('Missing IDs:', clientRes.missing);

console.log('\n=== RESTAURANT APP IDS ===');
const restRes = checkIds('restaurantApp.js', 'restaurantClient.js');
console.log('Total IDs queried in restaurantClient.js:', restRes.all.length);
console.log('Missing IDs:', restRes.missing);
