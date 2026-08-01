import pino from 'pino';
import { env } from './env.js';

// Structured JSON logs, not free-text console output - this is what
// makes centralized log aggregation possible later (per the Security
// & Deployment session), and it's the same logger every future module
// uses, not something Agro AI or any one route reinvents.
//
// Pretty-printed only in development for human readability; staging/
// production emit raw JSON, which is what a real aggregator expects.
export const logger = pino({
  level: env.isProduction ? 'info' : 'debug',
  transport: env.nodeEnv === 'development'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
    : undefined,
});
