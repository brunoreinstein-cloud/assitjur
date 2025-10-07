/**
 * Core Type System - Reduce explicit any usage
 * Central type definitions for the application
 */

// ============= JSON-like types =============
export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export type Primitive = string | number | boolean | null | undefined;

export type Dict<T = unknown> = Record<string, T>;

// ============= Data Row Types =============
export type RawRow = Dict<string | number | boolean | null>;

export interface NormalizedRow {
  [key: string]: string | number | boolean | null | undefined;
}

// ============= API Response Types =============
export interface ApiResult<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// ============= React Form Handler Types =============
export type FormHandler = (e: React.FormEvent<HTMLFormElement>) => void;

export type InputChangeHandler = (
  e: React.ChangeEvent<HTMLInputElement>
) => void;

export type SelectChangeHandler = (
  e: React.ChangeEvent<HTMLSelectElement>
) => void;

export type TextAreaChangeHandler = (
  e: React.ChangeEvent<HTMLTextAreaElement>
) => void;

// ============= File Processing Types =============
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface ProcessingResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
}

// ============= Correction Types =============
// Note: CorrectedRow is defined in intelligent-corrector.ts for ETL use
export interface FieldCorrection {
  field: string;
  originalValue: unknown;
  correctedValue: unknown;
  correctionType: string;
  reason?: string;
  confidence?: number;
}

// ============= Type Guards =============
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isPrimitive(value: unknown): value is Primitive {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

// ============= Utility Types =============
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type MaybeArray<T> = T | T[];
