import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BookSuggestionsService } from './book-suggestions.service';
import { CreateBookSuggestionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('book-suggestions')
export class BookSuggestionsController {
  constructor(
    private readonly bookSuggestionsService: BookSuggestionsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createBookSuggestionDto: CreateBookSuggestionDto) {
    return this.bookSuggestionsService.create(createBookSuggestionDto);
  }

  @Get()
  findAll() {
    return this.bookSuggestionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookSuggestionsService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.bookSuggestionsService.findByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bookSuggestionsService.remove(id);
  }
}
