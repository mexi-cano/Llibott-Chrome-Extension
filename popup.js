console.log('POPUP SCRIPT RUNNING.')

document.addEventListener('DOMContentLoaded', function() {
    const athenaGrabOrdersButton = document.getElementById('athenaGrabOrdersButton');
    const athenaConvertToInsurance = document.getElementById('athenaConvertToInsurance');
    const athenaConvertToPractice = document.getElementById('athenaConvertToPractice');
    const feeScheduleAddOrdersButton = document.getElementById('feeScheduleAddOrdersButton');
    const successAlert = document.querySelector('#success-alert');

    const sendMessageToActiveTab = (message, successStatus) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {"message": message}, function(response) {
                if (response.status === successStatus) {
                    console.log(`${message} response received:`, response);
                }
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
                }
            });
        });
    }
    
    athenaGrabOrdersButton.addEventListener('click', function() {
        console.log('Trigger athenaGrabOrdersButton.click()');
        sendMessageToActiveTab("athenaGrabOrders", "athenaGrabOrders-success");
    });
    
    feeScheduleAddOrdersButton.addEventListener('click', function() {
        console.log('Trigger feeScheduleAddOrdersButton.click()');
        sendMessageToActiveTab("feeScheduleAddOrders", "feeScheduleAddOrders-success");
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