<!--
var countIp;
function check_result()	{
	if (typeof countIp === "undefined")
		countIp = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var error = parseInt(this.responseText);
					if (error == ERR_OK) {
						showResult("#30d030", "DONE");
					} else if (error == ERR_FAIL) {
						showResult("#e03030", "FAIL");
					} else {
						if (++countIp < 10) {
							setTimeout(function() {check_result(); }, 1000);
							return;
						} else {
							showResult("#e03030", "Timeout");
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
		countIp = 0;
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
	countIp = 0;
	setTimeout(function() { window.location.replace('/ipsetting.zhtml'); }, 1500);
}
// -->
