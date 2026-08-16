import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { optionalAuth } from '../middleware/auth.js';
import { answerQuestion } from '../services/aiService.js';
import { sanitizeText } from '../middleware/sanitize.js';

const router = Router();

const askSchema = z.object({
  question: z.string().min(5, 'Please ask a more complete question.').max(800),
  language: z.enum(['en', 'es']).optional().default('en'),
});

const askLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many assistant requests. Please wait a moment.' },
});

router.post('/ask', askLimiter, optionalAuth, async (req, res, next) => {
  try {
    const parsed = askSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => i.message),
      });
    }

    const language =
      parsed.data.language || req.user?.preferred_language || 'en';
    const question = sanitizeText(parsed.data.question, { maxLength: 800 });

    if (!question || question.length < 5) {
      return res.status(400).json({
        error: 'Validation failed',
        details: ['Please ask a more complete question.'],
      });
    }

    const result = await answerQuestion({
      question,
      language,
      userId: req.user?.id || null,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
