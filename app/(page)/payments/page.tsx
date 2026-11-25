import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import FinancePaymentView from '@/components/payments/finance-payment-view'
import ParentPaymentView from '@/components/payments/parent-payment-view'
import FeaturePlaceholder from '@/components/portal/feature-placeholder'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import { getFinancePaymentPageData } from '@/lib/services/payments/finance-payment-service'
import { getParentPaymentPageData } from '@/lib/services/payments/parent-payment-service'

export default function PaymentsPage() {
  return (
    <Suspense fallback={<PaymentsFallback />}>
      <PaymentsContent />
    </Suspense>
  )
}

async function PaymentsContent() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') {
    redirect('/login')
  }
  if (profileResult.status !== 'authenticated') {
    return (
      <PaymentsMessage>
        Profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses.
      </PaymentsMessage>
    )
  }

  const role = profileResult.profile.role.trim().toLowerCase()
  if (role === 'orang_tua') {
    const currentMonthParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(new Date())
    const currentMonthValues = Object.fromEntries(
      currentMonthParts.map(({ type, value }) => [type, value]),
    )
    const year = Number(currentMonthValues.year)
    const month = Number(currentMonthValues.month)
    const initialMonth = `${currentMonthValues.year}-${currentMonthValues.month}`
    const result = await getParentPaymentPageData(year, month)

    if (result.status === 'error') {
      return <PaymentsMessage>{result.message}</PaymentsMessage>
    }

    return (
      <ParentPaymentView
        initialMonth={initialMonth}
        initialReport={result.data.report}
        initialReportError={result.data.reportError}
        initialStudentId={result.data.selectedStudentId}
        parentName={profileResult.profile.nama_lengkap}
        students={result.data.students}
      />
    )
  }

  if (role !== 'petugas_keuangan') {
    return (
      <FeaturePlaceholder
        description="Lihat informasi pembayaran sekolah sesuai dengan hak akses akun."
        title="Pembayaran"
      />
    )
  }

  const currentDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const currentDateValues = Object.fromEntries(
    currentDate.map(({ type, value }) => [type, value]),
  )
  const year = Number(currentDateValues.year)
  const month = Number(currentDateValues.month)
  const initialMonth = `${currentDateValues.year}-${currentDateValues.month}`
  const initialDate = `${initialMonth}-${currentDateValues.day}`
  const result = await getFinancePaymentPageData(year, month)

  if (result.status === 'error') {
    return <PaymentsMessage>{result.message}</PaymentsMessage>
  }

  return (
    <FinancePaymentView
      categories={result.data.categories}
      initialDate={initialDate}
      initialMonth={initialMonth}
      initialReport={result.data.report}
      initialReportError={result.data.reportError}
      initialStudentId={result.data.students[0]?.id ?? null}
      staffName={profileResult.profile.nama_lengkap}
      students={result.data.students}
    />
  )
}

function PaymentsMessage({ children }: { children: string }) {
  return (
    <p
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
      role="alert"
    >
      {children}
    </p>
  )
}

function PaymentsFallback() {
  return (
    <div
      aria-busy="true"
      className="rounded-2xl border border-[#e5ebe7] bg-white p-6 text-sm text-[#65736a] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
      role="status"
    >
      Memuat data pembayaran…
    </div>
  )
}