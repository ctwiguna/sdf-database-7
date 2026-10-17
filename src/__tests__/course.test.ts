import { mockCourses } from '../data/mockCourses';
import { Course } from '../types';
import { countCompleted, isCourseComplete, nextLesson, orderedLessons, progressPercent } from '../lib/course';

const course = mockCourses[0];

const scrambled: Course = {
  id: 'uji-urutan',
  title: 'Course uji urutan',
  mentor: 'Tim Future Skill',
  description: 'Course sintetis untuk menguji urutan silabus.',
  category: 'Uji',
  color: '#FFFFFF',
  modules: [
    {
      id: 'modul-b',
      title: 'Modul kedua',
      position: 2,
      lessons: [
        { id: 'materi-3', title: 'Materi ketiga', position: 2, videoId: 'abcdefghijk' },
        { id: 'materi-2', title: 'Materi kedua', position: 1, videoId: 'abcdefghijk' },
      ],
    },
    {
      id: 'modul-a',
      title: 'Modul pertama',
      position: 1,
      lessons: [{ id: 'materi-1', title: 'Materi pertama', position: 1, videoId: 'abcdefghijk' }],
    },
  ],
};

describe('urutan silabus', () => {
  it('membaca modul dan materi mengikuti position', () => {
    expect(orderedLessons(scrambled).map((lesson) => lesson.id)).toEqual(['materi-1', 'materi-2', 'materi-3']);
  });

  it('memuat empat course dengan silabus masing masing', () => {
    expect(mockCourses).toHaveLength(4);
    expect(mockCourses.map((item) => item.title)).toEqual([
      'Instalasi dan Maintenance Solar Panel',
      'EV Battery Management System',
      'PEST Control Course',
      'Mechanical Electrical Plumbing Course',
    ]);
    expect(mockCourses.map((item) => orderedLessons(item).length)).toEqual([2, 18, 18, 6]);
  });
});

describe('progres belajar', () => {
  it('menghitung materi selesai dan persentase', () => {
    const progress = { [orderedLessons(course)[0].id]: true };
    expect(countCompleted(course, progress)).toBe(1);
    expect(progressPercent(1, 2)).toBe(50);
  });

  it('mengembalikan materi berikutnya yang belum selesai', () => {
    const lessons = orderedLessons(course);
    const progress = { [lessons[0].id]: true };
    expect(nextLesson(course, progress)?.id).toBe(lessons[1].id);
  });

  it('kembali ke materi pertama jika semua materi sudah selesai', () => {
    const lessons = orderedLessons(course);
    const progress = Object.fromEntries(lessons.map((lesson) => [lesson.id, true]));
    expect(nextLesson(course, progress)?.id).toBe(lessons[0].id);
  });

  it('menandai course selesai hanya jika seluruh materi selesai', () => {
    const lessons = orderedLessons(course);
    expect(isCourseComplete(course, {})).toBe(false);
    expect(isCourseComplete(course, Object.fromEntries(lessons.map((lesson) => [lesson.id, true])))).toBe(true);
  });

  it('tidak membagi nol pada persentase', () => {
    expect(progressPercent(0, 0)).toBe(0);
  });
});