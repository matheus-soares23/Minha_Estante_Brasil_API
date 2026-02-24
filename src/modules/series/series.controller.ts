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
import { SeriesService } from './series.service';
import { CreateSeriesDto, UpdateSeriesDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createSeriesDto: CreateSeriesDto) {
    return this.seriesService.create(createSeriesDto);
  }

  @Get()
  findAll() {
    return this.seriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.seriesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSeriesDto: UpdateSeriesDto,
  ) {
    return this.seriesService.update(id, updateSeriesDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.seriesService.remove(id);
  }
}
