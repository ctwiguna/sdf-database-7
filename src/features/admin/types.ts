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
