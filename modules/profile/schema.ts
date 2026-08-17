import { z } from "zod";

/**
 * `modules/profile/schema.ts` — Фаза 3+, задача 3+.4.1 (перша схема
 * цього модуля — досі `modules/profile` обходився без `zod`, бо єдиний
 * запис, що тут був, `updateHomeworkVisibilityAction`, приймає простий
 * `boolean`, якому окрема схема не потрібна).
 *
 * 500 — та сама межа, що вже в UI-лічильнику `BIO_MAX_LENGTH`
 * (`app/settings/page.tsx`); `Textarea` там і так не пускає ввести
 * більше через `maxLength`, але сервер (`updateBioAction`, 3+.4.3)
 * НІКОЛИ не покладається лише на клієнтське обмеження — той самий
 * принцип, що вже задокументований для аватарки (`validateAvatarFile`,
 * `modules/account/service.ts`, 3+.1.2).
 */
export const UpdateBioSchema = z.object({
  about: z.string().max(500, "Опис не може перевищувати 500 символів"),
});

export type UpdateBioInput = z.infer<typeof UpdateBioSchema>;
