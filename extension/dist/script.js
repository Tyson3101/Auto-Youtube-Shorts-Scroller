const errMsg = document.querySelector("#error");
const vaildUrls = ["youtube.com/shorts", "youtube.com/hashtag/shorts"];
document.onclick = (e) => {
  if (e.target.id === "stop")
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (vaildUrls.some((url) => tabs[0]?.url?.includes(url)))
        chrome.tabs.sendMessage(tabs[0].id, {
          start: false,
          stop: true,
        });
      else errMsg.innerText = "Only works for Shorts!";
    });
  if (e.target.id === "start") {
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
