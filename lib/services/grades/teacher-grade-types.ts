export type GradeSemester = 'Semester 1' | 'Semester 2'
export type GradeKind = 'harian' | 'uts' | 'uas'

export type TeacherGradeAssignment = {
  id: number
  kelas_id: number
  kelas: string
  mata_pelajaran_id: number
  mata_pelajaran: string
  guru_id: number
  guru_pengampu: string
  tahun_ajaran: string
}

export type TeacherGradeStudent = {
  id: number
  nomor_induk: string
  nama_lengkap: string
  kelas_id: number
  kelas_nama: string
  tahun_angkatan: number | null
}

export type GradeSubmission = {
  studentId: number
  assignmentId: number
  semester: GradeSemester
  kind: GradeKind
  score: number
  comment: string
  assessmentName: string
  assessmentDate: string
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseInteger(value: unknown) {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value)
    if (Number.isSafeInteger(parsed)) return parsed
  }
  return null
}

export function parseTeacherGradeAssignments(
  value: unknown,
): TeacherGradeAssignment[] | null {
  if (!isRecord(value) || value.status !== 'success' || !Array.isArray(value.data)) {
    return null
  }

  const assignments: TeacherGradeAssignment[] = []
  for (const row of value.data) {
    if (!isRecord(row)) return null
    const id = parseInteger(row.id)
    const classId = parseInteger(row.kelas_id)
    const subjectId = parseInteger(row.mata_pelajaran_id)
    const teacherId = parseInteger(row.guru_id)

    if (
      id === null ||
      id <= 0 ||
      classId === null ||
      classId <= 0 ||
      subjectId === null ||
      subjectId <= 0 ||
      teacherId === null ||
      teacherId <= 0 ||
      typeof row.kelas !== 'string' ||
      !row.kelas.trim() ||
      typeof row.mata_pelajaran !== 'string' ||
      !row.mata_pelajaran.trim() ||
      typeof row.guru_pengampu !== 'string' ||
      typeof row.tahun_ajaran !== 'string' ||
      !row.tahun_ajaran.trim()
    ) {
      return null
    }

    assignments.push({
      id,
      kelas_id: classId,
      kelas: row.kelas,
      mata_pelajaran_id: subjectId,
      mata_pelajaran: row.mata_pelajaran,
      guru_id: teacherId,
      guru_pengampu: row.guru_pengampu,
      tahun_ajaran: row.tahun_ajaran,
    })
  }

  return assignments
}

export function parseTeacherGradeStudents(
  value: unknown,
): TeacherGradeStudent[] | null {
  if (!isRecord(value) || value.status !== 'success' || !Array.isArray(value.data)) {
    return null
  }

  const students: TeacherGradeStudent[] = []
  for (const row of value.data) {
    if (!isRecord(row)) return null
    const id = parseInteger(row.id)
    const classId = parseInteger(row.kelas_id)
    const admissionYear =
      row.tahun_angkatan === null
        ? null
        : parseInteger(row.tahun_angkatan)

    if (
      id === null ||
      id <= 0 ||
      classId === null ||
      classId <= 0 ||
      (row.tahun_angkatan !== null && admissionYear === null) ||
      typeof row.nomor_induk !== 'string' ||
      typeof row.nama_lengkap !== 'string' ||
      typeof row.kelas_nama !== 'string'
    ) {
      return null
    }

    students.push({
      id,
      nomor_induk: row.nomor_induk,
      nama_lengkap: row.nama_lengkap,
      kelas_id: classId,
      kelas_nama: row.kelas_nama,
      tahun_angkatan: admissionYear,
    })
  }

  return students
}

export function isGradeSemester(value: string): value is GradeSemester {
  return value === 'Semester 1' || value === 'Semester 2'
}

export function isGradeKind(value: string): value is GradeKind {
  return value === 'harian' || value === 'uts' || value === 'uas'
}
