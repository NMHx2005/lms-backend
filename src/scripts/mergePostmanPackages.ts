import fs from 'fs';
import path from 'path';

type PostmanCollection = {
  info?: any;
  item?: any[];
  variable?: any[];
};

function loadJson(filePath: string): PostmanCollection {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function saveJson(filePath: string, data: PostmanCollection) {
  const formatted = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, formatted, 'utf8');
}

function mergeVariables(base: any[] = [], extra: any[] = []) {
  const map = new Map<string, any>();
  for (const v of base) map.set(v.key, v);
  for (const v of extra) if (!map.has(v.key)) map.set(v.key, v);
  return Array.from(map.values());
}

function main() {
  const root = path.resolve(__dirname, '../../');
  const targetPath = path.join(root, 'LMS_API_Collection.json');
  const extraPath = path.join(root, 'LMS_API_Collection_Packages.json');

  if (!fs.existsSync(targetPath)) throw new Error('LMS_API_Collection.json not found');
  if (!fs.existsSync(extraPath)) throw new Error('LMS_API_Collection_Packages.json not found');

  const target = loadJson(targetPath);
  const extra = loadJson(extraPath);

  if (!Array.isArray(target.item)) target.item = [];
  if (!Array.isArray(extra.item)) extra.item = [];

  // Append extra item groups to root items
  // Avoid duplicates by name if already present
  const existingNames = new Set<string>(target.item.map((it: any) => it?.name).filter(Boolean));
  for (const it of extra.item) {
    const name = it?.name;
    if (name && existingNames.has(name)) {
      // If group with same name exists, append its children into that group
      const targetGroup = target.item.find((g: any) => g?.name === name);
      if (targetGroup) {
        if (!Array.isArray(targetGroup.item)) targetGroup.item = [];
        if (Array.isArray(it.item)) targetGroup.item.push(...it.item);
      }
    } else {
      target.item.push(it);
    }
  }

  // Merge variables (non-overwriting existing keys)
  target.variable = mergeVariables(target.variable, extra.variable);

  saveJson(targetPath, target);
  console.log('Merged packages collection into LMS_API_Collection.json');
}

main();


