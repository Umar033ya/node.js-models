import { Navigate, Route, Routes } from 'react-router-dom';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/profile/:id" element={<Profile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
