// Hashes every file in app/ and writes app/sw.js with the precache manifest and a new version.
// Run this after any change to app/, then publish the app/ folder.
import {readdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join, dirname, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'app');
const SKIP = new Set(['sw.js', '.nojekyll']);

async function walk(dir){
  const out = [];
  for (const e of await readdir(dir, {withFileTypes: true})){
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

const manifest = {};
const all = createHash('sha256');
for (const file of (await walk(app)).sort()){
  const path = relative(app, file).split(sep).join('/');
  if (SKIP.has(path) || path.startsWith('vendor/licenses/')) continue;
  const hash = createHash('sha256').update(await readFile(file)).digest('hex').slice(0, 12);
  manifest[path] = hash;
  all.update(path + hash);
}
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const version = `${pkg.version}-${all.digest('hex').slice(0, 7)}`;
const tpl = await readFile(join(root, 'tools', 'sw.template.js'), 'utf8');
await writeFile(join(app, 'sw.js'), tpl.replace('__VERSION__', version).replace('__MANIFEST__', JSON.stringify(manifest, null, 0)));
await writeFile(join(app, '.nojekyll'), '');
console.log(`build: ${Object.keys(manifest).length} files, version ${version}`);
