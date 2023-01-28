console.log('BACKGROUND SCRIPT RUNNING.');

chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    if (activeTab.url === "https://feeschedule.llibott.com/") {
      console.log('Fee schedule tab detected.');
      console.log('injecting content-script.js');
      console.log('activeTab.id:', activeTab.id);
      chrome.scripting.executeScript({
				target: {tabId: activeTab.id},
				files: ["content-script.js"]
			});
    };
  });
});