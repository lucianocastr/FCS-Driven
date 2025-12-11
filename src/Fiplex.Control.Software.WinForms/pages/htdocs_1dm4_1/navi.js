<!--
(function() {
	if (typeof(window.top.fiplexConfStr) === "undefined")
		window.top.fiplexConfStr = "";
	if (typeof(window.top.fiplexFactStr) === "undefined")
		window.top.fiplexFactStr = "";
	if (typeof(window.top.fiplexTagsStr) === "undefined")
		window.top.fiplexTagsStr = "";
	if (typeof(window.top.fiplexSerialStr) === "undefined")
		window.top.fiplexSerialStr = "";	
	if (typeof(window.top.MaxChNr) === "undefined")
		window.top.MaxChNr = 24;
	if (typeof(window.top.TAGLEN) === "undefined")
		window.top.TAGLEN = 30;
	if (typeof(window.top.firstLoad) === "undefined")
		window.top.firstLoad = true;
	if (typeof(window.top.MaxRemotesNr) === "undefined")
		window.top.MaxRemotesNr = 24;
	if (typeof(window.top.MaxExpansorNr) === "undefined")
		window.top.MaxExpansorNr = 3;		
	if (typeof(window.top.currentRemotesNr) === "undefined")
		window.top.currentRemotesNr = 0;
	if (typeof(window.top.systemReady) === "undefined")
		window.top.systemReady = false;
	if (typeof(window.top.master_rx_loss_alarm) === "undefined")
		window.top.master_rx_loss_alarm = new Array();
	if (typeof(window.top.master_valid_conf) === "undefined")
		window.top.master_valid_conf = new Array();
	if (typeof(window.top.mode) === "undefined")
		window.top.mode = new Array();
	if (typeof(window.top.FiberMask) === "undefined")
		window.top.FiberMask = new Array();
	if (typeof(window.top.NumFiberRemote) === "undefined")
		window.top.NumFiberRemote = new Array();
	if (typeof(window.top.redundedFiberRemotes) === "undefined")
		window.top.redundedFiberRemotes = new Array();
	if (typeof(window.top.redundedFiberRemotesIndex) === "undefined")
		window.top.redundedFiberRemotesIndex = new Array();
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
		var srs = sr.split("\t");
		if (srs[0].length < this.maxlen)
			return false;
		srs[0] = srs[0].substr(4, srs[0].length-4);
		if (!srs[0].isPrintable())
			return false;
		this.sernr = srs[0];
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
	if (isPCstyle){
		loadSernr();
		return;
	}
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
						if (++serNrCount > serNrCountMax) {
							serNrCount = 0;
							window.top.systemReady = true;
							return;
						}
						timerId = setTimeout(function() { sernrReq(); }, 2000);
						return;
					}
					localStorage.setItem("serial_"+prjname+window.location.host, serverResponse);
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
		xhr.timeout = 15000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}

var timerId;
var serNr;
var serNrCount = 0;
var serNrCountMax = 10;
var waitIcon;
function initNav() {
	waitIcon = new MovingIcon(document.getElementById("cmdResult"));
	showFactory();
	hidePass(isPCstyle);
	serNr = new SerialNrT();
	sernrReq();
}
// -->