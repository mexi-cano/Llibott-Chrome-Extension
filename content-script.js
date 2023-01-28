console.log('CONTENT SCRIPT RUNNING.');

// listens for athenaConvertToInsurance event
chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name === "athenaConnection");
  port.onMessage.addListener(function(msg) {
    if (msg.message === "athenaConvertToInsurance") {
      // Perform the necessary actions to convert to insurance
      // and send a message back to the sender indicating success or failure
      console.log('starting insurance conversion.');
      convertToInsurance(port);
    };
  });
});


// listens for athenaConvertToPractice event
chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name === "athenaConnection");
  port.onMessage.addListener(function(msg) {
    if (msg.message === "athenaConvertToPractice") {
      // Perform the necessary actions to convert to insurance
      // and send a message back to the sender indicating success or failure
      console.log('starting practice conversion.');
      convertToPractice(port);
    };
  });
});


function focusOnWindow(){
  var iframe = document.getElementById('GlobalWrapper');
  var iframeDoc = iframe.contentWindow.document;
  // var frWrapper = iframeDoc.getElementById("frWrapper");
  var frameContent = iframeDoc.getElementById("frameContent");
  var frameContentDoc = frameContent.contentWindow.document;
  var frMain = frameContentDoc.getElementById("frMain");
  var frMainDoc = frMain.contentWindow.document;

  return frMainDoc;
};

// 
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