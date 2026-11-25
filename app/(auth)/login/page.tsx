import Image from 'next/image'
import LoginForm from '@/components/auth/login-form'
import ThemeToggle from '@/components/theme/theme-toggle'

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f7f9f7] dark:bg-[#0b141a] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[radial-gradient(ellipse_at_86%_20%,rgb(255_255_255_/_8%),transparent_32%),linear-gradient(145deg,#0f5132_0%,#0c422b_58%,#0a3825_100%)] px-9 py-10 text-white lg:flex xl:px-[clamp(56px,5vw,76px)] xl:py-12">
        <div className="pointer-events-none absolute -bottom-[230px] -right-[230px] h-[420px] w-[420px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-[145px] -right-[145px] h-[300px] w-[300px] rounded-full border border-white/10" />

        <BrandLockup />

        <div className="relative z-10 my-16 max-w-[680px]">
          <span className="text-[11px] font-bold tracking-[0.14em] text-[#c4e3d1]">
            SELAMAT DATANG DI MIM PASIR LOR
          </span>
          <h1 className="mt-5 max-w-[660px] text-[clamp(2.75rem,4vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.045em]">
            Belajar, bertumbuh, dan berprestasi bersama.
          </h1>
          <p className="mt-5 max-w-[470px] text-[15px] leading-7 text-white/75">
            Akses informasi sekolah, perkembangan akademik, dan berbagai
            layanan dalam satu portal.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-xs text-white/70">
          <span className="grid size-[30px] place-items-center rounded-[10px] border border-white/20 text-[#d7eddf]">
            ✦
          </span>
          <span>Membangun generasi Islami dan unggul.</span>
        </div>
      </section>

      <section className="relative flex min-h-screen flex-col items-center bg-[radial-gradient(ellipse_at_92%_8%,rgb(15_81_50_/_4%),transparent_32%),#fbfcfb] px-6 py-8 dark:bg-[#0b141a] sm:px-10 sm:py-10 lg:px-12 xl:px-[clamp(48px,6vw,88px)]">
        <div className="absolute right-5 top-5 z-10 sm:right-8 sm:top-8">
          <ThemeToggle compact />
        </div>
        <div className="my-auto w-full max-w-[430px]">
          <div className="mb-9 flex items-center gap-3.5 lg:hidden">
            <BrandLogo />
            <BrandName />
          </div>

          <div className="mb-8">
            <span className="text-[11px] font-bold tracking-[0.14em] text-[#0f5132] dark:text-[#ffd166]">
              PORTAL AKADEMIK MIM PASIR LOR
            </span>
            <h2 className="mt-3 text-[36px] font-bold leading-tight tracking-[-0.04em] text-[#18251e] dark:text-[#e8e5de]">
              Selamat datang
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-[#718078] dark:text-[#c5c2ba]">
              Masuk menggunakan nomor induk atau alamat email Anda.
            </p>
          </div>

          <LoginForm />
          <p className="mt-6 text-center text-[11px] leading-5 text-[#718078] dark:text-[#c5c2ba]">
            Butuh bantuan masuk? Silakan hubungi administrator sekolah.
          </p>
        </div>
        <p className="py-2 text-center text-[11px] text-[#718078] dark:text-[#c5c2ba]">
          © MIM Pasir Lor
        </p>
      </section>
    </main>
  )
}

function BrandLockup() {
  return (
    <div className="flex items-center gap-3.5">
      <BrandLogo />
      <BrandName />
    </div>
  )
}

function BrandLogo() {
  return (
    <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/40 bg-white p-[7px] shadow-lg">
      <Image
        src="/images/logo_mim.png"
        alt="Logo MIM Pasir Lor"
        width={44}
        height={44}
        priority
        className="h-full w-full object-contain"
      />
    </div>
  )
}

function BrandName() {
  return (
    <div>
      <p className="m-0 text-sm font-extrabold tracking-[0.09em] text-[#0f5132] dark:text-[#ffd166] lg:text-white">
        MIM PASIR LOR
      </p>
      <p className="mt-[5px] text-[10px] font-bold tracking-[0.18em] text-[#718078] dark:text-white/70 lg:text-white/70">
        PORTAL SEKOLAH
      </p>
    </div>
  )
}