console.log("Checking settings");

/*CITE: http://www.w3schools.com/js/js_cookies.asp */


function setCookie(cname, cvalue) {
    console.log("Setting Cookie (name, value): " + cname + ", " + cvalue);
    document.cookie = cname + "=" + cvalue;
}


function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

function checkCookie() {
    var pref = getCookie("preference");
    if (pref != "") {
        console.log("cookies!");
    } else {
        user = prompt("Please enter your preference:", "");
        if (user != "" && user != null) {
            setCookie("preference", user);
        }
    }
}

//checkCookie();