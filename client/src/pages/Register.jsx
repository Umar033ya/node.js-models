import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api.js';
import Avatar from '../components/Avatar.jsx';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const initialValues = { fullName: '', username: '', email: '', password: '' };

// Same rules the server checks, so the user sees problems before submitting.
function validate(values, avatarFile) {
  const errors = {};
  const fullName = values.fullName.trim();
  const username = values.username.trim();
  const email = values.email.trim();

  if (!fullName) {
    errors.fullName = 'Full name is required.';
  } else if (fullName.length > 80) {
    errors.fullName = 'Full name must be 80 characters or fewer.';
  }

  if (!username) {
    errors.username = 'Username is required.';
  } else if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
    errors.username = 'Use 3-30 characters: letters, numbers, _ . -';
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (avatarFile) {
    if (!ALLOWED_AVATAR_TYPES.includes(avatarFile.type)) {
      errors.avatar = 'Avatar must be a PNG, JPEG, GIF or WEBP image.';
    } else if (avatarFile.size > MAX_AVATAR_BYTES) {
      errors.avatar = 'Avatar must be 2 MB or smaller.';
    }
  }

  return errors;
}

export default function Register() {
  const navigate = useNavigate();

  const [values, setValues] = useState(initialValues);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Turn the chosen file into a temporary blob URL for the preview.
  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(avatarFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0] || null;
    setAvatarFile(file);
    setErrors((current) => ({ ...current, avatar: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate(values, avatarFile);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('fullName', values.fullName.trim());
      formData.append('username', values.username.trim());
      formData.append('email', values.email.trim());
      formData.append('password', values.password);
      if (avatarFile) formData.append('avatar', avatarFile);

      const user = await registerUser(formData);
      navigate(`/profile/${user.id}`);
    } catch (error) {
      setErrors(error.fieldErrors || {});
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="card">
        <h1 className="card__title">Create your account</h1>
        <p className="card__subtitle">
          Everything is kept in the server's memory — no database, no files on disk.
        </p>

        {formError && (
          <div className="alert alert--error" role="alert">
            {formError}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="field__label">Full name</span>
            <input
              className={`field__input${errors.fullName ? ' field__input--invalid' : ''}`}
              type="text"
              name="fullName"
              value={values.fullName}
              onChange={handleChange}
              placeholder="Ada Lovelace"
              autoComplete="name"
              disabled={submitting}
            />
            {errors.fullName && <span className="field__error">{errors.fullName}</span>}
          </label>

          <label className="field">
            <span className="field__label">Username</span>
            <input
              className={`field__input${errors.username ? ' field__input--invalid' : ''}`}
              type="text"
              name="username"
              value={values.username}
              onChange={handleChange}
              placeholder="ada_l"
              autoComplete="username"
              disabled={submitting}
            />
            {errors.username && <span className="field__error">{errors.username}</span>}
          </label>

          <label className="field">
            <span className="field__label">Email</span>
            <input
              className={`field__input${errors.email ? ' field__input--invalid' : ''}`}
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              placeholder="ada@example.com"
              autoComplete="email"
              disabled={submitting}
            />
            {errors.email && <span className="field__error">{errors.email}</span>}
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              className={`field__input${errors.password ? ' field__input--invalid' : ''}`}
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              disabled={submitting}
            />
            {errors.password && <span className="field__error">{errors.password}</span>}
          </label>

          <div className="field">
            <span className="field__label">Avatar (optional)</span>

            <div className="avatar-picker">
              <Avatar src={previewUrl} name={values.fullName || values.username} className="avatar--large" />
              <div className="avatar-picker__controls">
                <input
                  className="field__input"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  disabled={submitting}
                />
                <span className="field__hint">PNG, JPEG, GIF or WEBP, max 2 MB.</span>
                {errors.avatar && <span className="field__error">{errors.avatar}</span>}
              </div>
            </div>
          </div>

          <button className="button" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Register'}
          </button>
        </form>
      </section>
    </main>
  );
}
