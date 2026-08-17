"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { LessonSidebar } from "@/components/lesson/LessonSidebar";
import { LessonContentHeader } from "@/components/lesson/LessonContentHeader";
import { VideoPlayer } from "@/components/lesson/VideoPlayer";
import { HomeworkBlock } from "@/components/lesson/HomeworkBlock";
import { LessonArticleBlock } from "@/components/lesson/LessonArticleBlock";
import { QuizBlock } from "@/components/lesson/QuizBlock";
import { CommentsBlock } from "@/components/lesson/CommentsBlock";
import { LESSONS, youtubeThumbnail } from "@/lib/data/lessons";
import { DEMO_PROFILE } from "@/lib/data/profile";
import { useLocalProgress } from "@/lib/progress/useLocalProgress";

interface LessonPageProps {
  params: Promise<{ slug: string }>;
}

export default function LessonPage({ params }: LessonPageProps) {
  const { slug } = use(params);
  const [loggedIn, setLoggedIn] = useState(false);
  const { completedSlugs, markComplete } = useLocalProgress();

  const lesson = LESSONS.find((item) => item.slug === slug);
  if (!lesson) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header
        user={loggedIn ? { name: "Марія Шевченко", avatarUrl: null } : null}
        onLogout={() => setLoggedIn(false)}
      />

      <main className="flex-1 py-8 sm:py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 lg:grid-cols-[320px_1fr]">
          <LessonSidebar
            activeSlug={lesson.slug}
            completedSlugs={completedSlugs}
            className="order-2 h-fit lg:order-1 lg:sticky lg:top-24"
          />

          <div className="order-1 lg:order-2">
            <LessonContentHeader lesson={lesson} />

            <div className="mt-6">
              <VideoPlayer videoId={lesson.youtubeId} title={lesson.title} />
            </div>

            <HomeworkBlock
              lessonSlug={lesson.slug}
              items={lesson.homeworkItems}
              loggedIn={loggedIn}
              className="mt-6"
            />

            <LessonArticleBlock
              text={lesson.articleText}
              takeaways={lesson.articleTakeaways}
              imageUrl={lesson.articleImageUrl ?? youtubeThumbnail(lesson.youtubeId)}
              imageAlt={lesson.title}
              className="mt-6"
            />

            <QuizBlock
              questions={lesson.quizQuestions}
              onComplete={() => markComplete(lesson.slug)}
              className="mt-6"
            />

            <CommentsBlock
              lessonSlug={lesson.slug}
              loggedIn={loggedIn}
              isAdmin={DEMO_PROFILE.role === "ADMIN"}
              className="mt-6"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
