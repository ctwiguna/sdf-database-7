import { Course, Lesson, ProgressMap } from '../types';

// Materi selalu dibaca mengikuti urutan silabus: position modul, lalu position lesson.
export const orderedLessons = (course: Course): Lesson[] =>
  [...course.modules]
    .sort((a, b) => a.position - b.position)
    .flatMap((module) => [...module.lessons].sort((a, b) => a.position - b.position));

export const flattenLessons = (course: Course): Lesson[] => orderedLessons(course);

export const countCompleted = (course: Course, progress: ProgressMap): number =>
  flattenLessons(course).filter((lesson) => progress[lesson.id]).length;

export const progressPercent = (completed: number, total: number): number =>
  total > 0 ? Math.round((completed / total) * 100) : 0;

export const nextLesson = (course: Course, progress: ProgressMap): Lesson | null => {
  const lessons = flattenLessons(course);
  return lessons.find((lesson) => !progress[lesson.id]) ?? (lessons.length > 0 ? lessons[0] : null);
};

export const isCourseComplete = (course: Course, progress: ProgressMap): boolean => {
  const lessons = flattenLessons(course);
  return lessons.length > 0 && countCompleted(course, progress) === lessons.length;
};