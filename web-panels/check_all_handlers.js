const fs = require('fs');

function extractCalls(filename) {
  const code = fs.readFileSync(filename, 'utf8');
  const regex = /(?:onclick|onchange|oninput)="([^"]+)"/g;
  let m;
  const calls = [];
  while ((m = regex.exec(code)) !== null) {
    // extract function name
    const match = m[1].match(/^([a-zA-Z0-9_$]+)\s*\(/);
    if (match) {
      calls.push(match[1]);
    }
  }
  return Array.from(new Set(calls));
}

function extractDefinitions(filename) {
  const code = fs.readFileSync(filename, 'utf8');
  const defs = new Set();
  
  // function foo(
  const fnRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
  let m;
  while ((m = fnRegex.exec(code)) !== null) {
    defs.add(m[1]);
  }

  // window.foo =
  const winRegex = /window\.([a-zA-Z0-9_$]+)\s*=/g;
  while ((m = winRegex.exec(code)) !== null) {
    defs.add(m[1]);
  }

  // const/let/var foo =
  const varRegex = /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>)/g;
  while ((m = varRegex.exec(code)) !== null) {
    defs.add(m[1]);
  }

  return defs;
}

console.log('=== CLIENT APP ===');
const clientCalls = extractCalls('clientApp.js');
// Also extract onclick calls inside clientFront.js (generated strings)
const clientFrontCode = fs.readFileSync('clientFront.js', 'utf8');
const regexClientGen = /onclick=\\"([a-zA-Z0-9_$]+)\(/g;
let mg;
while ((mg = regexClientGen.exec(clientFrontCode)) !== null) {
  clientCalls.push(mg[1]);
}
const clientDefs = extractDefinitions('clientFront.js');
console.log('Calls:', clientCalls);
console.log('Missing in clientFront.js:', clientCalls.filter(c => !clientDefs.has(c)));

console.log('\n=== RESTAURANT APP ===');
const restCalls = extractCalls('restaurantApp.js');
const restDefs = extractDefinitions('restaurantClient.js');
console.log('Calls:', restCalls);
console.log('Missing in restaurantClient.js:', restCalls.filter(c => !restDefs.has(c)));
