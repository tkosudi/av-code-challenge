import dotenv from "dotenv";

dotenv.config();

type Env = {
  PORT: number;
  DATABASE_URL: string;
  ALLOWED_ORIGIN: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

export const env: Env = {
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: required("DATABASE_URL"),
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || "https://publisher.example.com",
};
