import Link from 'next/link'
import { ArrowLeft, Construction } from 'lucide-react'

type FeaturePlaceholderProps = {
  title: string
  description: string
}

export default function FeaturePlaceholder({
  title,
  description,
}: FeaturePlaceholderProps) {
  return (
    <section className="rounded-3xl border border-[#e5ebe7] bg-white p-6 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-8">
      <div className="grid size-12 place-items-center rounded-2xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
        <Construction aria-hidden="true" size={22} />
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.13em] text-[#0f6a42] dark:text-[#ffd166]">
        Fitur portal
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#1d2b23] dark:text-[#e8e5de]">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
        {description}
      </p>
      <p className="mt-5 rounded-xl border border-[#e5ebe7] bg-[#f7f9f7] px-4 py-3 text-xs leading-5 text-[#65736a] dark:border-[#616161] dark:bg-[#34434b] dark:text-[#c5c2ba]">
        Halaman ini sudah tersedia di navigasi dan akan dilengkapi dengan data
        serta alur kerja sekolah pada tahap berikutnya.
      </p>
      <Link
        className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0f5132] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4229] dark:bg-[#ffd166] dark:text-[#172027] dark:hover:bg-[#ffdc85]"
        href="/dashboard"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Kembali ke beranda
      </Link>
    </section>
  )
}
