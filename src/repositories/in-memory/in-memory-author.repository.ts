import { Injectable } from '@nestjs/common';
import {
  IAuthorRepository,
  CreateAuthorData,
  UpdateAuthorData,
  Author,
  AuthorWithBooks,
} from '../interfaces';

@Injectable()
export class InMemoryAuthorRepository implements IAuthorRepository {
  private authors: Author[] = [];
  private currentId = 1;

  async create(data: CreateAuthorData): Promise<Author> {
    const author: Author = {
      id: this.currentId++,
      name: data.name,
      biography: data.biography || null,
      birthDate: data.birthDate || null,
      deathDate: data.deathDate || null,
      image: data.image || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.authors.push(author);
    return author;
  }

  async findAll(): Promise<Author[]> {
    return [...this.authors].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findOne(id: number): Promise<AuthorWithBooks | null> {
    const author = this.authors.find((a) => a.id === id);
    if (!author) return null;

    return {
      ...author,
      books: [],
    };
  }

  async update(id: number, data: UpdateAuthorData): Promise<Author> {
    const index = this.authors.findIndex((a) => a.id === id);

    if (index === -1) {
      throw new Error('Author not found');
    }

    this.authors[index] = {
      ...this.authors[index],
      name: data.name ?? this.authors[index].name,
      biography: data.biography ?? this.authors[index].biography,
      birthDate: data.birthDate ?? this.authors[index].birthDate,
      deathDate: data.deathDate ?? this.authors[index].deathDate,
      image: data.image ?? this.authors[index].image,
      updatedAt: new Date(),
    };

    return this.authors[index];
  }

  async delete(id: number): Promise<void> {
    const index = this.authors.findIndex((a) => a.id === id);

    if (index === -1) {
      throw new Error('Author not found');
    }

    this.authors.splice(index, 1);
  }
}
