import { sendSuccess } from '../../utils/apiResponse.js';
import * as conversationService from '../../services/agroAI/conversation/conversation.service.js';

export async function getSessions(req, res, next) {
  try {
    const sessions = await conversationService.listSessions({ userId: req.user.id });
    sendSuccess(res, { sessions });
  } catch (err) {
    next(err);
  }
}

export async function patchSession(req, res, next) {
  try {
    const session = await conversationService.updateSession({
      userId: req.user.id,
      sessionId: req.params.id,
      title: req.body.title,
      pinned: req.body.pinned,
    });
    sendSuccess(res, { session });
  } catch (err) {
    next(err);
  }
}

export async function deleteSession(req, res, next) {
  try {
    const deleted = await conversationService.deleteSession({
      userId: req.user.id,
      sessionId: req.params.id,
    });
    sendSuccess(res, deleted);
  } catch (err) {
    next(err);
  }
}
