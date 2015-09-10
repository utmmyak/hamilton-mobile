function rewriteClass() {
    $("h4 a").addClass("external");
    $('#news .iscroll-content').attr("style", "");
    $('.newsholder').iscrollview('refresh');
}
function setupDB() {
    db = window.openDatabase("appContentsDB", "1.0", "HamiltonCollege", 200000);
}

function phoneChecks(tx){
	       var sql = 
            "CREATE TABLE IF NOT EXISTS phonenumbers ( "+
            "id varchar(50) PRIMARY KEY, " +
            "letter VARCHAR(255), " +
            "name VARCHAR(255), " + 
            "email VARCHAR(255), " + 
            "phone VARCHAR(255), " + 
            "url VARCHAR(255))";
        db.transaction(function (tx) 
                {
                     tx.executeSql(sql);
                  });
}
function loadPhoneJson(tx){
    setupDB();
    $.getJSON( "https://hamilton.edu/appPages/ajax/getAppData.cfm", function( data ) { 
        db.transaction(function (tx) {
            var len = data.length;
              if (len > 0) {
                  tx.executeSql('Delete from phonenumbers');  
              }
            for(var i = 0; i < len; i++) {
                var id=data[i].id;
                var letter=data[i].letter;           
                var name=data[i].name;  
                var email=data[i].email; 
                var phone=data[i].phone; 
                var url=data[i].url; 
                tx.executeSql('INSERT INTO phonenumbers (id,letter, name, email, phone, url) VALUES (?,?,?,?,?,?)',[id,letter, name, email, phone, url]);
            }
        });
        getNumbers(tx);
    });
}
function db_error(db, error) {
    alert("Database Error: " + error);
}
function phonedb_success(db) {
    loadPhoneJson(db);
}
function getNumbers(tx) {
    var sql = "select * from phonenumbers order by letter"; 
     db.transaction(function (tx) {
	       tx.executeSql(sql, [], getNumbers_success);
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
function buildHours(dininghall,diningday,dininghallindex) {
    var dininghall;
    var diningday;
    var sql = "select dh.diningstarttime, dh.diningendtime, d2h.diningday from appDiningHours dh Left Join appDiningDaystoHalls d2h on dh.id = d2h.dininghallid where dininghall ='"+dininghall+"' and diningday ='"+diningday+"' order by diningorder"; 
    db.transaction(function (tx) {
        tx.executeSql(sql, [], function(tx,results) {
                var len = results.rows.length;
                var hourstext = "";
            if (len==0){
                var hourstext = "Closed";
            }else{
               for(var i = 0; i < len; i++) { 
                    var diningrow = results.rows.item(i);  
                    var diningEndTime = diningrow.diningEndTime;
                    var diningStartTime = diningrow.diningStartTime;
                    var hourstextraw =diningStartTime+" - "+diningEndTime+" " ;
                    var hourstext = hourstext+hourstextraw;  
                    };
                };
             $('.'+dininghallindex+'hrlist').append('<li>'+getDayString(diningday)+' : '+hourstext+'</li>');
            });
    });
    $( "#hourslist" ).collapsibleset( "refresh" );
};
function getDiningHours(dininghall,tx) { 
     db.transaction(function (tx) {
          $( "#hourslist").empty();
            var dininghalllist="Commons,McEwen,Diner,The Pub,Opus I,Opus II";
           var dininghall = dininghalllist.split(',');
            for(var i = 0; i < dininghall.length; i++)
            {
                var dininghallstr =dininghall[i];
                $('#hourslist').append(' <div data-role="collapsible" class="hrstext"><h3>'+dininghallstr+'</h3><ul class="'+i+'hrlist"></ul></div>');
                for(var x = 0; x < 7; x++) {
                   buildHours(dininghallstr,x,i);
                };
            }
     });
        
}
function getDayString(dnumber) {
    var dnumber;
    var dstring;
    var weekday=new Array(7);
    weekday[0]="Su";
    weekday[1]="M";
    weekday[2]="T";
    weekday[3]="W";
    weekday[4]="Th";
    weekday[5]="F";
    weekday[6]="Sa";
    var dstring = weekday[dnumber];
    return dstring;
}
function getNavigationandPages(tx) {
     var sql = "select audienceID from audPrefs"; 
     db.transaction(function (tx) {
            tx.executeSql(sql, [], function(tx,results) {
                var len = results.rows.length;
                for(var i = 0; i < len; i++) {
                  var audience = results.rows.item(i);                
                  var audienceID = audience.audienceID;
                buildPages(audienceID);    
                  var navsql = "select n.navtitle,n.navicon,n2a.navlink,n2a.navorder from appNavs n Inner Join appNavToAudience n2a on n.id = n2a.navid where n2a.audid ='"+audienceID+"' order by navorder"; 
                       db.transaction(function (tx) {      
                                    tx.executeSql(navsql, [], function(tx,navresults) {
                                       var navlen = navresults.rows.length;
                                       $('.dynNavbar').html('');
                                        var pagerNavTemplate = '<div><a href="#" class="navright ui-link ui-btn"><i class="fa fa-chevron-right fa-2x"></i></a></div>';
                                        for(var i = 0; i < navlen; i++) {
                                            var navigationrow = navresults.rows.item(i);  
                                            var navlink = navigationrow.navlink;
                                            var navIcon = navigationrow.navIcon;
                                            var navTemplate = '<div><a href="#'+navlink+'" class="ui-link ui-btn"><i class="fa '+navIcon+' fa-2x"></i></a></div>';
                                            $('.dynNavbar').append(navTemplate);
                                            
                                            // if (i == 4){
                                             //$('.dynNavbar').append(pagerNavTemplate);
                                            // }else{
                                         //   var navTemplate = '<div><a href="#'+navlink+'" class="ui-link ui-btn"><i class="fa '+navIcon+' fa-2x"></i></a></div>';
                                            //$('.dynNavbar').append(navTemplate);
                                           //  };
                                        };
                                  
                                   attachScroller();
                                    
                                });
                        });
                };
            });
     });
}
function buildPages(audienceID) {
    var audienceID
    var pageTemplate='<div data-role="page" id="${id}" class="dyn"><div data-id="header" data-position="fixed" data-role="header" data-tap-toggle="false" data-transition="none" class="pageheader">  <div class="headerLinks"><a href="#phonenums"><i class="fa fa-chevron-left iconfloat"></i></a><div class="headerlinktext"><a href="#phonenums">home</a></div></div><h1>Hamilton<br>${pagetitle}</h1></div><div data-iscroll="" data-role="content" class="ui-content"><div>${pagecontents}</div></div> <footer data-role="footer" data-position="fixed" data-id="foo1"><nav data-role="navbar"><div class="container dynNavbar"><div><a href="#phonenums"><i class="fa fa-phone fa-2x"></i></a></div>div><a href="#dininghrs"><i class="fa fa-cutlery fa-2x"></i></a></div></div></nav></footer>';
     var sql = "Select p.pagetitle,p.pagecontents,p.id from Pages p Inner Join appPageToNav apn ON p.id = apn.pageid Inner Join appNavs n on apn.navid = n.id Inner Join appNavToAudience n2a on n.id = n2a.navid where p.pageactive=1 and n2a.audid ='"+audienceID+"'"; 
    db.transaction(function (tx) {
        tx.executeSql(sql, [], function(tx,results) {
               var pagelen = results.rows.length;
                var pagearray=[];
                for(var i = 0; i < pagelen; i++) {
                   pagearray.push(results.rows.item(i))
                };
            var currentpagecount = $(".dyn").length;
            if (currentpagecount < pagelen) {
                $.template("attachPageTemplate", pageTemplate);
                $.tmpl("attachPageTemplate", pagearray).insertAfter('#lastStatic');
             
            };
            });
    });
 
};
loadPhoneList = function(items){
    var phonecontacts = [];
    for (i = 0; i < items.rows.length; i++)
    {
        phonecontacts.push(items.rows.item(i));
    }   
    var phonetemplate = ' <li><a href="tel:${phone}" data-rel="dialog">${name}<br><span class="smgrey">${phone}</span>{{if url}}<br><span class="smgrey website" data-url="${url}">Website</span>{{/if}}{{if email}}<span class="smgrey website" data-mailto="${email}">${email}</span>{{/if}}</a></li>';
    var permphones ='<li><a href="tel:1-847-555-5555"><span class="red">CAMPUS SAFETY (EMERGENCY)</span><br><span class="smgrey">315-859-4000</span></a</li><li><a href="tel:1-315-859-4141">Campus Safety (Non-Emergency)<br><span class="smgrey">315-859-4141</span></a></li><li><a href="tel:1-315-282-5426">Campus Safety (Tip Now) <br><span class="smgrey">315-282-5426</span></a></li><li><a href="scratch.html" data-rel="external" data-ajax="false">Test Page</a></li><li><a href="scroll.html" data-rel="external" data-ajax="false">Test Page</a></li><li><a href="custom.html" data-rel="external" data-ajax="false">Scroller</a></li>';
    $('#phonenumlist').html('');
    $.template("contactTemplate", phonetemplate);
    $.tmpl("contactTemplate", phonecontacts).appendTo('ul#phonenumlist');
    $("#phonenumlist").prepend(permphones);
    $('#phonenumlist').listview("refresh");
	};
function getNumbers_success(tx, results) {
    loadPhoneList(results);
    
}
function ckTable(tx, callBack,table){ 
    var sql = "SELECT CASE WHEN tbl_name = '"+table+"' THEN 1 ELSE 0 END FROM sqlite_master WHERE tbl_name = '"+table+"' AND type = 'table'";
    var result = [];
   db.transaction(function (tx) {
      tx.executeSql(sql, [], function(tx, rs){
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
        window.device = { platform: 'Browser' };
    }
}
function checkConnection() {
     connectionStatus = navigator.onLine ? 'online' : 'offline';
}
$(function () {
    FastClick.attach(document.body);
});
// had to add handlers for external links for in app browser nonsense
function handleExternalURLs() {
    // Handle click events for all external URLs
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
            window.open(url, '_blank');
            alert('clicked a link');
            e.preventDefault();
        });
    }
    else {
       
    }
}
function setAudiencePrefTable() {
     var sql = 
            "CREATE TABLE IF NOT EXISTS audPrefs ( "+
            "id varchar(50) PRIMARY KEY, " +
            "audienceID VARCHAR(50))";
        db.transaction(function (tx) 
            {
                 tx.executeSql(sql);
              });
}
// TODO - this is ugly, make sure you change this to be none static
function PopulateAudiencePrefTable() {
        db.transaction(function (tx) 
                {
                tx.executeSql('Delete from audPrefs');  
                 var thisid= guid();
                    var stuid= '7F62FAC8-933A-5D40-4682FC3F251CF26D';
                  tx.executeSql('INSERT INTO audPrefs (id,audienceID) VALUES (?,?)',[thisid,stuid]);
              });
}

function BuildAudienceTable(tx) {
    var audsql = 
        "CREATE TABLE IF NOT EXISTS appAudiences ( " +
        "id varchar(50) PRIMARY KEY, " +
        "appAudience VARCHAR(300)," +  
        "isActive BIT)";
            db.transaction(function (tx) 
                        {
                        tx.executeSql(audsql);
            });
}
function BuildContentTables(tx) {
    var sql = 
        "CREATE TABLE IF NOT EXISTS pages ( "+
            "id varchar(50) PRIMARY KEY, " +
            "pagetitle VARCHAR(255), " +
            "pagecontents VARCHAR(3000), " +
            "pageActive bit, " +
            "lastupdated date, " + 
            "lastupdatedusername VARCHAR(50)," +
            "version int, " +
            "packet VARCHAR(3000))";
          db.transaction(function (tx) 
                        {
                            tx.executeSql(sql);
                          });
     var navsql = 
       "CREATE TABLE IF NOT EXISTS appNavs ( "+
            "id varchar(50) PRIMARY KEY, " +
            "navTitle VARCHAR(200), " +
            "navIcon VARCHAR(300), " +
            "navAudience VARCHAR(300))";
     db.transaction(function (tx) 
                        {
                             tx.executeSql(navsql);
                          });
       
     var navtoAudiencesql = 
        "CREATE TABLE IF NOT EXISTS appNavToAudience  ( "+
            "id varchar(50) PRIMARY KEY, " +
            "navid VARCHAR(50), " +
            "audid VARCHAR(50), " +
            "navlink VARCHAR(300), "+
            "navorder int )";
     db.transaction(function (tx) 
                        {
                             tx.executeSql(navtoAudiencesql);
                          });
       
     var pagetonavsql = 
        "CREATE TABLE IF NOT EXISTS appPageToNav ( "+
            "id varchar(50) PRIMARY KEY, " +
            "navid VARCHAR(50), " +
            "pageid VARCHAR(50), " +
            "pageorder int )";
            db.transaction(function (tx) 
                        {
                            tx.executeSql(pagetonavsql);
                          });
       
}
/* Pull full JSON Feed */
function loadFullJson(){
                $.getJSON( "https://hamilton.edu/appPages/ajax/getpages.cfm", function( data ) { 
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
                      if (data.dininghours.length > 0) {
                       loadDiningHoursJson(data.dininghours);
                    } 
                      if (data.diningdays.length > 0) {
                      loadDiningDaysJson(data.diningdays);
                    } 
                });
            };
/* insert feed parts in to dbs and update accordingly */
function loadDiningDaysJson(data) {
     var dininghourssql = "CREATE TABLE IF NOT EXISTS appDiningDaystoHalls ( "+
            "id varchar(50) PRIMARY KEY, " +
            "diningday INT, " +
            "dininghallid VARCHAR(50))";
    db.transaction(function (transaction) {
        var len = data.length;
         transaction.executeSql(dininghourssql);  
        if (len > 0) {
            
          transaction.executeSql('Delete from appDiningDaystoHalls');  
        }
        for(var i = 0; i < len; i++) {
            var id=data[i].id;
            var diningday=data[i].diningday;     
            var dininghallid=data[i].dininghallid;           
            transaction.executeSql('INSERT INTO appDiningDaystoHalls (id,diningday,dininghallid) VALUES (?,?,?)',[id, diningday, dininghallid]);
        }
    });
}
function loadDiningHoursJson(data) {
     var dininghourssql = "CREATE TABLE IF NOT EXISTS appDiningHours ( "+
            "id varchar(50) PRIMARY KEY, " +
            "diningHall VARCHAR(150), " +
            "diningStartTime VARCHAR(50), " +
            "diningEndTime VARCHAR(50), " +
            "diningOrder INT)";
    db.transaction(function (transaction) {
        var len = data.length;
         transaction.executeSql(dininghourssql);  
        if (len > 0) {
          transaction.executeSql('Delete from appDiningHours');  
        }
        for(var i = 0; i < len; i++) {
            var id=data[i].id;
             var diningHall=data[i].diningHall; 
             var diningStartTime=data[i].diningStartTime; 
             var diningEndTime=data[i].diningEndTime; 
             var diningOrder=data[i].diningOrder;   
            transaction.executeSql('INSERT INTO appDiningHours (id,diningHall,diningStartTime,diningEndTime,diningOrder) VALUES (?,?,?,?,?)',[id, diningHall,diningStartTime,diningEndTime,diningOrder]);
        }
    });
}
function loadPagesJson(data) {
        db.transaction(function (transaction) {
            var len = data.length;
              if (len > 0) {
                transaction.executeSql('Delete from pages');  
                }
            for(var i = 0; i < len; i++) {
                var id=data[i].id;
                var pagetitle=data[i].pagetitle;           
                var pagecontents=data[i].pagecontents;  
                var pageactive=data[i].pageactive; 
                var lastupdated=data[i].lastupdated; 
                var lastupdatedusername=data[i].lastupdatedusername; 
                 var version=data[i].version; 
                 var packet=data[i].packet; 
                transaction.executeSql('INSERT INTO pages (id,pagetitle, pagecontents, pageActive, lastupdated, lastupdatedusername,version,packet) VALUES (?,?,?,?,?,?,?,?)',[id, pagetitle, pagecontents, pageactive, lastupdated,lastupdatedusername,version,packet]);
            }
        });
}
function loadAppAudJson(data) {
    db.transaction(function (transaction) {
        var len = data.length;
        if (len > 0) {
          transaction.executeSql('Delete from appAudiences');  
        }
        for(var i = 0; i < len; i++) {
            var id=data[i].id;
            var appAudience=data[i].appAudience;     
            var isActive=data[i].isActive;           
            transaction.executeSql('INSERT INTO appAudiences (id,appAudience,isActive) VALUES (?,?,?)',[id, appAudience, isActive]);
        }
    });
}
function loadNavJson(data) {
    db.transaction(function (transaction) {
        var len = data.length;
           if (len > 0) {
          transaction.executeSql('Delete from appNavs');  
        }
        for(var i = 0; i < len; i++) {
            var id=data[i].id;
            var navTitle=data[i].navTitle;           
            var navIcon=data[i].navIcon;  
            var navAudience=data[i].navAudience; 
            transaction.executeSql('INSERT INTO appNavs (id,navTitle, navIcon, navAudience) VALUES (?,?,?,?)',[id, navTitle, navIcon, navAudience]);
        }
    });
}
function loadappNavToAudienceJson(data) {
    db.transaction(function (transaction) {
        var len = data.length;
           if (len > 0) {
          transaction.executeSql('Delete from appNavToAudience');  
        }
        for(var i = 0; i < len; i++) {
            var id=data[i].id;
            var navid=data[i].navid;           
            var audid=data[i].audid;  
            var navorder=data[i].navorder; 
             var navlink=data[i].navlink; 
            transaction.executeSql('INSERT INTO appNavToAudience (id,navid, audid, navorder, navlink) VALUES (?,?,?,?,?)',[id, navid, audid, navorder,navlink]);
        }
    });
}
function loadappPageToNavJson(data) {
    db.transaction(function (transaction) {
        var len = data.length;
        if (len > 0) {
          transaction.executeSql('Delete from appPageToNav');  
        }
        for(var i = 0; i < len; i++) {
            var id=data[i].id;
            var navid=data[i].navid;           
            var pageid=data[i].pageid;  
            var pageorder=data[i].pageorder; 
            transaction.executeSql('INSERT INTO appPageToNav (id,navid, pageid, pageorder) VALUES (?,?,?,?)',[id, navid, pageid, pageorder]);
        }
    });
}
/* Check to see if version is Stale */


function attachScroller() {
           $(".container").owlCarousel({
      items : 6, //10 items above 1000px browser width
      itemsMobile : [500,5] // itemsMobile disabled - inherit from itemsTablet option   
      });

}
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
$(document).on('pagecontainerbeforecreate', 'body', function () {
    //use this function to find out if the app has access to the internet
    checkConnection();
    if (connectionStatus === 'online') {
        setupDB();
        phoneChecks();
       var table='pages';
        ckTable(db, function(callBack) {
            if (callBack==0) {
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
        var table = 'audPrefs';
         ckTable(db, function(callBack) {
              if (callBack==0) {
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
       
    }else {
    }
});

$(document).on('pagebeforeshow', '#phonenums', function (e, data) {
   loadPhoneJson();
}); 
$(document).on('pagebeforeshow', '#dininghrs', function (e, data) {
    getDiningHours();
}); 
$(document).on('pagebeforeshow', '.dyn', function (e, data) {
        var pageid = ($.mobile.activePage.attr('id'));
        var htmlcontent = $('#'+pageid+'>.ui-content>.iscroll-scroller>.iscroll-content div').text();
        $('#'+pageid+'>.ui-content>.iscroll-scroller>.iscroll-content div').html('').html(htmlcontent);
}); 
//news rss load and rebind
$(document).on('pagebeforeshow', '#news', function (e, data) {
    $('#news .iscroll-content').rssfeed('http://students.hamilton.edu/rss/articles.cfm?item=A9AAF6B5-FB82-2ADF-26A75A82CDDD1221', {
            limit: 10,
            linktarget: '_blank',
            header: false
          }, rewriteClass);
}); 
// load campus map after page shows - don't know why I have to do this though.
$(document).on('pageshow', '#map', function (e, data) {
    setTimeout(function () {
        $.getScript( "js/campus.map.js", function( data, textStatus, jqxhr ) {
        });

    }, 100);
}); 