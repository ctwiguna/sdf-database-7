// Sesi pengguna: validasi masukan, masuk, daftar, dan keluar.
// Klien Supabase diterima sebagai parameter supaya modul ini bisa diuji tanpa jaringan.

export type SessionUser = {
  id: string;
  email: string;
};

type AuthResponse = {
  data: {
    user: { id: string; email?: string | null } | null;
    session?: unknown | null;
  };
  error: { message: string } | null;
};

export type AuthClientLike = {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => PromiseLike<AuthResponse>;
    signUp: (credentials: { email: string; password: string }) => PromiseLike<AuthResponse>;
    signOut: () => PromiseLike<{ error: { message: string } | null }>;
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validasi dipakai layar Akun supaya kesalahan terlihat sebelum data dikirim.
export const validateCredentials = (email: string, password: string): string | null => {
  if (!EMAIL_PATTERN.test(email.trim())) return 'Format email belum benar.';
  if (password.length < 6) return 'Kata sandi minimal 6 karakter.';
  return null;
};

export const friendlyAuthMessage = (message: string): string => {
  const text = message.toLowerCase();
  if (text.includes('invalid login credentials')) return 'Email atau kata sandi salah.';
  if (text.includes('email not confirmed')) return 'Email belum dikonfirmasi. Cek kotak masuk lalu masuk lagi.';
  if (text.includes('already registered') || text.includes('already been registered')) return 'Email ini sudah terdaftar. Coba masuk.';
  // Domain email tanpa catatan DNS (mis. futureskill.id) ditolak Supabase sebelum dikirim.
  if (text.includes('email_address_invalid') || text.includes('is invalid')) return 'Alamat email ditolak server. Gunakan email dengan domain yang aktif (mis. Gmail).';
  // Batas kirim email bawaan Supabase mudah tercapai saat uji coba.
  if (text.includes('over_email_send_rate_limit')) return 'Terlalu banyak email dikirim. Tunggu beberapa menit lalu coba lagi.';
  if (text.includes('rate limit') || text.includes('too many')) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  if (text.includes('failed to fetch') || text.includes('network request failed')) return 'Tidak bisa menghubungi server. Periksa koneksi internet.';
  if (text.includes('password')) return 'Kata sandi ditolak. Gunakan minimal 6 karakter.';
  return message;
};

const requireClient = (client: AuthClientLike | null): AuthClientLike => {
  if (!client) throw new Error('Koneksi database belum diatur. Isi berkas .env dulu.');
  return client;
};

export const signIn = async (client: AuthClientLike | null, email: string, password: string): Promise<SessionUser> => {
  const activeClient = requireClient(client);
  const problem = validateCredentials(email, password);
  if (problem) throw new Error(problem);

  const { data, error } = await activeClient.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(friendlyAuthMessage(error.message));
  if (!data.user) throw new Error('Sesi tidak terbentuk. Coba lagi.');
  return { id: data.user.id, email: data.user.email ?? email.trim() };
};

// Mengembalikan pengguna saat sesi langsung terbentuk, dan null saat pendaftaran menunggu konfirmasi email.
export const signUp = async (
  client: AuthClientLike | null,
  email: string,
  password: string
): Promise<SessionUser | null> => {
  const activeClient = requireClient(client);
  const problem = validateCredentials(email, password);
  if (problem) throw new Error(problem);

  const { data, error } = await activeClient.auth.signUp({ email: email.trim(), password });
  if (error) throw new Error(friendlyAuthMessage(error.message));
  if (!data.session || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? email.trim() };
};

export const signOut = async (client: AuthClientLike | null): Promise<void> => {
  if (!client) return;
  await client.auth.signOut();
};
