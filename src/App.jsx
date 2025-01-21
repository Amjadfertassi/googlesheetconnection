import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const CLIENT_ID = '813118908770-1uo8bbufd3lrsajb16guickuk98i9id0.apps.googleusercontent.com';
  const API_KEY = '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';
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

  useEffect(() => {
    const loadGoogleSignIn = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    };

    loadGoogleSignIn();
  }, []);

  const initializeGoogleSignIn = () => {
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse,
    });

    window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          setIsSignedIn(true);
          if (sheetUrl) {
            handleFetchData(tokenResponse.access_token);
          }
        }
      },
    });
  };

  const handleCredentialResponse = (response) => {
    if (response.credential) {
      setIsSignedIn(true);
    }
  };

  const handleSignIn = () => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            setIsSignedIn(true);
            if (sheetUrl) {
              handleFetchData(tokenResponse.access_token);
            }
          }
        },
      });
      tokenClient.requestAccessToken();
    } else {
      setError('Google Sign-In not initialized');
    }
  };

  const handleSignOut = () => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
      setIsSignedIn(false);
      setData([]);
    }
  };

  const handleFetchData = async (accessToken) => {
    if (!sheetUrl) {
      setError('Please enter a Google Sheet URL');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const sheetId = extractSheetId(sheetUrl);
      
      if (!sheetId) {
        setError('Invalid Google Sheet URL. Please try again.');
        return;
      }

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${API_KEY}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const rows = result.values;
      
      if (rows && rows.length > 0) {
        setData(rows);
      } else {
        setError('No data found in the sheet.');
      }
    } catch (err) {
      console.error("Error:", err);
      setError('Failed to fetch data. Please check permissions and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractSheetId = (url) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Google Sheet Viewer</h1>
      
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Paste Google Sheet URL here"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
        />
      </div>

      <div className="mb-3">
        {!isSignedIn ? (
          <button 
            className="btn btn-primary me-2" 
            onClick={handleSignIn}
            disabled={isLoading}
          >
            Sign in with Google
          </button>
        ) : (
          <>
            <button 
              className="btn btn-primary me-2" 
              onClick={() => handleFetchData()}
              disabled={isLoading || !sheetUrl}
            >
              {isLoading ? 'Loading...' : 'Fetch Data'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="alert alert-danger mt-3">
          {error}
        </div>
      )}

      {data.length > 0 && (
        <div className="table-responsive mt-4">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                {data[0].map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default App;