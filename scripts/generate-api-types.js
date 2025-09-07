import { readFileSync, writeFileSync } from 'fs';

const spec = JSON.parse(readFileSync(new URL('../openapi.json', import.meta.url)));

const generated = new Set();
const lines = ["import { z } from 'zod';", ""]; 

const schemas = spec.components?.schemas || {};

function generateSchema(name) {
  if (generated.has(name)) return;
  const schema = schemas[name];
  const zod = convert(schema);
  lines.push(`export const ${name} = ${zod};`);
  lines.push(`export type ${name} = z.infer<typeof ${name}>;`, '');
  generated.add(name);
}

function convert(schema) {
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    generateSchema(refName);
    return refName;
  }
  switch (schema.type) {
    case 'object': {
      const entries = Object.entries(schema.properties || {}).map(([key, value]) => {
        const required = schema.required?.includes(key);
        const prop = convert(value) + (required ? '' : '.optional()');
        return `${key}: ${prop}`;
      });
      let obj = `z.object({\n${entries.map(e => '  ' + e).join(',\n')}\n})`;
      if (schema.additionalProperties) {
        const addSchema = schema.additionalProperties === true ? 'z.any()' : convert(schema.additionalProperties);
        obj += `.catchall(${addSchema})`;
      }
      return obj;
    }
    case 'array':
      return `z.array(${convert(schema.items)})`;
    case 'string':
      return schema.enum ? `z.enum([${schema.enum.map((v) => `'${v}'`).join(', ')}])` : 'z.string()';
    case 'integer':
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    default:
      return 'z.any()';
  }
}

for (const name of Object.keys(schemas)) {
  generateSchema(name);
}

writeFileSync(new URL('../src/types/api.ts', import.meta.url), lines.join('\n'));
