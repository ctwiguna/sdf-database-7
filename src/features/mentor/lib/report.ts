import { friendlyErrorMessage } from './mentor';

// Klien kecil untuk memanggil RPC; kompatibel dengan klien Supabase nyata maupun mock test.
export type MentorRpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: any; error: any }>;
};

export type MentorReportRow = {
  enrollmentId: string;
  studentName: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  isCompleted: boolean;
};

// Memanggil mentor_course_report (migration PR #14). Tidak ada skor atau penilaian.
export const fetchMentorReport = async (
  client: MentorRpcClient,
  courseId: string
): Promise<MentorReportRow[]> => {
  const { data, error } = await client.rpc('mentor_course_report', { p_course_id: courseId });
  if (error) {
    throw new Error(friendlyErrorMessage(error));
  }
  return ((data || []) as any[]).map((row) => ({
    enrollmentId: row.enrollment_id,
    studentName: row.student_name,
    totalLessons: Number(row.total_lessons),
    completedLessons: Number(row.completed_lessons),
    progressPercent: Number(row.progress_percent),
    isCompleted: Boolean(row.is_completed),
  }));
};
