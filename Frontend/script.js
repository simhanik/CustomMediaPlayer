const video = document.getElementById("myVideo");
const videoSource = document.getElementById("videoSource");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const speedDisplay = document.getElementById("speedDisplay");
const browseText = document.getElementById("browseText");

// Open file dialog on click of "browse" text
browseText.addEventListener("click", () => fileInput.click());

// Handle file selection from input
fileInput.addEventListener("change", function () {
    if (this.files.length > 0) {
        loadVideoFile(this.files[0]);
    }
});

// Drag over
dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

// Drag leave
dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

// Drop
dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
        loadVideoFile(file);
    } else {
        alert("Please drop a valid video file.");
    }
});

// Load and play video
function loadVideoFile(file) {
    const videoURL = URL.createObjectURL(file);
    videoSource.src = videoURL;
    video.load();
    video.play();
}

// Controls
function forward10() {
    video.currentTime += 10;
}

function rewind10() {
    video.currentTime -= 10;
    if (video.currentTime < 0) video.currentTime = 0;
}

function increaseSpeed() {
    video.playbackRate = parseFloat((video.playbackRate + 0.05).toFixed(2));
}

function decreaseSpeed() {
    video.playbackRate = parseFloat((video.playbackRate - 0.05).toFixed(2));
    if (video.playbackRate < 0.1) video.playbackRate = 0.1;
}

// Show current speed
function updateSpeedDisplay() {
    speedDisplay.textContent = video.playbackRate.toFixed(2) + "x";
}

// 🔹 Listen for ANY speed change (from buttons OR default controls)
video.addEventListener("ratechange", updateSpeedDisplay);

// Initialize display
updateSpeedDisplay();
