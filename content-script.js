console.log('CONTENT SCRIPT RUNNING.');

// Helper functions
function focusOnWindow(){
  let iframe = document.getElementById('GlobalWrapper');
  let iframeDoc = iframe.contentWindow.document;
  let frameContent = iframeDoc.getElementById("frameContent");
  let frameContentDoc = frameContent.contentWindow.document;
  let frMain = frameContentDoc.getElementById("frMain");
  let frMainDoc = frMain.contentWindow.document;

  return frMainDoc;
};

function addOrdersToFeeSchedule(){
  athenaOrders.forEach(function(title) {
    console.log(title.textContent);
  });
};

function getAthenaOrders(){
  let athenaOrders;
  let orderArray = [];

  const frMainDoc = focusOnWindow();

  athenaOrders = frMainDoc.querySelectorAll('span.title');

  athenaOrders.forEach(function(title) {
    orderArray.push(title.textContent);
    console.log(title.textContent);
  });
};

// Listeners
chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name === "athenaConnection");
  port.onMessage.addListener(function(msg) {
    if (msg.message === "athenaConvertToInsurance") {
      // Perform the necessary actions to convert to insurance
      // and send a message back to the sender indicating success or failure
      console.log('starting insurance conversion.');
      convertToInsurance(port);
    };

    if (msg.message === "athenaConvertToPractice") {
      // Perform the necessary actions to convert to insurance
      // and send a message back to the sender indicating success or failure
      console.log('starting practice conversion.');
      convertToPractice(port);
    };
  });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "athenaGrabOrders" ) {
      console.log("athenaGrabOrders button was clicked!");
      getAthenaOrders();
      sendResponse({status: "athenaGrabOrders-success"});
    };

    if( request.message === "feeScheduleAddOrders" ) {
      console.log("feeScheduleAddOrders button was clicked!");
      sendResponse({status: "feeScheduleAddOrders-success"});
      addOrdersToFeeSchedule();
    };
  }
);

// Conversion functions
function convertToInsurance(port) {
  const frMainDoc = focusOnWindow();
  let orderCount = 0;

  var orderItem = frMainDoc.querySelectorAll('.orders .order .accordion-trigger');
  orderItem.forEach((order) => {
    // Perform action on each order element
    order.click();
    console.log('opened orderItem.');

    const detailsView = frMainDoc.querySelector('.details-view');
    detailsView.classList.add('show-secondary');
    console.log('added "show-secondary" to detailsView classlist.');

    setTimeout(function(){
      // convert from 'PRACTICE' to 'INSURANCE'
      const orderBilling = frMainDoc.querySelectorAll(`span[data-value="INSURANCE"].select-bar-option`);

      if (orderBilling[orderCount]){
        orderBilling[orderCount].click();
      };

      order.click();
      console.log('orderItem closed');

      orderCount += 1;

      if (orderCount == orderBilling.length){
        port.postMessage({status: "athenaConvertToInsurance-success"});
        console.log('postMessage sent.');
      };

    }, 2000);
  });
};


function convertToPractice(port) {
  const frMainDoc = focusOnWindow();
  let orderCount = 0;

  var orderItem = frMainDoc.querySelectorAll('.orders .order .accordion-trigger');
  orderItem.forEach((order) => {
    // Perform action on each order element
    order.click();
    console.log('opened orderItem.');

    const detailsView = frMainDoc.querySelector('.details-view');
    detailsView.classList.add('show-secondary');
    console.log('added "show-secondary" to detailsView classlist.');

    setTimeout(function(){
      // convert from 'PRACTICE' to 'INSURANCE'
      const orderBilling = frMainDoc.querySelectorAll(`span[data-value="CLIENTBILL"].select-bar-option`);

      if (orderBilling[orderCount]){
        orderBilling[orderCount].click();
      };

      order.click();
      console.log('orderItem closed');

      orderCount += 1;

      if (orderCount == orderBilling.length){
        port.postMessage({status: "athenaConvertToPractice-success"});
        console.log('postMessage sent.');
      };

    }, 2000);
  });
};