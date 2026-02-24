import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UserBookListService } from './user-book-list.service';
import { CreateUserBookListDto, UpdateUserBookListDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('user-book-list')
export class UserBookListController {
  constructor(private readonly userBookListService: UserBookListService) {}

  @Post()
  create(@Body() createUserBookListDto: CreateUserBookListDto) {
    return this.userBookListService.create(createUserBookListDto);
  }

  @Get()
  findAll() {
    return this.userBookListService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userBookListService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.userBookListService.findByUser(userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserBookListDto: UpdateUserBookListDto,
  ) {
    return this.userBookListService.update(id, updateUserBookListDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userBookListService.remove(id);
  }
}
