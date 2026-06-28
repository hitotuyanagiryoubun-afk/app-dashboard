import { readFileSync } from 'fs'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, push } from 'firebase/database'
import dotenv from 'dotenv'
dotenv.config()

const app = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
})
const db = getDatabase(app)

const docs = [
  {
    title: '万能・アプリ機能磨き上げ実装プロンプト',
    file: 'C:\\Users\\user\\AndroidStudioProjects\\万能・アプリ機能磨き上げ実装プロンプト.md',
  },
  {
    title: '超極限・Androidアプリ磨き上げ指示書',
    file: 'C:\\Users\\user\\AndroidStudioProjects\\超極限・Androidアプリ磨き上げ指示書.md',
  },
]

const now = new Date().toISOString()
for (const doc of docs) {
  const content = readFileSync(doc.file, 'utf-8')
  await push(ref(db, 'docs'), { title: doc.title, content, createdAt: now, updatedAt: now })
  console.log(`✓ ${doc.title}`)
}
console.log('✅ 完了')
process.exit(0)
