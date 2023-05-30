console.log('BACKGROUND SCRIPT RUNNING.');

chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    if (activeTab.url === "https://feeschedule.llibott.com/") {
      chrome.scripting.executeScript({
				target: {tabId: activeTab.id},
				files: ["content-script.js"]
			});
    };
  });
});