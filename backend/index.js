require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Resend } = require("resend"); // Fixed: Destructure to get the Resend class

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(
  cors({
    origin: ["https://bulk-mail-roan.vercel.app", "http://localhost:3000"], // Allow localhost for dev
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

/* -------------------- RESEND INIT -------------------- */
let resend;
function initResend() {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY not found in .env");
    return;
  }
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("📧 Resend initialized with API key from .env");
}

initResend(); // Initialize immediately

/* -------------------- ROUTES -------------------- */
app.get("/", (req, res) => {
  res.send("Bulk Mail Backend with Resend is running ✅");
});

app.post("/sendemail", async (req, res) => {
  console.log("📨 Received send request:", req.body); // Debug
  try {
    const { msg, subject, emailList } = req.body;

    if (!msg || !subject || !Array.isArray(emailList) || emailList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message, subject, or email list missing ❌",
      });
    }

    if (!resend) {
      return res.status(500).json({
        success: false,
        message: "Resend service not initialized ❌",
      });
    }

    const results = await Promise.all(
      emailList.map(async (email) => {
        try {
          await resend.emails.send({
            from: "Vidhya V <vidhyaviswa20@gmail.com>", // Ensure this is verified in Resend
            to: email,
            subject,
            text: msg,
            html: `<p>${msg.replace(/\n/g, '<br>')}</p>`,
          });
          console.log(`✅ Sent to ${email}`);
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
      message:
        failed.length === 0
          ? `All ${results.length} emails sent successfully ✅`
          : `${successCount} emails sent, ${failed.length} failed ❌`,
      failedEmails: failed,
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ success: false, message: "Server error ❌" });
  }
});

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});