require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Resend } = require("resend");

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
    serverSelectionTimeoutMS: 5000,
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

/* -------------------- RESEND -------------------- */
const resend = new Resend(process.env.RESEND_API_KEY);

/* -------------------- ROUTES -------------------- */

// Health check
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

    // Send emails in parallel
    const results = await Promise.all(
      emailList.map(async (email) => {
        try {
          await resend.emails.send({
            from: "Bulk Mail <onboarding@resend.dev>",
            to: email,
            subject: subject,
            html: `<p>${msg}</p>`,
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
