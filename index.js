const fs = require('fs');
const asar = require('asar');

const file = process.argv[2];

console.log(file);

const fileSize = fs.statSync(file).size;

let lastSize;
try {
  lastSize = parseInt(fs.readFileSync(__dirname + '/last_size.txt', 'utf8'));
} catch { }

fs.writeFileSync(__dirname + '/last_size.txt', fileSize.toString());

const { header } = asar.getRawHeader(file);

let files = {};

const goThrough = (f, x) => {
  if (x.files) {
    for (const y in x.files) {
      goThrough((f ? f + '/' : '') + y, x.files[y]);
    }

    return;
  }

  files[f] = x;
};

goThrough('', header);

for (const f in files) {
  files[f] = [ (new TextEncoder().encode(JSON.stringify(files[f]))).length, files[f].size ];
  files[f][2] = files[f][0] + files[f][1];
}
const oldFiles = { ...files };

for (const f in files) {
  const sum = files[f][0] + files[f][1];
  files[f] = (sum / fileSize) * 100;
}

// console.log(Object.keys(files).sort((a, b) => files[b] - files[a]).reduce((acc, x) => { acc[x] = files[x].toFixed(2) + '%'; return acc; }, {}));
for (const f of Object.keys(files).sort((a, b) => files[b] - files[a])) {
  console.log(f, ' '.repeat(30 - f.length), files[f].toFixed(2) + '%', `${files[f] < 10 ? ' ' : ''}| ${(oldFiles[f][2] / 1024).toFixed(2)} kb, ${(oldFiles[f][0] / 1024).toFixed(2)} kb header`);
}

console.log();
console.log('file size:', fileSize / 1024 + ' kb');
console.log('DIFF', `${((fileSize - lastSize) / 1024).toFixed(3)} kb`)