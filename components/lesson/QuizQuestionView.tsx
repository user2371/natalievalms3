import Image from "next/image";
import type { QuizQuestion } from "@/lib/data/lessons";

export interface QuizQuestionViewProps {
  question: QuizQuestion;
  className?: string;
}

/**
 * Питання квізу (задача 0.7.15): текст питання + необов'язкова картинка
 * над текстом. Саме питання не містить варіантів відповідей — вони
 * рендеряться окремим компонентом `QuizOptions`.
 */
export function QuizQuestionView({ question, className }: QuizQuestionViewProps) {
  return (
    <div className={className}>
      {question.imageUrl && (
        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl bg-ink">
          <Image
            src={question.imageUrl}
            alt=""
            fill
            sizes="600px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <h3 className="font-serif text-lg text-ink">{question.text}</h3>
    </div>
  );
}
