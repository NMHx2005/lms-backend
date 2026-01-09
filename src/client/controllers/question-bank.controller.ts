import { Request, Response } from 'express';
import { QuestionBank } from '../../shared/models/core/QuestionBank';
import Lesson from '../../shared/models/core/Lesson';

export class QuestionBankController {
  // Get question bank
  static async getQuestionBank(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

      const {
        search,
        type,
        difficulty,
        tags,
        topic,
        subject,
        isPublic,
        courseId,
        page = 1,
        limit = 20
      } = req.query;

      const query: any = {
        $or: [
          { teacherId: userId },
          { isPublic: true }
        ]
      };

      if (courseId) {
        query.courseId = courseId;
      }

      if (type) {
        query.type = type;
      }

      if (difficulty) {
        query.difficulty = difficulty;
      }

      if (topic) {
        query.topic = { $regex: topic, $options: 'i' };
      }

      if (subject) {
        query.subject = { $regex: subject, $options: 'i' };
      }

      if (isPublic !== undefined) {
        query.isPublic = isPublic === 'true';
      }

      if (tags && Array.isArray(tags)) {
        query.tags = { $in: tags };
      }

      if (search) {
        query.$or = [
          ...(query.$or || []),
          { question: { $regex: search, $options: 'i' } },
          { explanation: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search as string, 'i')] } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const questions = await QuestionBank.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      const total = await QuestionBank.countDocuments(query);

      res.json({
        success: true,
        data: {
          questions,
          total,
          page: Number(page),
          limit: Number(limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to get question bank' });
    }
  }

  // Create question
  static async createQuestion(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

      const questionData = {
        ...req.body,
        teacherId: userId
      };

      const question = new QuestionBank(questionData);
      await question.save();

      res.json({
        success: true,
        data: question
      });
    } catch (error: any) {

      res.status(500).json({ success: false, error: error.message || 'Failed to create question' });
    }
  }

  // Update question
  static async updateQuestion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

      const question = await QuestionBank.findById(id);
      if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }

      // Check ownership
      if (question.teacherId.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, error: 'Permission denied' });
      }

      Object.assign(question, req.body);
      await question.save();

      res.json({
        success: true,
        data: question
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to update question' });
    }
  }

  // Delete question
  static async deleteQuestion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

      const question = await QuestionBank.findById(id);
      if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }

      // Check ownership
      if (question.teacherId.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, error: 'Permission denied' });
      }

      await QuestionBank.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to delete question' });
    }
  }

  // Add questions to lesson
  static async addQuestionsToLesson(req: Request, res: Response) {
    try {
      const { lessonId, questionIds } = req.body;
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

      // Get questions from bank
      const questions = await QuestionBank.find({
        _id: { $in: questionIds },
        $or: [
          { teacherId: userId },
          { isPublic: true }
        ]
      });

      if (questions.length === 0) {
        return res.status(404).json({ success: false, error: 'No questions found' });
      }

      // Get lesson
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({ success: false, error: 'Lesson not found' });
      }

      // Check if user is teacher/owner (basic check - can be enhanced)
      // TODO: Add proper permission check

      // Convert to lesson quiz questions format
      const quizQuestions = questions.map(q => ({
        question: q.question,
        type: q.type,
        answers: q.answers,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
        difficulty: q.difficulty
      }));

      // Update lesson
      lesson.quizQuestions = [
        ...(lesson.quizQuestions || []),
        ...quizQuestions
      ];
      await lesson.save();

      // Update usage count
      await QuestionBank.updateMany(
        { _id: { $in: questionIds } },
        { $inc: { usageCount: 1 } }
      );

      res.json({
        success: true,
        data: lesson,
        message: `Added ${questions.length} questions to lesson`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to add questions to lesson' });
    }
  }
}
