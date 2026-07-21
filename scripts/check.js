import { readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
function walk(folder) { return readdirSync(folder).flatMap(name => { const path = join(folder, name); return statSync(path).isDirectory() ? walk(path) : [path]; }); }
const files = ['api', 'js'].flatMap(walk).filter(file => file.endsWith('.js'));
for (const file of files) { const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' }); if (result.status) { console.error(result.stderr); process.exit(result.status); } }
const html = readFileSync('dashboard.html', 'utf8');
for (const required of ['js/dashboard.js', 'projectDialog', 'taskDialog', 'profileForm']) if (!html.includes(required)) throw new Error(`dashboard.html no contiene ${required}`);
console.log(`Build verificado: ${files.length} módulos JavaScript y dashboard.html.`);
