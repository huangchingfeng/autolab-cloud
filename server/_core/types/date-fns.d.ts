export interface DateFnsFormatOptions {
  locale?: unknown;
  [key: string]: unknown;
}

export function format(
  date: Date | number | string,
  formatStr: string,
  options?: DateFnsFormatOptions
): string;

export function formatDistanceToNow(
  date: Date | number | string,
  options?: DateFnsFormatOptions
): string;
