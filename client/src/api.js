// Single place where the backend address lives.
// The server sends CORS headers, so calling it directly from the browser works.
const API_BASE_URL = 'http://localhost:3001';

async function readError(response) {
  try {
    return await response.json();
  } catch {
    return { message: `Request failed with status ${response.status}.` };
  }
}

function toError(data, fallback) {
  const error = new Error(data.message || fallback);
  error.fieldErrors = data.errors;
  return error;
}

// Sends the registration form as multipart/form-data so the avatar file travels
// with the text fields.
export async function registerUser(formData) {
  const response = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw toError(await readError(response), 'Registration failed.');
  }

  const { user } = await response.json();
  return user;
}

export async function fetchUser(id) {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`);

  if (!response.ok) {
    throw toError(await readError(response), 'Could not load this profile.');
  }

  const { user } = await response.json();
  return user;
}

// Points straight at the backend endpoint, which replies with the stored Buffer.
export function avatarUrl(id) {
  return `${API_BASE_URL}/api/users/${id}/avatar`;
}
