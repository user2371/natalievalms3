"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import * as service from "./service";
import * as uploadService from "./uploadService";

/**
 * `modules/certificates/actions.ts` — той самий поділ, що й у
 * `modules/homework/actions.ts`.
 *
 * READ (`getCertificatesForUserAction`) — видача СИСТЕМНОГО сертифіката
 * НЕ має окремої client-ініційованої дії (на відміну від
 * `submitHomeworkAction`): вона відбувається автоматично, системним
 * побічним ефектом на сервері (`submitQuizResultAction`,
 * `modules/quizzes/actions.ts`).
 *
 * `uploadCertificateAction`/`deleteCertificateAction` (CERT+.1.4,
 * 08.08.2026) — це вже client-ініційовані дії ВЛАСНИКА (завантаження/
 * видалення власного сертифіката), тому, на відміну від READ-дії вище,
 * ОБИДВІ перевіряють `auth()` (реальна сесія), той самий принцип, що
 * `updateAvatarAction`/`removeAvatarAction` (`modules/account/actions.ts`).
 */
export async function getCertificatesForUserAction(userId: string) {
  try {
    const certificates = await service.getCertificatesForUserService(userId);
    return { success: true as const, certificates, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося завантажити сертифікати";
    return { success: false as const, certificates: [], error: message };
  }
}

/**
 * CERT+.1.4 — шляхи, де реально рендериться список/мініатюри
 * сертифікатів: `/certificates` (власна сторінка), `/profile` (свій
 * профіль, мініатюри), `/users/[id]` (шаблон чужого/публічного
 * профілю — динамічний, той самий синтаксис `revalidatePath("/users/
 * [id]", "page")`, що вже в `modules/profile/actions.ts`/
 * `modules/account/actions.ts`), `/users/[id]/certificates` (повний
 * список на чужому профілі).
 */
function revalidateCertificatePaths(): void {
  revalidatePath("/certificates");
  revalidatePath("/users/[id]/certificates", "page");
  revalidatePath("/profile");
  revalidatePath("/users/[id]", "page");
}

export async function uploadCertificateAction(formData: FormData) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб завантажити сертифікат");
    }

    const title = formData.get("title");
    const image = formData.get("image");
    if (typeof title !== "string") {
      throw new Error("Назву сертифіката не передано");
    }
    if (!(image instanceof File)) {
      throw new Error("Файл не передано");
    }

    const certificate = await uploadService.uploadCertificateService(userId, title, image);
    revalidateCertificatePaths();

    return { success: true as const, certificate, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося завантажити сертифікат";
    return { success: false as const, certificate: null, error: message };
  }
}

/**
 * CERT+.1.4 — **ОНОВЛЕНО 08.08.2026 (CERT+.3.3):** дістає й `userId`, і
 * `role` із сесії (той самий `(session?.user as { role?: string } |
 * undefined)?.role`, що вже в `modules/comments/actions.ts::
 * deleteCommentAction`), передає ОБИДВА в
 * `deleteUploadedCertificateService`, щоб адмін міг видалити чужий
 * завантажений сертифікат, не лише власний.
 *
 * `revalidateCertificatePaths()` + ЯВНО `revalidatePath("/users/[id]",
 * "page")` для `id` = `userId` ВЛАСНИКА видаленого сертифіката (з
 * відповіді сервісу) — коли видаляє адмін, це інша людина, ніж та, що
 * зараз залогінена, тому загальний шаблон-виклик вище недостатній
 * (Next.js інвалідує шаблон лише при наступному запиті ДО того самого
 * шляху, а не миттєво для вже завантажених клієнтів — конкретний `id`
 * власника підвищує шанс, що зміна відобразиться одразу при наступному
 * відвідуванні саме його профілю).
 */
export async function deleteCertificateAction(certificateId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб видалити сертифікат");
    }

    const { userId: ownerId } = await uploadService.deleteUploadedCertificateService(
      userId,
      role ?? "USER",
      certificateId,
    );
    revalidateCertificatePaths();
    revalidatePath(`/users/${ownerId}`);

    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося видалити сертифікат";
    return { success: false as const, error: message };
  }
}
