'use client'

import { useMemo, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Printer,
} from 'lucide-react'

import type { StudentReportGrade } from '@/lib/services/grades/student-report-types'

type StudentReportCardViewProps = {
  studentName: string
  studentNumber: string | null
  report: StudentReportGrade[]
}

type ReportGroup = {
  key: string
  academicYear: string
  semester: number
  className: string
  grades: StudentReportGrade[]
}

function formatScore(score: number | null) {
  if (score === null) return '—'
  return score.toLocaleString('id-ID', { maximumFractionDigits: 1 })
}

function formatPrintDate() {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(new Date())
}

function getAcademicYearStart(academicYear: string) {
  const year = Number(/^\d{4}/.exec(academicYear)?.[0])
  return Number.isSafeInteger(year) ? year : 0
}

function formatClassName(className: string) {
  return /^kelas\b/i.test(className.trim()) ? className : `Kelas ${className}`
}

function groupReport(report: StudentReportGrade[]): ReportGroup[] {
  const groups = new Map<string, ReportGroup>()

  for (const grade of report) {
    const key = JSON.stringify([
      grade.tahun_ajaran,
      grade.semester,
      grade.kelas,
    ])
    const group = groups.get(key)
    if (group) {
      group.grades.push(grade)
    } else {
      groups.set(key, {
        key,
        academicYear: grade.tahun_ajaran,
        semester: grade.semester,
        className: grade.kelas,
        grades: [grade],
      })
    }
  }

  return Array.from(groups.values()).sort(
    (first, second) =>
      getAcademicYearStart(second.academicYear) -
        getAcademicYearStart(first.academicYear) ||
      second.semester - first.semester ||
      first.className.localeCompare(second.className, 'id', { numeric: true }),
  )
}

function GradeStatus({ complete }: { complete: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
        complete
          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
          : 'bg-amber-50 text-amber-900 dark:bg-[#3b3020] dark:text-[#ffe0a3]'
      }`}
    >
      {complete ? (
        <CheckCircle2 aria-hidden="true" size={13} />
      ) : (
        <CircleAlert aria-hidden="true" size={13} />
      )}
      {complete ? 'Lengkap' : 'Belum lengkap'}
    </span>
  )
}

function ScoreItem({ label, score }: { label: string; score: number | null }) {
  return (
    <div className="student-report-score rounded-xl border border-[#e5ebe7] bg-[#f8faf8] px-2 py-2.5 text-center dark:border-[#424242] dark:bg-[#111b21]">
      <p className="text-[10px] leading-4 text-[#718078] dark:text-[#c5c2ba]">
        {label}
      </p>
      <p
        aria-label={score === null ? `${label}: belum diisi` : undefined}
        className="mt-1 text-sm font-bold text-[#26382e] dark:text-[#e8e5de]"
      >
        {formatScore(score)}
      </p>
    </div>
  )
}

export default function StudentReportCardView({
  studentName,
  studentNumber,
  report,
}: StudentReportCardViewProps) {
  const [printedAt, setPrintedAt] = useState('')
  const groups = useMemo(() => groupReport(report), [report])
  const completeCount = report.filter(
    (grade) => grade.status_nilai === 'lengkap',
  ).length

  function handlePrint() {
    setPrintedAt(formatPrintDate())
    window.setTimeout(() => window.print(), 0)
  }

  return (
    <div className="space-y-5" data-student-report-document>
      <section
        className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] print:hidden"
        data-student-report-controls
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#263a32] dark:text-[#ffd166]">
              <BookOpen aria-hidden="true" size={23} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#0f6a42] dark:text-[#ffd166]">
                Rapor Akademik
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[#26382e] dark:text-[#e8e5de] sm:text-2xl">
                Hasil Belajar
              </h2>
              <p className="mt-1 truncate text-sm text-[#718078] dark:text-[#c5c2ba]">
                {studentName} <span aria-hidden="true">·</span> NIS{' '}
                {studentNumber || '—'}
              </p>
            </div>
          </div>
          {report.length > 0 ? (
            <button
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#0f5132] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4229] dark:bg-[#ffd166] dark:text-[#172027] dark:hover:bg-[#ffdc85] sm:self-center"
              onClick={handlePrint}
              type="button"
            >
              <Printer aria-hidden="true" size={16} />
              Cetak / Simpan PDF
            </button>
          ) : null}
        </div>

        {report.length > 0 ? (
          <div className="grid grid-cols-2 border-t border-[#e5ebe7] bg-[#f8faf8] dark:border-[#616161] dark:bg-[#111b21]">
            <div className="px-5 py-3 sm:px-6">
              <p className="text-[11px] font-medium text-[#718078] dark:text-[#c5c2ba]">
                Total catatan nilai
              </p>
              <p className="mt-0.5 text-lg font-bold text-[#26382e] dark:text-[#e8e5de]">
                {report.length}
              </p>
            </div>
            <div className="border-l border-[#e5ebe7] px-5 py-3 dark:border-[#616161] sm:px-6">
              <p className="text-[11px] font-medium text-[#718078] dark:text-[#c5c2ba]">
                Nilai lengkap
              </p>
              <p className="mt-0.5 text-lg font-bold text-[#26382e] dark:text-[#e8e5de]">
                {completeCount}
                <span className="ml-1 text-xs font-medium text-[#718078] dark:text-[#c5c2ba]">
                  dari {report.length}
                </span>
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <header className="hidden text-center print:block">
        <h1 className="text-base font-bold">
          MADRASAH IBTIDAIYAH MUHAMMADIYAH PASIR LOR
        </h1>
        <p className="mt-1 text-sm font-semibold">
          LEMBAR CAPAIAN HASIL BELAJAR PESERTA DIDIK
        </p>
        <p className="text-sm font-semibold">RAPOR DIGITAL</p>
        <hr className="my-3 border-black" />
        <div className="flex justify-between gap-4 text-left text-xs">
          <span>Nama siswa: {studentName}</span>
          <span>NIS: {studentNumber || '—'}</span>
          <span>Tanggal cetak: {printedAt}</span>
        </div>
      </header>

      {report.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#dce5df] bg-white px-5 py-12 text-center dark:border-[#616161] dark:bg-[#1c2d35]">
          <BookOpen
            aria-hidden="true"
            className="mx-auto text-[#718078] dark:text-[#c5c2ba]"
            size={30}
          />
          <h3 className="mt-3 text-sm font-semibold text-[#35463b] dark:text-[#e8e5de]">
            Belum ada nilai rapor
          </h3>
          <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
            Nilai akan muncul di sini setelah guru memasukkannya.
          </p>
        </section>
      ) : (
        <div
          aria-label="Daftar nilai rapor"
          className="space-y-5"
          role="region"
        >
          {groups.map((group) => (
            <section
              aria-labelledby={`report-group-${encodeURIComponent(group.key)}`}
              className="student-report-group overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]"
              key={group.key}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5ebe7] px-4 py-4 dark:border-[#616161] sm:px-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#718078] dark:text-[#c5c2ba]">
                    Tahun ajaran {group.academicYear}
                  </p>
                  <h3
                    className="mt-1 text-base font-bold text-[#26382e] dark:text-[#e8e5de]"
                    id={`report-group-${encodeURIComponent(group.key)}`}
                  >
                    Semester {group.semester}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#f1f3f2] px-3 py-1.5 text-xs font-medium text-[#65736a] dark:bg-[#26343b] dark:text-[#c5c2ba]">
                    {formatClassName(group.className)}
                  </span>
                  <span className="hidden rounded-full bg-[#eaf3ed] px-3 py-1.5 text-xs font-semibold text-[#0f5132] dark:bg-[#263a32] dark:text-[#d4f0dc] sm:inline-flex">
                    {group.grades.length} mapel
                  </span>
                </div>
              </div>

              <div className="student-report-table-wrapper hidden overflow-x-auto sm:block">
                <table className="student-report-table w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#f8faf8] text-[11px] font-semibold text-[#65736a] dark:bg-[#111b21] dark:text-[#c5c2ba]">
                      <th className="px-5 py-3" scope="col">
                        Mata pelajaran
                      </th>
                      <th className="px-3 py-3 text-center" scope="col">
                        Harian
                      </th>
                      <th className="px-3 py-3 text-center" scope="col">
                        UTS
                      </th>
                      <th className="px-3 py-3 text-center" scope="col">
                        UAS
                      </th>
                      <th className="px-5 py-3 text-right" scope="col">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.grades.map((grade) => (
                      <tr
                        className="student-report-row border-t border-[#edf0ed] dark:border-[#424242]"
                        key={`${grade.kelas_mapel_id}-${grade.mata_pelajaran}`}
                      >
                        <th
                          className="px-5 py-3.5 text-left font-normal"
                          scope="row"
                        >
                          <span className="block text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                            {grade.mata_pelajaran}
                          </span>
                          {grade.nama_guru ? (
                            <span className="mt-0.5 block text-[11px] text-[#718078] dark:text-[#c5c2ba]">
                              Guru: {grade.nama_guru}
                            </span>
                          ) : null}
                          {grade.keterangan ? (
                            <span className="mt-1 block max-w-xl text-xs italic text-[#65736a] dark:text-[#c5c2ba]">
                              “{grade.keterangan}”
                            </span>
                          ) : null}
                        </th>
                        <td
                          aria-label={
                            grade.nilai_tugas === null
                              ? 'Harian: belum diisi'
                              : undefined
                          }
                          className="px-3 py-3.5 text-center text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]"
                        >
                          {formatScore(grade.nilai_tugas)}
                        </td>
                        <td
                          aria-label={
                            grade.nilai_uts === null
                              ? 'UTS: belum diisi'
                              : undefined
                          }
                          className="px-3 py-3.5 text-center text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]"
                        >
                          {formatScore(grade.nilai_uts)}
                        </td>
                        <td
                          aria-label={
                            grade.nilai_uas === null
                              ? 'UAS: belum diisi'
                              : undefined
                          }
                          className="px-3 py-3.5 text-center text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]"
                        >
                          {formatScore(grade.nilai_uas)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <GradeStatus complete={grade.status_nilai === 'lengkap'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#edf0ed] sm:hidden dark:divide-[#424242]">
                {group.grades.map((grade) => (
                  <article
                    className="student-report-mobile p-4"
                    key={`${grade.kelas_mapel_id}-${grade.mata_pelajaran}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                          {grade.mata_pelajaran}
                        </h4>
                        {grade.nama_guru ? (
                          <p className="mt-0.5 text-[11px] text-[#718078] dark:text-[#c5c2ba]">
                            Guru: {grade.nama_guru}
                          </p>
                        ) : null}
                      </div>
                      <GradeStatus complete={grade.status_nilai === 'lengkap'} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <ScoreItem label="Harian" score={grade.nilai_tugas} />
                      <ScoreItem label="UTS" score={grade.nilai_uts} />
                      <ScoreItem label="UAS" score={grade.nilai_uas} />
                    </div>
                    {grade.keterangan ? (
                      <p className="mt-3 rounded-lg bg-[#f5f8f6] px-3 py-2 text-xs italic leading-5 text-[#65736a] dark:bg-[#111b21] dark:text-[#c5c2ba]">
                        Pesan guru: “{grade.keterangan}”
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
          <p className="text-right text-[11px] text-[#718078] dark:text-[#c5c2ba]">
            — berarti nilai belum diisi.
          </p>
        </div>
      )}

      {report.length > 0 ? (
        <footer className="hidden justify-end pt-8 text-xs print:flex">
          <div className="min-w-52 text-center">
            <p>Banyumas, {printedAt}</p>
            <p className="mt-1">Kepala Madrasah MIM Pasir Lor</p>
            <div className="h-16" />
            <p className="border-t border-black pt-1">( ____________________ )</p>
          </div>
        </footer>
      ) : null}
    </div>
  )
}
