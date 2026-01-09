import { Request, Response } from 'express';
import { Category, Course } from '../../shared/models';

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    // First, get all unique domains from courses
    const courseDomains = await Course.distinct('domain');

    // Get existing categories
    let categories = await Category.find().sort({ createdAt: -1 });
    const existingCategoryNames = categories.map(cat => cat.name);

    // Create missing categories from course domains
    const missingDomains = courseDomains.filter(domain => !existingCategoryNames.includes(domain));

    if (missingDomains.length > 0) {
      console.log('Creating missing categories:', missingDomains);

      const newCategories = await Promise.all(
        missingDomains.map(async (domain) => {
          const courseCount = await Course.countDocuments({ domain });
          return await Category.create({
            name: domain,
            description: `Danh mục ${domain}`,
            isActive: true,
            courseCount
          });
        })
      );

      categories = [...categories, ...newCategories];
    }

    // Update course count for all categories
    for (const category of categories) {
      const courseCount = await Course.countDocuments({ domain: category.name });
      if (category.courseCount !== courseCount) {
        category.courseCount = courseCount;
        await category.save();
      }
    }

    // Sort by name for consistency
    categories.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh mục',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Update course count
    const courseCount = await Course.countDocuments({ domain: category.name });
    category.courseCount = courseCount;
    await category.save();

    res.json({
      success: true,
      data: category
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh mục',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Danh mục đã tồn tại'
      });
    }

    const category = new Category({
      name,
      description,
      isActive: true,
      courseCount: 0
    });

    await category.save();

    res.status(201).json({
      success: true,
      data: category,
      message: 'Tạo danh mục thành công'
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo danh mục',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Check if new name conflicts with existing category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name, _id: { $ne: id } });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục đã tồn tại'
        });
      }

      // Update course domains if name changed
      await Course.updateMany(
        { domain: category.name },
        { $set: { domain: name } }
      );
    }

    // Update category fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      data: category,
      message: 'Cập nhật danh mục thành công'
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật danh mục',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Check if category has courses
    const courseCount = await Course.countDocuments({ domain: category.name });
    if (courseCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa danh mục có khóa học. Vui lòng chuyển các khóa học sang danh mục khác trước.'
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Xóa danh mục thành công'
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa danh mục',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Bulk delete categories
export const bulkDeleteCategories = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách ID danh mục'
      });
    }

    // Check if any category has courses
    const categories = await Category.find({ _id: { $in: ids } });
    for (const category of categories) {
      const courseCount = await Course.countDocuments({ domain: category.name });
      if (courseCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Không thể xóa danh mục "${category.name}" vì có ${courseCount} khóa học. Vui lòng chuyển các khóa học sang danh mục khác trước.`
        });
      }
    }

    const result = await Category.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: `Đã xóa ${result.deletedCount} danh mục thành công`
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa danh mục',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Toggle category status
export const toggleCategoryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.json({
      success: true,
      data: category,
      message: `Đã ${category.isActive ? 'kích hoạt' : 'vô hiệu hóa'} danh mục`
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái danh mục',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
