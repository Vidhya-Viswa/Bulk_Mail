import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { FaPaperPlane, FaFileUpload, FaTrash, FaHistory, FaCheckCircle, FaExclamationTriangle, FaEnvelope, FaRocket } from "react-icons/fa";

function App() {
  const [msg, setMsg] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState(false);
  const [emailList, setEmailList] = useState([]);
  const [progress, setProgress] = useState(0);
  const [sendHistory, setSendHistory] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [errors, setErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false); // For fade-in animation

  // Fade-in effect on load
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Predefined templates
  const templates = {
    promotional: "🎉 Exciting Offer! Check out our latest deals and save big!",
    newsletter: "📧 Stay updated with our monthly newsletter featuring tips and trends.",
    reminder: "⏰ Friendly reminder: Don't miss out on our upcoming event!",
    custom: "",
  };

  // Handle inputs
  const handleMsg = (e) => {
    setMsg(e.target.value);
    setErrors({ ...errors, msg: "" });
  };
  const handleSubject = (e) => {
    setSubject(e.target.value);
    setErrors({ ...errors, subject: "" });
  };
  const handleTemplateChange = (e) => {
    const template = e.target.value;
    setSelectedTemplate(template);
    setMsg(templates[template] || "");
  };

  // Handle file upload
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const emails = XLSX.utils.sheet_to_json(worksheet, { header: "A" });
      const totalEmails = emails.map((item) => item.A).filter(Boolean);
      setEmailList(totalEmails);
      setErrors({ ...errors, file: "" });
      console.log("Emails loaded:", totalEmails);
    };
    reader.readAsBinaryString(file);
  };

  // Validate emails
  const validateEmails = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter((email) => !emailRegex.test(email));
    return invalidEmails.length === 0;
  };

  // Send emails
  const sendEmails = async () => {
    const newErrors = {};
    if (!subject.trim()) newErrors.subject = "Subject is required.";
    if (!msg.trim()) newErrors.msg = "Message is required.";
    if (emailList.length === 0) newErrors.file = "Please upload an Excel file with emails.";
    if (!validateEmails()) newErrors.emails = "Some emails are invalid.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStatus(true);
    setProgress(0);
    try {
      const res = await axios.post(
        "https://bulk-mail-backend-tz4n.onrender.com/sendemail",
        { msg, subject, emailList }
      );

      alert(res.data.message);
      if (res.data.success) {
        setSendHistory([...sendHistory, { subject, count: emailList.length, date: new Date().toLocaleString() }]);
        setMsg("");
        setSubject("");
        setEmailList([]);
        setSelectedTemplate("");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Backend error");
    } finally {
      setStatus(false);
      setProgress(100);
    }
  };

  // Clear all
  const clearAll = () => {
    setMsg("");
    setSubject("");
    setEmailList([]);
    setSelectedTemplate("");
    setErrors({});
    setProgress(0);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-black via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-4 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header with Dark Vibe */}
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white text-center py-6 px-8 rounded-t-2xl shadow-2xl w-full max-w-5xl transform hover:scale-105 transition-all duration-300 border border-emerald-600 glow-emerald">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3 text-emerald-300 animate-pulse">
          <FaRocket className="text-amber-400 animate-bounce" /> Bulk Mail App
        </h1>
        <p className="text-lg mt-2 opacity-80 text-slate-300">Send emails effortlessly with style!</p>
      </div>

      {/* Main Content with Harmonious Dark Interior */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl rounded-b-2xl w-full max-w-5xl p-8 md:p-10 lg:p-12 border border-indigo-600 glow-indigo">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-emerald-300 flex items-center gap-3">
              <FaEnvelope className="text-indigo-400 animate-pulse" /> Compose & Upload
            </h2>

            {/* Template Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Choose a Template</label>
              <select
                value={selectedTemplate}
                onChange={handleTemplateChange}
                className="w-full p-4 bg-slate-700 border-2 border-emerald-500 rounded-xl text-white placeholder-slate-400 focus:ring-4 focus:ring-indigo-400 focus:border-indigo-500 transition-all duration-300 hover:shadow-lg hover:border-indigo-500 hover:bg-slate-600"
              >
                <option value="" className="bg-slate-700">Select a template...</option>
                <option value="promotional" className="bg-slate-700">Promotional</option>
                <option value="newsletter" className="bg-slate-700">Newsletter</option>
                <option value="reminder" className="bg-slate-700">Reminder</option>
                <option value="custom" className="bg-slate-700">Custom</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Subject</label>
              <input
                type="text"
                value={subject}
                onChange={handleSubject}
                className="w-full p-4 bg-slate-700 border-2 border-emerald-500 rounded-xl text-white placeholder-slate-400 focus:ring-4 focus:ring-indigo-400 focus:border-indigo-500 transition-all duration-300 hover:shadow-lg hover:border-indigo-500 hover:bg-slate-600"
                placeholder="Enter a catchy subject..."
              />
              {errors.subject && <p className="text-red-500 text-sm mt-2 flex items-center gap-2"><FaExclamationTriangle /> {errors.subject}</p>}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Message Body</label>
              <textarea
                value={msg}
                onChange={handleMsg}
                className="w-full h-40 p-4 bg-slate-700 border-2 border-emerald-500 rounded-xl text-white placeholder-slate-400 focus:ring-4 focus:ring-indigo-400 focus:border-indigo-500 transition-all duration-300 hover:shadow-lg hover:border-indigo-500 hover:bg-slate-600 resize-none"
                placeholder="Write your message here..."
              />
              {errors.msg && <p className="text-red-500 text-sm mt-2 flex items-center gap-2"><FaExclamationTriangle /> {errors.msg}</p>}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Upload Email List (Excel)</label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFile}
                className="w-full p-4 bg-slate-700 border-2 border-dashed border-indigo-500 rounded-xl text-white hover:border-emerald-500 hover:bg-slate-600 transition-all duration-300 cursor-pointer focus:ring-4 focus:ring-indigo-400"
              />
              {errors.file && <p className="text-red-500 text-sm mt-2 flex items-center gap-2"><FaExclamationTriangle /> {errors.file}</p>}
              {errors.emails && <p className="text-red-500 text-sm mt-2 flex items-center gap-2"><FaExclamationTriangle /> {errors.emails}</p>}
            </div>

            {/* Email Count & Progress */}
            <p className="text-slate-300 font-medium">Emails Loaded: <span className="text-emerald-400 font-bold">{emailList.length}</span></p>
            {status && (
              <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden border border-emerald-500">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out animate-pulse"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={sendEmails}
                disabled={status}
                className="bg-gradient-to-r from-emerald-700 to-indigo-700 hover:from-emerald-600 hover:to-indigo-600 text-white py-4 px-8 rounded-xl font-bold transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:glow-emerald disabled:opacity-50 flex items-center gap-3"
                title="Send emails to the list"
              >
                <FaPaperPlane className="animate-bounce" /> {status ? "Sending..." : "Send Emails"}
              </button>
              <button
                onClick={clearAll}
                className="bg-gradient-to-r from-slate-600 to-red-700 hover:from-slate-500 hover:to-red-600 text-white py-4 px-8 rounded-xl font-bold transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:glow-red flex items-center gap-3"
                title="Reset the form"
              >
                <FaTrash /> Clear All
              </button>
            </div>
          </div>

          {/* Right: Preview & History */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-emerald-300 flex items-center gap-3">
              <FaHistory className="text-indigo-400 animate-pulse" /> Preview & History
            </h2>

            {/* Email Preview */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-indigo-500 hover:glow-indigo">
              <h3 className="font-bold text-emerald-300 mb-3 flex items-center gap-2"><FaEnvelope className="animate-pulse" /> Email Preview</h3>
              <p className="text-sm text-slate-300 mb-2"><strong className="text-indigo-400">Subject:</strong> {subject || "No subject yet"}</p>
              <p className="text-sm text-slate-300 mb-2"><strong className="text-indigo-400">Message:</strong> {msg || "No message yet"}</p>
              <p className="text-sm text-slate-300"><strong className="text-indigo-400">To:</strong> {emailList.slice(0, 5).join(", ")}{emailList.length > 5 ? "..." : ""}</p>
            </div>

            {/* Send History */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-emerald-500 hover:glow-emerald max-h-60 overflow-y-auto">
              <h3 className="font-bold text-emerald-300 mb-3 flex items-center gap-2"><FaHistory className="animate-pulse" /> Recent Sends</h3>
              {sendHistory.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No history yet—send your first email!</p>
              ) : (
                sendHistory.slice(-5).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 mt-3 p-3 bg-slate-600 rounded-lg shadow hover:shadow-md transition-all duration-200 border border-indigo-500 hover:glow-indigo">
                    <FaCheckCircle className="text-emerald-500 animate-bounce" />
                    <div>
                      <p className="text-sm font-medium text-white">{item.subject}</p>
                      <p className="text-xs text-slate-400">{item.count} emails • {item.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for Glow Effects */}
      <style jsx>{`
        .glow-emerald { box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
        .glow-indigo { box-shadow: 0 0 20px rgba(99, 102, 241, 0.5); }
        .glow-red { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
        .hover\\:glow-emerald:hover { box-shadow: 0 0 30px rgba(16, 185, 129, 0.8); }
        .hover\\:glow-indigo:hover { box-shadow: 0 0 30px rgba(99, 102, 241, 0.8); }
        .hover\\:glow-red:hover { box-shadow: 0 0 30px rgba(239, 68, 68, 0.8); }
      `}</style>
    </div>
  );
}

export default App;