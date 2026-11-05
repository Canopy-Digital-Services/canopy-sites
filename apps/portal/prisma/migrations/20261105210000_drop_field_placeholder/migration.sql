-- Field placeholders were retired in v5.10.0 and nothing reads the column.
-- AlterTable
ALTER TABLE "fields" DROP COLUMN "placeholder";
