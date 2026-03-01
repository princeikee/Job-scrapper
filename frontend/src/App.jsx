import { Route, Routes } from 'react-router-dom'
import JobScraperDashboard from './pages/job.jsx'
import LandingPage from './pages/landing.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/job" element={<JobScraperDashboard />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  )
}

export default App
