import "dotenv/config";
import express from "express";
import cors from "cors";
import { getSupabase } from "../lib/supabase/server.js";
import type {
  Submission,
  SubmissionStatus,
  SubmissionComment,
} from "../lib/supabase/types.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const ARTIST_USER_ID = (process.env.VITE_ARTIST_USER_ID ?? "").trim();
const CURATOR_KEY = (process.env.CURATOR_KEY ?? "").trim();

app.use(cors());
app.use(express.json());

function getAuthUser(req: express.Request): { userId: string } | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const parts = auth.slice(7).split(":");
  if (parts.length === 2) {
    return { userId: parts[0] };
  }
  return null;
}

function isCuratorRequest(req: express.Request): boolean {
  const key = req.headers["x-curator-key"];
  return typeof key === "string" && CURATOR_KEY !== "" && key === CURATOR_KEY;
}

function hasCuratorAccess(req: express.Request): boolean {
  const user = getAuthUser(req);
  if (isCuratorRequest(req)) return true;
  return user !== null && ARTIST_USER_ID !== "" && user.userId === ARTIST_USER_ID;
}

function isArtist(userId: string): boolean {
  return ARTIST_USER_ID !== "" && userId === ARTIST_USER_ID;
}

function formatSubmission(row: Submission) {
  return {
    id: row.id,
    trackId: row.track_id,
    trackTitle: row.track_title,
    audiusUserId: row.audius_user_id,
    audiusHandle: row.audius_handle,
    artistName: row.artist_name,
    genre: row.genre,
    bpm: row.bpm,
    description: row.description,
    releaseStatus: row.release_status,
    location: row.location,
    instagram: row.instagram,
    tiktok: row.tiktok,
    spotifyUrl: row.spotify_url,
    status: row.status,
    artistNote: row.artist_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatComment(row: SubmissionComment) {
  return {
    id: String(row.id),
    submissionId: row.submission_id,
    userId: row.user_id,
    userHandle: row.user_handle,
    userName: row.user_name ?? row.user_handle,
    body: row.body,
    createdAt: row.created_at,
  };
}

// Verify auth (lightweight - real verification would validate against Audius)
app.post("/api/auth/verify", (req, res) => {
  const { audiusUserId } = req.body;
  if (!audiusUserId) {
    res.status(400).json({ error: "Missing audiusUserId" });
    return;
  }
  res.json({ valid: true, isArtist: isArtist(audiusUserId) });
});

// Create submission
app.post("/api/submissions", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const {
    trackId,
    trackTitle,
    artistName,
    genre,
    bpm,
    description,
    releaseStatus,
    location,
    instagram,
    tiktok,
    spotifyUrl,
    audiusHandle,
  } = req.body;

  if (!trackId || !trackTitle) {
    res.status(400).json({ error: "trackId and trackTitle are required" });
    return;
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        track_id: trackId,
        track_title: trackTitle,
        audius_user_id: user.userId,
        audius_handle: audiusHandle ?? "",
        artist_name: artistName ?? "",
        genre: genre ?? "",
        bpm: bpm ?? "",
        description: description ?? "",
        release_status: releaseStatus ?? "",
        location: location ?? "",
        instagram: instagram ?? "",
        tiktok: tiktok ?? "",
        spotify_url: spotifyUrl ?? "",
        status: "in_review",
        artist_note: null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json({ submission: formatSubmission(data as Submission) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user's submissions
app.get("/api/submissions/mine", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("audius_user_id", user.userId)
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ submissions: (data ?? []).map((r) => formatSubmission(r as Submission)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all submissions (artist or curator subdomain)
app.get("/api/submissions", async (req, res) => {
  if (!hasCuratorAccess(req)) {
    res.status(403).json({ error: "Artist access only" });
    return;
  }

  const { status, search } = req.query;
  try {
    const supabase = getSupabase();
    let query = supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && String(status) !== "all") {
      query = query.eq("status", String(status) as SubmissionStatus);
    }
    if (search && String(search).trim()) {
      const term = String(search).trim();
      const pattern = `%${term}%`;
      query = query.or(
        `track_title.ilike.${pattern},artist_name.ilike.${pattern},audius_handle.ilike.${pattern}`
      );
    }

    const { data, error } = await query;
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ submissions: (data ?? []).map((r) => formatSubmission(r as Submission)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single submission (owner, artist, or curator subdomain)
app.get("/api/submissions/:id", async (req, res) => {
  const user = getAuthUser(req);
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const supabase = getSupabase();
    const { data: row, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const sub = row as Submission;
    const curator = isCuratorRequest(req);
    const ownerOrArtist = user && (sub.audius_user_id === user.userId || isArtist(user.userId));
    if (!curator && !ownerOrArtist) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json({ submission: formatSubmission(sub) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update submission status (artist or curator subdomain)
app.patch("/api/submissions/:id/status", async (req, res) => {
  if (!hasCuratorAccess(req)) {
    res.status(403).json({ error: "Artist access only" });
    return;
  }

  const { status, note } = req.body;
  const validStatuses: SubmissionStatus[] = ["in_review", "accepted", "rejected"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const supabase = getSupabase();
    const update: {
      status: SubmissionStatus;
      updated_at: string;
      artist_note?: string | null;
    } = {
      status: status as SubmissionStatus,
      updated_at: new Date().toISOString(),
    };
    if (note !== undefined) update.artist_note = note ?? null;

    const { data, error } = await supabase
      .from("submissions")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ submission: formatSubmission(data as Submission) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get comments for a submission (owner, artist, or curator subdomain)
app.get("/api/submissions/:id/comments", async (req, res) => {
  const user = getAuthUser(req);
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const supabase = getSupabase();
    const { data: sub } = await supabase
      .from("submissions")
      .select("audius_user_id")
      .eq("id", id)
      .single();
    if (!sub) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const submission = sub as { audius_user_id: string };
    const curator = isCuratorRequest(req);
    const ownerOrArtist = user && (submission.audius_user_id === user.userId || isArtist(user.userId));
    if (!curator && !ownerOrArtist) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { data, error } = await supabase
      .from("submission_comments")
      .select("*")
      .eq("submission_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({
      comments: (data ?? []).map((r) => formatComment(r as SubmissionComment)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Post a comment (owner, artist, or curator subdomain)
app.post("/api/submissions/:id/comments", async (req, res) => {
  const user = getAuthUser(req);
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { body, userHandle, userName, curatorName } = req.body;
  if (!body || typeof body !== "string" || !body.trim()) {
    res.status(400).json({ error: "Comment body is required" });
    return;
  }

  try {
    const supabase = getSupabase();
    const { data: sub } = await supabase
      .from("submissions")
      .select("audius_user_id")
      .eq("id", id)
      .single();
    if (!sub) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const submission = sub as { audius_user_id: string };
    const curator = isCuratorRequest(req);
    const ownerOrArtist = user && (submission.audius_user_id === user.userId || isArtist(user.userId));
    if (!curator && !ownerOrArtist) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const commentUserId = curator ? "curator" : user!.userId;
    const commentHandle = curator ? "" : (typeof userHandle === "string" ? userHandle : "");
    const commentName = curator
      ? (typeof curatorName === "string" ? curatorName : "Curator")
      : (typeof userName === "string" ? userName : "");

    const { data: row, error } = await supabase
      .from("submission_comments")
      .insert({
        submission_id: id,
        user_id: commentUserId,
        user_handle: commentHandle,
        user_name: commentName,
        body: body.trim().slice(0, 2000),
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json({ comment: formatComment(row as SubmissionComment) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export for Vercel serverless (catch-all)
export default app;

if (process.env.NODE_ENV !== "vercel") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (ARTIST_USER_ID) {
      console.log(`Artist (curator) user ID: ${ARTIST_USER_ID}`);
    } else {
      console.log("Warning: VITE_ARTIST_USER_ID not set — no curator access");
    }
  });
}
