import archiver from 'archiver';
import fs from 'fs';

const output = fs.createWriteStream('my-internet-shop.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`Archive created: ${archive.pointer()} total bytes`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Додаємо файли та папки
archive.file('api.mjs', { name: 'api.mjs' });
archive.file('package.json', { name: 'package.json' });
archive.directory('handlers/', 'handlers/');
archive.directory('node_modules/', 'node_modules/');

// Тимчасові файли
archive.file('temp-scripts/zip.js', { name: 'temp-scripts/zip.js' });
archive.directory('data/', 'data/');
archive.directory('roles/', 'roles/');

// Завершуємо архівацію
archive.finalize();