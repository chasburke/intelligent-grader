import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle, AlertTriangle, FileText } from 'lucide-react';

export default function AssessmentResults({ results }) {
  if (!results) return null;

  return (
    <div className="results-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={24} color="var(--primary)" />
            Assessment Complete
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Review the AI-generated feedback and verification below.</p>
        </div>
        
        <div className="score-card">
          <p style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', color: 'var(--text-muted)' }}>Final Grade</p>
          <div className="score-value">{results.score}</div>
        </div>
      </div>

      <div className="feedback-section">
        <h3>Feedback & Analysis</h3>
        <div className="feedback-content glass-panel" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{results.feedback}</ReactMarkdown>
        </div>
      </div>

      <div className="verification-box">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          {results.cross_verification.toLowerCase().includes('not') || results.cross_verification.toLowerCase().includes('mismatch') ? (
             <AlertTriangle size={20} color="var(--error)" /> 
          ) : (
            <CheckCircle size={20} color="var(--success)" />
          )}
          Data Cross-Verification
        </h3>
        <p style={{ lineHeight: '1.6' }}>{results.cross_verification}</p>
      </div>
    </div>
  );
}
