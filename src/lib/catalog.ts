import { mockCourses } from '../data/mockCourses';
import { colors } from '../theme';
import { Course, Lesson, Module, ProgressMap } from '../types';

// Lapisan data katalog, pendaftaran, dan progres.
// Klien Supabase diterima sebagai parameter supaya modul ini bisa diuji dengan klien palsu.

export type QueryResult = {
  data: unknown[] | null;
  error: { message: string } | null;
};

export type OrderableQuery = PromiseLike<QueryResult> & {
  order: (column: string, options?: { ascending?: boolean }) => PromiseLike<QueryResult>;
};

export type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => OrderableQuery;
    };
  };
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }>;
};

export type CatalogSource = 'database' | 'demo' | 'fallback';

export type CatalogResult = {
  courses: Course[];
  source: CatalogSource;
  message: string | null;
};

export type LessonRow = {
  id: string;
  title: string;
  position: number;
  youtube_video_id: string;
};

export type ModuleRow = {
  id: string;
  title: string;
  position: number;
  lessons: LessonRow[] | null;
};

export type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  profiles: { display_name: string | null } | null;
  course_modules: ModuleRow[] | null;
};

export type EnrollmentRow = {
  id: string;
  course_id: string;
};

const COURSE_MODULES_SELECT = 'course_modules(id,title,position,lessons(id,title,position,youtube_video_id))';

const COURSE_SELECT = [
  'id',
  'title',
  'description',
  'category',
  'profiles(display_name)',
  COURSE_MODULES_SELECT,
].join(',');

// Tabel profiles sengaja hanya dibuka untuk pengguna yang masuk (policy
// profiles_select_authenticated). Tamu tetap membaca katalog published, tetapi
// kolom mentor tidak diminta supaya query tidak ditolak database dan katalog
// tidak jatuh ke data contoh.
const COURSE_SELECT_WITHOUT_MENTOR = ['id', 'title', 'description', 'category', COURSE_MODULES_SELECT].join(',');

const CATEGORY_COLORS: Record<string, string> = {
  Energi: colors.pastelPeach,
  Teknik: colors.pastelLavender,
  'Kendaraan Listrik': '#DDECCF',
};

const PALETTE = [colors.pastelPeach, colors.pastelLavender, '#DDECCF', '#F4E5C8'];

// Pesan galat RPC diterjemahkan supaya siswa membaca kalimat yang jelas.
const RPC_MESSAGES: Record<string, string> = {
  not_authenticated: 'Sesi berakhir. Masuk ulang dari tab Akun.',
  role_not_allowed: 'Aksi ini hanya untuk akun siswa.',
  course_not_found: 'Course tidak ditemukan.',
  course_not_published: 'Course belum diterbitkan.',
  course_capacity_full: 'Kuota course ini sudah penuh.',
  not_enrolled: 'Kamu belum terdaftar di course ini.',
  lesson_not_found: 'Materi tidak ditemukan.',
};

export const friendlyRpcMessage = (message: string): string => {
  const code = Object.keys(RPC_MESSAGES).find((item) => message.includes(item));
  return code ? RPC_MESSAGES[code] : message;
};

export const colorForCategory = (category: string | null, index: number): string =>
  CATEGORY_COLORS[category ?? ''] ?? PALETTE[index % PALETTE.length];

const toLesson = (row: LessonRow): Lesson => ({
  id: row.id,
  title: row.title,
  position: row.position,
  videoId: row.youtube_video_id,
});

const toModule = (row: ModuleRow): Module => ({
  id: row.id,
  title: row.title,
  position: row.position,
  lessons: [...(row.lessons ?? [])].sort((a, b) => a.position - b.position).map(toLesson),
});

export const mapCatalogRows = (rows: CourseRow[]): Course[] =>
  rows.map((row, index) => ({
    id: row.id,
    title: row.title,
    mentor: row.profiles?.display_name?.trim() || 'Future Skill Team',
    description: row.description ?? '',
    category: row.category ?? 'Umum',
    color: colorForCategory(row.category, index),
    modules: [...(row.course_modules ?? [])].sort((a, b) => a.position - b.position).map(toModule),
  }));

export type LoadCatalogOptions = {
  // Nama mentor ada di tabel profiles yang hanya bisa dibaca pengguna masuk.
  // Tamu memakai nilai false supaya katalog tetap tampil tanpa nama mentor asli.
  includeMentor?: boolean;
};

export const loadCatalog = async (
  client: SupabaseLike | null,
  options: LoadCatalogOptions = {}
): Promise<CatalogResult> => {
  if (!client) return { courses: mockCourses, source: 'demo', message: null };

  const columns = options.includeMentor === false ? COURSE_SELECT_WITHOUT_MENTOR : COURSE_SELECT;

  const { data, error } = await client
    .from('courses')
    .select(columns)
    .eq('status', 'published')
    .order('created_at', { ascending: true });

  if (error) return { courses: mockCourses, source: 'fallback', message: error.message };
  if (!data || data.length === 0) {
    return { courses: mockCourses, source: 'fallback', message: 'Katalog database masih kosong.' };
  }
  return { courses: mapCatalogRows(data as CourseRow[]), source: 'database', message: null };
};

export const loadEnrollments = async (client: SupabaseLike, userId: string): Promise<EnrollmentRow[]> => {
  const { data, error } = await client.from('enrollments').select('id,course_id').eq('student_id', userId);
  if (error || !data) return [];
  return data as EnrollmentRow[];
};

const loadProgressForEnrollment = async (client: SupabaseLike, enrollmentId: string): Promise<string[]> => {
  const { data, error } = await client.from('lesson_progress').select('lesson_id').eq('enrollment_id', enrollmentId);
  if (error || !data) return [];
  return (data as { lesson_id: string }[]).map((row) => row.lesson_id);
};

export const loadProgress = async (client: SupabaseLike, enrollments: EnrollmentRow[]): Promise<ProgressMap> => {
  const groups = await Promise.all(enrollments.map((row) => loadProgressForEnrollment(client, row.id)));
  const map: ProgressMap = {};
  groups.flat().forEach((lessonId) => {
    map[lessonId] = true;
  });
  return map;
};

const callRpc = async (client: SupabaseLike, name: string, args: Record<string, unknown>): Promise<void> => {
  const { error } = await client.rpc(name, args);
  if (error) throw new Error(friendlyRpcMessage(error.message));
};

export const enrollInCourse = (client: SupabaseLike, courseId: string): Promise<void> =>
  callRpc(client, 'enroll_course', { p_course_id: courseId });

export const markLessonComplete = (client: SupabaseLike, lessonId: string): Promise<void> =>
  callRpc(client, 'complete_lesson', { p_lesson_id: lessonId });
