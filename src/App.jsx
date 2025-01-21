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
  const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];

  useEffect(() => {
    const loadGoogleAPI = () => {
      window.gapi.load('client:auth2', initClient);
    };

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = loadGoogleAPI;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const initClient = async () => {
    try {
      await window.gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: DISCOVERY_DOCS,
        ux_mode: 'popup',
        redirect_uri: window.location.origin,
      });

      // Initialize the auth2 instance
      const auth2 = window.gapi.auth2.getAuthInstance();
      
      // Update initial sign-in state
      setIsSignedIn(auth2.isSignedIn.get());

      // Listen for sign-in state changes
      auth2.isSignedIn.listen((signedIn) => {
        setIsSignedIn(signedIn);
        if (!signedIn) {
          setData([]);
        }
      });
    } catch (error) {
      console.error('Error initializing GAPI client:', error);
      setError('Failed to initialize Google API client');
    }
  };

  const handleSignIn = async () => {
    try {
      await window.gapi.auth2.getAuthInstance().signIn();
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Failed to sign in with Google');
    }
  };

  const handleSignOut = async () => {
    try {
      await window.gapi.auth2.getAuthInstance().signOut();
      setData([]);
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  const handleFetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const sheetId = extractSheetId(sheetUrl);
      
      if (!sheetId) {
        setError('Invalid Google Sheet URL. Please try again.');
        return;
      }

      if (!isSignedIn) {
        await handleSignIn();
      }

      // Fetch the data
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1', // Update this to match your sheet name
      });

      const rows = response.result.values;
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
              onClick={handleFetchData}
              disabled={isLoading}
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