export interface TleData {
  name: string;
  line1: string;
  line2: string;
  fetchedAt: number;
}

/** Validate before handing untrusted fixed-column data to SGP4. */
export function parseTle(text: string, catalogId: number, fetchedAt = Date.now()): TleData {
  const lines = text.trim().split(/\r?\n/);
  const line1 = lines.find((line) => line.startsWith('1 '));
  const line2 = lines.find((line) => line.startsWith('2 '));
  for (const [index, line] of [line1, line2].entries()) {
    if (
      !line ||
      line.length !== 69 ||
      Number(line.slice(2, 7)) !== catalogId ||
      !/^\d$/.test(line[68])
    ) {
      throw new Error('Invalid orbital element format or catalog number');
    }
    const checksum =
      [...line.slice(0, 68)].reduce(
        (sum, char) => sum + (/\d/.test(char) ? Number(char) : char === '-' ? 1 : 0),
        0
      ) % 10;
    if (checksum !== Number(line[68]) || !line.startsWith(`${index + 1} `))
      throw new Error('Orbital element checksum failed');
  }
  const epochDay = Number(line1!.slice(20, 32));
  const inclination = Number(line2!.slice(8, 16));
  if (
    !/^\d{5}\.\d{8}$/.test(line1!.slice(18, 32)) ||
    epochDay < 1 ||
    epochDay >= 367 ||
    !Number.isFinite(inclination) ||
    inclination < 0 ||
    inclination > 180 ||
    !/^\d{7}$/.test(line2!.slice(26, 33))
  )
    throw new Error('Invalid orbital elements');
  if (!Number.isFinite(Number(line2!.slice(52, 63))) || Number(line2!.slice(52, 63)) <= 0)
    throw new Error('Invalid mean motion');
  return {
    name: lines[0].startsWith('1 ') ? String(catalogId) : lines[0].replace(/^0 /, '').trim(),
    line1: line1!,
    line2: line2!,
    fetchedAt
  };
}
