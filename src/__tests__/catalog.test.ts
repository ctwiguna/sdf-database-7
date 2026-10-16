import {
  enrollInCourse,
  loadCatalog,
  loadEnrollments,
  loadProgress,
  mapCatalogRows,
  markLessonComplete,
  CourseRow,
  SupabaseLike,
} from '../lib/catalog';
import { mockCourses } from '../data/mockCourses';

type Response = { data: unknown[] | null; error: { message: string } | null };

// PostgREST hanya mengembalikan kolom yang diminta, jadi embed yang tidak diminta hilang dari respons.
const withoutEmbeddedProfiles = (rows: unknown[] | null): unknown[] | null => {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => {
    if (!row || typeof row !== 'object' || !('profiles' in row)) return row;
    const rest = { ...(row as Record<string, unknown>) };
    delete rest.profiles;
    return rest;
  });
};

// Klien palsu: mencatat query yang dipanggil dan mengembalikan respons yang disiapkan.
const createFakeClient = (
  responses: Record<string, Response>,
  rpcResponse: { error: { message: string } | null } = { error: null },
  options: { denyProfilesEmbed?: boolean } = {}
) => {
  const calls: { table: string; column: string; value: unknown }[] = [];
  const rpcCalls: { name: string; args: Record<string, unknown> }[] = [];
  const selectColumns: string[] = [];

  const client = {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: unknown) => {
          calls.push({ table, column, value });
          selectColumns.push(columns);
          // Meniru PostgREST: embed ke profiles ditolak untuk tamu, dan kolom yang tidak diminta tidak dikembalikan.
          const sheet = responses[table] ?? { data: [], error: null };
          const denied = Boolean(options.denyProfilesEmbed) && columns.includes('profiles(');
          const result = denied
            ? { data: null, error: { message: 'permission denied for table profiles' } }
            : columns.includes('profiles(')
              ? sheet
              : { ...sheet, data: withoutEmbeddedProfiles(sheet.data) };
          return {
            order: () => Promise.resolve(result),
            then: (onFulfilled: (value: Response) => unknown, onRejected: (reason: unknown) => unknown) =>
              Promise.resolve(result).then(onFulfilled, onRejected),
          };
        },
      }),
    }),
    rpc: (name: string, args: Record<string, unknown>) => {
      rpcCalls.push({ name, args });
      return Promise.resolve(rpcResponse);
    },
  } as unknown as SupabaseLike;

  return { client, calls, rpcCalls, selectColumns };
};

const courseRow: CourseRow = {
  id: 'course-1',
  title: 'Instalasi dan Maintenance Solar Panel',
  description: 'Pengenalan komponen dan keselamatan.',
  category: 'Energi',
  profiles: { display_name: 'Mentor Satu' },
  course_modules: [
    {
      id: 'module-2',
      title: 'Modul kedua',
      position: 2,
      lessons: [
        { id: 'lesson-2b', title: 'Materi kedua', position: 2, youtube_video_id: 'abcdefghijk' },
        { id: 'lesson-2a', title: 'Materi pertama', position: 1, youtube_video_id: 'abcdefghijk' },
      ],
    },
    {
      id: 'module-1',
      title: 'Modul pertama',
      position: 1,
      lessons: [{ id: 'lesson-1', title: 'Materi awal', position: 1, youtube_video_id: 'lmnopqrstuv' }],
    },
  ],
};

describe('pemetaan katalog dari database', () => {
  it('mengurutkan modul dan materi mengikuti position', () => {
    const courses = mapCatalogRows([courseRow]);
    expect(courses[0].modules.map((module) => module.id)).toEqual(['module-1', 'module-2']);
    expect(courses[0].modules[1].lessons.map((lesson) => lesson.id)).toEqual(['lesson-2a', 'lesson-2b']);
  });

  it('memakai nama mentor dan warna kategori yang dikenal', () => {
    const courses = mapCatalogRows([courseRow]);
    expect(courses[0].mentor).toBe('Mentor Satu');
    expect(courses[0].color).toBe('#F4D9CB');
  });

  it('memberi nilai cadangan saat mentor, deskripsi, dan kategori kosong', () => {
    const courses = mapCatalogRows([{ ...courseRow, profiles: null, description: null, category: null }]);
    expect(courses[0].mentor).toBe('Future Skill Team');
    expect(courses[0].description).toBe('');
    expect(courses[0].modules[0].lessons[0].videoId).toBe('lmnopqrstuv');
  });
});

describe('loadCatalog', () => {
  it('memakai data contoh saat kredensial belum diisi', async () => {
    const result = await loadCatalog(null);
    expect(result.source).toBe('demo');
    expect(result.courses).toEqual(mockCourses);
  });

  it('membaca katalog dari database saat tersedia', async () => {
    const fake = createFakeClient({ courses: { data: [courseRow], error: null } });
    const result = await loadCatalog(fake.client);
    expect(result.source).toBe('database');
    expect(result.courses[0].title).toBe(courseRow.title);
  });

  it('jatuh ke data contoh saat query gagal', async () => {
    const fake = createFakeClient({ courses: { data: null, error: { message: 'koneksi gagal' } } });
    const result = await loadCatalog(fake.client);
    expect(result.source).toBe('fallback');
    expect(result.message).toBe('koneksi gagal');
    expect(result.courses).toEqual(mockCourses);
  });

  it('jatuh ke data contoh saat katalog database kosong', async () => {
    const fake = createFakeClient({ courses: { data: [], error: null } });
    const result = await loadCatalog(fake.client);
    expect(result.source).toBe('fallback');
  });

  it('tidak meminta kolom mentor saat tamu membaca katalog', async () => {
    const fake = createFakeClient({ courses: { data: [courseRow], error: null } });
    const result = await loadCatalog(fake.client, { includeMentor: false });
    expect(result.source).toBe('database');
    expect(fake.selectColumns.every((columns) => !columns.includes('profiles('))).toBe(true);
    expect(result.courses[0].mentor).toBe('Future Skill Team');
  });

  it('meminta kolom mentor saat pengguna masuk membaca katalog', async () => {
    const fake = createFakeClient({ courses: { data: [courseRow], error: null } });
    const result = await loadCatalog(fake.client, { includeMentor: true });
    expect(result.source).toBe('database');
    expect(fake.selectColumns.some((columns) => columns.includes('profiles(display_name)'))).toBe(true);
    expect(result.courses[0].mentor).toBe('Mentor Satu');
  });

  it('tamu tetap mendapat katalog saat embed mentor ditolak database', async () => {
    const fake = createFakeClient(
      { courses: { data: [courseRow], error: null } },
      { error: null },
      { denyProfilesEmbed: true }
    );
    const result = await loadCatalog(fake.client, { includeMentor: false });
    expect(result.source).toBe('database');
    expect(result.courses[0].title).toBe(courseRow.title);
    expect(result.courses[0].mentor).toBe('Future Skill Team');
  });

  it('mencatat akar masalah tamu: query dengan embed mentor ditolak database', async () => {
    const fake = createFakeClient(
      { courses: { data: [courseRow], error: null } },
      { error: null },
      { denyProfilesEmbed: true }
    );
    const result = await loadCatalog(fake.client);
    expect(result.source).toBe('fallback');
    expect(result.message).toContain('permission denied');
  });
});

describe('pendaftaran dan progres', () => {
  it('membaca enrollment milik satu siswa', async () => {
    const fake = createFakeClient({ enrollments: { data: [{ id: 'enroll-1', course_id: 'course-1' }], error: null } });
    const rows = await loadEnrollments(fake.client, 'user-1');
    expect(rows).toEqual([{ id: 'enroll-1', course_id: 'course-1' }]);
    expect(fake.calls[0]).toEqual({ table: 'enrollments', column: 'student_id', value: 'user-1' });
  });

  it('menggabungkan progres dari beberapa enrollment', async () => {
    const fake = createFakeClient({ lesson_progress: { data: [{ lesson_id: 'lesson-1' }], error: null } });
    const map = await loadProgress(fake.client, [
      { id: 'enroll-1', course_id: 'course-1' },
      { id: 'enroll-2', course_id: 'course-2' },
    ]);
    expect(map).toEqual({ 'lesson-1': true });
  });

  it('memanggil RPC enroll_course dengan id course', async () => {
    const fake = createFakeClient({});
    await enrollInCourse(fake.client, 'course-9');
    expect(fake.rpcCalls[0]).toEqual({ name: 'enroll_course', args: { p_course_id: 'course-9' } });
  });

  it('memanggil RPC complete_lesson dengan id materi', async () => {
    const fake = createFakeClient({});
    await markLessonComplete(fake.client, 'lesson-7');
    expect(fake.rpcCalls[0]).toEqual({ name: 'complete_lesson', args: { p_lesson_id: 'lesson-7' } });
  });

  it('menerjemahkan galat RPC kuota penuh', async () => {
    const fake = createFakeClient({}, { error: { message: 'course_capacity_full' } });
    await expect(enrollInCourse(fake.client, 'course-9')).rejects.toThrow('Kuota course ini sudah penuh.');
  });
});
