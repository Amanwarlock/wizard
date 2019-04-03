(function () {

    this.onSubmit = function (sourceId, destId) {

        let sourceElement = document.getElementById(sourceId);

        let destinationElement = fetchElementById(destId);

        const msg = sourceElement ? sourceElement.value : alert(`Element with id ${sourceId} not found`);

        sourceElement ? sourceElement.value = "" : null;

        if (destinationElement) {
            //  destinationElement.innerHTML = msg;
            destinationElement.textContent = msg;
            intoStorage('message', msg);
        } else {
            alert(`Destination element with id ${destId} not found`)
        }

    }

    function fetchElementById(id) {
        let element = document.querySelector(`#${id}`);
        return element;
    }

    function intoStorage(key, value) {
        window.localStorage.setItem(key, value);
    }

    function fromLocalStorage(key) {
        return window.localStorage.getItem(key);
    }

    function removeFromStorage(key) {
        window.localStorage.removeItem(key);
    }

    function clearStorage() {
        window.localStorage.clear();
    }


    function historyDisplay(id) {

        let elem = fetchElementById(id);

        elem.hidden = false;

        if (elem) {
            let storage = window.localStorage;
            if (storage.length) {
                let table = fetchElementById('history-table');
                for (let i = 0; i < storage.length; i++) {
                    let key = storage.key(i);
                    let value = fromLocalStorage(key);
                    addToTable(table, key, value);
                }
            } else {
                //elem.style.display = "none";
                elem.hidden = true;
            }
        }
    }

    function addToTable(table, key, value) {
        let row = table.insertRow();
        let rowKey = row.insertCell(0).innerHTML = key;
        let rowValue = row.insertCell(1).innerHTML = value;
        let rowAction = row.insertCell(2).innerHTML = `<button onclick='onDelete(event,null,this)'>Delete</button>`
    }

    this.onDelete = function (event, table, src) {
        if (!table) {
            table = fetchElementById('history-table');
        }
        let oRow = src.parentElement.parentElement;
        table.deleteRow(oRow.rowIndex);
        alert("Delete clicked");
    }


    function init() {
        console.log("Calling init");
        historyDisplay('history');

    }


    init();

})();





/* 

function toggle_visibility(id) {
       var e = document.getElementById(id);
       if(e.style.display == 'block')
          e.style.display = 'none';
       else
          e.style.display = 'block';
    }



    var myButtonClasses = document.getElementById("btn1").classList;
 
 
 if (myButtonClasses.contains("blue")) {
 
    myButtonClasses.remove("blue");
 
 } else {
 
    myButtonClasses.add("blue");
 
 }
 
 if (myButtonClasses.contains("red")) {
 
    myButtonClasses.remove("red");
 
 } else {
 
    myButtonClasses.add("red");
 
 }
 
}


Table dynamic - add/edit/delete - https://www.sitepoint.com/community/t/dynamically-add-remove-table-rows/2414


*/