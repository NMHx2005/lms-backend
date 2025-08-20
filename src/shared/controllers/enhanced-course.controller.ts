import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types/global';
import EnhancedCourseService from '../services/courses/enhanced-course.service';
import { AppError } from '../utils/appError';

export class EnhancedCourseController {
  /**
   * Get courses with enhanced filters
   * GET /api/courses/enhanced
   */
  getCoursesWithFilters = asyncHandler(async (req: Request, res: Response) => {
    const {
      category,
      subcategory,
      difficulty,
      targetAudience,
      ageGroup,
      hasSubtitles,
      hasLiveSessions,
      deliveryMethod,
      pricingModel,
      hasFreeTrial,
      hasCertification,
      minPrice,
      maxPrice,
      language,
      gdprCompliant,
      accessibilityCompliant,
      page = '1',
      limit = '20'
    } = req.query;

    const filters = {
      category: category as string,
      subcategory: subcategory as string,
      difficulty: difficulty as string,
      targetAudience: targetAudience ? (targetAudience as string).split(',') : undefined,
      ageGroup: ageGroup as string,
      hasSubtitles: hasSubtitles === 'true',
      hasLiveSessions: hasLiveSessions === 'true',
      deliveryMethod: deliveryMethod as string,
      pricingModel: pricingModel as string,
      hasFreeTrial: hasFreeTrial === 'true',
      hasCertification: hasCertification === 'true',
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      language: language as string,
      gdprCompliant: gdprCompliant === 'true',
      accessibilityCompliant: accessibilityCompliant === 'true'
    };

    const result = await EnhancedCourseService.getCoursesWithFilters(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result.courses,
      pagination: {
        page: result.page,
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: result.totalPages
      }
    });
  });

  /**
   * Search courses with advanced filters
   * GET /api/courses/search
   */
  searchCourses = asyncHandler(async (req: Request, res: Response) => {
    const {
      q,
      category,
      difficulty,
      minPrice,
      maxPrice,
      page = '1',
      limit = '20'
    } = req.query;

    if (!q) {
      throw new AppError('Search term is required', 400);
    }

    const filters = {
      category: category as string,
      difficulty: difficulty as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined
    };

    const result = await EnhancedCourseService.searchCourses(
      q as string,
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result.courses,
      pagination: {
        page: result.page,
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: result.totalPages
      },
      searchTerm: result.searchTerm
    });
  });

  /**
   * Update course analytics
   * PUT /api/courses/:id/analytics
   */
  updateCourseAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const analytics = req.body;

    const updatedCourse = await EnhancedCourseService.updateCourseAnalytics(id, analytics);

    res.json({
      success: true,
      data: updatedCourse,
      message: 'Course analytics updated successfully'
    });
  });

  /**
   * Update course SEO
   * PUT /api/courses/:id/seo
   */
  updateCourseSEO = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const seo = req.body;

    const updatedCourse = await EnhancedCourseService.updateCourseSEO(id, seo);

    res.json({
      success: true,
      data: updatedCourse,
      message: 'Course SEO updated successfully'
    });
  });

  /**
   * Update course localization
   * PUT /api/courses/:id/localization
   */
  updateCourseLocalization = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const localization = req.body;

    const updatedCourse = await EnhancedCourseService.updateCourseLocalization(id, localization);

    res.json({
      success: true,
      data: updatedCourse,
      message: 'Course localization updated successfully'
    });
  });

  /**
   * Update course compliance
   * PUT /api/courses/:id/compliance
   */
  updateCourseCompliance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const compliance = req.body;
    const userId = req.user.id;

    const updatedCourse = await EnhancedCourseService.updateCourseCompliance(id, compliance, userId);

    res.json({
      success: true,
      data: updatedCourse,
      message: 'Course compliance updated successfully'
    });
  });

  /**
   * Get course recommendations
   * POST /api/courses/recommendations
   */
  getCourseRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.id;
    const preferences = req.body;
    const { limit = '10' } = req.query;

    const recommendations = await EnhancedCourseService.getCourseRecommendations(
      userId,
      preferences,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: recommendations
    });
  });

  /**
   * Get course statistics by category
   * GET /api/courses/stats/category
   */
  getCourseStatsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const stats = await EnhancedCourseService.getCourseStatsByCategory();

    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Get accessibility statistics
   * GET /api/courses/stats/accessibility
   */
  getAccessibilityStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await EnhancedCourseService.getAccessibilityStats();

    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Get monetization statistics
   * GET /api/courses/stats/monetization
   */
  getMonetizationStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await EnhancedCourseService.getMonetizationStats();

    res.json({
      success: true,
      data: stats
    });
  });
}

export default new EnhancedCourseController();
