import { z } from "zod";

/**
 * `modules/articles/schema.ts` — необхідний плумбінг для задачі 8.3.3
 * ("Збереження статті через `modules/articles` action — upsert по
 * lessonId"). Окремої задачі на сам модуль `modules/articles` у
 * `TASKS_DETAILED.md` нема (задача 8.3.1 каже "використати вже готовий
 * modules/articles", але фактично його ще не було — той самий випадок,
 * що вже траплявся раніше в проєкті: формулювання задачі описує бажаний
 * стан, а не завжди відповідає тому, що вже реально є в коді), тож
 * будуємо його тут за тим самим паттерном, що й решта модулів.
 *
 * `contentJson` — серіалізований JSON-документ Tiptap (`editor.getJSON()`,
 * `JSON.stringify(...)`), той самий формат, що й `Article.contentJson` у
 * Prisma-схемі.
 */
export const UpsertArticleSchema = z.object({
  lessonId: z.string().min(1, "Не вказано ID уроку"),
  contentJson: z.string().min(1, "Контент статті не може бути порожнім"),
});

export type UpsertArticleInput = z.infer<typeof UpsertArticleSchema>;

/** Форма статті, яку повертає `repository`/`service` (дзеркалить Prisma `Article`). */
export interface Article {
  id: string;
  lessonId: string;
  contentJson: string;
  updatedAt: Date;
}
