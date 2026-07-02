import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register as registerApi } from '../services/authService';
import { FormInput } from '../components/FormInput';
import { getErrorMessage } from '../utils/getErrorMessage';
import { validateRegisterForm } from '../utils/validators';

/** POST /api/auth/register/ */
export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm]           = useState({ username: '', email: '', password: '', password_confirm: '' });
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors: ve } = validateRegisterForm(form);
    if (!isValid) { setErrors(ve); return; }

    setSubmitting(true);
    try {
      await registerApi(form);
      toast.success('Registered! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Create Account</h1>
        <p className="text-gray-400 text-sm text-center mb-6">Register to get started</p>

        <form onSubmit={handleSubmit}>
          <FormInput label="Username" name="username" value={form.username}
            onChange={handleChange} error={errors.username} required />
          <FormInput label="Email" name="email" type="email" value={form.email}
            onChange={handleChange} error={errors.email} />
          <FormInput label="Password" name="password" type="password"
            value={form.password} onChange={handleChange} error={errors.password} required />
          <FormInput label="Confirm Password" name="password_confirm" type="password"
            value={form.password_confirm} onChange={handleChange} error={errors.password_confirm} required />

          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-md transition-colors text-sm">
            {submitting ? 'Registering…' : 'Register'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
