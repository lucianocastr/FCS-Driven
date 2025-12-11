<!--
var isPCstyle = true;
(function() {
	if (typeof(window.top.fiplexConfStr) === "undefined")
		window.top.fiplexConfStr = "";
	if (typeof(window.top.fiplexFactStr) === "undefined")
		window.top.fiplexFactStr = "";
	if (typeof(window.top.fiplexTagsStr) === "undefined")
		window.top.fiplexTagsStr = "";
	if (typeof(window.top.fiplexMsysStr) === "undefined")
		window.top.fiplexMsysStr = "";
	if (typeof(window.top.MaxChNr) === "undefined")
		window.top.MaxChNr = 8;
	if (typeof(window.top.TAGLEN) === "undefined")
		window.top.TAGLEN = 30;
	if (typeof(window.top.firstLoad) === "undefined")
		window.top.firstLoad = true;
})();
function hidePass(isPc) {
	var el = document.getElementById("pass");
	var row = document.getElementById("passwordRow");
	row.style.display = isPc ? "none" : "table-row";
	el.style.display = isPc ? "none" : "inline";
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
		el = document.getElementById("modsys");
		el.style.display = "inline";
		el.className = "n";
	}
}
function VersionT() {
	this.fwStr = "---";
	this.swStr = "---";
	this.ethStr = "---";
	this.hasEth = false;
	this.ethSz = 3;
	this.parse = function(sr) {
		try {
			if (sr.length != this.frmLengths.L10 
			    && sr.length != this.frmLengths.L16) {
				return -1;
			} else if (sr.length == this.frmLengths.L16) {
				this.hasEth = true;
			} else {
				this.hasEth = false;
			}
			var s = [];
			for (var i = 0; i < sr.length; i += 2) {
				var n = parseInt(sr.substr(i, 2), 16);
				if (isNaN(n))
					return -1;
				s.push(n);
			}
			var i = 0;
			this.fwMain = s[i++];
			this.fwSub = s[i++];
			this.fwMsb = s[i++];
			this.swMain = s[i++];
			this.swSub = s[i++];
			this.eth = [];
			if (this.hasEth) {
				var allzero = true;
				for (var j = 0; j < this.ethSz; ++j) {
					this.eth.push(s[i++]);
					if (this.eth[j] != 0) {
						allzero = false;
					}
				}
				if (allzero) {
					this.hasEth = false;
				}
			}
			this.makeStr();
			return 0;
		} catch (err) { }
	}
	this.makeStr = function() {
		var r =  ''+this.fwMain+'.';
		var s = ('00'+this.fwSub).slice(-2);
		r += s+'-';
		s = ('00'+this.fwMsb).slice(-2);
		r += s;
		this.fwStr = r;
		r = ''+this.swMain+'.';
		s = ('00'+this.swSub).slice(-2);
		r += s;
		this.swStr = r;
		if (this.hasEth) {
			r = this.eth[0];
			for (var i = 1; i < this.eth.length; ++i) {
				s = ('00'+this.eth[i]).slice(-2);
				r += '.' + s;
			}
			this.ethStr = r;
		}
	}
	this.store = function(sr) {
		localStorage.setItem("1A2_2_versionFrame_"+window.location.host, sr);
	}
	this.retrieve = function() {
		return localStorage.getItem("1A2_2_versionFrame_"+window.location.host);
	}
	this.render = function() {
		try {
			var el = window.parent.navi.document.getElementById('fwBox');
			if (el) {
				el.innerHTML = this.fwStr;
			}
			el = window.parent.navi.document.getElementById('swBox');
			if (el) {
				el.innerHTML = this.swStr;
			}
			el = window.parent.navi.document.getElementById('serverVer');
			if (el) {
				el.style.display = (this.hasEth || !isPCstyle) ? "inline" : "none";
			}
			el = window.parent.navi.document.getElementById('serverBox');
			if (el) {
				el.style.display = (this.hasEth || !isPCstyle) ? "inline" : "none";
				if (this.hasEth) {
					el.innerHTML = this.ethStr;
				}
			}
		} catch (err) { }
	}
	this.frmLengths = {
		L10: 	10,
		L16: 	16
	}
}
function SerialNrT() {
	this.sernr = "---";
	this.maxlen = 15;
	this.parse = function(sr) {
		if (sr.length != this.maxlen)
			return -1;
		if (!sr.isPrintable())
			return -1;
		if (sr.substr(0, 5) == "HTTP/")
			return -1;
		this.sernr = sr;
		return 0;
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
					version.parse(serverResponse);
					version.store(serverResponse);
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
			if (this.readyState === 4) {
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
			if (this.readyState === 4 && this.status === 200) {
				var err = serNr.parse(this.responseText);
				if (err) {
					sernrReq();
					return;
				}
				serNr.render();
			}
		}
		xhr.onerror = function(ev) {
			sernrReq();
		}
		xhr.ontimeout = function(ev) {
			sernrReq();
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
	hidePass(isPCstyle);
	version = new VersionT();
	serNr = new SerialNrT();
	versionReq();
}
// -->
