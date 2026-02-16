import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET ?? "dev-nextauth-secret-change-me",
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/habits/:path*"],
};
