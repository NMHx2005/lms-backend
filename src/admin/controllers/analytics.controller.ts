import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  // Get dashboard analytics
  static async getDashboardAnalytics(req: Request, res: Response) {
    try {
      const analytics = await AnalyticsService.getDashboardAnalytics();
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get user analytics
  static async getUserAnalytics(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const analytics = await AnalyticsService.getUserAnalytics(period as string);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get course analytics
  static async getCourseAnalytics(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const analytics = await AnalyticsService.getCourseAnalytics(period as string);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get revenue analytics
  static async getRevenueAnalytics(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const analytics = await AnalyticsService.getRevenueAnalytics(period as string);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get enrollment analytics
  static async getEnrollmentAnalytics(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const analytics = await AnalyticsService.getEnrollmentAnalytics(period as string);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
