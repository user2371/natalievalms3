-- AlterTable
ALTER TABLE "Course" ADD COLUMN "introTitle" TEXT,
ADD COLUMN "introHighlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "featuredCourseId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_featuredCourseId_key" ON "SiteSettings"("featuredCourseId");

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_featuredCourseId_fkey" FOREIGN KEY ("featuredCourseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
