-- Ensure pgcrypto is available for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "course_catalogs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_catalogs_code_key" ON "course_catalogs"("code");

-- CreateIndex
CREATE INDEX "course_catalogs_code_idx" ON "course_catalogs"("code");

-- Seed default course catalog entries
INSERT INTO "course_catalogs" ("id", "code", "name", "createdAt", "updatedAt") VALUES
  ('course_IF25_11001', 'IF25-11001', 'Algoritma dan Pemrograman', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_12003', 'IF25-12003', 'Algoritma dan Struktur Data', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_12004', 'IF25-12004', 'Matematika Diskrit', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_12005', 'IF25-12005', 'Organisasi dan Arsitektur Komputer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_12006', 'IF25-12006', 'Matriks dan Ruang Vektor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_21008', 'IF25-21008', 'Jaringan Komputer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_22014', 'IF25-22014', 'Pengembangan Aplikasi Web', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_22015', 'IF25-22015', 'Sistem Informasi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_22016', 'IF25-22016', 'Inteligensi Buatan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_22018', 'IF25-22018', 'Teori Bahasa Formal dan Otomata', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_31020', 'IF25-31020', 'Pembelajaran Mesin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_31022', 'IF25-31022', 'Desain Interaksi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_31023', 'IF25-31023', 'Manajemen Proyek Teknologi Informasi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_31024', 'IF25-31024', 'Studium Generale', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_32025', 'IF25-32025', 'Penambangan Data', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_32026', 'IF25-32026', 'Socio Informatika dan Profesionalisme', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_32028', 'IF25-32028', 'Proyek Teknologi Informasi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_40032', 'IF25-40032', 'Proposal Tugas Akhir', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_40033', 'IF25-40033', 'Tugas Akhir', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_40201', 'IF25-40201', 'Komputasi Awan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_40204', 'IF25-40204', 'Sistem Informasi Kesehatan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_40301', 'IF25-40301', 'Ethical Hacking', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_40304', 'IF25-40304', 'Pembelajaran Mesin Multimodal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_40305', 'IF25-40305', 'Sistem Teknologi Multimedia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_40401', 'IF25-40401', 'Pembelajaran Mendalam', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_40409', 'IF25-40409', 'Pemrosesan Bahasa Alami', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_40410', 'IF25-40410', 'Pengolahan Citra Digital', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_40412', 'IF25-40412', 'Teknologi Game', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_40413', 'IF25-40413', 'Visualisasi Data dan Informasi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_41029', 'IF25-41029', 'Metodologi Penelitian', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_IF25_41031', 'IF25-41031', 'Kapita Selekta', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_WI25_00002', 'WI25-00002', 'Dasar Teknologi Digital', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_WI25_00005', 'WI25-00005', 'Pola Hidup Sehat dan Kebugaran Fisik', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_WI25_00006', 'WI25-00006', 'Karier, Etika, dan Kewirausahaan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('course_WU25_00003', 'WU25-00003', 'Kewarganegaraan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
