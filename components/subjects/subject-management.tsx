'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, Search } from 'lucide-react'

import type { SchoolSubject } from '@/lib/services/subjects/subject-service'
import { addSchoolSubject } from '@/lib/services/subjects/subject-mutation-service'

type SubjectManagementProps = {
  subjects: SchoolSubject[]
  loadError: string | null
}

export default function SubjectManagement({
  subjects,
  loadError,
}: SubjectManagementProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    status: 'success' | 'error'
    message: string
  } | null>(null)

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return subjects.filter(
      (subject) =>
        subject.nama.toLocaleLowerCase().includes(query) ||
        subject.kode.toLocaleLowerCase().includes(query),
    )
  }, [search, subjects])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    setIsSaving(true)
    setFeedback(null)

    try {
      const result = await addSchoolSubject(code, name)
      setFeedback(result)

      if (result.status === 'success') {
        setCode('')
        setName('')
        router.refresh()
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6a42] dark:text-[#ffd166]">
            Akademik
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d2b23] dark:text-[#e8e5de]">
            Mata Pelajaran
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
            Lihat mata pelajaran aktif dan tambahkan mata pelajaran baru.
          </p>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <form
          className="h-fit rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-6"
          onSubmit={handleSubmit}
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
              <Plus aria-hidden="true" size={19} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                Tambah mata pelajaran
              </h3>
              <p className="mt-0.5 text-xs text-[#718078] dark:text-[#c5c2ba]">
                Isi kode dan nama yang belum digunakan.
              </p>
            </div>
          </div>

          <label
            className="mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]"
            htmlFor="subject-code"
          >
            Kode mapel
          </label>
          <input
            autoCapitalize="characters"
            className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm uppercase text-[#26382e] outline-none transition placeholder:normal-case placeholder:text-[#9aa69f] focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166]"
            id="subject-code"
            maxLength={30}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Contoh: MTK"
            required
            value={code}
          />

          <label
            className="mb-1.5 mt-4 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]"
            htmlFor="subject-name"
          >
            Nama mata pelajaran
          </label>
          <input
            className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition placeholder:text-[#9aa69f] focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166]"
            id="subject-name"
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Matematika"
            required
            value={name}
          />

          {feedback ? (
            <p
              className={`mt-4 rounded-xl border px-3.5 py-3 text-xs leading-5 ${
                feedback.status === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-[#286345] dark:bg-[#183b2c] dark:text-[#b9f4d0]'
                  : 'border-[#f1c7c7] bg-[#fff6f6] text-[#9c2c2c] dark:border-[#713c3c] dark:bg-[#351d22] dark:text-[#ffc5c5]'
              }`}
              role={feedback.status === 'error' ? 'alert' : 'status'}
            >
              {feedback.message}
            </p>
          ) : null}

          <button
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0f5132] px-4 text-sm font-bold text-white transition hover:bg-[#0b4229] disabled:cursor-wait disabled:opacity-60 dark:bg-[#ffd166] dark:text-[#172027] dark:hover:bg-[#ffdc85]"
            disabled={isSaving || Boolean(loadError)}
            type="submit"
          >
            <Plus aria-hidden="true" size={17} />
            {isSaving ? 'Menyimpan…' : 'Simpan mata pelajaran'}
          </button>
          {loadError ? (
            <p className="mt-3 text-xs leading-5 text-amber-800 dark:text-[#ffe0a3]">
              {loadError}
            </p>
          ) : null}
        </form>

        <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
          <div className="flex flex-col gap-3 border-b border-[#e7ece8] p-4 dark:border-[#424242] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h3 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                Mata pelajaran aktif
              </h3>
              <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                {subjects.length.toLocaleString('id-ID')} mata pelajaran
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#829087] dark:text-[#d8d5cd]"
                size={16}
              />
              <input
                aria-label="Cari mata pelajaran"
                className="min-h-10 w-full rounded-xl border border-[#dce5df] bg-white pl-9 pr-3 text-xs text-[#26382e] outline-none placeholder:text-[#9aa69f] focus:border-[#0f5132] dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166]"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama atau kode"
                type="search"
                value={search}
              />
            </div>
          </div>

          {loadError ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                Daftar belum tersedia
              </p>
              <p className="mt-2 text-xs leading-5 text-[#718078] dark:text-[#c5c2ba]">
                {loadError}
              </p>
            </div>
          ) : filteredSubjects.length ? (
            <ul className="divide-y divide-[#edf0ed] dark:divide-[#424242]">
              {filteredSubjects.map((subject) => (
                <li
                  className="flex items-center gap-3 px-4 py-4 transition hover:bg-[#f9fbf9] sm:px-5 dark:hover:bg-[#34434b]/40"
                  key={subject.id}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                    <BookOpen aria-hidden="true" size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                      {subject.nama}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#718078] dark:text-[#c5c2ba]">
                      Kode: {subject.kode}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-12 text-center">
              <BookOpen
                aria-hidden="true"
                className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
                size={27}
              />
              <p className="mt-3 text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                {subjects.length
                  ? 'Mata pelajaran tidak ditemukan'
                  : 'Belum ada mata pelajaran aktif'}
              </p>
              <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                {subjects.length
                  ? 'Coba ubah kata kunci pencarian.'
                  : 'Tambahkan mata pelajaran melalui formulir di samping.'}
              </p>
            </div>
          )}
        </section>
      </section>
    </div>
  )
}
