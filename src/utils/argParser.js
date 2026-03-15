export const parseArgs = (raw) => {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { name: '', args: [] };
  }

  const [name, ...args] = trimmed.split(/\s+/);
  return { name, args };
};

export const parseNamedArgs = (args) => {
  const result = {};

  args.forEach((token, i) => {
    if (!token.startsWith('--')) {
      return;
    }

    const key = token.slice(2);
    const next = args[i + 1];

    result[key] = next && !next.startsWith('--') ? next : true;
  });

  return result;
};
