<!--
var IPLEN = 4;
var IPNR = 5;
var newipaddr;
var timerId;
function onloadInit() {
	load_conf();
}
function reloadData(){
	load_conf();
}
function load_conf() {
	showResultIcon(ERR_NONE);
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					document.getElementById("np_ip_str").value = serverResponse;
					renderIp(serverResponse);
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { load_conf(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_conf(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_conf(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; }; 				
		xhr.open("GET", "/update_ip.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {};
}
function renderIp(serverResponse) {
	if (serverResponse.length != 2*IPLEN*IPNR) {
		alert("Error: Configuration unknown!");
	}
	var i = 0;
	for (var j = 0; j < IPNR; j++){
		for (var k = 0; k < IPLEN; k++) {
			try {
				var num = parseInt(serverResponse.substr(i, 2), 16);
				if (isNaN(num))
					num = '';
			} catch (err) { num = ''; }
			i += 2;
			document.getElementById("ip_"+j+k).value = ''+num;
		}
	}
}
function submitform() {
	var i = 0;
	newipaddr = '';
	var ipstr = '';
	var binip, binnm, bingw;

	for (var j = 0; j < IPNR; j++) {
		var ipbin = '';
		for (var k = 0; k < IPLEN; k++) {
			var obj = document.getElementById("ip_"+j+k);
			if (isNaN(obj.value)) {
				obj.style.backgroundColor = "#EE5555";
				return;
			}
			var num = parseInt(obj.value);
			if (num > 255 || num < 0) {
				obj.style.backgroundColor = "#EE5555";
				return;
			}
			var tmp = num.toString(16);
			tmp = ("00" + num.toString(16)).slice(-2);
			ipstr += tmp;
			tmp = ("00000000" + num.toString(2)).slice(-8);
			ipbin += tmp;
			if (j == 0) {
				newipaddr += obj.value;
				if (k < IPLEN - 1) {
					newipaddr += '.';
				}
			}
		}
		if (j == 0)
			binip = ipbin;
		else if (j == 1)
			binnm = ipbin;
		else if (j == 2)
			bingw = ipbin;
	}
	if (checkip(binip, binnm, bingw) < 0) {
		return;
	}
	document.getElementById("np_ip_str").value = ipstr;
	document.getElementById("ip_form").submit();
}
function checkip(binip, binnm, bingw) {
	var idx = binnm.indexOf('0');
	if (idx == -1)
		return -1;
	if (binnm.indexOf('1', idx) != -1)
		return -1;
	if (binip.substr(0, idx-1) != bingw.substr(0, idx-1))
		return -1;
	return 0;
}
// -->