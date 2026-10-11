import { Course } from '../types';

export const mockCourses: Course[] = [
  {
    id: 'solar-panel', title: 'Instalasi dan Maintenance Solar Panel', mentor: 'Future Skill Team',
    description: 'Pengenalan komponen, keselamatan, instalasi, dan checklist maintenance solar panel.', category: 'Energi', color: '#F4D9CB',
    modules: [{ id: 'solar-module-1', title: 'Dasar Solar Panel', position: 1, lessons: [
      { id: 'solar-lesson-1', title: 'Komponen sistem dan keselamatan', position: 1, videoId: 'dQw4w9WgXcQ' },
      { id: 'solar-lesson-2', title: 'Gambaran instalasi dan maintenance', position: 2, videoId: 'dQw4w9WgXcQ' },
    ] }],
  },
  {
    id: 'plumbing', title: 'Plumbing', mentor: 'Future Skill Team',
    description: 'Mengenal jaringan air, pembuangan, sambungan, kebocoran, dan maintenance dasar.', category: 'Teknik', color: '#DFD1EE',
    modules: [{ id: 'plumbing-module-1', title: 'Dasar Plumbing', position: 1, lessons: [
      { id: 'plumbing-lesson-1', title: 'Jaringan air dan pembuangan', position: 1, videoId: 'dQw4w9WgXcQ' },
      { id: 'plumbing-lesson-2', title: 'Sambungan, kebocoran, dan maintenance', position: 2, videoId: 'dQw4w9WgXcQ' },
    ] }],
  },
  {
    id: 'ev-charging', title: 'Instalasi dan Maintenance EV Charging Station', mentor: 'Future Skill Team',
    description: 'Pengenalan perangkat pengisian, risiko, inspeksi rutin, dan eskalasi gangguan.', category: 'Kendaraan Listrik', color: '#DDECCF',
    modules: [{ id: 'ev-module-1', title: 'Dasar EV Charging', position: 1, lessons: [
      { id: 'ev-lesson-1', title: 'Perangkat pengisian dan risiko', position: 1, videoId: 'dQw4w9WgXcQ' },
      { id: 'ev-lesson-2', title: 'Perencanaan dan inspeksi rutin', position: 2, videoId: 'dQw4w9WgXcQ' },
    ] }],
  },
  {
    id: 'electric-vehicle', title: 'Maintenance Mobil dan Motor Listrik', mentor: 'Future Skill Team',
    description: 'Mengenal komponen kendaraan listrik, servis dasar, dan tanda bahaya baterai.', category: 'Kendaraan Listrik', color: '#F4E5C8',
    modules: [{ id: 'ev-vehicle-module-1', title: 'Dasar Kendaraan Listrik', position: 1, lessons: [
      { id: 'ev-vehicle-lesson-1', title: 'Komponen dan batas servis dasar', position: 1, videoId: 'dQw4w9WgXcQ' },
      { id: 'ev-vehicle-lesson-2', title: 'Pemeriksaan visual dan tanda bahaya', position: 2, videoId: 'dQw4w9WgXcQ' },
    ] }],
  },
];
