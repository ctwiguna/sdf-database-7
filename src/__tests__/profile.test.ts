import { DEFAULT_PROFILE, UserProfile, loadUserProfile, normalizeRole, profileFromRows } from '../lib/profile';

// Klien palsu yang hanya melayani satu tabel, dipakai untuk menguji lapisan data.
// eq mengembalikan objek yang bisa di-await sekaligus punya order, seperti OrderableQuery.
const makeClient = (rows: unknown[] | null, error: { message: string } | null = null) => {
  const calls: { table: string; columns: string; column: string; value: unknown }[] = [];
  const client = {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: unknown) => {
          calls.push({ table, columns, column, value });
          const result = { data: rows, error };
          const query = Promise.resolve(result) as Promise<typeof result> & {
            order: () => Promise<typeof result>;
          };
          query.order = () => Promise.resolve(result);
          return query;
        },
      }),
    }),
    rpc: () => Promise.resolve({ error: null }),
  };
  return { client, calls };
};

describe('normalizeRole', () => {
  test('mengenali peran mentor', () => {
    expect(normalizeRole('mentor')).toBe('mentor');
  });

  test('mengenali peran admin', () => {
    expect(normalizeRole('admin')).toBe('admin');
  });

  test('tidak peka huruf besar kecil dan spasi', () => {
    expect(normalizeRole('  MENTOR ')).toBe('mentor');
    expect(normalizeRole('Admin')).toBe('admin');
  });

  test('nilai kosong dan nilai asing jatuh ke student', () => {
    expect(normalizeRole(null)).toBe('student');
    expect(normalizeRole(undefined)).toBe('student');
    expect(normalizeRole('')).toBe('student');
    expect(normalizeRole('guru')).toBe('student');
  });
});

describe('profileFromRows', () => {
  test('baris kosong memakai profil bawaan', () => {
    expect(profileFromRows([])).toEqual(DEFAULT_PROFILE);
    expect(profileFromRows(null)).toEqual(DEFAULT_PROFILE);
  });

  test('membaca peran dan nama tampilan', () => {
    expect(profileFromRows([{ role: 'mentor', display_name: 'Tim Mentor' }])).toEqual({
      role: 'mentor',
      displayName: 'Tim Mentor',
    });
  });

  test('nama tampilan kosong menjadi null', () => {
    expect(profileFromRows([{ role: 'student', display_name: '   ' }])).toEqual({
      role: 'student',
      displayName: null,
    });
  });

  test('peran asing dianggap student', () => {
    expect(profileFromRows([{ role: 'owner', display_name: 'X' }]).role).toBe('student');
  });
});

describe('loadUserProfile', () => {
  test('tanpa klien mengembalikan profil bawaan', async () => {
    await expect(loadUserProfile(null, 'user-1')).resolves.toEqual(DEFAULT_PROFILE);
  });

  test('tanpa id pengguna mengembalikan profil bawaan', async () => {
    const { client } = makeClient([{ role: 'mentor', display_name: 'Tim Mentor' }]);
    await expect(loadUserProfile(client, null)).resolves.toEqual(DEFAULT_PROFILE);
  });

  test('membaca tabel profiles dengan id yang diminta', async () => {
    const { client, calls } = makeClient([{ role: 'mentor', display_name: 'Tim Mentor' }]);
    const profile: UserProfile = await loadUserProfile(client, 'user-9');
    expect(profile).toEqual({ role: 'mentor', displayName: 'Tim Mentor' });
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe('profiles');
    expect(calls[0].columns).toBe('role,display_name');
    expect(calls[0].column).toBe('id');
    expect(calls[0].value).toBe('user-9');
  });

  test('error bacaan tidak melempar dan jatuh ke student', async () => {
    const { client } = makeClient(null, { message: 'permission denied' });
    await expect(loadUserProfile(client, 'user-9')).resolves.toEqual(DEFAULT_PROFILE);
  });
});
