import dotenv from "dotenv"; dotenv.config();
export const env={port:Number(process.env.PORT||4000),jwtSecret:process.env.JWT_SECRET||"",clientOrigin:process.env.CLIENT_ORIGIN||"http://localhost:3000",nodeEnv:process.env.NODE_ENV||"development"};
if(!env.jwtSecret || env.jwtSecret.length<32) throw new Error("JWT_SECRET must be set and at least 32 characters");
