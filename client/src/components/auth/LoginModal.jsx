import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as authService from '../../services/authService';
import * as usersService from '../../services/usersService';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import LocationCapture from '../common/LocationCapture';
import './LoginModal.css';

const OTP_LENGTH = 4;

export default function LoginModal() {
  const { t } = useTranslation(['auth', 'common']);
  const { loginModalOpen, closeLoginModal, refreshUser } = useAuth();

  const [step, setStep] = useState('details'); // details | otp | location
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [sending, setSending] = useState(false);
  const [newUserId, setNewUserId] = useState(null);
  const [locationValue, setLocationValue] = useState({ village: '', taluk: '', district: '', state: '', lat: null, lng: null });

  useEffect(() => {
    if (step === 'otp') {
      document.getElementById('login-otp-0')?.focus();
    }
  }, [step]);

  async function resetAndClose() {
    // Whenever OTP has already succeeded, a real session exists even if
    // the farmer closes out before finishing onboarding (e.g. tapping X
    // on the Location step). Always resync so the app never shows a
    // stale "logged out" state for someone who's actually logged in.
    await refreshUser();
    setStep('details');
    setName('');
    setPhone('');
    setPhoneError('');
    setOtp(['', '', '', '']);
    setOtpError('');
    setNewUserId(null);
    setLocationValue({ village: '', taluk: '', district: '', state: '', lat: null, lng: null });
    closeLoginModal();
  }

  async function handleSendOtp() {
    if (!/^\d{10}$/.test(phone)) {
      setPhoneError(t('auth:invalidPhone'));
      return;
    }
    setPhoneError('');
    setSending(true);
    const result = await authService.sendOtp(phone);
    setSending(false);

    if (!result.success) {
      setPhoneError(t('auth:sendOtpFailed'));
      return;
    }
    setStep('otp');
  }

  async function handleResend() {
    setSending(true);
    const result = await authService.sendOtp(phone);
    setSending(false);
    if (!result.success) {
      setOtpError(t('auth:sendOtpFailed'));
    }
  }

  function handleOtpDigit(index, digit) {
    const clean = digit.replace(/\D/g, '').slice(0, 1);
    const next = [...otp];
    next[index] = clean;
    setOtp(next);
    setOtpError('');
    if (clean && index < OTP_LENGTH - 1) {
      document.getElementById(`login-otp-${index + 1}`)?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setOtpError(t('auth:invalidOtp'));
      return;
    }
    const result = await authService.verifyOtp(phone, code);
    if (!result.success) {
      setOtpError(t('auth:invalidOtp'));
      return;
    }

    if (result.isNewUser) {
      if (name.trim()) {
        await usersService.updateUserProfile(result.user.id, { name: name.trim() });
      }
      setNewUserId(result.user.id);
      setStep('location');
    } else {
      resetAndClose();
    }
  }

  async function handleLocationContinue() {
    await usersService.saveOnboardingLocation(newUserId, locationValue);
    resetAndClose();
  }

  async function handleLocationSkip() {
    await usersService.skipOnboardingLocation(newUserId);
    resetAndClose();
  }

  return (
    <Modal open={loginModalOpen} onClose={resetAndClose}>
      {step === 'details' && (
        <div>
          <h3>{t('auth:title')}</h3>
          <p className="msub">{t('auth:subtitle')}</p>
          <div className="modal-field">
            <label>{t('auth:nameLabel')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth:namePlaceholder')} />
          </div>
          <div className="modal-field">
            <label>{t('auth:mobileLabel')}</label>
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setPhoneError(''); }}
              placeholder="98765 43210"
            />
            {phoneError && <span className="modal-field-error">{phoneError}</span>}
          </div>
          <button className="btn-primary login-full-btn" onClick={handleSendOtp} disabled={sending}>
            {t('auth:sendOtp')}
          </button>
          <p className="modal-note">{t('auth:otpNote')}</p>
        </div>
      )}

      {step === 'otp' && (
        <div>
          <h3>{t('auth:otpTitle')}</h3>
          <p className="msub">{t('auth:otpSentTo')} <b>+91 {phone}</b></p>
          <div className="otp-boxes">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`login-otp-${i}`}
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpDigit(i, e.target.value)}
              />
            ))}
          </div>
          {otpError && <span className="modal-field-error" style={{ display: 'block', marginTop: -8, marginBottom: 12 }}>{otpError}</span>}
          <button className="btn-primary login-full-btn" onClick={handleVerify}>
            {t('auth:verify')}
          </button>
          <p className="modal-note">
            <a href="#" onClick={(e) => { e.preventDefault(); handleResend(); }} className="login-resend-link">
              {sending ? t('auth:resending') : t('auth:resend')}
            </a>
          </p>
        </div>
      )}

      {step === 'location' && (
        <div>
          <h3>{t('auth:locationTitle')}</h3>
          <p className="msub">{t('auth:locationSubtitle')}</p>
          <LocationCapture value={locationValue} onChange={setLocationValue} />
          <button className="btn-primary login-full-btn" onClick={handleLocationContinue}>
            {t('auth:locationContinue')}
          </button>
          <button className="login-skip-btn" onClick={handleLocationSkip}>
            {t('auth:locationSkip')}
          </button>
        </div>
      )}
    </Modal>
  );
}
