require("dotenv").config();
const express = require("express");
const cors = require("cors");
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

/* -------------------- RESEND INIT -------------------- */
const resend = new Resend(process.env.RESEND_API_KEY);

/* -------------------- HEALTH CHECK -------------------- */
app.get("/", (req, res) => {
  res.send("Bulk Mail Backend is running ✅");
});

/* -------------------- SEND EMAIL -------------------- */
app.post("/sendemail", async (req, res) => {
  try {
    const { subject, msg, emailList } = req.body;

    if (!subject || !msg || !Array.isArray(emailList) || emailList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data ❌",
      });
    }

    let failed = 0;

    for (const email of emailList) {
      try {
        await resend.emails.send({
          from: "Bulk Mail <vidhyaviswa20@gmail.com>", // 🔴 MUST MATCH RESEND LOGIN
          to: email,
          subject: subject,
          text: msg,
        });
        console.log(`✅ Email sent to ${email}`);
      } catch (err) {
        failed++;
        console.error(`❌ Failed for ${email}`, err.message);
      }
    }

    res.json({
      success: failed === 0,
      message:
        failed === 0
          ? "All emails sent successfully ✅"
          : `${failed} emails failed ❌`,
    });
  } catch (err) {
    console.error("❌ Server error", err);
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
