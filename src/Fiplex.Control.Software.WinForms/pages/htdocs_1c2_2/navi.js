<!--
var isPCstyle = true;
(function() {
	if (typeof(window.top.fiplexConfStr) === "undefined")
		window.top.fiplexConfStr = "";
	if (typeof(window.top.fiplexFactStr) === "undefined")
		window.top.fiplexFactStr = "";
	if (typeof(window.top.fiplexTagsStr) === "undefined")
		window.top.fiplexTagsStr = "";
	if (typeof(window.top.MaxChNr) === "undefined")
		window.top.MaxChNr = 12;
	if (typeof(window.top.TAGLEN) === "undefined")
		window.top.TAGLEN = 30;
	if (typeof(window.top.firstLoad) === "undefined")
		window.top.firstLoad = true;
})();
function hidePass(isPc) {
	try {
		var el = document.getElementById("pass");
		//var row = document.getElementById("passwordRow");
		//row.style.display = isPc ? "none" : "table-row";
		el.style.display = isPc ? "none" : "inline";
		el = document.getElementById("serverVer");
		el.style.display = isPc ? "none" : "table-row";
		el = document.getElementById("serverBox");
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
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					serNr.parse(serverResponse);
					serNr.render();
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
// var version;
var timerId;
var serNr;
var waitIcon;
var versionFrame;
function initNav() {
	waitIcon = new MovingIcon(document.getElementById("cmdResult"));
	showFactory();
	hidePass(isPCstyle);
	// version = new VersionT();
	serNr = new SerialNrT();
	// versionReq();
	sernrReq();
	var distribButton = new DistribButton();
}

function DistribButton() {
	this.elnav = document.getElementById("distrib_navi");
	this.elhead = window.parent.parent.head.document.getElementById("distrib_head");
	var self = this;
	this.navDblClicked = false;
	this.headClicked = false;
	this.elhead.onclick = function(ev) {
		ev = ev || window.event;
		if (ev.ctrlKey && ev.altKey) {
			self.headClicked = true;
			setTimeout(function() {
				self.headClicked = false;
			}, 5000);
			return false;
		}
		self.elnav.href = "http://fiplex.com";
		self.elnav.target = "_blank";
	}
	this.elnav.onclick = function(ev) {
		if (self.headClicked) {
			if (self.navDblClicked) {
				self.elnav.href = "distrib.zhtml";
				self.elnav.target = "content";
				self.navDblClicked = true;
			} else {
				return false;
			}
			self.headClicked = false;
		} else {
			self.elnav.href = "http://fiplex.com";
			self.elnav.target = "_blank";
		}
	}
	this.elnav.ondblclick = function(ev) {
		if (!self.headClicked) {
			return false;
		}
		self.navDblClicked = true;
		setTimeout(function() {
			self.navDblClicked = false;
		}, 5000);
		self.elnav.click();
	}
}
// -->
