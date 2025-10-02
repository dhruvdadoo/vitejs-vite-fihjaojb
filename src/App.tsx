import React, { useMemo, useState, useEffect } from "react";

// =============================
// The Citadel — Landing MVP (TypeScript-safe)
// Intro band + 3-step explainer; Herald full-width (Posts expanded; no Live Works)
// Left rail: Commons snapshot + Boards; Right rail: DM Requests + Active Chats
// Simple reactions: Like + Comment; Reputation = Rep.
// Added: explicit TypeScript types to fix build errors.
// =============================

// ---- Types ----
interface Hall { name: string; desc: string }
interface Common { name: string; desc: string; cta: string }
interface Board { name: string; desc: string; requirementLabel: string; repThreshold: number; inviteOnly: boolean }
interface Work { id: number; title: string; author: string; tags: string[]; status: string; likes: number; comments: number }
interface PostItem { id: number; author: string; title: string; body: string; tags: string[]; replies: number; likes: number; time: string }
interface DMRequest { id: string; from: string; rep: number; preview: string }
interface DMActive { id: string; with: string; last: string }
interface TestResult { name: string; pass: boolean; message: string }

// ---- Mock user + reputation (for demo) ----
const currentUser = { name: "Guest", rep: 1200 };

// ---- Data: Halls (broad open groups) ----
const halls: Hall[] = [
  { name: "Builders Hall", desc: "Founders, PMs, engineers collaborating on product and growth." },
  { name: "Creators Hall", desc: "Design, content, product storytelling, and brand craft." },
  { name: "Go‑to‑Market Hall", desc: "Marketing, sales, ops — distribution and revenue." },
  { name: "Specialists Hall", desc: "AI, data, finance, legal, and other expert domains." },
];

// ---- Data: Commons (appear inside Halls; left rail shows a snapshot) ----
const commons: Common[] = [
  { name: "Hiring Board", desc: "Open roles, collab asks, co‑founder searches.", cta: "Post a role" },
  { name: "Showcase", desc: "Polished launches and milestone shout‑outs.", cta: "Share a win" },
  { name: "AMA", desc: "Ask me anything sessions with experienced operators.", cta: "Host an AMA" },
];

// ---- Data: Boards (invite‑only, mod curated) ----
const boards: Board[] = [
  {
    name: "Founders Board",
    desc: "Curated founders discussing traction, hiring, and financing.",
    requirementLabel: "$1M+ ARR or 2,000 rep",
    repThreshold: 2000,
    inviteOnly: true,
  },
  {
    name: "Builders Board",
    desc: "High‑signal product reviews and roadmap critiques.",
    requirementLabel: "1,800 rep + moderator approval",
    repThreshold: 1800,
    inviteOnly: true,
  },
];

// ---- Data: sample Works (projects) used for Project of the Day ----
const initialWorks: Work[] = [
  { id: 1, title: "Onboarding Funnel Revamp", author: "Sofia R.", tags: ["PM", "SaaS"], status: "Open to feedback", likes: 42, comments: 5 },
  { id: 2, title: "RAG Chat for Docs", author: "Jamal T.", tags: ["AI", "Backend"], status: "Seeking collaborator", likes: 67, comments: 12 },
  { id: 3, title: "POS → Insights Dashboard", author: "Alex K.", tags: ["Analytics", "Retail"], status: "Showcase", likes: 88, comments: 9 },
];

// ---- Data: Posts (expanded: title + body + tags) ----
const initialPosts: PostItem[] = [
  {
    id: 101,
    author: "Elena (PMM, Adobe)",
    title: "Positioning tweak that lifted conversion",
    body: "Moved the value prop from below the fold into the hero and reframed benefits as outcomes. Ran a 2‑week split with real traffic. Lift on paid landing was meaningful for mid‑intent segments.",
    tags: ["PMM", "Positioning", "Experiment"],
    replies: 4,
    likes: 15,
    time: "2h",
  },
  {
    id: 102,
    author: "Hiro (ML, Google)",
    title: "RAG eval: latency and quality trade‑offs",
    body: "Tested retrieval window sizes and batching across three query sets. Observed a non‑linear quality drop beyond 8 contexts, while latency improved modestly with small batch sizes. Next: cache warm strategy.",
    tags: ["ML", "RAG", "Eval"],
    replies: 9,
    likes: 27,
    time: "6h",
  },
  {
    id: 103,
    author: "Maya (Founder, Shopify alumni)",
    title: "What to cut from an 8‑slide seed deck",
    body: "Working on a tight narrative. Debating whether to collapse traction and GTM into one slide and push roadmap to appendix. Curious what investors actually skim first in practice.",
    tags: ["Fundraising", "Deck", "GTM"],
    replies: 14,
    likes: 34,
    time: "1d",
  },
];

// ---- Data: DM rail ----
const dmRequests: DMRequest[] = [
  { id: "rq1", from: "Maya", rep: 320, preview: "Question on seed deck trims" },
  { id: "rq2", from: "Jamal", rep: 1180, preview: "Collab on RAG chat evals" },
];
const dmActive: DMActive[] = [
  { id: "dm1", with: "Elena", last: "Thanks for the pricing note" },
  { id: "dm2", with: "Hiro", last: "Will try batch queries" },
];

function Badge({ text }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
      {text}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow bg-white/70 backdrop-blur ${className}`}>
      {children}
    </div>
  );
}

// --- Dev Tests ---
function runDevTests({ works, posts, boards, halls, commons, currentUser }: { works: Work[]; posts: PostItem[]; boards: Board[]; halls: Hall[]; commons: Common[]; currentUser: { name: string; rep: number } }) {
  const results: TestResult[] = [];
  results.push({ name: "works populated", pass: Array.isArray(works) && works.length > 0, message: `len=${works.length}` });
  results.push({ name: "posts populated", pass: Array.isArray(posts) && posts.length > 0, message: `len=${posts.length}` });
  results.push({ name: "boards defined", pass: Array.isArray(boards) && boards.length > 0, message: boards.map(b=>b.name).join(", ") });
  results.push({ name: "halls defined", pass: Array.isArray(halls) && halls.length >= 3, message: halls.length.toString() });
  results.push({ name: "commons defined", pass: Array.isArray(commons) && commons.length >= 1, message: commons.length.toString() });
  results.push({ name: "rep is numeric", pass: typeof currentUser.rep === "number" && currentUser.rep >= 0, message: `${currentUser.rep}` });
  const strings = [
    ...works.map((w: Work) => w.title),
    ...posts.map((p: PostItem) => `${p.title} ${p.body}`),
    ...halls.map((h: Hall) => h.desc),
    ...commons.map((c: Common) => c.desc),
    ...boards.map((b: Board) => b.desc),
  ];
  results.push({ name: "no raw '>' in literals", pass: strings.every(s => !String(s).includes(">")), message: "ok" });
  return results;
}

export default function App() {
  const [works, setWorks] = useState<Work[]>(initialWorks);
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [, setShowWorkModal] = useState<boolean>(false);
  const [, setShowPostModal] = useState<boolean>(false);
  const [showCommentsFor, setShowCommentsFor] = useState<number | null>(null); // id of Work or Post
  const [showDmModal, setShowDmModal] = useState<string | null>(null); // string author name
  const [showTests, setShowTests] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    setTestResults(
      runDevTests({ works, posts, boards, halls, commons, currentUser })
    );
  }, []);

  // Project of the Day = highest likes among Works
  const workOfTheDay = useMemo<Work>(() => works.reduce((a: Work, b: Work) => (a.likes > b.likes ? a : b), works[0]), [works]);
  // Trending Post = most replies among Posts
  const trendingPost = useMemo<PostItem>(() => posts.reduce((a: PostItem, b: PostItem) => (a.replies > b.replies ? a : b), posts[0]), [posts]);

  // Like handlers
  const likeWork = (id: number) => setWorks((prev) => prev.map((w) => (w.id === id ? { ...w, likes: w.likes + 1 } : w)));
  const likePost = (id: number) => setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p)));

  const canSeeApply = (threshold: number) => currentUser.rep >= Math.floor(threshold * 0.7);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Top Nav */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-slate-900" />
            <span className="font-semibold tracking-tight">The Citadel</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#intro" className="hover:opacity-70">Intro</a>
            <a href="#herald-home" className="hover:opacity-70">The Herald</a>
          </nav>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Badge text={`Rep: ${currentUser.rep.toLocaleString()}`} />
            <button onClick={() => setShowWorkModal(true)} className="px-3 py-2 text-sm rounded-xl bg-slate-900 text-white">Post a Work</button>
            <button onClick={() => setShowPostModal(true)} className="px-3 py-2 text-sm rounded-xl border">Post</button>
          </div>
        </div>
      </header>

      {/* Intro band */}
      <section id="intro" className="mx-auto max-w-6xl px-4 pt-14 pb-8">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Left: model explanation */}
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              The professional network where work <span className="underline decoration-amber-300 decoration-4 underline-offset-4">actually happens</span>
            </h1>
            <p className="mt-4 text-slate-600 text-lg">
              Share <span className="font-semibold">Works</span> (projects) and <span className="font-semibold">Posts</span> (updates). You belong to a <span className="font-semibold">Hall</span> for your craft, and each Hall includes its own <span className="font-semibold">Commons</span> like Hiring, Showcase, and AMA. High‑signal items surface daily on <span className="font-semibold">The Herald</span>. Invite‑only <span className="font-semibold">Boards</span> are curated by moderators.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setShowWorkModal(true)} className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm">Create a Work</button>
              <button onClick={() => setShowPostModal(true)} className="px-5 py-3 rounded-2xl border text-sm">Write a Post</button>
            </div>
            {/* 3‑step explainer */}
            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              <Card className="p-4">
                <p className="text-sm font-semibold">1) Post a Work</p>
                <p className="text-xs text-slate-600 mt-1">Share what you are building and ask for feedback or collaborators.</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-semibold">2) Share a Post</p>
                <p className="text-xs text-slate-600 mt-1">Drop a learning, question, or resource to spark discussion.</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-semibold">3) Join your Hall</p>
                <p className="text-xs text-slate-600 mt-1">Each Hall’s Commons hosts Hiring, Showcase, and AMAs.</p>
              </Card>
            </div>
          </div>

          {/* Right: Hall page mock (illustrative) */}
          <div className="grid gap-3">
            <Card>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Builders Hall</p>
                <Badge text="Rep: 1,200" />
              </div>
              <div className="mt-3 grid gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-slate-500">Feed</p>
                  <p className="text-sm mt-1"><span className="font-medium">Onboarding Funnel Revamp</span> — Open to feedback</p>
                  <p className="text-sm mt-1"><span className="font-medium">RAG Chat for Docs</span> — Seeking collaborator</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-slate-500">Commons in this Hall</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border p-2 text-center">Hiring</div>
                    <div className="rounded-lg border p-2 text-center">Showcase</div>
                    <div className="rounded-lg border p-2 text-center">AMA</div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3 text-xs">
                  <div>
                    <p className="font-semibold">Founders Board</p>
                    <p className="text-slate-500">Invite‑only · $1M+ ARR or 2,000 rep</p>
                  </div>
                  <button className="rounded-lg border px-2 py-1 opacity-60" disabled>Apply</button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* The Herald — home screen mock */}
      <section id="herald-home" className="border-t bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-8 grid md:grid-cols-12 gap-6">
          {/* Left rail: Commons snapshot + Boards */}
          <aside className="md:col-span-3 order-2 md:order-1">
            <Card>
              <p className="text-sm font-semibold">Commons</p>
              <ul className="mt-2 text-sm text-slate-700 space-y-2">
                {commons.map((c) => (
                  <li key={c.name} className="flex items-center justify-between">
                    <span>{c.name}</span>
                    <button className="text-xs rounded-lg border px-2 py-1">Open</button>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Boards</p>
                <Badge text="Invite‑only" />
              </div>
              <div className="mt-2 grid gap-2 text-sm">
                {boards.map((b) => (
                  <div key={b.name} className="rounded-xl border p-3">
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.requirementLabel}</p>
                    {canSeeApply(b.repThreshold) ? (
                      <button className="mt-2 text-xs rounded-lg border px-2 py-1">Apply</button>
                    ) : (
                      <button className="mt-2 text-xs rounded-lg border px-2 py-1 opacity-60" disabled>Apply</button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </aside>

          {/* Center: Herald feed */}
          <main className="md:col-span-6 order-1 md:order-2">
            <div className="grid gap-4">
              {/* Project of the Day */}
              <Card className="border-amber-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">🏆 Project of the Day</p>
                    <p className="text-xs text-slate-500">Selected by traction and editor’s pick</p>
                  </div>
                  <button className="text-xs rounded-lg border px-2 py-1" onClick={() => likeWork(workOfTheDay.id)}>Like</button>
                </div>
                <div className="mt-3 flex items-start justify-between rounded-xl border p-3">
                  <div>
                    <p className="text-sm font-medium">{workOfTheDay.title}</p>
                    <p className="text-xs text-slate-500">by {workOfTheDay.author} • {workOfTheDay.status}</p>
                    <div className="mt-2 flex gap-1">{workOfTheDay.tags.map((t) => <Badge key={t} text={t} />)}</div>
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    <div>Likes: {workOfTheDay.likes}</div>
                    <div>Comments: {workOfTheDay.comments}</div>
                  </div>
                </div>
              </Card>

              {/* Trending Post */}
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">🗣 Trending Post</p>
                    <p className="text-xs text-slate-500">Most replies in the last day</p>
                  </div>
                  <button className="text-xs rounded-lg border px-2 py-1" onClick={() => likePost(trendingPost.id)}>Like</button>
                </div>
                <div className="mt-3 rounded-xl border p-3">
                  <p className="text-sm"><span className="font-medium">{trendingPost.author}</span> • <span className="text-slate-500 text-xs">{trendingPost.time}</span></p>
                  <p className="mt-1 text-sm text-slate-700 font-medium">{trendingPost.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{trendingPost.body}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    {trendingPost.tags.map((t) => <Badge key={t} text={t} />)}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span>Likes: {trendingPost.likes}</span>
                    <span>Replies: {trendingPost.replies}</span>
                  </div>
                </div>
              </Card>

              {/* Latest Posts (expanded cards) */}
              <Card>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Latest Posts</p>
                  <button className="text-xs rounded-lg border px-2 py-1" onClick={() => setShowPostModal(true)}>Post</button>
                </div>
                <div className="mt-3 grid gap-3">
                  {posts.map((p) => (
                    <div key={p.id} className="rounded-xl border p-3">
                      <p className="text-sm"><span className="font-medium">{p.author}</span> • <span className="text-slate-500 text-xs">{p.time}</span></p>
                      <p className="mt-1 text-sm text-slate-800 font-medium">{p.title}</p>
                      <p className="mt-1 text-sm text-slate-700">{p.body}</p>
                      <div className="mt-2 flex flex-wrap gap-1 text-xs">
                        {p.tags.map((t) => <Badge key={t} text={t} />)}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <button className="rounded-lg border px-2 py-1" onClick={() => likePost(p.id)}>Like ({p.likes})</button>
                        <button className="rounded-lg border px-2 py-1" onClick={() => setShowCommentsFor(p.id)}>Comment ({p.replies})</button>
                        <button className="rounded-lg border px-2 py-1" onClick={() => setShowDmModal(p.author)}>Message</button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            </div>
          </main>

          {/* Right rail: DMs */}
          <aside className="md:col-span-3 order-3">
            <Card>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">DM Requests</p>
                <Badge text="Requests" />
              </div>
              <div className="mt-2 grid gap-2 text-sm">
                {dmRequests.map((r) => (
                  <div key={r.id} className="rounded-xl border p-3">
                    <p className="font-medium">{r.from} <span className="text-xs text-slate-500">Rep {r.rep}</span></p>
                    <p className="text-xs text-slate-600">{r.preview}</p>
                    <div className="mt-2 flex gap-2 text-xs">
                      <button className="rounded-lg border px-2 py-1" onClick={() => setShowDmModal(r.from)}>View</button>
                      <button className="rounded-lg border px-2 py-1">Ignore</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="mt-4">
              <p className="text-sm font-semibold">Active Chats</p>
              <ul className="mt-2 text-sm text-slate-700 space-y-2">
                {dmActive.map((d) => (
                  <li key={d.id} className="flex items-center justify-between">
                    <span>{d.with}</span>
                    <button className="text-xs rounded-lg border px-2 py-1">Open</button>
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      </section>

      {/* Comment Drawer */}
      {showCommentsFor && (
        <div className="fixed inset-0 z-40 bg-black/40 flex justify-end" role="dialog" aria-modal="true">
          <div className="w-full max-w-md bg-white h-full p-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Comments</p>
              <button onClick={() => setShowCommentsFor(null)} className="text-sm text-slate-500">Close</button>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border p-3 text-sm text-slate-600">Example comment thread…</div>
              <textarea placeholder="Write a comment…" className="w-full rounded-xl border px-3 py-2 text-sm min-h-[80px]" />
              <button className="rounded-2xl bg-slate-900 text-white px-4 py-2 text-sm">Post Comment</button>
            </div>
          </div>
        </div>
      )}

      {/* DM Request Modal */}
      {showDmModal && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Message Request</p>
              <button className="text-slate-500 text-sm" onClick={() => setShowDmModal(null)}>Close</button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Send a request to <span className="font-medium">{showDmModal}</span>. They can approve or ignore.</p>
            <div className="mt-3 grid gap-3">
              <textarea placeholder="Write your message…" className="w-full rounded-xl border px-3 py-2 text-sm min-h-[120px]" />
              <div className="flex gap-2">
                <button className="rounded-2xl bg-slate-900 text-white px-4 py-2 text-sm" onClick={() => setShowDmModal(null)}>Send Request</button>
                <button className="rounded-2xl border px-4 py-2 text-sm" onClick={() => setShowDmModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Soft CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold">Want early access?</h3>
            <p className="text-sm text-slate-600 mt-1">Drop your email and we will invite a small wave of testers as The Herald goes live.</p>
          </div>
          <div className="flex gap-2">
            <input type="email" placeholder="you@example.com" className="flex-1 rounded-xl border px-3 py-2 text-sm" />
            <button className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm">Request invite</button>
          </div>
        </div>
      </section>

      {/* Dev Tests Panel */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <button className="text-xs rounded-xl border px-3 py-2" onClick={() => setShowTests((s) => !s)}>
          {showTests ? "Hide" : "Show"} Dev Test Report
        </button>
        {showTests && (
          <div className="mt-3 rounded-2xl border p-4 bg-white/70">
            <p className="text-sm font-semibold">Dev Tests</p>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              {testResults.map((r, i) => (
                <li key={i}>
                  <span className={r.pass ? "text-emerald-600" : "text-rose-600"}>
                    {r.pass ? "PASS" : "FAIL"}
                  </span>{" "}— {r.name} ({r.message})
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} The Citadel. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:opacity-70">Privacy</a>
            <a href="#" className="hover:opacity-70">Terms</a>
            <a href="#" className="hover:opacity-70">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
