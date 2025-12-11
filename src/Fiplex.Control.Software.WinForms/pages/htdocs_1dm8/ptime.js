<!--
var time;
var timerId;
function timeReq() {
	showResultIcon(ERR_NONE);
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					loadTime();
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { timeReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { timeReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { timeReq(); }, 2000);
		}
		xhr.open("POST", "/time.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("time_req="+1);
		xhr = null;
	} catch (err) {}
}
function loadTime() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					time.parse(serverResponse);
					time.render();
					initFormChangeCheck();
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { loadTime(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadTime(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadTime(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_time.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {  }
}
(function() {
	onunload = function() {
		cursorClear();
		showResultIcon(ERR_NONE);
	};
})();
function xhrOnStart() {
	cursorWait();
}
function xhrOnEnd(error) {
	cursorClear();
	showResultIcon(ERR_NONE);
}
function check_result() {
	if (typeof countConf === "undefined")
		countConf = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				var error;
				if (this.status === 200) {
					error = parseInt(this.responseText);
					if (error != ERR_OK && error != ERR_FAIL) {
						if (++countConf < 25) {
							setTimeout(function() { check_result(); }, 1000);
							return;
						} else
							error = ERR_FAIL;
					}
				} else {
					error = ERR_FAIL;
				}
				showResultIcon(error);
				setTimeout(function() { xhrOnEnd(error); }, 1500);
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/result.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function doSubmit(frm) {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					countConf = 0;
					setTimeout(function() { check_result(); }, 100);
				} else {
					showResultIcon(ERR_FAIL);
					setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
				}
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
		}
		xhr.open("POST", "/time.zhtml", true);
		xhr.timeout = 5000;
		xhrOnStart();
		xhr.send("time_str="+frm);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
	}
}
function submitform() {
	if (!checkChange())
		return;
	var frm = time.format();
	if (frm < 0) {
		return;
	}
	if (confirm("It is required to reboot supervision system.\nIf OK reload this page after a while."))
		doSubmit(frm);
}
function reloadData(){
	timeReq();
}
function initTime() {
	time = new TimeT();
	guiBlocked(false);
	timeReq();
}
// -->
