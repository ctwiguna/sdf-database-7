import { AuthClientLike, friendlyAuthMessage, signIn, signOut, signUp, validateCredentials } from '../lib/session';

type AuthResponse = {
  data: { user: { id: string; email?: string | null } | null; session?: unknown | null };
  error: { message: string } | null;
};

const createAuthClient = (response: AuthResponse) => {
  const calls: string[] = [];
  const client = {
    auth: {
      signInWithPassword: () => {
        calls.push('signInWithPassword');
        return Promise.resolve(response);
      },
      signUp: () => {
        calls.push('signUp');
        return Promise.resolve(response);
      },
      signOut: () => {
        calls.push('signOut');
        return Promise.resolve({ error: null });
      },
    },
  } as unknown as AuthClientLike;
  return { client, calls };
};

describe('validasi masukan akun', () => {
  it('menolak email yang formatnya belum benar', () => {
    expect(validateCredentials('chandra', 'rahasia123')).toBe('Format email belum benar.');
  });

  it('menolak kata sandi yang terlalu pendek', () => {
    expect(validateCredentials('chandra@example.com', '123')).toBe('Kata sandi minimal 6 karakter.');
  });

  it('menerima email dan kata sandi yang wajar', () => {
    expect(validateCredentials('chandra@example.com', 'rahasia123')).toBeNull();
  });
});

describe('pesan error autentikasi', () => {
  it('menerjemahkan error kredensial salah', () => {
    expect(friendlyAuthMessage('Invalid login credentials')).toBe('Email atau kata sandi salah.');
  });

  it('menerjemahkan error email belum dikonfirmasi', () => {
    expect(friendlyAuthMessage('Email not confirmed')).toBe('Email belum dikonfirmasi. Cek kotak masuk lalu masuk lagi.');
  });
});

describe('masuk, daftar, dan keluar', () => {
  it('menolak masuk saat koneksi database belum diatur', async () => {
    await expect(signIn(null, 'chandra@example.com', 'rahasia123')).rejects.toThrow('Koneksi database belum diatur. Isi berkas .env dulu.');
  });

  it('mengembalikan pengguna setelah masuk berhasil', async () => {
    const auth = createAuthClient({ data: { user: { id: 'user-1', email: 'chandra@example.com' }, session: {} }, error: null });
    await expect(signIn(auth.client, '  chandra@example.com  ', 'rahasia123')).resolves.toEqual({
      id: 'user-1',
      email: 'chandra@example.com',
    });
  });

  it('mengembalikan null saat pendaftaran menunggu konfirmasi email', async () => {
    const auth = createAuthClient({ data: { user: { id: 'user-2', email: null }, session: null }, error: null });
    await expect(signUp(auth.client, 'baru@example.com', 'rahasia123')).resolves.toBeNull();
  });

  it('tidak memanggil jaringan saat validasi gagal', async () => {
    const auth = createAuthClient({ data: { user: null, session: null }, error: null });
    await expect(signIn(auth.client, 'salah', 'rahasia123')).rejects.toThrow('Format email belum benar.');
    expect(auth.calls).toHaveLength(0);
  });

  it('meneruskan error autentikasi dengan pesan yang ramah', async () => {
    const auth = createAuthClient({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } });
    await expect(signIn(auth.client, 'chandra@example.com', 'salahsekali')).rejects.toThrow('Email atau kata sandi salah.');
  });

  it('mengabaikan keluar saat koneksi database belum diatur', async () => {
    await expect(signOut(null)).resolves.toBeUndefined();
  });
});
