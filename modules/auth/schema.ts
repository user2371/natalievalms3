import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Некоректний формат email"),
  password: z.string().min(1, "Пароль обов’язковий"),
  rememberMe: z.boolean().optional(),
});

export const RegisterSchema = z
  .object({
    firstName: z.string().min(2, "Ім’я має містити як мінімум 2 символи"),
    lastName: z.string().optional(),
    email: z.string().email("Некоректний формат email"),
    password: z.string().min(6, "Пароль має містити мінімум 6 символів"),
    confirmPassword: z.string().min(6, "Підтвердження паролю обов’язкове"),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "Необхідно погодитися з умовами використання",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі повинні збігатися",
    path: ["confirmPassword"],
  });

/**
 * Фаза FIXES, задача F.20 ("Забув пароль"). `ForgotPasswordSchema` —
 * лише email (крок 1: запит листа). `ResetPasswordSchema` — токен із
 * посилання (не показується користувачу як поле форми, передається
 * приховано з query-рядка) + новий пароль з підтвердженням — той самий
 * шаблон `.refine` на збіг паролів, що вже в `RegisterSchema` вище.
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().email("Некоректний формат email"),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Токен обов’язковий"),
    newPassword: z.string().min(6, "Пароль має містити мінімум 6 символів"),
    confirmPassword: z.string().min(6, "Підтвердження паролю обов’язкове"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Паролі повинні збігатися",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
