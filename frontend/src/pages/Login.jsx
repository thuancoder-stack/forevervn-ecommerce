import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';

const SIGN_UP = 'Sign Up';
const LOGIN = 'Login';

const copy = {
    vi: {
        accountEyebrow: 'Tài khoản Forever',
        heroTitle: 'Mua sắm gọn gàng hơn.',
        heroDescription:
            'Đăng nhập hoặc tạo tài khoản để theo dõi đơn hàng, lưu phiên mua sắm và thanh toán nhanh hơn trên mọi thiết bị.',
        heroPoint1: 'Đồng bộ đơn hàng theo thời gian thực',
        heroPoint2: 'Thanh toán nhanh hơn',
        heroPoint3: 'Trải nghiệm mua sắm tối ưu trên mọi màn hình',
        signUpTitle: 'Đăng ký',
        loginTitle: 'Đăng nhập',
        signUpDescription: 'Tạo tài khoản mới để mua sắm nhanh hơn.',
        loginDescription: 'Đăng nhập để tiếp tục giỏ hàng và các đơn mua của bạn.',
        name: 'Họ và tên',
        email: 'Email',
        password: 'Mật khẩu',
        forgotPassword: 'Quên mật khẩu?',
        haveAccount: 'Đã có tài khoản?',
        noAccount: 'Chưa có tài khoản?',
        createAccount: 'Đăng ký',
        loginHere: 'Đăng nhập',
        processing: 'Đang xử lý...',
        signInButton: 'Đăng nhập',
        signUpButton: 'Đăng ký',
        registerSuccess: 'Tạo tài khoản thành công',
        loginSuccess: 'Đăng nhập thành công',
        authFailed: 'Đăng nhập thất bại',
        serverError: 'Không thể kết nối server',
        passwordRecovery: 'Khôi phục mật khẩu',
        sendResetOtp: 'Gửi mã OTP đặt lại',
        verifyOtpReset: 'Xác thực OTP và đặt lại mật khẩu',
        close: 'Đóng',
        recoveryDescRequest:
            'Nhập email đã dùng để tạo tài khoản, hệ thống sẽ gửi mã OTP về email đó.',
        recoveryDescReset:
            'Nhập OTP nhận được trong email rồi đặt mật khẩu mới.',
        sendOtp: 'Gửi OTP',
        sendingOtp: 'Đang gửi OTP...',
        otpSent: 'Đã gửi OTP về email của bạn',
        sendOtpFailed: 'Không thể gửi OTP',
        enterEmail: 'Vui lòng nhập email',
        completeResetFields: 'Vui lòng nhập đầy đủ thông tin đặt lại mật khẩu',
        passwordMismatch: 'Mật khẩu xác nhận không khớp',
        resetSuccess: 'Đặt lại mật khẩu thành công',
        resetFailed: 'Không thể đặt lại mật khẩu',
        otpPlaceholder: 'OTP 6 số',
        newPassword: 'Mật khẩu mới',
        confirmPassword: 'Xác nhận mật khẩu mới',
        updating: 'Đang cập nhật...',
        resetPassword: 'Đặt lại mật khẩu',
        resendOtp: 'Gửi lại OTP',
    },
    en: {
        accountEyebrow: 'Forever Account',
        heroTitle: 'A cleaner way to shop.',
        heroDescription:
            'Sign in or create an account to track orders, save shopping sessions and continue checkout smoothly on every device.',
        heroPoint1: 'Real-time order sync',
        heroPoint2: 'Faster checkout flow',
        heroPoint3: 'Responsive shopping experience',
        signUpTitle: 'Register',
        loginTitle: 'Login',
        signUpDescription: 'Create a new account to start shopping faster.',
        loginDescription: 'Login to continue your cart and your orders.',
        name: 'Name',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot your password?',
        haveAccount: 'Already have an account?',
        noAccount: "Don't have an account?",
        createAccount: 'Register',
        loginHere: 'Login',
        processing: 'Processing...',
        signInButton: 'Login',
        signUpButton: 'Register',
        registerSuccess: 'Account created successfully',
        loginSuccess: 'Logged in successfully',
        authFailed: 'Authentication failed',
        serverError: 'Unable to connect to server',
        passwordRecovery: 'Password Recovery',
        sendResetOtp: 'Send reset OTP',
        verifyOtpReset: 'Verify OTP and reset',
        close: 'Close',
        recoveryDescRequest:
            'Enter the email linked to your account and we will send a one-time password.',
        recoveryDescReset:
            'Enter the OTP from your email, then choose a new password.',
        sendOtp: 'Send OTP',
        sendingOtp: 'Sending OTP...',
        otpSent: 'OTP has been sent to your email',
        sendOtpFailed: 'Unable to send OTP',
        enterEmail: 'Please enter your email',
        completeResetFields: 'Please complete all password reset fields',
        passwordMismatch: 'Passwords do not match',
        resetSuccess: 'Password has been reset successfully',
        resetFailed: 'Unable to reset password',
        otpPlaceholder: '6-digit OTP',
        newPassword: 'New password',
        confirmPassword: 'Confirm new password',
        updating: 'Updating...',
        resetPassword: 'Reset password',
        resendOtp: 'Resend OTP',
    },
};

const Login = () => {
    const [currentState, setCurrentState] = useState(SIGN_UP);
    const { token, setToken, navigate, backendUrl } = useContext(ShopContext);
    const { language } = useLanguage();
    const t = copy[language];

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState('request');
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        if (!token && savedToken) {
            setToken(savedToken);
        }
    }, [token, setToken]);

    useEffect(() => {
        if (token) {
            navigate('/');
        }
    }, [token, navigate]);

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
    };

    const resetForgotPasswordState = (nextEmail = '') => {
        setForgotStep('request');
        setResetEmail(nextEmail);
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const closeForgotPassword = () => {
        setForgotOpen(false);
        resetForgotPasswordState(email.trim());
    };

    const openForgotPassword = () => {
        setCurrentState(LOGIN);
        resetForgotPasswordState(email.trim());
        setForgotOpen(true);
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        if (loading) return;

        setLoading(true);
        try {
            const endpoint = currentState === SIGN_UP ? '/api/user/register' : '/api/user/login';

            const payload =
                currentState === SIGN_UP
                    ? { name: name.trim(), email: email.trim(), password }
                    : { email: email.trim(), password };

            const response = await axios.post(`${backendUrl}${endpoint}`, payload);
            const data = response?.data;

            if (data?.success && data?.token) {
                localStorage.setItem('token', data.token);
                setToken(data.token);

                toast.success(currentState === SIGN_UP ? t.registerSuccess : t.loginSuccess);
                navigate('/');
                return;
            }

            toast.error(data?.message || t.authFailed);
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || t.serverError;
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const sendResetOtpHandler = async (event) => {
        event.preventDefault();
        if (resetLoading) return;

        const normalizedEmail = resetEmail.trim().toLowerCase();
        if (!normalizedEmail) {
            toast.error(t.enterEmail);
            return;
        }

        setResetLoading(true);
        try {
            const response = await axios.post(`${backendUrl}/api/user/forgot-password`, {
                email: normalizedEmail,
            });
            const data = response?.data;

            if (data?.success) {
                toast.success(data.message || t.otpSent);
                setForgotStep('reset');
                setEmail(normalizedEmail);
                return;
            }

            toast.error(data?.message || t.sendOtpFailed);
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || t.serverError;
            toast.error(message);
        } finally {
            setResetLoading(false);
        }
    };

    const resetPasswordHandler = async (event) => {
        event.preventDefault();
        if (resetLoading) return;

        const normalizedEmail = resetEmail.trim().toLowerCase();

        if (!normalizedEmail || !resetOtp.trim() || !newPassword || !confirmPassword) {
            toast.error(t.completeResetFields);
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error(t.passwordMismatch);
            return;
        }

        setResetLoading(true);
        try {
            const response = await axios.post(`${backendUrl}/api/user/reset-password`, {
                email: normalizedEmail,
                otp: resetOtp.trim(),
                newPassword,
            });
            const data = response?.data;

            if (data?.success) {
                toast.success(data.message || t.resetSuccess);
                setCurrentState(LOGIN);
                setEmail(normalizedEmail);
                setPassword('');
                closeForgotPassword();
                return;
            }

            toast.error(data?.message || t.resetFailed);
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || t.serverError;
            toast.error(message);
        } finally {
            setResetLoading(false);
        }
    };

    const switchToSignUp = () => {
        closeForgotPassword();
        setCurrentState(SIGN_UP);
        resetForm();
    };

    const switchToLogin = () => {
        setCurrentState(LOGIN);
        resetForm();
    };

    return (
        <>
            <div className="py-4 sm:py-6">
                <section className="section-shell overflow-hidden">
                    <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                        <div className="bg-[linear-gradient(180deg,#fdfbf6_0%,#edf4fb_100%)] px-6 py-8 sm:px-8 sm:py-10">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                                {t.accountEyebrow}
                            </p>
                            <h1 className="display-font mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-5xl">
                                {t.heroTitle}
                            </h1>
                            <p className="mt-4 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
                                {t.heroDescription}
                            </p>

                            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                                <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4 text-sm text-slate-500">
                                    {t.heroPoint1}
                                </div>
                                <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4 text-sm text-slate-500">
                                    {t.heroPoint2}
                                </div>
                                <div className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4 text-sm text-slate-500">
                                    {t.heroPoint3}
                                </div>
                            </div>
                        </div>

                        <form
                            onSubmit={onSubmitHandler}
                            className="flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10"
                        >
                            <div className="max-w-md">
                                <div className="inline-flex items-center gap-3">
                                    <p className="display-font text-3xl font-semibold tracking-[-0.04em] text-slate-900">
                                        {currentState === SIGN_UP ? t.signUpTitle : t.loginTitle}
                                    </p>
                                    <span className="h-px w-10 bg-slate-300" />
                                </div>

                                <p className="mt-3 text-sm leading-7 text-slate-500">
                                    {currentState === SIGN_UP ? t.signUpDescription : t.loginDescription}
                                </p>

                                <div className="mt-8 space-y-4">
                                    {currentState === SIGN_UP && (
                                        <input
                                            onChange={(event) => setName(event.target.value)}
                                            value={name}
                                            type="text"
                                            className="w-full rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                                            placeholder={t.name}
                                            required
                                        />
                                    )}

                                    <input
                                        onChange={(event) => setEmail(event.target.value)}
                                        value={email}
                                        type="email"
                                        className="w-full rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                                        placeholder={t.email}
                                        required
                                    />

                                    <input
                                        onChange={(event) => setPassword(event.target.value)}
                                        value={password}
                                        type="password"
                                        className="w-full rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                                        placeholder={t.password}
                                        required
                                    />
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-500">
                                    {currentState === LOGIN ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={openForgotPassword}
                                                className="cursor-pointer hover:text-slate-900"
                                            >
                                                {t.forgotPassword}
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <span>{t.noAccount}</span>
                                                <button
                                                    type="button"
                                                    onClick={switchToSignUp}
                                                    className="cursor-pointer font-semibold text-slate-900"
                                                >
                                                    {t.createAccount}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="ml-auto flex items-center gap-2">
                                            <span>{t.haveAccount}</span>
                                            <button
                                                type="button"
                                                onClick={switchToLogin}
                                                className="cursor-pointer font-semibold text-slate-900"
                                            >
                                                {t.loginHere}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-8 rounded-full bg-slate-900 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {loading
                                        ? t.processing
                                        : currentState === LOGIN
                                          ? t.signInButton
                                          : t.signUpButton}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>

            {forgotOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6">
                    <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_30px_120px_rgba(15,23,42,0.16)] sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
                                    {t.passwordRecovery}
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900">
                                    {forgotStep === 'request' ? t.sendResetOtp : t.verifyOtpReset}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={closeForgotPassword}
                                className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-slate-500 transition hover:text-slate-900"
                            >
                                {t.close}
                            </button>
                        </div>

                        <p className="mt-3 text-sm leading-7 text-slate-500">
                            {forgotStep === 'request' ? t.recoveryDescRequest : t.recoveryDescReset}
                        </p>

                        {forgotStep === 'request' ? (
                            <form onSubmit={sendResetOtpHandler} className="mt-6 space-y-4">
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(event) => setResetEmail(event.target.value)}
                                    className="w-full rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                                    placeholder={t.email}
                                    required
                                />

                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="w-full rounded-full bg-slate-900 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {resetLoading ? t.sendingOtp : t.sendOtp}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={resetPasswordHandler} className="mt-6 space-y-4">
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(event) => setResetEmail(event.target.value)}
                                    className="w-full rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                                    placeholder={t.email}
                                    required
                                />

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={resetOtp}
                                    onChange={(event) =>
                                        setResetOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                                    }
                                    className="w-full rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                                    placeholder={t.otpPlaceholder}
                                    required
                                />

                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    className="w-full rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                                    placeholder={t.newPassword}
                                    required
                                />

                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    className="w-full rounded-[20px] border border-[var(--border)] px-4 py-4 text-sm outline-none"
                                    placeholder={t.confirmPassword}
                                    required
                                />

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="flex-1 rounded-full bg-slate-900 px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                                    >
                                        {resetLoading ? t.updating : t.resetPassword}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={sendResetOtpHandler}
                                        disabled={resetLoading}
                                        className="rounded-full border border-[var(--border)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                                    >
                                        {t.resendOtp}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Login;
