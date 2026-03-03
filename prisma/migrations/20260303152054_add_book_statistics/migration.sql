-- CreateTable
CREATE TABLE "book_statistics" (
    "book_id" INTEGER NOT NULL,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DOUBLE PRECISION,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_statistics_pkey" PRIMARY KEY ("book_id")
);

-- AddForeignKey
ALTER TABLE "book_statistics" ADD CONSTRAINT "book_statistics_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
