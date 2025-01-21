import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [tokenClient, setTokenClient] = useState(null);
  const [sheetTitle, setSheetTitle] = useState(''); // New state for sheet title

  const CLIENT_ID = '813118908770-1uo8bbufd3lrsajb16guickuk98i9id0.apps.googleusercontent.com';
  const API_KEY = 'AIzaSyDrxYLnO6-nqHjw64l35J9e';
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

  useEffect(() => {
    // Load the Google Identity Services library
    const loadGoogleIdentity = () => {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleAuth;
      document.body.appendChild(script);
    };

    // Load the Google API Client Library
    const loadGoogleAPI = () => {
      const script = document.createElement('script');
      script.src = "https://apis.google.com/js/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.gapi.load('client', initializeGapiClient);
      };
      document.body.appendChild(script);
    };

    loadGoogleIdentity();
    loadGoogleAPI();
  }, []);

  const initializeGapiClient = async () => {
    try {
      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
      });
    } catch (error) {
      console.error('Error initializing GAPI client:', error);
      setError('Failed to initialize Google API client');
    }
  };

  const initializeGoogleAuth = () => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
      });
      setTokenClient(client);
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
      setError('Failed to initialize Google authentication');
    }
  };

  const handleTokenResponse = async (response) => {
    if (response && response.access_token) {
      setIsSignedIn(true);
      await fetchUserInfo(response.access_token);
      if (sheetUrl) {
        await handleFetchData(response.access_token);
      }
    }
  };

  const fetchUserInfo = async (accessToken) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const userData = await response.json();
      setUserInfo({
        name: userData.name,
        email: userData.email,
        imageUrl: userData.picture
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleSignIn = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      setError('Authentication not initialized');
    }
  };

  const handleSignOut = () => {
    if (window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(tokenClient?.access_token, () => {
        setIsSignedIn(false);
        setUserInfo(null);
        setData([]);
        setSheetTitle(''); // Clear sheet title on sign out
      });
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

      // Set the access token for GAPI
      window.gapi.client.setToken({
        access_token: accessToken
      });

      // Get spreadsheet metadata
      const metadataResponse = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: sheetId
      });

      // Set the sheet title
      setSheetTitle(metadataResponse.result.properties.title);
      const firstSheetName = metadataResponse.result.sheets[0].properties.title;

      // Get the values
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: firstSheetName
      });

      const rows = response.result.values;
      if (rows && rows.length > 0) {
        setData(rows);
        setError('');
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

      {userInfo && (
        <div className="alert alert-info mb-3">
          <div className="d-flex align-items-center">
            {userInfo.imageUrl && (
              <img
                src={userInfo.imageUrl}
                alt="Profile"
                className="rounded-circle me-2"
                style={{ width: '40px', height: '40px' }}
              />
            )}
            <div>
              <strong>{userInfo.name}</strong>
              <br />
              <small>{userInfo.email}</small>
            </div>
          </div>
        </div>
      )}

      {sheetTitle && (
        <div className="alert alert-success mb-3">
          <strong>Current Sheet: </strong> {sheetTitle}
        </div>
      )}

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
            className="btn btn-primary" 
            onClick={handleSignIn}
            disabled={!tokenClient}
          >
            Sign in with Google
          </button>
        ) : (
          <>
            <button 
              className="btn btn-primary me-2" 
              onClick={() => handleFetchData(tokenClient?.access_token)}
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