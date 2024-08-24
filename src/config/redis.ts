import connectRedis from "connect-redis";
import session from "express-session";
import { Redis } from "ioredis";

export const RedisStore = connectRedis(session);

export const redisClient = new Redis(String(process.env.REDIS_URI));

redisClient.on("error", function (error) {
    console.error(error);
    console.error(
        "Error connecting to Redis Server. Please check the REDIS_URI variable in the .env file.",
    );
    return;
});
