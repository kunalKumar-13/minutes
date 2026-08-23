/**
 * Typed client for the FastAPI backend.
 *
 * Everything goes through `request()` so error handling, JSON decoding and the
 * base URL are defined exactly once. `ApiError` carries the server's `detail`
 * string, which is what the toasts show the user.
 */
import { readToken } from "./session";
import type {
  ActionItem, ActionItemWithMeeting, AnalyticsOverview, AskResponse, Comment,
  GlobalSearchResult, LoginResponse, Meeting, MeetingDetail, MeetingFilters,
  MeetingInsights, MeetingPage, Participant, Segment, SegmentMatch, SessionInfo, Soundbite,
  SoundbiteWithMeeting, Summary, TagCount, Topic, User,
  Credits, Skill, SkillPayload, SkillPreview, SkillRun, SkillTemplate,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  // The session token rides on every call. Read per-request rather than
  // captured once, so signing in or out takes effect immediately.
  const token = readToken();
  try {
    response = await fetch(`${API_BASE}/api${path}`, {
      ...init,
      headers: {
        ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the backend running?");
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      // FastAPI validation errors arrive as a list of {loc, msg} objects.
      if (typeof body?.detail === "string") detail = body.detail;
      else if (Array.isArray(body?.detail)) detail = body.detail.map((d: { msg: string }) => d.msg).join(", ");
    } catch {
      /* non-JSON error body; keep the generic message */
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function query(params: Record<string, unknown> | object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export interface MeetingCreatePayload {
  title: string;
  description?: string;
  meeting_date?: string;
  duration_seconds?: number;
  source?: string;
  media_url?: string | null;
  media_type?: string;
  participants?: { name: string; email?: string | null; is_host?: boolean }[];
  tags?: string[];
  transcript_text?: string;
  transcript_format?: "auto" | "txt" | "vtt" | "json";
  generate_summary?: boolean;
}

export const api = {
  // -- auth --------------------------------------------------------------
  signIn: (provider: string) =>
    request<LoginResponse>("/auth/session", { method: "POST", body: JSON.stringify({ provider }) }),
  readSession: () => request<SessionInfo>("/auth/session"),
  signOut: () => request<void>("/auth/session", { method: "DELETE" }),
  sessions: () => request<SessionInfo[]>("/auth/sessions"),

  // -- workspace ---------------------------------------------------------
  me: () => request<User>("/me"),
  updateMe: (body: Partial<Pick<User, "name" | "job_title" | "timezone" | "avatar_url">>) =>
    request<User>("/me", { method: "PATCH", body: JSON.stringify(body) }),
  tags: () => request<TagCount[]>("/tags"),
  analytics: () => request<AnalyticsOverview>("/analytics/overview"),

  // -- meetings ----------------------------------------------------------
  meetings: (filters: MeetingFilters = {}) => request<MeetingPage>(`/meetings${query(filters)}`),
  meeting: (id: string) => request<MeetingDetail>(`/meetings/${id}`),
  createMeeting: (body: MeetingCreatePayload) =>
    request<MeetingDetail>("/meetings", { method: "POST", body: JSON.stringify(body) }),
  uploadMeeting: (form: FormData) =>
    request<MeetingDetail>("/meetings/upload", { method: "POST", body: form }),
  updateMeeting: (
    id: string,
    body: Partial<Pick<Meeting, "title" | "description" | "meeting_date" | "duration_seconds" | "is_favorite" | "privacy">> & { tags?: string[] },
  ) => request<MeetingDetail>(`/meetings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteMeeting: (id: string) => request<void>(`/meetings/${id}`, { method: "DELETE" }),
  toggleFavorite: (id: string) => request<Meeting>(`/meetings/${id}/favorite`, { method: "POST" }),
  exportUrl: (id: string, format: "md" | "txt" | "json") =>
    `${API_BASE}/api/meetings/${id}/export?format=${format}`,

  // -- transcript --------------------------------------------------------
  transcript: (id: string) => request<Segment[]>(`/meetings/${id}/transcript`),
  searchTranscript: (id: string, q: string) =>
    request<SegmentMatch[]>(`/meetings/${id}/transcript/search${query({ q })}`),
  updateSegment: (meetingId: string, segmentId: string, body: { text?: string; speaker_id?: string | null }) =>
    request<Segment>(`/meetings/${meetingId}/transcript/${segmentId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // -- participants ------------------------------------------------------
  addParticipant: (meetingId: string, body: { name: string; email?: string | null; is_host?: boolean }) =>
    request<Participant>(`/meetings/${meetingId}/participants`, { method: "POST", body: JSON.stringify(body) }),
  updateParticipant: (meetingId: string, participantId: string, body: { name?: string; email?: string | null }) =>
    request<Participant>(`/meetings/${meetingId}/participants/${participantId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  removeParticipant: (meetingId: string, participantId: string) =>
    request<void>(`/meetings/${meetingId}/participants/${participantId}`, { method: "DELETE" }),

  // -- notes -------------------------------------------------------------
  summary: (id: string) => request<Summary>(`/meetings/${id}/summary`),
  updateSummary: (id: string, body: Partial<Pick<Summary, "gist" | "overview" | "bullet_points" | "keywords">>) =>
    request<Summary>(`/meetings/${id}/summary`, { method: "PATCH", body: JSON.stringify(body) }),
  regenerateSummary: (id: string) =>
    request<MeetingDetail>(`/meetings/${id}/summary/regenerate`, { method: "POST" }),
  topics: (id: string) => request<Topic[]>(`/meetings/${id}/topics`),
  insights: (id: string) => request<MeetingInsights>(`/meetings/${id}/insights`),

  // -- action items ------------------------------------------------------
  tasks: (params: { status?: string; assignee?: string; q?: string } = {}) =>
    request<ActionItemWithMeeting[]>(`/tasks${query(params)}`),
  actionItems: (meetingId: string) => request<ActionItem[]>(`/meetings/${meetingId}/action-items`),
  createActionItem: (
    meetingId: string,
    body: { text: string; assignee_id?: string | null; assignee_name?: string | null; priority?: string; due_date?: string | null; timestamp_ms?: number | null },
  ) => request<ActionItem>(`/meetings/${meetingId}/action-items`, { method: "POST", body: JSON.stringify(body) }),
  updateActionItem: (
    id: string,
    body: Partial<Pick<ActionItem, "text" | "status" | "priority" | "assignee_id" | "assignee_name" | "due_date">>,
  ) => request<ActionItem>(`/action-items/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteActionItem: (id: string) => request<void>(`/action-items/${id}`, { method: "DELETE" }),

  // -- engagement --------------------------------------------------------
  comments: (meetingId: string) => request<Comment[]>(`/meetings/${meetingId}/comments`),
  createComment: (meetingId: string, body: { body: string; segment_id?: string | null; timestamp_ms?: number | null }) =>
    request<Comment>(`/meetings/${meetingId}/comments`, { method: "POST", body: JSON.stringify(body) }),
  deleteComment: (id: string) => request<void>(`/comments/${id}`, { method: "DELETE" }),

  soundbites: () => request<SoundbiteWithMeeting[]>("/soundbites"),
  meetingSoundbites: (meetingId: string) => request<Soundbite[]>(`/meetings/${meetingId}/soundbites`),
  createSoundbite: (meetingId: string, body: { title: string; start_ms: number; end_ms: number }) =>
    request<Soundbite>(`/meetings/${meetingId}/soundbites`, { method: "POST", body: JSON.stringify(body) }),
  deleteSoundbite: (id: string) => request<void>(`/soundbites/${id}`, { method: "DELETE" }),

  // -- search ------------------------------------------------------------
  search: (q: string) => request<GlobalSearchResult>(`/search${query({ q })}`),
  ask: (meetingId: string, question: string) =>
    request<AskResponse>(`/meetings/${meetingId}/ask`, { method: "POST", body: JSON.stringify({ question }) }),

  // -- ai skills ---------------------------------------------------------
  skillTemplates: (category?: string) => request<SkillTemplate[]>(`/skills/templates${query({ category })}`),
  skillCategories: () => request<string[]>("/skills/categories"),
  credits: () => request<Credits>("/skills/credits"),

  skills: (params: { enabled?: boolean; category?: string } = {}) =>
    request<Skill[]>(`/skills${query(params)}`),
  skill: (id: string) => request<Skill>(`/skills/${id}`),
  createSkill: (body: SkillPayload) => request<Skill>("/skills", { method: "POST", body: JSON.stringify(body) }),
  updateSkill: (id: string, body: Partial<SkillPayload>) =>
    request<Skill>(`/skills/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteSkill: (id: string) => request<void>(`/skills/${id}`, { method: "DELETE" }),

  /** "Try skill" — real output, nothing persisted, no credit charged. */
  previewSkill: (id: string, limit = 3) =>
    request<SkillPreview>(`/skills/${id}/preview${query({ limit })}`, { method: "POST" }),
  runSkill: (id: string, body: { meeting_id?: string; limit?: number } = {}) =>
    request<SkillRun[]>(`/skills/${id}/run`, { method: "POST", body: JSON.stringify(body) }),

  skillFeed: (params: { skill_id?: string; schedule?: string; category?: string } = {}) =>
    request<SkillRun[]>(`/skills/feed${query(params)}`),
  meetingSkillRuns: (meetingId: string) => request<SkillRun[]>(`/meetings/${meetingId}/skill-runs`),
};

/** Query keys, centralised so invalidation after a mutation can't drift. */
export const queryKeys = {
  me: ["me"] as const,
  tags: ["tags"] as const,
  analytics: ["analytics"] as const,
  meetings: (filters: MeetingFilters) => ["meetings", filters] as const,
  meeting: (id: string) => ["meeting", id] as const,
  tasks: (params: Record<string, unknown>) => ["tasks", params] as const,
  soundbites: ["soundbites"] as const,
  search: (q: string) => ["search", q] as const,
  transcriptSearch: (id: string, q: string) => ["transcript-search", id, q] as const,
  insights: (id: string) => ["insights", id] as const,
  skills: (params: Record<string, unknown>) => ["skills", params] as const,
  skillTemplates: (category?: string) => ["skill-templates", category ?? "all"] as const,
  skillFeed: (params: Record<string, unknown>) => ["skill-feed", params] as const,
  credits: ["credits"] as const,
  meetingSkillRuns: (id: string) => ["meeting-skill-runs", id] as const,
};
