/**
 * Single Vercel serverless entry for all /api/* requests.
 * vercel.json rewrites /api/(.*) → /api/backend?__path=$1 so this one function
 * receives every API call; Express middleware restores req.url from __path.
 * Build copies dist-server into api/ so dist-server/server/index.js exists.
 */
// @ts-ignore - built output
import app from "./dist-server/server/index.js";
export default app;
