const fs = require('node:fs');
const content = fs.readFileSync('biome_nocolor.txt', 'utf8');
const counts = {};
const regex = /lint\/([a-z]+\/[a-zA-Z]+)/g;
let match = regex.exec(content);
while (match !== null) {
  counts[match[1]] = (counts[match[1]] || 0) + 1;
  match = regex.exec(content);
}
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
const summary = sorted.map(([name, count]) => `${count} ${name}`).join('\n');
console.log(summary);
fs.writeFileSync('biome_rules_nocolor.txt', summary);
