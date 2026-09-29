import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { avatarUrl, fetchUser } from '../api.js';
import Avatar from '../components/Avatar.jsx';

export default function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUser(await fetchUser(id));
    } catch (requestError) {
      setUser(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (loading) {
    return (
      <main className="page">
        <section className="card card--center" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <p className="card__subtitle">Loading profile…</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <section className="card card--center">
          <div className="alert alert--error" role="alert">
            {error}
          </div>
          <div className="button-row">
            <button className="button" type="button" onClick={loadUser}>
              Try again
            </button>
            <Link className="button button--ghost" to="/">
              Back to registration
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card card--profile">
        <Avatar src={avatarUrl(user.id)} name={user.fullName} className="avatar--xlarge" />

        <h1 className="card__title">{user.fullName}</h1>
        <p className="profile__handle">@{user.username}</p>

        {!user.hasAvatar && <p className="card__subtitle">No avatar uploaded — showing a default one.</p>}

        <dl className="details">
          <dt>Full name</dt>
          <dd>{user.fullName}</dd>
          <dt>Username</dt>
          <dd>{user.username}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>User ID</dt>
          <dd>{user.id}</dd>
          <dt>Registered</dt>
          <dd>{new Date(user.createdAt).toLocaleString()}</dd>
        </dl>

        <Link className="button button--ghost" to="/">
          Register another user
        </Link>
      </section>
    </main>
  );
}
