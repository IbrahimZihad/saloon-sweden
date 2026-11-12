import { BadRequestException, NotFoundException } from '../common/http-exceptions';
import { RuntimeConfig } from '../common/runtime-config';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { GalleryImage } from '../database/models';

void extname;

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_SIZE = 5 * 1024 * 1024;

function hasValidMagicBytes(buffer: Buffer, mime: string): boolean {
  if (mime === 'image/jpeg') {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === 'image/png') {
    return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mime === 'image/webp') {
    return buffer.length > 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

export class UploadsService {
  readonly uploadDir: string;

  constructor(private readonly config: RuntimeConfig) {
    this.uploadDir = resolve(process.cwd(), this.config.get<string>('UPLOAD_DIRECTORY') ?? 'uploads');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveImage(file: Express.Multer.File | undefined): Promise<{ url: string; filename: string }> {
    if (!file) throw new BadRequestException('No file uploaded');
    const extension = ALLOWED_TYPES[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Only JPEG, PNG and WebP images are allowed');
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('Image exceeds the 5 MB limit');
    }
    if (!hasValidMagicBytes(file.buffer, file.mimetype)) {
      throw new BadRequestException('File content does not match its image type');
    }
    // Random server-generated filename: never trust the client's name/extension.
    const filename = `${randomUUID()}${extension}`;
    await writeFile(join(this.uploadDir, filename), file.buffer);
    return { url: `/uploads/${filename}`, filename };
  }

  async deleteImage(filename: string): Promise<void> {
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(filename)) {
      throw new BadRequestException('Invalid filename');
    }
    const path = join(this.uploadDir, filename);
    if (!existsSync(path)) throw new NotFoundException('File not found');
    await unlink(path);
  }

  async listGallery() {
    return GalleryImage.findAll({
      where: { active: true },
      order: [['sortOrder', 'ASC']],
    });
  }

  async addGalleryImage(imageUrl: string, altSv?: string, altEn?: string) {
    const max = await GalleryImage.max('sortOrder');
    return GalleryImage.create({
      imageUrl,
      altSv: altSv ?? null,
      altEn: altEn ?? null,
      sortOrder: (typeof max === 'number' ? max : 0) + 1,
    });
  }

  async removeGalleryImage(id: string): Promise<void> {
    const image = await GalleryImage.findByPk(id);
    if (!image) throw new NotFoundException('Gallery image not found');
    await image.destroy();
    const filename = image.imageUrl.split('/').pop();
    if (filename) {
      await this.deleteImage(filename).catch(() => undefined);
    }
  }
}
