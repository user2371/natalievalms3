"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { LessonListCard } from "@/components/lesson/LessonListCard";
import { ArrowLeftIcon, SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { LESSONS } from "@/lib/data/lessons";
import { useLocalProgress } from "@/lib/progress/useLocalProgress";

type StatusFilter = "all" | "completed" | "incomplete";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Усі" },
  { value: "incomplete", label: "Не пройдено" },
  { value: "completed", label: "Пройдено" },
];

export default function LessonsPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const { completedSlugs } = useLocalProgress();

  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return LESSONS.filter((lesson) => {
      const completed = completedSlugs.has(lesson.slug);

      if (status === "completed" && !completed) return false;
      if (status === "incomplete" && completed) return false;

      if (!normalizedQuery) return true;
      return (
        lesson.title.toLowerCase().includes(normalizedQuery) ||
        String(lesson.number).includes(normalizedQuery)
      );
    });
  }, [query, status, completedSlugs]);

  return (
    <div className="flex flex-1 flex-col">
      <Header
        user={loggedIn ? { name: "Марія Шевченко", avatarUrl: null } : null}
        onLogout={() => setLoggedIn(false)}
      />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent-dark"
          >
            <ArrowLeftIcon size={16} />
            На головну
          </Link>

          <div className="mt-4">
            <Badge>{LESSONS.length} уроків</Badge>
            <h1 className="mt-4 font-serif text-3xl text-ink sm:text-4xl">Уроки курсу</h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Усі уроки доступні одразу — дивись у зручному темпі й порядку.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <Input
                icon={<SearchIcon size={17} />}
                placeholder="Пошук уроку за назвою або номером"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Пошук уроку"
              />
            </div>

            <div className="flex gap-1.5 rounded-full border border-rose-line/50 bg-white p-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatus(tab.value)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                    status === tab.value
                      ? "bg-accent text-white"
                      : "text-muted hover:text-ink",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {filteredLessons.length > 0 ? (
              filteredLessons.map((lesson) => (
                <LessonListCard
                  key={lesson.slug}
                  lesson={lesson}
                  completed={completedSlugs.has(lesson.slug)}
                />
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-rose-line/60 py-10 text-center text-sm text-muted">
                Уроків за таким запитом не знайдено. Спробуй інше формулювання.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
