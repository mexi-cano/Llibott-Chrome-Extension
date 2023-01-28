console.log('POPUP SCRIPT RUNNING.')

document.addEventListener('DOMContentLoaded', function() {
    const athenaConvertToInsurance = document.getElementById('athenaConvertToInsurance');
    const athenaConvertToPractice = document.getElementById('athenaConvertToPractice');
    const successAlert = document.querySelector('#success-alert');


    // opens long-lived connection
    athenaConvertToInsurance.addEventListener('click', function() {
        console.log('Trigger athenaConvertToInsurance.click()');

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTab = tabs[0];
            var port = chrome.tabs.connect(activeTab.id, {name: "athenaConnection"});
            port.postMessage({"message": "athenaConvertToInsurance"});
            port.onMessage.addListener(function(msg) {
                if (msg.status === "athenaConvertToInsurance-success") {
                    console.log("athenaConvertToInsurance response received:", msg);
                    successAlert.classList.toggle('collapse');
                    setTimeout(function(){
                        successAlert.classList.toggle('collapse');
                      }, 2500);
                };
            });
        });
    });

    // opens long-lived connection
    athenaConvertToPractice.addEventListener('click', function() {
        console.log('Trigger athenaConvertToPractice.click()');

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTab = tabs[0];
            var port = chrome.tabs.connect(activeTab.id, {name: "athenaConnection"});
            port.postMessage({"message": "athenaConvertToPractice"});
            port.onMessage.addListener(function(msg) {
                if (msg.status === "athenaConvertToPractice-success") {
                    console.log("athenaConvertToPractice response received:", msg);
                    successAlert.classList.toggle('collapse');
                    setTimeout(function(){
                        successAlert.classList.toggle('collapse');
                      }, 2500);
                };
            });
        });
    });

  });