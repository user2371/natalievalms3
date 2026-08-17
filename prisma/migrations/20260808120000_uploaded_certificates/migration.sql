-- CreateTable
CREATE TABLE "UploadedCertificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedCertificate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UploadedCertificate" ADD CONSTRAINT "UploadedCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
