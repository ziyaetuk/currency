//load API from currency concerter
const api = `https://free.currencyconverterapi.com/api/v5/countries`;  

fetch(api).then(
    function(response){
        if (response.status!==200){
            console.log(`Fail to fetch data  ${response.status}`);
            return;
        }

        response.json().then(
            function(data){
                let currency = data.results;
                console.log(currency);

                for (c in currency)
                {
                    let option = document.createElement('option');
                    option.value =`${currency[c].id}`;
                    let check = currency[c].currencySymbol;
                    if(typeof check === 'undefined'){
                        check = '';
                        console.log(check);
                    }
                    option.text = `${check} (${currency[c].currencyName})`;
                    expect.appendChild(option);
                    have.appendChild(option.cloneNode(true));

                }

            });
    }
)
.catch(function(err){
    console.log(err);
}
);