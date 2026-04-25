export type ChatRecord = {
  id: string
  title: string
  meta: string
  status: string
  messageId?: string
  themeId?: string
}

export type MeditationRecord = {
  id: string
  title: string
  meta: string
  status: string
  durationSeconds?: number
  createdAt?: number
}

export type StoredChatMessage = {
  id: string
  role: 'ai' | 'user'
  text: string
  kind?: 'text' | 'voice'
  durationSeconds?: number
  statusText?: string
  voiceDurationSeconds?: number
  audioFilePath?: string
}

const CHAT_HISTORY_KEY = 'profile_chat_records'
const MEDITATION_HISTORY_KEY = 'profile_meditation_records'
const AI_CHAT_MESSAGES_KEY = 'ai_chat_messages'

function readList<T>(key: string): T[] {
  const stored = wx.getStorageSync(key)
  return Array.isArray(stored) ? (stored as T[]) : []
}

function writeList<T>(key: string, list: T[]) {
  wx.setStorageSync(key, list)
}

export function formatHistoryTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `今天 ${hours}:${minutes}`
}

export function appendChatHistoryRecord(record: ChatRecord) {
  const current = readList<ChatRecord>(CHAT_HISTORY_KEY)
  writeList(CHAT_HISTORY_KEY, [record, ...current].slice(0, 30))
}

export function readChatHistoryRecords() {
  return readList<ChatRecord>(CHAT_HISTORY_KEY)
}

export function appendMeditationHistoryRecord(record: MeditationRecord) {
  const current = readList<MeditationRecord>(MEDITATION_HISTORY_KEY)
  writeList(MEDITATION_HISTORY_KEY, [record, ...current].slice(0, 30))
}

export function readMeditationHistoryRecords() {
  return readList<MeditationRecord>(MEDITATION_HISTORY_KEY)
}

export function writeAiChatMessages(messages: StoredChatMessage[]) {
  writeList(AI_CHAT_MESSAGES_KEY, messages)
}

export function readAiChatMessages() {
  return readList<StoredChatMessage>(AI_CHAT_MESSAGES_KEY)
}
