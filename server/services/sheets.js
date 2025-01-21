const { google } = require('googleapis');

class SheetsService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
  }

  async getSheetData(accessToken, range = 'Sheet1!A1:D10') {
    this.oauth2Client.setCredentials({ access_token: accessToken });

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range,
      });
      return response.data.values;
    } catch (error) {
      throw new Error('Failed to fetch sheet data: ' + error.message);
    }
  }
}

module.exports = new SheetsService();