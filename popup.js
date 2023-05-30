console.log('POPUP SCRIPT RUNNING.')

document.addEventListener('DOMContentLoaded', function() {
    const athenaGrabOrdersButton = document.getElementById('athenaGrabOrdersButton');
    const athenaConvertToInsurance = document.getElementById('athenaConvertToInsurance');
    const athenaConvertToPractice = document.getElementById('athenaConvertToPractice');
    const addAthenaOrdersButton = document.getElementById('addAthenaOrders');
    const calcASCVDRiskButton = document.getElementById('calcASCVDRisk');
    const successAlert = document.querySelector('#success-alert');
    
    const openLongLivedConnection = (message, successStatus) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTab = tabs[0];
            var port = chrome.tabs.connect(activeTab.id, {name: "athenaConnection"});
            port.postMessage({"message": message});
            port.onMessage.addListener(function(msg) {
                if (msg.status === successStatus) {
                    console.log(`${message} response received:`, msg);
                    successAlert.classList.toggle('collapse');
                    setTimeout(function(){
                        successAlert.classList.toggle('collapse');
                    }, 2500);
                    console.log('msg.labs:', JSON.stringify(msg.labs));
                    navigator.clipboard.writeText(JSON.stringify(msg.labs));
                };
            });
        });
    };

    // Adds orders to fee schedule
    addAthenaOrdersButton.addEventListener('click', function() {
        openLongLivedConnection("addAthenaOrders", "addAthenaOrders-success");
    });
    
    athenaGrabOrdersButton.addEventListener('click', function() {
        console.log('Trigger athenaGrabOrdersButton.click()');
        openLongLivedConnection("athenaGrabOrders", "athenaGrabOrders-success");
    });
    
    athenaConvertToInsurance.addEventListener('click', function() {
        console.log('Trigger athenaConvertToInsurance.click()');
        openLongLivedConnection("athenaConvertToInsurance", "athenaConvertToInsurance-success");
    });
    
    athenaConvertToPractice.addEventListener('click', function() {
        console.log('Trigger athenaConvertToPractice.click()');
        openLongLivedConnection("athenaConvertToPractice", "athenaConvertToPractice-success");
    });

    calcASCVDRiskButton.addEventListener('click', function() {
        console.log('Trigger calcASCVDRiskButton.click()');
        const storeCheckboxState = () => {
            // Get the checkbox elements
            const aaCheckbox = document.getElementById('isAA');
            const smokerCheckbox = document.getElementById('currentSmoker');
          
            // Create an object to store the checkbox states
            const checkboxStates = {
              isAA: aaCheckbox.checked,
              currentSmoker: smokerCheckbox.checked
            };
          
            // Store the object in Chrome Extension's local storage
            chrome.storage.local.set({ checkboxStates }, function() {
              console.log('Checkbox states stored in local storage:', checkboxStates);
            });
          };

        storeCheckboxState();
        openLongLivedConnection("calcASCVDRisk", "calcASCVDRisk-success");
    });
});