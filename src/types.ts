export type Course = {
  id: string;
  title: string;
  mentor: string;
  description: string;
  category: string;
  color: string;
  modules: Module[];
};

export type Module = {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
};

export type Lesson = {
  id: string;
  title: string;
  position: number;
  videoId: string;
};

export type ProgressMap = Record<string, boolean>;
