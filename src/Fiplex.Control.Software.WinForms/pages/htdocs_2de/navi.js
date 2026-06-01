var timerId;
var serNrFrame;
var waitIcon;
var factoryFrame;
var currentRevision;
var tagsFrame;
var versionFrame;
var confFrame;
var deepDischargeButtonClicked = false;
var isEthernetMode = false;

function initNav() {
	waitIcon = new MovingIcon(document.getElementById("cmdResult"));
	showFactory();
	var isPCstyle = (typeof(isEthernetMode) === 'undefined' || !isEthernetMode);
	hidePass(isPCstyle);
}

function isPCstyle() {
	var isPCstyle = (typeof(isEthernetMode) === 'undefined' || !isEthernetMode);
	return isPCstyle;
}

function hidePass(isPc) {
	try {
		var el = document.getElementById("pass");
		var row = document.getElementById("passwordRow");
		row.style.display = isPc ? "none" : "table-row";
		el.style.display = isPc ? "none" : "inline";
		el = document.getElementById("serverVer");
		el.style.display = isPc ? "none" : "table-row";
		el = document.getElementById("serverBox");
		el.style.display = isPc ? "none" : "inline";
	} catch (err) {}
}
function hideIPconf(doHide) {
	try {
		el = document.getElementById("serverVer");
		el.style.display = doHide ? "none" : "table-row";
		el = document.getElementById("serverBox");
		el.style.display = doHide ? "none" : "inline";
		el = document.getElementById("communityRow");
		el.style.display = doHide ? "none" : "table-row";
		el = document.getElementById("comm");
		el.style.display = doHide ? "none" : "inline";
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
	}
}

function SerialNrT() {
	var self = this;
	this.sernr = "---";
	this.maxlen = 15;
	this.isLoaded = false;
	this.parse = function(sr) {
		if (sr.length != this.maxlen) {
			return -1;
		}
		if (!sr.isPrintable()) {
			return -1;
		}
		if (sr.substr(0, 5) == "HTTP/") {
			return -1;
		}
		this.sernr = sr.trim();
		this.isLoaded = true;
		return 0;
	}
	this.render = function() {
		try {
			var el = window.parent.navi.document.getElementById('sernrBox');
			if (el)
				el.innerHTML = this.sernr;
		} catch (err) { }
	}
	this.isReady = function() {
		return self.isLoaded;
	}
}