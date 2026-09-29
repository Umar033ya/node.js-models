import { useEffect, useState } from 'react';

function initialsOf(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Shows the image, and falls back to a simple initials circle when there is no
// avatar or the image fails to load (for example the user had no avatar).
export default function Avatar({ src, name = '', className = '' }) {
  const [failed, setFailed] = useState(false);

  // Reset the error state whenever the source changes.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`avatar avatar--fallback ${className}`} role="img" aria-label={`${name || 'User'} avatar`}>
        {initialsOf(name)}
      </div>
    );
  }

  return (
    <img
      className={`avatar ${className}`}
      src={src}
      alt={`${name || 'User'} avatar`}
      onError={() => setFailed(true)}
    />
  );
}
