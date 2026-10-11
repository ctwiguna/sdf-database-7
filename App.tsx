import React, { useMemo, useState } from 'react';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { mockCourses } from './src/data/mockCourses';
import { Course, Lesson, ProgressMap } from './src/types';
import { colors, radius, spacing } from './src/theme';
import { countCompleted, flattenLessons, nextLesson as pickNextLesson, progressPercent } from './src/lib/course';

function App() {
  const [screen, setScreen] = useState<'catalog' | 'mine' | 'course' | 'lesson'>('catalog');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [query, setQuery] = useState('');
  const [enrolled, setEnrolled] = useState<string[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});

  const courses = useMemo(() => mockCourses.filter((course) => course.title.toLowerCase().includes(query.toLowerCase())), [query]);
  const lessons = selectedCourse ? flattenLessons(selectedCourse) : [];
  const completed = selectedCourse ? countCompleted(selectedCourse, progress) : 0;
  const currentIndex = selectedLesson ? lessons.findIndex((lesson) => lesson.id === selectedLesson.id) : -1;
  const currentCourse = selectedCourse;

  const openCourse = (course: Course) => {
    setSelectedCourse(course);
    setScreen('course');
  };
  const startCourse = () => {
    if (!currentCourse) return;
    if (!enrolled.includes(currentCourse.id)) setEnrolled((items) => [...items, currentCourse.id]);
    const next = pickNextLesson(currentCourse, progress);
    if (next) setSelectedLesson(next);
    setScreen('lesson');
  };
  const markComplete = () => {
    if (selectedLesson) setProgress((items) => ({ ...items, [selectedLesson.id]: true }));
  };
  const nextLesson = () => {
    if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
      setSelectedLesson(lessons[currentIndex + 1]);
      setScreen('lesson');
    } else setScreen('course');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View><Text style={styles.brand}>Future Skill</Text><Text style={styles.subtitle}>Belajar skill masa depan</Text></View>
        <View style={styles.avatar}><Ionicons name="person-outline" size={22} color={colors.textPrimary} /></View>
      </View>
      {screen === 'catalog' && <Catalog query={query} setQuery={setQuery} courses={courses} enrolled={enrolled} progress={progress} onOpen={openCourse} />}
      {screen === 'mine' && <MyCourses enrolled={enrolled} progress={progress} onOpen={openCourse} />}
      {screen === 'course' && currentCourse && <CourseDetail course={currentCourse} enrolled={enrolled.includes(currentCourse.id)} completed={completed} total={lessons.length} onBack={() => setScreen('catalog')} onStart={startCourse} />}
      {screen === 'lesson' && currentCourse && selectedLesson && <LessonPlayer course={currentCourse} lesson={selectedLesson} completed={Boolean(progress[selectedLesson.id])} position={currentIndex + 1} total={lessons.length} onBack={() => setScreen('course')} onComplete={markComplete} onNext={nextLesson} />}
      {screen !== 'lesson' && <View style={styles.bottomNav}><NavItem icon="grid-outline" label="Katalog" active={screen === 'catalog'} onPress={() => setScreen('catalog')} /><NavItem icon="play-circle-outline" label="Kelas saya" active={screen === 'mine'} onPress={() => setScreen('mine')} /><NavItem icon="person-outline" label="Akun" onPress={() => undefined} /></View>}
    </SafeAreaView>
  );
}

function Catalog({ query, setQuery, courses, enrolled, progress, onOpen }: { query: string; setQuery: (v: string) => void; courses: Course[]; enrolled: string[]; progress: ProgressMap; onOpen: (course: Course) => void }) {
  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.hero}><Text style={styles.kicker}>FUTURE SKILL</Text><Text style={styles.heroTitle}>Mulai skill yang relevan untuk masa depan.</Text><Text style={styles.heroBody}>Playlist terkurasi untuk belajar teknik secara terstruktur.</Text></View>
    <View style={styles.search}><Ionicons name="search-outline" size={21} color={colors.textSecondary} /><TextInput value={query} onChangeText={setQuery} placeholder="Cari course..." placeholderTextColor={colors.textSecondary} style={styles.searchInput} /></View>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Course pilihan</Text><Text style={styles.count}>{courses.length} course</Text></View>
    {courses.map((course) => <CourseCard key={course.id} course={course} enrolled={enrolled.includes(course.id)} progress={progress} onPress={() => onOpen(course)} />)}
    {courses.length === 0 && <Empty text="Course tidak ditemukan." />}
  </ScrollView>;
}

function CourseCard({ course, enrolled, progress, onPress }: { course: Course; enrolled: boolean; progress: ProgressMap; onPress: () => void }) {
  const total = flattenLessons(course).length; const complete = countCompleted(course, progress);
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.courseCard, { backgroundColor: course.color }, pressed && styles.pressed]}>
    <View style={styles.cardTop}><Text style={styles.category}>{course.category}</Text><View style={styles.iconCircle}><Ionicons name="arrow-up-outline" size={19} color={colors.action} /></View></View>
    <Text style={styles.cardTitle}>{course.title}</Text><Text style={styles.cardDescription}>{course.description}</Text>
    <View style={styles.cardMeta}><Text style={styles.meta}>{course.modules.length} modul</Text><Text style={styles.meta}>•</Text><Text style={styles.meta}>{total} materi</Text></View>
    {enrolled && <Text style={styles.progressText}>{complete} dari {total} materi selesai</Text>}
  </Pressable>;
}

function CourseDetail({ course, enrolled, completed, total, onBack, onStart }: { course: Course; enrolled: boolean; completed: number; total: number; onBack: () => void; onStart: () => void }) {
  return <ScrollView contentContainerStyle={styles.content}><BackButton onPress={onBack} /><View style={[styles.detailBanner, { backgroundColor: course.color }]}><Text style={styles.kicker}>{course.category}</Text><Text style={styles.detailTitle}>{course.title}</Text><Text style={styles.meta}>Mentor: {course.mentor}</Text></View><Text style={styles.body}>{course.description}</Text><View style={styles.progressBox}><View><Text style={styles.meta}>PROGRES BELAJAR</Text><Text style={styles.progressNumber}>{completed} dari {total} materi</Text></View><Text style={styles.percent}>{progressPercent(completed, total)}%</Text></View><Text style={styles.sectionTitle}>Silabus</Text>{course.modules.map((module) => <View key={module.id} style={styles.module}><Text style={styles.moduleTitle}>{module.position}. {module.title}</Text>{module.lessons.map((lesson) => <View key={lesson.id} style={styles.lessonRow}><Ionicons name="play-circle-outline" size={22} color={colors.accent} /><Text style={styles.lessonTitle}>{lesson.position}. {lesson.title}</Text></View>)}</View>)}<Pressable style={styles.primaryButton} onPress={onStart}><Text style={styles.primaryText}>{enrolled ? 'Lanjut belajar' : 'Daftar course'}</Text><Ionicons name="arrow-forward" size={18} color={colors.surface} /></Pressable></ScrollView>;
}

function LessonPlayer({ course, lesson, completed, position, total, onBack, onComplete, onNext }: { course: Course; lesson: Lesson; completed: boolean; position: number; total: number; onBack: () => void; onComplete: () => void; onNext: () => void }) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${lesson.videoId}`;
  return <ScrollView contentContainerStyle={styles.content}><BackButton onPress={onBack} /><Text style={styles.kicker}>{course.title}</Text><Text style={styles.detailTitle}>{lesson.title}</Text><Text style={styles.meta}>Materi {position} dari {total}</Text><View style={styles.video}><WebView source={{ uri: `https://www.youtube.com/embed/${lesson.videoId}` }} allowsFullscreenVideo javaScriptEnabled /></View><Text style={styles.safety}>Materi pengenalan. Ikuti panduan keselamatan dan jangan melakukan pekerjaan pada perangkat aktif tanpa teknisi kompeten.</Text><View style={styles.lessonActions}><Pressable style={[styles.secondaryButton, completed && styles.completedButton]} onPress={onComplete}><Ionicons name={completed ? 'checkmark-circle' : 'checkmark-circle-outline'} size={20} color={completed ? colors.success : colors.textPrimary} /><Text style={styles.secondaryText}>{completed ? 'Materi selesai' : 'Tandai selesai'}</Text></Pressable><Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(youtubeUrl)}><Ionicons name="open-outline" size={20} color={colors.textPrimary} /><Text style={styles.secondaryText}>Buka di YouTube</Text></Pressable></View><Pressable style={styles.primaryButton} onPress={onNext}><Text style={styles.primaryText}>{position < total ? 'Materi berikutnya' : 'Lihat progres'}</Text><Ionicons name="arrow-forward" size={18} color={colors.surface} /></Pressable></ScrollView>;
}

function MyCourses({ enrolled, progress, onOpen }: { enrolled: string[]; progress: ProgressMap; onOpen: (course: Course) => void }) {
  const list = mockCourses.filter((course) => enrolled.includes(course.id));
  return <ScrollView contentContainerStyle={styles.content}><Text style={styles.sectionTitle}>Kelas saya</Text><Text style={styles.meta}>Course yang sudah kamu ikuti.</Text>{list.map((course) => <CourseCard key={course.id} course={course} enrolled progress={progress} onPress={() => onOpen(course)} />)}{list.length === 0 && <Empty text="Belum ada course. Mulai dari katalog." />}</ScrollView>;
}

function BackButton({ onPress }: { onPress: () => void }) { return <Pressable onPress={onPress} style={styles.back}><Ionicons name="arrow-back" size={20} color={colors.textPrimary} /><Text style={styles.backText}>Kembali</Text></Pressable>; }
function NavItem({ icon, label, active, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.navItem}><Ionicons name={icon} size={22} color={active ? colors.accent : colors.textSecondary} /><Text style={[styles.navLabel, active && styles.activeLabel]}>{label}</Text></Pressable>; }
function Empty({ text }: { text: string }) { return <View style={styles.empty}><Ionicons name="search-outline" size={30} color={colors.textSecondary} /><Text style={styles.meta}>{text}</Text></View>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { fontSize: 24, fontWeight: '700', color: colors.textPrimary }, subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, content: { padding: spacing.lg, paddingBottom: 110, gap: spacing.lg }, hero: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, gap: spacing.md }, kicker: { fontSize: 12, letterSpacing: 1.4, fontWeight: '700', color: colors.action }, heroTitle: { fontSize: 28, lineHeight: 34, color: colors.textPrimary, fontWeight: '700' }, heroBody: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 }, search: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.lg, height: 52 }, searchInput: { flex: 1, fontSize: 16, color: colors.textPrimary, marginLeft: spacing.sm }, sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary }, count: { color: colors.textSecondary, fontSize: 13 }, courseCard: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.md }, pressed: { opacity: 0.8 }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, category: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }, iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, cardTitle: { fontSize: 21, lineHeight: 27, fontWeight: '700', color: colors.textPrimary }, cardDescription: { fontSize: 14, lineHeight: 20, color: colors.textSecondary }, cardMeta: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }, meta: { fontSize: 13, color: colors.textSecondary }, progressText: { fontSize: 13, fontWeight: '700', color: colors.success }, bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 76, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#D4D4D4' }, navItem: { alignItems: 'center', gap: 3 }, navLabel: { fontSize: 11, color: colors.textSecondary }, activeLabel: { color: colors.accent, fontWeight: '700' }, back: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, backText: { color: colors.textPrimary, fontWeight: '600' }, detailBanner: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.md }, detailTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.textPrimary }, body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24 }, progressBox: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, progressNumber: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: spacing.sm }, percent: { fontSize: 24, fontWeight: '700', color: colors.action }, module: { backgroundColor: colors.surface, borderRadius: radius.input, padding: spacing.lg, gap: spacing.md }, moduleTitle: { fontWeight: '700', color: colors.textPrimary }, lessonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }, lessonTitle: { color: colors.textSecondary, flex: 1 }, primaryButton: { minHeight: 50, borderRadius: radius.button, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg }, primaryText: { color: colors.surface, fontSize: 16, fontWeight: '700' }, video: { height: 220, overflow: 'hidden', borderRadius: radius.input, backgroundColor: '#111' }, safety: { backgroundColor: colors.pastelPeach, borderRadius: radius.input, padding: spacing.lg, color: colors.textPrimary, lineHeight: 20 }, lessonActions: { gap: spacing.md }, secondaryButton: { minHeight: 50, borderRadius: radius.button, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg }, completedButton: { borderColor: colors.success }, secondaryText: { color: colors.textPrimary, fontWeight: '600' }, empty: { alignItems: 'center', padding: spacing.xxl, gap: spacing.md },
});

export default App;
