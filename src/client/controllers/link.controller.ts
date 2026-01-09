import { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AuthenticatedRequest } from '../../shared/types/global';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ErrorFactory } from '../../shared/utils/errors';
import { LinkClick } from '../../shared/models/analytics';

/**
 * Fetch link metadata (Open Graph, Twitter Cards, etc.)
 */
const getLinkPreviewHandler: RequestHandler = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    throw ErrorFactory.validation('URL is required');
  }

  // Validate URL format
  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch (error) {
    throw ErrorFactory.validation('Invalid URL format');
  }

  try {
    // Fetch HTML content
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      maxRedirects: 5,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract metadata
    const metadata = {
      url: url,
      domain: urlObj.hostname,
      title: $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').text() ||
        '',
      description: $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        '',
      image: $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        '',
      siteName: $('meta[property="og:site_name"]').attr('content') || '',
      type: $('meta[property="og:type"]').attr('content') || 'website',
      favicon: $('link[rel="icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href') ||
        `${urlObj.origin}/favicon.ico`,
      isValid: true,
      isAccessible: response.status === 200,
      statusCode: response.status,
    };

    // Convert relative URLs to absolute
    if (metadata.image && !metadata.image.startsWith('http')) {
      metadata.image = new URL(metadata.image, url).href;
    }
    if (metadata.favicon && !metadata.favicon.startsWith('http')) {
      metadata.favicon = new URL(metadata.favicon, url).href;
    }

    res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    // If fetch fails, return basic metadata
    const metadata = {
      url: url,
      domain: urlObj.hostname,
      isValid: true,
      isAccessible: false,
      statusCode: error.response?.status || 0,
      error: error.message || 'Failed to fetch link',
    };

    res.status(200).json({
      success: true,
      data: metadata,
    });
  }
});

/**
 * Validate URL accessibility
 */
const validateLinkHandler: RequestHandler = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    throw ErrorFactory.validation('URL is required');
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    throw ErrorFactory.validation('Invalid URL format');
  }

  try {
    // Check if URL is accessible (HEAD request for faster check)
    const response = await axios.head(url, {
      timeout: 5000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Accept all status codes < 500
    });

    res.status(200).json({
      success: true,
      accessible: response.status < 400,
      statusCode: response.status,
    });
  } catch (error: any) {
    res.status(200).json({
      success: true,
      accessible: false,
      statusCode: error.response?.status || 0,
    });
  }
});

/**
 * Track link click
 */
const trackLinkClickHandler: RequestHandler = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { lessonId, url } = req.body;
  const userId = req.user?.id;

  if (!lessonId || !url) {
    throw ErrorFactory.validation('Lesson ID and URL are required');
  }

  if (!userId) {
    throw ErrorFactory.authentication('User not authenticated');
  }

  try {
    // Save click tracking
    const linkClick = new LinkClick({
      lessonId,
      userId,
      url,
      clickedAt: new Date(),
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer,
      ipAddress: req.ip || req.socket.remoteAddress,
    });

    await linkClick.save();

    res.status(200).json({
      success: true,
      message: 'Link click tracked successfully',
    });
  } catch (error: any) {
    // Don't throw error - tracking failure shouldn't break the app
    res.status(200).json({
      success: true,
      message: 'Link click tracking attempted',
    });
  }
});

/**
 * Get link analytics for a lesson
 */
const getLinkAnalyticsHandler: RequestHandler = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user?.id;

  if (!lessonId) {
    throw ErrorFactory.validation('Lesson ID is required');
  }

  // Only allow course instructor or admin to view analytics
  // TODO: Add permission check

  try {
    const clicks = await LinkClick.find({ lessonId }).sort({ clickedAt: -1 });

    const analytics = {
      totalClicks: clicks.length,
      uniqueUsers: new Set(clicks.map((c: any) => c.userId.toString())).size,
      clicksByUser: clicks.reduce((acc: Record<string, number>, click: any) => {
        const userId = click.userId.toString();
        acc[userId] = (acc[userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      clicksByDate: clicks.reduce((acc: Record<string, number>, click: any) => {
        const date = click.clickedAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentClicks: clicks.slice(0, 50).map((click: any) => ({
        userId: click.userId,
        clickedAt: click.clickedAt,
        url: click.url,
      })),
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    throw ErrorFactory.database('Failed to fetch link analytics');
  }
});

export class LinkController {
  static getLinkPreview = getLinkPreviewHandler;
  static validateLink = validateLinkHandler;
  static trackLinkClick = trackLinkClickHandler;
  static getLinkAnalytics = getLinkAnalyticsHandler;
}
