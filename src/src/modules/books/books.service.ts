import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookDto, UpdateBookDto } from './dto';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookDto: CreateBookDto) {
    const { authors, genreIds, ...bookData } = createBookDto;

    return this.prisma.book.create({
      data: {
        title: bookData.title,
        originalTitle: bookData.originalTitle,
        synopsis: bookData.synopsis,
        publicationDate: bookData.publicationDate
          ? new Date(bookData.publicationDate)
          : null,
        coverImage: bookData.coverImage,
        pages: bookData.pages,
        isbn10: bookData.isbn10,
        isbn13: bookData.isbn13,
        status: bookData.status,
        type: bookData.type,
        authors: authors
          ? {
              create: authors.map((author) => ({
                authorId: author.authorId,
                role: author.role,
              })),
            }
          : undefined,
        genres: genreIds
          ? {
              create: genreIds.map((genreId) => ({
                genreId,
              })),
            }
          : undefined,
      },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.book.findMany({
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
        seriesBooks: {
          include: {
            series: true,
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async findByAuthor(authorId: number) {
    return this.prisma.book.findMany({
      where: {
        authors: {
          some: {
            authorId,
          },
        },
      },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    await this.findOne(id);

    const { authors, genreIds, ...bookData } = updateBookDto;

    if (authors) {
      await this.prisma.bookAuthor.deleteMany({
        where: { bookId: id },
      });
    }

    if (genreIds) {
      await this.prisma.bookGenre.deleteMany({
        where: { bookId: id },
      });
    }

    return this.prisma.book.update({
      where: { id },
      data: {
        title: bookData.title,
        originalTitle: bookData.originalTitle,
        synopsis: bookData.synopsis,
        publicationDate: bookData.publicationDate
          ? new Date(bookData.publicationDate)
          : undefined,
        coverImage: bookData.coverImage,
        pages: bookData.pages,
        isbn10: bookData.isbn10,
        isbn13: bookData.isbn13,
        status: bookData.status,
        type: bookData.type,
        authors: authors
          ? {
              create: authors.map((author) => ({
                authorId: author.authorId,
                role: author.role,
              })),
            }
          : undefined,
        genres: genreIds
          ? {
              create: genreIds.map((genreId) => ({
                genreId,
              })),
            }
          : undefined,
      },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.book.delete({
      where: { id },
    });
  }
}
