import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useAuthStore,
  type Submission,
  type SubmissionStatus,
} from "@/lib/store";
import { isCuratorApp } from "@/lib/curator";
import { api, type Comment } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { AudioPlayer } from "@/components/AudioPlayer";
import styles from "./TrackDetail.module.css";

export function TrackDetail() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(
    async (submissionId: number) => {
      try {
        const res = await api.getComments(submissionId);
        setComments(res.comments);
      } catch (err) {
        console.warn("Could not load comments:", err);
      }
    },
    []
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getSubmission(Number(id))
      .then((res) => {
        setSubmission(res.submission);
        return loadComments(res.submission.id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, loadComments]);

  const curatorMode = isCuratorApp();

  const handlePostComment = async () => {
    if (!commentText.trim() || !submission) return;
    if (!curatorMode && !user) return;
    setPostingComment(true);
    try {
      await api.postComment(submission.id, commentText.trim(), curatorMode
        ? { curatorName: "Curator" }
        : { userHandle: user!.handle, userName: user!.name });
      setCommentText("");
      await loadComments(submission.id);
    } catch (err: unknown) {
      console.error("Comment error:", err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: SubmissionStatus) => {
    if (!submission) return;
    if (!curatorMode && !user?.isArtist) return;
    try {
      const res = await api.updateSubmissionStatus(submission.id, newStatus);
      setSubmission(res.submission);
    } catch (err: unknown) {
      console.error("Status update failed:", err);
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.loading}>
          <span className="spin" /> Loading...
        </div>
      </section>
    );
  }

  if (error ?? !submission) {
    return (
      <section className={styles.page}>
        <div className={styles.error}>{error ?? "Submission not found"}</div>
        <Link to="/" className="btn-secondary" style={{ marginTop: 16 }}>
          Back to Home
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <Link
        to="/"
        className={styles.backLink}
      >
        &larr; Back
      </Link>

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.titleRow}>
            <div>
              <h2>{submission.trackTitle}</h2>
              <div className={styles.subtitle}>
                by {submission.artistName}
                {submission.audiusHandle ? (
                  <span> &middot; @{submission.audiusHandle}</span>
                ) : null}
              </div>
            </div>
            <StatusBadge status={submission.status} />
          </div>

          <AudioPlayer
            track={{
              trackId: submission.trackId,
              title: submission.trackTitle,
              artist: submission.artistName,
              submissionId: submission.id,
            }}
          />

          <div className={styles.metaGrid}>
            {submission.genre ? (
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Genre</div>
                <div className={styles.metaValue}>{submission.genre}</div>
              </div>
            ) : null}
            {submission.bpm ? (
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>BPM</div>
                <div className={styles.metaValue}>{submission.bpm}</div>
              </div>
            ) : null}
            {submission.releaseStatus ? (
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Release Status</div>
                <div className={styles.metaValue}>
                  {submission.releaseStatus}
                </div>
              </div>
            ) : null}
            {submission.location ? (
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Location</div>
                <div className={styles.metaValue}>{submission.location}</div>
              </div>
            ) : null}
            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>Submitted</div>
              <div className={styles.metaValue}>
                {new Date(submission.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>

          {submission.description ? (
            <div className={styles.descBlock}>
              <div className={styles.descLabel}>Artist&apos;s Message</div>
              <p>{submission.description}</p>
            </div>
          ) : null}

          {submission.instagram ||
          submission.tiktok ||
          submission.spotifyUrl ? (
            <div className={styles.socialRow}>
              {submission.instagram ? (
                <a
                  href={`https://instagram.com/${submission.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.socialLink}
                >
                  @{submission.instagram} (IG)
                </a>
              ) : null}
              {submission.tiktok ? (
                <a
                  href={`https://tiktok.com/@${submission.tiktok}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.socialLink}
                >
                  @{submission.tiktok} (TikTok)
                </a>
              ) : null}
              {submission.spotifyUrl ? (
                <a
                  href={submission.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.socialLink}
                >
                  Spotify
                </a>
              ) : null}
            </div>
          ) : null}

          {(curatorMode || user?.isArtist) ? (
            <div className={styles.artistControls}>
              <div className={styles.controlLabel}>Update Status</div>
              <div className={styles.statusButtons}>
                {(
                  ["in_review", "accepted", "rejected"] as SubmissionStatus[]
                ).map((s) => (
                  <button
                    key={s}
                    className={`${styles.statusBtn} ${submission.status === s ? styles.statusBtnActive : ""}`}
                    onClick={() => handleStatusChange(s)}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.commentsSidebar}>
          <div className={styles.commentsHeader}>
            <span>Comments</span>
            <span className={styles.commentCount}>{comments.length}</span>
          </div>

          <div className={styles.commentsList}>
            {comments.length === 0 ? (
              <div className={styles.noComments}>
                No comments yet.{" "}
                {user?.isArtist
                  ? "Leave feedback for the artist."
                  : "Olivia may leave feedback here."}
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className={styles.comment}>
                  <div className={styles.commentMeta}>
                    <strong>{c.userName || c.userHandle || "User"}</strong>
                    {c.userHandle ? (
                      <span>@{c.userHandle}</span>
                    ) : null}
                  </div>
                  <div className={styles.commentBody}>{c.body}</div>
                  {c.createdAt ? (
                    <div className={styles.commentTime}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {(curatorMode || user) ? (
            <div className={styles.commentForm}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  curatorMode || user?.isArtist ? "Leave feedback..." : "Reply to Olivia..."
                }
                maxLength={500}
              />
              <button
                onClick={handlePostComment}
                disabled={!commentText.trim() || postingComment}
                className={styles.commentBtn}
              >
                {postingComment ? <span className="spin" /> : "Post"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
