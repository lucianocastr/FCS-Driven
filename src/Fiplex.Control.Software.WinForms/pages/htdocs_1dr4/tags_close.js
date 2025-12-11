<!--
var countTags;
function check_result()	{
	if (typeof countTags === "undefined")
		countTags = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var error = parseInt(this.responseText);
					if (error == ERR_OK) {
						showResult("#30d030", "DONE");
					} else if (error == ERR_FAIL) {
						showResult("#d03030", "FAIL");
					} else {
						if (++countTags < 10) {
							setTimeout(function() {check_result(); }, 1000);
							return;
						} else {
							showResult("#d03030", "Timeout");
						}
					}
				} else {
					showResult("#d03030", "Network Error");
				}
			}
		}
		xhr.onerror = function(ev) {
			showResult("#d03030", "Network Error");
		}
		xhr.ontimeout = function(ev) {
			showResult("#d03030", "Network Error");
		}
		countTags = 0;
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
	countTags = 0;
	setTimeout(function() { window.location.replace('/tags.zhtml'); }, 1500);
}
// -->
