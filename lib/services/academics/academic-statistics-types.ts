export type AcademicClassStatistics = {
  className: string
  semester1: number
  semester2: number
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseScore(value: unknown) {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && value.trim() === '') return null

  const score = Number(value)
  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null
}

export function parseAcademicStatistics(
  value: unknown,
): AcademicClassStatistics[] | null {
  if (!isRecord(value)) return null

  const statistics: AcademicClassStatistics[] = []

  for (const [className, row] of Object.entries(value)) {
    if (!className.trim() || !isRecord(row)) return null

    const semester1 = parseScore(row.semester_1)
    const semester2 = parseScore(row.semester_2)
    if (semester1 === null || semester2 === null) return null

    statistics.push({ className, semester1, semester2 })
  }

  return statistics.sort((first, second) =>
    first.className.localeCompare(second.className, 'id'),
  )
}
