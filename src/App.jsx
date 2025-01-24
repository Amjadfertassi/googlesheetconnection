import React from 'react';
import './App.css';

const CLIENT_ID = "813118908770-1uo8bbufd3lrsajb16guickuk98i9id0.apps.googleusercontent.com";
const API_KEY = "AIzaSyAoG0-AepMg9D4a5xuQl9zPcr42IDwWWrc";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuthenticated: false,
      sheetData: [],
      errorMessage: "",
    };
    this.tokenClient = null;
  }

  componentDidMount() {
    // Load the Google Identity Services library
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      this.initializeGoogleClient();
    };
  }

  initializeGoogleClient = async () => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (response) => {
          if (response.access_token) {
            this.setState({ isAuthenticated: true });
            // Initialize the Google API client after getting the token
            await this.initializeGapiClient(response.access_token);
          }
        },
      });
      this.tokenClient = client;
    } catch (error) {
      console.error('Error initializing Google client:', error);
      this.setState({ errorMessage: 'Failed to initialize Google client' });
    }
  };

  initializeGapiClient = async (accessToken) => {
    await gapi.load('client:picker', async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [
          "https://sheets.googleapis.com/$discovery/rest?version=v4",
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
        ],
      });
      gapi.client.setToken({ access_token: accessToken });
      console.log("Google API client initialized.");
    });
  };

  handleAuthClick = () => {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken();
    } else {
      this.setState({ errorMessage: "Authentication client not initialized" });
    }
  };

  createPicker = () => {
    const token = gapi.client.getToken()?.access_token;
    if (!token) {
      this.setState({ errorMessage: "Not authenticated. Please sign in first." });
      return;
    }

    const view = new google.picker.View(google.picker.ViewId.SPREADSHEETS);
    const picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .setAppId(CLIENT_ID.split('-')[0])
      .setOAuthToken(token)
      .addView(view)
      .setCallback(this.pickerCallback)
      .build();
    picker.setVisible(true);
  };

  pickerCallback = (data) => {
    if (data.action === google.picker.Action.PICKED) {
      const fileId = data[google.picker.Response.DOCUMENTS][0].id;
      this.fetchSheetData(fileId);
    }
  };

  fetchSheetData = (sheetId) => {
    if (!gapi.client.sheets) {
      this.setState({ errorMessage: "Google Sheets API client is not initialized. Try again later." });
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
          this.setState({ sheetData: data, errorMessage: "" });
        } else {
          this.setState({ errorMessage: "No data found in the sheet." });
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        this.setState({ errorMessage: "Failed to fetch data. Ensure you have permission to access this spreadsheet." });
      });
  };

  render() {
    const { isAuthenticated, errorMessage, sheetData } = this.state;

    return (
      <div className="App">
        <h1>Google Sheets Viewer</h1>
        {!isAuthenticated ? (
          <button onClick={this.handleAuthClick}>Connect with Google</button>
        ) : (
          <div>
            <button onClick={this.createPicker}>Select Spreadsheet</button>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            {sheetData.length > 0 && (
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
            )}
          </div>
        )}
      </div>
    );
  }
}

export default App;