interface JsonEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export function printJson<T>(data: T, meta?: Record<string, unknown>): void {
  const envelope: JsonEnvelope<T> = { data };
  if (meta) envelope.meta = meta;
  process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
}

export function printJsonError(
  code: string,
  message: string,
  hint?: string,
): void {
  const envelope = {
    error: { code, message, ...(hint ? { hint } : {}) },
    data: null,
  };
  process.stderr.write(`${JSON.stringify(envelope, null, 2)}\n`);
}
