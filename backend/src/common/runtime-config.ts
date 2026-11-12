export class RuntimeConfig {
  constructor(private readonly values: Record<string, unknown>) {}

  get<T>(key: string): T | undefined {
    return this.values[key] as T | undefined;
  }

  getOrThrow<T>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined || value === null) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }
}
