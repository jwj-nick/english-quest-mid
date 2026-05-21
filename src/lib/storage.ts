import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { SessionLog } from '@/types/game'

interface EQDB extends DBSchema {
  sessions: {
    key: string
    value: SessionLog
    indexes: { 'by-startedAt': string; 'by-area': string }
  }
  kv: {
    key: string
    value: unknown
  }
}

const DB_NAME = 'english-quest-mid'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<EQDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<EQDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const store = db.createObjectStore('sessions', { keyPath: 'id' })
          store.createIndex('by-startedAt', 'startedAt')
          store.createIndex('by-area', 'area')
        }
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv')
        }
      },
    })
  }
  return dbPromise
}

export const storage = {
  async addSession(log: SessionLog) {
    const db = await getDb()
    await db.add('sessions', log)
  },
  async getAllSessions(): Promise<SessionLog[]> {
    const db = await getDb()
    return db.getAll('sessions')
  },
  async sessionsByArea(area: string): Promise<SessionLog[]> {
    const db = await getDb()
    return db.getAllFromIndex('sessions', 'by-area', area)
  },
  async setKv<T>(key: string, value: T) {
    const db = await getDb()
    await db.put('kv', value, key)
  },
  async getKv<T>(key: string): Promise<T | undefined> {
    const db = await getDb()
    return (await db.get('kv', key)) as T | undefined
  },
  async clearAll() {
    const db = await getDb()
    await db.clear('sessions')
    await db.clear('kv')
  },
  async exportJSON() {
    const sessions = await this.getAllSessions()
    return JSON.stringify({ exportedAt: new Date().toISOString(), sessions }, null, 2)
  },
}
