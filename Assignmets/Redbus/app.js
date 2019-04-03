(function () {


    var nonAcTab = fetchElement("nonAc");
    var sleeperTab = fetchElement("sleeper");
    var acTab = fetchElement("ac");

    var cities = [];

    this.onTabSelect = function (id) {

        const ac = 'ac';
        const nonAc = 'nonAc';
        const sleeper = 'sleeper';

        let tab = fetchElement(id);

        tab.style["background-color"] = 'gray';
        tab.style.color = 'white';

        switch (id) {
            case 'ac': {
                nonAcTab.style.background = "white";
                nonAcTab.style.color = "black";

                sleeperTab.style.background = "white";
                sleeperTab.style.color = "black";
                break;
            }
            case 'nonAc': {
                acTab.style.background = "white";
                acTab.style.color = "black";

                sleeperTab.style.background = "white";
                sleeperTab.style.color = "black";
                break;
            }
            case 'sleeper': {
                acTab.style.background = "white";
                acTab.style.color = "black";

                nonAcTab.style.background = "white";
                nonAcTab.style.color = "black";
                break;
            }
        }
    }

    function fetchElement(id) {
        return document.querySelector(`#${id}`);
    }


    function init() {

        let search = fetchElement('city-search');

        let suggestionDiv = fetchElement('city');
        suggestionDiv.hidden = true;


        let _cityList = returnCities();

        Object.keys(_cityList).map(k => {
            cities.push(_cityList[k]);
        });

        cities.map(c => {

            let div = document.createElement('DIV');

            let anchor = document.createElement('ANCHOR');
            anchor.innerHTML = c;

            div.appendChild(anchor);
            div.className = 'anchor-div';

            suggestionDiv.appendChild(div);
        });

        search.addEventListener('click', () => {
            suggestionDiv.hidden = false;
        });

        search.addEventListener('blur', () => {
            suggestionDiv.hidden = true;
        });


    }

    init();


})();