console.log("CONTENT SCRIPT RUNNING.");

// Helper functions
function focusOnFrMainDoc() {
  const iframe = document.getElementById("GlobalWrapper");
  const iframeDoc = iframe.contentWindow.document;
  const frameContent = iframeDoc.getElementById("frameContent");
  const frameContentDoc = frameContent.contentWindow.document;
  const frMain = frameContentDoc.getElementById("frMain");
  const frMainDoc = frMain.contentWindow.document;

  return frMainDoc;
}

function addOrdersToFeeSchedule() {
  athenaOrders.forEach(function (title) {
    console.log(title.textContent);
  });
}

function getAthenaOrders(port) {
  // Constants
  const inHouseOrders = {
    0: {
      in_house: "Urinalysis (UA), w/o micro, automated",
      athena: "urinalysis, dipstick",
      cpt_code: "81003",
    },
    1: {
      in_house: "Blood glucose",
      athena: "glucose, fingerstick, blood",
      cpt_code: "82947",
    },
    2: {
      in_house: "Hemmocult one card",
      athena: "fecal occult blood, stool",
      cpt_code: "82271 ",
    },
    3: {
      in_house: "Hemmocult one card",
      athena: "fecal occult blood X 3, stool",
      cpt_code: "82271",
    },
    4: {
      in_house: "Hemoccult, guaiac, colorectal neoplasm",
      athena: "",
      cpt_code: "82270",
    },
    5: {
      in_house: "Influenza / Flu Test",
      athena: "rapid flu (A+B)",
      cpt_code: "87804",
    },
    6: {
      in_house: "Pregnancy, urine",
      athena: "pregnancy test, urine",
      cpt_code: "81025",
    },
    7: {
      in_house: "RAPID COVID19 TEST QUICKVIEW ANTIGEN NASAL SWAB",
      athena: "rapid SARS CoV + SARS CoV 2 Ag, QL IA, respiratory",
      cpt_code: "87811",
    },
    8: {
      in_house: "Strep A, rapid, direct observation",
      athena: "rapid strep group A, throat",
      cpt_code: "87880",
    },
    9: {
      in_house: "Electrocardiograma / EKG (ECG)",
      athena: "electrocardiogram",
      cpt_code: "93000",
    },
    10: {
      in_house: "Spirometry Single test",
      athena: "spirometry",
      cpt_code: "94010",
    },
    11: {
      in_house: "Spirometry Single test",
      athena:
        "spirometry, including graphic record, total and timed vital capacity, expiratory flow rate measurement(s) (PROC)",
      cpt_code: "94010",
    },
  };
  let orderArray = [];
  let orderCount = 0;

  const frMainDoc = focusOnFrMainDoc();
  let orderItem = frMainDoc.querySelectorAll(
    ".order.diagnoses-and-orders-item.encounter-list-item"
  );

  orderItem.forEach((order) => {
    // Perform action on each order element
    order.click();
    orderCount += 1;
  });

  setTimeout(function () {
    //grab all orders listed in dropdowns
    const selectElement = frMainDoc.querySelectorAll(
      'select[name="ClinicalProviderOrderTypeID"]'
    );
    selectElement.forEach((order) => {
      if (selectElement) {
        const selectedText = order.selectedOptions[0].text;
        orderArray.push(selectedText);
      }
    });

    //grab ALL toplevel orders
    const allAthenaOrders = frMainDoc.querySelectorAll("span.title");
    allAthenaOrders.forEach((order) => {
      if (allAthenaOrders) {
        const athenaOrder = order.textContent.replace(/(\r\n|\n|\r|\t)/gm, "");
        const matchingOrder = findInHouseOrder(inHouseOrders, athenaOrder);
        if (matchingOrder) {
          orderArray.push(matchingOrder);
        }
      }
    });

    // grab all orders with labcorp code
    const athenaOrders = frMainDoc.querySelectorAll(
      "span.clinical-provider-order-type-note"
    );
    athenaOrders.forEach(function (title) {
      orderArray.push(title.textContent.replace(/(\r\n|\n|\r|\t)/gm, ""));
    });

    orderArray = extractLabCorpCodes(orderArray);
    // Set data in the storage
    chrome.storage.local
      .set({ labs: JSON.stringify(orderArray) })
      .then(function () {
        port.postMessage({
          status: "athenaGrabOrders-success",
          labs: orderArray,
        });
      })
      .catch(function (error) {
        console.error("Error occurred while saving data in storage", error);
      });
  }, 2000);
}

// Listeners
chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name === "athenaConnection");
  port.onMessage.addListener(function (msg) {
    if (msg.message === "athenaConvertToInsurance") {
      // Perform the necessary actions to convert to insurance
      // and send a message back to the sender indicating success or failure
      convertToInsurance(port);
    }

    if (msg.message === "athenaConvertToPractice") {
      convertToPractice(port);
    }

    if (msg.message === "athenaGrabOrders") {
      getAthenaOrders(port);
    }

    if (msg.message === "addAthenaOrders") {
      addAthenaOrders(port);
    }

    if (msg.message === "calcASCVDRisk") {
      calcASCVDRisk(port);
    }
  });
});

// Conversion functions
function convertToInsurance(port) {
  const frMainDoc = focusOnFrMainDoc();
  let orderCount = 0;

  const orderLists = frMainDoc.querySelectorAll(".orders.encounter-list");

  orderLists.forEach((orderList) => {
    const labCorpOrders = orderList.querySelectorAll(
      '.order .basics .info-group span[data-input-name="clinical-provider"]'
    );

    let hasLabCorpOrder = false;
    labCorpOrders.forEach((labCorpOrder) => {
      if (labCorpOrder.textContent.trim() === "Labcorp PSC") {
        hasLabCorpOrder = true;
      }
    });

    if (hasLabCorpOrder) {
      const orderItems = orderList.querySelectorAll(
        ".order .accordion-trigger"
      );
      orderItems.forEach((order) => {
        // Perform action on each order element
        clickOnElement(order).then(() => {
          const detailsView = frMainDoc.querySelector(".details-view");
          detailsView.classList.add("show-secondary");

          setTimeout(function () {
            // convert from 'PRACTICE' to 'INSURANCE'
            const orderBilling = frMainDoc.querySelectorAll(
              `span[data-value="INSURANCE"].select-bar-option`
            );

            if (orderBilling[orderCount]) {
              orderBilling[orderCount].click();
            }

            order.click();

            orderCount += 1;

            if (orderCount == orderItems.length) {
              console.log("athenaConvertToInsurance-success");
              port.postMessage({ status: "athenaConvertToInsurance-success" });
            }
          }, 2000);
        });
      });
    }
  });

  if (!orderLists) {
    console.log("athenaConvertToInsurance-failed");
    port.postMessage({ status: "athenaConvertToInsurance-failed" });
  }
}

function convertToPractice(port) {
  const frMainDoc = focusOnFrMainDoc();
  let orderCount = 0;

  var orderItem = frMainDoc.querySelectorAll(
    ".orders .order .accordion-trigger"
  );
  if (orderItem) {
    orderItem.forEach((order) => {
      // Perform action on each order element
      clickOnElement(order).then(() => {
        const detailsView = frMainDoc.querySelector(".details-view");
        detailsView.classList.add("show-secondary");

        setTimeout(function () {
          // convert from 'PRACTICE' to 'INSURANCE'
          orderBillingStatus = frMainDoc.querySelectorAll(
            `span[data-value="INSURANCE"].select-bar-option`
          );

          if (orderBillingStatus[orderCount]) {
            orderBillingStatus[orderCount].click();
          }

          order.click();

          orderCount += 1;

          if (orderCount == orderBilling.length) {
            port.postMessage({ status: "athenaConvertToPractice-success" });
          } else {
            port.postMessage({ status: "athenaConvertToPractice-failed" });
          }
        }, 2000);
      });
    });
  } else {
    alert(
      "Uh-Oh! Something went wrong. Make sure you're in the A/P section of the note and that there are orders present."
    ).then(() => {
      port.postMessage({ status: "athenaConvertToPractice-failed" });
    });
    return;
  }
}

// Adds athena orders to Fee Schedule
function addAthenaOrders(port) {
  const importOrdersButton = document.getElementById("importOrdersButton");

  // Get data from the storage
  chrome.storage.local
    .get(["labs"])
    .then(function (result) {
      importOrdersButton.setAttribute("data-value", `${result.labs}`);
      importOrdersButton.click();
      chrome.storage.local.clear();
      port.postMessage({ status: "addAthenaOrders-success" });
    })
    .catch(function (error) {
      port.postMessage({ status: "addAthenaOrders-failed" });
      console.error(
        "Error occurred while retrieving data from the storage",
        error
      );
    });
}

// Grabs lipid, vitals, and demographic values to calc ASCVD Risk
function calcASCVDRisk(port) {
  const frMainDoc = focusOnFrMainDoc();

  /**
   * Creates a default Patient model for the application with all undefined fields and
   * resolves the promise used when retrieving patient information.
   */
  const PatientInfo = {
    gender: undefined,
    age: undefined,
    smoker: undefined,
    isAA: undefined,
    hypertensive: undefined,
    diabetic: undefined,
    cholesteroltotal: undefined,
    hDLcholesterol: undefined,
    lDLCholCalcnih: undefined,
    systolicBP: undefined,
  };

  // Retrieve the stored checkbox states from local storage
  chrome.storage.local.get(["checkboxStates"], function (result) {
    const storedCheckboxStates = result.checkboxStates;

    // Access individual checkbox states
    PatientInfo.isAA = storedCheckboxStates.isAA;
    PatientInfo.smoker = storedCheckboxStates.currentSmoker;

    chrome.storage.local.clear();
  });

  const autostartDiv = frMainDoc.querySelector("div.autostart[data-props]");
  if (autostartDiv) {
    const dataProps = JSON.parse(autostartDiv.getAttribute("data-props"));
    const ageAndSex = dataProps.formattedAgeAndGender;

    if (ageAndSex) {
      const ageMatch = ageAndSex.match(/(\d+)yo/);
      if (ageMatch) {
        PatientInfo.age = parseInt(ageMatch[1]);
      } else {
        alert("Patient age is missing!");
      }

      const genderMatch = ageAndSex.match(/([MF])/);
      if (genderMatch) {
        PatientInfo.gender = genderMatch[1];
      } else {
        alert("Patient gender is missing!");
      }
    } else {
      alert("Patient age and gender are missing!");
    }
  } else {
    alert("Autostart div with data-props not found!");
  }

  // Grab and parse lipid results into object
  const patientLipidResults = getAnalyteValues(frMainDoc);

  // Check if patientLipidResults is undefined or empty
  if (Object.keys(patientLipidResults).length === 0) {
    alert(
      "Uh-oh! There are no lipids found. Verify there are lipid results and/or that you're in the correct view."
    );
    return;
  }

  // Grab vitals
  const vitalsTab = frMainDoc.querySelector(
    'li.metric-location.chart-tabs__list-item[data-chart-section-id="vitals"][data-metric-location="nav-chart-vitals"]'
  );
  const medsTab = frMainDoc.querySelector(
    '[data-metric-location="nav-chart-medications"]'
  );

  let bpValues = {};

  if (vitalsTab) {
    // Click event on the Problems element
    clickOnElement(vitalsTab).then(() => {
      setTimeout(function () {
        const checkForHypertension = (frMainDoc) => {
          const diseaseElements = frMainDoc.querySelectorAll(
            ".plw_c_problem__name"
          );
          const diseaseNames = Array.from(diseaseElements).map((element) =>
            element.textContent.trim()
          );

          const targetRegex =
            /(hypertension|hypertensive disorder|hypertensive heart and renal disease|benign essential hypertension)/i;

          return diseaseNames.some(
            (name) =>
              targetRegex.test(name) &&
              name !==
                "elevated blood-pressure reading without diagnosis of hypertension"
          );
        };

        PatientInfo.hypertensive = checkForHypertension(frMainDoc);

        function checkForDiabetes(frMainDoc) {
          const diseaseElements = frMainDoc.querySelectorAll(
            ".plw_c_problem__name"
          );
          const diseaseNames = Array.from(diseaseElements).map((element) =>
            element.textContent.trim().toLowerCase()
          );

          const excludedTerms = ["pre-diabetes", "prediabetes", "pre diabetes"];

          const hasDiabetes = diseaseNames.some((name) => {
            const lowercaseName = name.toLowerCase();
            return (
              lowercaseName.includes("diabetes") &&
              !excludedTerms.some((term) => lowercaseName.includes(term))
            );
          });

          return hasDiabetes;
        }

        PatientInfo.diabetic = checkForDiabetes(frMainDoc);
      }, 2000);
    });

    // Click event on the Vitals element
    clickOnElement(vitalsTab).then(() => {
      setTimeout(function () {
        function findBPValue(frMainDoc) {
          const bpElements = frMainDoc.querySelectorAll(
            '[data-vital-key="BLOODPRESSURE"] .vital-reading'
          );

          if (bpElements.length > 0) {
            let lowestSystolicBP = Infinity;
            let lowestDiastolicBP = Infinity;

            for (const bpElement of bpElements) {
              const [systolicBP, diastolicBP] = bpElement.textContent
                .trim()
                .split("/")
                .map((value) => parseInt(value));

              if (systolicBP < lowestSystolicBP) {
                lowestSystolicBP = systolicBP;
              }

              if (diastolicBP < lowestDiastolicBP) {
                lowestDiastolicBP = diastolicBP;
              }
            }

            return {
              systolicBP: lowestSystolicBP,
              diastolicBP: lowestDiastolicBP,
            };
          }

          return null;
        }
        bpValues = findBPValue(frMainDoc);
      }, 2000);
    });

    // Click event on the Meds element
    clickOnElement(medsTab).then(() => {
      setTimeout(function () {
        // Calculate ASCVD Risk and return
        medsTaking = findMeds(frMainDoc);

        const mergeObjects = (...objects) => {
          const mergedObj = {};

          function processObject(obj) {
            for (const key in obj) {
              const value = obj[key];
              if (typeof value !== "undefined") {
                if (key.includes("comment:")) {
                  continue; // Skip keys with "comment"
                }
                const newKey = key.replace(/[^\w]/g, ""); // Remove special characters
                mergedObj[newKey] =
                  typeof value === "string" &&
                  !isNaN(value) &&
                  value.trim() !== ""
                    ? parseInt(value)
                    : value; // Convert non-empty string numbers to integers
              }
            }
          }

          objects.forEach((obj) => processObject(obj));

          return mergedObj;
        };

        const patientRiskData = mergeObjects(
          bpValues,
          patientLipidResults,
          PatientInfo
        );

        const validateBloodPressure = (obj) => {
          const { systolicBP, age } = obj;

          if (!systolicBP) {
            alert("No BP value recorded.");
            return false;
          }

          if (systolicBP >= 90 && systolicBP <= 200) {
            return true;
          } else {
            alert("Systolic blood pressure is out of range.");
            return false;
          }
        };

        const systolicBPValidated = validateBloodPressure(patientRiskData);

        const validateAge = (obj) => {
          const age = obj.age;

          if (typeof age === "undefined") {
            alert("No age found! Unable to provide risk.");
            return;
          }

          if (age >= 40 && age <= 79) {
            return true;
          } else {
            alert(
              "ASCVD Risk calculation is only for patients age 40-79. Unable to provide risk."
            );
            return;
          }
        };

        const ageValidated = validateAge(patientRiskData);

        const validateHDLCholesterol = (data) => {
          const hdlCholesterol = data.HDLcholesterol;
          const age = data.age;

          if (!hdlCholesterol) {
            alert(
              "Uh-oh. No HDL Cholesterol found. Make sure you're in the lab review and within a patient's chart view."
            );
            return;
          }

          if (hdlCholesterol >= 20 && hdlCholesterol <= 200) {
            return true;
          } else {
            alert(
              "Uh-oh! HDL cholesterol is out of range. Unable to provide risk."
            );
            return;
          }
        };

        const hdlValidated = validateHDLCholesterol(patientRiskData);

        const validateTotalCholesterol = (obj) => {
          const cholesterol = obj.cholesteroltotal;
          const age = obj.age;

          if (!cholesterol) {
            alert(
              "Uh-oh. No HDL Cholesterol found. Make sure you're in the lab review and within a patient's chart view."
            );
            return;
          }

          if (cholesterol >= 130 && cholesterol <= 320) {
            return true;
          } else {
            alert(
              "Uh-oh! Total cholesterol is out of range! Unable to provide risk."
            );
            return;
          }
        };

        const totalCholesterolValidated =
          validateTotalCholesterol(patientRiskData);

        /**
         * Computes the ASCVD Risk Estimate for an individual over the next 10 years.
         * @param patientInfo - patientInfo object from ASCVDRisk data model
         * @returns {*} Returns the risk score or null if not in the appropriate age range
         */
        const computeTenYearScore = (patientInfo) => {
          const isInteger = (value) => Number.isInteger(value);

          // Check if variables are integers
          const variables = {
            age: patientInfo.age,
            cholesteroltotal: patientInfo.cholesteroltotal,
            HDLcholesterol: patientInfo.HDLcholesterol,
            systolicBP: patientInfo.systolicBP,
            smoker: patientInfo.smoker,
            diabetic: patientInfo.diabetic,
          };

          console.log("patientInfo.diabetic:", patientInfo.diabetic);

          const nonIntegerVariables = [];

          for (const variable in variables) {
            if (!isInteger(variables[variable])) {
              nonIntegerVariables.push({
                name: variable,
                value: variables[variable],
              });
            }
          }

          // Log non-integer variables
          if (nonIntegerVariables.length > 0) {
            nonIntegerVariables.forEach((variable) => {
              console.log(
                `Variable ${variable.name} has a non-integer value: ${variable.value}`
              );
            });
          }

          if (patientInfo.age < 40 || patientInfo.age > 79) {
            return null;
          }

          const lnAge = Math.log(patientInfo.age);
          const lnTotalChol = Math.log(patientInfo.cholesteroltotal);
          const lnHdl = Math.log(patientInfo.HDLcholesterol);
          const trlnsbp = patientInfo.hypertensive
            ? Math.log(parseFloat(patientInfo.systolicBP))
            : 0;
          const ntlnsbp = patientInfo.hypertensive
            ? 0
            : Math.log(parseFloat(patientInfo.systolicBP));
          const ageTotalChol = lnAge * lnTotalChol;
          const ageHdl = lnAge * lnHdl;
          const agetSbp = lnAge * trlnsbp;
          const agentSbp = lnAge * ntlnsbp;
          const ageSmoke = patientInfo.smoker ? lnAge : 0;

          const isAA = patientInfo.isAA;
          const isMale = patientInfo.gender === "M";
          let s010Ret = 0;
          let mnxbRet = 0;
          let predictRet = 0;

          const calculateScore = () => {
            if (isAA && !isMale) {
              s010Ret = 0.95334;
              mnxbRet = 86.6081;
              predictRet =
                17.1141 * lnAge +
                0.9396 * lnTotalChol +
                -18.9196 * lnHdl +
                4.4748 * ageHdl +
                29.2907 * trlnsbp +
                -6.4321 * agetSbp +
                27.8197 * ntlnsbp +
                -6.0873 * agentSbp +
                0.6908 * Number(patientInfo.smoker) +
                0.8738 * Number(patientInfo.diabetic);
            } else if (!isAA && !isMale) {
              s010Ret = 0.96652;
              mnxbRet = -29.1817;
              predictRet =
                -29.799 * lnAge +
                4.884 * lnAge ** 2 +
                13.54 * lnTotalChol +
                -3.114 * ageTotalChol +
                -13.578 * lnHdl +
                3.149 * ageHdl +
                2.019 * trlnsbp +
                1.957 * ntlnsbp +
                7.574 * Number(patientInfo.smoker) +
                -1.665 * ageSmoke +
                0.661 * Number(patientInfo.diabetic);
            } else if (isAA && isMale) {
              s010Ret = 0.89536;
              mnxbRet = 19.5425;
              predictRet =
                2.469 * lnAge +
                0.302 * lnTotalChol +
                -0.307 * lnHdl +
                1.916 * trlnsbp +
                1.809 * ntlnsbp +
                0.549 * Number(patientInfo.smoker) +
                0.645 * Number(patientInfo.diabetic);
            } else {
              s010Ret = 0.91436;
              mnxbRet = 61.1816;
              predictRet =
                12.344 * lnAge +
                11.853 * lnTotalChol +
                -2.664 * ageTotalChol +
                -7.99 * lnHdl +
                1.769 * ageHdl +
                1.797 * trlnsbp +
                1.764 * ntlnsbp +
                7.837 * Number(patientInfo.smoker) +
                -1.795 * ageSmoke +
                0.658 * Number(patientInfo.diabetic);
            }

            const pct = 1 - s010Ret ** Math.exp(predictRet - mnxbRet);
            return Math.round(pct * 100 * 10) / 10;
          };
          return calculateScore();
        };

        if (
          systolicBPValidated &&
          ageValidated &&
          hdlValidated &&
          totalCholesterolValidated
        ) {
          const ascvdRisk = computeTenYearScore(patientRiskData);
          alert(`10-year ASCVD Risk: ${ascvdRisk}%`);
        }
        port.postMessage({ status: "calcASCVDRisk-success" });
      }, 2000);
    });
  } else {
    alert(
      "Please navigate into patient's chart and make sure lipid labs are visible."
    ).then(() => {
      port.postMessage({ status: "calcASCVDRisk-failed" });
    });
  }
}

// Helpers
async function clickOnElement(element) {
  element.click();
}

function extractLabCorpCodes(arr) {
  const result = {};
  for (let i = 0; i < arr.length; i++) {
    const parts = arr[i].split("|").map((s) => s.trim());
    if (parts.length === 2 && !result[parts[0]]) {
      result[parts[0]] = parts[1];
    }
  }
  // const resultObj = Object.assign({}, result); // Make a copy of the result object
  // navigator.clipboard.writeText(JSON.stringify(resultObj)); // Copy the result to the clipboard
  return result;
}

function findInHouseOrder(inHouseOrders, athenaOrder) {
  for (let key in inHouseOrders) {
    if (inHouseOrders.hasOwnProperty(key)) {
      if (inHouseOrders[key].athena === athenaOrder) {
        return `${inHouseOrders[key].in_house} | ${inHouseOrders[key].cpt_code}`;
      }
    }
  }
  return null;
}

// Functions for ASCVD Risk Calc
function getAnalyteValues(frMainDoc) {
  const divs = frMainDoc.getElementsByClassName("multiple-document-item");
  const analyteObject = {};

  let tableRows;

  for (let i = 0; i < divs.length; i++) {
    const link = divs[i].querySelector("a[data-title*=lipid]");
    if (link) {
      tableRows = divs[i].querySelectorAll("tr.multi-result-analyte-row");
      break; // Exit the loop if a match is found
    }
  }

  if (!tableRows) {
    // If 'multiple-document-item' class is not found, fallback to the table
    tableRows = frMainDoc.querySelectorAll(
      "table.observations tbody tr.multi-result-analyte-row"
    );
  }

  for (let j = 0; j < tableRows.length; j++) {
    const analyteName = tableRows[j]
      .querySelector(".analyte-row-observationidentifiertext")
      .textContent.trim();
    const analyteValue = tableRows[j]
      .querySelector(".analyte-row-observationvalue")
      .textContent.trim();

    analyteObject[analyteName] = analyteValue;
  }

  return analyteObject;
}

function findMeds(frMainDoc) {
  const medicationList = frMainDoc.querySelectorAll(
    ".chart-medication.medication-Active"
  );

  const statinMeds = [
    // Atorvastatin (generic) and brand names
    "atorvastatin",
    "Lipitor",
    "Sortis",
    "Torvast",
    "Tulip",

    // Rosuvastatin (generic) and brand names
    "rosuvastatin",
    "Crestor",
    "Rosulip",
    "Rosuvas",
    "Rovacor",

    // Simvastatin (generic) and brand names
    "simvastatin",
    "Zocor",
    "Simvotin",
    "Simvor",
    "Simvofix",

    // Pravastatin (generic) and brand names
    "pravastatin",
    "Pravachol",
    "Lipostat",
    "Selektine",
    "Pravastatina",

    // Lovastatin (generic) and brand names
    "lovastatin",
    "Mevacor",
    "Altoprev",
    "Lovacor",
    "Lovalip",

    // Fluvastatin (generic) and brand names
    "fluvastatin",
    "Lescol",
    "Fluvator",
    "Vastin",
    "Flucor",

    // Pitavastatin (generic) and brand names
    "pitavastatin",
    "Livalo",
    "Pitava",
    "Livacor",
    "Pitavol",

    // Rosuvastatin and ezetimibe combination (generic) and brand names
    "rosuvastatin + ezetimibe",
    "Crestor + Ezetrol",
    "Rosulip + Ezetimibe",
    "Rosuvas + Ezetimibe",
    "Rovacor + Ezetimibe",
  ];

  const hypertensionMeds = [
    // ACE inhibitors
    "benazepril",
    "captopril",
    "enalapril",
    "fosinopril",
    "lisinopril",
    "moexipril",
    "perindopril",
    "quinapril",
    "ramipril",
    "trandolapril",

    // Angiotensin II receptor blockers (ARBs)
    "azilsartan",
    "candesartan",
    "eprosartan",
    "irbesartan",
    "losartan",
    "olmesartan",
    "telmisartan",
    "valsartan",

    // Calcium channel blockers (CCBs)
    "amlodipine",
    "diltiazem",
    "felodipine",
    "isradipine",
    "nicardipine",
    "nifedipine",
    "nimodipine",
    "verapamil",

    // Diuretics
    "acetazolamide",
    "amiloride",
    "bumetanide",
    "chlorothiazide",
    "chlorthalidone",
    "ethacrynic acid",
    "furosemide",
    "hydrochlorothiazide",
    "indapamide",
    "metolazone",
    "spironolactone",
    "torsemide",
    "triamterene",

    // Beta blockers
    "acebutolol",
    "atenolol",
    "betaxolol",
    "bisoprolol",
    "carvedilol",
    "esmolol",
    "labetalol",
    "metoprolol",
    "nadolol",
    "nebivolol",
    "propranolol",
    "sotalol",

    // Alpha blockers
    "doxazosin",
    "prazosin",
    "terazosin",

    // Aldosterone antagonists
    "eplerenone",
    "spironolactone",

    // Renin inhibitors
    "aliskiren",
  ];

  const takesStatin = Array.from(medicationList).some((medication) => {
    const medName = medication
      .querySelector(".medication-name")
      .innerText.toLowerCase();
    return statinMeds.some((statinMed) =>
      medName.includes(statinMed.toLowerCase())
    );
  });

  const OnHypertensionMed = Array.from(medicationList).some((medication) => {
    const medName = medication
      .querySelector(".medication-name")
      .innerText.toLowerCase();
    return hypertensionMeds.some((htnMed) =>
      medName.includes(htnMed.toLowerCase())
    );
  });

  const medicationInfo = {
    takesStatin,
    OnHypertensionMed,
  };

  return medicationInfo;
}
