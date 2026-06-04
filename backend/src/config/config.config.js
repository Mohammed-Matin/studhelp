import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["PORT"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const config = {
  port: Number(process.env.PORT),
};

if (!Number.isInteger(config.port) || config.port <= 0) {
  console.error("PORT must be a positive integer");
  process.exit(1);
}

export default config;
