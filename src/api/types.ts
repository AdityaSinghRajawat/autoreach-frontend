import type { components } from "./schema";

export type Schemas = components["schemas"];

export type Session = Schemas["Session"];
export type SessionUser = Schemas["User"];
export type PaginationMeta = Schemas["PaginationMeta"];
export type ErrorDetail = Schemas["ErrorDetail"];

export interface Page<T> {
  items: T[];
  meta: PaginationMeta;
}
