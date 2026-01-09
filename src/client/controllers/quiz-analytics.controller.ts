import { Request, Response } from 'express';
import { QuizAttempt } from '../../shared/models/core/QuizAttempt';
import Lesson from '../../shared/models/core/Lesson';
import { ILesson } from '../../shared/models/core/Lesson';

export class QuizAnalyticsController {
  // Get quiz analytics for a lesson
  static async getQuizAnalytics(req: Request, res: Response) {
    try {
      const { id: lessonId } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

      // Get lesson
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({ success: false, error: 'Lesson not found' });
      }

      // Check if lesson is a quiz type or has quiz questions
      const hasQuizQuestions = lesson.quizQuestions && lesson.quizQuestions.length > 0;
      if (lesson.type !== 'quiz' && !hasQuizQuestions) {
        return res.status(404).json({
          success: false,
          error: 'Quiz lesson not found',
          details: `Lesson type is '${lesson.type}' and it does not have quiz questions`
        });
      }

      // Get all attempts for this lesson
      const attempts = await QuizAttempt.find({ lessonId })
        .sort({ submittedAt: -1 })
        .lean();

      if (attempts.length === 0) {
        return res.json({
          success: true,
          data: {
            lessonId,
            totalAttempts: 0,
            totalStudents: 0,
            averageScore: 0,
            averageTime: 0,
            passingScore: lesson.quizSettings?.passingScore || 60,
            passingRate: 0,
            questionStats: [],
            scoreDistribution: [],
            timeDistribution: [],
            attemptsOverTime: []
          }
        });
      }

      // Calculate statistics
      const totalAttempts = attempts.length;
      const uniqueStudents = new Set(attempts.map(a => a.studentId.toString()));
      const totalStudents = uniqueStudents.size;

      const totalScore = attempts.reduce((sum, a) => sum + a.percentage, 0);
      const averageScore = totalScore / totalAttempts;

      const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
      const averageTime = totalTime / totalAttempts;

      const passingScore = lesson.quizSettings?.passingScore || 60;
      const passingCount = attempts.filter(a => a.percentage >= passingScore).length;
      const passingRate = (passingCount / totalAttempts) * 100;

      // Question statistics
      const questionStats = (lesson.quizQuestions || []).map((question: any, index: number) => {
        const correctCount = attempts.filter(a =>
          a.answers.find(ans => ans.questionIndex === index && ans.isCorrect)
        ).length;
        const incorrectCount = attempts.filter(a => {
          const answer = a.answers.find(ans => ans.questionIndex === index);
          return answer && !answer.isCorrect;
        }).length;
        const unansweredCount = attempts.filter(a => {
          const answer = a.answers.find(ans => ans.questionIndex === index);
          return !answer || answer.answer === null || answer.answer === undefined;
        }).length;

        const correctRate = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;
        const difficulty = 100 - correctRate; // Higher difficulty = lower correct rate

        // Calculate average time per question (if available in attempts)
        const questionTimes = attempts.map(a => {
          // This would need to be stored in attempts if we want per-question time
          return 0; // Placeholder
        });
        const averageTime = questionTimes.length > 0
          ? questionTimes.reduce((sum, t) => sum + t, 0) / questionTimes.length
          : 0;

        return {
          questionIndex: index,
          question: question.question,
          correctCount,
          incorrectCount,
          unansweredCount,
          correctRate,
          averageTime,
          difficulty
        };
      });

      // Score distribution
      const scoreRanges = [
        { range: '0-50', min: 0, max: 50 },
        { range: '51-70', min: 51, max: 70 },
        { range: '71-85', min: 71, max: 85 },
        { range: '86-100', min: 86, max: 100 }
      ];
      const scoreDistribution = scoreRanges.map(range => ({
        range: range.range,
        count: attempts.filter(a => a.percentage >= range.min && a.percentage <= range.max).length
      }));

      // Time distribution
      const timeRanges = [
        { range: '0-5 phút', min: 0, max: 300 },
        { range: '5-10 phút', min: 301, max: 600 },
        { range: '10-15 phút', min: 601, max: 900 },
        { range: '15+ phút', min: 901, max: Infinity }
      ];
      const timeDistribution = timeRanges.map(range => ({
        range: range.range,
        count: attempts.filter(a => a.timeSpent >= range.min && a.timeSpent <= range.max).length
      }));

      // Attempts over time (group by date)
      const attemptsByDate = attempts.reduce((acc, attempt) => {
        const date = new Date(attempt.submittedAt).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { count: 0, totalScore: 0 };
        }
        acc[date].count++;
        acc[date].totalScore += attempt.percentage;
        return acc;
      }, {} as Record<string, { count: number; totalScore: number }>);

      const attemptsOverTime = Object.entries(attemptsByDate)
        .map(([date, data]) => ({
          date,
          count: data.count,
          averageScore: data.totalScore / data.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      res.json({
        success: true,
        data: {
          lessonId,
          totalAttempts,
          totalStudents,
          averageScore,
          averageTime,
          passingScore,
          passingRate,
          questionStats,
          scoreDistribution,
          timeDistribution,
          attemptsOverTime
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to get quiz analytics' });
    }
  }
}
