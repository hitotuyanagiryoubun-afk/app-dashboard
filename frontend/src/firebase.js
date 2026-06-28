import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL

export const isFirebaseConfigured = !!(apiKey && databaseURL)

export let db = null

if (isFirebaseConfigured) {
  const firebaseConfig = {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
  const app = initializeApp(firebaseConfig)
  db = getDatabase(app)
}
