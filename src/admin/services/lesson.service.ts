import { Lesson as LessonModel, Section as SectionModel, Course as CourseModel } from '../../shared/models';
import { ILesson } from '../../shared/models/core/Lesson';

export class LessonService {
  // Create a new lesson
  static async createLesson(lessonData: any): Promise<ILesson> {
    const { sectionId, courseId, order } = lessonData;
    
    // Check if section exists
    const section = await SectionModel.findById(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Check if course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // If no order specified, get the next available order in the section
    if (!order) {
      const lastLesson = await LessonModel.findOne({ sectionId })
        .sort({ order: -1 })
        .limit(1);
      lessonData.order = lastLesson ? lastLesson.order + 1 : 1;
    } else {
      // Reorder existing lessons if order conflicts
      await this.reorderLessonsForNewOrder(sectionId, order);
    }

    // Validate content based on type
    this.validateLessonContent(lessonData);

    const lesson = new LessonModel(lessonData);
    const savedLesson = await lesson.save();

    // Update section stats
    await this.updateSectionStats(sectionId);

    return savedLesson;
  }

  // Get lesson by ID
  static async getLessonById(lessonId: string): Promise<ILesson> {
    const lesson = await LessonModel.findById(lessonId)
      .populate('sectionId', 'title order')
      .populate('courseId', 'title domain level');
    
    if (!lesson) {
      throw new Error('Lesson not found');
    }
    
    return lesson;
  }

  // Get lessons by section
  static async getLessonsBySection(sectionId: string, includeHidden: boolean = false): Promise<ILesson[]> {
    const filter: any = { sectionId };
    if (!includeHidden) {
      filter.isVisible = true;
    }
    
    return await LessonModel.find(filter)
      .sort({ order: 1 });
  }

  // Get lessons by course
  static async getLessonsByCourse(courseId: string, filters: any = {}): Promise<ILesson[]> {
    const query: any = { courseId };
    
    // Apply filters
    if (filters.type) query.type = filters.type;
    if (filters.isPreview !== undefined) query.isPreview = filters.isPreview;
    if (filters.isVisible !== undefined) query.isVisible = filters.isVisible;
    
    return await LessonModel.find(query)
      .populate('sectionId', 'title order')
      .sort({ 'sectionId.order': 1, order: 1 });
  }

  // Update lesson
  static async updateLesson(lessonId: string, updateData: any): Promise<ILesson> {
    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // If order is being changed, reorder other lessons in the section
    if (updateData.order && updateData.order !== lesson.order) {
      await this.reorderLessonsForNewOrder(lesson.sectionId.toString(), updateData.order, lessonId);
    }

    // If section is being changed, handle reordering
    if (updateData.sectionId && updateData.sectionId !== lesson.sectionId.toString()) {
      await this.handleSectionChange(lessonId, lesson.sectionId.toString(), updateData.sectionId, updateData.order);
    }

    // Validate content if type is being changed
    if (updateData.type) {
      this.validateLessonContent({ ...lesson.toObject(), ...updateData });
    }

    const updatedLesson = await LessonModel.findByIdAndUpdate(
      lessonId,
      updateData,
      { new: true, runValidators: true }
    ).populate('sectionId', 'title order');

    if (!updatedLesson) {
      throw new Error('Failed to update lesson');
    }

    // Update section stats if needed
    if (updateData.sectionId || updateData.videoDuration) {
      await this.updateSectionStats(updatedLesson.sectionId.toString());
    }

    return updatedLesson;
  }

  // Delete lesson
  static async deleteLesson(lessonId: string): Promise<{ message: string }> {
    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Reorder remaining lessons in the section
    await this.reorderLessonsAfterDelete(lesson.sectionId.toString(), lesson.order);

    await LessonModel.findByIdAndDelete(lessonId);
    
    // Update section stats
    await this.updateSectionStats(lesson.sectionId.toString());
    
    return { message: 'Lesson deleted successfully' };
  }

  // Reorder lessons
  static async reorderLessons(sectionId: string, lessonOrders: Array<{ lessonId: string; order: number }>): Promise<ILesson[]> {
    // Validate input
    const lessonIds = lessonOrders.map(item => item.lessonId);
    const orders = lessonOrders.map(item => item.order);
    
    // Check for duplicate orders
    if (new Set(orders).size !== orders.length) {
      throw new Error('Duplicate order values are not allowed');
    }

    // Check if all lessons belong to the section
    const lessons = await LessonModel.find({ sectionId, _id: { $in: lessonIds } });
    if (lessons.length !== lessonIds.length) {
      throw new Error('Some lessons do not belong to this section');
    }

    // Update orders in bulk
    const bulkOps = lessonOrders.map(({ lessonId, order }) => ({
      updateOne: {
        filter: { _id: lessonId },
        update: { order }
      }
    }));

    await LessonModel.bulkWrite(bulkOps);

    // Return updated lessons
    return await LessonModel.find({ sectionId }).sort({ order: 1 });
  }

  // Toggle lesson preview
  static async toggleLessonPreview(lessonId: string, isPreview: boolean): Promise<ILesson> {
    return await this.updateLesson(lessonId, { isPreview });
  }

  // Toggle lesson required status
  static async toggleLessonRequired(lessonId: string, isRequired: boolean): Promise<ILesson> {
    return await this.updateLesson(lessonId, { isRequired });
  }

  // Add attachment to lesson
  static async addAttachment(lessonId: string, attachmentData: any): Promise<ILesson> {
    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Validate attachment data
    if (!attachmentData.name || !attachmentData.url || !attachmentData.size || !attachmentData.type) {
      throw new Error('Attachment must have name, url, size, and type');
    }

    lesson.attachments = lesson.attachments || [];
    lesson.attachments.push(attachmentData);

    const updatedLesson = await lesson.save();
    return updatedLesson.populate('sectionId', 'title order');
  }

  // Remove attachment from lesson
  static async removeAttachment(lessonId: string, attachmentIndex: number): Promise<ILesson> {
    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    if (!lesson.attachments || attachmentIndex < 0 || attachmentIndex >= lesson.attachments.length) {
      throw new Error('Invalid attachment index');
    }

    lesson.attachments.splice(attachmentIndex, 1);
    const updatedLesson = await lesson.save();
    return updatedLesson.populate('sectionId', 'title order');
  }

  // Get lesson statistics
  static async getLessonStats(courseId: string) {
    const [lessons, totalDuration, typeStats, previewStats] = await Promise.all([
      LessonModel.countDocuments({ courseId }),
      LessonModel.aggregate([
        { $match: { courseId: courseId } },
        { $group: { _id: null, total: { $sum: '$videoDuration' } } }
      ]),
      LessonModel.aggregate([
        { $match: { courseId: courseId } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      LessonModel.aggregate([
        { $match: { courseId: courseId } },
        { $group: { _id: '$isPreview', count: { $sum: 1 } } }
      ])
    ]);

    const totalVideoDuration = totalDuration[0]?.total || 0;
    const typeDistribution = typeStats.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    const previewCount = previewStats.find((stat: any) => stat._id === true)?.count || 0;

    return {
      courseId,
      totalLessons: lessons,
      totalVideoDuration,
      typeDistribution,
      previewCount,
      averageDuration: lessons > 0 ? Math.round(totalVideoDuration / lessons) : 0
    };
  }

  // Bulk update lessons
  static async bulkUpdateLessons(sectionId: string, updates: Array<{ lessonId: string; updates: any }>) {
    const lessonIds = updates.map(item => item.lessonId);
    
    // Check if all lessons belong to the section
    const lessons = await LessonModel.find({ sectionId, _id: { $in: lessonIds } });
    if (lessons.length !== lessonIds.length) {
      throw new Error('Some lessons do not belong to this section');
    }

    // Update lessons in bulk
    const bulkOps = updates.map(({ lessonId, updates: updateData }) => ({
      updateOne: {
        filter: { _id: lessonId },
        update: updateData
      }
    }));

    await LessonModel.bulkWrite(bulkOps);

    // Return updated lessons
    return await LessonModel.find({ sectionId }).sort({ order: 1 });
  }

  // Move lesson to different section
  static async moveLesson(lessonId: string, newSectionId: string, newOrder?: number): Promise<ILesson> {
    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const oldSectionId = lesson.sectionId.toString();
    
    // Check if new section exists
    const newSection = await SectionModel.findById(newSectionId);
    if (!newSection) {
      throw new Error('New section not found');
    }

    // If no new order specified, get the next available order in the new section
    if (!newOrder) {
      const lastLesson = await LessonModel.findOne({ sectionId: newSectionId })
        .sort({ order: -1 })
        .limit(1);
      newOrder = lastLesson ? lastLesson.order + 1 : 1;
    } else {
      // Reorder existing lessons in the new section
      await this.reorderLessonsForNewOrder(newSectionId, newOrder);
    }

    // Reorder lessons in the old section
    await this.reorderLessonsAfterDelete(oldSectionId, lesson.order);

    // Update lesson
    lesson.sectionId = newSectionId as any;
    lesson.courseId = newSection.courseId as any;
    lesson.order = newOrder;

    const updatedLesson = await lesson.save();
    
    // Update stats for both sections
    await Promise.all([
      this.updateSectionStats(oldSectionId),
      this.updateSectionStats(newSectionId)
    ]);

    return updatedLesson.populate('sectionId', 'title order');
  }

  // Helper method to validate lesson content based on type
  private static validateLessonContent(lessonData: any): void {
    const { type, videoUrl, fileUrl, externalLink } = lessonData;
    
    if (type === 'video' && !videoUrl) {
      throw new Error('Video URL is required for video lessons');
    }
    if (type === 'file' && !fileUrl) {
      throw new Error('File URL is required for file lessons');
    }
    if (type === 'link' && !externalLink) {
      throw new Error('External link is required for link lessons');
    }
  }

  // Helper method to reorder lessons when adding new lesson
  private static async reorderLessonsForNewOrder(sectionId: string, newOrder: number, excludeLessonId?: string): Promise<void> {
    const filter: any = { sectionId, order: { $gte: newOrder } };
    if (excludeLessonId) {
      filter._id = { $ne: excludeLessonId };
    }

    await LessonModel.updateMany(filter, { $inc: { order: 1 } });
  }

  // Helper method to reorder lessons after deletion
  private static async reorderLessonsAfterDelete(sectionId: string, deletedOrder: number): Promise<void> {
    await LessonModel.updateMany(
      { sectionId, order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );
  }

  // Helper method to handle section change
  private static async handleSectionChange(lessonId: string, oldSectionId: string, newSectionId: string, newOrder?: number): Promise<void> {
    // Reorder lessons in old section
    const lesson = await LessonModel.findById(lessonId);
    if (lesson) {
      await this.reorderLessonsAfterDelete(oldSectionId, lesson.order);
    }

    // Reorder lessons in new section if order specified
    if (newOrder) {
      await this.reorderLessonsForNewOrder(newSectionId, newOrder);
    }
  }

  // Helper method to update section stats
  private static async updateSectionStats(sectionId: string): Promise<void> {
    try {
      const section = await SectionModel.findById(sectionId);
      if (section) {
        await (section as any).updateLessonCount();
        await (section as any).updateDuration();
      }
    } catch (error) {

    }
  }
}
