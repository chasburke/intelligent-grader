import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Table, UploadCloud, X, Link as LinkIcon } from 'lucide-react';

export default function AssessmentForm({ onSubmit, isLoading }) {
  const [objectivesText, setObjectivesText] = useState('');
  const [objectivesFile, setObjectivesFile] = useState(null);

  const [rubricText, setRubricText] = useState('');
  const [rubricFile, setRubricFile] = useState(null);

  const [instructionsText, setInstructionsText] = useState('');
  const [instructionsFile, setInstructionsFile] = useState(null);

  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);

  const [spreadsheetFile, setSpreadsheetFile] = useState(null);

  // Reusable dropzone configured for standard text/documents
  const useDocDropzone = (setFile) => {
    const onDrop = useCallback(acceptedFiles => {
      if (acceptedFiles?.length > 0) setFile(acceptedFiles[0]);
    }, [setFile]);
    
    return useDropzone({
      onDrop,
      accept: {
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'text/plain': ['.txt']
      },
      maxFiles: 1
    });
  };

  const objDrop = useDocDropzone(setObjectivesFile);
  const rubDrop = useDocDropzone(setRubricFile);
  const instDrop = useDocDropzone(setInstructionsFile);
  const subDrop = useDocDropzone(setSubmissionFile);

  // Dropzone for spreadsheets
  const { getRootProps: getSheetProps, getInputProps: getSheetInputProps, isDragActive: isSheetActive } = useDropzone({
    onDrop: useCallback(acceptedFiles => {
      if (acceptedFiles?.length > 0) setSpreadsheetFile(acceptedFiles[0]);
    }, []),
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!submissionText && !submissionFile) || (!objectivesText && !objectivesFile) || (!rubricText && !rubricFile)) {
      alert("Please provide at least Learning Objectives, a Rubric, and a Submission (either as text/link or file upload).");
      return;
    }

    const formData = new FormData();
    formData.append('learning_objectives', objectivesText);
    if (objectivesFile) formData.append('learning_objectives_file', objectivesFile);

    formData.append('rubric', rubricText);
    if (rubricFile) formData.append('rubric_file', rubricFile);

    formData.append('instructions', instructionsText);
    if (instructionsFile) formData.append('instructions_file', instructionsFile);

    formData.append('submission_text', submissionText);
    if (submissionFile) formData.append('document', submissionFile);

    if (spreadsheetFile) formData.append('spreadsheet', spreadsheetFile);

    onSubmit(formData);
  };

  const renderInputBlock = (label, textLabel, textPlaceholder, textVal, setText, fileVal, setFile, dropzone) => (
    <div className="input-group" style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px' }}>
      <label style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.8rem', display: 'block' }}>{label}</label>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <textarea 
          placeholder={textPlaceholder}
          value={textVal} 
          onChange={e => setText(e.target.value)} 
          style={{ minHeight: '60px' }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>OR MATCH WITH FILE</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        {!fileVal ? (
           <div {...dropzone.getRootProps()} className={`dropzone ${dropzone.isDragActive ? 'active' : ''}`} style={{ padding: '1rem', minHeight: 'auto' }}>
             <input {...dropzone.getInputProps()} />
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
               <UploadCloud size={18} color="var(--primary)" />
               <p style={{ margin: 0, fontSize: '0.9rem' }}>Upload .txt or .docx</p>
             </div>
           </div>
        ) : (
          <div className="file-item" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={16} />
            <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem'}}>{fileVal.name}</span>
            <X size={16} style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); setFile(null); }} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <form className="assessment-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
      
      {renderInputBlock(
        "1. Learning Objectives", 
        "Text / Links", 
        "Enter text or a URL containing the learning objectives...",
        objectivesText, setObjectivesText,
        objectivesFile, setObjectivesFile,
        objDrop
      )}

      {renderInputBlock(
        "2. Grading Rubric", 
        "Text / Links", 
        "Enter text or a URL containing the grading rubric...",
        rubricText, setRubricText,
        rubricFile, setRubricFile,
        rubDrop
      )}

      {renderInputBlock(
        "3. Instructions to AI Grader (Optional)", 
        "Text / Links", 
        "Enter text or a URL containing specific instructions...",
        instructionsText, setInstructionsText,
        instructionsFile, setInstructionsFile,
        instDrop
      )}

      {renderInputBlock(
        "4. Student Submission", 
        "Text / Link (e.g. Gemini Chat)", 
        "Enter submission text or a Gemini Chat Share Link (https://g.co/gemini/share/...)",
        submissionText, setSubmissionText,
        submissionFile, setSubmissionFile,
        subDrop
      )}

      <div className="input-group" style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px' }}>
        <label style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.8rem', display: 'block' }}>5. Supporting Data (.csv, .xlsx) - Optional</label>
         {!spreadsheetFile ? (
           <div {...getSheetProps()} className={`dropzone ${isSheetActive ? 'active' : ''}`} style={{ padding: '1rem', minHeight: 'auto' }}>
             <input {...getSheetInputProps()} />
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
               <UploadCloud size={18} color="var(--success)" />
               <p style={{ margin: 0, fontSize: '0.9rem' }}>Upload dataset for cross-verification</p>
             </div>
           </div>
        ) : (
          <div className="file-item" style={{ background: '#e6f4ea', color: 'var(--success)', padding: '0.5rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Table size={16} />
            <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem'}}>{spreadsheetFile.name}</span>
            <X size={16} style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); setSpreadsheetFile(null); }} />
          </div>
        )}
      </div>

      <button type="submit" className="btn" disabled={isLoading} style={{ marginTop: '1rem' }}>
        {isLoading ? 'Analyzing Submission...' : 'Generate Assessment'}
      </button>

    </form>
  );
}
