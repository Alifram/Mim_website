'use client'

import { useMemo, useState } from 'react'
import { Search, UsersRound } from 'lucide-react'

import type { AdminStudent } from '@/lib/services/classes/class-service'

type ClassRosterProps = {
  students: AdminStudent[]
}

export default function ClassRoster({ students }: ClassRosterProps) {
  const [query, setQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')

  const classNames = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .map((student) => student.kelas_nama)
            .filter((name): name is string => Boolean(name)),
        ),
      ).sort(),
    [students],
  )

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return students.filter((student) => {
      const matchesClass =
        selectedClass === 'all'
          ? true
          : selectedClass === 'unassigned'
            ? student.kelas_nama === null
            : student.kelas_nama === selectedClass
      const searchableText = [
        student.nama_lengkap,
        student.nomor_induk,
        student.kelas_nama ?? '',
        student.tahun_angkatan?.toString() ?? '',
      ]
        .join(' ')
        .toLocaleLowerCase()

      return matchesClass && searchableText.includes(normalizedQuery)
    })
  }, [query, selectedClass, students])

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6a42] dark:text-[#ffd166]">
            Administrasi
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d2b23] dark:text-[#e8e5de]">
            Data Kelas
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
            Daftar siswa aktif beserta kelas dan tahun angkatannya.
          </p>
        </div>

        <div className="flex min-w-48 items-center gap-3 rounded-2xl border border-[#e5ebe7] bg-white px-4 py-3 dark:border-[#616161] dark:bg-[#1c2d35]">
          <span className="grid size-10 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
            <UsersRound aria-hidden="true" size={19} />
          </span>
          <div>
            <p className="text-xl font-bold leading-none text-[#1d2b23] dark:text-[#e8e5de]">
              {students.length.toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-[11px] text-[#718078] dark:text-[#c5c2ba]">
              Siswa aktif
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
        <div className="flex flex-col gap-3 border-b border-[#e7ece8] p-4 dark:border-[#424242] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative w-full sm:max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#829087] dark:text-[#d8d5cd]"
              size={17}
            />
            <input
              aria-label="Cari siswa"
              className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-white pl-10 pr-3 text-sm text-[#26382e] outline-none transition placeholder:text-[#9aa69f] focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:placeholder:text-[#aaa79f] dark:focus:border-[#ffd166] dark:focus:ring-[#ffd166]/10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, nomor induk, atau kelas"
              type="search"
              value={query}
            />
          </div>

          <label className="flex w-full items-center gap-2 sm:w-auto">
            <span className="shrink-0 text-xs font-medium text-[#718078] dark:text-[#c5c2ba]">
              Kelas
            </span>
            <select
              aria-label="Filter berdasarkan kelas"
              className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3 text-sm text-[#26382e] outline-none focus:border-[#0f5132] sm:min-w-44 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166]"
              onChange={(event) => setSelectedClass(event.target.value)}
              value={selectedClass}
            >
              <option value="all">Semua kelas</option>
              {classNames.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
              {students.some((student) => student.kelas_nama === null) ? (
                <option value="unassigned">Belum ditempatkan</option>
              ) : null}
            </select>
          </label>
        </div>

        {filteredStudents.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#f7f9f7] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718078] dark:bg-[#111b21] dark:text-[#c5c2ba]">
                    <th className="px-5 py-3.5" scope="col">
                      Siswa
                    </th>
                    <th className="px-5 py-3.5" scope="col">
                      Nomor induk
                    </th>
                    <th className="px-5 py-3.5" scope="col">
                      Kelas
                    </th>
                    <th className="px-5 py-3.5" scope="col">
                      Angkatan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0ed] dark:divide-[#424242]">
                  {filteredStudents.map((student) => (
                    <tr
                      className="transition hover:bg-[#f9fbf9] dark:hover:bg-[#34434b]/40"
                      key={student.id}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf3ed] text-xs font-bold text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                            {student.nama_lengkap
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join('')
                              .toUpperCase()}
                          </span>
                          <span className="text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                            {student.nama_lengkap}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#65736a] dark:text-[#c5c2ba]">
                        {student.nomor_induk}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-[#eaf3ed] px-2.5 py-1 text-xs font-semibold text-[#0f5132] dark:bg-[#34434b] dark:text-[#e8e5de]">
                          {student.kelas_nama ?? 'Belum ditempatkan'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#65736a] dark:text-[#c5c2ba]">
                        {student.tahun_angkatan ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="border-t border-[#e7ece8] px-5 py-3 text-xs text-[#718078] dark:border-[#424242] dark:text-[#c5c2ba]">
              Menampilkan {filteredStudents.length.toLocaleString('id-ID')} dari{' '}
              {students.length.toLocaleString('id-ID')} siswa.
            </p>
          </>
        ) : (
          <div className="px-5 py-14 text-center">
            <UsersRound
              aria-hidden="true"
              className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
              size={28}
            />
            <h3 className="mt-3 text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
              {students.length ? 'Siswa tidak ditemukan' : 'Belum ada siswa aktif'}
            </h3>
            <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
              {students.length
                ? 'Coba ubah kata kunci atau filter kelas.'
                : 'Siswa aktif akan muncul di daftar ini.'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
