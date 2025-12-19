const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🔗 MongoDB connection (USE ENV VARIABLE)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 📦 Credential model (collection: bulkmail)
const Credential = mongoose.model(
  "credential",
  new mongoose.Schema({}, { strict: false }),
  "bulkmail"
);

// ✅ Test route (IMPORTANT for Render)
app.get("/", (req, res) => {
  res.send("Bulk Mail Backend is running ✅");
});

// 📩 Send Email API
app.post("/sendemail", async (req, res) => {
  try {
    const { msg, subject, emailList } = req.body;

    if (!msg || !subject || !emailList || emailList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message, subject, or email list missing ❌",
      });
    }

    const credentials = await Credential.find();
    if (!credentials.length) {
      return res.json({
        success: false,
        message: "No email credentials found ❌",
      });
    }

    const { user, pass } = credentials[0];

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    let failedCount = 0;

    for (const email of emailList) {
      try {
        await transporter.sendMail({
          from: user,
          to: email,
          subject,
          text: msg,
        });
        console.log(`✅ Email sent to ${email}`);
      } catch (err) {
        failedCount++;
        console.error(`❌ Failed for ${email}:`, err.message);
      }
    }

    res.json({
      success: failedCount === 0,
      message:
        failedCount === 0
          ? "All emails sent successfully ✅"
          : `${failedCount} emails failed ❌`,
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ success: false, message: "Server error ❌" });
  }
});

// 🚀 START SERVER (RENDER SAFE)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
