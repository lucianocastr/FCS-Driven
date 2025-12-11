var timerId;
var serNr;
var waitIcon;
var factoryFrame;
var currentRevision;
var tagsFrame;
var versionFrame;
var freqsFrame;
var confsFrame;
var confAdjFrame
// var isEthernetMode = true;

function initNav() {
	waitIcon = new MovingIcon(document.getElementById("cmdResult"));
	showFactory();
	var isPCstyle = (typeof(isEthernetMode) === 'undefined' || !isEthernetMode);
	hidePass(isPCstyle);
	serNr = new SerialNrT();
	sernrReq();
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
		el = document.getElementById("equadj");
		el.style.display = "inline";
		el.className = "n";
	}
}

function SerialNrT() {
	var self = this;
	this.sernr = "---";
	this.filterUnique180Kserial = "xxxx";
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
			var el = document.getElementById('sernrBox');
			if (el)
				el.innerHTML = this.sernr;
		} catch (err) { }
	}
	this.isReady = function() {
		return self.isLoaded;
	}
	this.isFilterUnique180 = function () {
		return (self.sernr == self.filterUnique180Kserial);
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
			if (this.readyState === 4 && this.status === 200) {
				var err = serNr.parse(this.responseText);
				if (err) {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { sernrReq(); }, 2000);
					return;
				}
				serNr.render();
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
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_sernr.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}

function filtRowDisplay(show) {
	var special = serNr.isFilterUnique180();
	var row1 = document.getElementById("fhelpRow");
	var row2 = document.getElementById("ftoolRow");
	row1.style.display = special ? "none" : "table-row";
	row2.style.display = (show && !special)? "table-row" : "none";
}

var fhelpW = null;
function filter_help_args(osc, clk, adj) {
	var el = document.getElementById("fhelp");
	if (!el) {
		return;
	}
	var urlstr = "/fhelp.html?osc="+osc+";clk="+clk+";adj="+adj;
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
function filterTool(osc, clk) {
	var el = document.getElementById("ftool");
	if (!el) {
		return;
	}
	var self = this;
	this.waitingConf = false;
	this.timerId;
	this.timerAp;
	var urlstr = "/ftool.zhtml?osc="+osc+";clk="+clk;
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
