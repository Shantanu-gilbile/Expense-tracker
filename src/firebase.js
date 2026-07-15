import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAK-4ZGDVo5Bo6JRvZmnLH3hWiuvy_ubNk',
  authDomain: 'expense-tracker-16021.firebaseapp.com',
  projectId: 'expense-tracker-16021',
  storageBucket: 'expense-tracker-16021.firebasestorage.app',
  messagingSenderId: '113978488034',
  appId: '1:113978488034:web:c3b8235998ef594dd4dabb',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
