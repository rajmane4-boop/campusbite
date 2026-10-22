// [Riya] LoginRegister.jsx - Student/Staff tabbed login & registration with form validation
// Enhanced with password strength meter, remember-me, and success feedback
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  User,
  Phone,
  Hash,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  ChefHat,
  GraduationCap,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

// Password strength calculator
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '#e5e7eb' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Too short', color: '#ef4444' },
    { label: 'Weak', color: '#f59e0b' },
    { label: 'Fair', color: '#f59e0b' },
    { label: 'Good', color: '#3b82f6' },
    { label: 'Strong', color: '#10b981' },
  ];
  const level = levels[Math.min(score, levels.length) - 1] || levels[0];
  return { score, label: level.label, color: level.color };
};

const LoginRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, isStaff } = useAuth();

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(isStaff ? '/staff-dashboard' : '/menu', { replace: true });
    }
  }, [isAuthenticated, isStaff, navigate]);

  // Tab state: 'login' or 'register'
  const [activeTab, setActiveTab] = useState('login');

  // Role toggle: 'student' or 'staff'
  const [selectedRole, setSelectedRole] = useState('student');

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rollNumber: '',
    phone: '',
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  // Password strength (computed live)
  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error on edit
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  // Client-side validation
  const validateForm = () => {
    const errors = {};

    if (activeTab === 'register') {
      if (!formData.name.trim()) errors.name = 'Full name is required';
      if (formData.password.length < 6)
        errors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword)
        errors.confirmPassword = 'Passwords do not match';
      if (selectedRole === 'student' && !formData.rollNumber.trim())
        errors.rollNumber = 'Roll number is required for students';
    }

    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Enter a valid email address';

    if (!formData.password) errors.password = errors.password || 'Password is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      if (activeTab === 'login') {
        const result = await login(formData.email, formData.password);
        // Redirect based on role
        const from = location.state?.from;
        if (from) {
          navigate(from, { replace: true });
        } else if (result.user?.role === 'staff') {
          navigate('/staff-dashboard', { replace: true });
        } else {
          navigate('/menu', { replace: true });
        }
      } else {
        const result = await register({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          rollNumber: selectedRole === 'student' ? formData.rollNumber.trim() : undefined,
          phone: formData.phone.trim() || undefined,
          role: selectedRole,
        });
        if (result.user?.role === 'staff') {
          navigate('/staff-dashboard', { replace: true });
        } else {
          navigate('/menu', { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Shared input field renderer
  const renderField = (name, label, icon, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '16px' }}>
      <label
        htmlFor={name}
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 600,
          color: '#374151',
          marginBottom: '6px',
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: '12px',
          border: `1.5px solid ${fieldErrors[name] ? '#ef4444' : '#e5e7eb'}`,
          background: '#f9fafb',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        <span style={{ color: '#9ca3af', display: 'flex' }}>{icon}</span>
        <input
          id={name}
          name={name}
          type={name === 'password' || name === 'confirmPassword' ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleChange}
          autoComplete={name === 'password' ? 'current-password' : name === 'email' ? 'email' : 'off'}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '14px',
            color: '#1f2937',
            fontFamily: 'inherit',
          }}
        />
        {(name === 'password' || name === 'confirmPassword') && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              display: 'flex',
              padding: 0,
            }}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {fieldErrors[name] && (
        <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 4px' }}>
          {fieldErrors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #ffedd5 100%)',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#fff',
          borderRadius: '24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          padding: '36px 32px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#1f2937',
              margin: '0 0 6px',
            }}
          >
            {activeTab === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            {activeTab === 'login'
              ? 'Sign in to your CampusBite account'
              : 'Join CampusBite and start ordering'}
          </p>
        </div>

        {/* Login / Register Tabs */}
        <div
          style={{
            display: 'flex',
            background: '#f3f4f6',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '24px',
          }}
        >
          {['login', 'register'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setError('');
                setFieldErrors({});
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#1f2937' : '#6b7280',
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontFamily: 'inherit',
              }}
            >
              {tab === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />}
              {tab === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Role Toggle (only for register) */}
        {activeTab === 'register' && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            {[
              { role: 'student', icon: <GraduationCap size={18} />, label: 'Student' },
              { role: 'staff', icon: <ChefHat size={18} />, label: 'Staff' },
            ].map(({ role, icon, label }) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: `2px solid ${selectedRole === role ? '#ea580c' : '#e5e7eb'}`,
                  background: selectedRole === role ? '#fff7ed' : '#fff',
                  color: selectedRole === role ? '#ea580c' : '#6b7280',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {activeTab === 'register' &&
            renderField('name', 'Full Name', <User size={16} />, 'text', 'Enter your full name')}

          {renderField('email', 'Email Address', <Mail size={16} />, 'email', 'you@college.edu')}
          {renderField('password', 'Password', <Lock size={16} />, 'password', '••••••••')}

          {/* Password Strength Indicator (register only) */}
          {activeTab === 'register' && formData.password && (
            <div style={{ marginBottom: '16px', marginTop: '-10px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1, 2, 3, 4, 5].map((seg) => (
                  <div
                    key={seg}
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      background: seg <= passwordStrength.score ? passwordStrength.color : '#e5e7eb',
                      transition: 'background 0.3s',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: passwordStrength.color, fontWeight: 600 }}>
                  <ShieldCheck size={11} style={{ verticalAlign: 'text-bottom', marginRight: '3px' }} />
                  {passwordStrength.label}
                </span>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                  Use 8+ chars, uppercase, number & symbol
                </span>
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <>
              {renderField(
                'confirmPassword',
                'Confirm Password',
                <Lock size={16} />,
                'password',
                '••••••••'
              )}
              {selectedRole === 'student' &&
                renderField(
                  'rollNumber',
                  'Roll Number',
                  <Hash size={16} />,
                  'text',
                  'e.g. CS-2026-042'
                )}
              {renderField(
                'phone',
                'Phone (Optional)',
                <Phone size={16} />,
                'tel',
                '+91 98765 43210'
              )}
            </>
          )}

          {/* Remember Me (login only) */}
          {activeTab === 'login' && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#6b7280',
                marginBottom: '12px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#ea580c',
                  cursor: 'pointer',
                }}
              />
              Remember me on this device
            </label>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: loading
                ? '#9ca3af'
                : 'linear-gradient(135deg, #ea580c, #dc2626)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
              transition: 'opacity 0.2s',
              fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(234, 88, 12, 0.3)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                {activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              <>
                {activeTab === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                {activeTab === 'login' ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        {/* Toggle prompt */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          {activeTab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setActiveTab(activeTab === 'login' ? 'register' : 'login');
              setError('');
              setFieldErrors({});
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#ea580c',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '13px',
              textDecoration: 'underline',
              fontFamily: 'inherit',
            }}
          >
            {activeTab === 'login' ? 'Register here' : 'Sign in'}
          </button>
        </p>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginRegister;
