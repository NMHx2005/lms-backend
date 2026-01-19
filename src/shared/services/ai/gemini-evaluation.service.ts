import { GoogleGenAI } from '@google/genai';
import Course from '../../models/core/Course';
import Section from '../../models/core/Section';
import Lesson from '../../models/core/Lesson';
import Assignment from '../../models/core/Assignment';

export interface CourseEvaluationResult {
  overallScore: number;
  contentQuality: {
    score: number;
    feedback: string;
    issues: string[];
  };
  structureQuality: {
    score: number;
    feedback: string;
    issues: string[];
  };
  educationalValue: {
    score: number;
    feedback: string;
    issues: string[];
  };
  completeness: {
    score: number;
    feedback: string;
    issues: string[];
  };
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

export class GeminiEvaluationService {
  private static instance: GeminiEvaluationService;
  private genAI: GoogleGenAI | null = null;
  private isInitialized = false;

  static getInstance(): GeminiEvaluationService {
    if (!GeminiEvaluationService.instance) {
      GeminiEvaluationService.instance = new GeminiEvaluationService();
    }
    return GeminiEvaluationService.instance;
  }

  private initialize(): void {
    if (this.isInitialized) return;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Gemini API key not provided. AI evaluation will be disabled.');
      return;
    }

    try {
      this.genAI = new GoogleGenAI({
        apiKey: apiKey
      });
      this.isInitialized = true;
      console.log('✅ Gemini Evaluation Service initialized with API key');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error);
    }
  }

  async evaluateCourse(courseId: string, model: string = 'gemini-2.0-flash'): Promise<CourseEvaluationResult> {
    this.initialize();
    if (!this.isInitialized || !this.genAI) {
      throw new Error('Gemini service not initialized');
    }

    try {
      // Gather course data
      const courseData = await this.gatherCourseData(courseId);

      // Prepare prompt for AI evaluation
      const prompt = this.buildEvaluationPrompt(courseData);

      console.log(`🤖 Calling Gemini API (${model}) for course evaluation...`);

      // Send request to Gemini - use specified model (default: gemini-1.5-flash for higher quota)
      const response = await this.genAI.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json', // Force JSON output
          temperature: 0.3,
        }
      });

      const aiResponse = response.text;
      if (!aiResponse) {
        throw new Error('No response from Gemini');
      }

      console.log('✅ Received response from Gemini');

      // Parse AI response
      let evaluation: CourseEvaluationResult;
      try {
        evaluation = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error('❌ Failed to parse Gemini response:', aiResponse);
        throw new Error('Invalid AI response format');
      }

      // Validate and normalize scores
      evaluation = this.validateEvaluation(evaluation);

      console.log(`📊 Evaluation complete: Overall Score = ${evaluation.overallScore}/100`);

      return evaluation;

    } catch (error: any) {
      console.error('❌ Gemini evaluation failed:', error.message);
      throw new Error(`AI evaluation failed: ${error.message}`);
    }
  }

  private async gatherCourseData(courseId: string): Promise<any> {
    try {
      // Get course basic info
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Get sections and lessons
      const sections = await Section.find({ courseId }).sort({ order: 1 });
      const sectionIds = sections.map(s => s._id);
      const lessons = await Lesson.find({ sectionId: { $in: sectionIds } }).sort({ order: 1 });

      // Get assignments
      const assignments = await Assignment.find({ courseId });

      // Structure data for AI analysis
      const courseStructure = sections.map(section => {
        const sectionLessons = lessons.filter(l => l.sectionId.toString() === section._id.toString());
        return {
          title: section.title,
          description: section.description,
          order: section.order,
          lessons: sectionLessons.map(lesson => ({
            title: lesson.title,
            content: lesson.content?.substring(0, 500) + '...' || 'No content', // Increased from 200 to 500
            type: lesson.type,
            order: lesson.order,
            estimatedTime: lesson.estimatedTime
          }))
        };
      });

      return {
        title: course.title,
        description: course.description,
        shortDescription: course.shortDescription, // Added
        domain: course.domain,
        level: course.level,
        price: course.price,
        estimatedDuration: course.estimatedDuration,
        learningObjectives: course.learningObjectives,
        prerequisites: course.prerequisites,
        benefits: course.benefits, // Added
        tags: course.tags, // Added
        totalSections: sections.length,
        totalLessons: lessons.length,
        totalAssignments: assignments.length,
        structure: courseStructure,
        assignments: assignments.map(a => ({
          title: a.title,
          description: a.description,
          type: a.type,
          maxScore: a.maxScore
        }))
      };
    } catch (error) {
      console.error('❌ Error gathering course data:', error);
      throw error;
    }
  }

  private buildEvaluationPrompt(courseData: any): string {
    return `You are an expert educational content evaluator for an online learning platform. Your task is to evaluate course quality comprehensively and provide detailed feedback in JSON format.

Evaluation Criteria:
1. Content Quality (0-100): Accuracy, depth, clarity, relevance
2. Structure Quality (0-100): Logical flow, organization, progressive difficulty
3. Educational Value (0-100): Learning outcomes, practical application, engagement
4. Completeness (0-100): Comprehensive coverage, sufficient materials, examples

Return response in this exact JSON format:
{
  "overallScore": number,
  "contentQuality": {"score": number, "feedback": "string", "issues": ["string"]},
  "structureQuality": {"score": number, "feedback": "string", "issues": ["string"]},
  "educationalValue": {"score": number, "feedback": "string", "issues": ["string"]},
  "completeness": {"score": number, "feedback": "string", "issues": ["string"]},
  "recommendations": ["string"],
  "strengths": ["string"],
  "weaknesses": ["string"]
}

Please evaluate this online course:

**COURSE OVERVIEW:**
Title: ${courseData.title}
Description: ${courseData.description}
${courseData.shortDescription ? `Short Description: ${courseData.shortDescription}` : ''}
Domain: ${courseData.domain}
Level: ${courseData.level}
Price: $${courseData.price}
Estimated Duration: ${courseData.estimatedDuration} hours
Learning Objectives: ${courseData.learningObjectives?.join(', ') || 'Not specified'}
Prerequisites: ${courseData.prerequisites?.join(', ') || 'None specified'}
${courseData.benefits?.length > 0 ? `Benefits: ${courseData.benefits.join(', ')}` : ''}
${courseData.tags?.length > 0 ? `Tags: ${courseData.tags.join(', ')}` : ''}

**COURSE STRUCTURE:**
- Total Sections: ${courseData.totalSections}
- Total Lessons: ${courseData.totalLessons}
- Total Assignments: ${courseData.totalAssignments}

**DETAILED STRUCTURE:**
${courseData.structure.map((section: any, idx: number) => `
Section ${idx + 1}: ${section.title}
Description: ${section.description || 'No description'}
Lessons (${section.lessons.length}):
${section.lessons.map((lesson: any, lessonIdx: number) => `
  ${lessonIdx + 1}. ${lesson.title} (${lesson.type}, ${lesson.estimatedTime || 'N/A'} min)
     Content Preview: ${lesson.content || 'No content'}
`).join('')}
`).join('')}

**ASSIGNMENTS:**
${courseData.assignments.length > 0 ? courseData.assignments.map((assignment: any, idx: number) => `
${idx + 1}. ${assignment.title} (${assignment.type})
   Description: ${assignment.description || 'No description'}
   Max Score: ${assignment.maxScore}
`).join('') : 'No assignments'}

Please evaluate this course comprehensively and provide detailed feedback in the specified JSON format.`;
  }

  private validateEvaluation(evaluation: any): CourseEvaluationResult {
    // Ensure all scores are between 0-100
    const clampScore = (score: number) => Math.max(0, Math.min(100, score || 0));

    // Validate and normalize the evaluation
    const validatedEvaluation: CourseEvaluationResult = {
      overallScore: clampScore(evaluation.overallScore),
      contentQuality: {
        score: clampScore(evaluation.contentQuality?.score),
        feedback: evaluation.contentQuality?.feedback || 'No feedback provided',
        issues: Array.isArray(evaluation.contentQuality?.issues) ? evaluation.contentQuality.issues : []
      },
      structureQuality: {
        score: clampScore(evaluation.structureQuality?.score),
        feedback: evaluation.structureQuality?.feedback || 'No feedback provided',
        issues: Array.isArray(evaluation.structureQuality?.issues) ? evaluation.structureQuality.issues : []
      },
      educationalValue: {
        score: clampScore(evaluation.educationalValue?.score),
        feedback: evaluation.educationalValue?.feedback || 'No feedback provided',
        issues: Array.isArray(evaluation.educationalValue?.issues) ? evaluation.educationalValue.issues : []
      },
      completeness: {
        score: clampScore(evaluation.completeness?.score),
        feedback: evaluation.completeness?.feedback || 'No feedback provided',
        issues: Array.isArray(evaluation.completeness?.issues) ? evaluation.completeness.issues : []
      },
      recommendations: Array.isArray(evaluation.recommendations) ? evaluation.recommendations : [],
      strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
      weaknesses: Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : []
    };

    // Calculate overall score if not provided or invalid
    if (!validatedEvaluation.overallScore || validatedEvaluation.overallScore === 0) {
      validatedEvaluation.overallScore = Math.round(
        (validatedEvaluation.contentQuality.score +
          validatedEvaluation.structureQuality.score +
          validatedEvaluation.educationalValue.score +
          validatedEvaluation.completeness.score) / 4
      );
    }

    return validatedEvaluation;
  }

  async testConnection(model: string = 'gemini-2.0-flash'): Promise<boolean> {
    this.initialize();
    if (!this.isInitialized || !this.genAI) {
      return false;
    }

    try {
      // Simple test request with specified model
      const response = await this.genAI.models.generateContent({
        model: model, // Use gemini-1.5-flash (higher quota) for testing
        contents: 'Hello, respond with just "OK"',
        config: {
          temperature: 0.1,
        }
      });

      return response.text?.includes('OK') || false;
    } catch (error: any) {
      console.error('❌ Gemini test connection failed:', error);

      // Log quota errors specifically
      if (error.status === 429 || error.message?.includes('quota')) {
        console.error('⚠️ Gemini quota exceeded! Wait for reset or upgrade plan.');
      }

      return false;
    }
  }
}

export const geminiEvaluationService = GeminiEvaluationService.getInstance();
