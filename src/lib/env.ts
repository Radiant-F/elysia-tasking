function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: getEnvVar("DATABASE_URL"),
  JWT_ACCESS_SECRET: getEnvVar("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: getEnvVar("JWT_REFRESH_SECRET"),
  ACCESS_TOKEN_EXPIRES_IN: getEnvVar("ACCESS_TOKEN_EXPIRES_IN", "15m"),
  REFRESH_TOKEN_EXPIRES_IN: getEnvVar("REFRESH_TOKEN_EXPIRES_IN", "7d"),
  REMEMBER_ME_REFRESH_EXPIRES_IN: getEnvVar(
    "REMEMBER_ME_REFRESH_EXPIRES_IN",
    "30d",
  ),
  PORT: parseInt(getEnvVar("PORT", "3000"), 10),
  NODE_ENV: getEnvVar("NODE_ENV", "development"),
} as const;
