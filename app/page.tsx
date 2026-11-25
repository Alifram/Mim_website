import { Suspense, type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeRedirect />
    </Suspense>
  )
}

async function HomeRedirect(): Promise<ReactNode> {
  await connection()
  return redirect('/login')
}

function HomeFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f9f7] p-6 dark:bg-[#0b141a]">
      <p
        className="rounded-2xl border border-[#e5ebe7] bg-white px-6 py-4 text-sm text-[#65736a] shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
        role="status"
      >
        Membuka portal sekolah…
      </p>
    </main>
  )
}
