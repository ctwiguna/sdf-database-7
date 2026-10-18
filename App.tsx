import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { mockCourses } from './src/data/mockCourses';
import { Course, Lesson, ProgressMap } from './src/types';
import { colors, radius, spacing } from './src/theme';
import { countCompleted, flattenLessons, nextLesson as pickNextLesson, progressPercent } from './src/lib/course';
import { CatalogSource, enrollInCourse, loadCatalog, loadEnrollments, loadProgress, markLessonComplete } from './src/lib/catalog';
import { SessionUser, signIn, signOut, signUp } from './src/lib/session';
import { authClient, dataClient } from './src/lib/supabase';
import { AccountScreen } from './src/screens/AccountScreen';
import { MentorCourseDetailScreen } from './src/features/mentor/screens/MentorCourseDetailScreen';
import { MentorCourseListScreen } from './src/features/mentor/screens/MentorCourseListScreen';
import { MentorParticipantsScreen } from './src/features/mentor/screens/MentorParticipantsScreen';
import { MentorDatabaseClient } from './src/features/mentor/lib/mentor';
import { MentorRpcClient } from './src/features/mentor/lib/report';
import { MentorCourse } from './src/features/mentor/types';
import { DEFAULT_PROFILE, UserProfile, loadUserProfile } from './src/lib/profile';
import { AdminCourseScreen } from './src/features/admin/screens/AdminCourseScreen';
import { AdminReportScreen } from './src/features/admin/screens/AdminReportScreen';
import { AdminClient, AdminRpcClient } from './src/features/admin/lib/admin';

type Screen = 'catalog' | 'mine' | 'course' | 'lesson' | 'account' | 'mentorCourses' | 'mentorCourse' | 'mentorParticipants' | 'adminCourse' | 'adminReport';

function App() {
  const client = dataClient;
  const [screen, setScreen] = useState<Screen>('catalog');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<Course[]>(mockCourses);
  const [source, setSource] = useState<CatalogSource>('demo');
  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [enrolled, setEnrolled] = useState<string[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [accountBusy, setAccountBusy] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [mentorCourse, setMentorCourse] = useState<MentorCourse | null>(null);

  // Sesi pengguna dipasang sekali, lalu peran, enrollment dan progres dibaca dari database.
  const applySession = async (id: string, email: string) => {
    setUser({ id, email });
    if (!client) return;
    try {
      setProfile(await loadUserProfile(client, id));
      const rows = await loadEnrollments(client, id);
      setEnrolled(rows.map((row) => row.course_id));
      setProgress(await loadProgress(client, rows));
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Data akun gagal dimuat.');
    }
  };

  // Katalog dibaca dari database bila env terisi, dan jatuh ke data contoh bila gagal.
  // Nama mentor hanya diminta saat pengguna masuk: tabel profiles tidak terbuka untuk tamu.
  useEffect(() => {
    if (!sessionReady) return;
    let active = true;
    loadCatalog(client, { includeMentor: Boolean(user) })
      .then((result) => {
        if (!active) return;
        setCatalog(result.courses);
        setSource(result.source);
        setNotice(result.message);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [client, sessionReady, user?.id]);

  // Sesi tersimpan diambil saat aplikasi dibuka supaya pengguna tidak perlu masuk ulang.
  // Penanda sessionReady menjaga katalog membaca data dengan peran yang sudah pasti.
  useEffect(() => {
    if (!client?.auth) {
      setSessionReady(true);
      return;
    }
    let active = true;
    client.auth
      .getSession()
      .then(({ data }) => {
        const session = data?.session ?? null;
        if (!active || !session?.user) return;
        void applySession(session.user.id, session.user.email ?? '');
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setSessionReady(true);
      });
    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const courses = useMemo(() => catalog.filter((course) => course.title.toLowerCase().includes(query.toLowerCase())), [catalog, query]);
  const lessons = selectedCourse ? flattenLessons(selectedCourse) : [];
  const completed = selectedCourse ? countCompleted(selectedCourse, progress) : 0;
  const currentIndex = selectedLesson ? lessons.findIndex((lesson) => lesson.id === selectedLesson.id) : -1;
  const currentCourse = selectedCourse;

  const openCourse = (course: Course) => {
    setSelectedCourse(course);
    setScreen('course');
  };
  const startCourse = async () => {
    if (!currentCourse) return;
    const alreadyEnrolled = enrolled.includes(currentCourse.id);
    if (client && !user) {
      setToast('Masuk dulu lewat tab Akun supaya pendaftaran dan progres tersimpan.');
      return;
    }
    if (!alreadyEnrolled) {
      if (client && user) {
        try {
          await enrollInCourse(client, currentCourse.id);
        } catch (error) {
          setToast(error instanceof Error ? error.message : 'Pendaftaran gagal.');
          return;
        }
      }
      setEnrolled((items) => [...items, currentCourse.id]);
    }
    const next = pickNextLesson(currentCourse, progress);
    if (next) setSelectedLesson(next);
    setScreen('lesson');
  };
  const markComplete = async () => {
    if (!selectedLesson) return;
    if (client && !user) {
      setToast('Masuk dulu lewat tab Akun supaya progres tersimpan.');
      return;
    }
    if (client && user) {
      try {
        await markLessonComplete(client, selectedLesson.id);
      } catch (error) {
        setToast(error instanceof Error ? error.message : 'Progres gagal disimpan.');
        return;
      }
    }
    setProgress((items) => ({ ...items, [selectedLesson.id]: true }));
  };
  const nextLesson = () => {
    if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
      setSelectedLesson(lessons[currentIndex + 1]);
      setScreen('lesson');
    } else setScreen('course');
  };
  const handleSignIn = async (email: string, password: string) => {
    setAccountBusy(true);
    try {
      const account = await signIn(authClient, email, password);
      await applySession(account.id, account.email);
    } finally {
      setAccountBusy(false);
    }
  };
  const handleSignUp = async (email: string, password: string) => {
    setAccountBusy(true);
    try {
      const account = await signUp(authClient, email, password);
      if (!account) return false;
      await applySession(account.id, account.email);
      return true;
    } finally {
      setAccountBusy(false);
    }
  };
  const handleSignOut = async () => {
    setAccountBusy(true);
    try {
      await signOut(authClient);
      setUser(null);
      setProfile(DEFAULT_PROFILE);
      setMentorCourse(null);
      setEnrolled([]);
      setProgress({});
    } finally {
      setAccountBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View><Text style={styles.brand}>Future Skill</Text><Text style={styles.subtitle}>Belajar skill masa depan</Text></View>
        <View style={styles.avatar}><Ionicons name="person-outline" size={22} color={colors.textPrimary} /></View>
      </View>
      {screen === 'catalog' && <Catalog query={query} setQuery={setQuery} courses={courses} enrolled={enrolled} progress={progress} source={source} onOpen={openCourse} />}
      {screen === 'mine' && <MyCourses courses={catalog} enrolled={enrolled} progress={progress} onOpen={openCourse} />}
      {screen === 'course' && currentCourse && <CourseDetail course={currentCourse} enrolled={enrolled.includes(currentCourse.id)} completed={completed} total={lessons.length} onBack={() => setScreen('catalog')} onStart={startCourse} />}
      {screen === 'lesson' && currentCourse && selectedLesson && <LessonPlayer course={currentCourse} lesson={selectedLesson} completed={Boolean(progress[selectedLesson.id])} position={currentIndex + 1} total={lessons.length} onBack={() => setScreen('course')} onComplete={markComplete} onNext={nextLesson} />}
      {screen === 'account' && <AccountScreen databaseReady={Boolean(client)} userEmail={user?.email ?? null} dataSource={source} notice={notice} busy={accountBusy} onSignIn={handleSignIn} onSignUp={handleSignUp} onSignOut={handleSignOut} />}
      {screen === 'mentorCourses' && <MentorCourseListScreen client={client as unknown as MentorDatabaseClient | null} mentorId={user?.id ?? null} mentorName={profile.displayName} onSelectCourse={(course) => { setMentorCourse(course); setScreen('mentorCourse'); }} onViewParticipants={(course) => { setMentorCourse(course); setScreen('mentorParticipants'); }} />}
      {screen === 'mentorCourse' && mentorCourse && <MentorCourseDetailScreen client={client as unknown as MentorDatabaseClient | null} courseId={mentorCourse.id} onBack={() => setScreen('mentorCourses')} />}
      {screen === 'mentorParticipants' && mentorCourse && <MentorParticipantsScreen client={client as unknown as MentorRpcClient | null} course={mentorCourse} onBack={() => setScreen('mentorCourses')} />}
      {screen === 'adminCourse' && <AdminCourseScreen client={client as unknown as AdminClient | null} onBack={() => setScreen('catalog')} />}
      {screen === 'adminReport' && <AdminReportScreen client={client as unknown as AdminRpcClient | null} onBack={() => setScreen('catalog')} />}
      {screen !== 'lesson' && <View style={styles.bottomNav}><NavItem icon="grid-outline" label="Katalog" active={screen === 'catalog'} onPress={() => setScreen('catalog')} /><NavItem icon="play-circle-outline" label="Kelas saya" active={screen === 'mine'} onPress={() => setScreen('mine')} />{profile.role === 'mentor' && <NavItem icon="create-outline" label="Kelola" active={screen === 'mentorCourses' || screen === 'mentorCourse' || screen === 'mentorParticipants'} onPress={() => setScreen('mentorCourses')} />}{profile.role === 'admin' && <NavItem icon="create-outline" label="Kelola" active={screen === 'adminCourse'} onPress={() => setScreen('adminCourse')} />}{profile.role === 'admin' && <NavItem icon="stats-chart-outline" label="Laporan" active={screen === 'adminReport'} onPress={() => setScreen('adminReport')} />}<NavItem icon="person-outline" label="Akun" active={screen === 'account'} onPress={() => setScreen('account')} /></View>}
      {toast && <View style={toastStyles.toast}><Ionicons name="alert-circle-outline" size={18} color={colors.textPrimary} /><Text style={toastStyles.toastText}>{toast}</Text></View>}
    </SafeAreaView>
  );
}

function Catalog({ query, setQuery, courses, enrolled, progress, source, onOpen }: { query: string; setQuery: (v: string) => void; courses: Course[]; enrolled: string[]; progress: ProgressMap; source: CatalogSource; onOpen: (course: Course) => void }) {
  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.hero}><Text style={styles.kicker}>FUTURE SKILL</Text><Text style={styles.heroTitle}>Mulai skill yang relevan untuk masa depan.</Text><Text style={styles.heroBody}>Playlist terkurasi untuk belajar teknik secara terstruktur.</Text></View>
    {source === 'fallback' && <View style={toastStyles.banner}><Text style={toastStyles.bannerText}>Katalog database belum siap, data contoh dipakai sementara.</Text></View>}
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

function MyCourses({ courses, enrolled, progress, onOpen }: { courses: Course[]; enrolled: string[]; progress: ProgressMap; onOpen: (course: Course) => void }) {
  const list = courses.filter((course) => enrolled.includes(course.id));
  return <ScrollView contentContainerStyle={styles.content}><Text style={styles.sectionTitle}>Kelas saya</Text><Text style={styles.meta}>Course yang sudah kamu ikuti.</Text>{list.map((course) => <CourseCard key={course.id} course={course} enrolled progress={progress} onPress={() => onOpen(course)} />)}{list.length === 0 && <Empty text="Belum ada course. Mulai dari katalog." />}</ScrollView>;
}

function BackButton({ onPress }: { onPress: () => void }) { return <Pressable onPress={onPress} style={styles.back}><Ionicons name="arrow-back" size={20} color={colors.textPrimary} /><Text style={styles.backText}>Kembali</Text></Pressable>; }
function NavItem({ icon, label, active, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.navItem}><Ionicons name={icon} size={22} color={active ? colors.accent : colors.textSecondary} /><Text style={[styles.navLabel, active && styles.activeLabel]}>{label}</Text></Pressable>; }
function Empty({ text }: { text: string }) { return <View style={styles.empty}><Ionicons name="search-outline" size={30} color={colors.textSecondary} /><Text style={styles.meta}>{text}</Text></View>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { fontSize: 24, fontWeight: '700', color: colors.textPrimary }, subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, content: { padding: spacing.lg, paddingBottom: 110, gap: spacing.lg }, hero: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, gap: spacing.md }, kicker: { fontSize: 12, letterSpacing: 1.4, fontWeight: '700', color: colors.action }, heroTitle: { fontSize: 28, lineHeight: 34, color: colors.textPrimary, fontWeight: '700' }, heroBody: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 }, search: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.lg, height: 52 }, searchInput: { flex: 1, fontSize: 16, color: colors.textPrimary, marginLeft: spacing.sm }, sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary }, count: { color: colors.textSecondary, fontSize: 13 }, courseCard: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.md }, pressed: { opacity: 0.8 }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, category: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }, iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, cardTitle: { fontSize: 21, lineHeight: 27, fontWeight: '700', color: colors.textPrimary }, cardDescription: { fontSize: 14, lineHeight: 20, color: colors.textSecondary }, cardMeta: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }, meta: { fontSize: 13, color: colors.textSecondary }, progressText: { fontSize: 13, fontWeight: '700', color: colors.success }, bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 76, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#D4D4D4' }, navItem: { alignItems: 'center', gap: 3 }, navLabel: { fontSize: 11, color: colors.textSecondary }, activeLabel: { color: colors.accent, fontWeight: '700' }, back: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, backText: { color: colors.textPrimary, fontWeight: '600' }, detailBanner: { borderRadius: radius.card, padding: spacing.xl, gap: spacing.md }, detailTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.textPrimary }, body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24 }, progressBox: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, progressNumber: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: spacing.sm }, percent: { fontSize: 24, fontWeight: '700', color: colors.action }, module: { backgroundColor: colors.surface, borderRadius: radius.input, padding: spacing.lg, gap: spacing.md }, moduleTitle: { fontWeight: '700', color: colors.textPrimary }, lessonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }, lessonTitle: { color: colors.textSecondary, flex: 1 }, primaryButton: { minHeight: 50, borderRadius: radius.button, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg }, primaryText: { color: colors.surface, fontSize: 16, fontWeight: '700' }, video: { height: 220, overflow: 'hidden', borderRadius: radius.input, backgroundColor: '#111' }, safety: { backgroundColor: colors.pastelPeach, borderRadius: radius.input, padding: spacing.lg, color: colors.textPrimary, lineHeight: 20 }, lessonActions: { gap: spacing.md }, secondaryButton: { minHeight: 50, borderRadius: radius.button, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg }, completedButton: { borderColor: colors.success }, secondaryText: { color: colors.textPrimary, fontWeight: '600' }, empty: { alignItems: 'center', padding: spacing.xxl, gap: spacing.md },
});

const toastStyles = StyleSheet.create({
  toast: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 96, backgroundColor: colors.surface, borderRadius: radius.input, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toastText: { flex: 1, color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  banner: { backgroundColor: colors.surfaceSoft, borderRadius: radius.input, padding: spacing.lg },
  bannerText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
});

export default App;
