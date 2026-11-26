import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import ListingDetail from './pages/ListingDetail.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Favorites from './pages/Favorites.jsx'
import About from './pages/About.jsx'
import Profile from './pages/Profile.jsx'
import Dashboard from './pages/owner/Dashboard.jsx'
import ListingForm from './pages/owner/ListingForm.jsx'
import Inquiries from './pages/owner/Inquiries.jsx'
import MyBookings from './pages/MyBookings.jsx'
import OwnerBookings from './pages/owner/Bookings.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tentang" element={<About />} />
          <Route path="/kos/:id" element={<ListingDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/owner/bookings" element={<ProtectedRoute ownerOnly><OwnerBookings /></ProtectedRoute>} />
          <Route path="/owner" element={<ProtectedRoute ownerOnly><Dashboard /></ProtectedRoute>} />
          <Route path="/owner/new" element={<ProtectedRoute ownerOnly><ListingForm /></ProtectedRoute>} />
          <Route path="/owner/edit/:id" element={<ProtectedRoute ownerOnly><ListingForm /></ProtectedRoute>} />
          <Route path="/owner/inquiries" element={<ProtectedRoute ownerOnly><Inquiries /></ProtectedRoute>} />
          <Route path="*" element={<p className="py-20 text-center">Halaman tidak ditemukan.</p>} />
        </Routes>
      </main>
    </>
  )
}