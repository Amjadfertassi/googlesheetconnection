import React, { useState, useEffect } from 'react';
import { gapi } from 'gapi-script';

const CLIENT_ID = "813118908770-1uo8bbufd3lrsajb16guickuk98i9id0.apps.googleusercontent.com"; // Replace with your Google OAuth Client ID
const API_KEY = "AIzaSyAoG0-AepMg9D4a5xuQl9zPcr42IDwWWrc"; // Replace with your API Key
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sheetData, setSheetData] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [sheetId, setSheetId] = useState("");

  useEffect(() => {
    const loadClient = () => {
      gapi.load('client:auth2', () => {
        gapi.client
          .init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
            scope: SCOPES,
          })
          .then(() => {
            console.log("Google API client initialized.");
          })
          .catch((error) => {
            console.error("Error initializing Google API client:", error);
            setErrorMessage("Failed to initialize Google API client. Check API Key and Client ID.");
          });
      });
    };

    loadClient();
  }, []);

  const handleAuthClick = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    if (authInstance) {
      authInstance
        .signIn()
        .then(() => {
          setIsAuthenticated(true);
        })
        .catch((error) => {
          console.error("Authentication failed:", error);
          setErrorMessage("Failed to authenticate with Google.");
        });
    } else {
      setErrorMessage("Google API client is not initialized yet.");
    }
  };

  const fetchSheetData = () => {
    if (!sheetId) {
      alert("Please enter a valid Google Sheet ID.");
      return;
    }

    if (!gapi.client.sheets) {
      alert("Google Sheets API client is not initialized. Try again later.");
      return;
    }

    const range = "Sheet1!A1:Z1000"; // Adjust range as needed
    gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: sheetId,
        range: range,
      })
      .then((response) => {
        const data = response.result.values;
        if (data) {
          setSheetData(data);
        } else {
          alert("No data found in the sheet.");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setErrorMessage("Failed to fetch data. Ensure the Sheet ID and permissions are correct.");
      });
  };

  return (
    <div className="App">
      <h1>Google Sheets Viewer</h1>
      {!isAuthenticated ? (
        <button onClick={handleAuthClick}>Connect with Google</button>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Enter Google Sheet ID"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value.trim())}
          />
          <button onClick={fetchSheetData}>Import</button>
          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
          <table border="1">
            <thead>
              {sheetData[0] && (
                <tr>
                  {sheetData[0].map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {sheetData.slice(1).map((row, rowIndex) => (
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
}

export default App;
