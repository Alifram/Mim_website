'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  CalendarDays,
  ImagePlus,
  MessageCircle,
  Send,
  Trash2,
} from 'lucide-react'

import {
  addSchoolEventComment,
  createSchoolEvent,
  deleteSchoolEvent,
  fetchSchoolEventComments,
} from '@/lib/services/events/event-query-service'
import type {
  SchoolEvent,
  SchoolEventClass,
  SchoolEventComment,
} from '@/lib/services/events/event-types'

type EventBoardProps = {
  canManage: boolean
  classes: SchoolEventClass[]
  events: SchoolEvent[]
  imageWarning: string | null
  initialDate: string
  role: string
  userName: string
}

type Feedback = {
  status: 'success' | 'error'
  message: string
}

const fieldClassName =
  'min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166]'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

function formatCommentDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Waktu tidak tersedia'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}

export default function EventBoard({
  canManage,
  classes,
  events,
  imageWarning,
  initialDate,
  role,
  userName,
}: EventBoardProps) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState(initialDate)
  const [allClasses, setAllClasses] = useState(true)
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([])
  const [image, setImage] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [expandedEventIds, setExpandedEventIds] = useState<number[]>([])
  const [commentsByEvent, setCommentsByEvent] = useState<
    Record<number, SchoolEventComment[]>
  >({})
  const [commentErrors, setCommentErrors] = useState<Record<number, string>>({})
  const [loadingComments, setLoadingComments] = useState<number | null>(null)
  const [submittingComment, setSubmittingComment] = useState<number | null>(null)
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({})

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return
    setIsSaving(true)
    setFeedback(null)

    try {
      const result = await createSchoolEvent({
        title,
        description,
        allClasses,
        classIds: selectedClassIds,
        eventDate,
        image,
      })
      setFeedback(result)
      if (result.status === 'success') {
        setTitle('')
        setDescription('')
        setEventDate(initialDate)
        setAllClasses(true)
        setSelectedClassIds([])
        setImage(null)
        setIsFormOpen(false)
        router.refresh()
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleComments(eventId: number) {
    const isExpanded = expandedEventIds.includes(eventId)
    if (isExpanded) {
      setExpandedEventIds((current) =>
        current.filter((currentId) => currentId !== eventId),
      )
      return
    }

    setExpandedEventIds((current) => [...current, eventId])
    if (commentsByEvent[eventId]) return

    setLoadingComments(eventId)
    setCommentErrors((current) => {
      const next = { ...current }
      delete next[eventId]
      return next
    })
    const result = await fetchSchoolEventComments(eventId)
    if (result.status === 'success') {
      setCommentsByEvent((current) => ({
        ...current,
        [eventId]: result.comments,
      }))
    } else {
      setCommentErrors((current) => ({
        ...current,
        [eventId]: result.message,
      }))
    }
    setLoadingComments(null)
  }

  async function handleCommentSubmit(
    event: FormEvent<HTMLFormElement>,
    eventId: number,
  ) {
    event.preventDefault()
    if (submittingComment === eventId) return

    setSubmittingComment(eventId)
    const result = await addSchoolEventComment(
      eventId,
      commentDrafts[eventId] ?? '',
    )
    if (result.status === 'success') {
      setCommentDrafts((current) => ({ ...current, [eventId]: '' }))
      const commentsResult = await fetchSchoolEventComments(eventId)
      if (commentsResult.status === 'success') {
        setCommentsByEvent((current) => ({
          ...current,
          [eventId]: commentsResult.comments,
        }))
        setCommentErrors((current) => {
          const next = { ...current }
          delete next[eventId]
          return next
        })
      } else {
        setCommentErrors((current) => ({
          ...current,
          [eventId]: commentsResult.message,
        }))
      }
    } else {
      setCommentErrors((current) => ({
        ...current,
        [eventId]: result.message,
      }))
    }
    setSubmittingComment(null)
  }

  async function handleDeleteEvent(item: SchoolEvent) {
    if (!window.confirm(`Hapus kegiatan "${item.judul_acara}"?`)) return

    const result = await deleteSchoolEvent(item.id, item.gambar_url)
    setFeedback(result)
    if (result.status === 'success') router.refresh()
  }

  function toggleTargetClass(classId: number) {
    setSelectedClassIds((current) =>
      current.includes(classId)
        ? current.filter((id) => id !== classId)
        : [...current, classId],
    )
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-br from-[#0f5132] to-[#24734b] p-5 text-white shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
          Informasi Sekolah
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">
          Kegiatan &amp; Pengumuman
        </h2>
        <p className="mt-2 text-sm text-white/85">
          Informasi sekolah yang relevan untuk kelas Anda.
        </p>
      </section>

      {canManage ? (
        <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
          <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
            <div>
              <h3 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                Kelola kegiatan
              </h3>
              <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                Buat postingan untuk semua kelas atau kelas tertentu.
              </p>
            </div>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0f5132] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4229] dark:bg-[#ffd166] dark:text-[#172027]"
              onClick={() => {
                setIsFormOpen((open) => !open)
                setFeedback(null)
              }}
              type="button"
            >
              <ImagePlus aria-hidden="true" size={17} />
              {isFormOpen ? 'Tutup formulir' : 'Buat postingan'}
            </button>
          </div>

          {isFormOpen ? (
            <form
              className="space-y-4 border-t border-[#e7ece8] p-4 dark:border-[#424242] sm:p-5"
              onSubmit={handleCreateEvent}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]">
                    Judul kegiatan
                  </span>
                  <input
                    className={fieldClassName}
                    maxLength={150}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    value={title}
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]">
                    Tanggal kegiatan
                  </span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => setEventDate(event.target.value)}
                    required
                    type="date"
                    value={eventDate}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]">
                  Deskripsi
                </span>
                <textarea
                  className={`${fieldClassName} min-h-28 py-3`}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  value={description}
                />
              </label>

              <fieldset>
                <legend className="mb-2 text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]">
                  Target kelas
                </legend>
                <label className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#f2f7f3] px-3 text-sm text-[#26382e] dark:bg-[#23343c] dark:text-[#e8e5de]">
                  <input
                    checked={allClasses}
                    onChange={(event) => {
                      setAllClasses(event.target.checked)
                      if (event.target.checked) setSelectedClassIds([])
                    }}
                    type="checkbox"
                  />
                  Semua kelas
                </label>
                {!allClasses ? (
                  classes.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {classes.map((schoolClass) => (
                        <label
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#e5ebe7] px-3 text-sm text-[#26382e] dark:border-[#616161] dark:text-[#e8e5de]"
                          key={schoolClass.id}
                        >
                          <input
                            checked={selectedClassIds.includes(schoolClass.id)}
                            onChange={() => toggleTargetClass(schoolClass.id)}
                            type="checkbox"
                          />
                          {schoolClass.nama}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-amber-800 dark:text-[#ffe0a3]">
                      Daftar kelas aktif belum tersedia.
                    </p>
                  )
                ) : null}
              </fieldset>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]">
                  Gambar <span className="font-normal text-[#718078]">(opsional, maks. 5 MB)</span>
                </span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full text-sm text-[#65736a] file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-[#eaf3ed] file:px-3 file:text-xs file:font-semibold file:text-[#0f5132] dark:text-[#c5c2ba]"
                  onChange={(event) =>
                    setImage(event.target.files?.[0] ?? null)
                  }
                  type="file"
                />
              </label>

              {feedback ? (
                <p
                  className={`rounded-xl border px-3.5 py-3 text-sm ${
                    feedback.status === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-[#286345] dark:bg-[#183b2c] dark:text-[#b9f4d0]'
                      : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
                  }`}
                  role={feedback.status === 'error' ? 'alert' : 'status'}
                >
                  {feedback.message}
                </p>
              ) : null}

              <button
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0f5132] px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60 dark:bg-[#ffd166] dark:text-[#172027]"
                disabled={
                  isSaving ||
                  (!allClasses && selectedClassIds.length === 0) ||
                  (!allClasses && classes.length === 0)
                }
                type="submit"
              >
                {isSaving ? 'Mempublikasikan…' : 'Publikasikan kegiatan'}
              </button>
            </form>
          ) : feedback ? (
            <p
              className="border-t border-[#e7ece8] px-4 py-3 text-sm text-[#26382e] dark:border-[#424242] dark:text-[#e8e5de]"
              role="status"
            >
              {feedback.message}
            </p>
          ) : null}
        </section>
      ) : null}

      {imageWarning ? (
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
          role="status"
        >
          {imageWarning}
        </p>
      ) : null}

      {events.length ? (
        <section className="space-y-4" aria-label="Daftar kegiatan sekolah">
          {events.map((item) => {
            const canDelete =
              role === 'admin' ||
              (role === 'guru' && item.dibuat_oleh === userName)
            const commentsOpen = expandedEventIds.includes(item.id)

            return (
              <article
                className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]"
                key={item.id}
              >
                {item.gambar_signed_url ? (
                  <Image
                    alt=""
                    className="max-h-[420px] w-full object-cover"
                    height={900}
                    loading="lazy"
                    unoptimized
                    src={item.gambar_signed_url}
                    width={1600}
                  />
                ) : null}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#eaf3ed] px-3 py-1 text-xs font-semibold text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                      {item.target_kelas || 'Semua Kelas'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#718078] dark:text-[#c5c2ba]">
                      <CalendarDays aria-hidden="true" size={14} />
                      {formatDate(item.tanggal_acara)}
                    </span>
                    {canDelete ? (
                      <button
                        aria-label={`Hapus ${item.judul_acara}`}
                        className="ml-auto inline-flex size-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                        onClick={() => void handleDeleteEvent(item)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={17} />
                      </button>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-xl font-bold tracking-tight text-[#26382e] dark:text-[#e8e5de]">
                    {item.judul_acara}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#526158] dark:text-[#d0cec6]">
                    {item.deskripsi}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0ed] pt-3 dark:border-[#424242]">
                    <p className="text-xs text-[#718078] dark:text-[#c5c2ba]">
                      Diposting oleh {item.dibuat_oleh || 'Sekolah'}
                    </p>
                    <button
                      className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#0f5132] transition hover:bg-[#f2f7f3] dark:text-[#ffd166] dark:hover:bg-[#34434b]"
                      onClick={() => void toggleComments(item.id)}
                      type="button"
                    >
                      <MessageCircle aria-hidden="true" size={17} />
                      {commentsOpen ? 'Tutup diskusi' : 'Diskusi & komentar'}
                    </button>
                  </div>

                  {commentsOpen ? (
                    <div className="mt-3 border-t border-[#edf0ed] pt-4 dark:border-[#424242]">
                      {loadingComments === item.id ? (
                        <p className="py-4 text-center text-sm text-[#718078] dark:text-[#c5c2ba]">
                          Memuat komentar…
                        </p>
                      ) : commentErrors[item.id] ? (
                        <p
                          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200"
                          role="alert"
                        >
                          {commentErrors[item.id]}
                        </p>
                      ) : commentsByEvent[item.id]?.length ? (
                        <ul className="space-y-3">
                          {commentsByEvent[item.id].map((comment) => (
                            <li className="flex gap-3" key={comment.id}>
                              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf3ed] text-xs font-bold uppercase text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                                {comment.nama_pengirim.trim().charAt(0) || '?'}
                              </span>
                              <div className="min-w-0 flex-1 rounded-xl bg-[#f7f9f7] px-3.5 py-2.5 dark:bg-[#23343c]">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                  <p className="text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                                    {comment.nama_pengirim}
                                    <span className="ml-2 text-[10px] font-medium uppercase text-[#718078] dark:text-[#c5c2ba]">
                                      {comment.role_pengirim.replaceAll('_', ' ')}
                                    </span>
                                  </p>
                                  <time className="text-[10px] text-[#718078] dark:text-[#c5c2ba]">
                                    {formatCommentDate(comment.created_at)}
                                  </time>
                                </div>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-[#526158] dark:text-[#d0cec6]">
                                  {comment.isi_komentar}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="py-3 text-sm text-[#718078] dark:text-[#c5c2ba]">
                          Belum ada komentar. Jadilah yang pertama berdiskusi.
                        </p>
                      )}

                      <form
                        className="mt-4 flex items-end gap-2"
                        onSubmit={(event) =>
                          void handleCommentSubmit(event, item.id)
                        }
                      >
                        <label className="min-w-0 flex-1">
                          <span className="sr-only">Tulis komentar</span>
                          <textarea
                            className={`${fieldClassName} min-h-11 py-3`}
                            maxLength={2000}
                            onChange={(event) =>
                              setCommentDrafts((current) => ({
                                ...current,
                                [item.id]: event.target.value,
                              }))
                            }
                            placeholder={`Tulis komentar sebagai ${userName}`}
                            required
                            rows={1}
                            value={commentDrafts[item.id] ?? ''}
                          />
                        </label>
                        <button
                          aria-label="Kirim komentar"
                          className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#0f5132] text-white disabled:opacity-50 dark:bg-[#ffd166] dark:text-[#172027]"
                          disabled={
                            submittingComment === item.id ||
                            !(commentDrafts[item.id] ?? '').trim()
                          }
                          type="submit"
                        >
                          <Send aria-hidden="true" size={17} />
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-[#dce5df] bg-white px-5 py-12 text-center dark:border-[#616161] dark:bg-[#1c2d35]">
          <CalendarDays
            aria-hidden="true"
            className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
            size={32}
          />
          <h3 className="mt-3 text-base font-semibold text-[#26382e] dark:text-[#e8e5de]">
            Belum ada kegiatan untuk ditampilkan
          </h3>
          <p className="mt-1 text-sm text-[#718078] dark:text-[#c5c2ba]">
            Informasi kegiatan sekolah akan muncul di halaman ini.
          </p>
        </section>
      )}
    </div>
  )
}
