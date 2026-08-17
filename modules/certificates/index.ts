// `modules/certificates/index.ts` — публічний експорт модуля, той самий
// підхід, що й у `modules/homework/index.ts`.
//
// Багфікс CERT+.1.6 (08.08.2026): `uploadCertificateService`/
// `deleteUploadedCertificateService` (Cloudinary-залежні) НАВМИСНО
// НЕ реекспортуються звідси напряму — лише через захищений
// `"use server"`-кордон `uploadCertificateAction`/
// `deleteCertificateAction` нижче. Деталі — docblock у
// `uploadService.ts`.
export {
  getCertificatesForUserAction,
  uploadCertificateAction,
  deleteCertificateAction,
} from "./actions";
export { issueCertificateIfNotExistsService, getCertificatesForUserService } from "./service";
export type { CertificateEntry, UploadCertificateInput } from "./schema";
export { UploadCertificateSchema } from "./schema";
