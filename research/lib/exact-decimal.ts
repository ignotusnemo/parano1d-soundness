interface ParsedDecimal {
  integer: bigint;
  scale: number;
}

function parseDecimal(value: string): ParsedDecimal {
  const match = /^([+-]?)([0-9]+)(?:\.([0-9]+))?$/u.exec(value);
  if (!match || !match[2]) throw new Error(`invalid exact decimal: ${value}`);
  const fraction = match[3] ?? "";
  const magnitude = BigInt(`${match[2]}${fraction}`);
  return {
    integer: match[1] === "-" ? -magnitude : magnitude,
    scale: fraction.length
  };
}

function rescale(value: ParsedDecimal, scale: number): bigint {
  if (value.scale > scale) throw new Error("exact decimal scale cannot be reduced");
  return value.integer * (10n ** BigInt(scale - value.scale));
}

function formatDecimal(integer: bigint, scale: number, positiveSign: boolean): string {
  const negative = integer < 0n;
  const magnitude = negative ? -integer : integer;
  const digits = magnitude.toString().padStart(scale + 1, "0");
  const body = scale === 0 ? digits : `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
  if (negative) return `-${body}`;
  return positiveSign ? `+${body}` : body;
}

export function exactDecimalDifference(left: string, right: string, positiveSign = false): string {
  const leftValue = parseDecimal(left);
  const rightValue = parseDecimal(right);
  const scale = Math.max(leftValue.scale, rightValue.scale);
  const difference = rescale(leftValue, scale) - rescale(rightValue, scale);
  return formatDecimal(difference, scale, positiveSign);
}
