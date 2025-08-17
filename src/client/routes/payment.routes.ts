import express from 'express';
import { Bill, Course, User } from '../../shared/models';

const router = express.Router();

// Get user payment history
router.get('/history', async (req: any, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter: any = { studentId: req.user.id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    
    const bills = await Bill.find(filter)
      .populate('courseId', 'title thumbnail')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Bill.countDocuments(filter);

    res.json({
      success: true,
      data: bills,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get bill by ID
router.get('/bills/:id', async (req: any, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      studentId: req.user.id
    }).populate('courseId', 'title thumbnail');

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }

    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create payment for course
router.post('/course/:courseId', async (req: any, res) => {
  try {
    const { courseId } = req.params;
    const { paymentMethod, amount } = req.body;
    
    // Check if course exists
    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
      isApproved: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check if already enrolled
    // This would typically check enrollment collection
    
    // Create bill
    const bill = new Bill({
      studentId: req.user.id,
      courseId: courseId,
      amount: amount || course.price,
      currency: 'VND',
      purpose: 'course_purchase',
      status: 'pending',
      paymentMethod: paymentMethod || 'stripe',
      description: `Payment for course: ${course.title}`
    });

    await bill.save();

    // This would typically integrate with payment gateway
    // For now, just return success
    
    res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        billId: bill._id,
        amount: bill.amount,
        status: bill.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Process payment callback
router.post('/callback', async (req: any, res) => {
  try {
    const { billId, status, transactionId } = req.body;
    
    if (!billId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Bill ID and status are required'
      });
    }

    // Update bill status
    const bill = await Bill.findByIdAndUpdate(
      billId,
      {
        status: status === 'success' ? 'completed' : 'failed',
        transactionId,
        paidAt: status === 'success' ? new Date() : undefined
      },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found'
      });
    }

    // If payment successful, enroll user in course
    if (status === 'success' && bill.courseId) {
      // This would typically create enrollment
      // For now, just return success
    }

    res.json({
      success: true,
      message: 'Payment callback processed successfully',
      data: bill
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Request refund
router.post('/refund', async (req: any, res) => {
  try {
    const { billId, reason, description } = req.body;
    
    if (!billId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Bill ID and reason are required'
      });
    }

    // Check if bill exists and belongs to user
    const bill = await Bill.findOne({
      _id: billId,
      studentId: req.user.id,
      status: 'completed'
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found or not eligible for refund'
      });
    }

    // This would typically create a refund request
    // For now, just return success
    
    res.json({
      success: true,
      message: 'Refund request submitted successfully',
      data: {
        billId: bill._id,
        amount: bill.amount,
        reason
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get payment methods
router.get('/methods', async (req: any, res) => {
  try {
    // This would typically query user's saved payment methods
    const mockMethods = [
      {
        id: '1',
        type: 'card',
        last4: '4242',
        brand: 'Visa',
        expMonth: 12,
        expYear: 2025,
        isDefault: true
      }
    ];

    res.json({
      success: true,
      data: mockMethods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get payment statistics
router.get('/stats', async (req: any, res) => {
  try {
    const [
      totalSpent,
      totalBills,
      completedPayments,
      pendingPayments
    ] = await Promise.all([
      Bill.aggregate([
        { $match: { studentId: req.user.id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Bill.countDocuments({ studentId: req.user.id }),
      Bill.countDocuments({ studentId: req.user.id, status: 'completed' }),
      Bill.countDocuments({ studentId: req.user.id, status: 'pending' })
    ]);

    const spent = totalSpent[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalSpent: spent,
        totalBills,
        completedPayments,
        pendingPayments,
        averageSpent: totalBills > 0 ? spent / totalBills : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
