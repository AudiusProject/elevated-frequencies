/**
 * Handles /api/backend/* (all API requests are rewritten here by vercel.json).
 * Build copies dist-server into api/ so the path is api/dist-server/...
 * We use backend/ so that the parent api/ has the copy; import from sibling.
 */
// @ts-ignore - built output
import app from "../dist-server/server/index.js";
export default app;
