const video = document.getElementById("myVideo");
const videoSource = document.getElementById("videoSource");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const speedDisplay = document.getElementById("speedDisplay");
const browseText = document.getElementById("browseText");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const playerContainer = document.getElementById("playerContainer");

// guard to avoid recursive fullscreen switching
let isSwitchingFullscreen = false;

/* ----------------- File + Drag & Drop ----------------- */
browseText.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", function () {
  if (this.files.length > 0) loadVideoFile(this.files[0]);
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("video/")) loadVideoFile(file);
  else alert("Please drop a valid video file.");
});

function loadVideoFile(file) {
  const videoURL = URL.createObjectURL(file);
  videoSource.src = videoURL;
  video.load();
  video.play();
}

/* ----------------- Basic Controls ----------------- */
function forward10() {
  video.currentTime += 10;
  showControlsAndResetTimer();
}
function rewind10() {
  video.currentTime -= 10;
  if (video.currentTime < 0) video.currentTime = 0;
  showControlsAndResetTimer();
}
function increaseSpeed() {
  video.playbackRate = parseFloat((video.playbackRate + 0.05).toFixed(2));
}
function decreaseSpeed() {
  video.playbackRate = parseFloat((video.playbackRate - 0.05).toFixed(2));
  if (video.playbackRate < 0.1) video.playbackRate = 0.1;
}
function updateSpeedDisplay() {
  speedDisplay.value = video.playbackRate.toFixed(2) + "x";
}
video.addEventListener("ratechange", updateSpeedDisplay);
speedDisplay.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    let inputVal = speedDisplay.value.toLowerCase().replace("x", "").trim();
    let newSpeed = parseFloat(inputVal);
    if (!isNaN(newSpeed) && newSpeed > 0) video.playbackRate = newSpeed;
    else updateSpeedDisplay();
  }
});
updateSpeedDisplay();

/* --- NEW: Keyboard Shortcuts (J & L keys) --- */

document.addEventListener("keydown", (e) => {
  // Get the tag name of the currently focused element
  const activeTagName = document.activeElement.tagName.toLowerCase();

  // Don't trigger shortcuts if user is typing in an input or textarea
  if (activeTagName === "input" || activeTagName === "textarea") {
    return;
  }
  
  // Use a switch statement for different keys
  switch (e.key.toLowerCase()) {
    case "l": // Fast-forward 10s
      forward10();
      break;
    case "j": // Rewind 10s
      rewind10();
      break;
  }
});

/* ----------------- Fullscreen Handling ----------------- */

/* helper: check if element is fullscreen (cross-browser) */
function isFullscreenElement(el) {
  return (
    document.fullscreenElement === el ||
    document.webkitFullscreenElement === el ||
    document.mozFullScreenElement === el ||
    document.msFullscreenElement === el
  );
}

/* toggle fullscreen on our container (user gesture) */
fullscreenBtn.addEventListener("click", () => {
  // If nothing is fullscreen, request container fullscreen
  if (
    !document.fullscreenElement &&
    !document.webkitFullscreenElement &&
    !document.mozFullScreenElement
  ) {
    if (playerContainer.requestFullscreen) playerContainer.requestFullscreen();
    else if (playerContainer.webkitRequestFullscreen)
      playerContainer.webkitRequestFullscreen();
    else if (playerContainer.msRequestFullscreen)
      playerContainer.msRequestFullscreen();
  } else {
    // exit fullscreen
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  }
});

/* when fullscreen target changes, update UI and try to migrate
   fullscreen from video -> container so custom controls are visible */
function onFullScreenChange() {
  // add/remove class for styling
  if (isFullscreenElement(playerContainer)) {
    playerContainer.classList.add("fullscreen-active");
    fullscreenBtn.textContent = "⛶ Exit Fullscreen";
  } else {
    playerContainer.classList.remove("fullscreen-active");
    fullscreenBtn.textContent = "⛶ Fullscreen";
  }

  // If video was made fullscreen (native button), try to switch to container
  const videoIsFs =
    document.fullscreenElement === video ||
    document.webkitFullscreenElement === video ||
    document.mozFullScreenElement === video ||
    document.msFullscreenElement === video;

  const containerIsFs = isFullscreenElement(playerContainer);

  if (videoIsFs && !containerIsFs && !isSwitchingFullscreen) {
    // attempt to migrate fullscreen to the container
    isSwitchingFullscreen = true;

    // Exit current fullscreen (the video) first, then request container fullscreen.
    // Use a tiny delay to help browsers that require a gesture or sequence.
    const doExit = document.exitFullscreen
      ? document.exitFullscreen()
      : document.webkitExitFullscreen
      ? Promise.resolve(document.webkitExitFullscreen())
      : Promise.resolve();

    Promise.resolve(doExit)
      .catch(() => {
        // ignore errors
      })
      .finally(() => {
        setTimeout(() => {
          // try to request fullscreen on container
          try {
            if (playerContainer.requestFullscreen)
              playerContainer.requestFullscreen();
            else if (playerContainer.webkitRequestFullscreen)
              playerContainer.webkitRequestFullscreen();
            else if (playerContainer.msRequestFullscreen)
              playerContainer.msRequestFullscreen();
          } catch (err) {
            // some browsers block programmatic requests without a direct user gesture
            console.warn("Could not migrate fullscreen to container:", err);
          } finally {
            // release guard after short delay
            setTimeout(() => (isSwitchingFullscreen = false), 350);
          }
        }, 60);
      });
  }
}

/* cross-browser fullscreenchange */
document.addEventListener("fullscreenchange", onFullScreenChange);
document.addEventListener("webkitfullscreenchange", onFullScreenChange);
document.addEventListener("mozfullscreenchange", onFullScreenChange);
document.addEventListener("MSFullscreenChange", onFullScreenChange);

/* ------------------------------------------------------------------ */
/* --- NEW: Auto-Hide Controls on Inactivity --- */
/* ------------------------------------------------------------------ */

const controls = document.querySelector(".controls");
let inactivityTimer;

// Function to hide the controls
function hideControls() {
  // Only hide if we are in fullscreen mode
  if (playerContainer.classList.contains("fullscreen-active")) {
    controls.classList.add("hidden");
  }
}

// Function to show controls and reset the hide timer
function showControlsAndResetTimer() {
  // First, remove the .hidden class to make sure controls are visible
  controls.classList.remove("hidden");

  // Clear any existing timer
  clearTimeout(inactivityTimer);

  // Start a new timer. If the mouse doesn't move for 3 seconds, hide the controls.
  inactivityTimer = setTimeout(hideControls, 8000);
}

// Listen for mouse movement on the whole player
playerContainer.addEventListener("mousemove", showControlsAndResetTimer);

// Also, when the fullscreen status changes, reset the timer
document.addEventListener("fullscreenchange", () => {
  if (isFullscreenElement(playerContainer)) {
    showControlsAndResetTimer();
  }
});
document.addEventListener("webkitfullscreenchange", () => {
  if (isFullscreenElement(playerContainer)) {
    showControlsAndResetTimer();
  }
});