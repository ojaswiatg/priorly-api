// import _ from "lodash";
import AppRouter from "#routes/router";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import mongoose from "mongoose";
import { redisClient, RedisStore } from "./config/redis";

// loads the config files
dotenv.config();
const app = express();

// Use below configuration for allowed origins
// import {type CorsOptions} from 'cors'
// const ALLOWED_ORIGINS: string[] = []; // Allowed origins for this API Server - best stored in .env file

// const corsOptions: CorsOptions = {
//     origin: (origin, callback) => {
//         // Allow requests with no origin (like mobile apps or curl requests) || only allow requests from localhost
//         if (!origin || _.includes(ALLOWED_ORIGINS, origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error("Not allowed by CORS"));
//         }
//     },
//     optionsSuccessStatus: 200, // For legacy browser support
//     credentials: true,
// };

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: String(process.env.EXPRESS_SESSION_KEY),
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure:
                String(process.env.ENV_TYPE) === "production" ? true : false,
            httpOnly: true,
            maxAge: 1000 * 60 * 30, // 30 minutes
        },
    }),
);

app.use("/api", AppRouter);

const PORT = process.env.PORT || 8080; // The Google App Engine requires our app to listen to port 8080
const MONGO_URI = String(process.env.MONGO_URI);

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.info("MongoDB connected");
        app.listen(PORT, () => {
            console.info(`Server started: Listening on PORT: ${PORT}`);
        });
    })
    .catch((error) => {
        console.error(error);
        console.error(
            "Error connecting to MongoDB. Please check the MONGO_URI variable in the .env file.",
        );
    });
