import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Recover from '@/pages/Recover'
import RegisterWarranty from '@/pages/RegisterWarranty'
import IssuerDashboard from '@/pages/IssuerDashboard'
import MyWarranties from '@/pages/MyWarranties'
import Verify from '@/pages/Verify'
import CreateWarranty from '@/pages/CreateWarranty'
import WarrantyDetails from '@/pages/WarrantyDetails'
import Activity from '@/pages/Activity'
import Profile from '@/pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="recover" element={<Recover />} />
          <Route path="register" element={<RegisterWarranty />} />
          <Route path="issuer" element={<IssuerDashboard />} />
          <Route path="my-warranties" element={<MyWarranties />} />
          <Route path="verify" element={<Verify />} />
          <Route path="create" element={<CreateWarranty />} />
          <Route path="warranty/:id" element={<WarrantyDetails />} />
          <Route path="activity" element={<Activity />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
