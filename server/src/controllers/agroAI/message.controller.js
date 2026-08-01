import { sendSuccess } from '../../utils/apiResponse.js';
import * as conversationService from '../../services/agroAI/conversation/conversation.service.js';

export async function postMessage(req, res, next) {
  try {
    const { sessionId, text } = req.body;
    const result = await conversationService.sendMessage({
      userId: req.user.id,
      sessionId,
      text,
      imageFile: req.file,
    });
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req, res, next) {
  try {
    const messages = await conversationService.getMessages({
      userId: req.user.id,
      sessionId: req.query.sessionId,
    });
    sendSuccess(res, { messages });
  } catch (err) {
    next(err);
  }
}

export async function retryMessage(req, res, next) {
  try {
    const message = await conversationService.retryMessage({
      userId: req.user.id,
      messageId: req.params.id,
    });
    sendSuccess(res, { message });
  } catch (err) {
    next(err);
  }
}
