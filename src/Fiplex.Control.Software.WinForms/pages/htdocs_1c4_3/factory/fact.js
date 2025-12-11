var factory;
var version;
var monitor;
var isPass;
var tmrIdFact;
var countCheck;
var gui;

function onloadInit() {
	isPass = (loadPageVar("showPass") == "true");
	if (isPass) {
		factory = new FactoryPass();
		factory.createForm();
	} else {
		factory = new Factory();
		monitor = new Monitor();
		gui = new GuiFact();
		//gui.createForm();
	}
	guiBlocked(false);
	setTimeout(function() { start(); }, 200);
}

function start() {
	var err = showVersion();
	if (err) {
		versionReq();
	} else if (!isPass) {
		factReq();
	}
}

function reloadData() {
	if (!isPass) {
		showResultIcon(ERR_PENDING);
		guiBlocked(true);
		factReq();	
	}
}

function showVersion() {
	version = new Version();
	var str = version.retrieve();
	var err = version.parse(str);
	if (err < 0) {
		return err;
	}
	version.render();
	return err;
}

function versionReq() {
	try {
		if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
			clearTimeout(tmrIdFact);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				loadVersion();
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { versionReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { versionReq(); }, 100);
		}
		xhr.open("POST", "/factory/fact.zhtml", true);
		xhr.timeout = 5000;
		xhr.send("version_req="+1);
		xhr = null;
	} catch (err) {}
}

function loadVersion() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				version = new Version();
				var err = version.parse(this.responseText);
				if (!err) {
					version.render();
					version.store(this.responseText);
				}
				if (!isPass) {
					factReq();
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { loadVersion(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			versionReq();
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/version.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}

function FactoryPass() {
	this.createForm = function() {
		var Texts = TextEn;
		var row, cell, el;
		var cont = document.getElementById("page");
		var mainTab = document.createElement("table");
		cont.appendChild(mainTab);
		var mainTb = document.createElement("tbody");
		mainTab.appendChild(mainTb);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.colSpan = 2;
		cell.innerHTML = "FACTORY PASSWORD CHANGE";
		var c = [
			{h: "CURRENT&nbsp;PASSWORD", n: "fpass_curr"},
			{h: "NEW&nbsp;PASSWORD", n: "fpass_new"},
			{h: "CONFIRM&nbsp;PASSWORD", n: "fpass_confirm"}
			];
		for (var i = 0; i < 3; ++i) {
			row = document.createElement("tr");
			mainTb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = c[i].h;
			cell = document.createElement("td");
			row.appendChild(cell);
			el = document.createElement("input");
			el.type = "password";
			el.name = c[i].n;
			cell.appendChild(el);
		}
	}
}
function factReq() {
	try {
		if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
			clearTimeout(tmrIdFact);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_fact(); }, 1000);
				} else {
					if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
						clearTimeout(tmrIdFact);
					tmrIdFact = setTimeout(function() { factReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { factReq(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("POST", "/factory/fact.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("fact_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_fact() {
	if (isPass)
		return;
	try {
		if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
			clearTimeout(tmrIdFact);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					window.parent.navi.factoryFrame = serverResponse;
					factory.parse(serverResponse);
					if (factory.data.excludeFreq) gui.updateGUIfact();
					
					gui.createForm();
					gui.show(factory);
					factStr = serverResponse;
					localStorage.setItem("Factory"+Prjstr+window.location.host, serverResponse);
					initFormChangeCheck();
					var osc = factory.getOsc();
					var clk = factory.getClkNr();
					var adj = isDisplayAdj(factory, version);
					window.parent.navi.filter_help_args(osc, clk, adj);
					window.parent.navi.filterTool(osc, clk);
					guiBlocked(false);
					load_status();
				} else {
					tmrIdFact = setTimeout(function() { load_fact(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { load_fact(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { load_fact(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_fact.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function submitform() {
	if (!checkChange())
		return;
	if (typeof window.top.submitLocked === "undefined")
		window.top.submitLocked = false;
	if (window.top.submitLocked) {
		setTimeout(function() { guiBlocked(false); }, 15000);
		return;
	}
	if (!isPass) {
		clearTimeout(tmrIdFact);
		showResultIcon(ERR_PENDING);
		xhrOnStart();
		var fact = new Factory(factory.frm);
		gui.read(fact);
		var frm = fact.getFrm();
		factStr = frm;
		document.getElementById("factory_str").value = frm;
		doSubmit(frm);
	} else {
		var form = document.getElementById("factory_form");
		form.submit();
	}
}
function doSubmit(frm) {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					countCheck = 0;
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
		xhr.open("POST", "/factory/fact.zhtml", true);
		xhr.timeout = 5000;
		xhr.send("factory_str="+frm);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(ERR_FAIL); }, 1500);
	}
}

(function() {
	onunload = function() {
		guiBlocked(false);
		clearTimeout(tmrIdFact);
	};
})();

function xhrOnStart() {
	guiBlocked(true);
}

function xhrOnEnd(error) {
	factReq();
}

function check_result() {
	if (typeof countCheck === "undefined")
		countCheck = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				var error;
				if (this.status === 200) {
					error = parseInt(this.responseText);
					if (error != ERR_OK && error != ERR_FAIL) {
						if (++countCheck < 35) {
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
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function load_status() {
	try {
		if (typeof(tmrIdFact) !== "undefined" && tmrIdFact) {
			clearTimeout(tmrIdFact);
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState ===4 && this.status === 200) {
				monitor.parse(this.responseText);
				gui.showPaUlCurr(monitor);
				tmrIdFact = setTimeout(function() { load_status(); }, 1500);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { load_status(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { load_status(); }, 1000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function GuiFact() {
	this.shInPwrCorr = function(fact, b) {
		var el = document.getElementById('power'+'_'+b);
		el.value = fact.data.band[b].powerCorr.toFixed(1);
	}
	this.shSqTh = function(fact, b) {
		var el = document.getElementById('sqThr'+'_'+b);
		el.value = fact.data.band[b].sqTrhCorr.toFixed(1);
	}
	this.shGainCorr = function(fact, b) {
		var el = document.getElementById('maxGain'+'_'+b);
		el.value = fact.data.band[b].maxGainCorr.toFixed(1);
	}
	this.shPwrCorr = function(fact, b) {
		var el = document.getElementById('maxPow'+'_'+b);
		el.value = fact.data.band[b].maxPowerCorr.toFixed(1);
	}
	this.shRfOutCorr = function(fact, b) {
		var el = document.getElementById('diplex'+'_'+b);
		el.value = fact.data.band[b].diplexerLoss.toFixed(1);
	}
	this.shSpectWarn = function(fact, b) {
		var el = document.getElementById('spectWarn'+'_'+b);
		var val;
		if (b == 0) {
			val = fact.data.band[b].spectWarn * 10;
		} else {
			val = fact.data.band[b].spectWarn;
		}
		el.value = val;
	}
	this.shAttOut = function(fact, b) {
		var el = document.getElementById('attout'+'_'+b);
		el.value = fact.data.band[b].attout;
	}
	this.shPwrLim = function(fact, b) {
		var el = document.getElementById('powerLim'+'_'+b);
		el.value = fact.data.band[b].powerLim;
	}
	this.shPwrRedEn = function(fact, b) {
		var el = document.getElementById('powerReductionEnableUL'+'_'+b);
		el.selectedIndex = fact.data.pwrReductionEn ? 1 : 0;
	}
	this.shGainLim = function(fact, b) {
		var el = document.getElementById('gainLim'+'_'+b);
		el.value = fact.data.band[b].gainLim;
	}
	this.shPaMon = function(fact, b) {
		var el = document.getElementById('paMonitorSel'+'_'+b);
		if (fact.data.band[b].fipmon) {
			el.selectedIndex = 2;
		} else if (fact.data.band[b].hpamon) {
			el.selectedIndex = 1;
		} else {
			el.selectedIndex = 0;
		}
	}
	this.shPaUlCurrNoUse = function(fact, b) {
	}
	this.showPaUlCurr = function(mon) {
		var el = document.getElementById('hpaULcurrent_0');
		el.innerHTML = mon.stat.band[0].hpa.temperature.toFixed(0)+"&nbsp;mA";
	}
	this.shForcedPaUlCurr = function(fact, b) {
		var el = document.getElementById('ForcedUlPaCurrMonitor'+'_'+b);
		el.checked = fact.data.ulPaCurrMon;
	}
	this.shLowNoise = function(fact, b) {
		var el = document.getElementById('lowNoise'+'_'+b);
		el.checked = fact.data.ln;
	}
	this.shSimplex = function(fact, b) {
		var el = document.getElementById('simplex'+'_'+b);
		el.checked = fact.data.simplex;
	}
	this.shSpectOutCorr = function(fact, b) {
		var el = document.getElementById('spectCorr'+'_'+b);
		el.value = fact.data.bandAdj[b].spectHwCorr.toFixed(1);
	}
	this.shDcOffset = function(fact, b) {
		var el = document.getElementById('dcOffset'+'_'+b);
		el.value = hexformat(fact.data.bandAdj[b].dcOffset, 4);
	}
	this.shHwPaUlOff = function(fact, b) {
		var el = document.getElementById('disablePaUlHwEn'+'_'+b);
		el.checked = fact.data.disablePAUlHwEn;
	}
	this.shOpfEn = function(fact, b) {
		var el = document.getElementById('opfEnable'+'_'+b);
		el.checked = fact.data.opfEnable;
	}
	this.shNcoRx = function(fact, b) {
		var el = document.getElementById('ncoRx'+'_'+b);
		el.value = fact.data.band[b].ncoRx;
	}
	this.shNcoTx = function(fact, b) {
		var el = document.getElementById('ncoTx'+'_'+b);
		el.value = fact.data.band[b].ncoTx;
	}
	this.shFtw = function(fact, b) {
		var el = document.getElementById('ftw'+'_'+b);
		el.value = hexformat(fact.data.band[b].ftw, 8);
	}
	this.shFstart = function(fact, b) {
		var el = document.getElementById('fStart'+'_'+b);
		el.value = fact.data.band[b].fStart;
	}
	this.shFstop = function(fact, b) {
		var el = document.getElementById('fStop'+'_'+b);
		el.value = fact.data.band[b].fStop;
	}
	this.shFstartExc = function(fact, b) {
		var el = document.getElementById('fStartExc'+'_'+b);
		el.value = fact.data.band[b].fStartExc;
	}		
	this.shFstopExc = function(fact, b) {
		var el = document.getElementById('fStopExc'+'_'+b);
		el.value = fact.data.band[b].fStopExc;
	}	
	this.shFref = function(fact, b) {
		var el = document.getElementById('fo'+'_'+b);
		el.value = fact.data.band[b].fo;
	}
	this.shFdummy = function(fact, b) {
		var el = document.getElementById('fdummy'+'_'+b);
		el.value = hexformat(fact.data.band[b].fdummy, 4);
	}
	this.shPrescal = function(fact, b) {
		var el = document.getElementById('oscsel'+'_'+b);
		el.selectedIndex = (fact.data.band[b].oscsel == 0 ? 0 : 1);
	}
	this.shFmodulo = function(fact, b) {
		var el = document.getElementById('fmodulo'+'_'+b);
		el.value = fact.data.fmodulo;
	}
	this.shFstep = function(fact, b) {
		var el = document.getElementById('fstep'+'_'+b);
		el.value = fact.data.fstep;
	}
	this.shFastAgc = function(fact, b) {
		var el = document.getElementById('fastAgc'+'_'+b);
		el.selectedIndex = (fact.data.fastAgc != 0 ? 0 : 1);
	}
	this.shSpectInv = function(fact, b) {
		var el = document.getElementById('dacspect'+'_'+b);
		el.selectedIndex = fact.data.dacspect;
	}
	this.shDacMode = function(fact, b) {
		var el = document.getElementById('dacmode'+'_'+b);
		el.selectedIndex = fact.data.dacmode;
	}
	this.shBandwidths = function(fact, b) {
		var el = document.getElementById('bandwidths'+'_'+b);
	}
	this.shFmoduloAdj = function(fact, b) {
		var el = document.getElementById('fmoduloAdj'+'_'+b);
		el.value = fact.data.fmoduloAdj;
	}
	this.shFstepAdj = function(fact, b) {
		var el = document.getElementById('fstepAdj'+'_'+b);
		el.value = fact.data.fstepAdj;
	}
	this.shPwrInAdj = function(fact, b) {
		var el = document.getElementById('powerAdj'+'_'+b);
		el.value = fact.data.bandAdj[b].powerCorr.toFixed(1);
	}
	this.shSqThAdj = function(fact, b) {
		var el = document.getElementById('sqThrAdj'+'_'+b);
		el.value = fact.data.bandAdj[b].sqTrhCorr.toFixed(1);
	}
	this.shGainLimAdj = function(fact, b) {
		var el = document.getElementById('maxGainAdj'+'_'+b);
		el.value = fact.data.bandAdj[b].maxGainCorr.toFixed(1);
	}
	this.shPwrLimAdj = function(fact, b) {
		var el = document.getElementById('maxPowAdj'+'_'+b);
		el.value = fact.data.bandAdj[b].maxPowerCorr.toFixed(1);
	}
	this.shRfOutAdj = function(fact, b) {
		var el = document.getElementById('diplexAdj'+'_'+b);
		el.value = fact.data.bandAdj[b].diplexerLoss.toFixed(1);
	}
	this.shFstartAdj = function(fact, b) {
		var el = document.getElementById('fnStart'+'_'+b);
		el.value = fact.data.bandAdj[b].fnStart;
	}
	this.shFstopAdj = function(fact, b) {
		var el = document.getElementById('fnStop'+'_'+b);
		el.value = fact.data.bandAdj[b].fnStop;
	}
	this.shDualFw = function(fact, b) {
		var el = document.getElementById('dualFw'+'_'+b);
		el.checked = fact.data.dualFw;
	}
	this.rdInPwrCorr = function(fact, b) {
		var el = document.getElementById('power'+'_'+b);
		fact.data.band[b].powerCorr = parseFloat(el.value);
	}
	this.rdSqTh = function(fact, b) {
		var el = document.getElementById('sqThr'+'_'+b);
		fact.data.band[b].sqTrhCorr = parseFloat(el.value);
	}
	this.rdGainCorr = function(fact, b) {
		var el = document.getElementById('maxGain'+'_'+b);
		fact.data.band[b].maxGainCorr = parseFloat(el.value);
	}
	this.rdPwrCorr = function(fact, b) {
		var el = document.getElementById('maxPow'+'_'+b);
		fact.data.band[b].maxPowerCorr = parseFloat(el.value);
	}
	this.rdRfOutCorr = function(fact, b) {
		var el = document.getElementById('diplex'+'_'+b);
		fact.data.band[b].diplexerLoss = parseFloat(el.value);
	}
	this.rdSpectWarn = function(fact, b) {
		var el = document.getElementById('spectWarn'+'_'+b);
		var val;
		if (b == 0) {
			val = parseInt(el.value / 10);
		} else {
			val = parseInt(el.value);
		}
		fact.data.band[b].spectWarn = val;
	}
	this.rdAttOut = function(fact, b) {
		var el = document.getElementById('attout'+'_'+b);
		fact.data.band[b].attout = parseInt(el.value);
	}
	this.rdPwrLim = function(fact, b) {
		var el = document.getElementById('powerLim'+'_'+b);
		fact.data.band[b].powerLim = parseInt(el.value) & 0x7F;
	}
	this.rdPwrRedEn = function(fact, b) {
		var el = document.getElementById('powerReductionEnableUL'+'_'+b);
		fact.data.pwrReductionEn = el.selectedIndex > 0;
	}
	this.rdGainLim = function(fact, b) {
		var el = document.getElementById('gainLim'+'_'+b);
		fact.data.band[b].gainLim = parseInt(el.value);
	}
	this.rdPaMon = function(fact, b) {
		var el = document.getElementById('paMonitorSel'+'_'+b);
		if (el.selectedIndex == 2) {
			fact.data.band[b].fipmon = true;
			fact.data.band[b].hpamon = false;
		} else if (el.selectedIndex == 1) {
			fact.data.band[b].fipmon = false;
			fact.data.band[b].hpamon = true;
		} else {
			fact.data.band[b].fipmon = false;
			fact.data.band[b].hpamon = false;
		}
	}
	this.rdPaUlCurrNoUse = function(fact, b) {
	}
	this.rdForcedPaUlCurr = function(fact, b) {
		var el = document.getElementById('ForcedUlPaCurrMonitor'+'_'+b);
		fact.data.ulPaCurrMon = el.checked;
	}
	this.rdLowNoise = function(fact, b) {
		var el = document.getElementById('lowNoise'+'_'+b);
		fact.data.ln = el.checked;
	}
	this.rdSimplex = function(fact, b) {
		var el = document.getElementById('simplex'+'_'+b);
		fact.data.simplex = el.checked;
	}
	this.rdHwPaUlOff = function(fact, b) {
		var el = document.getElementById('disablePaUlHwEn'+'_'+b);
		fact.data.disablePAUlHwEn = el.checked;
	}
	this.rdOpfEn = function(fact, b) {
		var el = document.getElementById('opfEnable'+'_'+b);
		fact.data.opfEnable = el.checked;
	}
	this.rdSpectOutCorr = function(fact, b) {
		var el = document.getElementById('spectCorr'+'_'+b);
		fact.data.bandAdj[b].spectHwCorr = parseFloat(el.value);
	}
	this.rdDcOffset = function(fact, b) {
		var el = document.getElementById('dcOffset'+'_'+b);
		fact.data.bandAdj[b].dcOffset = parseInt(el.value, 16);
	}
	this.rdNcoRx = function(fact, b) {
		var el = document.getElementById('ncoRx'+'_'+b);
		fact.data.band[b].ncoRx = parseInt(el.value);
	}
	this.rdNcoTx = function(fact, b) {
		var el = document.getElementById('ncoTx'+'_'+b);
		fact.data.band[b].ncoTx = parseInt(el.value);
	}
	this.rdFtw = function(fact, b) {
		var el = document.getElementById('ftw'+'_'+b);
		fact.data.band[b].ftw = parseInt(el.value, 16);
	}
	this.rdFstart = function(fact, b) {
		var el = document.getElementById('fStart'+'_'+b);
		fact.data.band[b].fStart = parseInt(el.value);
	}
	this.rdFstop = function(fact, b) {
		var el = document.getElementById('fStop'+'_'+b);
		fact.data.band[b].fStop = parseInt(el.value);
	}
	this.rdFstartExc = function(fact, b) {
		var el = document.getElementById('fStartExc'+'_'+b);
		fact.data.band[b].fStartExc = parseInt(el.value);
	}
	this.rdFstopExc = function(fact, b) {
		var el = document.getElementById('fStopExc'+'_'+b);
		fact.data.band[b].fStopExc = parseInt(el.value);
	}	
	this.rdFref = function(fact, b) {
		var el = document.getElementById('fo'+'_'+b);
		fact.data.band[b].fo = parseInt(el.value);
	}
	this.rdFdummy = function(fact, b) {
		var el = document.getElementById('fdummy'+'_'+b);
		fact.data.band[b].fdummy = parseInt(el.value, 16);
	}
	this.rdPrescal = function(fact, b) {
		var el = document.getElementById('oscsel'+'_'+b);
		fact.data.band[b].oscsel = el.selectedIndex > 0;
	}
	this.rdFmodulo = function(fact, b) {
		var el = document.getElementById('fmodulo'+'_'+b);
		fact.data.fmodulo = parseInt(el.value);
	}
	this.rdFstep = function(fact, b) {
		var el = document.getElementById('fstep'+'_'+b);
		fact.data.fstep = parseInt(el.value);
	}
	this.rdFastAgc = function(fact, b) {
		var el = document.getElementById('fastAgc'+'_'+b);
		fact.data.fastAgc = (el.selectedIndex == 0 ? 1 : 0);
	}
	this.rdSpectInv = function(fact, b) {
		var el = document.getElementById('dacspect'+'_'+b);
		fact.data.dacspect = el.selectedIndex > 0;
	}
	this.rdDacMode = function(fact, b) {
		var el = document.getElementById('dacmode'+'_'+b);
		fact.data.dacmode = el.selectedIndex > 0;
	}
	this.rdBandwidths = function(fact, b) {
		var el = document.getElementById('bandwidths'+'_'+b);
	}
	this.rdFmoduloAdj = function(fact, b) {
		var el = document.getElementById('fmoduloAdj'+'_'+b);
		fact.data.fmoduloAdj = parseInt(el.value);
	}
	this.rdFstepAdj = function(fact, b) {
		var el = document.getElementById('fstepAdj'+'_'+b);
		fact.data.fstepAdj = parseInt(el.value);
	}
	this.rdPwrInAdj = function(fact, b) {
		var el = document.getElementById('powerAdj'+'_'+b);
		fact.data.bandAdj[b].powerCorr = parseFloat(el.value);
	}
	this.rdSqThAdj = function(fact, b) {
		var el = document.getElementById('sqThrAdj'+'_'+b);
		fact.data.bandAdj[b].sqTrhCorr = parseFloat(el.value);
	}
	this.rdGainLimAdj = function(fact, b) {
		var el = document.getElementById('maxGainAdj'+'_'+b);
		fact.data.bandAdj[b].maxGainCorr = parseFloat(el.value);
	}
	this.rdPwrLimAdj = function(fact, b) {
		var el = document.getElementById('maxPowAdj'+'_'+b);
		fact.data.bandAdj[b].maxPowerCorr = parseFloat(el.value);
	}
	this.rdRfOutAdj = function(fact, b) {
		var el = document.getElementById('diplexAdj'+'_'+b);
		fact.data.bandAdj[b].diplexerLoss = parseFloat(el.value);
	}
	this.rdDualFw = function(fact, b) {
		var el = document.getElementById('dualFw'+'_'+b);
		fact.data.dualFw = el.checked;
	}
	this.Titles = [
		'LEVEL&nbsp;ADJUSTMENTS',
		'FREQUENCY&nbsp;ADJUSTMENTS',
		'ADJUSTABLE&nbsp;BANDWITH&nbsp;SETTINGS'
	];
	this.Map = [
		[
			{
				id:'power',
				display: true,
				label:'POWER&nbsp;CORRECTION&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shInPwrCorr,
				read: this.rdInPwrCorr,
				len: 2
			},
			{
				id:'sqThr',
				display: true,
				label:'SQUELCH&nbsp;THRESHOLD&nbsp;CORRECTION&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shSqTh,
				read: this.rdSqTh,
				len: 2
			},
			{
				id:'maxGain',
				display: true,
				label:'MAX&nbsp;GAIN&nbsp;CORRECTION&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shGainCorr,
				read: this.rdGainCorr,
				len: 2
			},
			{
				id:'maxPow',
				display: true,
				label:'MAX&nbsp;POWER&nbsp;CORRECTION&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shPwrCorr,
				read: this.rdPwrCorr,
				len: 2
			},
			{
				id:'diplex',
				display: true,
				label:'RF&nbsp;OUT&nbsp;CORRECTION&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shRfOutCorr,
				read: this.rdRfOutCorr,
				len: 2
			},
			{
				id:'spectWarn',
				display: true,
				label:'HPA&nbsp;UL&nbsp;CURRENT&nbsp;/&nbsp;SPECTRUM&nbsp;DL&nbsp;WARNING&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shSpectWarn,
				read: this.rdSpectWarn,
				len: 2
			},
			{
				id:'attout',
				display: true,
				label:'OUTPUT&nbsp;ATTENUATOR&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shAttOut,
				read: this.rdAttOut,
				len: 2
			},
			{
				id:'powerLim',
				display: true,
				label:'POWER&nbsp;LIMIT&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shPwrLim,
				read: this.rdPwrLim,
				len: 2
			},
			{
				id:"powerReductionEnableUL",
				display: false,
				label:'UPLINK&nbsp;REDUCTION&nbspENABLE&nbsp;',
				type: 'select',
				options: [["OFF", "ON"]],
				show: this.shPwrRedEn,
				read: this.rdPwrRedEn,
				len: 1
			},
			{
				id:'gainLim',
				display: true,
				label:'GAIN&nbsp;LIMIT&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shGainLim,
				read: this.rdGainLim,
				len: 2
			},
			{
				id:'paMonitorSel',
				display: true,
				label:'PA&nbsp;POWER&nbsp;MONITOR&nbsp;',
				type: 'select',
				options: [["PA", "FPGA"], ["PA", "FPGA", "FIP413"]],
				show: this.shPaMon,
				read: this.rdPaMon,
				len: 2
			},
			{
				id:'hpaULcurrent',
				display: true,
				label:'HPA&nbsp;UL&nbsp;CURRENT',
				type: 'div',
				onkey: isKeyDecimalNumber,
				show: this.shPaUlCurrNoUse,
				read: this.rdPaUlCurrNoUse,
				len: 1
			},
			{
				id:'ForcedUlPaCurrMonitor',
				display: true,
				label:'FORCED&nbsp;UL&nbsp;PA&nbsp;CURRENT&nbsp;MONITOR',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shForcedPaUlCurr,
				read: this.rdForcedPaUlCurr,
				len: 1
			},
			{
				id:'simplex',
				display: true,
				label:'SIMPLEX&nbsp;MODE&nbsp;ALLOWED',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shSimplex,
				read: this.rdSimplex,
				len: 1
			},
			{
				id:'lowNoise',
				display: true,
				label:'LOW&nbsp;NOISE&nbsp;/&nbsp;HIGH&nbsp;DYNAMIC&nbsp;RANGE',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shLowNoise,
				read: this.rdLowNoise,
				len: 1
			},
			{
				id:'spectCorr',
				display: true,
				label:'SPECTRUM&nbsp;OUTPUT&nbsp;CORRECTION&nbsp',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shSpectOutCorr,
				read: this.rdSpectOutCorr,
				len: 2
			},
			{
				id:'dcOffset',
				display: true,
				label:'DC&nbsp;OFFSET&nbsp',
				type: 'input',
				inputtype: 'text',
				onkey: hexNumbersOnly,
				show: this.shDcOffset,
				read: this.rdDcOffset,
				len: 2
			},
			{
				id:'disablePaUlHwEn',
				display: true,
				label:'HW&nbsp;PA&nbsp;UL&nbsp;OFF&nbsp;DISABLE&nbsp;',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shHwPaUlOff,
				read: this.rdHwPaUlOff,
				len: 1
			},
			{
				id:'opfEnable',
				display: true,
				label:'OSCILLATION&nbsp;PREVENTION&nbsp;FEATURE&nbsp;ENABLE&nbsp;',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shOpfEn,
				read: this.rdOpfEn,
				len: 1
			}
		],
		[
			{
				id:'ncoRx',
				display: true,
				label:'NCO&nbsp;Rx&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shNcoRx,
				read: this.rdNcoRx,
				len: 2
			},
			{
				id:'ncoTx',
				display: true,
				label:'NCO&nbsp;Tx&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shNcoTx,
				read: this.rdNcoTx,
				len: 2
			},
			{
				id:'ftw',
				display: true,
				label:'DAC&nbsp;FTW&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: hexNumbersOnly,
				show: this.shFtw,
				read: this.rdFtw,
				len: 2
			},
			{
				id:'fStart',
				display: true,
				label:'BAND&nbsp;START&nbsp;FREQUENCY&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shFstart,
				read: this.rdFstart,
				len: 2
			},
			{
				id:'fStop',
				display: true,
				label:'BAND&nbsp;STOP&nbsp;FREQUENCY&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shFstop,
				read: this.rdFstop,
				len: 2
			},
			{
				id:'fo',
				display: true,
				label:'BAND&nbsp;REFERENCE&nbsp;FREQUENCY&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shFref,
				read: this.rdFref,
				len: 2
			},
			{
				id:'fdummy',
				display: true,
				label:'FREQUENCY&nbsp;DUMMY&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: hexNumbersOnly,
				show: this.shFdummy,
				read: this.rdFdummy,
				len: 2
			},
			{
				id:'oscsel',
				display: true,
				label:'DAC&nbsp;PRESCALER&nbsp;',
				type: 'select',
				options: [["OFF", "ON"], ["OFF", "ON"]],
				show: this.shPrescal,
				read: this.rdPrescal,
				len: 2
			},
			{
				id:'fmodulo',
				display: true,
				label:'FREQUENCY&nbsp;MODULO&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shFmodulo,
				read: this.rdFmodulo,
				len: 1
			},
			{
				id:'fstep',
				display: true,
				label:'CHANNEL&nbsp;FREQUENCY&nbsp;STEP&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shFstep,
				read: this.rdFstep,
				len: 1
			},
			{
				id:'fastAgc',
				display: true,
				label:'AGC&nbsp;MODE&nbsp;',
				type: 'select',
				options: [["P. Safety EUR", "P. Safety USA"]],
				show: this.shFastAgc,
				read: this.rdFastAgc,
				len: 1
			},
			{
				id:'dacspect',
				display: true,
				label:'SPECTRUM&nbsp;INVERSION',
				type: 'select',
				options: [["INVERTED", "NORMAL"]],
				show: this.shSpectInv,
				read: this.rdSpectInv,
				len: 1
			},
			{
				id:'dacmode',
				display: false,
				label:'DAC&nbsp;MODE',
				type: 'select',
				options: [["2C", "08"]],
				show: this.shDacMode,
				read: this.rdDacMode,
				len: 1
			},
			{
				id:'bandwidths',
				display: false,
				label:'CHANNEL&nbsp;BANDWIDTHS&nbsp;',
				type: 'input',
				inputtype: 'text',
				show: this.shBandwidths,
				read: this.rdBandwidths,
				len: 1
			},
		],
		[
			{
				id:'fmoduloAdj',
				display: true,
				label:'FREQUENCY&nbsp;MODULO&nbsp;ADJ&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shFmoduloAdj,
				read: this.rdFmoduloAdj,
				len: 1
			},
			{
				id:'fstepAdj',
				display: true,
				label:'CHANNEL&nbsp;FREQUENCY&nbsp;STEP&nbsp;ADJ&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shFstepAdj,
				read: this.rdFstepAdj,
				len: 1
			},
			{
				id:'powerAdj',
				display: true,
				label:'POWER&nbsp;CORRECTION&nbsp;ADJ&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shPwrInAdj,
				read: this.rdPwrInAdj,
				len: 2
			},
			{
				id:'sqThrAdj',
				display: true,
				label:'SQUELCH&nbsp;THRESHOLD&nbsp;CORRECTION&nbsp;ADJ&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shSqThAdj,
				read: this.rdSqThAdj,
				len: 2
			},
			{
				id:'maxGainAdj',
				display: true,
				label:'MAX&nbsp;GAIN&nbsp;CORRECTION&nbsp;ADJ&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shGainLimAdj,
				read: this.rdGainLimAdj,
				len: 2
			},
			{
				id:'maxPowAdj',
				display: true,
				label:'MAX&nbsp;POWER&nbsp;CORRECTION&nbsp;ADJ&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shPwrLimAdj,
				read: this.rdPwrLimAdj,
				len: 2
			},
			{
				id:'diplexAdj',
				display: true,
				label:'RF&nbsp;OUT&nbsp;CORRECTION&nbsp;ADJ&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shRfOutAdj,
				read: this.rdRfOutAdj,
				len: 2
			},
			{
				id:'dualFw',
				display: true,
				label:'DUAL&nbsp;FIRMWARE&nbsp;',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shDualFw,
				read: this.rdDualFw,
				len: 1
			}
		]
	];
	this.updateGUIfact = function() {
		var isUpdated = true;
		for (var n = 0; n < this.Map[0].length; ++n){
			if (this.Map[0][n].id == 'dcOffset'){
				this.Map[0].splice(n,1);
				isUpdated = false;
				break;
			}
		}
		if (isUpdated) return;
		for (var n = 0; n < this.Map[2].length; ++n){
			if (this.Map[2][n].id == 'diplexAdj'){
				this.Map[2].splice(n,1);
				break;
			}			
		}
		for (var n = 0; n < this.Map[1].length; ++n){
			if (this.Map[1][n].id == 'fStop'){
				this.Map[1].splice(n+1,0,{
				id:'fStartExc',
				display: true,
				label:'BAND&nbsp;START&nbsp;EXCLUDE&nbsp;FREQ.&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shFstartExc,
				read: this.rdFstartExc,
				len: 2
				});
				this.Map[1].splice(n+2,0,{
				id:'fStopExc',
				display: true,
				label:'BAND&nbsp;STOP&nbsp;EXCLUDE&nbsp;FREQ.&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shFstopExc,
				read: this.rdFstopExc,
				len: 2
				});				
				break;
			}
		}
	}
	this.createForm = function() {
		var cont = document.getElementById("page");
		remove_children(cont);
		var frm = document.createElement("input");
		frm.type = "hidden";
		frm.name = "factory_str";
		frm.id = frm.name;
		frm.value = "";
		cont.appendChild(frm);
		var mainTab = document.createElement("table");
		cont.appendChild(mainTab);
		var mainTb = document.createElement("tbody");
		mainTab.appendChild(mainTb);
		for (var i = 0; i < this.Map.length; ++i) {
			if (typeof(this.Titles[i]) !== 'undefined') {
				mainTb.appendChild(this.createTitle(this.Titles[i]));
				mainTb.appendChild(this.createSubtitle());
			}
			for (var j = 0; j < this.Map[i].length; ++j) {
				var row = this.createEntryRow(i, j);
				mainTb.appendChild(row);
			}
		}
		mainTb.appendChild(this.createPass());
	}
	this.createTitle = function(t) {
		var row = document.createElement("tr");
		row.style = "height: 20px";
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.colSpan = 2;
		cell.innerHTML = t;
		cell.style.color = "black";
		row.appendChild(cell);
		return row;
	}
	this.createSubtitle = function() {
		var Texts = TextEn;
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		for (var i = 0; i < 2; ++i) {
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = (i == 0 ? Texts['UPLINK'] : Texts['DNLINK']);
		}
		return row;
	}
	this.createEntryRow = function(m, n) {
		var ent = this.Map[m][n];
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		if (!ent.display) {
			row.style.display = "none";
		}
		cell.innerHTML = ent.label;
		for (var b = 0; b < ent.len; ++b) {
			var cell = document.createElement("td");
			row.appendChild(cell);
			var el = this.crtElement(ent, b)
			cell.appendChild(el);
		}
		return row;
	}
	this.crtElement = function(ent, b) {
		var type = ent.type;
		var el = document.createElement(type);
		el.id = el.name = ent.id + "_" + b;
		el.className = "factory";
		if (type == 'input') {
			el.type = ent.inputtype;
			if (el.type == 'text') {
				el.size = 14;
			}
			if (typeof(ent.onkey) != 'undefined') {
				el.onkeypress = function(ev) { return ent.onkey(ev); }
			}
		} else if (type == 'select') {
			for (var i = 0; i < ent.options[b].length; ++i) {
				var opt = document.createElement('option');
				el.options.add(opt);
				opt.text = ent.options[b][i];
				opt.value = i;
			}
		}
		return el;
	}
	this.createPass = function() {
		var row = document.createElement("tr");
		row.style.display = 'none';
		try {
			el = window.parent.navi.document.getElementById("pass");
			if (el && el.style.display !== 'none') {
				row.style.display = 'table-row';
			}
		} catch (err) { return row; }
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 3;
		cell.style.height = "40px";
		cell.style.verticalAlign = "bottom";
		cell.style.textAlign = "center";
		var el = document.createElement('a');
		cell.appendChild(el);
		el.href = "/factory/fact.zhtml?showPass=true";
		el.title = 'Change Factory Password';
		el.target = "content";
		var txt = document.createTextNode("Change Factory Password");
		el.appendChild(txt);
		return row;
	}
	this.show = function(fact) {
		for (var m = 0; m < this.Map.length; ++m) {
			for (var n = 0; n < this.Map[m].length; ++n) {
				for (var b = 0; b < this.Map[m][n].len; ++b) {
					try {
						this.Map[m][n].show(fact, b);
					} catch(err) {}
				}
			}
		}
	}
	this.read = function(fact) {
		for (var m = 0; m < this.Map.length; ++m) {
			for (var n = 0; n < this.Map[m].length; ++n) {
				for (var b = 0; b < this.Map[m][n].len; ++b) {
					try {
						this.Map[m][n].read(fact, b);
					} catch(err) {}
				}
			}
		}
	}
}

function isDisplayAdj(factory, version) {
	if (!factory.isDualFwAllowed()) {
		return version.isFwBwAdj();
	}
	return version.isFwBwAdj();
}
