<!--
(function() {
	if (typeof(window.top.fiplexTagsStr) === "undefined")
		window.top.fiplexTagsStr = "";
	if (typeof(window.top.fiplexSerialStr) === "undefined")
		window.top.fiplexSerialStr = "";	
	if (typeof(window.top.systemReady) === "undefined")
		window.top.systemReady = false;
})();
function showFactory() {
	if (loadPageVar("isFactory") == "true") {
		el = document.getElementById("start");
		el.className = "n";
		el = document.getElementById("serialNr");
		el.style.display = "inline";
		el.className = "nh";
	}
}
function VersionT() {
	this.fwStr = "---";
	this.swStr = "---";
	this.parse = function(sr) {
		try {
			this.fwMain = parseInt(sr.substr(0, 2), 16);
			this.fwSub = parseInt(sr.substr(2, 2), 16);
			this.fwMsb = parseInt(sr.substr(4, 2), 16);
			this.swMain = parseInt(sr.substr(6, 2), 16);
			this.swSub = parseInt(sr.substr(8, 2), 16);

			if (isNaN(this.fwMain) || isNaN(this.fwSub) || isNaN(this.fwMsb) 
				|| isNaN(this.swMain) || isNaN(this.swMain)) {
					return false;
			}
			this.fwStr = ''+this.fwMain+'.';
			var s = ('00'+this.fwSub).slice(-2);
			this.fwStr += s+'-';
			s = ('00'+this.fwMsb).slice(-2);
			this.fwStr += s;
			this.swStr = ''+this.swMain+'.';
			s = ('00'+this.swSub).slice(-2);
			this.swStr += s;
			return true;
		} catch (err) { }
	}
	this.render = function() {
		try {
			var el = document.getElementById('fwBox');
			if (el)
				el.innerHTML = this.fwStr;
			el = document.getElementById('swBox');
			if (el)
				el.innerHTML = this.swStr;
		} catch (err) { }
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
		this.sernr = sr;
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
function versionReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					loadVersion();
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { versionReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { versionReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { versionReq(); }, 2000);
		}
		xhr.open("POST", "/navi.html", true);
		xhr.timeout = 10000;
		xhr.send("version_req="+1);
		xhr = null;
	} catch (err) {}
}
function loadVersion() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					var res = version.parse(serverResponse);
					if (!res) {
						if (typeof(timerId) !== "undefined" && timerId)
							clearTimeout(timerId);
						timerId = setTimeout(function() { versionReq(); }, 2000);
						return;
					}
					version.render();
					sernrReq();
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { loadVersion(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadVersion(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadVersion(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/version.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
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
					localStorage.setItem("serial_1de"+window.location.host, serverResponse);
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
var version;
var timerId;
var serNr;
var waitIcon;
function initNav() {
	waitIcon = new MovingIcon(document.getElementById("cmdResult"));
	showFactory();
	version = new VersionT();
	serNr = new SerialNrT();
	versionReq();
}
// -->
