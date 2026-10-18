import {
  AdminDataClient,
  fetchAdminCourses,
  fetchMentorOptions,
  friendlyAdminError,
  publishCourse,
  saveDraftCourse,
  validateDraftCourseInput,
} from '../features/admin/lib/admin';

// Klien palsu dengan rantai from/select/eq/order/insert/update/single.
// Setiap pemanggilan dicatat supaya nama tabel, payload, dan argumen filter bisa diperiksa.
type Capture = {
  table: string;
  op: string;
  select?: string;
  payload?: Record<string, unknown>;
  eq?: [string, unknown];
  order?: [string, unknown];
};

const makeClient = (result: { data: any; error: any }, captures: Capture[]): AdminDataClient => ({
  from: (table: string) => {
    const entry: Capture = { table, op: 'select' };
    captures.push(entry);
    const chain: any = {
      select: (columns: string) => {
        entry.select = columns;
        return chain;
      },
      eq: (column: string, value: unknown) => {
        entry.eq = [column, value];
        return chain;
      },
      order: async (column: string, options: unknown) => {
        entry.order = [column, options];
        return result;
      },
      insert: (payload: Record<string, unknown>) => {
        entry.op = 'insert';
        entry.payload = payload;
        return chain;
      },
      update: (payload: Record<string, unknown>) => {
        entry.op = 'update';
        entry.payload = payload;
        return chain;
      },
      single: async () => result,
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject),
    };
    return chain;
  },
});

const courseRow = (over: Record<string, unknown> = {}) => ({
  id: 'c1',
  title: 'Dasar Sistem Solar Panel',
  description: 'Pengenalan energi surya',
  category: 'Energi',
  capacity: 30,
  status: 'draft',
  mentor_id: 'm1',
  profiles: { display_name: 'Surya' },
  course_modules: [{ id: 'mod1', lessons: [{ id: 'l1' }, { id: 'l2' }] }],
  ...over,
});

describe('kelola course admin', () => {
  it('memetakan baris course beserta nama mentor dan jumlah materi', async () => {
    const captures: Capture[] = [];
    const client = makeClient({ data: [courseRow()], error: null }, captures);

    expect(await fetchAdminCourses(client)).toEqual([
      {
        courseId: 'c1',
        title: 'Dasar Sistem Solar Panel',
        description: 'Pengenalan energi surya',
        category: 'Energi',
        capacity: 30,
        status: 'draft',
        mentorId: 'm1',
        mentorName: 'Surya',
        totalLessons: 2,
      },
    ]);
    expect(captures[0].table).toBe('courses');
    expect(captures[0].select).toContain('course_modules(id,lessons(id))');
  });

  it('menandai course tanpa mentor dan tanpa materi dengan nilai yang aman', async () => {
    const captures: Capture[] = [];
    const client = makeClient(
      { data: [courseRow({ mentor_id: null, profiles: null, course_modules: null, status: 'draft' })], error: null },
      captures
    );
    const [mapped] = await fetchAdminCourses(client);
    expect(mapped.mentorId).toBeNull();
    expect(mapped.mentorName).toBe('');
    expect(mapped.totalLessons).toBe(0);
    expect(mapped.status).toBe('draft');
  });

  it('menolak dengan pesan jelas bila koneksi database belum diatur', async () => {
    await expect(fetchAdminCourses(null)).rejects.toThrow('Koneksi database belum diatur');
    await expect(fetchMentorOptions(null)).rejects.toThrow('Koneksi database belum diatur');
  });

  it('memetakan pilihan mentor dan menandai nama kosong', async () => {
    const captures: Capture[] = [];
    const client = makeClient(
      {
        data: [
          { id: 'm1', display_name: 'Surya' },
          { id: 'm2', display_name: null },
        ],
        error: null,
      },
      captures
    );
    expect(await fetchMentorOptions(client)).toEqual([
      { id: 'm1', displayName: 'Surya' },
      { id: 'm2', displayName: 'Mentor tanpa nama' },
    ]);
    expect(captures[0].table).toBe('profiles');
    expect(captures[0].eq).toEqual(['role', 'mentor']);
  });

  it('memvalidasi judul dan kapasitas sebelum menyimpan', () => {
    expect(validateDraftCourseInput({ title: '', description: '', category: '', capacity: 10, mentorId: null })).toBe(
      'Judul course wajib diisi.'
    );
    expect(validateDraftCourseInput({ title: 'A', description: '', category: '', capacity: 0, mentorId: null })).toBe(
      'Kapasitas harus angka bulat lebih besar dari 0.'
    );
    expect(validateDraftCourseInput({ title: 'A', description: '', category: '', capacity: 2.5, mentorId: null })).toBe(
      'Kapasitas harus angka bulat lebih besar dari 0.'
    );
    expect(validateDraftCourseInput({ title: 'A', description: '', category: '', capacity: 5, mentorId: null })).toBeNull();
  });

  it('insert draf baru dengan payload bersih lalu mengembalikan id dari database', async () => {
    const captures: Capture[] = [];
    const client = makeClient({ data: { id: 'c9' }, error: null }, captures);

    const id = await saveDraftCourse(client, {
      title: '  Course Baru  ',
      description: '',
      category: 'Teknik',
      capacity: 15,
      mentorId: 'm1',
    });

    expect(id).toBe('c9');
    expect(captures[0].op).toBe('insert');
    expect(captures[0].payload).toEqual({
      title: 'Course Baru',
      description: null,
      category: 'Teknik',
      capacity: 15,
      mentor_id: 'm1',
    });
  });

  it('update draf memakai id course dan menyaring baris dengan eq', async () => {
    const captures: Capture[] = [];
    const client = makeClient({ data: null, error: null }, captures);

    const id = await saveDraftCourse(
      client,
      { title: 'Judul Baru', description: 'Isi', category: '', capacity: 20, mentorId: null },
      'c1'
    );

    expect(id).toBe('c1');
    expect(captures[0].op).toBe('update');
    expect(captures[0].eq).toEqual(['id', 'c1']);
    expect(captures[0].payload).toEqual({
      title: 'Judul Baru',
      description: 'Isi',
      category: null,
      capacity: 20,
      mentor_id: null,
    });
  });

  it('memanggil RPC publish_course dengan nama argumen yang dipakai migration', async () => {
    let called: [string, Record<string, unknown>] | null = null;
    const client = {
      from: () => {
        throw new Error('tidak dipakai');
      },
      rpc: async (fn: string, args: Record<string, unknown>) => {
        called = [fn, args];
        return { data: null, error: null };
      },
    };

    await publishCourse(client, 'c1');
    expect(called).toEqual(['publish_course', { p_course_id: 'c1' }]);
  });

  it('menerjemahkan penolakan database saat course belum punya materi', async () => {
    const client = {
      from: () => {
        throw new Error('tidak dipakai');
      },
      rpc: async () => ({ data: null, error: { message: 'Cannot publish a course without lessons' } }),
    };

    await expect(publishCourse(client, 'c1')).rejects.toThrow('belum punya materi');
  });

  it('menerjemahkan pesan error admin dan kapasitas dari database', async () => {
    expect(friendlyAdminError({ message: 'Only admins can publish courses' })).toBe(
      'Hanya admin yang dapat menerbitkan course. Masuk memakai akun admin.'
    );
    expect(friendlyAdminError({ message: 'violates check constraint "courses_capacity_check"' })).toBe(
      'Kapasitas harus angka bulat lebih besar dari 0.'
    );
    expect(friendlyAdminError({ message: 'Course not found or not in draft status' })).toBe(
      'Course tidak ditemukan atau statusnya bukan draf. Muat ulang daftar course.'
    );
  });
});
