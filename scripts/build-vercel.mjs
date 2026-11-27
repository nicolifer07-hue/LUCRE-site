import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const outputName = '_vercel_site';
const output = join(root, outputName);
const hostname = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
if (!hostname) {
  throw new Error('Set VERCEL_PROJECT_PRODUCTION_URL or VERCEL_URL to the deployment hostname.');
}

const githubPagesUrl = 'https://nicolifer07-hue.github.io/LUCRE-site';
const excluded = new Set(['scripts', 'vercel.json', 'node_modules', outputName]);
const textExtensions = new Set(['.html', '.css', '.js', '.json', '.txt', '.xml', '.svg']);

async function buildDirectory(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || (source === root && excluded.has(entry.name))) continue;
    const input = join(source, entry.name);
    const target = join(destination, entry.name);

    if (entry.isDirectory()) {
      await buildDirectory(input, target);
    } else if (entry.isFile() && textExtensions.has(extname(entry.name))) {
      const content = await readFile(input, 'utf8');
      await writeFile(target, content
        .replaceAll(githubPagesUrl, `https://${hostname}`)
        .replaceAll('/LUCRE-site/', '/'));
    } else if (entry.isFile()) {
      await copyFile(input, target);
    }
  }
}

await rm(output, { recursive: true, force: true });
await buildDirectory(root, output);
