export type CourseStatus = 'draft' | 'published';

export type MentorLesson = {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  position: number;
  youtube_video_id: string;
};

export type MentorModule = {
  id: string;
  course_id: string;
  title: string;
  position: number;
  lessons: MentorLesson[];
};

export type MentorCourse = {
  id: string;
  mentor_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  capacity: number;
  status: CourseStatus;
  created_at?: string;
  updated_at?: string;
  modules?: MentorModule[];
};

export type ModuleFormData = {
  title: string;
  position: number;
};

export type LessonFormData = {
  title: string;
  position: number;
  youtube_video_id: string;
};

export type MutationResult<T = void> = {
  data: T | null;
  error: string | null;
};
