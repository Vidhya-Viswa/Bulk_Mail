require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const app = express();

app.use(
  cors({
    origin: ["https://bulk-mail-roan.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

let transporter;
function initNodemailer() {
  console.log("🔧 Initializing Nodemailer...");
  console.log("GMAIL_USER:", process.env.GMAIL_USER);
  console.log("GMAIL_PASS:", process.env.GMAIL_PASS ? "Loaded" : "Not loaded");

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error("❌ Missing GMAIL_USER or GMAIL_PASS in .env");
    return;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  // Test the transporter
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Nodemailer verification failed:", error);
    } else {
      console.log("📧 Nodemailer initialized and verified with Gmail ✅");
    }
  });
}

initNodemailer();

app.get("/", (req, res) => {
  res.send("Bulk Mail Backend with Gmail is running ✅");
});

app.post("/sendemail", async (req, res) => {
  console.log("📨 Received send request:", req.body);
  try {
    const { msg, subject, emailList } = req.body;

    if (!msg || !subject || !Array.isArray(emailList) || emailList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message, subject, or email list missing ❌",
      });
    }

    if (!transporter) {
      return res.status(500).json({
        success: false,
        message: "Nodemailer not initialized ❌",
      });
    }

    const results = await Promise.all(
      emailList.map(async (email) => {
        try {
          const info = await transporter.sendMail({
            from: `"Bulk Mail App" <${process.env.GMAIL_USER}>`,
            to: email,
            subject,
            text: msg,
            html: `<p>${msg.replace(/\n/g, '<br>')}</p>`,
          });
          console.log(`✅ Sent to ${email}, Message ID: ${info.messageId}`);
          return { email, success: true };
        } catch (err) {
          console.error(`❌ Failed for ${email}:`, err.message);
          return { email, success: false, error: err.message };
        }
      })
    );

    const failed = results.filter((r) => !r.success);
    const successCount = results.length - failed.length;

    res.json({
      success: failed.length === 0,
      message: failed.length === 0 ? `All ${results.length} emails sent successfully ✅` : `${successCount} emails sent, ${failed.length} failed ❌`,
      failedEmails: failed,
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ success: false, message: "Server error ❌" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});