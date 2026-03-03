import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateUserBookListDto, UpdateUserBookListDto } from './dto';
import {
  IUserBookListRepository,
  IBookRepository,
  BookStatisticsOperation,
} from '../../repositories/interfaces';
import {
  USER_BOOK_LIST_REPOSITORY,
  BOOK_REPOSITORY,
} from '../../repositories/tokens';

@Injectable()
export class UserBookListService {
  constructor(
    @Inject(USER_BOOK_LIST_REPOSITORY)
    private readonly userBookListRepository: IUserBookListRepository,
    @Inject(BOOK_REPOSITORY)
    private readonly bookRepository: IBookRepository,
  ) {}

  async create(createUserBookListDto: CreateUserBookListDto) {
    const userBookList = await this.userBookListRepository.create({
      userId: createUserBookListDto.userId,
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

    // UserBookList afeta apenas popularidade, não ratings (ratings vêm de Review)
    await this.bookRepository.updateBookStatistics(
      createUserBookListDto.bookId,
      BookStatisticsOperation.ADD,
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

    return updated;
  }

  async remove(id: number) {
    const userBookList = await this.findOne(id);
    await this.userBookListRepository.delete(id);
    // UserBookList afeta apenas popularidade
    await this.bookRepository.updateBookStatistics(
      userBookList.bookId,
      BookStatisticsOperation.REMOVE,
    );
  }
}
