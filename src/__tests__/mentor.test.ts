import {
  deleteLesson,
  deleteModule,
  fetchMentorCourseDetail,
  fetchMentorCourses,
  friendlyErrorMessage,
  getNextLessonPosition,
  getNextModulePosition,
  MentorDatabaseClient,
  saveLesson,
  saveModule,
  validateLessonForm,
  validateModuleForm,
} from '../features/mentor/lib/mentor';

describe('Mentor Feature - Data & Validation Layer', () => {
  describe('Form Validations', () => {
    test('validateModuleForm: menolak judul kosong', () => {
      expect(validateModuleForm({ title: '   ', position: 1 })).toBe('Judul modul wajib diisi.');
      expect(validateModuleForm({ title: '', position: 1 })).toBe('Judul modul wajib diisi.');
    });

    test('validateModuleForm: menolak posisi <= 0 atau non-integer', () => {
      expect(validateModuleForm({ title: 'Dasar', position: 0 })).toBe(
        'Nomor urutan modul harus berupa angka lebih besar dari 0.'
      );
      expect(validateModuleForm({ title: 'Dasar', position: -1 })).toBe(
        'Nomor urutan modul harus berupa angka lebih besar dari 0.'
      );
    });

    test('validateModuleForm: meloloskan data modul valid', () => {
      expect(validateModuleForm({ title: 'Pengenalan', position: 1 })).toBeNull();
    });

    test('validateLessonForm: menolak judul materi kosong', () => {
      expect(
        validateLessonForm({
          title: '',
          position: 1,
          youtube_video_id: 'W2vMc3ENiz8',
        })
      ).toBe('Judul materi (lesson) wajib diisi.');
    });

    test('validateLessonForm: menolak YouTube ID yang panjangnya bukan 11 karakter', () => {
      expect(
        validateLessonForm({
          title: 'Materi 1',
          position: 1,
          youtube_video_id: 'short',
        })
      ).toContain('11 karakter');

      expect(
        validateLessonForm({
          title: 'Materi 1',
          position: 1,
          youtube_video_id: 'toolongvideoid123',
        })
      ).toContain('11 karakter');
    });

    test('validateLessonForm: meloloskan materi dengan YouTube ID 11 karakter', () => {
      expect(
        validateLessonForm({
          title: 'Instalasi Panel',
          position: 2,
          youtube_video_id: 'W2vMc3ENiz8',
        })
      ).toBeNull();
    });
  });

  describe('Position Helpers', () => {
    test('getNextModulePosition menghitung posisi terakhir + 1', () => {
      expect(getNextModulePosition([])).toBe(1);
      expect(
        getNextModulePosition([
          { id: '1', course_id: 'c1', title: 'M1', position: 1, lessons: [] },
          { id: '2', course_id: 'c1', title: 'M2', position: 3, lessons: [] },
        ])
      ).toBe(4);
    });

    test('getNextLessonPosition menghitung posisi terakhir + 1', () => {
      expect(getNextLessonPosition([])).toBe(1);
      expect(
        getNextLessonPosition([
          { id: 'l1', module_id: 'm1', course_id: 'c1', title: 'L1', position: 1, youtube_video_id: 'W2vMc3ENiz8' },
          { id: 'l2', module_id: 'm1', course_id: 'c1', title: 'L2', position: 2, youtube_video_id: 'W2vMc3ENiz8' },
        ])
      ).toBe(3);
    });
  });

  describe('Friendly Error Messages', () => {
    test('menerjemahkan penolakan perubahan course published', () => {
      const err = new Error('reject_published_course_content_change: Published courses cannot be edited');
      expect(friendlyErrorMessage(err)).toBe('Course yang sudah dipublikasikan tidak dapat diubah atau dihapus.');
    });

    test('menerjemahkan bentrok unique position modul', () => {
      const err = new Error('duplicate key value violates unique constraint "course_modules_course_position_key"');
      expect(friendlyErrorMessage(err)).toContain('Nomor urutan (posisi) modul tersebut sudah digunakan');
    });

    test('menerjemahkan bentrok unique position lesson', () => {
      const err = new Error('duplicate key value violates unique constraint "lessons_module_position_key"');
      expect(friendlyErrorMessage(err)).toContain('Nomor urutan (posisi) materi tersebut sudah digunakan');
    });

    test('menerjemahkan pelanggaran check YouTube ID', () => {
      const err = new Error('new row for relation "lessons" violates check constraint "lessons_youtube_video_id_check"');
      expect(friendlyErrorMessage(err)).toBe('ID video YouTube harus tepat 11 karakter.');
    });

    test('menerjemahkan pelanggaran RLS', () => {
      const err = new Error('new row violates row-level security policy for table "courses"');
      expect(friendlyErrorMessage(err)).toContain('Anda tidak memiliki izin');
    });
  });

  describe('Database Operations with Mock Client', () => {
    test('fetchMentorCourses mengambil list course milik mentor', async () => {
      const mockClient: MentorDatabaseClient = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: 'c1',
                      mentor_id: 'm1',
                      title: 'Course 1',
                      status: 'draft',
                      capacity: 20,
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        }),
      };

      const result = await fetchMentorCourses(mockClient, 'm1');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Course 1');
    });

    test('fetchMentorCourseDetail menyusun relasi modul dan lesson terurut', async () => {
      const mockClient: MentorDatabaseClient = {
        from: (table: string) => {
          if (table === 'courses') {
            return {
              select: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: 'c1',
                        mentor_id: 'm1',
                        title: 'Course 1',
                        status: 'draft',
                        capacity: 20,
                      },
                      error: null,
                    }),
                }),
              }),
            };
          }
          if (table === 'course_modules') {
            return {
              select: () => ({
                eq: () => ({
                  order: () =>
                    Promise.resolve({
                      data: [
                        { id: 'mod2', course_id: 'c1', title: 'Modul B', position: 2 },
                        { id: 'mod1', course_id: 'c1', title: 'Modul A', position: 1 },
                      ],
                      error: null,
                    }),
                }),
              }),
            };
          }
          if (table === 'lessons') {
            return {
              select: () => ({
                eq: () => ({
                  order: () =>
                    Promise.resolve({
                      data: [
                        {
                          id: 'l1',
                          module_id: 'mod1',
                          course_id: 'c1',
                          title: 'Lesson 1',
                          position: 1,
                          youtube_video_id: 'W2vMc3ENiz8',
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            };
          }
          throw new Error(`Unexpected table: ${table}`);
        },
      };

      const result = await fetchMentorCourseDetail(mockClient, 'c1');
      expect(result.id).toBe('c1');
      expect(result.modules).toBeDefined();
      expect(result.modules).toHaveLength(2);
      expect(result.modules![0].id).toBe('mod1'); // terurut posisi 1
      expect(result.modules![1].id).toBe('mod2'); // terurut posisi 2
      expect(result.modules![0].lessons).toHaveLength(1);
    });

    test('saveModule insert modul baru', async () => {
      const mockClient: MentorDatabaseClient = {
        from: () => ({
          insert: (payload: any) => ({
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: 'mod-new', ...payload },
                  error: null,
                }),
            }),
          }),
        }),
      };

      const mod = await saveModule(mockClient, {
        course_id: 'c1',
        title: 'Modul Baru',
        position: 3,
      });

      expect(mod.id).toBe('mod-new');
      expect(mod.title).toBe('Modul Baru');
      expect(mod.position).toBe(3);
    });

    test('deleteModule memanggil delete dengan id yang tepat', async () => {
      let deletedId: string | null = null;
      const mockClient: MentorDatabaseClient = {
        from: () => ({
          delete: () => ({
            eq: (col: string, val: string) => {
              deletedId = val;
              return Promise.resolve({ error: null });
            },
          }),
        }),
      };

      await deleteModule(mockClient, 'mod-123');
      expect(deletedId).toBe('mod-123');
    });

    test('deleteLesson memanggil delete dengan id yang tepat', async () => {
      let deletedId: string | null = null;
      const mockClient: MentorDatabaseClient = {
        from: () => ({
          delete: () => ({
            eq: (col: string, val: string) => {
              deletedId = val;
              return Promise.resolve({ error: null });
            },
          }),
        }),
      };

      await deleteLesson(mockClient, 'lesson-456');
      expect(deletedId).toBe('lesson-456');
    });
  });
});
