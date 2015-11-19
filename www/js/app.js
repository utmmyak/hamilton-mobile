var diningJSONCallback; // need to declare all jsonp callbacks as global variables
var diningJSON = null;
var gotSong = function(data) {
  $(data).find("item").first(function() {
    var el = $(this);

    $('#song-container').text(el.find('title'));

  });
};
var grabRssFeed = function(url, callback, cacheBust, limit) {
  console.log("start");
  var fxurl = url + (cacheBust ? ("&_=" + Math.round(new Date().getTime() / 1000)) : '');
  console.log(fxurl);
  var api = "http" +"://ajax.googleapis.com/ajax/services/feed/load?v=1.0&callback=?&q=" +
      encodeURIComponent(fxurl);
  api += "&num=" + ((limit == null) ? 25 : limit);
  api += "&output=json_xml";

  // Send request
  $.getJSON(api, function(data){

      // Check for error
      if (data.responseStatus == 200) {

        callback(data.responseData);

      } else {

        // Handle error if required
        var msg = data.responseDetails;
        console.log(msg);
        //$(e).html('<div class="rssError"><p>'+ msg +'</p></div>');
      }
    }
  );
};
(function () {
  'use strict';
  var errorConsole;
  window.onerror=function(msg, url, linenumber, column, errorObj){
    errorConsole += msg + " " + url + ":" + linenumber + ":" + column + " (" + errorObj + ")";
    return false;
  };

  function rewriteClass() {
    $('h4 a').addClass("external");
    $('#news').find('.iscroll-content').attr("style", "");
    $('.newsholder').iscrollview('refresh');
  }
  function rewriteClassHamNews() {
    $('h4 a').addClass("external");
    $('#ham-news').find('.iscroll-content').attr("style", "");
    $('#ham-news .newsholder').iscrollview('refresh');
  }

  function rewriteClassEvents(name) {
    console.log(name);
    //$(name+" h4 a").addClass("external");
    //$(name).find('.iscroll-content').attr("style", "");
    //$(name+' .eventsholder').iscrollview('refresh');
      
  }

  var db;

  function setupDB() {
    db = window.openDatabase("appContentsDB", "1.0", "HamiltonCollege", 200000);
  }

  var jsonNotLoadedInitially = false;
  var loadDiningAJAXRequest;

  var updateDiningHallHours = function(data) {
    /* POST: updates the hours and open/closed signs in the dining halls menu
     *
     */
    for (var key in data.days[0].cafes) {
      if (data.days[0].cafes.hasOwnProperty(key)) {
        var now = new Date();
        var cafe = data.days[0].cafes[key];
        var cafeElement = $("li[data-bamco-id=\"" + key + "\"]");
        if (key == 512) {
          if (!(cafe.dayparts) || !(cafe.dayparts[0]) || cafe.dayparts[0].length == 0) {
            if (((now.getDay() == 0 || now.getDay() == 6) &&
                (now.getHours > 15))) {
              cafeElement.find(".open-indicator").addClass("open");
              cafeElement.find(".dining-hall-block .hours-text").text("15:00 - 24:00");
            } else if (now.getDay() != 0 && now.getDay() != 6 && (now.getHours() > 9)) {
              cafeElement.find(".open-indicator").addClass("open");
              cafeElement.find(".dining-hall-block .hours-text").text("09:00 - 24:00");
            } else {
              cafeElement.find(".open-indicator").addClass("closed");
              cafeElement.find(".dining-hall-block .hours-text").text("15:00 - 24:00");
            }
            continue;
          } else {
            cafeElement.removeClass("ui-li-static").children().wrapAll("<a></a>");
            $('.dining-halls .diningmenuholder').listview("refresh");
            cafeElement.children("a").click(function () {
              var id = $(this).parent().attr("data-bamco-id");
              initializeDiningHall(id);
              $(".dining-halls").css("display", "none");
            });
          }
        }

        var mealSet = false;
        var endTime = "";

        $.each(cafe.dayparts[0], function (id, meal) { // for each meal
          // parse the dayparts of this meal into javascript dates

          var start = meal.starttime.split(':');
          var end = meal.endtime.split(':');
          var startDate = new Date();
          var endDate = new Date();
          startDate.setHours(Number(start[0]));
          startDate.setMinutes(Number(start[1]));
          endDate.setHours(Number(end[0]));
          endDate.setMinutes(Number(end[1]));
          if (id == 0) {
            cafeElement.find("a .dining-hall-block .hours-text").text(meal.starttime);
            endTime = meal.endtime;
          } else {
            endTime = meal.endtime;
          }

          // is this meal going on now?
          if (startDate < now && endDate > now) {
            mealSet = true;
            return false;
          }
        });
        if (cafe.dayparts[0].length != 0) {
          console.log(key, " not closed");
          cafeElement.find("a .dining-hall-block .hours-text").append(document.createTextNode(" - " + endTime));
          cafeElement.find("a").removeClass("ui-disabled");
        } else {
          console.log(key, " is closed");
          cafeElement.find("a .dining-hall-block .hours-text").text("Closed Today");
          cafeElement.find("a").addClass("ui-disabled");
        }

        if (mealSet) {
          cafeElement.find("a .open-indicator").addClass("open");
        } else {
          cafeElement.find("a .open-indicator").addClass("closed");
        }
      }
    }

  };

  var diningDataCheck = function(data) {
    /* PRE: data is JSON to check
    POST: determines whether menu data should be stored (i.e. is up to date & etc)
          updates warnings/errors to reflect data retrieved
     */
    console.log("starting checks");
    if (data.hasOwnProperty("status") && data.status === false) {
      $(".menu-not-loaded").fadeIn();
      return false;
    } else {
      $(".menu-not-loaded").fadeOut();
    }

    var menuCurrentDate = true;

    var current = new Date();
    var menuDateSplit = data.days[0].date.split('-');
    if (current.getFullYear() != Number(menuDateSplit[0]) ||
        current.getMonth() + 1 != Number(menuDateSplit[1]) ||
        current.getDate() != Number(menuDateSplit[2])) {
      $(".menu-out-of-date").fadeIn();
      $(".menu-out-of-date .date-container").text(data.days[0].date);
      
      menuCurrentDate = false;
    } else {

      $(".menu-out-of-date").fadeOut();

      loadDiningAJAXRequest.abort();
      // if we find that the menu is not out of date (i.e. the date corresponds), we cancel
      // the ajax request. This will probably not do anything if we already have the response
      // but the response often takes a while to download so this should be fine
    }

    $("#this-day").addClass("ui-btn-active ui-state-persist");
    $("#next-day").removeClass("ui-btn-active");
    $("#prev-day").removeClass("ui-btn-active");

    if (jsonNotLoadedInitially) { // json was not loaded, but is now loaded so hide loader
      $( "#diningmenus").find(".ldr" ).loader( "hide");
      $.mobile.loading( "hide" );
    }

    //updateDiningHallHours(data);
    //have the calling function decide whether to update dining hall hours or not

    return menuCurrentDate;
  };

  var diningJSONLoadOffline = function() {
    var sql = "SELECT jsonData FROM diningmenu";
    db.transaction(function (tx) {
      tx.executeSql(sql, [], function(txn, data) {
        if (data.rows.length == 0) {
          $( ".ldr" ).loader("show");
          $.mobile.loading( "show" );
          jsonNotLoadedInitially = true;
          return;
        }
        diningJSON = $.parseJSON(data.rows.item(0).jsonData);
        var upToDate = diningDataCheck(diningJSON, true);
        // we are calling this offline, so it won't display anything if the data is not the right date
        if (upToDate) {
          $('.dining-halls .diningmenuholder').show();
          updateDiningHallHours(diningJSON);
        } else {
          $('.dining-halls .diningmenuholder').fadeOut();
        }
      }, function(err){
        alert("Error processing SQL: " + err.code);
      });
    });
  };

  var updateDiningMenu = function (adata) {
    if (diningJSON != null) {
      diningJSON = adata;
      var idActive = $("ul.meals li a.ui-btn-active").data("meal-id");

      if (lastDiningHall) {
        initializeDiningHall(lastDiningHall);
      } else {
        $(".diningmenuholder").fadeIn();
      }
      if (idActive != undefined) {
        console.log("setting again" + idActive);
        $('ul.meals li a[data-meal-id="' + idActive + '"]').click();
      }
      
    }
    diningJSON = adata;
  };

  var lastDiningHall = null;
  diningJSONCallback = function (adata) {
    if (diningDataCheck(adata)) { // we are not checking this offline
      console.log("updating database with new dining menu");
      db.transaction(function (tx) {
        if (adata != null) {
          tx.executeSql('DELETE FROM diningmenu');
        }

        tx.executeSql('INSERT INTO diningmenu (jsonData) VALUES (?)',
            [JSON.stringify(adata, null, 2)]);
        updateDiningHallHours(adata);
        updateDiningMenu(adata);
        

      });
    } else {
      console.log("dining menu old could not update database");
      updateDiningHallHours(adata);
      updateDiningMenu(adata);
    }
  };

  var initializeDiningHall = function (targetDiningHall) {
    lastDiningHall = targetDiningHall;
    if (diningJSON === null) { // diningJSON is null there is no json loaded

      setTimeout(function(){initializeDiningHall(targetDiningHall);}, 160);
      return;
    }

    var data = diningJSON;

    var lookupFoodItem = function (itemID, extra) {
      var item = data.items[itemID];
      var display = item.label;
      var cor_lookup = {"humane": "hm", "vegan": "vg", "vegetarian" : "v", "Made without Gluten-Containing Ingredients": "gf", "farm to fork": "f2f", "seafood watch": "sw"};
      if (item.description) {
        display += '<span class="item-description">' + item.description + '</span>';
      }
      if (extra && item.cor_icon != []) {
        /*for (var id in item.cor_icon) {
          display = '<img height="16" width="16" src="' + data.cor_icons[id].image + '" class="ui-li-icon">'
                    + display;
        }*/
        display += '<span class="ui-li-aside">';
        for (var id in item.cor_icon) {
          display += cor_lookup[item.cor_icon[id]] + " ";
        }

        display += '</span>';
        /*if (item.nutrition.kcal) {
          display += '<span class="ui-li-count">' + item.nutrition.kcal + ' cal</span>';
        }*/
      }
      return display;
    };

    var cafe = data.days[0].cafes[targetDiningHall];

    var initializeMeal = function (mealID) {
      var meal = cafe.dayparts[0][mealID];
      $(".items .diningmenuholder").html('');
      $.each(meal.stations, function (id, station) {
        $(".items .diningmenuholder").append('<li data-role="list-divider">' + station.label + "</li>");
        $.each(station.items, function (id, item) {

          $(".items .diningmenuholder").append("<li>" + lookupFoodItem(item, true) + "</li>").enhanceWithin();
        });
      });
      $('.items ul').listview("refresh");
    };
    var defaultMealSet = false; // assume that no meal is going on now

    $('.apageheader.menu-show').html('<div id="meals-navbarcont" data-role="navbar"></div>');
    $('#meals-navbarcont').html('<ul class="meals xnavbar"></ul>');
    //$('.meals.xnavbar').html('<li class="back-cont"><a class="go-back ui-btn-icon-left" data-icon="arrow-l">Back</a></li>');
    $('#diningmenus > .pageheader > .back-btn').hide();
    $('#diningmenus > .pageheader > .dining-back-btn').show();
    console.log(cafe);
    $.each(cafe.dayparts[0], function (id, meal) { // for each meal
      $("ul.meals.xnavbar").append('<li><a data-meal-id="' + id + '">' + meal.label + '<p class="meal-times">' +
                                   meal.starttime + '-' + meal.endtime + '</p></a></li>');

      if (!defaultMealSet) { // if current meal has already been set, there is no need need to parse
        // parse the dayparts of this meal into javascript dates
        var now = new Date();
        var start = meal.starttime.split(':');
        var end = meal.endtime.split(':');
        var startDate = new Date();
        var endDate = new Date();
        startDate.setHours(Number(start[0]));
        startDate.setMinutes(Number(start[1]));
        endDate.setHours(Number(end[0]));
        endDate.setMinutes(Number(end[1]));

        // is this meal going on now?
        if (startDate < now && endDate > now) {
          defaultMealSet = true;
          $('.meals li a[data-meal-id="' + id + '"]').addClass('ui-btn-active');
          initializeMeal(id); // if so initialize it
        }
      }
    });

    $("#diningmenus .menu-show").css("display", "block");
    $(".menu-out-of-date").removeClass("navmargin");
    $("#diningmenus .menu-hide").css("display", "none");
    $(".items").css("display", "block");


    $(".meals li a").click(function(){ // initialize meal when navbar link is pressed
      initializeMeal($(this).data("meal-id"));
    });

    if (!defaultMealSet && cafe.dayparts[0].length > 0) { // no meals going on now
      $(".items .diningmenuholder").html('<li><font style="white-space:normal"><div class="alert info always tight">There are no current meals at this dining hall, please select one above.</div></font></li>');
      $('.items .diningmenuholder').listview("refresh");
    }
    else if (cafe.dayparts[0].length === 0) { // no meals in the day at all
      $(".items .diningmenuholder").html('<li><font style="white-space:normal"><div class="alert info always tight">We could not find any meals today for this dining hall.</div></font></li>');
      $('.items .diningmenuholder').listview("refresh");
    }

    $('[data-role="navbar"]').navbar(); // necessary to apply styling to navbar (meal buttons)

    $(".meals").css("display", "block");
    //$('.meals li a.go-back').removeClass('ui-btn-icon-top');

    var goBack = function(){ // leave the meals/items view and return to dining hall list
      $("#diningmenus .menu-show").css("display", "none");
      $("#diningmenus .menu-hide").css("display", "block");
      $(".menu-out-of-date").addClass("navmargin");


      $('#diningmenus > .pageheader > .back-btn').show();
      $('#diningmenus > .pageheader > .dining-back-btn').hide();

      $(".meals").css("display", "none");
      $(".items").css("display", "none");
      $(".div.ui-content.items").css("display", "none");
      $(".dining-halls").css("display", "block");
      $(".dining-halls .diningmenuholder").css("display", "block");
      $('.dining-halls .diningmenuholder').listview("refresh");

      lastDiningHall = null; // if we go back, then student unselected dining hall

      $(document).off("backbutton", goBack);
    };



    $('#diningmenus > .pageheader > .dining-back-btn').click(goBack);

    //$(".meals li.back-cont").click(goBack);

    //document.addEventListener("backbutton", goBack, false);
    $(document).bind("backbutton", goBack);


  };

  function loadAllDiningJSON(dayDelta) {
    $('[data-role="navbar"]').navbar();
    checkConnection();
    if (dayDelta === undefined) {
      dayDelta = 0;
    }

    
    if (connectionStatus == "online") {
      console.log('delta', dayDelta);
      var thisDay = moment(new Date()).add(dayDelta, 'd');
      var thisDayStr = thisDay.format("YYYY-MM-DD"); // sets day difference to dayDelta
      $("#this-day").html(thisDayStr + "<br/>Current Day");
      $("#prev-day").html(thisDay.add(-1, 'd').format("YYYY-MM-DD") + "<br/>Previous");
      $("#next-day").html(thisDay.add(2, 'd').format("YYYY-MM-DD") + "<br/>Next");

      loadDiningAJAXRequest = $.ajax({
        url: "http://legacy.cafebonappetit.com/api/2/menus?format=jsonp&cafe=110,109,598,512&callback=diningJSONCallback&date=" + thisDayStr,
        cache: 'true',
        dataType: 'jsonp',
        jsonpCallback: 'diningJSONCallback'
      });

      if (dayDelta == 0) { // only offline data will be from the current day
        diningJSONLoadOffline(); // online load from database while we wait
      }

    } else {
      if (dayDelta == 0) {
        diningJSONLoadOffline(); // if not online, load from database
      } else {
        $(".menu-not-loaded").fadeIn();
      }
    }
  }

  function phoneChecks(tx) {
    var sql = "CREATE TABLE IF NOT EXISTS phonenumbers (id varchar(50) PRIMARY KEY, letter varchar(255), name varchar(255), email varchar(255), phone varchar(255), url varchar(255))";
    db.transaction(function (tx) {
      tx.executeSql(sql);
    });

    var sql2 = "CREATE TABLE IF NOT EXISTS diningmenu (jsonData TEXT)";
    db.transaction(function (tx) {
      tx.executeSql(sql2);
    });
  }

  function loadPhoneJson() {
    var jsonCallback = function (data) {
      db.transaction(function (tx) {
        var len = data.length;
        if (len > 0) {
          tx.executeSql('DELETE FROM phonenumbers');
        }
        for (var i = 0; i < len; i++) {
          var id = data[i].id;
          var letter = data[i].letter;
          var name = data[i].name;
          var email = data[i].email;
          var phone = data[i].phone;
          var url = data[i].url;
          tx.executeSql('INSERT INTO phonenumbers (id, letter, name, email, phone, url) VALUES (?,?,?,?,?,?)', [data[i].id, data[i].letter, data[i].name, data[i].email, data[i].phone, data[i].url]);
        }
        getNumbers();
      });

    };
    $.ajax({
      url: "https://www.hamilton.edu/appPages/ajax/getAppData.cfm",
      cache: 'true',
      dataType: 'json'
    }).done(jsonCallback);
  }

  function db_error(db, error) {
    alert("Database Error: " + error);
  }

  function errorCBgetNumbers(err) {
    alert("Error processing SQL: " + err.code);
  }

  function getNumbers() {
    var sql = "SELECT * FROM phonenumbers ORDER BY letter";
    db.transaction(function (tx) {
      tx.executeSql(sql, [], getNumbers_success, errorCBgetNumbers);
    });
  }

  function getAudPref(tx) {
    var sql = "select audienceID from audPrefs";
    db.transaction(function (tx) {
      tx.executeSql(sql, [], getAudPref_success);
    });
  }

  function getAudPref_success(tx, results) {

  }

  function navorderCmp(fa, fb) {
    var a = fa.navorder;
    var b = fb.navorder;
    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
  }

  function getNavigationandPages(tx) {
    var sql = "select audienceID from audPrefs";
    db.transaction(function (tx) {
      tx.executeSql(sql, [], function (tx, results) {
        var len = results.rows.length;
        for (var i = 0; i < len; i++) {
          var audience = results.rows.item(i);
          //console.log("aud = ", audience);
          var audienceID = audience.audienceID;
          buildPages(audienceID);
          var navsql = "select n.navtitle,n.navicon,n2a.navlink,n2a.navorder from appNavs n Inner Join appNavToAudience n2a on n.id = n2a.navid where n2a.audid ='" + audienceID + "' order by navorder";
          db.transaction(function (tx) {
            tx.executeSql(navsql, [], function (tx, navresults) {
              //console.log("navresults = ", navresults);
              var pagearray = [];
              for (var i = 0; i < navresults.rows.length; i++) {
                pagearray.push(navresults.rows.item(i));
                pagearray[i].navorder += 1;
              }

              var toRemove = "dininghrs";
              pagearray = $.grep(pagearray, function(e){
                   return e.navlink != toRemove;
              });
              pagearray.unshift({
                navIcon: "fa-birthday-cake",
                navTitle: "Events",
                navlink: "events",
                navorder: 0
              });
              pagearray.push({
                navIcon: "fa-cutlery",
                navTitle: "Dining Menus",
                navlink: "diningmenus",
                navorder: 10
              });
              pagearray.push({
                navIcon: "fa-comment",
                navTitle: "Feedback",
                navlink: "feedback-page",
                navorder: 11
              });
              pagearray.push({
                navIcon: "fa-calendar",
                navTitle: "Calendar",
                navlink: "collegeCalendar",
                navorder: 12
              });

              pagearray.sort(navorderCmp);
              // sorts the list by navorder

              //console.log("pagearray = ", pagearray);
              //rowid: 8, id:"", pagetitle: "Events", pagecontents:"<p>Events</p>", pageActive: 1, navlink: "events", navTitle: "Events", navIcon: "fa-birthday-cake"});
              var navlen = pagearray.length;

              //$('.dynNavbar').html('');
              //var pagerNavTemplate = '<div><a href="#" class="navright ui-link ui-btn"><i class="fa fa-chevron-right fa-2x"></i></a></div>';
              $('.dyn-nav').html('');
              var container;
              for (var i = 0; i < navlen; i++) {
                if ((i % 3) === 0) {
                  $('.dyn-nav').append('<div class="ui-grid-b"></div>');
                  container = $('.dyn-nav > .ui-grid-b:last-child');
                }
                var navigationrow = pagearray[i];
                var navlink = navigationrow.navlink;
                var navIcon = navigationrow.navIcon;
                //var navTemplate = '<div><a href="#' + navlink + '" class="ui-link ui-btn"><i class="fa ' + navIcon + ' fa-2x"></i></a></div>';
                var blocks = ['a', 'b', 'c'];
                var navTemplate = '<div class="ui-block-' + blocks[i % 3] + ' ui-block-2x-height"><a class="ui-btn" href="#' + navlink + '"><i class="fa ' + navIcon + ' fa-2x"></i></a></div>';
                //$('.dynNavbar').append(navTemplate);
                container.append(navTemplate);
                //console.log(navTemplate);


                // if (i == 4){
                //$('.dynNavbar').append(pagerNavTemplate);
                // }else{
                //   var navTemplate = '<div><a href="#'+navlink+'" class="ui-link ui-btn"><i class="fa '+navIcon+' fa-2x"></i></a></div>';
                //$('.dynNavbar').append(navTemplate);
                //  };
              }



              //attachScroller();
              //console.log("attaching scroller");

            });
          });
        }
      });
    });
  }

  function buildPages(audienceID) {
    //var audienceID;
    var pageTemplate = '<div data-role="page" id="${id}" class="dyn"><div data-id="header" data-position="fixed" data-role="header" data-tap-toggle="false" data-transition="none" class="pageheader"><a class="backbtn"><i class="fa fa-chevron-left fa-2x iconfloat"></i><div class="hamicon"><img src="resources/ios/icon/icon-72@2x.png" class="imgResponsive" /></div></a><h1>${pagetitle}</h1></div><div data-iscroll="" data-role="content" class="ui-content"><div>${pagecontents}</div></div><footer data-role="footer" data-position="fixed" data-id="foo1"><nav data-role="navbar"><div class="container dynNavbar"></div></nav></footer>';

    //var pageTemplate='<div data-role="page" id="${id}" class="dyn"><div data-id="header" data-position="fixed" data-role="header" data-tap-toggle="false" data-transition="none" class="pageheader"><i class="fa fa-chevron-left fa-2x iconfloat"></i><div class="hamicon"><img src="resources/ios/icon/icon-72@2x.png" class="imgResponsive" /></div><h1>${pagetitle}</h1></div><div data-iscroll="" data-role="content" class="ui-content"><div>${pagecontents}</div></div><footer data-role="footer" data-position="fixed" data-id="foo1"><nav data-role="navbar"><div class="container dynNavbar"><div></div></div></nav></footer>';
    var sql = "Select p.pagetitle,p.pagecontents,p.id from Pages p Inner Join appPageToNav apn ON p.id = apn.pageid Inner Join appNavs n on apn.navid = n.id Inner Join appNavToAudience n2a on n.id = n2a.navid where p.pageactive=1 and n2a.audid ='" + audienceID + "'";
    db.transaction(function (tx) {
      tx.executeSql(sql, [], function (tx, xresults) {
        var results = xresults.rows.item(0);
        var pagelen = results.length;
        var pagearray = [];
        for (var i = 0; i < pagelen; i++) {
          pagearray.push(results.item(i));
        }
        //console.log(pagearray);
        var currentpagecount = $(".dyn").length;
        //console.log(currentpagecount);
        if (currentpagecount < pagelen) {
          $.template("attachPageTemplate", pageTemplate);
          $.tmpl("attachPageTemplate", pagearray).insertAfter('#lastStatic');
        }
      });
    });
  }

  var loadPhoneList = function (items) {
    var phonecontacts = [];
    for (var i = 0; i < items.rows.length; i++) {
      phonecontacts.push(items.rows.item(i));
    }
    var phonetemplate = ' <li><a href="tel:${phone}" data-rel="dialog">${name}<br><span class="smgrey">${phone}</span></li>';
    var permphones = '<li><a href="tel:1-315-859-4000"><span class="red">CAMPUS SAFETY (EMERGENCY)</span><br><span class="smgrey">315-859-4000</span></a</li><li><a href="tel:1-315-859-4141">Campus Safety (Non-Emergency)<br><span class="smgrey">315-859-4141</span></a></li><li><a href="tel:1-315-282-5426">Campus Safety (Tip Now) <br><span class="smgrey">315-282-5426</span></a></li>';
    var pnlist = $('#phonenumlist');
    pnlist.html('');
    $.template("contactTemplate", phonetemplate);
    $.tmpl("contactTemplate", phonecontacts).appendTo('#phonenumlist');
    pnlist.prepend(permphones);
    pnlist.listview("refresh");
  };

  function getNumbers_success(tx, results) {
    loadPhoneList(results);
  }

  function ckTable(tx, callBack, table) {
    var sql = "SELECT CASE WHEN tbl_name = '" + table + "' THEN 1 ELSE 0 END FROM sqlite_master WHERE tbl_name = '" + table + "' AND type = 'table'";
    var result = [];
    db.transaction(function (tx) {
      tx.executeSql(sql, [], function (tx, rs) {
        var newcount = rs.rows.length;
        callBack(newcount);
      }, callback_error);
    });
  }

  function callback_error(db, error) {
    alert("Table Check Error: " + error);
  }

  function onDeviceReady() {
    // Mock device.platform property if not available
    if (!window.device) {
      window.device = {
        platform: 'Browser'
      };
    }
  }

  var connectionStatus;

  function checkConnection() {
    connectionStatus = navigator.onLine ? 'online' : 'offline';
  }
  $(function () {
    FastClick.attach(document.body);
  });
  // had to add handlers for external links for in app browser nonsense
  function handleExternalURLs() {
    // Handle click events for all external URLs
    //console.log(device.platform);
    if (device.platform.toUpperCase() === 'ANDROID') {
        $(document).on('click', 'a[href^="http"]', function (e) {
            var url = $(this).attr('href');
            navigator.app.loadUrl(url, { openExternal: true });
            e.preventDefault();
        });
    }
    else if (device.platform.toUpperCase() === 'IOS') {
        $(document).on('click', 'a[href^="http"]', function (e) {
            var url = $(this).attr('href');
            window.open(url, '_system');
            e.preventDefault();
        });
    }
    else {
        // Leave standard behaviour
    }
    /*if (device.platform === null) {
      $(document).on('click', 'a[href^="http"]', function (e) {
        e.preventDefault();
        var url = $(this).attr('href');
        window.open(url, '_system');
        return false;
      });
    }
    else if (device.platform.toUpperCase() === 'ANDROID') {
      $(document).on('click', 'a[href^="http"]', function (e) {
        e.preventDefault();
        //var url = $(this).attr('href');
        //window.open(url, '_system');
        var url = $(this).attr('href');
        navigator.app.loadUrl(url, { openExternal: true });
        return false;
      });
    }
    else if (device.platform.toUpperCase() === 'IOS') {

      $(document).on('click', 'a[href^="http"]', function (e) {
        e.preventDefault();
        var url = $(this).attr('href');
        window.open(url, '_system');
        return false;
      });
    }
    else {
       console.log("bleh");
      $(document).on('click', 'a[href^="http"]', function (e) {
        e.preventDefault();
        var url = $(this).attr('href');
        window.open(url, '_system');
        return false;
      });
    }*/
    /*$(document).on('click', 'a[href^="http"]', function (e) {
      e.preventDefault();
      var url = $(this).attr('href');
      window.open(url, '_system', 'location=yes');
    });*/
  }

  function setAudiencePrefTable() {
    var sql =
      "CREATE TABLE IF NOT EXISTS audPrefs ( " +
      "id varchar(50) PRIMARY KEY, " +
      "audienceID VARCHAR(50))";
    db.transaction(function (tx) {
      tx.executeSql(sql);
    });
  }
  // TODO - this is ugly, make sure you change this to be none static
  function PopulateAudiencePrefTable() {
    db.transaction(function (tx) {
      tx.executeSql('Delete from audPrefs');
      var thisid = guid();
      var stuid = '7F62FAC8-933A-5D40-4682FC3F251CF26D';
      tx.executeSql('INSERT INTO audPrefs (id,audienceID) VALUES (?,?)', [thisid, stuid]);
    });
  }

  function BuildAudienceTable(tx) {
    var audsql =
      "CREATE TABLE IF NOT EXISTS appAudiences ( " +
      "id varchar(50) PRIMARY KEY, " +
      "appAudience VARCHAR(300)," +
      "isActive BIT)";
    db.transaction(function (tx) {
      tx.executeSql(audsql);
    });
  }

  function BuildContentTables(tx) {
    var sql =
      "CREATE TABLE IF NOT EXISTS pages ( " +
      "id varchar(50) PRIMARY KEY, " +
      "pagetitle VARCHAR(255), " +
      "pagecontents VARCHAR(3000), " +
      "pageActive bit, " +
      "lastupdated date, " +
      "lastupdatedusername VARCHAR(50)," +
      "version int, " +
      "packet VARCHAR(3000))";
    db.transaction(function (tx) {
      tx.executeSql(sql);
    });
    var navsql =
      "CREATE TABLE IF NOT EXISTS appNavs ( " +
      "id varchar(50) PRIMARY KEY, " +
      "navTitle VARCHAR(200), " +
      "navIcon VARCHAR(300), " +
      "navAudience VARCHAR(300))";
    db.transaction(function (tx) {
      tx.executeSql(navsql);
    });

    var navtoAudiencesql =
      "CREATE TABLE IF NOT EXISTS appNavToAudience  ( " +
      "id varchar(50) PRIMARY KEY, " +
      "navid VARCHAR(50), " +
      "audid VARCHAR(50), " +
      "navlink VARCHAR(300), " +
      "navorder int )";
    db.transaction(function (tx) {
      tx.executeSql(navtoAudiencesql);
    });

    var pagetonavsql =
      "CREATE TABLE IF NOT EXISTS appPageToNav ( " +
      "id varchar(50) PRIMARY KEY, " +
      "navid VARCHAR(50), " +
      "pageid VARCHAR(50), " +
      "pageorder int )";
    db.transaction(function (tx) {
      tx.executeSql(pagetonavsql);
    });

  }

  /* Pull full JSON Feed */
  function loadFullJson() {
    $.getJSON("https://www.hamilton.edu/appPages/ajax/getpages.cfm", function (data) {
      if (data.audience.length > 0) {
        loadAppAudJson(data.audience);
      }
      if (data.navigation.length > 0) {
        loadNavJson(data.navigation);
      }
      if (data.navtoaud.length > 0) {
        loadappNavToAudienceJson(data.navtoaud);
      }
      if (data.pages.length > 0) {
        loadPagesJson(data.pages);
      }
      if (data.pagetonav.length > 0) {
        loadappPageToNavJson(data.pagetonav);
      }
    });
  }

  /* insert feed parts in to dbs and update accordingly */
  function loadPagesJson(data) {
    db.transaction(function (transaction) {
      var len = data.length;
      if (len > 0) {
        transaction.executeSql('Delete from pages');
      }
      for (var i = 0; i < len; i++) {
        var id = data[i].id;
        var pagetitle = data[i].pagetitle;
        var pagecontents = data[i].pagecontents;
        var pageactive = data[i].pageactive;
        var lastupdated = data[i].lastupdated;
        var lastupdatedusername = data[i].lastupdatedusername;
        var version = data[i].version;
        var packet = data[i].packet;
        transaction.executeSql('INSERT INTO pages (id,pagetitle, pagecontents, pageActive, lastupdated, lastupdatedusername,version,packet) VALUES (?,?,?,?,?,?,?,?)', [id, pagetitle, pagecontents, pageactive, lastupdated, lastupdatedusername, version, packet]);
      }
    });
  }

  function loadAppAudJson(data) {
    db.transaction(function (transaction) {
      var len = data.length;
      if (len > 0) {
        transaction.executeSql('Delete from appAudiences');
      }
      for (var i = 0; i < len; i++) {
        var id = data[i].id;
        var appAudience = data[i].appAudience;
        var isActive = data[i].isActive;
        transaction.executeSql('INSERT INTO appAudiences (id,appAudience,isActive) VALUES (?,?,?)', [id, appAudience, isActive]);
      }
    });
  }

  function loadNavJson(data) {
    db.transaction(function (transaction) {
      var len = data.length;
      if (len > 0) {
        transaction.executeSql('Delete from appNavs');
      }
      for (var i = 0; i < len; i++) {
        var id = data[i].id;
        var navTitle = data[i].navTitle;
        var navIcon = data[i].navIcon;
        var navAudience = data[i].navAudience;
        transaction.executeSql('INSERT INTO appNavs (id, navTitle, navIcon, navAudience) VALUES (?,?,?,?)', [id, navTitle, navIcon, navAudience]);
      }
    });
  }

  function loadappNavToAudienceJson(data) {
    db.transaction(function (transaction) {
      var len = data.length;
      if (len > 0) {
        transaction.executeSql('Delete from appNavToAudience');
      }
      for (var i = 0; i < len; i++) {
        var id = data[i].id;
        var navid = data[i].navid;
        var audid = data[i].audid;
        var navorder = data[i].navorder;
        var navlink = data[i].navlink;
        transaction.executeSql('INSERT INTO appNavToAudience (id, navid, audid, navorder, navlink) VALUES (?,?,?,?,?)', [id, navid, audid, navorder, navlink]);
      }
    });
  }

  function loadappPageToNavJson(data) {
    db.transaction(function (transaction) {
      var len = data.length;
      if (len > 0) {
        transaction.executeSql('Delete from appPageToNav');
      }
      for (var i = 0; i < len; i++) {
        var id = data[i].id;
        var navid = data[i].navid;
        var pageid = data[i].pageid;
        var pageorder = data[i].pageorder;
        transaction.executeSql('INSERT INTO appPageToNav (id, navid, pageid, pageorder) VALUES (?,?,?,?)', [id, navid, pageid, pageorder]);
      }
    });
  }
    

  function BuildColorTable() {
      
      
  }
    
  function LoadColors() {
      
      
      
  }
    
  /* Check to see if version is Stale */


  // initial app load
  $(document).on("pagecontainerbeforechange", function (event, ui) {
    onDeviceReady();
    handleExternalURLs();
  });
  $(document).on('pageshow', '#phonenums', function (e, data) {
    // this won't work need to check to see if there is a db if not then load it if yes then show it.
    // db.transaction(getNumbers, db_error);
  });
  // this doesn't work, might be an app vs browser thing - do more research
  //document.addEventListener('deviceready', onDeviceReady, false);

  // main worker event, find out if the db is there if the data is stale etc.
  $(document).on('pagebeforecreate', 'body', function () {
    //use this function to find out if the app has access to the internet
    checkConnection();
    if (connectionStatus === 'online') {
      setupDB();
      phoneChecks();
      var table = 'pages';
      ckTable(db, function (callBack) {
        if (callBack == 0) {
          //create db tables
          BuildAudienceTable();
          BuildContentTables();
          //get the content and add it.
          loadFullJson();
        } else {
          //check versions then load whatever content you want here? or maybe just all for now just all
          loadFullJson();
        }
      }, table);
      table = 'audPrefs';
      ckTable(db, function (callBack) {
        if (callBack == 0) {
          //if the pref table doesn't exist - show audience choice for now just enter student aud.
          setAudiencePrefTable();
          //populate pref table ( later will be based on the user choice)
          PopulateAudiencePrefTable();
          //getNavigationandPages();
        } else {
          //it exists get all the pages.
          PopulateAudiencePrefTable();
          // this function builds the pages and the navigation
          //getNavigationandPages();
        }
      }, table);
        
      //Color CSS Switcher- unsure if necessary    
      var table = 'colors';
      ckTable(db, function (callBack) {
        if (callBack == 0) {
          //create db tables
          BuildColorTable();
          
        } else {
          //table exists, use preferred css colors
          LoadColors();
        }
      }, table);

    } else {
      // do something else
    }
  });

  $(document).on('pagebeforeshow', '#phonenums', function (e, data) {
    loadPhoneJson();
  });
  $(document).on('pagebeforeshow', '#diningmenus', function (e, data) {
    //loadDiningJSON();
    loadAllDiningJSON(0);
    $( "#diningmenus .ldr" ).loader({
      defaults: true,
      theme: 'b'
    });

    $(".dining-back-btn").removeClass('ui-btn-right').addClass('ui-btn-left');
    $(".dining-halls ul.diningmenuholder li a").click(function () {
      var id = $(this).parent().attr("data-bamco-id");
      initializeDiningHall(id);
      $(".dining-halls").css("display", "none");
    });
    var currentDiningDayDelta = 0;
    $("#prev-day").click(function(){
      currentDiningDayDelta -= 1;
      console.log("loading", currentDiningDayDelta);
      $( ".ldr" ).loader("show");
      $.mobile.loading( "show" );
      jsonNotLoadedInitially = true;

      loadAllDiningJSON(currentDiningDayDelta);
    });
    $("#next-day").click(function(){
      currentDiningDayDelta += 1;
      console.log("loading", currentDiningDayDelta);
      $( ".ldr" ).loader("show");
      $.mobile.loading( "show" );
      jsonNotLoadedInitially = true;
      loadAllDiningJSON(currentDiningDayDelta);
    });
  });

  var feedbackSentDone = function(data, textStatus, jqXHR) {
    if (jqXHR.status == 200) {
      $("#feedback-sent-popup").text(data);
      $("#feedback-sent-popup").popup("open");
      console.log("success!");
    } else {
      console.log("failure :(");
    }
  };
  $(document).on('pagebeforeshow', '#feedback-page', function (e, data) {
    //$('[data-role="navbar"]').navbar();
    $('#feedback-navbarcont').find('.xnavbar > li > a').removeClass('ui-btn-icon-top');
    $('form.feedback').submit(function(e){
      e.preventDefault();
      e.stopPropagation();

      var xfer = $.ajax({
        method: 'POST',
        url: 'https://www.hamilton.edu/appPages/ajax/collectFeedback.cfm',
        data: {
          isBug: false,
          email: $('#feedback-email').val(),
          description: $('#feedback-text').val(),
          platform:  device.platform
        }
      }).done(feedbackSentDone);
    });
  });

  var bugReportDone = function(data, textStatus, jqXHR) {
    if (jqXHR.status == 200) {
      $("#bug-reported-popup").text(data);
      $("#bug-reported-popup").popup("open");
    } else {
      console.log("failure :(");
    }
  };
  $(document).on('pagebeforeshow', '#feedback-bug', function (e, data) {
    $('#feedback-bug-navbarcont').find('.xnavbar > li > a').removeClass('ui-btn-icon-top');
    $('form.bug').submit(function(e){
      e.preventDefault();
      e.stopPropagation();

      var xfer = $.ajax({
        method: 'POST',
        url: 'https://www.hamilton.edu/appPages/ajax/collectFeedback.cfm',
        data: {
          isBug: true,
          description: $('#bug-description-text').val(),
          reproductionSteps: $('#bug-reproduction-text').val(),
          email: $('#bug-email').val(),
          platform:  device.platform,
          consoleDump: errorConsole
        }
      }).done(bugReportDone);
    });
  });

  $(document).on('pagebeforeshow', '.dyn', function (e, data) {
    var pageid = ($.mobile.activePage.attr('id'));
    var htmlcontent = $('#' + pageid + '>.ui-content>.iscroll-scroller>.iscroll-content div').text();
    $('#' + pageid + '>.ui-content>.iscroll-scroller>.iscroll-content').html('').html(htmlcontent);
  });

  //news rss load and rebind
  $(document).on('pagebeforeshow', '#news', function (e, data) {
    $('#news').find('.iscroll-content').rssfeed('http://students.hamilton.edu/rss/articles.cfm?item=A9AAF6B5-FB82-2ADF-26A75A82CDDD1221', {
      limit: 25,
      linktarget: '_blank',
      header: false
    }, rewriteClass);
  });
  $(document).on('pagebeforeshow', '#ham-news', function (e, data) {
    $('#ham-news').find('.iscroll-content').rssfeed('https://www.hamilton.edu/news/rss/news.cfm?tag=news%20item', {
      limit: 25,
      linktarget: '_blank',
      header: false
    }, rewriteClassHamNews);
  });

  var initEventsList = function(name, url){
    var eventList = $('<ul data-role="listview" class="widelist" id="' + name + 'Listview"></ul>');
    grabRssFeed(url,
      function(data){
        console.log(data);
        data.feed.entries.forEach(function(el) {
          var contab = $('<a class="ui-link"></a>').attr('href', el.link);
          contab.append($('<div class="title">' + el.title + '</div>'));

          contab.append($('<span class="date">' + moment(el.publishedDate).format("MMM D YYYY, h:mma") + '</span>'));
          contab.append($('<div class="desc">' + el.contentSnippet + '</div>'));

          eventList.append($('<li/>').append(contab));
        });
        $('#'+name+' .rssFeed').html(eventList);

        $('#'+name+' .rssFeed').enhanceWithin();

        $('#'+name+'Listview').listview("refresh");
        $('#'+name+' .eventsholder').iscrollview('refresh');


      }
    );
  };

  $(document).on('pagebeforeshow', '#events', function (e, data) {
    /*$('#events').find('.iscroll-content').rssfeed('https://25livepub.collegenet.com/calendars/hamilton-college-open-to-the-public.rss', {
      limit: 25,
      linktarget: '_blank',
      header: false
    }, function(){ rewriteClassEvents('#events'); });*/
    initEventsList('events', 'https://25livepub.collegenet.com/calendars/hamilton-college-open-to-the-public.rss');
  });
    
  $(document).on('pagebeforeshow', '#athleticEvents', function (e, data) {
    /*$('#athleticEvents').find('.iscroll-content').rssfeed('http://25livepub.collegenet.com/calendars/Hamilton_College_Athletic_Competitions.rss', {
      limit: 25,
      linktarget: '_blank',
      header: false
    }, function(){ rewriteClassEvents("#athleticEvents"); });*/
    initEventsList('athleticEvents', 'http://25livepub.collegenet.com/calendars/Hamilton_College_Athletic_Competitions.rss');
  });

  $(document).on('pagebeforeshow', '#artEvents', function (e, data) {
    /*$('#artEvents').find('.iscroll-content').rssfeed('http://25livepub.collegenet.com/calendars/hamilton-college-performances.rss', {
      limit: 25,
      linktarget: '_blank',
      header: false
    }, function(){ rewriteClassEvents("#artEvents"); });*/
    initEventsList('artEvents', 'http://25livepub.collegenet.com/calendars/hamilton-college-performances.rss');
  });

  $(document).on('pagebeforeshow', '#alumniEvents', function (e, data) {
    /*$('#alumniEvents').find('.iscroll-content').rssfeed('http://25livepub.collegenet.com/calendars/hamilton-college-alumni-and-parent-events.rss', {
      limit: 25,
      linktarget: '_blank',
      header: false
    }, function(){ rewriteClassEvents('#alumniEvents'); });*/


    //$('#alumEventsListview').listview("refresh");
    initEventsList('alumniEvents', 'http://25livepub.collegenet.com/calendars/hamilton-college-alumni-and-parent-events.rss');
  });
  $(document).on('pageshow', '#alumniEvents', function(e, data){


  });

  $(document).on('pagebeforeshow', function (event, ui) {
    //var shownPage = $(".ui-page.ui-page-theme-a.ui-page-header-fixed.ui-page-footer-fixed.iscroll-page.ui-page-active");
    //console.log(ui.toPage[0]);
    //attachScroller($(ui.toPage[0]));
  });

  // load campus map after page shows - don't know why I have to do this though.
  $(document).on('pageshow', '#map', function (e, data) {
    setTimeout(function () {
      $.getScript("js/campus.map.js", function (data, textStatus, jqxhr) {});
    }, 100);
  });
  $(document).on('pagebeforeshow', '#webcam', function (e, data) {
    $("#webcam-img").load();
  });
  $(document).one("mobileinit", function () {
 
      // Setting #container div as a jqm pageContainer
      $.mobile.pageContainer = $('#container');

      // Setting default page transition to slide
      $.mobile.defaultPageTransition = 'slide';
    $.mobile.ajaxEnabled = true;

  });
  var songUpdateInterval;
  var updateSong = function() {
    grabRssFeed('http://spinitron.com/public/rss.php?station=whcl', function(data){
      var el = $(this);

      $('#song-container').text(data.feed.entries[0].title);

    }, true, 1);
  };
  $(document).on('pagebeforeshow', '#radio', function (e, data) {
    updateSong();
    songUpdateInterval = setInterval(updateSong, 3800);

  });
  $(document).on('pagehide', '#radio', function(e, data) {
    clearInterval(songUpdateInterval);
  });

  //KJD Necessary for SVG images (icons)
  $(document).on('pagebeforeshow', '#home', function (e, data) {
      jQuery('img.svg').each(function(){
          var $img = jQuery(this);
          var imgID = $img.attr('id');
          var imgClass = $img.attr('class');
          var imgURL = $img.attr('src');

          jQuery.get(imgURL, function(data) {
              // Get the SVG tag, ignore the rest
              var $svg = jQuery(data).find('svg');

              // Add replaced image's ID to the new SVG
              if(typeof imgID !== 'undefined') {
                  $svg = $svg.attr('id', imgID);
              }
              // Add replaced image's classes to the new SVG
              if(typeof imgClass !== 'undefined') {
                  $svg = $svg.attr('class', imgClass+' replaced-svg');
              }

              // Remove any invalid XML tags as per http://validator.w3.org
              $svg = $svg.removeAttr('xmlns:a');

              // Replace image with new SVG
              $img.replaceWith($svg);

          }, 'xml');

      });
  });

    
  $(function() {
  $('.cal').hover(function() {
    $('#cap').css('color', "rgb(214,  186,  139)");
  }, function() {
    $('#cap').css('color', 'rgb(0,  47,  134)');
  });
});
    
  
})();
