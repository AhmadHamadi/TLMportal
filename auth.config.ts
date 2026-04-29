import type { NextAuthConfig } from "next-auth";

const ADMIN_HOME = "/admin";
const CONTRACTOR_HOME = "/contractor";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const path = nextUrl.pathname;

      const onAdmin = path.startsWith("/admin");
      const onContractor = path.startsWith("/contractor");
      const onLogin = path === "/login";
      const onRoot = path === "/";

      if (onLogin) {
        if (isLoggedIn) {
          const home = role === "ADMIN" ? ADMIN_HOME : CONTRACTOR_HOME;
          return Response.redirect(new URL(home, nextUrl));
        }
        return true;
      }

      if (onRoot) {
        if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
        const home = role === "ADMIN" ? ADMIN_HOME : CONTRACTOR_HOME;
        return Response.redirect(new URL(home, nextUrl));
      }

      if (onAdmin) {
        if (!isLoggedIn) return false;
        if (role !== "ADMIN") return Response.redirect(new URL(CONTRACTOR_HOME, nextUrl));
        return true;
      }

      if (onContractor) {
        if (!isLoggedIn) return false;
        if (role !== "CONTRACTOR") return Response.redirect(new URL(ADMIN_HOME, nextUrl));
        return true;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.id = user.id;
        token.role = user.role;
        token.customerIds = user.customerIds ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.customerIds = token.customerIds;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
