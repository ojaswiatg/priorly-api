import type { Request } from "express";

export function logURL(req: Request) {
    const fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
    console.info(fullUrl);
    return fullUrl;
}
