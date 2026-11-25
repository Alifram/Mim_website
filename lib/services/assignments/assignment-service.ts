import { createClient } from '@/lib/supabase/server'

export type AssignmentClass = {
  id: number
  nama: string
}

export type AssignmentSubject = {
  id: number
  kode: string
  nama: string
}

export type AssignmentTeacher = {
  id: number
  nama_lengkap: string
  kelas_id: number | null
  jenis_guru: 'guru_kelas' | 'guru_mapel'
}

export type ClassSubjectAssignment = {
  id: number
  kelas_id: number
  kelas: string
  mata_pelajaran_id: number
  mata_pelajaran: string
  guru_id: number
  guru_pengampu: string
  tahun_ajaran: string
}

export type AdminAssignmentData = {
  classes: AssignmentClass[]
  subjects: AssignmentSubject[]
  teachers: AssignmentTeacher[]
  assignments: ClassSubjectAssignment[]
}

export type AdminAssignmentDataResult =
  | { status: 'success'; data: AdminAssignmentData }
  | { status: 'error'; message: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value)
}

function parseClasses(value: unknown): AssignmentClass[] | null {
  if (!Array.isArray(value)) return null

  const classes: AssignmentClass[] = []
  for (const row of value) {
    if (
      !isRecord(row) ||
      !isInteger(row.id) ||
      typeof row.nama !== 'string'
    ) {
      return null
    }
    classes.push({ id: row.id, nama: row.nama })
  }
  return classes
}

function parseSubjects(value: unknown): AssignmentSubject[] | null {
  if (!Array.isArray(value)) return null

  const subjects: AssignmentSubject[] = []
  for (const row of value) {
    if (
      !isRecord(row) ||
      !isInteger(row.id) ||
      typeof row.kode !== 'string' ||
      typeof row.nama !== 'string'
    ) {
      return null
    }
    subjects.push({ id: row.id, kode: row.kode, nama: row.nama })
  }
  return subjects
}

function parseTeachers(value: unknown): AssignmentTeacher[] | null {
  if (!Array.isArray(value)) return null

  const teachers: AssignmentTeacher[] = []
  for (const row of value) {
    if (
      !isRecord(row) ||
      !isInteger(row.id) ||
      typeof row.nama_lengkap !== 'string' ||
      (row.kelas_id !== null && !isInteger(row.kelas_id)) ||
      (row.jenis_guru !== 'guru_kelas' && row.jenis_guru !== 'guru_mapel')
    ) {
      return null
    }
    teachers.push({
      id: row.id,
      nama_lengkap: row.nama_lengkap,
      kelas_id: row.kelas_id,
      jenis_guru: row.jenis_guru,
    })
  }
  return teachers
}

function parseAssignments(value: unknown): ClassSubjectAssignment[] | null {
  if (!Array.isArray(value)) return null

  const assignments: ClassSubjectAssignment[] = []
  for (const row of value) {
    if (
      !isRecord(row) ||
      !isInteger(row.id) ||
      !isInteger(row.kelas_id) ||
      typeof row.kelas !== 'string' ||
      !isInteger(row.mata_pelajaran_id) ||
      typeof row.mata_pelajaran !== 'string' ||
      !isInteger(row.guru_id) ||
      typeof row.guru_pengampu !== 'string' ||
      typeof row.tahun_ajaran !== 'string'
    ) {
      return null
    }
    assignments.push({
      id: row.id,
      kelas_id: row.kelas_id,
      kelas: row.kelas,
      mata_pelajaran_id: row.mata_pelajaran_id,
      mata_pelajaran: row.mata_pelajaran,
      guru_id: row.guru_id,
      guru_pengampu: row.guru_pengampu,
      tahun_ajaran: row.tahun_ajaran,
    })
  }
  return assignments
}

export async function getAdminAssignmentData(): Promise<AdminAssignmentDataResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_assignment_data', {
    p_kelas_id: null,
  })

  if (error || !isRecord(data)) {
    return {
      status: 'error',
      message:
        'Data referensi penugasan belum dapat dimuat. Pastikan RPC Supabase tersedia dan akun admin aktif.',
    }
  }

  const classes = parseClasses(data.kelas)
  const subjects = parseSubjects(data.mata_pelajaran)
  const teachers = parseTeachers(data.guru)
  const assignments = parseAssignments(data.penugasan)

  if (!classes || !subjects || !teachers || !assignments) {
    return {
      status: 'error',
      message: 'Format data penugasan dari server tidak lengkap atau tidak valid.',
    }
  }

  return {
    status: 'success',
    data: { classes, subjects, teachers, assignments },
  }
}
