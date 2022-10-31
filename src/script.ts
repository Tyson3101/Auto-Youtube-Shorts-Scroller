const YOUTUBE_LINK = "youtube.com"
const errMsg = document.querySelector("#error") as HTMLParagraphElement;
const toggleBtn = document.querySelector(".toggleBtn") as HTMLButtonElement;
const validUrls = [`${YOUTUBE_LINK}/shorts`, `${YOUTUBE_LINK}/hashtag/shorts`];

chrome.storage.onChanged.addListener(result => {
  changeToggleButton(result.applicationIsOn.newValue);
});

chrome.storage.local.get(["applicationIsOn"], result => {
  changeToggleButton(result.applicationIsOn);
});

document.onclick = (e: Event) => {
  if ((e.target as HTMLButtonElement).classList.contains("toggleBtn"))
    chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
      if (validUrls.some(url => tabs[0]?.url?.includes(url)))
        chrome.tabs.sendMessage(tabs[0].id, { toggle: true });
      else
        errMsg.innerText = "Only works for Youtube!";
    });
  if ((e.target as HTMLButtonElement).id === "shortCutBtn")
    document.querySelector(".shortCut").classList.toggle("remove");
};

function changeToggleButton(result: boolean) {
    toggleBtn.innerText = result ? "Stop" : "Start";
    toggleBtn.classList.remove(result ? "start" : "stop");
    toggleBtn.classList.add(result ? "stop" : "start");
}
