// ?Get DOM elements from HTML
const form = document.querySelector('.search-box');
const input = document.querySelector('#search-term');
const resultsContainer = document.querySelector('.results');
const historyContainer = document.querySelector('.previous-searches');
const forecastContainer = document.querySelector('.day-forecast');

// ?Set variables that are from local storage or set them as empty
let currentWeatherArr = JSON.parse(localStorage.getItem('currentWeatherArr')) || [];
let forecastArr = JSON.parse(localStorage.getItem('forecastArr')) || [];
let historyArr = JSON.parse(localStorage.getItem('historyArr')) || [];

async function searchCoordinates(city) {
    //?Fetch results from an entered city name in to the api URL and then await for the response
    let url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&appid=c6c64ee6193e29f62925ac823e97c7a1`;
    let response = await fetch(url).catch(error => alert('Error : ' + error));
    let data = await response.json();

    //?If there is no data returned from array then the city doesn't exist
    if (data.length === 0) {
        alert("Please enter a valid city name.")
        return;
    }

    //?First element in the response array is the closest and most relevant location
    let bestResult = await data[0];

    //?Feed latitude and longitude to our search weather function
    let result = async (lat, lon) => { searchWeather(lat, lon) };
    result(bestResult.lat, bestResult.lon);
}

async function searchWeather(lat, lon) {
    let url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=c6c64ee6193e29f62925ac823e97c7a1`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            //?Assign weather data to some variables
            let weatherInfo = data.list;
            let cityInfo = data.city;

            //?Filter the weather array to return only 5 single forecasts
            const filteredArr = filterWeatherArray(weatherInfo);

            //?Display our stats
            displayResults(getCurrentWeather(weatherInfo, cityInfo), cityInfo.name);
            displayHistoryList(historyArr);
            displayForecast(filteredArr);

        }).catch(error => alert('Error : ' + error));
}

function filterWeatherArray(array) {

    forecastArr = [];
    //?Map a new array with just the times
    const dateArr = array.map(el => el.dt_txt);
    //?Filter the new array with dates and return dates with time set to "00:00:00", this will give us 5 specific dates/time
    const filterDates = dateArr.filter(el => el.includes("00:00:00"));
    //?Then filter our original response array against the array with the dates/times we want
    array.forEach(el => {
        filterDates.forEach(date => {
            if (el.dt_txt === date) {
                //?Push the weather for the dates/times we want to a new array
                forecastArr.push(el);
            }
        });
    });

    localStorage.setItem('forecastArr', JSON.stringify(forecastArr));

    return forecastArr;
}

function getCurrentWeather(data, city) {
    
    currentWeatherArr = [];
    //?Assigning our variables form the response object for better readability
    let latest = data[0];
    let cDesc = latest.weather[0].description;
    let cTemp = latest.main.temp;
    let cWind = latest.wind.speed;
    let cHumidity = latest.main.humidity;
    let cIcon = latest.weather[0].icon;
    let cName = city.name;
    //?These are then stored in an object
    const stats = {
        name: cName,
        desc: cDesc,
        temp: cTemp,
        wind: cWind,
        humidity: cHumidity,
        icon: cIcon
    }
    //?Then they are pushed to an array ready to be displayed
    currentWeatherArr.push(stats);
    historyArr.push(stats);

    localStorage.setItem('currentWeatherArr', JSON.stringify(currentWeatherArr));

    return currentWeatherArr;
}

function displayResults(results, cityname) {
    // ?Clear results container
    resultsContainer.innerHTML = '';
    // ?Create an element for each result and append them to the container
    results.forEach(result => {
        const resultElement = document.createElement('div');
        resultElement.className = 'result';
        resultElement.innerHTML = `
        
        <h2>${cityname}</h2>
        <p>Conditions : ${result.desc}</p>
        <p>Temp : ${result.temp} °C</p>
        <p>Wind : ${result.wind} km/h</p>
        <p>Humidity : ${result.humidity} %</p>
        `;

        resultsContainer.appendChild(resultElement);
    });
}

function displayHistoryList(history) {
    // ?Clear results container
    historyContainer.innerHTML = '';
    // ?Create an element for each item and append them to the container
    history.forEach(city => {
        const itemElement = document.createElement('div');
        itemElement.className = 'history';
        itemElement.innerHTML = `       
            <button name="${city.name}" type="button" id="load-history">${city.name}</button>
            `;
        historyContainer.appendChild(itemElement);
    });

    localStorage.setItem('historyArr', JSON.stringify(historyArr));
}

function displayForecast(forecast) {
    forecastContainer.innerHTML = '';

    forecast.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        dayElement.innerHTML = `
        
        <p>Date & Time : ${day.dt_txt} °C</p>
        <p>Temp : ${day.main.temp} °C</p>
        <p>Wind : ${day.wind.speed} km/h</p>
        <p>Humidity : ${day.main.humidity} %</p>
        `;
        forecastContainer.appendChild(dayElement);
    });
}

//?Listener for our search city button
form.addEventListener('submit', function (event) {
    event.preventDefault();

    const city = input.value;

    if (city) {
        searchCoordinates(city);
    }
});

//?Listener for our load history button
document.addEventListener('click', function (event) {
    event.preventDefault();

    const target = event.target.closest("#load-history");
    let city = "";

    if (target) {
        console.log(target.name);
        city = target.name;

        let getHistory = historyArr.filter(array => { return array.name === city; });

        displayResults(getHistory, city);
    }
});

//?Listener to load our local storage if there is any on loading the document
document.addEventListener("DOMContentLoaded", function () {
    if (currentWeatherArr.length !== 0) {
        console.log(currentWeatherArr);
        displayResults(currentWeatherArr, currentWeatherArr[0].name);
    }
    if (historyArr.length !== 0) {
        console.log(historyArr);
        displayHistoryList(historyArr);
    }
    if (forecastArr.length !== 0) {
        console.log(forecastArr);
        displayForecast(forecastArr);
    }
});
