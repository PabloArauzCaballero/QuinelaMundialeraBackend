export function hasDatePassed(date: Date | string): boolean {
  return new Date(date).getTime() <= Date.now();
}

export function toIsoDateOnly(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
