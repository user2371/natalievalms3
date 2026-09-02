"use server";

import { auth } from "@/auth";
import { getCourseByIdService } from "@/modules/courses";
import { hasCourseAccessService } from "@/modules/access";
import * as service from "./service";

/**
 * `modules/payments/actions.ts` — ФАЗА PAID+, задача PAID+.4.1
 * (02.09.2026, за прямим проханням користувача). Той самий контракт
 * `{ success, error }`/`{ success, data }`, що вже інші server actions
 * проєкту (напр. `modules/courses/actions.ts`).
 *
 * Подвійна перевірка (той самий принцип "не тільки в UI", що вже
 * `modules/access/service.ts::assertCourseAccessService`): сторінка
 * курсу вже показує кнопку "Оплатити" лише коли `isPaid && !hasAccess`
 * (задача PAID+.3.1), але цей server action все одно сам перевіряє
 * сесію, існування курсу, `isPaid` і відсутність доступу — клієнт не
 * повинен мати можливість викликати дію напряму (не через UI) для
 * безкоштовного курсу чи курсу, який уже куплено.
 */
export async function initiateCoursePurchaseAction(
  courseId: string,
): Promise<
  | { success: true; checkoutUrl: string; data: string; signature: string }
  | { success: false; error: string }
> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: "Потрібно увійти в акаунт, щоб оплатити курс" };
  }

  const course = await getCourseByIdService(courseId).catch(() => null);
  if (!course) {
    return { success: false, error: "Курс не знайдено" };
  }

  if (!course.isPaid || course.priceUAH == null) {
    return { success: false, error: "Цей курс безкоштовний" };
  }

  const role = (session.user as { role?: string } | undefined)?.role;
  const alreadyHasAccess = await hasCourseAccessService(
    { id: course.id, isPaid: course.isPaid },
    { id: userId, role },
  );
  if (alreadyHasAccess) {
    return { success: false, error: "Доступ до цього курсу вже є" };
  }

  try {
    const { checkoutUrl, data, signature } = await service.initiatePurchaseService(
      { id: course.id, isPaid: course.isPaid, priceUAH: course.priceUAH, title: course.title },
      { id: userId },
    );
    return { success: true, checkoutUrl, data, signature };
  } catch {
    return { success: false, error: "Не вдалося створити оплату. Спробуйте пізніше" };
  }
}
