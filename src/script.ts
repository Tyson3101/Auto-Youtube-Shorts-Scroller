const errMsg = document.querySelector("#error") as HTMLParagraphElement;
const vaildUrls = ["youtube.com/shorts", "youtube.com/hashtag/shorts"];

document.onclick = (e: Event) => {
  if ((e.target as HTMLButtonElement).id === "stop")
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (vaildUrls.some((url) => tabs[0]?.url?.includes(url)))
        chrome.tabs.sendMessage(tabs[0].id, {
          start: false,
          stop: true,
        });
      else errMsg.innerText = "Only works for Shorts!";
    });
  if ((e.target as HTMLButtonElement).id === "start") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (vaildUrls.some((url) => tabs[0]?.url?.includes(url)))
        chrome.tabs.sendMessage(tabs[0].id, {
          start: true,
          stop: false,
        });
      else errMsg.innerText = "Only works for Shorts!";
    });
  }
};
