import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-me'
);

const USERS = [
  { email: 'secondmarkwatchco@gmail.com', password: 'seb123', name: 'Sebastian' },
  { email: 'partner@secondmarkwatch.co', password: 'partner123', name: 'Partner' },
];

export async function authenticate(email: string, password: string) {
  const user = USERS.find(
    (u) => u.email === email && u.password === password
  );
  if (!user) return null;

  const token = await new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return { token, user: { email: user.email, name: user.name } };
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { email: string; name: string };
  } catch {
    return null;
  }
}

export async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
