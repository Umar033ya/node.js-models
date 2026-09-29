const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');

const PORT = process.env.PORT || 3001;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const app = express();

// The React dev server runs on a different port, so allow cross-origin requests.
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// In-memory storage. Everything lives in RAM and disappears when the server
// stops. There is no database and no filesystem storage of any kind.
// ---------------------------------------------------------------------------
const users = [];
let nextUserId = 1;

// memoryStorage keeps the uploaded avatar as a Buffer on req.file.
// diskStorage is never used, so no image ever touches the disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES },
  fileFilter(req, file, cb) {
    if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
      return cb(new Error('Avatar must be a PNG, JPEG, GIF or WEBP image.'));
    }
    cb(null, true);
  },
});

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// Never send the password (or the raw avatar Buffer) to the client.
function toPublicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    hasAvatar: Boolean(user.avatar),
    avatarUrl: `/api/users/${user.id}/avatar`,
    createdAt: user.createdAt,
  };
}

function findUser(id) {
  return users.find((user) => user.id === id);
}

function validate(fields) {
  const errors = {};
  const fullName = fields.fullName.trim();
  const username = fields.username.trim();
  const email = fields.email.trim().toLowerCase();
  const password = fields.password;

  if (!fullName) {
    errors.fullName = 'Full name is required.';
  } else if (fullName.length > 80) {
    errors.fullName = 'Full name must be 80 characters or fewer.';
  }

  if (!username) {
    errors.username = 'Username is required.';
  } else if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
    errors.username = 'Username must be 3-30 characters (letters, numbers, _ . -).';
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (users.some((user) => user.username === username)) {
    errors.username = 'That username is already taken.';
  }
  if (users.some((user) => user.email === email)) {
    errors.email = 'That email is already registered.';
  }

  return { errors, fullName, username, email, password };
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

// POST /api/register  (multipart/form-data: fullName, username, email, password, avatar)
app.post('/api/register', upload.single('avatar'), (req, res) => {
  const { errors, fullName, username, email, password } = validate(req.body || {});

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });
  }

  const user = {
    id: String(nextUserId++),
    fullName,
    username,
    email,
    passwordHash: hashPassword(password),
    // The avatar image itself, held in RAM as a Buffer.
    avatar: req.file ? req.file.buffer : null,
    avatarMimeType: req.file ? req.file.mimetype : null,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  res.status(201).json({ user: toPublicUser(user) });
});

// GET /api/users/:id
app.get('/api/users/:id', (req, res) => {
  const user = findUser(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  res.json({ user: toPublicUser(user) });
});

// GET /api/users/:id/avatar  -> streams the stored Buffer back as an image
app.get('/api/users/:id/avatar', (req, res) => {
  const user = findUser(req.params.id);

  if (!user || !user.avatar) {
    return res.status(404).json({ message: 'Avatar not found.' });
  }

  res.set('Content-Type', user.avatarMimeType);
  res.set('Content-Length', user.avatar.length);
  res.send(user.avatar);
});

// Anything unknown -> friendly JSON error instead of the default HTML page.
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isTooLarge = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE';
  const status = isTooLarge ? 413 : 400;
  const message = isTooLarge
    ? `Avatar is too large. Maximum size is ${MAX_AVATAR_BYTES / 1024 / 1024} MB.`
    : err.message || 'Something went wrong.';

  console.error('[error]', err.message);
  res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Users currently in memory: ${users.length}`);
});
