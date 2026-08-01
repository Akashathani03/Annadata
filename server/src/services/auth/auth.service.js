import jwt from 'jsonwebtoken';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { findOrCreateByPhone } from '../../repositories/user.repository.js';

// Matches the frontend's existing DEMO_OTP exactly (see authService.js
// on the frontend) - not a new value invented here. Real SMS/OTP
// verification is out of scope for this step; only JWT issuance needs
// to be real, per this step's explicit purpose.
const MOCK_OTP = '4821';

export async function sendOtp(phone) {
  if (!phone?.trim()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'A phone number is required.');
  }
  // Real implementation later: call an SMS provider here. Mirrors the
  // frontend's own current sendOtp, which also does nothing but
  // acknowledge - this isn't a regression, it's matching what already
  // exists.
  return { sent: true, phone };
}

export async function verifyOtp(phone, otp) {
  if (!phone?.trim() || !otp) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Phone and otp are required.');
  }
  if (otp !== MOCK_OTP) {
    throw new ApiError(401, 'INVALID_OTP', 'Incorrect OTP.');
  }

  const { user, isNewUser } = await findOrCreateByPhone(phone.trim());

  // The one thing this whole step exists to deliver: a real token,
  // signed server-side, with a real MongoDB ObjectId as the subject -
  // exactly what Step 2's auth middleware and Step 4's ObjectId
  // validation have expected and correctly enforced since they were
  // built, but which nothing has ever actually produced until now.
  const token = jwt.sign({ sub: user._id.toString() }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return { token, user, isNewUser };
}
