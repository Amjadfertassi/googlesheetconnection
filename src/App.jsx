import React from 'react';
import { gapi } from 'gapi-script';

const CLIENT_ID = "813118908770-1uo8bbufd3lrsajb16guickuk98i9id0.apps.googleusercontent.com";
const API_KEY = "AIzaSyAoG0-AepMg9D4a5xuQl9zPcr42IDwWWrc";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuthenticated: false,
      sheetData: [],
      errorMessage: "",
      sheetLink: ""
    };
  }

  componentDidMount() {
    this.loadClient();
  }

  loadClient = () => {
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
          this.setState({ errorMessage: "Failed to initialize Google API client. Check API Key and Client ID." });
        });
    });
  };

  handleAuthClick = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    if (authInstance) {
      authInstance
        .signIn()
        .then(() => {
          this.setState({ isAuthenticated: true });
        })
        .catch((error) => {
          console.error("Authentication failed:", error);
          this.setState({ errorMessage: "Failed to authenticate with Google." });
        });
    } else {
      this.setState({ errorMessage: "Google API client is not initialized yet." });
    }
  };

  extractSheetId = (url) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : "";
  };

  fetchSheetData = () => {
    const sheetId = this.extractSheetId(this.state.sheetLink);
    if (!sheetId) {
      alert("Please enter a valid Google Sheet link.");
      return;
    }

    if (!gapi.client.sheets) {
      alert("Google Sheets API client is not initialized. Try again later.");
      return;
    }

    const range = "Sheet1!A1:Z1000";
    gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: sheetId,
        range: range,
      })
      .then((response) => {
        const data = response.result.values;
        if (data) {
          this.setState({ sheetData: data });
        } else {
          alert("No data found in the sheet.");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        this.setState({ errorMessage: "Failed to fetch data. Ensure the Sheet ID and permissions are correct." });
      });
  };

  handleSheetLinkChange = (e) => {
    this.setState({ sheetLink: e.target.value.trim() });
  };

  render() {
    const { isAuthenticated, sheetLink, errorMessage, sheetData } = this.state;

    return (
      <div className="App">
        <h1>Google me Sheets Viewer</h1>
        {!isAuthenticated ? (
          <button onClick={this.handleAuthClick}>Connect with Google</button>
        ) : (
          <div>
            <input
              type="text"
              placeholder="Enter Google Sheet Link"
              value={sheetLink}
              onChange={this.handleSheetLinkChange}
            />
            <button onClick={this.fetchSheetData}>Import</button>
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
}

export default App;