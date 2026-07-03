import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { login as loginApi } from '../services/authService';
import { FormInput } from '../components/FormInput';
import { getErrorMessage } from '../utils/getErrorMessage';
import { validateLoginForm } from '../utils/validators';

/** POST /api/auth/login/ → { access, refresh } */
export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const {
    isValid,
    errors: ve,
  } = validateLoginForm(form);

  if (!isValid) {
    setErrors(ve);
    return;
  }

  setSubmitting(true);

  try {
    const { access, refresh } = await loginApi(
      form.username,
      form.password
    );

    login(access, refresh, {
      username: form.username,
    });

    toast.success('Logged in successfully');
    navigate('/products');
  } catch (err) {
    if (err.response?.status === 401) {
      toast.error(
        err.response?.data?.detail ||
        'Invalid username or password.'
      );
    } else {
      toast.error(getErrorMessage(err));
    }
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-4 shadow-lg text-2xl">
            📦
          </div>
          <h1 className="text-xl font-semibold text-white">Inventory System</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to continue</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate>
            <FormInput
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              error={errors.username}
              required
              autoComplete="username"
            />
            <FormInput
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              required
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition inline-flex items-center justify-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          No account?{' '}
          <Link to="/register" className="text-blue-500 hover:text-blue-400 font-medium transition">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
