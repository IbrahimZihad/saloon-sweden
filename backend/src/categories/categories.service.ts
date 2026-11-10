import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findPublic() {
    return this.prisma.serviceCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  findAll() {
    return this.prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { services: true } } },
    });
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.serviceCategory.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    return this.prisma.serviceCategory.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    const serviceCount = await this.prisma.service.count({ where: { categoryId: id } });
    if (serviceCount > 0) {
      throw new BadRequestException(
        'Category still has services. Move or delete them first, or deactivate the category instead.',
      );
    }
    await this.prisma.serviceCategory.delete({ where: { id } });
  }

  private async ensureExists(id: string): Promise<void> {
    const category = await this.prisma.serviceCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
  }
}