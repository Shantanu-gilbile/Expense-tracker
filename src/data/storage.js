import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

export const UNCATEGORIZED = 'Uncategorized'

const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#ea580c' },
  { name: 'Transport', color: '#3b82f6' },
  { name: 'Shopping', color: '#ec4899' },
  { name: 'Bills', color: '#ef4444' },
  { name: 'Entertainment', color: '#8b5cf6' },
]

const CHUNK_SIZE = 450

function categoriesRef(uid) {
  return collection(db, 'users', uid, 'categories')
}

function transactionsRef(uid) {
  return collection(db, 'users', uid, 'transactions')
}

async function commitInChunks(applyOp, items) {
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db)
    items.slice(i, i + CHUNK_SIZE).forEach((item) => applyOp(batch, item))
    await batch.commit()
  }
}

export async function getCategories(uid) {
  const snapshot = await getDocs(categoriesRef(uid))
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function seedDefaultCategoriesIfEmpty(uid) {
  const existing = await getDocs(categoriesRef(uid))
  if (!existing.empty) return

  const batch = writeBatch(db)
  DEFAULT_CATEGORIES.forEach((category) => {
    batch.set(doc(categoriesRef(uid)), category)
  })
  await batch.commit()
}

export async function getTransactions(uid) {
  const q = query(transactionsRef(uid), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => {
    const { createdAt, ...data } = d.data()
    return { id: d.id, ...data }
  })
}

export async function addTransaction(uid, transaction) {
  const docRef = await addDoc(transactionsRef(uid), {
    ...transaction,
    createdAt: serverTimestamp(),
  })
  return { id: docRef.id, ...transaction }
}

export async function deleteTransaction(uid, transactionId) {
  await deleteDoc(doc(transactionsRef(uid), transactionId))
}

export async function addCategory(uid, name, color) {
  const existing = await getDocs(query(categoriesRef(uid), where('name', '==', name)))
  if (!existing.empty) return getCategories(uid)

  await addDoc(categoriesRef(uid), { name, color })
  return getCategories(uid)
}

export async function updateCategory(uid, categoryId, oldName, { name, color }) {
  await updateDoc(doc(categoriesRef(uid), categoryId), { name, color })

  if (name !== oldName) {
    const affected = await getDocs(query(transactionsRef(uid), where('category', '==', oldName)))
    await commitInChunks(
      (batch, docSnap) => batch.update(docSnap.ref, { category: name }),
      affected.docs,
    )
  }

  return getCategories(uid)
}

export async function deleteCategory(uid, categoryId, categoryName) {
  await deleteDoc(doc(categoriesRef(uid), categoryId))

  const affected = await getDocs(
    query(transactionsRef(uid), where('category', '==', categoryName)),
  )
  await commitInChunks(
    (batch, docSnap) => batch.update(docSnap.ref, { category: UNCATEGORIZED }),
    affected.docs,
  )
}

export async function exportData(uid) {
  const [categories, transactions] = await Promise.all([getCategories(uid), getTransactions(uid)])
  return {
    categories: categories.map(({ name, color }) => ({ name, color })),
    transactions: transactions.map(({ amount, category, date, description }) => ({
      amount,
      category,
      date,
      description,
    })),
  }
}

export async function importData(uid, { categories, transactions }) {
  const [existingCategories, existingTransactions] = await Promise.all([
    getDocs(categoriesRef(uid)),
    getDocs(transactionsRef(uid)),
  ])

  await commitInChunks((batch, docSnap) => batch.delete(docSnap.ref), existingCategories.docs)
  await commitInChunks((batch, docSnap) => batch.delete(docSnap.ref), existingTransactions.docs)

  await commitInChunks(
    (batch, category) => batch.set(doc(categoriesRef(uid)), category),
    categories,
  )
  await commitInChunks(
    (batch, transaction) =>
      batch.set(doc(transactionsRef(uid)), { ...transaction, createdAt: serverTimestamp() }),
    transactions,
  )
}
