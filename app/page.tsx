import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-24 text-white">
      <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
          DIGA foundation
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          AI-powered decision and document intelligence for architecture projects.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          This initial scaffold establishes the production-ready base for DIGA with a scalable
          Next.js architecture, Tailwind styling, Supabase integration placeholders, and a clean
          project structure for future feature development.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-200">
          <Link
            href="/projects"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 transition hover:bg-white/20"
          >
            View Projects
          </Link>
          <Link
            href="/projects/new"
            className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-cyan-200 transition hover:bg-cyan-500/20"
          >
            Create Project
          </Link>
        </div>
      </div>
    </main>
  );
}
