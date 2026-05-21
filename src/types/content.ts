/**
 * 콘텐츠 JSON 타입 — SCHEMA.md v1.0 미러
 * `01_Initial_Trial/sample/SCHEMA.md` 참조
 */

export type AreaKey =
  | 'vocabulary'
  | 'listening'
  | 'reading'
  | 'speaking_shadowing'
  | 'speaking_qa'
  | 'speaking_roleplay'
  | 'writing'

export interface WeekMeta {
  week: string
  start_date: string
  end_date: string
  theme: string
  theme_description_ko: string
  targets: Record<string, { goal_completions: number; available_items: number }>
  xp_weights: Record<string, number>
  buffs_from_last_week: string[]
  notes_from_retrospective: string
}

export interface VocabItem {
  id: string
  word: string
  pos: string
  ipa: string
  korean: string
  definition_en: string
  example_en: string
  example_ko: string
  synonyms: string[]
  antonyms: string[]
  difficulty: number
  frequency: 'high' | 'mid' | 'low'
  tags: string[]
  audio: string
  /** 옵션: 단어 시각화 이미지 상대 경로 (예: "images/vocab_w31_001.webp") */
  image_url?: string
}

export interface VocabularyFile {
  week: string
  theme: string
  items: VocabItem[]
}

export interface ListeningQuestion {
  id: string
  type: 'multiple_choice' | 'fill_blank' | 'true_false'
  question_ko: string
  options?: string[]
  correct_index?: number
  answer?: string
  alternatives?: string[]
  explanation_ko: string
}

export interface ListeningItem {
  id: string
  type: 'dialogue' | 'monologue' | 'lecture'
  title: string
  duration_seconds: number
  transcript_en: string
  transcript_ko: string
  audio: string
  audio_slow: string
  questions: ListeningQuestion[]
  difficulty: number
  tags: string[]
}

export interface ListeningFile {
  week: string
  items: ListeningItem[]
}

export interface ReadingQuestion {
  id: string
  type: 'main_idea' | 'blank' | 'vocabulary' | 'true_false' | 'inference'
  question_ko: string
  options: string[]
  correct_index: number
  explanation_ko: string
}

export interface ReadingItem {
  id: string
  title: string
  passage_en: string
  passage_ko: string
  word_count: number
  topic: string
  difficulty: number
  questions: ReadingQuestion[]
  vocabulary_notes: { word: string; meaning_ko: string }[]
  tags: string[]
  /** 옵션: 지문 hero 이미지 상대 경로 */
  image_url?: string
}

export interface ReadingFile {
  week: string
  items: ReadingItem[]
}

export interface ShadowingItem {
  id: string
  sentence_en: string
  sentence_ko: string
  audio_normal: string
  audio_slow: string
  phonetics_focus: string[]
  difficulty: number
  tags: string[]
}

export interface QAItem {
  id: string
  question_en: string
  question_ko: string
  audio_question: string
  expected_keywords: string[]
  sample_answer_en: string
  difficulty: number
  tags: string[]
}

export interface RoleplayItem {
  id: string
  title: string
  scenario_ko: string
  your_role: string
  ai_role: string
  ai_persona: string
  opening_line_en: string
  opening_audio: string
  goal: string
  min_turns: number
  max_turns: number
  vocabulary_hints: string[]
  system_prompt_for_llm: string
  difficulty: number
  tags: string[]
}

export interface WritingItem {
  id: string
  type: 'topic' | 'image' | 'translation' | 'grammar'
  prompt_ko: string
  prompt_en: string
  target_length_words: [number, number]
  grammar_focus: string[]
  vocabulary_suggestions: string[]
  sample_answer_en: string
  difficulty: number
  tags: string[]
}

export interface BossBattle {
  week: string
  boss_name: string
  boss_description_ko: string
  boss_emoji: string
  stages: {
    stage: number
    type: string
    description_ko: string
    config: Record<string, unknown>
  }[]
  reward: { xp: number; buff_next_week: string }
}
