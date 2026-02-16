"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  if (status === "authenticated") return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setErrorMessage("Invalid credentials.");
      return;
    }

    router.push(result?.url ?? callbackUrl);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1220] px-4">
      <section className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/5 p-6 text-white backdrop-blur-md">
        <h1 className="mb-1 text-2xl font-semibold">Login</h1>
        <p className="mb-4 text-sm text-slate-300">Sign in to access your habits dashboard.</p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-[#111a2f] px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
              autoComplete="username"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-lg border border-white/20 bg-[#111a2f] px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage && <p className="text-sm text-red-300">{errorMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-400 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
