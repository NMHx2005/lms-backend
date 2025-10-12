import Joi from 'joi';

export const clientChatValidation = {
    sendMessage: {
        body: Joi.object({
            message: Joi.string()
                .required()
                .min(1)
                .max(1000)
                .messages({
                    'string.empty': 'Message cannot be empty',
                    'string.min': 'Message must be at least 1 character',
                    'string.max': 'Message cannot exceed 1000 characters',
                    'any.required': 'Message is required'
                }),
            context: Joi.object({
                currentPage: Joi.string().optional(),
                courseId: Joi.string().optional(),
                userPreferences: Joi.object().optional()
            }).optional()
        })
    },

    getChatHistory: {
        query: Joi.object({
            limit: Joi.number()
                .integer()
                .min(1)
                .max(100)
                .default(20)
                .messages({
                    'number.base': 'Limit must be a number',
                    'number.integer': 'Limit must be an integer',
                    'number.min': 'Limit must be at least 1',
                    'number.max': 'Limit cannot exceed 100'
                })
        })
    },

    testConnection: {
        // No validation needed for test connection
    }
};
