// Vitest aliases `@/auth` to this stub so importing auth-guard does not pull
// next-auth into the test runtime. Tests that need session behaviour should
// mock `auth` directly via vi.mock.
export async function auth(): Promise<null> {
  return null;
}
export const handlers = { GET: () => new Response(), POST: () => new Response() };
export const signIn = async () => undefined;
export const signOut = async () => undefined;
