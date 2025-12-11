<!--
(function() {
	if (typeof(window.top.fiplexFactStr) === "undefined")
		window.top.fiplexFactStr = "";
	if (typeof(window.top.systemReady) === "undefined")
		window.top.systemReady = false;
})();
function hidePass(isPc) {
	try {
		var el = document.getElementById("pass");
		var row = document.getElementById("passwordRow");
		row.style.display = isPc ? "none" : "table-row";
		el.style.display = isPc ? "none" : "inline";
		el = document.getElementById("serverVer");
		el.style.display = isPc ? "none" : "inline";
		el = document.getElementById("serverBox");
		el.style.display = isPc ? "none" : "inline";
		el = document.getElementById("communityRow");
		el.style.display = isPc ? "none" : "table-row";
		el = document.getElementById("comm");
		el.style.display = isPc ? "none" : "inline";
	} catch (err) {}
}
function showFactory() {
	if (loadPageVar("isFactory") == "true") {
		var el = document.getElementById("factory");
		el.style.display = "inline";
		el.className = "nh";
		el = document.getElementById("start");
		el.className = "n";
		el = document.getElementById("serialNr");
		el.style.display = "inline";
		el.className = "n";
		el = document.getElementById("equalizer");
		el.style.display = "inline";
		el.className = "n";
	}
}

function SerialNrT() {
	this.sernr = "---";
	this.maxlen = 15;
	this.parse = function(sr) {
		if (sr.length < this.maxlen)
			return false;
		if (!sr.isPrintable())
			return false;
		this.sernr = sr.substr(0,this.maxlen);
		return true;
	}
	this.render = function() {
		try {
			var el = document.getElementById('sernrBox');
			if (el)
				el.innerHTML = this.sernr;
		} catch (err) { }
	}
}

function sernrReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					loadSernr();
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { sernrReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { sernrReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { sernrReq(); }, 2000);
		}
		xhr.open("POST", "/navi.html", true);
		xhr.timeout = 10000;
		xhr.send("sernr_req="+1);
		xhr = null;
	} catch (err) {}
}
function loadSernr() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					var res = serNr.parse(serverResponse);
					if (!res) {
						if (typeof(timerId) !== "undefined" && timerId)
							clearTimeout(timerId);
						timerId = setTimeout(function() { sernrReq(); }, 2000);
						return;
					}
					localStorage.setItem("serial_1dm4"+window.location.host, serverResponse);
					serNr.render();
					window.top.systemReady = true;
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { loadSernr(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadSernr(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadSernr(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_sernr.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}

var timerId;
var serNr;
var waitIcon;
function initNav() {
	waitIcon = new MovingIcon(document.getElementById("cmdResult"));
	showFactory();
	hidePass(isPCstyle);
	serNr = new SerialNrT();
	sernrReq();
}
// -->