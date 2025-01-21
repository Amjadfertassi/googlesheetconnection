require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sheetsService = require('./services/sheets');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/sheets/data', async (req, res) => {
  try {
    const { accessToken, range } = req.body;
    const data = await sheetsService.getSheetData(accessToken, range);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});