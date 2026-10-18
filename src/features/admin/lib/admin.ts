import { AdminCourseReportRow, AdminReportSummary, CourseStatus } from '../types';

// Klien kecil untuk memanggil RPC; kompatibel dengan klien Supabase nyata maupun mock unit test.
// Modul ini sengaja tidak mengimpor @supabase/supabase-js supaya bisa diuji tanpa jaringan.
export type AdminRpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: any; error: any }>;
};

// Kode galat RPC diterjemahkan di satu tempat supaya layar tidak menampilkan kode mentah.
// Daftar ini sekaligus menjadi daftar kasus gagal yang layak diperagakan saat demo.
const ERROR_TRANSLATIONS: Array<{ test: RegExp; message: string }> = [
  { test: /not_admin/i, message: 'Halaman ini hanya untuk admin. Masuk memakai akun admin.' },
  { test: /not_authenticated|JWT/i, message: 'Sesi Anda telah berakhir. Silakan masuk ulang melalui tab Akun.' },
  { test: /permission denied/i, message: 'Aksi ditolak: akun Anda tidak memiliki izin admin.' },
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
