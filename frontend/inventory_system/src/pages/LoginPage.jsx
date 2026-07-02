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

  const [form, setForm]           = useState({ username: '', password: '' });
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors: ve } = validateLoginForm(form);
    if (!isValid) { setErrors(ve); return; }

    setSubmitting(true);
    try {
      const { access, refresh } = await loginApi(form.username, form.password);
      login(access, refresh, { username: form.username });
      toast.success('Logged in successfully');
      navigate('/products');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Inventory System</h1>
        <p className="text-gray-400 text-sm text-center mb-6">Sign in to continue</p>

        <form onSubmit={handleSubmit}>
          <FormInput label="Username" name="username" value={form.username}
            onChange={handleChange} error={errors.username} required />
          <FormInput label="Password" name="password" type="password"
            value={form.password} onChange={handleChange} error={errors.password} required />

          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-md transition-colors text-sm">
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-5">
          No account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
