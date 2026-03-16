/** Submission status. */
export type SubmissionStatus = "in_review" | "accepted" | "rejected";

/** Row shape for public.submissions (matches schema.sql). */
export type Submission = {
  id: number;
  track_id: string;
  track_title: string;
  audius_user_id: string;
  audius_handle: string;
  artist_name: string;
  genre: string;
  bpm: string | null;
  description: string | null;
  release_status: string | null;
  location: string | null;
  instagram: string | null;
  tiktok: string | null;
  spotify_url: string | null;
  status: SubmissionStatus;
  artist_note: string | null;
  created_at: string;
  updated_at: string;
};

/** Row shape for public.submission_comments. */
export type SubmissionComment = {
  id: number;
  submission_id: number;
  user_id: string;
  user_handle: string;
  user_name: string | null;
  body: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      submissions: {
        Row: Submission;
        Insert: Omit<Submission, "id" | "created_at" | "updated_at"> & {
          id?: number;
          created_at?: string;
          updated_at?: string;
          artist_note?: string | null;
        };
        Update: Partial<Omit<Submission, "id" | "created_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      submission_comments: {
        Row: SubmissionComment;
        Insert: Omit<SubmissionComment, "id" | "created_at"> & {
          id?: number;
          created_at?: string;
        };
        Update: Partial<Omit<SubmissionComment, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "submission_comments_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
