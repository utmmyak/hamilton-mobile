(function () {
    'use strict';
    function phoneChecks(db) {
        var sql = 
            "CREATE TABLE IF NOT EXISTS phonenumbers ( "+
            "id varchar(50) PRIMARY KEY, " +
            "letter VARCHAR(255), " +
            "name VARCHAR(255), " + 
            "email VARCHAR(255), " + 
            "phone VARCHAR(255), " + 
            "url VARCHAR(255))";
        db.executeSql(sql);
    }
    function loadPhoneJson(db) {
        db = window.openDatabase("pagesDB", "1.0", "PhoneGap Demo", 200000);
        $.getJSON( "https://mercury.hamilton.edu:7075/appPages/ajax/getAppData.cfm", function( data ) {
            db.transaction(function (transaction) {
                var len = data.length;
                for (var i = 0; i < len; i++) {
                    var id=data[i].id;
                    var letter=data[i].letter;           
                    var name=data[i].name;  
                    var email=data[i].email; 
                    var phone=data[i].phone; 
                    var url=data[i].url; 
                    transaction.executeSql('INSERT INTO phonenumbers (id,letter, name, email, phone, url) VALUES (?,?,?,?,?,?)',[id,letter, name, email, phone, url]);
                }
            });
        });
    }
    function db_error(db, error) {
        alert("Database Error: " + error);
    }
    function phonedb_success(db) {
        dbCreated = true;

        loadPhoneJson(db);
    }
    function getNumbers(tx) {
        var sql = "select * from phonenumbers order by letter"; 
        tx.executeSql(sql, [], getNumbers_success);
    }

    loadPhoneList = function(items){
        var phonecontacts = [];
        for (i = 0; i < items.rows.length; i++)
        {
            phonecontacts.push(items.rows.item(i));
        }   
        var markup = ' <li><a href="tel:${phone}" data-rel="dialog">${name}<br><span class="smgrey">${phone}</span>{{if url}}<br><span class="smgrey website" data-url="${url}">Website</span>{{/if}}{{if email}}<span class="smgrey website" data-mailto="${email}">${email}</span>{{/if}}</a></li>';
        $.template("contactTemplate", markup);
        $.tmpl("contactTemplate", phonecontacts).appendTo('ul#phonenumlist');
        $('#phonenumlist').listview("refresh");
        };
    function getNumbers_success(tx, results) {
        //$('#busy').hide();
       // $('.received').hide();
        loadPhoneList(results);
    }
    function checkversions (tx,whichsection, latestversion) {
         var sql = "select * from "+whichsection+" order by version"; 

        tx.executeSql(sql, [], getVersion_success,db_error);
    }
    function getNumbers_success(tx, results) {
        //$('#busy').hide();
       // $('.received').hide();
        loadPhoneList(results);
    }
    function initNumbers() {
        var db;
        var dbCreated =0;
        db = window.openDatabase("pagesDB", "1.0", "PhoneGap Demo", 200000);
        db.transaction(phoneChecks, db_error, phonedb_success);
    }
})();