import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ContentService, CreateContactMessageDto, TestimonialDto } from './content.service';

class PageQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 20;
}

@ApiTags('content')
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('public/testimonials')
  @ApiOperation({ summary: 'Active customer testimonials (public)' })
  findTestimonials() {
    return this.content.findTestimonials();
  }

  @Post('public/contact')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Send a contact message' })
  createContactMessage(@Body() dto: CreateContactMessageDto) {
    return this.content.createContactMessage(dto);
  }

  @Get('admin/testimonials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'All testimonials (admin)' })
  findAllTestimonials() {
    return this.content.findAllTestimonials();
  }

  @Post('admin/testimonials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create testimonial (admin)' })
  createTestimonial(@Body() dto: TestimonialDto) {
    return this.content.createTestimonial(dto);
  }

  @Put('admin/testimonials/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update testimonial (admin)' })
  updateTestimonial(@Param('id') id: string, @Body() dto: TestimonialDto) {
    return this.content.updateTestimonial(id, dto);
  }

  @Delete('admin/testimonials/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete testimonial (admin)' })
  async removeTestimonial(@Param('id') id: string) {
    await this.content.removeTestimonial(id);
    return { message: 'Testimonial deleted' };
  }

  @Get('admin/contact-messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contact form messages (admin/staff)' })
  findContactMessages(@Query() query: PageQueryDto) {
    return this.content.findContactMessages(query.page, query.limit);
  }

  @Patch('admin/contact-messages/:id/handle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle handled flag on a message' })
  markHandled(@Param('id') id: string) {
    return this.content.markContactHandled(id);
  }
}