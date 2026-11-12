import { BadRequestException, NotFoundException } from '../common/http-exceptions';
import { Service, ServiceCategory } from '../database/models';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

export class CategoriesService {
  async findPublic() {
    return ServiceCategory.findAll({
      where: { active: true },
      order: [['sortOrder', 'ASC']],
      include: [
        {
          model: Service,
          as: 'services',
          where: { active: true },
          required: false,
          order: [['sortOrder', 'ASC']],
        },
      ],
    });
  }

  async findAll() {
    const categories = await ServiceCategory.findAll({
      order: [['sortOrder', 'ASC']],
      include: [{ model: Service, as: 'services', attributes: ['id'], required: false }],
    });

    return categories.map((category) => {
      const plain = category.get({ plain: true }) as Record<string, unknown> & {
        services?: unknown[];
      };
      const count = plain.services?.length ?? 0;
      delete plain.services;
      return { ...plain, _count: { services: count } };
    });
  }

  create(dto: CreateCategoryDto) {
    return ServiceCategory.create({ ...dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.ensureExists(id);
    await category.update({ ...dto });
    return category;
  }

  async remove(id: string): Promise<void> {
    const category = await this.ensureExists(id);
    const serviceCount = await Service.count({ where: { categoryId: id } });
    if (serviceCount > 0) {
      throw new BadRequestException(
        'Category still has services. Move or delete them first, or deactivate the category instead.',
      );
    }
    await category.destroy();
  }

  private async ensureExists(id: string): Promise<ServiceCategory> {
    const category = await ServiceCategory.findByPk(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}
