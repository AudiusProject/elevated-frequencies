/**
 * Vercel serverless catch-all: forwards all /api/* requests to the Express app.
 * Build copies dist-server into api/ so this import works in the serverless bundle.
 */
// @ts-ignore - built output (api/dist-server from build script copy)
import app from "./dist-server/server/index.js";
export default app;
