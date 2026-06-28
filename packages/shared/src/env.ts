type EnvSource = Record<string, string | undefined>;

export function readRequiredEnv(key: string, env: EnvSource = process.env): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}
