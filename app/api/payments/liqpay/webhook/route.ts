import { NextRequest, NextResponse } from "next/server";
import { handleLiqpayCallbackService } from "@/modules/payments";

/**
 * `app/api/payments/liqpay/webhook/route.ts` — ФАЗА PAID+, задача
 * PAID+.4.2 (02.09.2026, за прямим проханням користувача). Перший
 * власний route handler у проєкті (`app/api/auth/[...nextauth]/route.ts`
 * — лише реекспорт готових NextAuth-хендлерів, тому не прецедент для
 * структури нижче).
 *
 * LiqPay шле сюди `application/x-www-form-urlencoded` POST із полями
 * `data`+`signature` (не JSON) — тому тут `request.formData()`, а не
 * `request.json()`.
 *
 * Джерело істини — саме цей вебхук, а не редірект юзера на `result_url`
 * (той самий принцип "не довіряти клієнту", що вже застосований у
 * проєкті для ролі `ADMIN`, задокументовано в `modules/access/
 * service.ts`). Тому будь-яка помилка перевірки підпису/обробки —
 * `400`, а НЕ мовчазний `200` (LiqPay ретраїть на не-`200`-відповідь —
 * саме такою поведінкою й забезпечується "спробувати ще раз пізніше",
 * якщо БД чи мережа тимчасово недоступні; підробний/невідповідний
 * підпис теж підпадає під `400`, бо це не той випадок, коли варто
 * заохочувати ретраї, але простіше й безпечніше не розрізняти ці два
 * випадки статус-кодом, лишаючи розрізнення лише в лог-повідомленні).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let data: string | null = null;
  let signature: string | null = null;

  try {
    const formData = await request.formData();
    const rawData = formData.get("data");
    const rawSignature = formData.get("signature");
    data = typeof rawData === "string" ? rawData : null;
    signature = typeof rawSignature === "string" ? rawSignature : null;
  } catch {
    return NextResponse.json({ error: "Некоректне тіло запиту" }, { status: 400 });
  }

  if (!data || !signature) {
    return NextResponse.json({ error: "Відсутні поля data/signature" }, { status: 400 });
  }

  try {
    await handleLiqpayCallbackService(data, signature);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("LiqPay webhook error:", error);
    return NextResponse.json({ error: "Не вдалося обробити вебхук" }, { status: 400 });
  }
}
