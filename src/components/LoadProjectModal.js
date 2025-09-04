import React, { useState, useEffect } from 'react';
import ApiClient from '../services/apiClient';

const LoadProjectModal = ({ isOpen, onClose, onLoadProject }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const projectList = await ApiClient.getAllProjects();
      // Sort by created_at DESC (newest first)
      const sorted = projectList.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setProjects(sorted);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadProject = async (projectId) => {
    setLoading(true);
    setError(null);
    
    try {
      const projectData = await ApiClient.getProject(projectId);
      if (projectData && projectData.complete_app_state) {
        // Parse the complete app state
        const appState = JSON.parse(projectData.complete_app_state);
        
        // Add project metadata to the app state
        appState.projectId = projectData.id;
        appState.folderName = projectData.folder_name;
        
        onLoadProject(appState);
        onClose();
      } else {
        setError('Invalid project data');
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #ddd',
          paddingBottom: '10px'
        }}>
          <h2 style={{ margin: 0 }}>Load Project</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Loading projects...
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No saved projects found
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Auftrag-Nr</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Machine</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Files</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => handleLoadProject(project.id)}
                  style={{
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <td style={{ padding: '10px' }}>{project.auftrag_nr || 'Unknown'}</td>
                  <td style={{ padding: '10px' }}>{project.datum || '-'}</td>
                  <td style={{ padding: '10px' }}>{project.maschinentyp || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{project.file_count || 0}</td>
                  <td style={{ padding: '10px' }}>
                    {new Date(project.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadProjectModal;