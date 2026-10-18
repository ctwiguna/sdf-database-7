import {
  LessonFormData,
  MentorCourse,
  MentorLesson,
  MentorModule,
  ModuleFormData,
} from '../types';

// Tipe klien fleksibel yang kompatibel dengan SupabaseClient nyata maupun mock unit test.
export type MentorDatabaseClient = {
  from: (table: string) => any;
};

const ERROR_TRANSLATIONS: Array<{ test: RegExp | string; message: string }> = [
  {
    test: /Published courses cannot be edited|reject_published_course_content_change/i,
    message: 'Course yang sudah dipublikasikan tidak dapat diubah atau dihapus.',
  },
  {
    test: /course_modules_course_position_key/i,
    message: 'Nomor urutan (posisi) modul tersebut sudah digunakan pada course ini. Silakan pilih nomor lain.',
  },
  {
    test: /lessons_module_position_key/i,
    message: 'Nomor urutan (posisi) materi tersebut sudah digunakan pada modul ini. Silakan pilih nomor lain.',
  },
  {
    test: /lessons_youtube_video_id_check|length\(youtube_video_id\) = 11/i,
    message: 'ID video YouTube harus tepat 11 karakter.',
  },
  {
    test: /violates check constraint.*position/i,
    message: 'Nomor urutan (posisi) harus berupa bilangan bulat lebih besar dari 0.',
  },
  {
    test: /row-level security policy|violates row-level security/i,
    message: 'Aksi ditolak: Anda tidak memiliki izin untuk mengurasi course ini.',
  },
  {
    test: /not_course_mentor/i,
    message: 'Aksi hanya boleh dilakukan oleh mentor pemilik course.',
  },
  {
    test: /not_authenticated|JWT/i,
    message: 'Sesi Anda telah berakhir. Silakan masuk ulang melalui tab Akun.',
  },
];

export const friendlyErrorMessage = (error: unknown): string => {
  if (!error) return 'Terjadi galat yang tidak diketahui.';
  const raw = typeof error === 'string' ? error : (error as { message?: string }).message || String(error);

  for (const item of ERROR_TRANSLATIONS) {
    if (typeof item.test === 'string' && raw.includes(item.test)) {
      return item.message;
    }
    if (item.test instanceof RegExp && item.test.test(raw)) {
      return item.message;
    }
  }

  return raw;
};

export const validateModuleForm = (data: ModuleFormData): string | null => {
  if (!data.title || !data.title.trim()) {
    return 'Judul modul wajib diisi.';
  }
  if (!Number.isInteger(data.position) || data.position <= 0) {
    return 'Nomor urutan modul harus berupa angka lebih besar dari 0.';
  }
  return null;
};

export const validateLessonForm = (data: LessonFormData): string | null => {
  if (!data.title || !data.title.trim()) {
    return 'Judul materi (lesson) wajib diisi.';
  }
  if (!Number.isInteger(data.position) || data.position <= 0) {
    return 'Nomor urutan materi harus berupa angka lebih besar dari 0.';
  }
  const cleanVideoId = data.youtube_video_id ? data.youtube_video_id.trim() : '';
  if (cleanVideoId.length !== 11) {
    return 'ID video YouTube harus tepat 11 karakter (contoh: dQw4w9WgXcQ).';
  }
  return null;
};

export const getNextModulePosition = (modules: MentorModule[]): number => {
  if (!modules || modules.length === 0) return 1;
  const maxPos = Math.max(...modules.map((m) => m.position || 0));
  return maxPos + 1;
};

export const getNextLessonPosition = (lessons: MentorLesson[]): number => {
  if (!lessons || lessons.length === 0) return 1;
  const maxPos = Math.max(...lessons.map((l) => l.position || 0));
  return maxPos + 1;
};

// Mengambil daftar course yang dimiliki oleh mentor
export const fetchMentorCourses = async (
  client: MentorDatabaseClient,
  mentorId: string
): Promise<MentorCourse[]> => {
  const { data, error } = await client
    .from('courses')
    .select('id, mentor_id, title, description, category, capacity, status, created_at, updated_at')
    .eq('mentor_id', mentorId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(friendlyErrorMessage(error));
  }

  return (data || []) as MentorCourse[];
};

// Mengambil detail course berserta modul dan lesson miliknya (terurut posisi)
export const fetchMentorCourseDetail = async (
  client: MentorDatabaseClient,
  courseId: string
): Promise<MentorCourse> => {
  const { data: courseData, error: courseError } = await client
    .from('courses')
    .select('id, mentor_id, title, description, category, capacity, status, created_at, updated_at')
    .eq('id', courseId)
    .single();

  if (courseError || !courseData) {
    throw new Error(friendlyErrorMessage(courseError || 'Course tidak ditemukan.'));
  }

  // Ambil modul milik course
  const { data: modulesData, error: modulesError } = await client
    .from('course_modules')
    .select('id, course_id, title, position')
    .eq('course_id', courseId)
    .order('position', { ascending: true });

  if (modulesError) {
    throw new Error(friendlyErrorMessage(modulesError));
  }

  // Ambil semua lesson milik course
  const { data: lessonsData, error: lessonsError } = await client
    .from('lessons')
    .select('id, module_id, course_id, title, position, youtube_video_id')
    .eq('course_id', courseId)
    .order('position', { ascending: true });

  if (lessonsError) {
    throw new Error(friendlyErrorMessage(lessonsError));
  }

  const lessonsList = (lessonsData || []) as MentorLesson[];
  const modulesList: MentorModule[] = ((modulesData || []) as Array<{ id: string; course_id: string; title: string; position: number }>).map((mod) => ({
    ...mod,
    lessons: lessonsList
      .filter((lesson) => lesson.module_id === mod.id)
      .sort((a, b) => a.position - b.position),
  }));

  return {
    ...courseData,
    modules: modulesList.sort((a, b) => a.position - b.position),
  };
};

// Simpan modul (tambah jika id belum ada, ubah jika id sudah ada)
export const saveModule = async (
  client: MentorDatabaseClient,
  payload: {
    id?: string;
    course_id: string;
    title: string;
    position: number;
  }
): Promise<MentorModule> => {
  const validationError = validateModuleForm({
    title: payload.title,
    position: payload.position,
  });
  if (validationError) {
    throw new Error(validationError);
  }

  if (payload.id) {
    // Update modul
    const { data, error } = await client
      .from('course_modules')
      .update({
        title: payload.title.trim(),
        position: payload.position,
      })
      .eq('id', payload.id)
      .select('id, course_id, title, position')
      .single();

    if (error) {
      throw new Error(friendlyErrorMessage(error));
    }
    return { ...data, lessons: [] };
  } else {
    // Insert modul baru
    const { data, error } = await client
      .from('course_modules')
      .insert({
        course_id: payload.course_id,
        title: payload.title.trim(),
        position: payload.position,
      })
      .select('id, course_id, title, position')
      .single();

    if (error) {
      throw new Error(friendlyErrorMessage(error));
    }
    return { ...data, lessons: [] };
  }
};

// Hapus modul
export const deleteModule = async (
  client: MentorDatabaseClient,
  moduleId: string
): Promise<void> => {
  const { error } = await client
    .from('course_modules')
    .delete()
    .eq('id', moduleId);

  if (error) {
    throw new Error(friendlyErrorMessage(error));
  }
};

// Simpan materi (lesson)
export const saveLesson = async (
  client: MentorDatabaseClient,
  payload: {
    id?: string;
    course_id: string;
    module_id: string;
    title: string;
    position: number;
    youtube_video_id: string;
  }
): Promise<MentorLesson> => {
  const validationError = validateLessonForm({
    title: payload.title,
    position: payload.position,
    youtube_video_id: payload.youtube_video_id,
  });
  if (validationError) {
    throw new Error(validationError);
  }

  if (payload.id) {
    // Update materi
    const { data, error } = await client
      .from('lessons')
      .update({
        title: payload.title.trim(),
        position: payload.position,
        youtube_video_id: payload.youtube_video_id.trim(),
      })
      .eq('id', payload.id)
      .select('id, module_id, course_id, title, position, youtube_video_id')
      .single();

    if (error) {
      throw new Error(friendlyErrorMessage(error));
    }
    return data;
  } else {
    // Insert materi baru
    const { data, error } = await client
      .from('lessons')
      .insert({
        course_id: payload.course_id,
        module_id: payload.module_id,
        title: payload.title.trim(),
        position: payload.position,
        youtube_video_id: payload.youtube_video_id.trim(),
      })
      .select('id, module_id, course_id, title, position, youtube_video_id')
      .single();

    if (error) {
      throw new Error(friendlyErrorMessage(error));
    }
    return data;
  }
};

// Hapus materi
export const deleteLesson = async (
  client: MentorDatabaseClient,
  lessonId: string
): Promise<void> => {
  const { error } = await client
    .from('lessons')
    .delete()
    .eq('id', lessonId);

  if (error) {
    throw new Error(friendlyErrorMessage(error));
  }
};
