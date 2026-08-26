import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/app-shell';

const Home = React.lazy(() => import('./pages/Home'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Projects = React.lazy(() => import('./pages/Projects'));
const Investigation = React.lazy(() => import('./pages/Investigation'));
const Alerts = React.lazy(() => import('./pages/Alerts'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Audit = React.lazy(() => import('./pages/Audit'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const ContactUs = React.lazy(() => import('./pages/ContactUs'));
const KnowYourSource = React.lazy(() => import('./pages/KnowYourSource'));

function App() {
  return (
    <React.Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<Investigation />} />
          <Route path="investigation" element={<Investigation />} />
          <Route path="investigation/:id" element={<Investigation />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="audit" element={<Audit />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="contact" element={<ContactUs />} />
          <Route path="know-your-source" element={<KnowYourSource />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </React.Suspense>
  );
}

export default App;
