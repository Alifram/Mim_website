import { isRecord } from '@/lib/services/grades/teacher-grade-types'

export type PaymentStudent = {
  id: number
  nama_lengkap: string
  kelas_nama: string | null
}

export type ParentLinkedStudent = PaymentStudent

export type PaymentCategory = {
  code: string
  name: string
}

export type PaymentTransaction = {
  id: number
  student_id: number
  student_name: string
  category_code: string
  category_name: string
  amount: number
  paid_at: string
  note: string | null
  recorded_by_name: string
}

export type PaymentCategoryTotal = {
  category_code: string
  category_name: string
  amount: number
  transaction_count: number
}

export type MonthlyPaymentReport = {
  year: number
  month: number
  transactions: PaymentTransaction[]
  totals: PaymentCategoryTotal[]
  total_amount: number
}

export type ParentPaymentPageData = {
  students: ParentLinkedStudent[]
  selectedStudentId: number | null
  report: MonthlyPaymentReport | null
  reportError: string | null
}

export type ParentPaymentPageResult =
  | { status: 'success'; data: ParentPaymentPageData }
  | { status: 'error'; message: string }

export type FinancePaymentPageData = {
  categories: PaymentCategory[]
  students: PaymentStudent[]
  report: MonthlyPaymentReport | null
  reportError: string | null
}

export type FinancePaymentPageResult =
  | { status: 'success'; data: FinancePaymentPageData }
  | { status: 'error'; message: string }

function parseInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value)
    if (Number.isSafeInteger(parsed)) return parsed
  }
  return null
}

function parseAmount(value: unknown): number | null {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !value.trim())
  ) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function parsePaymentStudents(
  value: unknown,
): PaymentStudent[] | null {
  if (!isRecord(value) || value.status !== 'success' || !Array.isArray(value.data)) {
    return null
  }

  const students: PaymentStudent[] = []
  for (const row of value.data) {
    if (
      !isRecord(row) ||
      parseInteger(row.id) === null ||
      parseInteger(row.id)! <= 0 ||
      typeof row.nama_lengkap !== 'string' ||
      !row.nama_lengkap.trim() ||
      (row.kelas_nama !== null && typeof row.kelas_nama !== 'string')
    ) {
      return null
    }

    students.push({
      id: parseInteger(row.id)!,
      nama_lengkap: row.nama_lengkap,
      kelas_nama: row.kelas_nama,
    })
  }

  return students
}

export const parseParentLinkedStudents = parsePaymentStudents

export function parsePaymentCategories(value: unknown): PaymentCategory[] | null {
  if (!isRecord(value) || value.status !== 'success' || !Array.isArray(value.data)) {
    return null
  }

  const categories: PaymentCategory[] = []
  for (const row of value.data) {
    if (
      !isRecord(row) ||
      typeof row.code !== 'string' ||
      !row.code.trim() ||
      typeof row.name !== 'string' ||
      !row.name.trim()
    ) {
      return null
    }

    categories.push({ code: row.code, name: row.name })
  }

  return categories
}

export function parseMonthlyPaymentReport(
  value: unknown,
): MonthlyPaymentReport | null {
  if (
    !isRecord(value) ||
    value.status !== 'success' ||
    parseInteger(value.year) === null ||
    parseInteger(value.month) === null ||
    !Array.isArray(value.transactions) ||
    !Array.isArray(value.totals)
  ) {
    return null
  }

  const transactions: PaymentTransaction[] = []
  for (const row of value.transactions) {
    if (
      !isRecord(row) ||
      parseInteger(row.id) === null ||
      parseInteger(row.student_id) === null ||
      typeof row.student_name !== 'string' ||
      typeof row.category_code !== 'string' ||
      typeof row.category_name !== 'string' ||
      parseAmount(row.amount) === null ||
      typeof row.paid_at !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.paid_at) ||
      (row.note !== null && typeof row.note !== 'string') ||
      typeof row.recorded_by_name !== 'string'
    ) {
      return null
    }

    transactions.push({
      id: parseInteger(row.id)!,
      student_id: parseInteger(row.student_id)!,
      student_name: row.student_name,
      category_code: row.category_code,
      category_name: row.category_name,
      amount: parseAmount(row.amount)!,
      paid_at: row.paid_at,
      note: row.note,
      recorded_by_name: row.recorded_by_name,
    })
  }

  const totals: PaymentCategoryTotal[] = []
  for (const row of value.totals) {
    if (
      !isRecord(row) ||
      typeof row.category_code !== 'string' ||
      typeof row.category_name !== 'string' ||
      parseAmount(row.amount) === null ||
      parseInteger(row.transaction_count) === null ||
      parseInteger(row.transaction_count)! < 0
    ) {
      return null
    }

    totals.push({
      category_code: row.category_code,
      category_name: row.category_name,
      amount: parseAmount(row.amount)!,
      transaction_count: parseInteger(row.transaction_count)!,
    })
  }

  const totalAmount = parseAmount(value.total_amount)
  if (totalAmount === null) return null

  return {
    year: parseInteger(value.year)!,
    month: parseInteger(value.month)!,
    transactions,
    totals,
    total_amount: totalAmount,
  }
}
