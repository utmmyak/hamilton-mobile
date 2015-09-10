var db;
var dbCreated = false;
var scroll = new iScroll('wrapper', { vScrollbar: false, hScrollbar:false, hScroll: false });
$(document).ready(function() {
    db = window.openDatabase("pagesDB", "1.0", "PhoneGap Demo", 200000);
    if (dbCreated){
        db.transaction(getPages, transaction_error);
    }else{
	   db.transaction(populateDB, transaction_error, populateDB_success);
    }
    contentChecks();
});
function getPages(tx) {
   	var sql = "select * from pages"; 
	tx.executeSql(sql, [], getPages_success);
}
function transaction_error(tx, error) {
	$('#busy').hide();
    alert("Database Error: " + error);
}

function populateDB_success(tx) {
	dbCreated = true;
    db.transaction(getPages, transaction_error);
}

function getPages(tx) {
   	var sql = "select * from pages"; 
	tx.executeSql(sql, [], getPages_success);
}

function getPages_success(tx, results) {
	$('#busy').hide();
    $('.received').hide();
    console.log(results.rows.length);
    var len = results.rows.length;
    for (var i=0; i<len; i++) {
    	var page = results.rows.item(i);
		$('#pageList').append('<li><a href="page.html?id=' + page.id + '">' +
				'<p class="line1">' + page.pagetitle + '</p>' +
				'<p class="line2">' + page.lastupdatedusername + '</p>' +
				'<span class="bubble">' + page.lastupdated + '</span></a></li>');
        
    }
 
}
function contentChecks(){
        var todayDate = moment().format();
        var uuid = guid();
        db = window.openDatabase("pagesDB", "1.0", "PhoneGap Demo", 200000);
    
        db.transaction(function (tx) {  
	       var sql = 
            "CREATE TABLE IF NOT EXISTS contentChecks ( "+
            "id varchar(50) PRIMARY KEY, " +
            "vieweraudience VARCHAR(255), " +
            "lastupdated datetime())";
            console.log(uuid);
            tx.executeSql(sql);
            console.log('added contentchecks');
            tx.executeSql('INSERT INTO contentChecks (id,vieweraudience,lastupdated,versionstring) VALUES (?,?,?,?)',[uuid,'S', todayDate,'1']);
            console.log('added contentchecks data');
        });

}
function guid() {
    function _p8(s) {
        var p = (Math.random().toString(16)+"000000000").substr(2,8);
        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}
function populateDB(tx) {
	$('#busy').show();
     tx.executeSql('DROP TABLE IF EXISTS pages'); 
	var sql = 
	"CREATE TABLE IF NOT EXISTS pages ( "+
		"id varchar(50) PRIMARY KEY, " +
		"pagetitle VARCHAR(255), " +
		"pagecontent VARCHAR(3000), " +
		"pageActive bit, " +
		"lastupdated date, " + 
		"lastupdatedusername VARCHAR(50))";
    tx.executeSql(sql);
    loadJson();
}
function loadJson(){
    $.getJSON( "https://mercury.hamilton.edu:7075/appPages/ajax/getpages.cfm", function( data ) { 
        db.transaction(function (transaction) {
            var len = data.length;
            for(var i = 0; i < len; i++) {
                var id=data[i].id;
                var pagetitle=data[i].pagetitle;           
                var pagecontent=data[i].pagecontents;  
                var pageactive=data[i].pageactive; 
                var lastupdated=data[i].lastupdated; 
                var lastupdatedusername=data[i].lastupdatedusername; 
                transaction.executeSql('INSERT INTO pages (id,pagetitle, pagecontent, pageActive, lastupdated, lastupdatedusername) VALUES (?,?,?,?,?,?)',[id, pagetitle, pagecontent, pageactive, lastupdated,lastupdatedusername]);
            }
        });
    });
}