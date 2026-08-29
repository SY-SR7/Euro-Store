import type { Database, Json } from '@eurostore/database';

type PublicTables = Database['public']['Tables'];

export type TableUpdate<Name extends keyof PublicTables> =
  PublicTables[Name] extends { Update: infer Update } ? Update : never;

export type TableRow<Name extends keyof PublicTables> =
  PublicTables[Name] extends { Row: infer Row } ? Row : never;

export function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
