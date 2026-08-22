/** Mirrors the Pydantic response models in `backend/app/schemas.py`. */

export type Sentiment = "positive" | "neutral" | "negative";
export type TaskStatus = "open" | "completed";
export type Priority = "low" | "medium" | "high";
export type AvatarColor =
  | "purple" | "blue" | "pink" | "orange" | "green"
  | "teal" | "indigo" | "cyan" | "yellow" | "red";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  initials: string | null;
  job_title: string | null;
  timezone: string;
}

export interface LoginResponse {
  token: string;
  expires_at: string;
  provider: string;
  user: User;
}

export interface SessionInfo {
  id: string;
  provider: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  user: User;
}

export interface Participant {
  id: string;
  name: string;
  email: string | null;
  speaker_label: string;
  is_host: boolean;
  talk_time_seconds: number;
  color: AvatarColor;
  order_index: number;
}

export interface Segment {
  id: string;
  order_index: number;
  speaker_id: string | null;
  speaker_name: string;
  start_ms: number;
  end_ms: number;
  text: string;
  sentiment: string | null;
}

export interface SegmentMatch {
  segment_id: string;
  meeting_id: string;
  meeting_title: string;
  speaker_name: string;
  start_ms: number;
  text: string;
  snippet: string;
}

export interface Summary {
  id: string;
  gist: string | null;
  overview: string | null;
  bullet_points: string[];
  keywords: string[];
  questions: string[];
  sentiment: Sentiment;
  generated_by: string;
  model_name: string | null;
  updated_at: string;
}

export interface Topic {
  id: string;
  title: string;
  bullets: string[];
  start_ms: number;
  end_ms: number;
  order_index: number;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  text: string;
  assignee_id: string | null;
  assignee_name: string | null;
  due_date: string | null;
  status: TaskStatus;
  priority: Priority;
  source: string;
  timestamp_ms: number | null;
  order_index: number;
  created_at: string;
  completed_at: string | null;
}

export interface ActionItemWithMeeting extends ActionItem {
  meeting_title: string;
  meeting_date: string;
}

export interface Comment {
  id: string;
  meeting_id: string;
  segment_id: string | null;
  author_name: string;
  body: string;
  timestamp_ms: number | null;
  created_at: string;
}

export interface Soundbite {
  id: string;
  meeting_id: string;
  title: string;
  start_ms: number;
  end_ms: number;
  transcript_excerpt: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface SoundbiteWithMeeting extends Soundbite {
  meeting_title: string;
}

export interface Tag {
  id: string;
  name: string;
  color: AvatarColor;
}

export interface TagCount extends Tag {
  meeting_count: number;
}

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  duration_seconds: number;
  source: string;
  media_url: string | null;
  media_type: string;
  language: string;
  status: string;
  is_favorite: boolean;
  privacy: string;
  created_at: string;
  updated_at: string;
  owner: User;
  participants: Participant[];
  tags: Tag[];
  gist: string | null;
  action_item_count: number;
  open_action_item_count: number;
  segment_count: number;
}

export interface MeetingDetail extends Meeting {
  segments: Segment[];
  summary: Summary | null;
  topics: Topic[];
  action_items: ActionItem[];
  comments: Comment[];
  soundbites: Soundbite[];
}

export interface MeetingPage {
  items: Meeting[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface GlobalSearchResult {
  meetings: Meeting[];
  segments: SegmentMatch[];
  action_items: ActionItemWithMeeting[];
  total: number;
}

export interface SpeakerShare {
  name: string;
  seconds: number;
  percent: number;
  color: AvatarColor;
}

export interface AnalyticsOverview {
  total_meetings: number;
  total_duration_seconds: number;
  total_participants: number;
  open_action_items: number;
  completed_action_items: number;
  meetings_this_week: number;
  average_duration_seconds: number;
  top_speakers: SpeakerShare[];
  meetings_by_day: { date: string; count: number }[];
  top_keywords: { keyword: string; count: number }[];
}

export interface InsightHit {
  segment_id: string | null;
  start_ms: number | null;
  speaker_name: string | null;
  text: string;
  values: string[];
}

export interface InsightFilter {
  key: string;
  label: string;
  color: AvatarColor;
  count: number;
  hits: InsightHit[];
}

export interface SentimentSlice {
  label: string;
  count: number;
  percent: number;
}

export interface SpeakerStat {
  participant_id: string;
  name: string;
  color: AvatarColor;
  talk_time_seconds: number;
  talk_time_percent: number;
  words: number;
  wpm: number;
}

export interface MeetingInsights {
  filters: InsightFilter[];
  sentiment: SentimentSlice[];
  speakers: SpeakerStat[];
  topic_trackers: string[];
  word_count: number;
  segment_count: number;
}

export interface AskResponse {
  answer: string;
  citations: SegmentMatch[];
  generated_by: string;
}

export interface MeetingFilters {
  q?: string;
  participant?: string;
  tag?: string;
  date_from?: string;
  date_to?: string;
  favorite?: boolean;
  source?: string;
  sort?: "recent" | "oldest" | "title" | "duration" | "created";
  page?: number;
  page_size?: number;
}
