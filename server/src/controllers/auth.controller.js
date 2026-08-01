import { sendSuccess } from '../utils/apiResponse.js';
import * as authService from '../services/auth/auth.service.js';

export async function postSendOtp(req, res, next) {
  try {
    const result = await authService.sendOtp(req.body.phone);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function postVerifyOtp(req, res, next) {
  try {
    const result = await authService.verifyOtp(req.body.phone, req.body.otp);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
