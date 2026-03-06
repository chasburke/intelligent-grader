import React, { useState } from 'react';
import AssessmentForm from './components/AssessmentForm';
import AssessmentResults from './components/AssessmentResults';
import { Sparkles, Activity } from 'lucide-react';
import './index.css';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAssess = async (formData) => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      // In development, the Vite server runs on a different port than FastAPI
      // In production, they'd likely be served from the same origin.
      const response = await fetch('/api/assess', {
        method: 'POST',
        body: formData, // the FormData object contains files and text fields
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to assess submission');
      }

      const data = await response.json();
      setResults(data);
      
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar / Input Area */}
      <aside className="sidebar glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
          <Sparkles size={28} color="var(--primary)" />
          <h2>Intelligent Grader</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Configure your assessment parameters and upload student work to generate AI-driven feedback and verification.
        </p>
        
        <AssessmentForm onSubmit={handleAssess} isLoading={loading} />
      </aside>

      {/* Main Content / Results Area */}
      <main className="main-content glass-panel">
        {loading ? (
          <div className="empty-state">
            <div className="loader"></div>
            <p>Analyzing document and cross-referencing spreadsheet data...</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Gemini Pro is working on it. This usually takes 10-20 seconds.</p>
          </div>
        ) : error ? (
           <div className="empty-state" style={{ color: 'var(--error)' }}>
            <Activity size={48} />
             <h3>Assessment Error</h3>
             <p>{error}</p>
           </div>
        ) : results ? (
          <AssessmentResults results={results} />
        ) : (
          <div className="empty-state">
            <Activity size={48} />
            <h3>Awaiting Submission</h3>
            <p>Upload a document to begin the assessment.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
