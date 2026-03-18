-- CreateTable
CREATE TABLE "book_suggestions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "genre_id" INTEGER NOT NULL,
    "type" "BookType" NOT NULL,
    "publication_date" DATE,
    "synopsis" TEXT,
    "cover_image" VARCHAR(1024),
    "pages" INTEGER,
    "authors" TEXT NOT NULL,
    "series_name" VARCHAR(255),
    "series_volumes" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_suggestions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "book_suggestions" ADD CONSTRAINT "book_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_suggestions" ADD CONSTRAINT "book_suggestions_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
