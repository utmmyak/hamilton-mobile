var db;
var dbCreated = false;

$(document).ready(function() {
    db = window.openDatabase("pagesDB", "1.0", "PhoneGap Demo", 200000);
    //if there is no db then create it.
   // if (dbCreated){
       // db.transaction(getPages, transaction_error);
       // alert('db is created')
   // }else{
       // console.log(db);
        
       // contentChecks();
	 //  db.transaction(checkContent, contentCheck_error, checkContent_success);
   // }
});

function contentChecks(){
        var todayDate = moment().format("YYYY-MM-DD HH:mm");
        var uuid = guid();
        db = window.openDatabase("pagesDB", "1.0", "PhoneGap Demo", 200000);
            db.transaction(function (tx) {  
	       var sql = 
            "CREATE TABLE IF NOT EXISTS versionChecks ( "+
            "id varchar(50) PRIMARY KEY, " +
            "vieweraudience VARCHAR(255), " +
            "lastupdated DATE DEFAULT (datetime('now','localtime')), "+
            "versionstring VARCHAR(10))";
            tx.executeSql(sql);
            tx.executeSql('INSERT INTO versionChecks (id,vieweraudience,lastupdated,versionstring) VALUES (?,?,?,?)',[uuid,'S', todayDate,'1']);
            console.log('added versions data');
             //db.transaction(checkContent, contentCheck_error, checkContent_success);
        });

}
function contentCheck_error(tx, error) {
	$('#dbfeedback').show();
    $('#dbfeedback').html("Database Error: The stupid table does not exist" );
    contentChecks();
}
function transaction_error(tx, error) {
	$('#dbfeedback').show();
    $('#dbfeedback').html("Database Error: " + error);
}

function checkContent(tx) {
   	var sql = "select * from contentChecks"; 
	tx.executeSql(sql, [], checkContent_success);
}
function checkContent_success(tx, results) {
	$('#dbfeedback').hide();
    console.log(results.rows.length);
    var len = results.rows.length;
    if(len <= 0){
        $('#results').append('<p>No Content Results</p>')
    }
    for (var i=0; i<len; i++) {
    	var contentVersion = results.rows.item(i);
		$('#results').append('<p>'+ contentVersion.versionstring + '</p>');
        
    }
 
}
