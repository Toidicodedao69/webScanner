// Variables
var operationState = { current : "Adding" }; // operationState either Adding or Deleting - USE CONST INSTEAD !!
var totalAmount = 0;

var lastScannedBarCode = "";
var listOfScannedBarCodes = [];


window.onload = function () {
    var app = new Vue({
        el: '#app',
        data: {
            scannedProducts: listOfScannedBarCodes,
            state: operationState /* used in template to list items (see index.html)*/
        }
    });

};


// Click button to open scanner
document.getElementById("scanCamera").onclick = openScanner;

function openScanner() {
    const html5Qrcode = new Html5Qrcode('scanner');
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        if (decodedText) {
            lastScannedBarCode = decodedText;

            processBarcode(lastScannedBarCode);
            
            html5Qrcode.stop();

            lastScannedBarCode = ""
        }
        else {
            return <div>Cannot read bar code</div>
        }
    };

    const config = { fps: 10, qrbox: { width: 350, height: 100 } };
    // Using back camera
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback);
}

function addOrSubtractFromExistingBarcodeObj(barcodeIndex) {
    var boarcodeObj = listOfScannedBarCodes[barcodeIndex];

    if (operationState.current == "Adding")
        boarcodeObj.count += 1; // Add 1 to total
    else {
        if ((boarcodeObj.count - 1) >= 0)
            boarcodeObj.count -= 1; // Subtract 1 from total

        if (boarcodeObj.count == 0)
            listOfScannedBarCodes.splice(barcodeIndex, 1); // remove from list (0 left)
    }
}

function loadAndAddProductToListFromDB(barcode) {
    getDataFromDatabase("/products/", function (dataRead) {
        const keys = Object.keys(dataRead);

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];

            if (barcode == key) {
                var obj = dataRead[key];
                listOfScannedBarCodes.push({ barcode: key, name: obj.name, price: obj.price || -1, count: 1 });
                updateTotals();
            }
        }
    });
}

function processBarcode(barcode) {
    var barcodeIndex = checkIfScannedCodeExists(barcode);

    if (barcodeIndex >= 0) { // Update object with one more item
        addOrSubtractFromExistingBarcodeObj(barcodeIndex);
        updateTotals();
    } else { // Does not exist (add it to the list)
        loadAndAddProductToListFromDB(barcode);
    }
}

function updateTotals() {
    totalAmount = 0;

    for (var i = 0; i < listOfScannedBarCodes.length; i++) {
        var obj = listOfScannedBarCodes[i];

        totalAmount += obj.count * obj.price;
    }
}

function checkIfScannedCodeExists(scannedCode) {
    for (var i = 0; i < listOfScannedBarCodes.length; i++) {
        var obj = listOfScannedBarCodes[i];

        if (obj.barcode == scannedCode) 
            return i;
    }
       
    return undefined;
}


function getDataFromDatabase(path, onDoneReading) {
    var ref = firebase.database().ref(path);

    ref.once('value', function (snapshot) {
        onDoneReading(snapshot.val());
    });
}