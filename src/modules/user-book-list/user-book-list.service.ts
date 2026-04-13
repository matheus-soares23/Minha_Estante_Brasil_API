import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateUserBookListDto, UpdateUserBookListDto } from './dto';
import { IUserBookListRepository } from '../../repositories/interfaces';
import { USER_BOOK_LIST_REPOSITORY } from '../../repositories/tokens';
import { BooksService } from '../books/books.service';

@Injectable()
export class UserBookListService {
  constructor(
    @Inject(USER_BOOK_LIST_REPOSITORY)
    private readonly userBookListRepository: IUserBookListRepository,
    private readonly booksService: BooksService,
  ) {}

  async create(createUserBookListDto: CreateUserBookListDto, userId: number) {
    const userBookList = await this.userBookListRepository.create({
      userId: userId,
      bookId: createUserBookListDto.bookId,
      status: createUserBookListDto.status,
      rating: createUserBookListDto.rating,
      progress: createUserBookListDto.progress,
      startDate: createUserBookListDto.startDate
        ? new Date(createUserBookListDto.startDate)
        : undefined,
      finishDate: createUserBookListDto.finishDate
        ? new Date(createUserBookListDto.finishDate)
        : undefined,
      notes: createUserBookListDto.notes,
    });

    // UserBookList controla popularidade e rating das estatísticas do livro
    await this.booksService.handleUserBookListAdded(
      createUserBookListDto.bookId,
      createUserBookListDto.rating,
    );
    return userBookList;
  }

  async findAll() {
    return this.userBookListRepository.findAll();
  }

  async findOne(id: number) {
    const userBookList = await this.userBookListRepository.findOne(id);

    if (!userBookList) {
      throw new NotFoundException(`UserBookList with ID ${id} not found`);
    }

    return userBookList;
  }

  async findByUser(userId: number) {
    return this.userBookListRepository.findByUser(userId);
  }

  async update(id: number, updateUserBookListDto: UpdateUserBookListDto) {
    const userBookList = await this.findOne(id);

    const updated = await this.userBookListRepository.update(id, {
      status: updateUserBookListDto.status,
      rating: updateUserBookListDto.rating,
      progress: updateUserBookListDto.progress,
      startDate: updateUserBookListDto.startDate
        ? new Date(updateUserBookListDto.startDate)
        : undefined,
      finishDate: updateUserBookListDto.finishDate
        ? new Date(updateUserBookListDto.finishDate)
        : undefined,
      notes: updateUserBookListDto.notes,
    });

    // Atualizar estatísticas se o rating mudou
    if (updateUserBookListDto.rating !== undefined) {
      await this.booksService.handleUserBookListUpdated(
        userBookList.bookId,
        userBookList.rating,
        updateUserBookListDto.rating,
      );
    }

    return updated;
  }

  async remove(id: number) {
    const userBookList = await this.findOne(id);
    await this.userBookListRepository.delete(id);
    // UserBookList controla popularidade e rating
    await this.booksService.handleUserBookListRemoved(
      userBookList.bookId,
      userBookList.rating,
    );
  }
}
