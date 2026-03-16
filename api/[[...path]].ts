/**
 * Vercel serverless catch-all: forwards all /api/* requests to the Express app.
 * Build must run first so that dist-server/server/index.js exists.
 */
// @ts-ignore - built output
import app from "../dist-server/server/index.js";
export default app;
