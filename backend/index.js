const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🔗 MongoDB connection
mongoose
  .connect("mongodb+srv://Vidhya:1234@cluster0.7mrje4x.mongodb.net/passkey?appName=Cluster0")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 📦 Credential model (collection: bulkmail)
const Credential = mongoose.model(
  "credential",
  new mongoose.Schema({}, { strict: false }),
  "bulkmail"
);

// 📩 Send Email API (Updated for subject and progress)
app.post("/sendemail", async (req, res) => {
  try {
    const { msg, subject, emailList } = req.body;

    // Validation
    if (!msg || !subject || !emailList || emailList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message, subject, or email list missing ❌",
      });
    }

    // Fetch credentials
    const credentials = await Credential.find();
    if (!credentials.length) {
      return res.json({
        success: false,
        message: "No email credentials found ❌",
      });
    }

    const { user, pass } = credentials[0];

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass, // Gmail App Password
      },
    });

    console.log(`📨 Sending emails to ${emailList.length} recipients...`);

    let sentCount = 0;
    // Send emails sequentially for progress tracking
    const results = [];
    for (const email of emailList) {
      try {
        await transporter.sendMail({
          from: user,
          to: email,
          subject: subject, // Use custom subject
          text: msg,
        });
        console.log(`✅ Email sent to: ${email}`);
        results.push(true);
      } catch (err) {
        console.error(`❌ Failed to send to ${email}:`, err.message);
        results.push(false);
      }
      sentCount++;
      // Optional: Emit progress via WebSocket or just log (for now)
    }

    const failedCount = results.filter((r) => !r).length;

    // Response
    return res.json({
      success: failedCount === 0,
      message:
        failedCount === 0
          ? "All emails sent successfully ✅"
          : `${failedCount} emails failed ❌`,
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error ❌",
    });
  }
});

// 🚀 Start server
app.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});