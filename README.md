# Technologies
* PhoneGap (incl. Phonegap Build for building to native package)
* HTML/CSS/Javascript
* JQuery
* JQuery Mobile & Jquery UI
* Moment.js

# Important Functions
* Use grabRssFeed to get the rss feed from google (which avoids problems with cors) and pass the data as an object to a callback. 
* initRssFeed styles it using the standard styling and appends it to the element #[name] .rssFeed (where [name] is the page).
* loadAllDiningJSON loads the bonappetit dining data and displays it; if you include a parameter it applies that as a delta to day. If the day is the current day, we launch a request for the menu but also check the diningdata SQL table to see if it is up to date. If it is up to date, then we load that data and cancel the ajax request.
* updateDiningHallHours adds and updates all of the information on the dining menus page, and binds a function to the different dining hall buttons which calls initilalizeDiningHall(id) which then displays the dining menu for the button pressed. 

# Tips
* Webcam image node is added to the DOM when the page is loaded, and removed on navigate away so it does not consume data.
* Keep all data retrieved externally in the database, add a new table by adding a sql transaction with "CREATE TABLE IF NOT EXISTS mytable..." in the phoneChecks() function or some new function which is called from the same place. Ensure that the data is kept up to date, and the database is leveraged if device is offline. We have not yet implemented this across Events and News.
* Ensure that you test frequently on an Android/iOS device; live preview (if using Brackets) or any other local server on the PC will function differently, especially when it comes to security and performance. You can connect your device to your computer, and use a web console in Safari or Chrome to see console messages/play with the rendered HTML.
* The function getNavigationandPages() is not currently being called because the server-side response which contains which pages to render is very out of date. If you fix this, you will also need to fix the constructed HTML as it leverages jquery mobile's grid styling (i.e. predefined 4 icons in each row) whereas we are now using a fluid layout (one big list which rearranges into certain amounts of rows depending on page size).
