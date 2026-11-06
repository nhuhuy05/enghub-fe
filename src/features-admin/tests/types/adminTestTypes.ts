export interface TestCollection {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export type WorkflowStatus =
  | 'draft'
  | 'media_uploaded'
  | 'imported'
  | 'reviewing'
  | 'preview_ready'
  | 'published';

export type ReviewStatus = 'needs_review' | 'reviewed';

export interface Test {
  id: number;
  collection_id: number | null;
  collection_name: string | null;
  test_number: number | null;
  title: string;
  description: string;
  total_questions: number;
  duration_minutes: number;
  is_published: boolean;
  workflow_status?: WorkflowStatus;
  created_at: string;
}

export interface MediaAsset {
  id: number;
  test_id: number;
  label: string;
  media_type: 'image' | 'audio';
  cloudinary_public_id: string;
  url: string;
  duration_ms: number | null;
  original_filename: string;
  created_at: string;
}

export interface AudioRange {
  id: number;
  question_group_id: number;
  part_number: number;
  group_order: number;
  media_asset_id: number;
  start_ms: number;
  end_ms: number | null;
}

export interface QuestionGroupSummary {
  id: number;
  part_number: number;
  group_order: number;
  question_numbers: string;
  review_status: ReviewStatus;
  missing_flags: string[];
}

export interface GroupImage {
  id?: number;
  media_asset_id: number;
  label?: string | null;
  url?: string | null;
  order_index: number;
}

export interface GroupAudio {
  id?: number;
  media_asset_id: number;
  label?: string | null;
  url?: string | null;
  start_ms: number | null;
  end_ms: number | null;
  transcript_en: string | null;
  transcript_vi: string | null;
}

export interface GroupPassage {
  id?: number;
  media_asset_id: number | null;
  label?: string | null;
  url?: string | null;
  title: string | null;
  passage_type: 'image' | 'text' | string;
  content_format: 'image' | 'text' | string;
  content_en: string | null;
  content_vi: string | null;
  vocab_hints: string | null;
  order_index: number;
}

export interface GroupAnswer {
  id: number;
  label: 'A' | 'B' | 'C' | 'D' | string;
  answer_text_en: string | null;
  answer_text_vi: string | null;
  is_correct: boolean;
}

export interface GroupQuestion {
  id: number;
  question_number: number;
  question_text_en: string | null;
  question_text_vi: string | null;
  explanation_vi: string | null;
  answers: GroupAnswer[];
}

export interface QuestionGroupDetail {
  id: number;
  part_number: number;
  group_order: number;
  question_numbers?: string;
  review_status: ReviewStatus;
  missing_flags?: string[];
  images: GroupImage[];
  audio: GroupAudio | null;
  passages: GroupPassage[];
  questions: GroupQuestion[];
}

export interface PatchGroupImageInput {
  media_asset_id: number;
  order_index: number;
}

export interface PatchGroupAudioInput {
  media_asset_id: number | null;
  start_ms: number | null;
  end_ms: number | null;
  transcript_en: string | null;
  transcript_vi: string | null;
}

export interface PatchGroupTranscriptInput {
  transcript_en: string | null;
  transcript_vi: string | null;
}

export interface PatchGroupPassageInput {
  media_asset_id: number | null;
  title: string | null;
  passage_type: 'image' | 'text' | string;
  content_format: 'image' | 'text' | string;
  content_en: string | null;
  content_vi: string | null;
  vocab_hints: string | null;
  order_index: number;
}

export interface PatchQuestionInput {
  question_text_en: string | null;
  question_text_vi: string | null;
  explanation_vi: string | null;
}

export interface PatchAnswerInput {
  answer_text_en: string | null;
  answer_text_vi: string | null;
  is_correct: boolean;
}

export interface GenerateGroupAiSupportInput {
  transcript: boolean;
  question_translation: boolean;
  explanation: boolean;
  overwrite: boolean;
}

export interface ImportSummary {
  total_rows: number;
  valid_rows: number;
  error_count: number;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
  errors: ImportError[];
}

export interface PreviewResult {
  test_id: number;
  question_count: number;
  invalid_correct_answer_count: number;
  part1_missing_image_count: number;
  listening_missing_audio_range_count: number;
  reading_missing_passage_count: number;
  publishable: boolean;
  errors: string[];
}

export interface PreviewPart {
  part_number: number;
  title: string;
  groups: QuestionGroupDetail[];
}

export interface PreviewContent {
  test_id: number;
  title: string;
  description: string;
  duration_minutes: number;
  parts: PreviewPart[];
}

export interface PublishResult {
  success: boolean;
  is_published: boolean;
  errors: string[];
}

export interface MediaAutoLinkResult {
  linked_audios: number;
  linked_images: number;
  linked_passages: number;
  total_groups: number;
}
