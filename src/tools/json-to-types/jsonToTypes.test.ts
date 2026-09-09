import { describe, it, expect } from 'vitest';
import { infer, convert } from './jsonToTypes';

describe('infer', () => {
  it('reads primitive kinds off a flat object', () => {
    expect(infer({ id: 1, name: 'Ada', active: true, note: null })).toEqual({
      kind: 'object',
      fields: [
        { key: 'id', value: { kind: 'number', integer: true }, optional: false },
        { key: 'name', value: { kind: 'string', literals: ['Ada'] }, optional: false },
        { key: 'active', value: { kind: 'boolean' }, optional: false },
        { key: 'note', value: { kind: 'null' }, optional: false },
      ],
    });
  });

  it('separates integers from fractional numbers', () => {
    expect(infer(7)).toEqual({ kind: 'number', integer: true });
    expect(infer(7.5)).toEqual({ kind: 'number' });
    expect(infer([1, 2, 3])).toEqual({ kind: 'array', items: { kind: 'number', integer: true } });
    expect(infer([1, 2.5])).toEqual({ kind: 'array', items: { kind: 'number' } });
  });

  it('marks a key missing from some array elements as optional', () => {
    expect(infer([{ id: 1, email: 'a@b.com' }, { id: 2 }])).toEqual({
      kind: 'array',
      items: {
        kind: 'object',
        fields: [
          { key: 'id', value: { kind: 'number', integer: true }, optional: false },
          { key: 'email', value: { kind: 'string', format: 'email' }, optional: true },
        ],
      },
    });
  });

  it('unions mixed element types', () => {
    expect(infer([1, true])).toEqual({
      kind: 'array',
      items: { kind: 'union', options: [{ kind: 'number', integer: true }, { kind: 'boolean' }] },
    });
  });

  it('an empty array has unknown items', () => {
    expect(infer([])).toEqual({ kind: 'array', items: { kind: 'unknown' } });
  });

  it('unknown items collapse once a real element appears', () => {
    expect(infer([[], [1]])).toEqual({
      kind: 'array',
      items: { kind: 'array', items: { kind: 'number', integer: true } },
    });
  });

  it('detects string formats', () => {
    expect(infer('a@b.com')).toEqual({ kind: 'string', format: 'email' });
    expect(infer('9f1b8c2e-1a2b-4c3d-8e4f-5a6b7c8d9e0f')).toEqual({
      kind: 'string',
      format: 'uuid',
    });
    expect(infer('https://bundle.tools/x')).toEqual({ kind: 'string', format: 'url' });
    expect(infer('2024-01-15')).toEqual({ kind: 'string', format: 'date' });
    expect(infer('2024-01-02T10:30:00Z')).toEqual({ kind: 'string', format: 'date-time' });
  });

  it('does not treat an impossible calendar date as a date', () => {
    expect(infer('2024-02-30')).toEqual({ kind: 'string', literals: ['2024-02-30'] });
    expect(infer('2024-13-01')).toEqual({ kind: 'string', literals: ['2024-13-01'] });
  });

  it('drops the format when one sample does not match', () => {
    expect(infer(['a@b.com', 'not-an-email'])).toEqual({
      kind: 'array',
      items: { kind: 'string' },
    });
  });

  it('collects repeated string values into an enum', () => {
    expect(infer(['active', 'inactive', 'active'])).toEqual({
      kind: 'array',
      items: { kind: 'string', literals: ['active', 'inactive'] },
    });
  });

  it('falls back to plain string past the literal cap or length limit', () => {
    const many = Array.from({ length: 13 }, (_, i) => `v${i}`);
    expect(infer(many)).toEqual({ kind: 'array', items: { kind: 'string' } });
    expect(infer('x'.repeat(41))).toEqual({ kind: 'string' });
  });

  it('splits objects with no keys in common into a union', () => {
    expect(infer([{ ok: true }, { err: false }])).toEqual({
      kind: 'array',
      items: {
        kind: 'union',
        options: [
          { kind: 'object', fields: [{ key: 'ok', value: { kind: 'boolean' }, optional: false }] },
          { kind: 'object', fields: [{ key: 'err', value: { kind: 'boolean' }, optional: false }] },
        ],
      },
    });
  });

  it('keeps a format that holds across every sample, drops one that does not', () => {
    expect(infer(['a@b.com', 'c@d.com'])).toEqual({
      kind: 'array',
      items: { kind: 'string', format: 'email' },
    });
    expect(infer(['a@b.com', 'https://x.co/y'])).toEqual({
      kind: 'array',
      items: { kind: 'string' },
    });
  });

  it('folds three distinct element types into one union', () => {
    expect(infer([1, true, null])).toEqual({
      kind: 'array',
      items: {
        kind: 'union',
        options: [{ kind: 'number', integer: true }, { kind: 'boolean' }, { kind: 'null' }],
      },
    });
  });

  it('keeps a key optional once any element has omitted it', () => {
    const node = infer([{ a: 1, b: 2 }, { a: 1 }, { a: 1, b: 2 }]);
    expect(node).toEqual({
      kind: 'array',
      items: {
        kind: 'object',
        fields: [
          { key: 'a', value: { kind: 'number', integer: true }, optional: false },
          { key: 'b', value: { kind: 'number', integer: true }, optional: true },
        ],
      },
    });
  });

  it('unions a nullable field across elements', () => {
    expect(infer([{ x: 1 }, { x: null }])).toEqual({
      kind: 'array',
      items: {
        kind: 'object',
        fields: [
          {
            key: 'x',
            value: {
              kind: 'union',
              options: [{ kind: 'number', integer: true }, { kind: 'null' }],
            },
            optional: false,
          },
        ],
      },
    });
  });
});

describe('convert - typescript', () => {
  it('emits a named interface for a flat object', () => {
    expect(convert('{"id":42,"name":"Ada","active":true}', 'typescript')).toBe(
      'export interface Root {\n  id: number;\n  name: "Ada";\n  active: boolean;\n}',
    );
  });

  it('names nested objects and arrays of objects', () => {
    expect(convert('{"users":[{"id":1}]}', 'typescript')).toBe(
      'export interface Root {\n  users: User[];\n}\n\nexport interface User {\n  id: number;\n}',
    );
  });

  it('emits a type alias when the root is not an object', () => {
    expect(convert('[1,2,3]', 'typescript')).toBe('export type Root = number[];');
  });

  it('emits an alias plus item interface for an array of objects at the root', () => {
    expect(convert('[{"a":1}]', 'typescript')).toBe(
      'export interface RootItem {\n  a: number;\n}\n\nexport type Root = RootItem[];',
    );
  });

  it('wraps a union array in parentheses', () => {
    expect(convert('[1,true]', 'typescript')).toBe('export type Root = (number | boolean)[];');
  });

  it('marks optional keys and quotes non-identifier keys', () => {
    expect(convert('[{"first-name":1},{}]', 'typescript')).toBe(
      'export interface RootItem {\n  "first-name"?: number;\n}\n\nexport type Root = RootItem[];',
    );
  });

  it('renders an empty object as {}', () => {
    expect(convert('{}', 'typescript')).toBe('export interface Root {}');
  });

  it('emits a string enum from repeated values', () => {
    expect(convert('["active","inactive","active"]', 'typescript')).toBe(
      'export type Root = ("active" | "inactive")[];',
    );
  });

  it('emits a literal type for a lone string value', () => {
    expect(convert('{"env":"prod"}', 'typescript')).toBe(
      'export interface Root {\n  env: "prod";\n}',
    );
  });

  it('keeps an over-long string as plain string', () => {
    expect(convert(`{"note":"${'x'.repeat(41)}"}`, 'typescript')).toBe(
      'export interface Root {\n  note: string;\n}',
    );
  });

  it('splits disjoint objects into a union of interfaces', () => {
    expect(convert('[{"ok":true},{"err":false}]', 'typescript')).toBe(
      'export interface RootItem {\n  ok: boolean;\n}\n\nexport interface RootItem2 {\n  err: boolean;\n}\n\nexport type Root = (RootItem | RootItem2)[];',
    );
  });

  it('reuses one interface for structurally identical shapes', () => {
    expect(convert('{"a":{"x":1},"b":{"x":1}}', 'typescript')).toBe(
      'export interface Root {\n  a: A;\n  b: A;\n}\n\nexport interface A {\n  x: number;\n}',
    );
  });

  it('does not merge shapes that differ only by a literal value', () => {
    expect(convert('{"a":{"tag":"x"},"b":{"tag":"y"}}', 'typescript')).toBe(
      'export interface Root {\n  a: A;\n  b: B;\n}\n\nexport interface A {\n  tag: "x";\n}\n\nexport interface B {\n  tag: "y";\n}',
    );
  });

  it('emits unknown[] for an empty root array', () => {
    expect(convert('[]', 'typescript')).toBe('export type Root = unknown[];');
  });

  it('singularises the array key for the item interface name', () => {
    expect(convert('{"categories":[{"id":1}]}', 'typescript')).toBe(
      'export interface Root {\n  categories: Category[];\n}\n\nexport interface Category {\n  id: number;\n}',
    );
  });

  it('leaves an -ss key intact when naming an interface', () => {
    expect(convert('{"address":{"city":"x"}}', 'typescript')).toBe(
      'export interface Root {\n  address: Address;\n}\n\nexport interface Address {\n  city: "x";\n}',
    );
  });

  it('quotes and prefixes keys that are not valid identifiers', () => {
    expect(convert('{"1x":{"y":1},"@@@":{"z":1}}', 'typescript')).toBe(
      'export interface Root {\n  "1x": _1x;\n  "@@@": Value;\n}\n\nexport interface _1x {\n  y: number;\n}\n\nexport interface Value {\n  z: number;\n}',
    );
  });
});

describe('convert - zod', () => {
  it('builds a z.object with the import and inferred type', () => {
    expect(convert('{"id":1,"ratio":0.5}', 'zod')).toBe(
      'import { z } from "zod";\n\nexport const Root = z.object({\n  id: z.number().int(),\n  ratio: z.number(),\n});\n\nexport type Root = z.infer<typeof Root>;',
    );
  });

  it('adds format refinements', () => {
    const out = convert('{"a":"x@y.com","b":"2024-01-02T00:00:00Z","c":"https://x.co/y"}', 'zod');
    expect(out).toContain('a: z.string().email()');
    expect(out).toContain('b: z.string().datetime()');
    expect(out).toContain('c: z.string().url()');
  });

  it('emits literal, enum, and optional refinements', () => {
    expect(convert('{"env":"prod"}', 'zod')).toContain('env: z.literal("prod")');
    expect(convert('["a","b"]', 'zod')).toContain('z.array(z.enum(["a", "b"]))');
    expect(convert('[{"id":1,"tag":"x"},{"id":2}]', 'zod')).toContain(
      'tag: z.literal("x").optional()',
    );
  });

  it('unions mixed types', () => {
    expect(convert('[true,1.5]', 'zod')).toContain('z.union([z.boolean(), z.number()])');
  });

  it('covers the remaining leaf schemas and nesting', () => {
    expect(
      convert('{"a":"9f1b8c2e-1a2b-4c3d-8e4f-5a6b7c8d9e0f","b":"2024-01-15"}', 'zod'),
    ).toContain('a: z.string().uuid()');
    expect(convert('{"b":"2024-01-15"}', 'zod')).toContain('b: z.string().date()');
    expect(convert('{"n":null}', 'zod')).toContain('n: z.null()');
    expect(convert('{}', 'zod')).toBe(
      'import { z } from "zod";\n\nexport const Root = z.object({});\n\nexport type Root = z.infer<typeof Root>;',
    );
    expect(convert('{"outer":{"inner":1}}', 'zod')).toContain(
      'outer: z.object({\n    inner: z.number().int(),\n  }),',
    );
    expect(convert('[]', 'zod')).toContain('z.array(z.unknown())');
    expect(convert('{"first-name":1}', 'zod')).toContain('"first-name": z.number().int()');
  });
});

describe('convert - json-schema', () => {
  it('produces object schema with a required list, integer type, no extra-props lock', () => {
    expect(JSON.parse(convert('{"id":1,"score":2}', 'json-schema'))).toEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: { id: { type: 'integer' }, score: { type: 'integer' } },
      required: ['id', 'score'],
    });
  });

  it('omits required entirely when every key is optional and maps url to uri', () => {
    const schema = JSON.parse(convert('[{"site":"https://x.co/a"},{}]', 'json-schema'));
    expect(schema.items.properties.site).toEqual({ type: 'string', format: 'uri' });
    expect(schema.items.required).toBeUndefined();
  });

  it('represents a nullable field as a type array', () => {
    const schema = JSON.parse(convert('[{"x":1},{"x":null}]', 'json-schema'));
    expect(schema.items.properties.x).toEqual({ type: ['integer', 'null'] });
  });

  it('uses const and enum for literal strings', () => {
    expect(JSON.parse(convert('{"env":"prod"}', 'json-schema')).properties.env).toEqual({
      const: 'prod',
    });
    expect(JSON.parse(convert('["a","b","a"]', 'json-schema')).items).toEqual({ enum: ['a', 'b'] });
  });

  it('falls back to anyOf for a union that is not all simple types', () => {
    const schema = JSON.parse(convert('[{"ok":true},{"err":false}]', 'json-schema'));
    expect(schema.items).toEqual({
      anyOf: [
        { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] },
        { type: 'object', properties: { err: { type: 'boolean' } }, required: ['err'] },
      ],
    });
  });

  it('covers plain string, number, boolean, null, and unknown leaves', () => {
    const schema = JSON.parse(
      convert(
        '{"s":["one","two","three","four","five","six","seven","eight","nine","ten","x11","x12","x13"],"f":0.5,"b":true,"n":null,"e":[]}',
        'json-schema',
      ),
    );
    expect(schema.properties.s).toEqual({ type: 'array', items: { type: 'string' } });
    expect(schema.properties.f).toEqual({ type: 'number' });
    expect(schema.properties.b).toEqual({ type: 'boolean' });
    expect(schema.properties.n).toEqual({ type: 'null' });
    expect(schema.properties.e).toEqual({ type: 'array', items: {} });
  });
});

describe('convert - openapi', () => {
  it('wraps the schema in components and drops $schema', () => {
    expect(JSON.parse(convert('{"id":1}', 'openapi'))).toEqual({
      components: {
        schemas: {
          Root: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
        },
      },
    });
  });

  it('uses nullable instead of a null type', () => {
    const doc = JSON.parse(convert('[{"x":1.5},{"x":null}]', 'openapi'));
    expect(doc.components.schemas.Root.items.properties.x).toEqual({
      type: 'number',
      nullable: true,
    });
  });

  it('uses nullable on a plain null field', () => {
    const doc = JSON.parse(convert('{"mid":null}', 'openapi'));
    expect(doc.components.schemas.Root.properties.mid).toEqual({ nullable: true });
  });

  it('renders string literals as an enum', () => {
    const doc = JSON.parse(convert('["a","b"]', 'openapi'));
    expect(doc.components.schemas.Root.items).toEqual({ type: 'string', enum: ['a', 'b'] });
  });

  it('combines anyOf with nullable for a multi-option union that includes null', () => {
    const root = JSON.parse(convert('[{"a":1},{"b":2},null]', 'openapi')).components.schemas.Root;
    expect(root.items).toEqual({
      anyOf: [
        { type: 'object', properties: { a: { type: 'integer' } }, required: ['a'] },
        { type: 'object', properties: { b: { type: 'integer' } }, required: ['b'] },
      ],
      nullable: true,
    });
  });

  it('covers boolean, format, and unknown leaves', () => {
    const root = JSON.parse(convert('{"b":true,"d":"a@b.com","e":[]}', 'openapi')).components
      .schemas.Root;
    expect(root.properties.b).toEqual({ type: 'boolean' });
    expect(root.properties.d).toEqual({ type: 'string', format: 'email' });
    expect(root.properties.e).toEqual({ type: 'array', items: {} });
  });

  it('emits anyOf without nullable for a null-free object union', () => {
    const root = JSON.parse(convert('[{"a":1},{"b":2}]', 'openapi')).components.schemas.Root;
    expect(root.items).toEqual({
      anyOf: [
        { type: 'object', properties: { a: { type: 'integer' } }, required: ['a'] },
        { type: 'object', properties: { b: { type: 'integer' } }, required: ['b'] },
      ],
    });
  });
});

describe('convert - invalid input', () => {
  it('throws on malformed JSON', () => {
    expect(() => convert('{bad', 'typescript')).toThrow();
  });
});
