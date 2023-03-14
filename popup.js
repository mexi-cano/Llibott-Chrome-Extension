console.log('POPUP SCRIPT RUNNING.')

document.addEventListener('DOMContentLoaded', function() {
    const athenaGrabOrdersButton = document.getElementById('athenaGrabOrdersButton');
    const athenaConvertToInsurance = document.getElementById('athenaConvertToInsurance');
    const athenaConvertToPractice = document.getElementById('athenaConvertToPractice');
    const feeScheduleAddOrdersButton = document.getElementById('feeScheduleAddOrdersButton');
    const addAthenaOrdersButton = document.getElementById('addAthenaOrders');
    const successAlert = document.querySelector('#success-alert');

    const sendMessageToActiveTab = (message, successStatus) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {"message": message}, function(response) {
                if (response.status === successStatus) {
                    console.log(`${message} response received:`, response);
                };
            });
        });
    }
    
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
                    // navigator.clipboard.writeText(`${msg.labs}`);
                };
            });
        });
    }

    addAthenaOrdersButton.addEventListener('click', function() {
        openLongLivedConnection("addAthenaOrders", "addAthenaOrders-success");
    });
    
    athenaGrabOrdersButton.addEventListener('click', function() {
        console.log('Trigger athenaGrabOrdersButton.click()');
        openLongLivedConnection("athenaGrabOrders", "athenaGrabOrders-success");
        successAlert.classList.toggle('collapse');
        setTimeout(function(){
            successAlert.classList.toggle('collapse');
        }, 2500);
    });
    
    athenaConvertToInsurance.addEventListener('click', function() {
        console.log('Trigger athenaConvertToInsurance.click()');
        openLongLivedConnection("athenaConvertToInsurance", "athenaConvertToInsurance-success");
    });
    
    athenaConvertToPractice.addEventListener('click', function() {
        console.log('Trigger athenaConvertToPractice.click()');
        openLongLivedConnection("athenaConvertToPractice", "athenaConvertToPractice-success");
    });

});