require("dotenv").config();
const express = require("express");
const app = express();

const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { GoogleAIFileManager } = require("@google/generative-ai/server");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.API_KEY;
const fileManager = new GoogleAIFileManager(apiKey);
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
});

app.post("/", async (req, res) => {
  try {
    const { mimeType, fileUri, question } = req.body;
    const result = await model.generateContent([
      {
      fileData: {
        mimeType: mimeType || "video/mp4",
        fileUri: fileUri || "https://generativelanguage.googleapis.com/v1beta/files/wk0yyr68dx5c"
      }
    },
    { text: question },
  ]);

  res.json({
    success: true,
      message: "File uploaded successfully",
      text: result.response.text(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message
    });
  }
});


app.get("/list", async (req, res) => {
  const list = await fileManager.listFiles();
  res.json({
    success: true,
    message: "File uploaded successfully",
    list,
  });
});

app.post("/upload", upload.single('file'), async (req, res) => {
  try {
    const data = await fileManager.uploadFile(req.file.path, {
      mimeType: req.file.mimetype,
      displayName: req.file.originalname,
    });

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        fileUri: data.file.uri,
        mimeType: data.file.mimeType,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message
    });
  }
});

app.delete("/delete", async (req, res) => {
  const fileName = req.body.fileName;
  await fileManager.deleteFile(fileName);
  res.json({
    success: true,
    message: `${fileName} file deleted successfully`,
  });
});

app.get("/cache/files", async (req, res) => {
  try {
    const directory = 'uploads';
    const files = fs.readdirSync(directory);
    
    const fileDetails = files.map(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });
    
    res.json({
      success: true,
      message: "Files listed successfully",
      files: fileDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to list files",
      error: error.message
    });
  }
});

app.get("/cache/cleanup", async (req, res) => {
  try {
    const directory = 'uploads';
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      fs.unlinkSync(path.join(directory, file));
    }
    
    res.json({
      success: true,
      message: "All files deleted from uploads folder successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cleanup failed",
      error: error.message
    });
  }
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
