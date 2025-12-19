require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(
  cors({
    origin: "https://bulk-mail-roan.vercel.app",
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

/* -------------------- MONGODB -------------------- */
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // ⬅ faster failure
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* -------------------- MODEL -------------------- */
const Credential = mongoose.model(
  "credential",
  new mongoose.Schema({}, { strict: false }),
  "bulkmail"
);

/* -------------------- MAIL TRANSPORTER (GLOBAL) -------------------- */
let transporter = null;

async function initMailer() {
  try {
    const credentials = await Credential.findOne();
    if (!credentials) {
      console.error("❌ No email credentials found in DB");
      return;
    }

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: credentials.user,
        pass: credentials.pass,
      },
    });

    console.log("📧 Mail transporter ready");
  } catch (err) {
    console.error("❌ Mail init error:", err);
  }
}

mongoose.connection.once("open", initMailer);

/* -------------------- ROUTES -------------------- */

// Health check (VERY IMPORTANT for Render)
app.get("/", (req, res) => {
  res.send("Bulk Mail Backend is running ✅");
});

// Send Email API
app.post("/sendemail", async (req, res) => {
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
        message: "Mail service not ready ❌",
      });
    }

    // Send emails in parallel
    const results = await Promise.all(
      emailList.map(async (email) => {
        try {
          await transporter.sendMail({
            from: transporter.options.auth.user,
            to: email,
            subject,
            text: msg,
          });
          console.log(`✅ Sent to ${email}`);
          return true;
        } catch (err) {
          console.error(`❌ Failed for ${email}:`, err.message);
          return false;
        }
      })
    );

    const failedCount = results.filter((r) => !r).length;

    res.json({
      success: failedCount === 0,
      message:
        failedCount === 0
          ? "All emails sent successfully ✅"
          : `${failedCount} emails failed ❌`,
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({
      success: false,
      message: "Server error ❌",
    });
  }
});

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
