export function hasCapability(
  capabilities: readonly string[] | undefined,
  code: string,
): boolean {
  if (!capabilities?.length) return false;
  return capabilities.some((item) => item.toUpperCase() === code.toUpperCase());
}
