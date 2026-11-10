import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import { paginated, skipTake } from '../common/dto/pagination.dto';

export class CreateContactMessageDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(160)
  name!: string;

  @ApiProperty() @IsEmail() @MaxLength(190)
  email!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @ApiProperty() @IsString() @MinLength(5) @MaxLength(5000)
  message!: string;
}

export class TestimonialDto {
  @ApiProperty() @IsString() @MaxLength(120)
  authorName!: string;

  @ApiProperty() @IsString() @MaxLength(2000)
  textSv!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  textEn?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5)
  rating?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;
}

function clean(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  // -- Public ---------------------------------------------------------------

  findTestimonials() {
    return this.prisma.testimonial.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createContactMessage(dto: CreateContactMessageDto) {
    const message = await this.prisma.contactMessage.create({
      data: {
        name: clean(dto.name),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone?.trim(),
        message: clean(dto.message),
      },
    });
    return { id: message.id, message: 'Tack för ditt meddelande! Vi återkommer så snart vi kan.' };
  }

  // -- Admin ----------------------------------------------------------------

  findAllTestimonials() {
    return this.prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  createTestimonial(dto: TestimonialDto) {
    return this.prisma.testimonial.create({
      data: { ...dto, authorName: clean(dto.authorName), textSv: clean(dto.textSv), textEn: dto.textEn ? clean(dto.textEn) : undefined },
    });
  }

  async updateTestimonial(id: string, dto: Partial<TestimonialDto>) {
    const existing = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Testimonial not found');
    return this.prisma.testimonial.update({
      where: { id },
      data: {
        ...dto,
        authorName: dto.authorName ? clean(dto.authorName) : undefined,
        textSv: dto.textSv ? clean(dto.textSv) : undefined,
        textEn: dto.textEn ? clean(dto.textEn) : undefined,
      },
    });
  }

  async removeTestimonial(id: string): Promise<void> {
    const existing = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Testimonial not found');
    await this.prisma.testimonial.delete({ where: { id } });
  }

  async findContactMessages(page = 1, limit = 20) {
    const [total, data] = await this.prisma.$transaction([
      this.prisma.contactMessage.count(),
      this.prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
        ...skipTake(page, limit),
      }),
    ]);
    return paginated(data, total, page, limit);
  }

  async markContactHandled(id: string) {
    const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Message not found');
    return this.prisma.contactMessage.update({ where: { id }, data: { handled: !existing.handled } });
  }
}