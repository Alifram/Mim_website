import { createClient } from '@/lib/supabase/server'
import {
  getAdminStudentRoster,
  type AdminStudent,
} from '@/lib/services/classes/class-service'

export type RegistrationClass = {
  id: number
  nama: string
}

export type RegistrationOptions = {
  classes: RegistrationClass[]
  students: AdminStudent[]
  classError: string | null
  studentError: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function getRegistrationOptions(): Promise<RegistrationOptions> {
  const supabase = await createClient()
  const [classResult, studentResult] = await Promise.all([
    supabase.from('kelas').select('id, nama').eq('aktif', true).order('nama'),
    getAdminStudentRoster(),
  ])

  const classes: RegistrationClass[] = []
  let classError: string | null = null

  if (classResult.error) {
    classError = 'Daftar kelas belum dapat dimuat. Periksa koneksi lalu coba lagi.'
  } else if (classResult.data) {
    for (const row of classResult.data) {
      if (!isRecord(row) || typeof row.id !== 'number' || typeof row.nama !== 'string') {
        classError = 'Format daftar kelas dari server tidak valid.'
        classes.length = 0
        break
      }

      classes.push({ id: row.id, nama: row.nama })
    }

    if (!classError && classes.length === 0) {
      classError = 'Belum ada kelas aktif untuk dipilih.'
    }
  }

  return {
    classes,
    students:
      studentResult.status === 'success' ? studentResult.students : [],
    classError,
    studentError:
      studentResult.status === 'error' ? studentResult.message : null,
  }
}
