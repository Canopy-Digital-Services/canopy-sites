-- Add submission limit fields to forms table
ALTER TABLE "forms" ADD COLUMN "stopAt" TIMESTAMP(3);
ALTER TABLE "forms" ADD COLUMN "maxSubmissions" INTEGER;
