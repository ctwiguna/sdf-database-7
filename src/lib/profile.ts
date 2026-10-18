import { SupabaseLike } from './catalog';

// Peran dan nama tampilan pengguna dibaca dari tabel profiles.
// Navigasi memakai peran ini supaya tab mentor hanya muncul untuk akun mentor.
// Bacaan gagal tidak menghentikan aplikasi, peran jatuh ke student.

export type UserRole = 'student' | 'mentor' | 'admin';

export type UserProfile = {
  role: UserRole;
  displayName: string | null;
};

export const DEFAULT_PROFILE: UserProfile = { role: 'student', displayName: null };

// Nilai kolom role dipetakan ke tiga peran yang dikenal aplikasi.
// Nilai lain di luar itu dianggap student supaya tidak ada tab yang bocor.
export const normalizeRole = (value: unknown): UserRole => {
  const text = String(value ?? '')
    .trim()
    .toLowerCase();
  if (text === 'mentor') return 'mentor';
  if (text === 'admin') return 'admin';
  return 'student';
};

// Baris profiles dirapikan sekali supaya layar hanya membaca bentuk yang pasti.
export const profileFromRows = (rows: unknown[] | null): UserProfile => {
  const row = (rows ?? [])[0] as { role?: unknown; display_name?: unknown } | undefined;
  if (!row) return DEFAULT_PROFILE;
  const name = typeof row.display_name === 'string' ? row.display_name.trim() : '';
  return { role: normalizeRole(row.role), displayName: name || null };
};

export const loadUserProfile = async (
  client: SupabaseLike | null,
  userId: string | null
): Promise<UserProfile> => {
  if (!client || !userId) return DEFAULT_PROFILE;
  const { data, error } = await client.from('profiles').select('role,display_name').eq('id', userId);
  if (error) return DEFAULT_PROFILE;
  return profileFromRows(data);
};
