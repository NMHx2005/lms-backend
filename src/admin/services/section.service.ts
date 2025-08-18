import { Section as SectionModel, Course as CourseModel, Lesson as LessonModel } from '../../shared/models';
import { ISection } from '../../shared/models/core/Section';

export class SectionService {
  // Create a new section
  static async createSection(sectionData: any): Promise<ISection> {
    const { courseId, order } = sectionData;
    
    // Check if course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // If no order specified, get the next available order
    if (!order) {
      const lastSection = await SectionModel.findOne({ courseId })
        .sort({ order: -1 })
        .limit(1);
      sectionData.order = lastSection ? lastSection.order + 1 : 1;
    } else {
      // Reorder existing sections if order conflicts
      await this.reorderSectionsForNewOrder(courseId, order);
    }

    const section = new SectionModel(sectionData);
    return await section.save();
  }

  // Get section by ID
  static async getSectionById(sectionId: string): Promise<ISection> {
    const section = await SectionModel.findById(sectionId)
      .populate('courseId', 'title domain level')
      .populate('lessons', 'title type order estimatedTime');
    
    if (!section) {
      throw new Error('Section not found');
    }
    
    return section;
  }

  // Get sections by course
  static async getSectionsByCourse(courseId: string, includeHidden: boolean = false): Promise<ISection[]> {
    const filter: any = { courseId };
    if (!includeHidden) {
      filter.isVisible = true;
    }
    
    return await SectionModel.find(filter)
      .populate('lessons', 'title type order estimatedTime isPreview')
      .sort({ order: 1 });
  }

  // Update section
  static async updateSection(sectionId: string, updateData: any): Promise<ISection> {
    const section = await SectionModel.findById(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // If order is being changed, reorder other sections
    if (updateData.order && updateData.order !== section.order) {
      await this.reorderSectionsForNewOrder(section.courseId.toString(), updateData.order, sectionId);
    }

    const updatedSection = await SectionModel.findByIdAndUpdate(
      sectionId,
      updateData,
      { new: true, runValidators: true }
    ).populate('lessons', 'title type order estimatedTime');

    if (!updatedSection) {
      throw new Error('Failed to update section');
    }

    return updatedSection;
  }

  // Delete section
  static async deleteSection(sectionId: string): Promise<{ message: string }> {
    const section = await SectionModel.findById(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Check if section has lessons
    const lessonCount = await LessonModel.countDocuments({ sectionId });
    if (lessonCount > 0) {
      throw new Error(`Cannot delete section with ${lessonCount} lessons. Please delete or move lessons first.`);
    }

    // Reorder remaining sections
    await this.reorderSectionsAfterDelete(section.courseId.toString(), section.order);

    await SectionModel.findByIdAndDelete(sectionId);
    
    return { message: 'Section deleted successfully' };
  }

  // Reorder sections
  static async reorderSections(courseId: string, sectionOrders: Array<{ sectionId: string; order: number }>): Promise<ISection[]> {
    // Validate input
    const sectionIds = sectionOrders.map(item => item.sectionId);
    const orders = sectionOrders.map(item => item.order);
    
    // Check for duplicate orders
    if (new Set(orders).size !== orders.length) {
      throw new Error('Duplicate order values are not allowed');
    }

    // Check if all sections belong to the course
    const sections = await SectionModel.find({ courseId, _id: { $in: sectionIds } });
    if (sections.length !== sectionIds.length) {
      throw new Error('Some sections do not belong to this course');
    }

    // Update orders in bulk
    const bulkOps = sectionOrders.map(({ sectionId, order }) => ({
      updateOne: {
        filter: { _id: sectionId },
        update: { order }
      }
    }));

    await SectionModel.bulkWrite(bulkOps);

    // Return updated sections
    return await SectionModel.find({ courseId })
      .populate('lessons', 'title type order estimatedTime')
      .sort({ order: 1 });
  }

  // Toggle section visibility
  static async toggleSectionVisibility(sectionId: string, isVisible: boolean): Promise<ISection> {
    return await this.updateSection(sectionId, { isVisible });
  }

  // Get section statistics
  static async getSectionStats(courseId: string) {
    const [sections, totalLessons, totalDuration] = await Promise.all([
      SectionModel.countDocuments({ courseId }),
      SectionModel.aggregate([
        { $match: { courseId: courseId } },
        { $group: { _id: null, total: { $sum: '$totalLessons' } } }
      ]),
      SectionModel.aggregate([
        { $match: { courseId: courseId } },
        { $group: { _id: null, total: { $sum: '$totalDuration' } } }
      ])
    ]);

    const visibleSections = await SectionModel.countDocuments({ courseId, isVisible: true });
    const hiddenSections = sections - visibleSections;

    return {
      courseId,
      totalSections: sections,
      visibleSections,
      hiddenSections,
      totalLessons: totalLessons[0]?.total || 0,
      totalDuration: totalDuration[0]?.total || 0,
      averageLessonsPerSection: sections > 0 ? Math.round((totalLessons[0]?.total || 0) / sections) : 0
    };
  }

  // Bulk update sections
  static async bulkUpdateSections(courseId: string, updates: Array<{ sectionId: string; updates: any }>) {
    const sectionIds = updates.map(item => item.sectionId);
    
    // Check if all sections belong to the course
    const sections = await SectionModel.find({ courseId, _id: { $in: sectionIds } });
    if (sections.length !== sectionIds.length) {
      throw new Error('Some sections do not belong to this course');
    }

    // Update sections in bulk
    const bulkOps = updates.map(({ sectionId, updates: updateData }) => ({
      updateOne: {
        filter: { _id: sectionId },
        update: updateData
      }
    }));

    await SectionModel.bulkWrite(bulkOps);

    // Return updated sections
    return await SectionModel.find({ courseId })
      .populate('lessons', 'title type order estimatedTime')
      .sort({ order: 1 });
  }

  // Helper method to reorder sections when adding new section
  private static async reorderSectionsForNewOrder(courseId: string, newOrder: number, excludeSectionId?: string): Promise<void> {
    const filter: any = { courseId, order: { $gte: newOrder } };
    if (excludeSectionId) {
      filter._id = { $ne: excludeSectionId };
    }

    await SectionModel.updateMany(filter, { $inc: { order: 1 } });
  }

  // Helper method to reorder sections after deletion
  private static async reorderSectionsAfterDelete(courseId: string, deletedOrder: number): Promise<void> {
    await SectionModel.updateMany(
      { courseId, order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );
  }
}
