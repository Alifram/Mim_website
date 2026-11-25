import {
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  School,
  UserRound,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'

export type PortalNavItem = {
  title: string
  description: string
  href: string
  icon: LucideIcon
}

const dashboardItem: PortalNavItem = {
  title: 'Beranda',
  description: 'Ringkasan portal sekolah.',
  href: '/dashboard',
  icon: LayoutDashboard,
}

const informationItem: PortalNavItem = {
  title: 'Informasi & kegiatan',
  description: 'Lihat pengumuman dan kegiatan sekolah.',
  href: '/events',
  icon: Megaphone,
}

const profileItem: PortalNavItem = {
  title: 'Profil saya',
  description: 'Lihat dan kelola informasi profil.',
  href: '/profile',
  icon: UserRound,
}

const navigationByRole: Record<string, PortalNavItem[]> = {
  admin: [
    dashboardItem,
    {
      title: 'Registrasi',
      description: 'Buat akun baru untuk warga sekolah.',
      href: '/users/new',
      icon: UserPlus,
    },
    {
      title: 'Data Kelas',
      description: 'Lihat data kelas dan rombongan belajar.',
      href: '/classes',
      icon: School,
    },
    {
      title: 'Statistik',
      description: 'Lihat ringkasan hasil akademik.',
      href: '/academics/statistics',
      icon: ChartNoAxesCombined,
    },
    {
      title: 'Buat Event',
      description: 'Buat dan kelola informasi kegiatan sekolah.',
      href: '/events',
      icon: Megaphone,
    },
    {
      title: 'Jadwal',
      description: 'Kelola jadwal pelajaran sekolah.',
      href: '/academics/schedules',
      icon: CalendarDays,
    },
    {
      title: 'Penugasan Mapel',
      description: 'Kelola penugasan guru dan mata pelajaran.',
      href: '/academics/teaching-assignments',
      icon: BookOpen,
    },
    {
      title: 'Mata Pelajaran',
      description: 'Kelola daftar mata pelajaran.',
      href: '/academics/subjects',
      icon: BookOpen,
    },
    {
      title: 'Presensi',
      description: 'Pantau data kehadiran.',
      href: '/attendance',
      icon: ClipboardCheck,
    },
    profileItem,
  ],
  guru: [
    dashboardItem,
    {
      title: 'Input Nilai',
      description: 'Masukkan nilai rapor siswa sesuai penugasan.',
      href: '/academics/grades',
      icon: BookOpen,
    },
    {
      title: 'Jadwal pelajaran',
      description: 'Lihat jadwal mengajar.',
      href: '/academics/schedules',
      icon: CalendarDays,
    },
    {
      title: 'Presensi',
      description: 'Lihat data kehadiran.',
      href: '/attendance',
      icon: ClipboardCheck,
    },
    {
      title: 'Statistik akademik',
      description: 'Lihat ringkasan hasil akademik.',
      href: '/academics/statistics',
      icon: ChartNoAxesCombined,
    },
    informationItem,
    profileItem,
  ],
  siswa: [
    dashboardItem,
    {
      title: 'Rapor siswa',
      description: 'Lihat hasil belajar dan rapor.',
      href: '/academics/report-cards',
      icon: BookOpen,
    },
    {
      title: 'Jadwal pelajaran',
      description: 'Lihat jadwal pelajaran.',
      href: '/academics/schedules',
      icon: CalendarDays,
    },
    {
      title: 'Presensi',
      description: 'Lihat catatan kehadiran.',
      href: '/attendance',
      icon: ClipboardCheck,
    },
    informationItem,
    profileItem,
  ],
  orang_tua: [
    dashboardItem,
    {
      title: 'Infaq & Wakaf',
      description: 'Pantau transaksi Infaq dan Wakaf anak.',
      href: '/payments',
      icon: CreditCard,
    },
    profileItem,
  ],
  petugas_keuangan: [
    dashboardItem,
    {
      title: 'Pembayaran',
      description: 'Kelola informasi pembayaran sekolah.',
      href: '/payments',
      icon: CreditCard,
    },
    profileItem,
  ],
}

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  guru: 'Guru',
  siswa: 'Siswa',
  orang_tua: 'Orang tua',
  petugas_keuangan: 'Petugas keuangan',
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Beranda',
  '/users': 'Pengguna',
  '/users/new': 'Registrasi',
  '/classes': 'Kelas',
  '/attendance': 'Presensi',
  '/academics/statistics': 'Statistik',
  '/academics/teaching-assignments': 'Penugasan Mapel',
  '/academics/schedules': 'Jadwal pelajaran',
  '/academics/report-cards': 'Rapor siswa',
  '/academics/grades': 'Input Nilai',
  '/academics/subjects': 'Mata pelajaran',
  '/events': 'Informasi & kegiatan',
  '/payments': 'Pembayaran',
  '/profile': 'Profil saya',
}

export function getPortalNavigation(role: string) {
  return navigationByRole[role.trim().toLowerCase()] ?? null
}

export function getPortalRoleLabel(role: string) {
  return roleLabels[role.trim().toLowerCase()] ?? role
}

export function getPortalPageTitle(pathname: string) {
  const matchingPath = Object.keys(pageTitles)
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((left, right) => right.length - left.length)[0]

  return matchingPath ? pageTitles[matchingPath] : 'Portal sekolah'
}
