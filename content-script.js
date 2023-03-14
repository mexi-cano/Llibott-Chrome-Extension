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


function getAthenaOrders(port){
  let orderArray = [];
  let orderCount = 0;

  const frMainDoc = focusOnWindow();

  let orderItem = frMainDoc.querySelectorAll('.orders .order .accordion-trigger');

  orderItem.forEach((order) => {
    console.log('orderCount:', orderCount + 1)
    // Perform action on each order element
    order.click();
    orderCount += 1;
  });

  //grab all orders listed in dropdowns
  const selectElement = frMainDoc.querySelectorAll('select[name="ClinicalProviderOrderTypeID"]');
  selectElement.forEach((order) => {
    if (selectElement) {
      const selectedText = order.selectedOptions[0].text;
      orderArray.push(selectedText);
    };
  });

  // grab all listed orders
  const athenaOrders = frMainDoc.querySelectorAll('span.clinical-provider-order-type-note');
  athenaOrders.forEach(function(title) {
    orderArray.push(title.textContent.replace(/(\r\n|\n|\r|\t)/gm, ""));
  });

  orderArray = extractLabCorpCodes(orderArray);
  console.log('orderArray:', orderArray);

  // Set data in the storage
  chrome.storage.local.set({labs: JSON.stringify(orderArray)})
  .then(function() {
    console.log('Data is saved in the storage');
  })
  .catch(function(error) {
    console.error('Error occurred while saving data in the storage', error);
  });

  port.postMessage({status: "athenaGrabOrders-success", labs: orderArray});
  console.log('postMessage sent.');
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

    if (msg.message === "athenaGrabOrders") {
      // Perform the necessary actions to convert to insurance
      // and send a message back to the sender indicating success or failure
      console.log('Fetching athena orders.');
      getAthenaOrders(port);
    };

    if (msg.message === "addAthenaOrders") {
      // Perform the necessary actions to convert to insurance
      // and send a message back to the sender indicating success or failure
      console.log('Transfering athena orders.');
      addAthenaOrders(port);
    };
  });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // if( request.message === "athenaGrabOrders" ) {
    //   console.log("athenaGrabOrders button was clicked!");
    //   getAthenaOrders(port);
    //   sendResponse({status: "athenaGrabOrders-success"});
    // };

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

  let orderItem = frMainDoc.querySelectorAll('.orders .order .accordion-trigger');
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


function addAthenaOrders(port){
  const importOrdersButton = document.getElementById('importOrdersButton');

  // Get data from the storage
  chrome.storage.local.get(['labs'])
  .then(function(result) {
      alert('Value currently is ' + result.labs);
      importOrdersButton.setAttribute('data-value', `${result.labs}`);
      importOrdersButton.click();
  })
  .catch(function(error) {
      console.error('Error occurred while retrieving data from the storage', error);
  });
}

// Helpers
function extractLabCorpCodes(arr) {
  const result = {};
  for (let i = 0; i < arr.length; i++) {
    const parts = arr[i].split('|').map(s => s.trim());
    if (parts.length === 2 && !result[parts[0]]) {
      result[parts[0]] = parts[1];
    }
  };
  // const resultObj = Object.assign({}, result); // Make a copy of the result object
  // navigator.clipboard.writeText(JSON.stringify(resultObj)); // Copy the result to the clipboard
  return result;
}