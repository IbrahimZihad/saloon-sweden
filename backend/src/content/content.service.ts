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
import { ContactMessage, Testimonial } from '../database/models';
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
  // -- Public ---------------------------------------------------------------

  findTestimonials() {
    return Testimonial.findAll({
      where: { active: true },
      order: [['sortOrder', 'ASC']],
    });
  }

  async createContactMessage(dto: CreateContactMessageDto) {
    const message = await ContactMessage.create({
      name: clean(dto.name),
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone?.trim() ?? null,
      message: clean(dto.message),
    });
    return { id: message.id, message: 'Tack för ditt meddelande! Vi återkommer så snart vi kan.' };
  }

  // -- Admin ----------------------------------------------------------------

  findAllTestimonials() {
    return Testimonial.findAll({ order: [['sortOrder', 'ASC']] });
  }

  createTestimonial(dto: TestimonialDto) {
    return Testimonial.create({
      ...dto,
      authorName: clean(dto.authorName),
      textSv: clean(dto.textSv),
      textEn: dto.textEn ? clean(dto.textEn) : null,
    });
  }

  async updateTestimonial(id: string, dto: Partial<TestimonialDto>) {
    const existing = await Testimonial.findByPk(id);
    if (!existing) throw new NotFoundException('Testimonial not found');
    await existing.update({
      ...dto,
      authorName: dto.authorName ? clean(dto.authorName) : undefined,
      textSv: dto.textSv ? clean(dto.textSv) : undefined,
      textEn: dto.textEn ? clean(dto.textEn) : undefined,
    });
    return existing;
  }

  async removeTestimonial(id: string): Promise<void> {
    const existing = await Testimonial.findByPk(id);
    if (!existing) throw new NotFoundException('Testimonial not found');
    await existing.destroy();
  }

  async findContactMessages(page = 1, limit = 20) {
    const { rows, count } = await ContactMessage.findAndCountAll({
      order: [['createdAt', 'DESC']],
      ...skipTake(page, limit),
    });
    return paginated(
      rows.map((row) => row.get({ plain: true })),
      count,
      page,
      limit,
    );
  }

  async markContactHandled(id: string) {
    const existing = await ContactMessage.findByPk(id);
    if (!existing) throw new NotFoundException('Message not found');
    await existing.update({ handled: !existing.handled });
    return existing;
  }
}
