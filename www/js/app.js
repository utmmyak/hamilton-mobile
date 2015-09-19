var diningJSONCallback;
var diningJSON = null;
(function () {
  'use strict';

  function rewriteClass() {
    $('h4 a').addClass("external");
    $('#news').find('.iscroll-content').attr("style", "");
    $('.newsholder').iscrollview('refresh');
  }

  function rewriteClassEvents() {
    $("h4 a").addClass("external");
    $('#events').find('.iscroll-content').attr("style", "");
    $('.eventsholder').iscrollview('refresh');
  }

  var db;

  function setupDB() {
    db = window.openDatabase("appContentsDB", "1.0", "HamiltonCollege", 200000);
  }

  var jsonNotLoadedInitially = false;
  var loadDiningAJAXRequest;

  var diningDataCheck = function(data) {
    console.log("starting checks");
    if (data.hasOwnProperty("status") && data.status === false) {
      $(".menu-invalid-data").fadeIn();
    }
    else {
      $(".menu-invalid-data").fadeOut();
    }

    var current = new Date();
    var menuDateSplit = data.days[0].date.split('-');
    if (current.getFullYear() != Number(menuDateSplit[0]) ||
        current.getMonth() + 1 != Number(menuDateSplit[1]) ||
        current.getDate() != Number(menuDateSplit[2])) {
      $(".menu-out-of-date").fadeIn();
    }
    else {
      $(".menu-out-of-date").fadeOut();

      loadDiningAJAXRequest.abort();
      // if we find that the menu is not out of date (i.e. the date corresponds), we cancel
      // the ajax request. This will probably not do anything if we already have the response
      // but the response often takes a while to download so this should be fine
    }


    if (jsonNotLoadedInitially) { // json was not loaded, but is now loaded so hide loader
      $( "#diningmenus").find(".ldr" ).loader( "hide");
      $.mobile.loading( "hide" );
    }

    for (var key in data.days[0].cafes) {
      var now = new Date();
      var cafe = data.days[0].cafes[key];
      var cafeElement = $("li[data-bamco-id=\"" + key + "\"]");
      if (key == 512) {
        if (cafe.dayparts[0].length == 0) {
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
        cafeElement.find("a .dining-hall-block .hours-text").append(document.createTextNode(" - " + endTime));
      } else {
        cafeElement.find("a .dining-hall-block .hours-text").text("Closed Today");
        cafeElement.find("a").addClass("ui-disabled");
      }

      if (mealSet) {
        cafeElement.find("a .open-indicator").addClass("open");
      } else {
        cafeElement.find("a .open-indicator").addClass("closed");
      }

    }
  };

  var diningJSONOffline = function() {
    var sql = "SELECT jsonData FROM diningmenu";
    db.transaction(function (tx) {
      tx.executeSql(sql, [], function(txn, data) {
        if (data.rows.length == 0) {
          $( ".ldr" ).loader("show");
          jsonNotLoadedInitially = true;
          return;
        }
        diningJSON = $.parseJSON(data.rows.item(0).jsonData);
        diningDataCheck(diningJSON);
      }, function(err){
        alert("Error processing SQL: " + err.code);
      });
    });
  };

  var lastDiningHall = null;
  diningJSONCallback = function (adata) {
    db.transaction(function (tx) {
      if (adata != null) {
        tx.executeSql('DELETE FROM diningmenu');
      }

      tx.executeSql('INSERT INTO diningmenu (jsonData) VALUES (?)',
                    [JSON.stringify(adata, null, 2)]);
      if (diningJSON != null) {
        diningJSON = adata;
        var idActive = $("ul.meals li a.ui-btn-active").data("meal-id");

        if (lastDiningHall) {
          initializeDiningHall(lastDiningHall);
        }
        if (idActive !== undefined) {
          console.log("setting again" + idActive);
          $('ul.meals li a[data-meal-id="' + idActive + '"]').click();
        }
      }
      diningJSON = adata;
      diningDataCheck(adata);
    });
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
      $(".items").css("display", "block");
      $('.items ul').listview("refresh");
    };
    var defaultMealSet = false; // assume that no meal is going on now

    $('.apageheader.menu-show').html('<div id="meals-navbarcont" data-role="navbar"></div>');
    $('#meals-navbarcont').html('<ul class="meals xnavbar"></ul>');
    $('.meals.xnavbar').html('<li class="back-cont"><a class="go-back ui-btn-icon-left" data-icon="arrow-l">Back</a></li>');
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


    $(".meals li a:not(.go-back)").click(function(){ // initialize meal when navbar link is pressed
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
    $('.meals li a.go-back').removeClass('ui-btn-icon-top');

    var goBack = function(){ // leave the meals/items view and return to dining hall list
      $("#diningmenus .apageheader.menu-show").css("display", "none");
      $("#diningmenus .pageheader.menu-hide").css("display", "block");
      $(".menu-out-of-date").addClass("navmargin");

      $(".meals").css("display", "none");
      $(".div.ui-content.items").css("display", "none");
      $(".dining-halls").css("display", "block");
      $(".dining-halls .diningmenuholder").css("display", "block");
      $('.dining-halls .diningmenuholder').listview("refresh");

      lastDiningHall = null; // if we go back, then student unselected dining hall

      $(document).off("backbutton", goBack);
    };

    $(".meals li a.go-back").click(goBack);
    $(".meals li.back-cont").click(goBack);

    //document.addEventListener("backbutton", goBack, false);
    $(document).bind("backbutton", goBack);


  };

  function loadAllDiningJSON() {
    checkConnection();

    if (connectionStatus == "online") {
      var today = new Date();
      var todayStr = moment(new Date()).format("YYYY-MM-D");

      loadDiningAJAXRequest = $.ajax({
        url: "http://legacy.cafebonappetit.com/api/2/menus?format=jsonp&cafe=110,109,598,512&callback=diningJSONCallback&date=" + todayStr,
        cache: 'true',
        dataType: 'jsonp',
        jsonpCallback: 'diningJSONCallback'
      });
      diningJSONOffline(); // online load from database while we wait
    } else {
      diningJSONOffline(); // if not online, load from database
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
      url: "https://mercury.hamilton.edu:7075/appPages/ajax/getAppData.cfm",
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
              pagearray.unshift({
                navIcon: "fa-cutlery",
                navTitle: "Dining Menus",
                navlink: "diningmenus",
                navorder: 10
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
    var phonetemplate = ' <li><a href="tel:${phone}" data-rel="dialog">${name}<br><span class="smgrey">${phone}</span>{{if url}}<br><span class="smgrey website" data-url="${url}">Website</span>{{/if}}{{if email}}<span class="smgrey website" data-mailto="${email}">${email}</span>{{/if}}</a></li>';
    var permphones = '<li><a href="tel:1-847-555-5555"><span class="red">CAMPUS SAFETY (EMERGENCY)</span><br><span class="smgrey">315-859-4000</span></a</li><li><a href="tel:1-315-859-4141">Campus Safety (Non-Emergency)<br><span class="smgrey">315-859-4141</span></a></li><li><a href="tel:1-315-282-5426">Campus Safety (Tip Now) <br><span class="smgrey">315-282-5426</span></a></li>';
    var pnlist = $('#phonenumlist');
    pnlist.html('')
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
    /*console.log(device.platform);
    if (device.platform === null) {
      $(document).on('click', 'a[href^="http"]', function (e) {
        e.preventDefault();
        var url = $(this).attr('href');
        window.open(url, '_system');
      });
    }
    else if (device.platform.toUpperCase() === 'ANDROID') {
      $(document).on('click', 'a[href^="http"]', function (e) {
        e.preventDefault();
        var url = $(this).attr('href');
        window.open(url, '_system');
      });
    }
    else if (device.platform.toUpperCase() === 'IOS') {

      $(document).on('click', 'a[href^="http"]', function (e) {
        e.preventDefault();
        var url = $(this).attr('href');
        window.open(url, '_system');
      });
    }
    else {
       console.log("bleh");
      $(document).on('click', 'a[href^="http"]', function (e) {
        e.preventDefault();
        var url = $(this).attr('href');
        window.open(url, '_blank');
      });
    }*/
    $(document).on('click', 'a[href^="http"]', function (e) {
      e.preventDefault();
      var url = $(this).attr('href');
      window.open(url, '_system', 'location=yes');
    });
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
    $.getJSON("https://mercury.hamilton.edu:7075/appPages/ajax/getpages.cfm", function (data) {
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
          getNavigationandPages();
        } else {
          //it exists get all the pages.
          PopulateAudiencePrefTable();
          // this function builds the pages and the navigation
          getNavigationandPages();
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
    loadAllDiningJSON();
    $( "#diningmenus .ldr" ).loader({
      defaults: true,
      theme: 'b'
    });
    $(".dining-halls ul.diningmenuholder li a").click(function () {
      var id = $(this).parent().attr("data-bamco-id");
      initializeDiningHall(id);
      $(".dining-halls").css("display", "none");
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

  $(document).on('pagebeforeshow', '#events', function (e, data) {
    $.getScript("js/events.js", function (data, textStatus, jqxhr) {});
    $('#events').find('.iscroll-content').rssfeed('https://25livepub.collegenet.com/calendars/hamilton-college-open-to-the-public.rss', {
      limit: 25,
      linktarget: '_blank',
      header: false
    }, rewriteClassEvents);
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
})();
