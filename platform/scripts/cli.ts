export function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`missing value for ${name}`);
  return value;
}

export function requiredOption(name: string): string {
  const value = option(name);
  if (!value) throw new Error(`required option ${name} is missing`);
  return value;
}
