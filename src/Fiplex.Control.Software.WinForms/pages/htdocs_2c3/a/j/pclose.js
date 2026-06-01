function check_result()	{
	if (typeof countPass === "undefined")
		countPass = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var error = parseInt(this.responseText);
					if (isNaN(error))
						showResult("#d03030", "Unknown");
					else {
						if (error < 0)
							error = -error;
						switch (error) {
						case 0: showResult("#30d030", "DONE"); break;
						case 1: showResult("#e03030", "ERROR: Current Password"); break;
						case 2: showResult("#e03030", "ERROR: Password Confirm"); break;
						case 3: showResult("#e03030", "FAIL: Authorization"); break;
						default: showResult("#e03030", "ERROR"); break;
						}
					}
				} else {
					showResult("#e03030", "Network Error");
				}
			}
		}
		xhr.onerror = function(ev) {
			showResult("#e03030", "Network Error");
		}
		xhr.ontimeout = function(ev) {
			showResult("#e03030", "Network Error");
		}
		countPass = 0;
		Date.now = Date.now || function() { return +new Date; }; 				
		xhr.open("GET", "/result.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function showResult(color, msg) {
	document.getElementById("textMsg").style.color = color;
	document.getElementById("textMsg").innerHTML = msg;
	setTimeout(function() { window.location.replace('/password.zhtml'); }, 1500);
}
