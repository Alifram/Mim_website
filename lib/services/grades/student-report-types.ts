export type StudentReportGrade = {
  siswa_id: number
  kelas_mapel_id: number | null
  semester: number
  kelas: string
  tahun_angkatan: number | null
  tahun_ajaran: string
  mata_pelajaran: string
  nilai_tugas: number | null
  nilai_uts: number | null
  nilai_uas: number | null
  nilai_akhir: number | null
  status_nilai: 'lengkap' | 'belum_lengkap'
  sumber_nilai: 'nilai_penilaian' | 'gabungan' | 'nilai_raport'
  keterangan: string | null
  nama_guru: string | null
  bobot: {
    harian: number
    uts: number
    uas: number
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value)
    if (Number.isSafeInteger(parsed)) return parsed
  }
  return null
}

function parseSemester(value: unknown): number | null {
  if (value === 1 || value === 2) return value
  if (typeof value === 'string') {
    const match = /^(?:semester\s*)?([12])$/i.exec(value.trim())
    return match ? Number(match[1]) : null
  }
  return null
}

function parseScore(value: unknown): number | null | undefined {
  if (value === null) return null
  if (
    typeof value !== 'number' &&
    (typeof value !== 'string' || value.trim() === '')
  ) {
    return undefined
  }

  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
    ? parsed
    : undefined
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

export function parseStudentReport(
  value: unknown,
): StudentReportGrade[] | null {
  if (
    !isRecord(value) ||
    value.status !== 'success' ||
    !Array.isArray(value.data)
  ) {
    return null
  }

  const report: StudentReportGrade[] = []
  for (const row of value.data) {
    if (!isRecord(row) || !isRecord(row.bobot)) return null

    const studentId = parseInteger(row.siswa_id)
    const assignmentId =
      row.kelas_mapel_id === null ? null : parseInteger(row.kelas_mapel_id)
    const semester = parseSemester(row.semester)
    const cohort = row.tahun_angkatan === null
      ? null
      : parseInteger(row.tahun_angkatan)
    const daily = parseScore(row.nilai_tugas)
    const midterm = parseScore(row.nilai_uts)
    const final = parseScore(row.nilai_uas)
    const finalScore = parseScore(row.nilai_akhir)
    const dailyWeight = parseScore(row.bobot.harian)
    const midtermWeight = parseScore(row.bobot.uts)
    const finalWeight = parseScore(row.bobot.uas)

    if (
      studentId === null ||
      studentId <= 0 ||
      (row.kelas_mapel_id !== null && assignmentId === null) ||
      semester === null ||
      (row.tahun_angkatan !== null && cohort === null) ||
      typeof row.kelas !== 'string' ||
      typeof row.tahun_ajaran !== 'string' ||
      typeof row.mata_pelajaran !== 'string' ||
      daily === undefined ||
      midterm === undefined ||
      final === undefined ||
      finalScore === undefined ||
      (row.status_nilai !== 'lengkap' &&
        row.status_nilai !== 'belum_lengkap') ||
      (row.sumber_nilai !== 'nilai_penilaian' &&
        row.sumber_nilai !== 'gabungan' &&
        row.sumber_nilai !== 'nilai_raport') ||
      !isNullableString(row.keterangan) ||
      !isNullableString(row.nama_guru) ||
      dailyWeight === null ||
      dailyWeight === undefined ||
      midtermWeight === null ||
      midtermWeight === undefined ||
      finalWeight === null ||
      finalWeight === undefined
    ) {
      return null
    }

    report.push({
      siswa_id: studentId,
      kelas_mapel_id: assignmentId,
      semester,
      kelas: row.kelas,
      tahun_angkatan: cohort,
      tahun_ajaran: row.tahun_ajaran,
      mata_pelajaran: row.mata_pelajaran,
      nilai_tugas: daily,
      nilai_uts: midterm,
      nilai_uas: final,
      nilai_akhir: finalScore,
      status_nilai: row.status_nilai,
      sumber_nilai: row.sumber_nilai,
      keterangan: row.keterangan,
      nama_guru: row.nama_guru,
      bobot: {
        harian: dailyWeight,
        uts: midtermWeight,
        uas: finalWeight,
      },
    })
  }

  return report
}
