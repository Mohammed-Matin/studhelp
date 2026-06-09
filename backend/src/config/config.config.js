import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
    "PORT",
    "JWT_SECRET",
    "DATABASE_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

const config = {
    port: Number(process.env.PORT),
    jwtSecret: process.env.JWT_SECRET,
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
};

if (!Number.isInteger(config.port) || config.port <= 0) {
    console.error("PORT must be a positive integer");
    process.exit(1);
}

export default config;
