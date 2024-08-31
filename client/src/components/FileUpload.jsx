// src/components/FileUpload.jsx
import React from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import FontAwesome CSS
import './FileUpload.css';
const FileUpload = () => {
  return (
    <div className="upload-form">
      <label htmlFor="file-upload" className="attach-icon">
        <i className="fas fa-paperclip"></i> {/* FontAwesome attach icon */}
        <input 
          type="file" 
          id="file-upload" 
          className="file-upload" 
          accept=".pdf,.doc,.docx,.jpg,.png" 
        />
      </label>
    </div>
  );
};

export default FileUpload;
