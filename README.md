# Hamilton Mobile Description
## Technologies
PhoneGap (incl. Phonegap Build for building to native package)
HTML/CSS/Javascript
JQuery
JQuery Mobile & Jquery UI
Moment.js

## Important Functions
Use grabRssFeed to get the rss feed from google (which avoids problems with cors) and pass the data as an object to a callback. 
initRssFeed styles it using the standard styling and appends it to the element #[name] .rssFeed (where [name] is the page).
Webcam image node is added to the DOM when the page is loaded, and removed on navigate away so it does not consume data.
loadAllDiningJSON loads the bonappetit dining data and displays it; if you include a parameter it applies that as a delta to day. If the day is the current day, we launch a request for the menu but also check the diningdata SQL table to see if it is up to date. If it is up to date, then we load that data and cancel the ajax request.
updateDiningHallHours adds and updates all of the information on the dining menus page, and binds a function to the different dining hall buttons which calls initilalizeDiningHall(id) which then displays the dining menu for the button pressed. 
