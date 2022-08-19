const NEXT_VIDEO_ARROW = "[aria-label='Next video']";

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

// -------
let applicationIsOn = true;

function startAutoScrolling() {
  applicationIsOn = true;
  getCurrentVideo();
}

async function getCurrentVideo() {
  let currentvideo = Array.from(document.querySelectorAll("video")).find(
    (video) =>
      !!(
        video.currentTime > 0 &&
        !video.paused &&
        !video.ended &&
        video.readyState > 2
      )
  );
  try {
    currentvideo.attributes.removeNamedItem("loop");
    currentvideo.addEventListener("ended", endVideoEvent);
  } catch {}
  await sleep(500);
  if (applicationIsOn) getCurrentVideo();
}
async function endVideoEvent() {
  console.log("Done");
  if (!applicationIsOn)
    return document.querySelector("video").removeEventListener("ended", this);
  document.querySelector(NEXT_VIDEO_ARROW)?.click();
}

startAutoScrolling();
