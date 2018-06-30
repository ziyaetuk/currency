'use strict';

$(document).ready(function (){
	fetchAllCurrencies();
});

/*
SERVICE WORKER
*/

//This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

//Add this below content to your HTML page, or add the js file to your page at the very top to register service worker
if (navigator.serviceWorker.controller) {
  console.log('[PWA Builder] active service worker found, no need to register')
} else {

//Register the ServiceWorker
  navigator.serviceWorker.register('pwa-sw.js', {
    scope: './'
  }).then(function(reg) {
    console.log('Service worker has been registered for scope:'+ reg.scope);
  });
}

/*
CACHE API
*/
// fetch all currencies 
const fetchAllCurrencies = (e) => {
	// used es6 Arrow func here..
	$.get('https://free.currencyconverterapi.com/api/v5/currencies', (data) => {
		// if data not fetch
		if(!data) console.log("Could not fetch any data");
		
		// convert pairs to array
		const pairs = objectToArray(data.results);

		// used for of loop
		for(let val of pairs){
			// using template leteral
			$("#convert-from").append(`
				<option value="${val.id}">${val.id} (${val.currencyName})</option>
			`);
			$("#convert-to").append(`
				<option value="${val.id}">${val.id} (${val.currencyName})</option>
			`);
		}
	});
}

// convert currencies 
function convertCurrency(){
	let from 	= $("#convert-from").val();
	let to 		= $("#convert-to").val();
	let amount	= $("#convert-amount").val();

	// restrict user for converting same currency
	if(from == to){
		// console.log('error ');
		$(".error_msg").html(`
			<div class="card-feel">
				<span class="text-danger">
					Process Error!, You cannot convert thesame currency.
				</span>
			</div>
		`);

		// hide error message
		setTimeout((e) => {
			$(".error_msg").html("");
		}, 1000 * 3);

		// stop proccess
		return false;
	}

	// build query 
	let body  = `${from}_${to}`;
	let query = {
		q: body
	};

	// convert currencies
	$.get('https://free.currencyconverterapi.com/api/v5/convert', query, (data) => {
		// convert to array
		const pairs = objectToArray(data.results);

		// iterate pairs
		$.each(pairs, function(index, val) {
			$(".results").append(`
				<div class="card-feel">
                    <h1 class="small text-center"> <b>${amount}</b>  <b>${val.fr}</b> to <b>${val.to}</b> Conversion Processed !</h1>
					<hr />
					Exchange rate for <b>${amount}</b> <b>${val.fr}</b> to <b>${val.to}</b> is: <br /> 
					<b>${numeral(amount * val.val).format('0.000')}</b>
				</div>
			`);

			// save object results for later use
			let object = {
				symbol: body,
				value: val.val
			};

			// save to database
			saveToDatabase(object);
		});
	}).fail((err) => {
		// check currencies from indexedDB
		fetchFromDatabase(body, amount);
	});

	// void form
	return false;
}

// array generators using map & arrow func
function objectToArray(objects) {
	// body...
	const results = Object.keys(objects).map(i => objects[i]);
	return results;
}

// refresh page
function refreshPage() {
	// body...
	window.location.reload();
}



/*
INDEXED DB
*/
if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB");
}

// open database 
function openDatabase(){
	// return db instances
	const DB_NAME 	= 'FXConverter';
	const database 	= indexedDB.open(DB_NAME, 1);

	// on error catch errors 
	database.onerror = (event) => {
		console.log('error opening web database');
		return false;
	};

	// check db version
	database.onupgradeneeded = function(event) {
	  	// listen for the event response
	  	var upgradeDB = event.target.result;

	  	// create an objectStore for this database
	  	var objectStore = upgradeDB.createObjectStore("currencies");
	};

	// return db instance
	return database;
}

// save to currencies object
function saveToDatabase(data){
	// init database
	const db = openDatabase();
	
	// on success add user
	db.onsuccess = (event) => {

		// console.log('database has been openned !');
		const query = event.target.result;

	  	// check if already exist symbol
		const currency = query.transaction("currencies").objectStore("currencies").get(data.symbol);

		// wait for users to arrive
	  	currency.onsuccess = (event) => {
	  		const dbData = event.target.result;
	  		const store  = query.transaction("currencies", "readwrite").objectStore("currencies");

	  		if(!dbData){ 
	  			// save data into currency object
				store.add(data, data.symbol);
	  		}else{
	  			// update data existing currency object
				store.put(data, data.symbol);
	  		};
	  	}
	}
}

// fetch from web database
function fetchFromDatabase(symbol, amount) {
	// init database
	const db = openDatabase();
	
	// on success add user
	db.onsuccess = (event) => {

		// console.log('database has been openned !');
		const query = event.target.result;

		// check if already exist symbol
		const currency = query.transaction("currencies").objectStore("currencies").get(symbol);

		// wait for users to arrive
	  	currency.onsuccess = (event) => {
	  		const data = event.target.result;
	  		// console.log(data);
	  		if(data == null){
	  			$(".error_msg").append(`
					<div class="card-feel">
		                <span class="text-danger">
		                	Seems you are offline, check you internet connection then retry.
		                </span>
					</div>
				`);

				// hide error message
				setTimeout((e) => {
					$(".error_msg").html("");
				}, 1000 * 3);

				// void
				return;
	  		}

			// console.log(data);
			// console.log(data);
			let pairs = symbol.split('_');
			let fr = pairs[0];
			let to = pairs[1];

			$(".results").append(`
				<div class="card-feel">
	                <h1 class="small text-center"> <b>${amount}</b> <b>${fr}</b> & <b>${to}</b> Conversion Processed !</h1>
					<hr />
					Exchange rate for <b>${amount}</b> <b>${fr}</b> to <b>${to}</b> is: <br /> 
					<b>${numeral(amount * data.value).format('0.000')}</b>
				</div>
			`);
	  	}
	}
}