export const parseArgs = (raw) => {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { name: '', args: [] };
  }

  const [name, ...args] = trimmed.split(/\s+/);
  return { name, args };
};
