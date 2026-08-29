const MAX_JSON_BYTES = 1_048_576;
const MAX_DEPTH = 32;
const MAX_COLLECTION_LENGTH = 10_000;

class StrictJsonReader {
  private position = 0;

  constructor(private readonly input: string) {
    if (Buffer.byteLength(input, "utf8") > MAX_JSON_BYTES) {
      throw new Error(`JSON exceeds ${MAX_JSON_BYTES} bytes`);
    }
  }

  parse(): unknown {
    this.skipWhitespace();
    const value = this.parseValue(0);
    this.skipWhitespace();
    if (this.position !== this.input.length) {
      this.fail("trailing data");
    }
    return value;
  }

  private parseValue(depth: number): unknown {
    if (depth > MAX_DEPTH) {
      this.fail(`nesting exceeds ${MAX_DEPTH}`);
    }
    const token = this.input[this.position];
    if (token === "{") return this.parseObject(depth + 1);
    if (token === "[") return this.parseArray(depth + 1);
    if (token === '"') return this.parseString();
    if (token === "t") return this.parseLiteral("true", true);
    if (token === "f") return this.parseLiteral("false", false);
    if (token === "n") return this.parseLiteral("null", null);
    if (token === "-" || (token !== undefined && token >= "0" && token <= "9")) {
      return this.parseInteger();
    }
    this.fail("expected a JSON value");
  }

  private parseObject(depth: number): Record<string, unknown> {
    this.position += 1;
    this.skipWhitespace();
    const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    const keys = new Set<string>();
    if (this.input[this.position] === "}") {
      this.position += 1;
      return result;
    }
    let count = 0;
    while (true) {
      if (this.input[this.position] !== '"') this.fail("object key must be a string");
      const key = this.parseString();
      if (keys.has(key)) this.fail(`duplicate object key ${JSON.stringify(key)}`);
      keys.add(key);
      count += 1;
      if (count > MAX_COLLECTION_LENGTH) this.fail("object has too many keys");
      this.skipWhitespace();
      if (this.input[this.position] !== ":") this.fail("expected colon after object key");
      this.position += 1;
      this.skipWhitespace();
      result[key] = this.parseValue(depth);
      this.skipWhitespace();
      const delimiter = this.input[this.position];
      if (delimiter === "}") {
        this.position += 1;
        return result;
      }
      if (delimiter !== ",") this.fail("expected comma or closing brace");
      this.position += 1;
      this.skipWhitespace();
    }
  }

  private parseArray(depth: number): unknown[] {
    this.position += 1;
    this.skipWhitespace();
    const result: unknown[] = [];
    if (this.input[this.position] === "]") {
      this.position += 1;
      return result;
    }
    while (true) {
      result.push(this.parseValue(depth));
      if (result.length > MAX_COLLECTION_LENGTH) this.fail("array has too many elements");
      this.skipWhitespace();
      const delimiter = this.input[this.position];
      if (delimiter === "]") {
        this.position += 1;
        return result;
      }
      if (delimiter !== ",") this.fail("expected comma or closing bracket");
      this.position += 1;
      this.skipWhitespace();
    }
  }

  private parseString(): string {
    const start = this.position;
    this.position += 1;
    let escaped = false;
    while (this.position < this.input.length) {
      const code = this.input.charCodeAt(this.position);
      const character = this.input[this.position];
      if (!escaped && character === '"') {
        this.position += 1;
        return JSON.parse(this.input.slice(start, this.position)) as string;
      }
      if (!escaped && code < 0x20) this.fail("unescaped control character in string");
      if (!escaped && character === "\\") {
        escaped = true;
      } else {
        escaped = false;
      }
      this.position += 1;
    }
    this.fail("unterminated string");
  }

  private parseInteger(): number {
    const remainder = this.input.slice(this.position);
    const match = /^-?(?:0|[1-9][0-9]*)/.exec(remainder);
    if (!match) this.fail("invalid integer");
    const token = match[0];
    this.position += token.length;
    const next = this.input[this.position];
    if (next === "." || next === "e" || next === "E") {
      this.fail("JSON numbers must be integers; exact metrics must be strings");
    }
    const value = Number(token);
    if (!Number.isSafeInteger(value)) this.fail("integer is outside the safe range");
    return value;
  }

  private parseLiteral<T>(token: string, value: T): T {
    if (this.input.slice(this.position, this.position + token.length) !== token) {
      this.fail(`invalid literal ${token}`);
    }
    this.position += token.length;
    return value;
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.input[this.position] ?? "")) this.position += 1;
  }

  private fail(message: string): never {
    throw new Error(`invalid strict JSON at byte ${this.position}: ${message}`);
  }
}

export function parseStrictJson(input: string): unknown {
  return new StrictJsonReader(input).parse();
}
