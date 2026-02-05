export interface CreateAuthorData {
  name: string;
  biography?: string;
  birthDate?: Date;
  deathDate?: Date;
  image?: string;
}

export interface UpdateAuthorData {
  name?: string;
  biography?: string;
  birthDate?: Date;
  deathDate?: Date;
  image?: string;
}

export interface Author {
  id: number;
  name: string;
  biography: string | null;
  birthDate: Date | null;
  deathDate: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorWithBooks extends Author {
  books: {
    bookId: number;
    role: string | null;
    book: {
      id: number;
      title: string;
      originalTitle: string | null;
      synopsis: string | null;
      publicationDate: Date | null;
      coverImage: string | null;
      pages: number | null;
    };
  }[];
}

export interface IAuthorRepository {
  create(data: CreateAuthorData): Promise<Author>;
  findAll(): Promise<Author[]>;
  findOne(id: number): Promise<AuthorWithBooks | null>;
  update(id: number, data: UpdateAuthorData): Promise<Author>;
  delete(id: number): Promise<void>;
}
