// Tipe layar admin. Bentuk baris mengikuti kolom RPC admin_course_report
// (supabase/migrations/20261017150000_admin_course_report.sql).

export type CourseStatus = 'draft' | 'published';

// Satu baris berisi satu course beserta angka agregatnya.
// Angka dihitung di database saat RPC dipanggil, bukan di sisi aplikasi.
export type AdminCourseReportRow = {
  courseId: string;
  courseTitle: string;
  mentorName: string;
  status: CourseStatus;
  totalLessons: number;
  totalParticipants: number;
  averageProgress: number;
  completedParticipants: number;
};

// Ringkasan lintas course untuk kepala halaman laporan.
export type AdminReportSummary = {
  totalCourses: number;
  totalParticipants: number;
  totalCompleted: number;
  averageProgress: number;
};

// Baris layar kelola course. Bentuknya mengikuti kolom tabel courses apa adanya,
// ditambah nama mentor dan jumlah materi. Angka agregat peserta ada di tipe laporan.
export type AdminCourseRow = {
  courseId: string;
  title: string;
  description: string;
  category: string;
  capacity: number;
  status: CourseStatus;
  mentorId: string | null;
  mentorName: string;
  totalLessons: number;
};

// Akun mentor yang bisa dipasangkan ke course pada formulir.
export type MentorOption = {
  id: string;
  displayName: string;
};

// Isian formulir buat atau ubah draf course.
// mentorId null berarti course belum punya mentor dan belum boleh diterbitkan.
export type DraftCourseInput = {
  title: string;
  description: string;
  category: string;
  capacity: number;
  mentorId: string | null;
};
