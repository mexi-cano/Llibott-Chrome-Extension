console.log('POPUP SCRIPT RUNNING.')

document.addEventListener('DOMContentLoaded', function() {
    const athenaGrabOrdersButton = document.getElementById('athenaGrabOrdersButton');
    const athenaConvertToInsurance = document.getElementById('athenaConvertToInsurance');
    const athenaConvertToPractice = document.getElementById('athenaConvertToPractice');
    const addAthenaOrdersButton = document.getElementById('addAthenaOrders');
    const calcASCVDRiskButton = document.getElementById('calcASCVDRisk');
    const successAlert = document.querySelector('#success-alert');
    const loaderSpinner = document.querySelector('#loaderSpinner');
    
    const openLongLivedConnection = (message, successStatus, failedStatus) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTab = tabs[0];
            var port = chrome.tabs.connect(activeTab.id, {name: "athenaConnection"});
            port.postMessage({"message": message});
            port.onMessage.addListener(function(msg) {
                if (msg.status === successStatus) {
                    loaderSpinner.classList.toggle('collapse');
                    setTimeout(function(){
                        successAlert.classList.toggle('collapse');
                    }, 2500);
                    navigator.clipboard.writeText(JSON.stringify(msg.labs));
                } else if (msg.status === failedStatus){
                    loaderSpinner.classList.toggle('collapse');
                };
            });
        });
    };

    // Adds orders to fee schedule
    addAthenaOrdersButton.addEventListener('click', function() {
        loaderSpinner.classList.toggle('collapse');
        openLongLivedConnection("addAthenaOrders", "addAthenaOrders-success", "addAthenaOrders-failed");
    });
    
    athenaGrabOrdersButton.addEventListener('click', function() {
        loaderSpinner.classList.toggle('collapse');
        openLongLivedConnection("athenaGrabOrders", "athenaGrabOrders-success", "athenaGrabOrders-failed");
    });
    
    athenaConvertToInsurance.addEventListener('click', function() {
        loaderSpinner.classList.toggle('collapse');
        openLongLivedConnection("athenaConvertToInsurance", "athenaConvertToInsurance-success", "athenaConvertToInsurance-failed");
    });
    
    athenaConvertToPractice.addEventListener('click', function() {
        loaderSpinner.classList.toggle('collapse');
        openLongLivedConnection("athenaConvertToPractice", "athenaConvertToPractice-success", "athenaConvertToPractice-failed");
    });

    calcASCVDRiskButton.addEventListener('click', function() {
        loaderSpinner.classList.toggle('collapse');
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
        openLongLivedConnection("calcASCVDRisk", "calcASCVDRisk-success", "calcASCVDRisk-failed");
    });
});