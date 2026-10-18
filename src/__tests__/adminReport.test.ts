import {
  AdminRpcClient,
  fetchAdminCourseReport,
  friendlyAdminError,
  summarizeReport,
} from '../features/admin/lib/admin';

const row = (over: Record<string, unknown> = {}) => ({
  course_id: 'c1',
  course_title: 'Dasar Sistem Solar Panel',
  mentor_name: 'Surya',
  status: 'published',
  total_lessons: 2,
  total_participants: 3,
  average_progress: '66.7',
  completed_participants: 1,
  ...over,
});

const rpcReturning = (result: { data: any; error: any }): AdminRpcClient => ({
  rpc: async () => result,
});

describe('laporan course admin', () => {
  it('memetakan kolom RPC dan mengubah nilai string menjadi angka', async () => {
    expect(await fetchAdminCourseReport(rpcReturning({ data: [row()], error: null }))).toEqual([
      {
        courseId: 'c1',
        courseTitle: 'Dasar Sistem Solar Panel',
        mentorName: 'Surya',
        status: 'published',
        totalLessons: 2,
        totalParticipants: 3,
        averageProgress: 66.7,
        completedParticipants: 1,
      },
    ]);
  });

  it('mengirim nama argumen p_course_id yang dipakai migration saat filter dipakai', async () => {
    let captured: Record<string, unknown> | null = null;
    const client: AdminRpcClient = {
      rpc: async (_fn: string, args: Record<string, unknown>) => {
        captured = args;
        return { data: [], error: null };
      },
    };
    await fetchAdminCourseReport(client, 'c9');
    expect(captured).toEqual({ p_course_id: 'c9' });
  });

  it('mengirim p_course_id bernilai null saat seluruh course diminta', async () => {
    let captured: Record<string, unknown> | null = null;
    const client: AdminRpcClient = {
      rpc: async (_fn: string, args: Record<string, unknown>) => {
        captured = args;
        return { data: [], error: null };
      },
    };
    await fetchAdminCourseReport(client);
    expect(captured).toEqual({ p_course_id: null });
  });

  it('mengembalikan daftar kosong bila belum ada course', async () => {
    expect(await fetchAdminCourseReport(rpcReturning({ data: [], error: null }))).toEqual([]);
  });

  it('menerima nilai nol dari course tanpa peserta atau tanpa lesson', async () => {
    const client = rpcReturning({
      data: [row({ total_participants: 0, average_progress: 0, completed_participants: 0 })],
      error: null,
    });
    const [mapped] = await fetchAdminCourseReport(client);
    expect(mapped.totalParticipants).toBe(0);
    expect(mapped.averageProgress).toBe(0);
    expect(mapped.completedParticipants).toBe(0);
  });

  it('menandai status di luar published sebagai draf', async () => {
    const client = rpcReturning({ data: [row({ status: 'draft' })], error: null });
    expect((await fetchAdminCourseReport(client))[0].status).toBe('draft');
  });

  it('menerjemahkan galat not_admin menjadi pesan yang bisa dibaca', async () => {
    await expect(
      fetchAdminCourseReport(rpcReturning({ data: null, error: { message: 'not_admin' } }))
    ).rejects.toThrow('hanya untuk admin');
  });

  it('menerjemahkan galat sesi berakhir', async () => {
    await expect(
      fetchAdminCourseReport(rpcReturning({ data: null, error: { message: 'not_authenticated' } }))
    ).rejects.toThrow('masuk ulang');
  });

  it('menolak dengan pesan jelas bila koneksi database belum diatur', async () => {
    await expect(fetchAdminCourseReport(null)).rejects.toThrow('Koneksi database belum diatur');
  });

  it('mengembalikan pesan asli untuk galat yang tidak dikenal', () => {
    expect(friendlyAdminError({ message: 'boom' })).toBe('boom');
    expect(friendlyAdminError(null)).toBe('Terjadi galat yang tidak diketahui.');
  });
});

describe('ringkasan laporan admin', () => {
  it('menghitung rerata progres berbobot jumlah lesson dan peserta', () => {
    const summary = summarizeReport([
      {
        courseId: 'c1',
        courseTitle: 'A',
        mentorName: 'Surya',
        status: 'published',
        totalLessons: 2,
        totalParticipants: 3,
        averageProgress: 50,
        completedParticipants: 1,
      },
      {
        courseId: 'c2',
        courseTitle: 'B',
        mentorName: 'Budi',
        status: 'draft',
        totalLessons: 1,
        totalParticipants: 1,
        averageProgress: 100,
        completedParticipants: 1,
      },
    ]);
    expect(summary).toEqual({ totalCourses: 2, totalParticipants: 4, totalCompleted: 2, averageProgress: 57.1 });
  });

  it('menghasilkan nol bila tidak ada lesson atau peserta', () => {
    expect(
      summarizeReport([
        {
          courseId: 'c1',
          courseTitle: 'A',
          mentorName: '',
          status: 'draft',
          totalLessons: 0,
          totalParticipants: 0,
          averageProgress: 0,
          completedParticipants: 0,
        },
      ])
    ).toEqual({ totalCourses: 1, totalParticipants: 0, totalCompleted: 0, averageProgress: 0 });
  });

  it('menghasilkan nol untuk daftar kosong', () => {
    expect(summarizeReport([])).toEqual({ totalCourses: 0, totalParticipants: 0, totalCompleted: 0, averageProgress: 0 });
  });
});
