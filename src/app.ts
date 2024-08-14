import dotenv from "dotenv"; // loads the config files
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
// import _ from "lodash";

import AppRouter from "#routes/router";

dotenv.config();
const app = express();

// Use below configuration for allowed origins
// import {type CorsOptions} from 'cors'
// const ALLOWED_ORIGINS: string[] = []; // Allowed origins for this API Server

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

app.use("/api", AppRouter);

const PORT = process.env.PORT || 8080; // The Google App Engine requires our app to listen to this port
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
            "Error connecting to MongoDB. Please check your connection string in .env file.",
        );
    });
