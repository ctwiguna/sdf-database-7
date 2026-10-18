import {
  AdminCourseReportRow,
  AdminCourseRow,
  AdminReportSummary,
  CourseStatus,
  DraftCourseInput,
  MentorOption,
} from '../types';

// Klien kecil untuk memanggil RPC; kompatibel dengan klien Supabase nyata maupun mock unit test.
// Modul ini sengaja tidak mengimpor @supabase/supabase-js supaya bisa diuji tanpa jaringan.
export type AdminRpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: any; error: any }>;
};

// Klien baca tulis tabel dipakai layar kelola course. Rantainya sengaja dibiarkan longgar
// supaya klien nyata dan klien palsu unit test sama-sama bisa dipakai.
export type AdminDataClient = {
  from: (table: string) => any;
};

export type AdminClient = AdminDataClient & AdminRpcClient;

// Kode galat RPC diterjemahkan di satu tempat supaya layar tidak menampilkan kode mentah.
// Daftar ini sekaligus menjadi daftar kasus gagal yang layak diperagakan saat demo.
const ERROR_TRANSLATIONS: Array<{ test: RegExp; message: string }> = [
  { test: /not_admin/i, message: 'Halaman ini hanya untuk admin. Masuk memakai akun admin.' },
  { test: /not_authenticated|JWT/i, message: 'Sesi Anda telah berakhir. Silakan masuk ulang melalui tab Akun.' },
  { test: /permission denied/i, message: 'Aksi ditolak: akun Anda tidak memiliki izin admin.' },
  {
    test: /Only admins can publish courses/i,
    message: 'Hanya admin yang dapat menerbitkan course. Masuk memakai akun admin.',
  },
  {
    test: /Course not found or not in draft status/i,
    message: 'Course tidak ditemukan atau statusnya bukan draf. Muat ulang daftar course.',
  },
  {
    test: /Cannot publish a course without lessons/i,
    message: 'Course belum punya materi. Tambahkan minimal satu materi lewat akun mentor sebelum menerbitkan.',
  },
  { test: /courses_capacity_check/i, message: 'Kapasitas harus angka bulat lebih besar dari 0.' },
  { test: /null value in column "title"/i, message: 'Judul course wajib diisi.' },
  { test: /row-level security policy/i, message: 'Aksi ditolak: akun Anda tidak memiliki izin admin.' },
];

export const friendlyAdminError = (error: unknown): string => {
  if (!error) return 'Terjadi galat yang tidak diketahui.';
  const raw = typeof error === 'string' ? error : (error as { message?: string }).message || String(error);
  for (const item of ERROR_TRANSLATIONS) {
    if (item.test.test(raw)) return item.message;
  }
  return raw;
};

const toStatus = (value: unknown): CourseStatus => (value === 'published' ? 'published' : 'draft');

// Memanggil admin_course_report. Tanpa courseId, seluruh course dilaporkan termasuk draft
// dan course yang belum punya mentor. RPC sendiri yang memeriksa peran admin pemanggil.
export const fetchAdminCourseReport = async (
  client: AdminRpcClient | null,
  courseId: string | null = null
): Promise<AdminCourseReportRow[]> => {
  if (!client) throw new Error('Koneksi database belum diatur. Isi berkas .env dulu.');

  const { data, error } = await client.rpc('admin_course_report', { p_course_id: courseId });
  if (error) throw new Error(friendlyAdminError(error));

  return ((data || []) as any[]).map((row) => ({
    courseId: String(row.course_id),
    courseTitle: String(row.course_title),
    mentorName: String(row.mentor_name ?? ''),
    status: toStatus(row.status),
    totalLessons: Number(row.total_lessons),
    totalParticipants: Number(row.total_participants),
    averageProgress: Number(row.average_progress),
    completedParticipants: Number(row.completed_participants),
  }));
};

// Ringkasan lintas course. Rerata dihitung berbobot lesson supaya course kecil
// tidak mendominasi course besar. Nilai nol dipakai saat belum ada lesson atau peserta.
export const summarizeReport = (rows: AdminCourseReportRow[]): AdminReportSummary => {
  let possible = 0;
  let done = 0;
  let totalCompleted = 0;
  let totalParticipants = 0;

  for (const row of rows) {
    const seats = row.totalLessons * row.totalParticipants;
    possible += seats;
    done += seats * (row.averageProgress / 100);
    totalCompleted += row.completedParticipants;
    totalParticipants += row.totalParticipants;
  }

  return {
    totalCourses: rows.length,
    totalParticipants,
    totalCompleted,
    averageProgress: possible === 0 ? 0 : Math.round((done / possible) * 1000) / 10,
  };
};

// Kelola course: daftar, pasang mentor, atur kapasitas, dan terbitkan.
// Kolom yang dibaca mengikuti skema courses pada migration 20261012110000.

const toAdminCourseRow = (row: any): AdminCourseRow => ({
  courseId: String(row.id),
  title: String(row.title ?? ''),
  description: String(row.description ?? ''),
  category: String(row.category ?? ''),
  capacity: Number(row.capacity ?? 0),
  status: toStatus(row.status),
  mentorId: row.mentor_id ? String(row.mentor_id) : null,
  // Nama mentor dibaca lewat relasi profiles. Bila course belum punya mentor,
  // kolom tampil kosong dan layar menuliskan keterangan belum ada mentor.
  mentorName: String(row.profiles?.display_name ?? '').trim(),
  // Tabel lessons tidak punya foreign key langsung ke courses, hanya lewat
  // course_modules, jadi jumlah materi dihitung dari relasi bertingkat itu.
  totalLessons: countLessons(row.course_modules),
});

// Menjumlahkan materi dari seluruh modul. Bentuk null dipakai untuk course baru.
const countLessons = (modules: any[] | null | undefined): number =>
  (Array.isArray(modules) ? modules : []).reduce(
    (sum, module) => sum + (Array.isArray(module?.lessons) ? module.lessons.length : 0),
    0
  );

// Daftar seluruh course, draf maupun terbit, terbaru lebih dulu.
// Kolom yang diminta sengaja sama dengan yang dipakai formulir supaya hasilnya bisa langsung diedit.
export const fetchAdminCourses = async (client: AdminDataClient | null): Promise<AdminCourseRow[]> => {
  if (!client) throw new Error('Koneksi database belum diatur. Isi berkas .env dulu.');

  const { data, error } = await client
    .from('courses')
    .select(
      'id,title,description,category,capacity,status,mentor_id,profiles(display_name),course_modules(id,lessons(id))'
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(friendlyAdminError(error));

  return ((data || []) as any[]).map(toAdminCourseRow);
};

// Akun mentor untuk daftar pilihan pada formulir course.
// Hanya kolom id dan display_name yang dibaca supaya tabel profiles tetap ringan.
export const fetchMentorOptions = async (client: AdminDataClient | null): Promise<MentorOption[]> => {
  if (!client) throw new Error('Koneksi database belum diatur. Isi berkas .env dulu.');

  const { data, error } = await client
    .from('profiles')
    .select('id,display_name')
    .eq('role', 'mentor')
    .order('display_name', { ascending: true });

  if (error) throw new Error(friendlyAdminError(error));

  return ((data || []) as any[]).map((row) => ({
    id: String(row.id),
    displayName: String(row.display_name ?? '').trim() || 'Mentor tanpa nama',
  }));
};

// Judul wajib diisi dan kapasitas harus bilangan bulat positif.
// Pemeriksaan ini menyalin aturan kolom di database supaya kesalahan terlihat lebih dulu.
export const validateDraftCourseInput = (input: DraftCourseInput): string | null => {
  if (!input.title || !input.title.trim()) return 'Judul course wajib diisi.';
  if (!Number.isInteger(input.capacity) || input.capacity <= 0) {
    return 'Kapasitas harus angka bulat lebih besar dari 0.';
  }
  return null;
};

// Membuat draf course baru atau menyimpan perubahan draf yang sudah ada.
// Mengembalikan id course supaya layar bisa langsung memilihnya setelah dibuat.
export const saveDraftCourse = async (
  client: AdminDataClient | null,
  input: DraftCourseInput,
  courseId: string | null = null
): Promise<string> => {
  if (!client) throw new Error('Koneksi database belum diatur. Isi berkas .env dulu.');

  const problem = validateDraftCourseInput(input);
  if (problem) throw new Error(problem);

  const payload = {
    title: input.title.trim(),
    description: input.description.trim() || null,
    category: input.category.trim() || null,
    capacity: input.capacity,
    mentor_id: input.mentorId,
  };

  if (courseId) {
    const { error } = await client.from('courses').update(payload).eq('id', courseId);
    if (error) throw new Error(friendlyAdminError(error));
    return courseId;
  }

  const { data, error } = await client
    .from('courses')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw new Error(friendlyAdminError(error));
  if (!data?.id) throw new Error('Course baru tidak mengembalikan id.');
  return String(data.id);
};

// Menerbitkan draf course lewat RPC publish_course.
// Pemeriksaan peran admin, status draf, dan jumlah materi dilakukan di database.
export const publishCourse = async (
  client: AdminRpcClient | null,
  courseId: string
): Promise<void> => {
  if (!client) throw new Error('Koneksi database belum diatur. Isi berkas .env dulu.');
  if (!courseId) throw new Error('Course belum dipilih.');

  const { error } = await client.rpc('publish_course', { p_course_id: courseId });
  if (error) throw new Error(friendlyAdminError(error));
};
