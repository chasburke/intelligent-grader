import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Table, UploadCloud, X } from 'lucide-react';

export default function AssessmentForm({ onSubmit, isLoading }) {
  const [objectives, setObjectives] = useState('');
  const [rubric, setRubric] = useState('');
  const [instructions, setInstructions] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [spreadsheetFile, setSpreadsheetFile] = useState(null);

  // Dropzone for text documents
  const onDropDoc = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      setDocFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps: getDocProps, getInputProps: getDocInputProps, isDragActive: isDocActive } = useDropzone({
    onDrop: onDropDoc,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  // Dropzone for spreadsheets
  const onDropSpreadsheet = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      setSpreadsheetFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps: getSheetProps, getInputProps: getSheetInputProps, isDragActive: isSheetActive } = useDropzone({
    onDrop: onDropSpreadsheet,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!docFile || !objectives || !rubric) {
      alert("Please provide at least a Document, Learning Objectives, and a Rubric.");
      return;
    }

    const formData = new FormData();
    formData.append('learning_objectives', objectives);
    formData.append('rubric', rubric);
    formData.append('instructions', instructions || 'Assess the submission strictly against the rubric.');
    formData.append('document', docFile);
    if (spreadsheetFile) {
      formData.append('spreadsheet', spreadsheetFile);
    }

    onSubmit(formData);
  };

  return (
    <form className="assessment-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
      
      <div className="input-group">
        <label>Learning Objectives</label>
        <textarea 
          placeholder="e.g., Student will demonstrate understanding of descriptive statistics..."
          value={objectives} 
          onChange={e => setObjectives(e.target.value)} 
          required
        />
      </div>

      <div className="input-group">
        <label>Grading Rubric</label>
        <textarea 
          placeholder="e.g., A = Excellent logic and correct formulas. B = Good logic but minor errors..."
          value={rubric} 
          onChange={e => setRubric(e.target.value)} 
          required
        />
      </div>

      <div className="input-group">
        <label>Instructions to AI Grader (Optional)</label>
        <textarea 
          placeholder="Any specific nuances or harshness level?"
          value={instructions} 
          onChange={e => setInstructions(e.target.value)} 
        />
      </div>

      <div className="input-group">
        <label>Student Written Report (.docx, .txt)</label>
        {!docFile ? (
           <div {...getDocProps()} className={`dropzone ${isDocActive ? 'active' : ''}`}>
             <input {...getDocInputProps()} />
             <UploadCloud size={24} color="var(--primary)" style={{ marginBottom: '10px' }} />
             <p>Drag & drop submission here</p>
           </div>
        ) : (
          <div className="file-item">
            <FileText size={18} color="var(--primary)" />
            <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>{docFile.name}</span>
            <X size={18} style={{cursor: 'pointer'}} onClick={() => setDocFile(null)} />
          </div>
        )}
      </div>

      <div className="input-group">
        <label>Supporting Data (.csv, .xlsx) - Optional</label>
         {!spreadsheetFile ? (
           <div {...getSheetProps()} className={`dropzone ${isSheetActive ? 'active' : ''}`}>
             <input {...getSheetInputProps()} />
             <UploadCloud size={24} color="var(--success)" style={{ marginBottom: '10px' }} />
             <p>Drag & drop dataset here</p>
           </div>
        ) : (
          <div className="file-item">
            <Table size={18} color="var(--success)" />
            <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>{spreadsheetFile.name}</span>
            <X size={18} style={{cursor: 'pointer'}} onClick={() => setSpreadsheetFile(null)} />
          </div>
        )}
      </div>

      <button type="submit" className="btn" disabled={isLoading || !docFile || !objectives || !rubric}>
        {isLoading ? 'Analyzing...' : 'Generate Assessment'}
      </button>

    </form>
  );
}
