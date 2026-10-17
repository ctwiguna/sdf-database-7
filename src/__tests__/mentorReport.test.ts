import { fetchMentorReport, MentorRpcClient } from '../features/mentor/lib/report';

const rpcReturning = (result: { data: any; error: any }): MentorRpcClient => ({
  rpc: async () => result,
});

describe('laporan peserta mentor', () => {
  it('memetakan kolom RPC dan mengubah persentase string menjadi angka', async () => {
    const client = rpcReturning({
      data: [{ enrollment_id: 'e1', student_name: 'Ani', total_lessons: 2, completed_lessons: 1, progress_percent: '50.0', is_completed: false }],
      error: null,
    });
    expect(await fetchMentorReport(client, 'c1')).toEqual([
      { enrollmentId: 'e1', studentName: 'Ani', totalLessons: 2, completedLessons: 1, progressPercent: 50, isCompleted: false },
    ]);
  });

  it('mengembalikan daftar kosong untuk course tanpa peserta', async () => {
    expect(await fetchMentorReport(rpcReturning({ data: [], error: null }), 'c1')).toEqual([]);
  });

  it('menandai peserta yang seluruh lesson-nya selesai', async () => {
    const client = rpcReturning({
      data: [{ enrollment_id: 'e2', student_name: 'Budi', total_lessons: 2, completed_lessons: 2, progress_percent: 100, is_completed: true }],
      error: null,
    });
    expect((await fetchMentorReport(client, 'c1'))[0].isCompleted).toBe(true);
  });

  it('menolak dengan pesan jelas bila bukan mentor course', async () => {
    const client = rpcReturning({ data: null, error: { message: 'not_course_mentor' } });
    await expect(fetchMentorReport(client, 'c1')).rejects.toThrow('mentor pemilik course');
  });
});
