import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, Navigate, Route, Router, Routes } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Route with alertId parameter */}
        <Route path="/alert/:alertId" element={<App />} />
        
        {/* Default route - redirect to a demo alert */}
        <Route path="/" element={<Navigate to="/alert/17895" replace />} />
        
        {/* Catch all other routes */}
        <Route path="*" element={
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">Page Not Found</h2>
              <p className="text-gray-600 mb-4">
                Please navigate to: /alert/[alertId]
              </p>
              <a 
                href="/alert/17895" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Go to Demo Alert
              </a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
