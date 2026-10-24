import { useEffect, useMemo, useState } from "react";
import { Book, Plus, Trash2, Bookmark, BookOpen, CheckCheck, Library } from "lucide-react";

type Status = "want" | "reading" | "finished";

interface BookItem {
  id: string;
  title: string;
  status: Status;
}

const STATUS_META: Record<Status, { label: string; icon: typeof Bookmark; dot: string; chip: string }> = {
  want: {
    label: "Want to Read",
    icon: Bookmark,
    dot: "bg-amber-400",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
  },
  reading: {
    label: "Reading",
    icon: BookOpen,
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700 border-sky-200",
  },
  finished: {
    label: "Finished",
    icon: CheckCheck,
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

const FILTERS: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "want", label: "Want to Read" },
  { key: "reading", label: "Reading" },
  { key: "finished", label: "Finished" },
];

const STORAGE_KEY = "reading-list:v1";

function loadBooks(): BookItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b) => b && typeof b.title === "string" && ["want", "reading", "finished"].includes(b.status)
    );
  } catch {
    return [];
  }
}

function App() {
  const [books, setBooks] = useState<BookItem[]>(loadBooks);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<Status>("want");
  const [filter, setFilter] = useState<Status | "all">("all");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState<string>("");
  const [warning, setWarning] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  const counts = useMemo(() => {
    return books.reduce(
      (acc, b) => {
        acc[b.status] += 1;
        return acc;
      },
      { want: 0, reading: 0, finished: 0 } as Record<Status, number>
    );
  }, [books]);

  const visible = useMemo(() => {
    const list = filter === "all" ? books : books.filter((b) => b.status === filter);
    return [...list].sort((a, b) => b.id.localeCompare(a.id));
  }, [books, filter]);

  function normalize(s: string): string {
    return s.trim().replace(/\s+/g, "").toLowerCase();
  }

  function addBook(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (trimmed.length > 60) {
      setError("Book title must be 60 characters or fewer.");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (books.some((b) => normalize(b.title) === normalize(trimmed))) {
      setError("This book is already in your reading list.");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setError("");
    setBooks((prev) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: trimmed, status },
      ...prev,
    ]);
    setTitle("");
    setStatus("want");
  }

  function changeStatus(id: string, next: Status) {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status: next } : b)));
  }

  function removeBook(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/80 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-amber-50 shadow-sm">
              <Library size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Reading List</h1>
              <p className="text-xs text-stone-500">
                {books.length} {books.length === 1 ? "book" : "books"} in your library
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
        {/* Add form */}
        <section
          className={`rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5 ${
            shake ? "animate-[shake_0.4s_ease-in-out]" : ""
          }`}
        >
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-500">
            <Plus size={16} /> Add a book
          </h2>
          <form onSubmit={addBook} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="title" className="sr-only">
                Book title
              </label>
              <input
                id="title"
                type="text"
                maxLength={80}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setWarning(e.target.value.trim().length > 60);
                  if (error) setError("");
                }}
                placeholder="Book title"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/5 ${
                  error
                    ? "border-red-400 focus:border-red-400 focus:ring-red-500/10"
                    : "border-stone-200 bg-stone-50 focus:border-stone-400 focus:ring-stone-900/5"
                }`}
              />
              <div className="mt-1.5 flex items-center justify-between gap-2">
                {error ? (
                  <p className="text-xs font-medium text-red-500">{error}</p>
                ) : warning ? (
                  <p className="text-xs font-medium text-amber-600">Book title must be 60 characters or fewer.</p>
                ) : (
                  <span />
                )}
                <span className={`shrink-0 text-[11px] ${title.trim().length > 60 ? "text-amber-600" : "text-stone-400"}`}>
                  {title.trim().length}/60
                </span>
              </div>
            </div>
            <div className="sm:w-44">
              <label htmlFor="status" className="sr-only">
                Reading status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 focus:border-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/5"
              >
                <option value="want">Want to Read</option>
                <option value="reading">Reading</option>
                <option value="finished">Finished</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-stone-800 active:scale-[0.98]"
            >
              <Plus size={16} /> Add
            </button>
          </form>
        </section>

        {/* Filters */}
        {books.length > 0 && (
          <section className="mt-6">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                const count = f.key === "all" ? books.length : counts[f.key as Status];
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-stone-900 bg-stone-900 text-amber-50"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    {f.label}
                    <span
                      className={`rounded-full px-1.5 text-[10px] font-semibold ${
                        active ? "bg-amber-50/20 text-amber-50" : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Book list */}
        <section className="mt-6">
          {books.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <Book size={26} />
              </div>
              <p className="text-sm font-medium text-stone-600">
                Your reading list is empty. Add your first book.
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
              <p className="text-sm text-stone-500">No books in this category.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visible.map((book) => {
                const meta = STATUS_META[book.status];
                const Icon = meta.icon;
                return (
                  <li
                    key={book.id}
                    className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                          <Book size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold leading-snug text-stone-800">
                            {book.title}
                          </p>
                          <span
                            className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            <Icon size={11} />
                            {meta.label}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeBook(book.id)}
                        aria-label={`Remove ${book.title}`}
                        className="shrink-0 rounded-lg p-1.5 text-stone-300 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {(["want", "reading", "finished"] as Status[]).map((s) => {
                        const m = STATUS_META[s];
                        const activeStatus = book.status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => changeStatus(book.id, s)}
                            className={`flex items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-[11px] font-medium transition ${
                              activeStatus
                                ? m.chip + " ring-1 ring-offset-0"
                                : "border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100"
                            }`}
                          >
                            <m.icon size={11} />
                            <span className="hidden sm:inline">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-stone-200 py-5 text-center text-xs text-stone-400">
        Saved locally in your browser
      </footer>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

export default App;
