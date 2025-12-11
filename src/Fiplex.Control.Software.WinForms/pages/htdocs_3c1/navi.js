var timerId;
var serNrFrame;
var waitIcon;
var factoryFrame;
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

function endNav() {
	filterToolClose();
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
		el = document.getElementById("equalizer");
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

function filtRowDisplay(show) {
	var row = document.getElementById("ftoolRow");
	row.style.display = (show)? "table-row" : "none";
}

var fhelpW = null;
function filter_help_args() {
	var el = document.getElementById("fhelp");
	if (!el) {
		return;
	}
	var urlstr = "/fhelp.html";
	el.href = urlstr;
	var h = 500;
	var w = 840;
	var left = (screen.width/2)-(w/2);
	var top = (screen.height/2)-(h/2)-50;
	var wspecs = "height="+h+",width="+w+',left='+left+',top='+top;
	wspecs += ",toolbar=no,menubar=no,directories=no,status=no,titlebar=no";
	wspecs += ",resizable=1,scrollbars=1";
	el.wspecs = wspecs;
	el.onclick = function() {
		if (fhelpW && !fhelpW.closed) {
			fhelpW.close();
		}
		fhelpW = window.open(this.href, "help", this.wspecs);
		return false;
	}
}

var toolW = null;
function filterTool() {
	var el = document.getElementById("ftool");
	if (!el) {
		return;
	}
	var self = this;
	this.waitingConf = false;
	this.timerId;
	this.timerAp;
	var urlstr = "/ftool.zhtml";
	el.href = urlstr;
	var h = 520;
	var w = 820;
	var left = (screen.width/2)-(w/2);
	var top = (screen.height/2)-(h/2)-50;
	var wspecs = "height="+h+",width="+w+',left='+left+',top='+top;
	wspecs += ",toolbar=no,menubar=no,directories=no,status=no,titlebar=no";
	wspecs += ",resizable=1,scrollbars=1";
	el.wspecs = wspecs;
	el.onclick = function() {
		if (toolW && !toolW.closed) {
			toolW.close();
		}
		toolW = window.open(this.href, "ftool", this.wspecs);
		localStorage.setItem("filterToolCheckApply"+Prjstr+window.location.host,0);
		localStorage.setItem("fToolTime"+Prjstr+window.location.host,Date.now());
		self.filterToolCheckApply();
		return false;
	}
	this.filterToolCheckApply = function() {
		if (typeof(self.timerAp) !== 'undefined' && self.timerAp) {
			clearTimeout(self.timerAp);
		}
		var d = localStorage.getItem("fToolTime"+Prjstr+window.location.host);
		var diff = Math.abs(Date.now() - d) / 1000;
		if (diff>3) return;
		try {
			var notStatPage = !window.parent.content.startPage;
			var isSpect = window.parent.content.isSpectPage;
			if (localStorage.getItem("filterToolCheckApply"+Prjstr+window.location.host)==1) {
				localStorage.setItem("filterToolCheckApply"+Prjstr+window.location.host,0);
				var frms = JSON.parse(localStorage.getItem("ftGui_frms"+Prjstr+window.location.host));
				if (notStatPage) {
					if (isSpect) {
						window.parent.content.stop_loading_spectrum();
					}
					document.getElementById("start").click();
					setTimeout(function() {
						window.parent.content.toolSubmit(frms);
					}, 3000);
				} else {
					window.parent.content.toolSubmit(frms);
				}
			}
		} catch(err) {}
		self.timerAp = setTimeout(function() {
			self.filterToolCheckApply();
		}, 100);
	}
}

function filterToolClose() {
	if (toolW && !toolW.closed) {
		toolW.close();
	}
	if (fhelpW && !fhelpW.closed) {
		fhelpW.close();
	}
}

function filterHelpDisable() {
	var el = [];
	el.push(document.getElementById("fhelp"));
	el.push(document.getElementById("ftool"));
	for (var i = 0; i < el.length; ++i) {
		el[i].onclick = function(ev) {
			ev.preventDefault();
		}
	}
}
