import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadsService } from './uploads.service';

class GalleryMetaDto {
  @IsOptional() @IsString() @MaxLength(255)
  altSv?: string;

  @IsOptional() @IsString() @MaxLength(255)
  altEn?: string;
}

@ApiTags('uploads')
@Controller()
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('admin/uploads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload an image (JPEG/PNG/WebP, max 5 MB)' })
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.uploads.saveImage(file);
  }

  @Get('public/gallery')
  @ApiOperation({ summary: 'Active gallery images (public)' })
  listGallery() {
    return this.uploads.listGallery();
  }

  @Post('admin/gallery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        altSv: { type: 'string' },
        altEn: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload and publish a gallery image' })
  async addGalleryImage(@UploadedFile() file: Express.Multer.File, @Body() meta: GalleryMetaDto) {
    const { url } = await this.uploads.saveImage(file);
    return this.uploads.addGalleryImage(url, meta.altSv, meta.altEn);
  }

  @Delete('admin/gallery/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a gallery image and its file' })
  async removeGalleryImage(@Param('id') id: string) {
    await this.uploads.removeGalleryImage(id);
    return { message: 'Gallery image removed' };
  }
}