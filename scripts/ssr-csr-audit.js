/*
  SSR->CSR Prop Audit (heuristic)
  - Scans src/app (TypeScript React files)
  - Finds files that are server components (no "use client" at top)
  - Detects imports from '@/components' and local '../components'
  - Finds JSX usages of those imported components and heuristically flags props whose values look non-serializable (functions, Date, supabase calls, identifiers, 'new' expressions)

  Usage: node scripts/ssr-csr-audit.js
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'app');

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.tsx?$/.test(name)) {
      files.push(full);
    }
  }
  return files;
}

function isClientComponent(contents) {
  // Check first 6 lines for "use client" or 'use client'
  const head = contents.split('\n').slice(0, 6).join('\n');
  return /(['"])use client\1/.test(head);
}

function findComponentImports(contents) {
  const imports = {};
  // match import X from '...'; or import {A,B} from '...';
  const importRe = /import\s+([\s\S]+?)\s+from\s+['"](.+?)['"];?/g;
  let m;
  while ((m = importRe.exec(contents))) {
    const raw = m[1].trim();
    const source = m[2];
  if (source.startsWith('@/components') || /\/components\//.test(source)) {
      // parse raw
      if (raw.startsWith('{')) {
        // named imports
        const names = raw.replace(/[{}]/g, '').split(',').map(s => s.trim().split(' as ')[0]);
        names.forEach(n => imports[n] = source);
      } else if (raw.includes('* as')) {
        // ignore for now
      } else {
        // default import or alias
        const name = raw.split(' as ').pop();
        imports[name] = source;
      }
    }
  }
  return imports;
}

function findJSXUsages(contents, compNames) {
  const results = [];
  // For each component name, search for <Name ... /> or <Name ...> occurrences
  for (const name of compNames) {
    const re = new RegExp(`<${name}\\b([\\s\\S]*?)(?:/>|>)`, 'g');
    let m;
    while ((m = re.exec(contents))) {
      const attrs = m[1];
      results.push({ name, attrs, index: m.index });
    }
  }
  return results;
}

function parseAttrs(attrs) {
  // crude parse: find propName={...} and propName="..." and propName={/* object literal */}
  const propRe = /([a-zA-Z0-9_:$-]+)\s*=\s*({[\s\S]*?}|\"[^\"]*\"|\'[^\']*\')/g;
  const props = [];
  let m;
  while ((m = propRe.exec(attrs))) {
    const name = m[1];
    const raw = m[2].trim();
    props.push({ name, raw });
  }
  return props;
}

function isLikelyNonSerializable(raw) {
  // raw includes surrounding braces or quotes
  if (/^['"]/.test(raw)) return false; // string literal
  if (/^\{\s*\}/.test(raw)) return false; // empty object literal
  if (/^\{\s*\[/.test(raw)) return false; // starts with object containing array -> still literal
  // heuristics: contains '=>' (arrow fn), 'function(', 'new ', 'Date(', 'supabase', 'client', 'window', 'navigator', 'console', '()' or plain identifier
  const inner = raw.replace(/^\{|\}$/g, '').trim();
  if (/=>|function\s*\(|new\s+|Date\(|supabase|window\.|navigator\.|console\.|fetch\(|\bclient\b/.test(inner)) return true;
  // if it's a simple object literal (starts with { and contains ':'), consider serializable
  if (/^\{[\s\S]*:[\s\S]*\}$/.test(raw)) return false;
  // if it's numeric
  if (/^\{?\d+\}?$/.test(raw)) return false;
  // if it's a boolean
  if (/^\{?(true|false)\}?$/.test(raw)) return false;
  // if it's a bare identifier (no quotes and no punctuation), assume non-serializable because value could be anything
  if (/^\{?[A-Za-z0-9_$.]+\}?$/.test(raw)) return true;
  // otherwise, be conservative and not flag
  return false;
}

function run() {
  const files = walk(SRC);
  const report = [];
  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const contents = fs.readFileSync(file, 'utf8');
    const isClient = isClientComponent(contents);
    if (isClient) continue; // skip client components

    const imports = findComponentImports(contents);
    const compNames = Object.keys(imports);
    if (compNames.length === 0) continue;

    const usages = findJSXUsages(contents, compNames);
    for (const u of usages) {
      const props = parseAttrs(u.attrs);
      const suspect = props.filter(p => isLikelyNonSerializable(p.raw));
      if (suspect.length > 0) {
        report.push({ file: rel, component: u.name, props: suspect.map(s => ({ name: s.name, raw: s.raw })) });
      }
    }
  }

  const out = path.join(ROOT, 'tmp', 'ssr-csr-audit-report.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`Audit complete. ${report.length} suspect usages found. Report written to ${out}`);
}

run();
