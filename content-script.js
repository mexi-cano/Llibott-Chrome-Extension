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

  setTimeout(function(){
    //grab all orders listed in dropdowns
    const selectElement = frMainDoc.querySelectorAll('select[name="ClinicalProviderOrderTypeID"]');
    selectElement.forEach((order) => {
      if (selectElement) {
        const selectedText = order.selectedOptions[0].text;
        orderArray.push(selectedText);
      };
    });

    //grab ALL toplevel orders
    const allAthenaOrders = frMainDoc.querySelectorAll('span.title');
    allAthenaOrders.forEach((order) => {
      if (allAthenaOrders) {
        const athenaOrder = order.textContent.replace(/(\r\n|\n|\r|\t)/gm, "");
        const matchingOrder = findInHouseOrder(inHouseOrders, athenaOrder);
        if (matchingOrder) {
          console.log('matching athenaOrder:', matchingOrder);
          orderArray.push(matchingOrder);
        };
      };
    });

    // grab all orders with labcorp code
    const athenaOrders = frMainDoc.querySelectorAll('span.clinical-provider-order-type-note');
    athenaOrders.forEach(function(title) {
      orderArray.push(title.textContent.replace(/(\r\n|\n|\r|\t)/gm, ""));
    });

    console.log('original orderArray:', orderArray)

    orderArray = extractLabCorpCodes(orderArray);
    console.log('orderArray:', orderArray);

    // Set data in the storage
    chrome.storage.local.set({labs: JSON.stringify(orderArray)})
    .then(function() {
      console.log('Data is saved in storage');
      port.postMessage({status: "athenaGrabOrders-success", labs: orderArray});
      console.log('postMessage sent.');
    })
    .catch(function(error) {
      console.error('Error occurred while saving data in storage', error);
    });

  }, 2000);
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

// Adds athena orders to Fee Schedule
function addAthenaOrders(port){
  const importOrdersButton = document.getElementById('importOrdersButton');

   // Get data from the storage
   chrome.storage.local.get(['labs'])
   .then(function(result) {
       importOrdersButton.setAttribute('data-value', `${result.labs}`);
       importOrdersButton.click();
       chrome.storage.local.clear()
       console.log('Storage cleared');
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
};

function findInHouseOrder(inHouseOrders, athenaOrder) {
  for (let key in inHouseOrders) {
    if (inHouseOrders.hasOwnProperty(key)) {
      if (inHouseOrders[key].athena === athenaOrder) {
        return `${inHouseOrders[key].in_house} | ${inHouseOrders[key].cpt_code}`;
      };
    }
  }
  return null;
};



// Constants
const inHouseOrders = {
	0: {
    "in_house": "UA, w/o micro, automated",
    "athena": "urinalysis, dipstick",
    "cpt_code": "81003"
  },
  1: {
    "in_house": "Blood glucose",
    "athena": "glucose, fingerstick, blood",
    "cpt_code": "82947"
  },
  2: {
    "in_house": "Hemmocult one card",
    "athena": "fecal occult blood, stool",
    "cpt_code": "82271 "
  },
  3: {
    "in_house": "Hemmocult one card",
    "athena": "fecal occult blood X 3, stool",
    "cpt_code": "82271"
  },
  4: {
    "in_house": "Hemoccult, guaiac, colorectal neoplasm",
    "athena": "",
    "cpt_code": "82270"
  },
  5: {
    "in_house": "Influenza / Flu Test",
    "athena": "rapid flu (A+B)",
    "cpt_code": "87804"
  },
  6: {
    "in_house": "Pregnancy, urine",
    "athena": "pregnancy test, urine",
    "cpt_code": "81025"
  },
  7: {
    "in_house": "RAPID COVID19 TEST QUICKVIEW ANTIGEN NASAL SWAB",
    "athena": "rapid SARS CoV + SARS CoV 2 Ag, QL IA, respiratory",
    "cpt_code": "87811"
  },
  8: {
    "in_house": "Strep A, rapid, direct observation",
    "athena": "rapid strep group A, throat",
    "cpt_code": "87880"
  }
};