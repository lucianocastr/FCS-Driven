var factory;
var version;
var monitor;
var monitorNFPA;
var isPass;
var tmrIdFact;
var countCheck;
var gui;
var serNr;
var config;

function onloadInit() {
	isPass = (loadPageVar("showPass") == "true");
	if (isPass) {
		factory = new FactoryPass();
		factory.createForm();
	} else {
		serNr = new SerialNrT();
		factory = new Factory();
		monitor = new Monitor();
		monitorNFPA = new NFPAstatus();
		version = new Version();
		config = new Config();
		config.parse(config.retrieveFrameStr());
		gui = new GuiFact();
		gui.createForm();
	}
	guiBlocked(false);
	setTimeout(function() { start(); }, 200);
}

function start() {
	globalConfigReq();
}
function globalConfigReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				loadConfigGlobal();
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { globalConfigReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { globalConfigReq(); }, 100);
		}
		xhr.open("POST", "/start.zhtml", true);
		xhr.timeout = 5000;
		xhr.send("global_req="+1);
		xhr = null;
	} catch (err) {}
}
function loadConfigGlobal() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				parseGlobalConfig(this.responseText);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadConfigGlobal(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { loadConfigGlobal(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/global_conf.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function parseGlobalConfig(str) {
	if ( typeof(str) === 'undefined' || str === null ) {
		versionReq();
		return;
	}
	str = correctASCII(str);
	var srarr = str.split('\t');
	if (srarr.length < 7) {
		versionReq();
		return;
	}

	var srConf = srarr[0];
	var srFact = srarr[1];
	var srSerNr = srarr[3];
	var srVersion = srarr[5];
	var srNFPA = srarr[6]; 

	serNr.parse(srSerNr);
	serNr.render();

	window.parent.navi.versionFrame = srVersion;
	version.parse(srVersion);
	version.store(srVersion);
	config.parse(srConf);

	window.parent.navi.factoryFrame = srFact;
	srFact = correctASCII(srFact);
	factory.parse(srFact);
	gui.show(factory);
	localStorage.setItem("Factory"+Prjstr+window.location.host, srFact);
	window.parent.navi.filter_help_args();
	window.parent.navi.filterTool();
	guiBlocked(false);
	version.render(factory.ethernetModuleNotInstalled);
	window.parent.navi.hideIPconf(factory.ethernetModuleNotInstalled);
	window.parent.navi.confNfpaFrame = srNFPA;
	gui.optionsDisable();
	gui.disableBbuStatusElements();
	load_NFPAstatus();
}

function reloadData() {
	if (!isPass) {
		showResultIcon(ERR_PENDING);
		guiBlocked(true);
		//factReq();	
		globalConfigReq();
	}
}

function showVersion() {
	version = new Version();
	var str = version.retrieve();
	var err = version.parse(str);
	if (err < 0) {
		return err;
	}
	version.render(factory.ethernetModuleNotInstalled||false);
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
		xhr.send("versioneth_req="+1);
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
					version.render(factory.ethernetModuleNotInstalled||false);
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
		xhr.open("GET", "/versioneth.shtml?co="+Date.now(), true);
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
					var serverResponse = correctASCII(this.responseText);
					window.parent.navi.factoryFrame = serverResponse;
					serverResponse = correctASCII(serverResponse);
					factory.parse(serverResponse);
					gui.show(factory);
					window.parent.navi.hideIPconf(factory.ethernetModuleNotInstalled);
					version.render(factory.ethernetModuleNotInstalled);
					factStr = serverResponse;
					localStorage.setItem("Factory"+Prjstr+window.location.host, correctASCIIOnlyText(serverResponse));
					initFormChangeCheck();
					window.parent.navi.filter_help_args();
					window.parent.navi.filterTool();
					guiBlocked(false);
					gui.optionsDisable();
					load_NFPAstatus();
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
function submitOnClearDeepDischargeButton(ev) {
	if (typeof window.top.submitLocked === "undefined")
		window.top.submitLocked = false;
	if (window.top.submitLocked) {
		setTimeout(function() { guiBlocked(false); }, 15000);
		return;
	}
	clearTimeout(tmrIdFact);
	showResultIcon(ERR_PENDING);
	xhrOnStart();
	factory.clearDeepDischargeCounter = true;
	var frm = factory.getFrm();
	factStr = frm;
	document.getElementById("factory_str").value = frm;
	doSubmit(frm);
	return true;
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
				var frm = this.responseText;
				monitor.parse(frm);
				gui.showPaUlCurr(monitor);
				tmrIdFact = setTimeout(function() { load_NFPAstatus(); }, 200);
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
function load_NFPAstatus() {
	try {
		if (typeof(tmrIdFact) !== "undefined" && tmrIdFact) {
			clearTimeout(tmrIdFact);
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState ===4 && this.status === 200) {
				var frm = this.responseText;
				monitorNFPA.parse(frm, config.bbu_type);
				gui.showNFPAStatus(monitorNFPA);
				tmrIdFact = setTimeout(function() { load_status(); }, 200);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { load_NFPAstatus(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdFact) !== "undefined" && tmrIdFact)
				clearTimeout(tmrIdFact);
			tmrIdFact = setTimeout(function() { load_NFPAstatus(); }, 1000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_nfpa.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function GuiFact() {
	this.shInPwrCorr = function(fact, b) {
		var el = document.getElementById('power'+'_'+b);
		el.value = fact.levelOffset[b].toFixed(1);
	}
	this.shSqTh = function(fact, b) {
		var el = document.getElementById('sqThr'+'_'+b);
		el.value = fact.sQOffset[b].toFixed(1);
	}
	this.shGainCorr = function(fact, b) {
		var el = document.getElementById('maxGain'+'_'+b);
		el.value = fact.gainOffset[b].toFixed(1);
	}
	this.shPwrCorr = function(fact, b) {
		var el = document.getElementById('maxPow'+'_'+b);
		el.value = fact.powerOffset[b].toFixed(1);
	}
	this.shPaCurrentMin = function(fact, b) {
		var el = document.getElementById('paCurrentMin'+'_'+b);
		el.value = fact.paCurrentMin[b];
	}
	this.shPaCurrentMax = function(fact, b) {
		var el = document.getElementById('paCurrentMax'+'_'+b);
		el.value = fact.paCurrentMax[b];
	}
	this.shAttOut = function(fact, b) {
		var el = document.getElementById('attout'+'_'+b);
		el.value = fact.attout[b];
	}
	this.shPwrLim = function(fact, b) {
		var el = document.getElementById('powerLim'+'_'+b);
		el.value = fact.powerlimit[b];
	}
	this.shGainLim = function(fact, b) {
		var el = document.getElementById('gainLim'+'_'+b);
		el.value = fact.gainlimit[b];
	}
	this.shPaUlCurrNoUse = function(fact, b) {
	}
	this.showPaUlCurr = function(mon) {
		var el;
		for (var k=0;k<4;k++){
			el = document.getElementById('hpaULcurrent_'+k);
			el.value = mon.paCurrent[Math.floor(k/2)][k%2].toFixed(0)+"mA";
		}
		el = document.getElementById('calPaCurr_5');
		el.value = mon.paCurrent[0][1].toFixed(0)+'mA';
		el = document.getElementById('calBoardCurr_5');
		el.value = mon.boardCurrent.toFixed(0);
	}
	this.showNFPAStatus = function(mon){
		for (var band = 0;band<2;band++){
			var el = document.getElementById('calDlPowDet_'+band+'_5');
			el.value = mon.powDirect[band].toFixed(1)+'dBm';
			var el = document.getElementById('calDlPowDet_'+band+'_4');
			el.value = mon.adPowDirect[band].toFixed(0);
		}
		var el = document.getElementById('calPaCurr_4');
		el.value = mon.adDlPaCurr[0].toFixed(0);
		var el = document.getElementById('deepDischargeCounter_0');
		el.value = mon.bbuDeepDischargeCounter;
		// if ( !(uCSupportsBbuMvo2Mode(version) && isBbuSerialMode(config, factory, version)) ) el.value = 0;
		this.showBbuStatusFactoryParams(mon, config.bbu_type);
	}
	this.shSimplex = function(fact, b) {
		var el = document.getElementById('simplex'+'_'+b);
		el.checked = fact.Simplex[b];
	}
	this.shSpectOutCorr = function(fact, b) {
		var el = document.getElementById('spectCorr'+'_'+b);
		el.value = fact.rfoutSpecOffset[b].toFixed(1);
	}
	this.shDcOffsetI = function(fact, b) {
		var el = document.getElementById('dcOffsetI'+'_'+b);
		el.value = fact.DCOFFSETI[b];
	}
	this.shDcOffsetQ = function(fact, b) {
		var el = document.getElementById('dcOffsetQ'+'_'+b);
		el.value = fact.DCOFFSETQ[b];
	}	
	this.shOpfEn = function(fact, b) {
		var el = document.getElementById('opfEnable'+'_'+b);
		el.checked = fact.oscFeatureEnable;
	}
	this.shTestModeEn = function(fact, b) {
		var el = document.getElementById('testModeEn'+'_'+b);
		el.checked = fact.testModeEnable;
	}
	this.shExtremeTempActionEn = function(fact, b) {
		var el = document.getElementById('extremeTempActionEn'+'_'+b);
		el.checked = fact.extremeTempActionEnable;
	}
	this.shNcoRx = function(fact, b) {
		var el = document.getElementById('ncoRx'+'_'+b);
		el.value = fact.NCO_Rx[b];
	}
	this.shNcoTx = function(fact, b) {
		var el = document.getElementById('ncoTx'+'_'+b);
		el.value = fact.NCO_Tx[b];
	}
	this.shFtw = function(fact, b) {
		var el = document.getElementById('ftw'+'_'+b);
		el.value = hexformat(fact.DACFTW[b], 8);
	}
	this.shFstart = function(fact, b) {
		var el = document.getElementById('fStart'+'_'+b);
		el.value = fact.fstart[b];
	}
	this.shFstop = function(fact, b) {
		var el = document.getElementById('fStop'+'_'+b);
		el.value = fact.fstop[b];
	}
	this.shFref = function(fact, b) {
		var el = document.getElementById('fo'+'_'+b);
		el.value = fact.fref[b];
	}
	this.shFdummy = function(fact, b) {
		var el = document.getElementById('fdummy'+'_'+b);
		el.value = hexformat(fact.fdummy[b], 4);
	}
	this.shFmodulo = function(fact, b) {
		var el = document.getElementById('fmodulo'+'_'+b);
		el.value = fact.fmodulo;
	}
	this.shFstep = function(fact, b) {
		var el = document.getElementById('fstep'+'_'+b);
		el.value = fact.fstep;
	}
	this.shAgcMode = function(fact, b) {
		var el = document.getElementById('agcMode'+'_'+b);
		el.selectedIndex = (fact.agcModeUSA[b]? 1 : 0);
	}
	this.shSpectInv = function(fact, b) {
		var el = document.getElementById('dacspect'+'_'+b);
		el.selectedIndex = fact.spectrumNormal[b]? 1 : 0;
	}
	this.shNumADJFilters = function(fact, b) {
		var el = document.getElementById('numADJFilters'+'_'+b);
		el.selectedIndex = fact.numADJFilters-1;
	}	
	this.shChBandEn = function(fact, b) {
		var el = document.getElementById('chBandEnabled'+'_'+b);
		el.checked = fact.chBandEnabled[b];
	}	
	this.shAdjBandEn = function(fact, b) {
		var el = document.getElementById('adjBandEnabled'+'_'+b);
		el.checked = fact.adjBandEnabled[b];
	}	
	this.shSingleBandEn = function(obj, b) {
		var el = document.getElementById('singleBandEnabled'+'_'+b);
		el.checked = obj.singleBandEnabled[b];
	}
	this.shFmoduloAdj = function(fact, b) {
		var el = document.getElementById('fmoduloAdj'+'_'+b);
		el.value = fact.fmoduloadj;
	}
	this.shFstepAdj = function(fact, b) {
		var el = document.getElementById('fstepAdj'+'_'+b);
		el.value = fact.fstepAdj;
	}
	this.shFstartAdj = function(fact, b) {
	}
	this.shFstopAdj = function(fact, b) {
	}
	this.shBandLabel = function(fact, b) {
		var el = document.getElementById('bandNames'+'_'+b);
		el.value = fact.bandNames[b];
	}
	this.rdInPwrCorr = function(fact, b) {
		var el = document.getElementById('power'+'_'+b);
		fact.levelOffset[b] = parseFloat(el.value);
	}
	this.rdSqTh = function(fact, b) {
		var el = document.getElementById('sqThr'+'_'+b);
		fact.sQOffset[b] = parseFloat(el.value);
	}
	this.rdGainCorr = function(fact, b) {
		var el = document.getElementById('maxGain'+'_'+b);
		fact.gainOffset[b] = parseFloat(el.value);
	}
	this.rdPwrCorr = function(fact, b) {
		var el = document.getElementById('maxPow'+'_'+b);
		fact.powerOffset[b] = parseFloat(el.value);
	}
	this.rdPaCurrentMin = function(fact, b) {
		var el = document.getElementById('paCurrentMin'+'_'+b);
		fact.paCurrentMin[b] = parseInt(el.value);
	}
	this.rdPaCurrentMax = function(fact, b) {
		var el = document.getElementById('paCurrentMax'+'_'+b);
		fact.paCurrentMax[b] = parseInt(el.value);
	}
	this.rdAttOut = function(fact, b) {
		var el = document.getElementById('attout'+'_'+b);
		fact.attout[b] = parseInt(el.value);
	}
	this.rdPwrLim = function(fact, b) {
		var el = document.getElementById('powerLim'+'_'+b);
		fact.powerlimit[b] = parseInt(el.value) & 0x7F;
	}
	this.rdGainLim = function(fact, b) {
		var el = document.getElementById('gainLim'+'_'+b);
		fact.gainlimit[b] = parseInt(el.value);
	}
	this.rdPaUlCurrNoUse = function(fact, b) {
	}
	this.rdSimplex = function(fact, b) {
		var el = document.getElementById('simplex'+'_'+b);
		fact.Simplex[b] = el.checked;
	}
	this.rdOpfEn = function(fact, b) {
		var el = document.getElementById('opfEnable'+'_'+b);
		fact.oscFeatureEnable = el.checked;
	}
	this.rdTestModeEn = function(fact, b) {
		var el = document.getElementById('testModeEn'+'_'+b);
		fact.testModeEnable = el.checked;
	}
	this.rdExtremeTempActionEn = function(fact, b) {
		var el = document.getElementById('extremeTempActionEn'+'_'+b);
		fact.extremeTempActionEnable = el.checked;
	}
	this.rdSpectOutCorr = function(fact, b) {
		var el = document.getElementById('spectCorr'+'_'+b);
		fact.rfoutSpecOffset[b] = parseFloat(el.value);
	}
	this.rdDcOffsetI = function(fact, b) {
		var el = document.getElementById('dcOffsetI'+'_'+b);
		fact.DCOFFSETI[b] = parseInt(el.value);
	}
	this.rdDcOffsetQ = function(fact, b) {
		var el = document.getElementById('dcOffsetQ'+'_'+b);
		fact.DCOFFSETQ[b] = parseInt(el.value);
	}	
	this.rdNcoRx = function(fact, b) {
		var el = document.getElementById('ncoRx'+'_'+b);
		fact.NCO_Rx[b] = parseInt(el.value);
	}
	this.rdNcoTx = function(fact, b) {
		var el = document.getElementById('ncoTx'+'_'+b);
		fact.NCO_Tx[b] = parseInt(el.value);
	}
	this.rdFtw = function(fact, b) {
		var el = document.getElementById('ftw'+'_'+b);
		fact.DACFTW[b] = parseInt(el.value, 16);
	}
	this.rdFstart = function(fact, b) {
		var el = document.getElementById('fStart'+'_'+b);
		fact.fstart[b] = parseInt(el.value);
	}
	this.rdFstop = function(fact, b) {
		var el = document.getElementById('fStop'+'_'+b);
		fact.fstop[b] = parseInt(el.value);
	}
	this.rdFref = function(fact, b) {
		var el = document.getElementById('fo'+'_'+b);
		fact.fref[b] = parseInt(el.value);
	}
	this.rdFdummy = function(fact, b) {
		var el = document.getElementById('fdummy'+'_'+b);
		fact.fdummy[b] = parseInt(el.value, 16);
	}
	this.rdFmodulo = function(fact, b) {
		var el = document.getElementById('fmodulo'+'_'+b);
		fact.fmodulo = parseInt(el.value);
	}
	this.rdFstep = function(fact, b) {
		var el = document.getElementById('fstep'+'_'+b);
		fact.fstep = parseInt(el.value);
	}
	this.rdAgcMode = function(fact, b) {
		var el = document.getElementById('agcMode'+'_'+b);
		fact.agcModeUSA[b] = (el.selectedIndex != 0);
	}
	this.rdNumADJFilters = function(fact, b) {
		var el = document.getElementById('numADJFilters'+'_'+b);
		fact.numADJFilters = el.selectedIndex + 1;
	}
	this.rdSpectInv = function(fact, b) {
		var el = document.getElementById('dacspect'+'_'+b);
		fact.spectrumNormal[b] = (el.selectedIndex != 0);
	}	
	this.rdChBandEn = function(fact, b) {
		var el = document.getElementById('chBandEnabled'+'_'+b);
		fact.chBandEnabled[b] = el.checked;
	}
	this.rdAdjBandEn = function(fact, b) {
		var el = document.getElementById('adjBandEnabled'+'_'+b);
		fact.adjBandEnabled[b] = el.checked;
	}
	this.rdSingleBandEn = function(obj, b) {
		var el = document.getElementById('singleBandEnabled'+'_'+b);
		obj.singleBandEnabled[b] = el.checked;
	}
	this.rdFmoduloAdj = function(fact, b) {
		var el = document.getElementById('fmoduloAdj'+'_'+b);
		fact.fmoduloadj = parseInt(el.value);
	}
	this.rdFstepAdj = function(fact, b) {
		var el = document.getElementById('fstepAdj'+'_'+b);
		fact.fstepAdj = parseInt(el.value);
	}
	this.rdBandLabel = function(fact, b) {
		var el = document.getElementById('bandNames'+'_'+b);
		var name = el.value.substr(0, fact.BANDNAMELEN);
		fact.bandNames[b] = name.trim();
	}
	this.shAgcThrsUp = function(fact, b) {
		var el = document.getElementById('agcThresholdUp'+'_'+b);
		el.value = fact.agcThresholdUp[b];
	}
	this.shAgcThrsDown = function(fact, b) {
		var el = document.getElementById('agcThresholdDown'+'_'+b);
		el.value = fact.agcThresholdDown[b];
	}
	this.rdAgcThrsUp = function(fact, b) {
		var el = document.getElementById('agcThresholdUp'+'_'+b);
		var value = parseInt(el.value);
		if (value < 0) {
			value = 0;
		} else if (value > 255) {
			value = 255;
		}
		fact.agcThresholdUp[b] = value;
	}
	this.rdAgcThrsDown = function(fact, b) {
		var el = document.getElementById('agcThresholdDown'+'_'+b);
		var value = parseInt(el.value);
		if (value < 0) {
			value = 0;
		} else if (value > 255) {
			value = 255;
		}
		fact.agcThresholdDown[b] = value;
	}
	this.shADummyThresholdOn = function(fact, b) {
		var el = document.getElementById('previsionThresholdUp'+'_'+b);
		el.value = fact.previsionThresholdUp[b];
	}
	this.shAttInMin = function(fact, b) {
		var el = document.getElementById('attInMin'+'_'+b);
		el.value = fact.attInMin[b];
	}
	this.rdADummyThresholdOn = function(fact, b) {
		var el = document.getElementById('previsionThresholdUp'+'_'+b);
		var value = parseInt(el.value);
		if (value < 0) {
			value = 0;
		} else if (value > 255) {
			value = 255;
		}
		fact.previsionThresholdUp[b] = value;
	}
	this.rdAttInMin = function(fact, b) {
		var el = document.getElementById('attInMin'+'_'+b);
		var value = parseInt(el.value);
		if (value < 0) {
			value = 0;
		} else if (value > 255) {
			value = 255;
		}
		fact.attInMin[b] = value;
	}
	this.shCalDlPowDet0 = function(fact, b) {
		if (b>3) return;
		var el = document.getElementById('calDlPowDet_0_'+b);
		el.value = fact.calDlPowerDetector[0].x[b].toFixed(1);
	}
	this.rdCalDlPowDet0 = function(fact, b) {
		if (b>3) return;
		var el = document.getElementById('calDlPowDet_0_'+b);
		var value = parseFloat(el.value);
		if (b<2) value = parseInt(value);
		fact.calDlPowerDetector[0].x[b] = value;
	}
	this.shCalDlPowDet1 = function(fact, b) {
		if (b>3) return;
		var el = document.getElementById('calDlPowDet_1_'+b);
		el.value = fact.calDlPowerDetector[1].x[b].toFixed(1);
	}
	this.rdCalDlPowDet1 = function(fact, b) {
		if (b>3) return;
		var el = document.getElementById('calDlPowDet_1_'+b);
		var value = parseFloat(el.value);
		if (b<2) value = parseInt(value);
		fact.calDlPowerDetector[1].x[b] = value;
	}
	this.shCalPaCurr = function(fact, b) {
		if (b>3) return;
		var el = document.getElementById('calPaCurr_'+b);
		el.value = fact.calPaCurrentDetector.x[b];
	}
	this.rdCalPaCurr = function(fact, b) {
		if (b>3) return;
		var el = document.getElementById('calPaCurr_'+b);
		var value = parseInt(el.value);
		fact.calPaCurrentDetector.x[b] = value;
	}
	this.shCalBoardCurr = function(fact, b) {
		if (b>3) return;
		var el = document.getElementById('calBoardCurr_'+b);
		el.value = fact.calBoardCurrentDetector.x[b];
	}
	this.rdCalBoardCurr = function(fact, b) {
		if (b>3) return;
		var el = document.getElementById('calBoardCurr_'+b);
		var value = parseInt(el.value);
		fact.calBoardCurrentDetector.x[b] = value;
	}
	this.shRelayInst = function(fact,b) {
		var el = document.getElementById('relayInst_'+b);
		el.value = hexformat(fact.relayInstalled, 2);
	}
	this.rdRelayInst = function(fact, b) {
		var el = document.getElementById('relayInst_'+b);
		var value = parseInt(el.value,16);
		fact.relayInstalled = value;
	}
	this.shRelayModeConf = function(fact,b) {
		var el = document.getElementById('relayModeConf_'+b);
		el.value = hexformat(fact.relayModeConfiguration,2);
	}
	this.rdRelayModeConf = function(fact, b) {
		var el = document.getElementById('relayModeConf_'+b);
		var value = parseInt(el.value,16);
		fact.relayModeConfiguration = value;
	}
	this.shEthernetModuleNotInstalled = function(fact, b) {
		var el = document.getElementById('ethernetModuleNotInstalled'+'_'+b);
		el.checked = fact.ethernetModuleNotInstalled;
	}
	this.rdEthernetModuleNotInstalled = function(fact, b) {
		var el = document.getElementById('ethernetModuleNotInstalled'+'_'+b);
		fact.ethernetModuleNotInstalled = el.checked;
	}
	this.shULlowGainMode = function(fact, b) {
		var el = document.getElementById('ULlowGainMode'+'_'+b);
		el.checked = fact.ULlowGainMode;
	}
	this.rdULlowGainMode = function(fact, b) {
		var el = document.getElementById('ULlowGainMode'+'_'+b);
		fact.ULlowGainMode = el.checked;
	}	
	// this.shMMSmode = function(fact, b) {
	// 	var el = document.getElementById('MMSmode'+'_'+b);
	// 	el.checked = fact.MMSmode;
	// }
	// this.rdMMSmode = function(fact, b) {
	// 	var el = document.getElementById('MMSmode'+'_'+b);
	// 	fact.MMSmode = el.checked;
	// }
	this.shFasRelayTestMode = function(fact, b) {
		var el = document.getElementById('FASrelayTestMode'+'_'+b);
		el.checked = fact.FASrelayTestMode;
	}
	this.rdFasRelayTestMode = function(fact, b) {
		var el = document.getElementById('FASrelayTestMode'+'_'+b);
		fact.FASrelayTestMode = el.checked;
	}
	this.shDeepDischargeThreshold = function(fact, b) {
		var el = document.getElementById('deepDischargeThreshold_'+b);
		el.value = (fact.deepDischargeVolt_mV/1000).toFixed(1);
	}
	this.rdDeepDischargeThreshold = function(fact, b) {
		var el = document.getElementById('deepDischargeThreshold_'+b);
		var v = Math.round(parseFloat(el.value)*1000);
		if (v < 0) v=0; if (v > 65535) v=65535;
		fact.deepDischargeVolt_mV = v;
	}
	this.shDeepDischargeCounterNoUse = function(fact, b) {}
	this.rdDeepDischargeCounterNoUse = function(fact, b) {}
	this.shClearDeepDischargeCounterNoUse = function(fact, b) {}
	this.rdClearDeepDischargeCounterNoUse = function(fact, b) {}
	this.rdBbuParamNoUse = function(fact, b) {}
	this.shBbuParamNoUse = function(fact, b) {}
	this.Titles = [
		'GENERAL&nbsp;PARAMETERS',
		'BAND&nbsp;PARAMETERS',
		'UL/DL&nbsp;PARAMETERS',		
		'UL/DL&nbsp;BAND&nbsp;PARAMETERS',
		'DETECTORS&nbsp;CALIBRATION',
		'',
		'BBU&nbsp;PARAMETERS',
	];
	this.bbuStatusParametersMvo2Std = [
		{id: 'max_charge_timer'	, label: 'MAX&nbsp;CHARGE&nbsp;TIMER&nbsp;'	},
		{id: 'cv_timer'			, label: 'CV&nbsp;TIMER&nbsp;'				},
		{id: 'absorb_timer'		, label: 'ABSORB&nbsp;TIMER&nbsp;'			},
		{id: 'equalize_timer'	, label: 'EQUALIZE&nbsp;TIMER&nbsp;'		},
		{id: 'charger_state'	, label: 'CHARGER&nbsp;STATE&nbsp;'			},
		{id: 'charge_status'	, label: 'CHARGE&nbsp;STATUS&nbsp;'			},
		{id: 'limit_alerts'		, label: 'LIMIT&nbsp;TIMER&nbsp;'			},
		{id: 'charger_state_alerts', label: 'CHARGER&nbsp;STATE&nbsp;'		},
		{id: 'charge_status_alerts', label: 'CHARGE&nbsp;STATUS&nbsp;'		},
		{id: 'system_status'	, label: 'SYSTEM&nbsp;STATUS&nbsp;'			},
		{id: 'vbat'				, label: 'VBAT&nbsp;'						},
		{id: 'vin'				, label: 'VIN&nbsp;'						},
		{id: 'vsys'				, label: 'VSYS&nbsp;'						},
		{id: 'ibat'				, label: 'IBAT&nbsp;'						},
		{id: 'iin'				, label: 'IIN&nbsp;'						},
		{id: 'die_temp'			, label: 'DIE&nbsp;TEMP&nbsp;'				},
		{id: 'ntc_ratio'		, label: 'NTC&nbsp;RATIO&nbsp;'				},
		{id: 'bsr'				, label: 'BSR&nbsp;'						},
		{id: 'jeita_region'		, label: 'JEITA&nbsp;REGION&nbsp;'			},
		{id: 'chem_cells'		, label: 'CHEM&nbsp;CELLS&nbsp;'			},
		{id: 'icharge_dac'		, label: 'ICHARGE&nbsp;DAC&nbsp;'			},
		{id: 'vcharge_dac'		, label: 'VCHARGE&nbsp;DAC&nbsp;'			},
		{id: 'iin_limit_dac'	, label: 'IIN&nbsp;LIMIT&nbsp;DAC&nbsp;'	},
		{id: 'vbat_filt'		, label: 'VBAT&nbsp;FILT&nbsp;'				},
		{id: 'icharge_bsr'		, label: 'ICHARGE&nbsp;BSR&nbsp;'			},
		{id: 'reserved'			, label: 'RESERVED&nbsp;'					},
		{id: 'meas_sys_valid'	, label: 'MEAS&nbsp;SYS&nbsp;VALID&nbsp;'	}
	];
	this.bbuStatusParametersMvo2HP = [
		{id: 'VOUT_SET'				, label: 'VOUT_SET'				},
		{id: 'IOUT_SET'				, label: 'IOUT_SET'				},
		{id: 'FAULT_STATUS'			, label: 'FAULT_STATUS'			},
		{id: 'READ_VOUT'			, label: 'READ_VOUT'			},
		{id: 'READ_IOUT'			, label: 'READ_IOUT'			},
		{id: 'READ_TEMPERATURE_1'	, label: 'READ_TEMPERATURE_1'	},
		{id: 'MFR_ID_B0B5'			, label: 'MANUFACTURER'			},
		{id: 'MFR_MODEL_B0B5'		, label: 'MODEL'				},
		{id: 'MFR_REVISION_B0B5'	, label: 'MFR_REVISION'			},
		{id: 'MFR_LOCATION_B0B2'	, label: 'MFR_LOCATION'			},
		{id: 'MFR_DATE_B0B5'		, label: 'MFR_DATE'				},
		{id: 'MFR_SERIAL_B0B5'		, label: 'MFR_SERIAL'			},
		{id: 'CURVE_CC'				, label: 'CURVE_CC'				},
		{id: 'CURVE_CV'				, label: 'CURVE_CV'				},
		{id: 'CURVE_FV'				, label: 'CURVE_FV'				},
		{id: 'CURVE_TC'				, label: 'CURVE_TC'				},
		{id: 'CURVE_CONFIG'			, label: 'CURVE_CONFIG'			},
		{id: 'CURVE_CC_TIMEOUT'		, label: 'CURVE_CC_TIMEOUT'		},
		{id: 'CURVE_CV_TIMEOUT'		, label: 'CURVE_CV_TIMEOUT'		},
		{id: 'CURVE_FV_TIMEOUT'		, label: 'CURVE_FV_TIMEOUT'		},
		{id: 'CHG_STATUS'			, label: 'CHG_STATUS'			},
		{id: 'SCALING_FACTOR'		, label: 'SCALING_FACTOR'		},
		{id: 'SYSTEM_STATUS'		, label: 'SYSTEM_STATUS'		},
		{id: 'SYSTEM_CONFIG'		, label: 'SYSTEM_CONFIG'		}
	];
	this.createBbuMap = function(bbuType) {
		var bbuParameters = (bbuType==2? this.bbuStatusParametersMvo2HP:this.bbuStatusParametersMvo2Std);
		var bbuMap = [];
		for (var i = 0; i < bbuParameters.length; i++) {
			bbuMap.push({
				id: bbuParameters[i].id,
				display: true,
				label: bbuParameters[i].label,
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shBbuParamNoUse,
				read: this.rdBbuParamNotUsed,
				len: 1
			});
		}
		return bbuMap;
	}
	this.showBbuStatusFactoryParams = function(mon, bbuType) {
		var bbuParameters = (bbuType==2? this.bbuStatusParametersMvo2HP:this.bbuStatusParametersMvo2Std);
		var n = (bbuType==2? 1 : 0);
		for (var i=0; i < bbuParameters.length; i++) {
			document.getElementById(bbuParameters[i].id+'_0').value = mon.bbuStatusFactoryParams[n][i].valueStr;
		}
	}
	this.Map = [
		[
			{
				id:'numADJFilters',
				display: true,
				label:'NUM&nbsp;ADJ&nbsp;FILTERS',
				type: 'select',
				options: [["1", "2", "3", "4"]],
				show: this.shNumADJFilters,
				read: this.rdNumADJFilters,
				len: 1
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
				id:'opfEnable',
				display: true,
				label:'OSCILLATION&nbsp;PREVENTION&nbsp;FEATURE&nbsp;ENABLE&nbsp;',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shOpfEn,
				read: this.rdOpfEn,
				len: 1
			},
			{
				id:'testModeEn',
				display: true,
				label:'TEST&nbsp;MODE&nbsp;',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shTestModeEn,
				read: this.rdTestModeEn,
				len: 1
			},
			{
				id:'extremeTempActionEn',
				display: true,
				label:'EXTREME&nbsp;TEMPERATURE&nbsp;ACTION&nbsp;ENABLE',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shExtremeTempActionEn,
				read: this.rdExtremeTempActionEn,
				len: 1
			},
			{
				id:'ethernetModuleNotInstalled',
				display: true,
				label:'ETHERNET&nbsp;MODULE&nbsp;NOT&nbsp;INSTALLED',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shEthernetModuleNotInstalled,
				read: this.rdEthernetModuleNotInstalled,
				len: 1
			},
			{
				id:'ULlowGainMode',
				display: true,
				label:'UL&nbsp;LOW&nbsp;GAIN&nbsp;MODE',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shULlowGainMode,
				read: this.rdULlowGainMode,
				len: 1
			},
			// {
			// 	id:'MMSmode',
			// 	display: true,
			// 	label:'MMS&nbsp;MODE',
			// 	type: 'input',
			// 	inputtype: 'checkbox',
			// 	show: this.shMMSmode,
			// 	read: this.rdMMSmode,
			// 	len: 1
			// },
			{
				id:'FASrelayTestMode',
				display: true,
				label:'RELAY&nbsp;TEST&nbsp;MODE',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shFasRelayTestMode,
				read: this.rdFasRelayTestMode,
				len: 1
			},
			{
				id:'deepDischargeThreshold',
				display: true,
				label:'BBU&nbsp;DEEP&nbsp;DISCHARGE&nbsp;THRESHOLD&nbsp;(V)<br>(PER&nbsp;BATTERY)',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shDeepDischargeThreshold,
				read: this.rdDeepDischargeThreshold,
				len: 1
			},
			{
				id:'deepDischargeCounter',
				display: true,
				label:'BBU&nbsp;DEEP&nbsp;DISCHARGE&nbsp;COUNTER',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shDeepDischargeCounterNoUse,
				read: this.rdDeepDischargeCounterNoUse,
				len: 1
			},
			{
				id:'clearDeepDischargeCounter',
				display: true,
				label:'CLEAR&nbsp;BBU&nbsp;DEEP&nbsp;DISCHARGE&nbsp;COUNTER',
				type: 'input',
				inputtype: 'button',
				onclick: submitOnClearDeepDischargeButton,
				value: "CLEAR",
				show: this.shClearDeepDischargeCounterNoUse,
				read: this.rdClearDeepDischargeCounterNoUse,
				len: 1
			}
		],
		[
			{
				id:'chBandEnabled',
				display: true,
				label:'NARROW&nbsp;FILTERS&nbsp;ENABLED&nbsp;',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shChBandEn,
				read: this.rdChBandEn,
				len: 2
			},
			{
				id:'adjBandEnabled',
				display: true,
				label:'ADJBW&nbsp;FILTERS&nbsp;ENABLED&nbsp;',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shAdjBandEn,
				read: this.rdAdjBandEn,
				len: 2
			},
			{
				id:'singleBandEnabled',
				display: true,
				label:'SINGLE&nbsp;BAND&nbsp;ENABLED&nbsp;',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shSingleBandEn,
				read: this.rdSingleBandEn,
				len: 2
			},		
			{
				id:'simplex',
				display: true,
				label:'SIMPLEX&nbsp;MODE&nbsp;ALLOWED',
				type: 'input',
				inputtype: 'checkbox',
				show: this.shSimplex,
				read: this.rdSimplex,
				len: 2
			},
			{
				id:'agcMode',
				display: true,
				label:'AGC&nbsp;MODE&nbsp;',
				type: 'select',
				options: [["P. Safety EUR", "P. Safety USA"],["P. Safety EUR", "P. Safety USA"]],
				show: this.shAgcMode,
				read: this.rdAgcMode,
				len: 2
			},
			{
				id:'bandNames',
				display: true,
				label:'BAND&nbsp;NAMES&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isText,
				show: this.shBandLabel,
				read: this.rdBandLabel,
				len: 2
			},
			{
				id:'attInMin',
				display: true,
				label:'MIN&nbsp;ATTENUATION&nbsp;AGC&nbsp;BB',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shAttInMin,
				read: this.rdAttInMin,
				len: 2
			}
		],
		[	
			{
				id:'dacspect',
				display: true,
				label:'SPECTRUM&nbsp;INVERSION',
				type: 'select',
				options: [["INVERTED", "NORMAL"],["INVERTED", "NORMAL"]],
				show: this.shSpectInv,
				read: this.rdSpectInv,
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
				id:'dcOffsetI',
				display: true,
				label:'DC&nbsp;OFFSET&nbspI',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shDcOffsetI,
				read: this.rdDcOffsetI,
				len: 2
			},
			{
				id:'dcOffsetQ',
				display: true,
				label:'DC&nbsp;OFFSET&nbspQ',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shDcOffsetQ,
				read: this.rdDcOffsetQ,
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
				id:'previsionThresholdUp',
				display: true,
				label:'NOT&nbsp;USED',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shADummyThresholdOn,
				read: this.rdADummyThresholdOn,
				len: 2
			}
		],
		[				
			{
				id:'power',
				display: true,
				label:'LEVEL&nbsp;CORRECTION&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shInPwrCorr,
				read: this.rdInPwrCorr,
				len: 4
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
				len: 4
			},
			{
				id:'maxGain',
				display: true,
				label:'GAIN&nbsp;CORRECTION&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shGainCorr,
				read: this.rdGainCorr,
				len: 4
			},
			{
				id:'maxPow',
				display: true,
				label:'POWER&nbsp;CORRECTION&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shPwrCorr,
				read: this.rdPwrCorr,
				len: 4
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
				len: 4
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
				len: 4
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
				len: 4
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
				len: 4
			},
			{
				id:'ncoRx',
				display: true,
				label:'NCO&nbsp;Rx&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shNcoRx,
				read: this.rdNcoRx,
				len: 4
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
				len: 4
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
				len: 4
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
				len: 4
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
				len: 4
			},
			{
				id:'agcThresholdUp',
				display: true,
				label:'AGC&nbsp;THRESHOLD&nbsp;UP&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shAgcThrsUp,
				read: this.rdAgcThrsUp,
				len: 4
			},
			{
				id:'agcThresholdDown',
				display: true,
				label:'AGC&nbsp;THRESHOLD&nbsp;DOWN&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shAgcThrsDown,
				read: this.rdAgcThrsDown,
				len: 4
			},
			{
				id:'paCurrentMin',
				display: true,
				label:'PA&nbsp;CURRENT&nbsp;MIN&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shPaCurrentMin,
				read: this.rdPaCurrentMin,
				len: 4
			},
			{
				id:'paCurrentMax',
				display: true,
				label:'PA&nbsp;CURRENT&nbsp;MAX&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shPaCurrentMax,
				read: this.rdPaCurrentMax,
				len: 4
			},
			{
				id:'hpaULcurrent',
				display: true,
				label:'PA&nbsp;CURRENT&nbsp;MEAS&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shPaUlCurrNoUse,
				read: this.rdPaUlCurrNoUse,
				len: 4
			},			
		],
		[
			{
				id:'calDlPowDet_0',
				display: true,
				label:'BAND0&nbsp;DL&nbsp;POWER&nbsp;DETECTOR&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shCalDlPowDet0,
				read: this.rdCalDlPowDet0,
				len: 6
			},
			{
				id:'calDlPowDet_1',
				display: true,
				label:'BAND1&nbsp;DL&nbsp;POWER&nbsp;DETECTOR&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shCalDlPowDet1,
				read: this.rdCalDlPowDet1,
				len: 6
			},
			{
				id:'calPaCurr',
				display: true,
				label:'PA&nbsp;CURRENT&nbsp;DETECTOR&nbsp;(DL BAND 0)',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shCalPaCurr,
				read: this.rdCalPaCurr,
				len: 6
			},
			{
				id:'calBoardCurr',
				display: false,
				label:'BOARD&nbsp;CURRENT&nbsp;DETECTOR&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: isKeyDecimalNumber,
				show: this.shCalBoardCurr,
				read: this.rdCalBoardCurr,
				len: 6
			}
		],
		[
			{
				id:'relayInst',
				display: true,
				label:'RELAY&nbsp;INSTALLED&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: hexNumbersOnly,
				show: this.shRelayInst,
				read: this.rdRelayInst,
				len: 1
			},
			{
				id:'relayModeConf',
				display: true,
				label:'RELAY&nbsp;MODE&nbsp;CONFIGURATION&nbsp;',
				type: 'input',
				inputtype: 'text',
				onkey: hexNumbersOnly,
				show: this.shRelayModeConf,
				read: this.rdRelayModeConf,
				len: 1
			}
		],
		[
		]
	];
	this.createForm = function() {
		var cont = document.getElementById("page");
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
		var order = [3,1,2,0,4,5,6];
		var n_elem = [4,2,2,2,6,1,1];
		var subtitlemode = [1,2,3,4,5,0,0];
		this.Map[6] = this.createBbuMap(config.bbu_type);
		for (var i=0;i<this.Map.length;i++)
		{
			var ix = order[i];
			var n = n_elem[i];
			var s = subtitlemode[i];
			mainTb.appendChild(this.createTitle(this.Titles[ix],n));
			mainTb.appendChild(this.createSubtitle(s));
			for (var j = 0; j < this.Map[ix].length; ++j) {
				var row = this.createEntryRow(ix, j);
				mainTb.appendChild(row);
			}	
		}
		mainTb.appendChild(this.createPass());
	}
	this.createTitle = function(t,colSpan) {
		var row = document.createElement("tr");
		row.style = "height: 20px";
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.colSpan = colSpan;
		cell.innerHTML = t;
		cell.style.color = "black";
		row.appendChild(cell);
		return row;
	}
	this.createSubtitle = function(type) {
		var Texts = TextEn;
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		if (type==5){
			for (var i = 0; i < 6; ++i) {
				cellHTMLs = ['A/D READ 1','A/D READ 2','MAGNITUDE 1','MAGNITUDE 2','CURRENT A/D READ','MAGNITUDE READ'];
				cell = document.createElement("th");
				row.appendChild(cell);
				cell.innerHTML = cellHTMLs[i];
			}
		}
		if (type==3){
			for (var i = 0; i < 2; ++i) {
				cell = document.createElement("th");
				row.appendChild(cell);
				cell.innerHTML = (i == 0 ? Texts['UPLINK'] : Texts['DNLINK']);
			}

		}
		if (type==2){
			for (var i = 0; i < 2; ++i) {
				cell = document.createElement("th");
				row.appendChild(cell);
				cell.innerHTML = (i == 0 ? "BAND&nbsp;0" : "BAND&nbsp;1");
			}
		}	
		if (type==1){
			for (var i = 0; i < 4; ++i) {
				cellHTMLs = ['UL BAND0','DL BAND0','UL BAND1','DL BAND1'];
				cell = document.createElement("th");
				row.appendChild(cell);
				cell.innerHTML = cellHTMLs[i];
			}
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
			if (typeof(ent.onclick) != 'undefined') {
				el.onclick = function(ev) { return ent.onclick(ev); }
			}
			if (typeof(ent.value) != 'undefined') {
				el.value = ent.value;
				el.style.fontWeight = "bold";
				el.style.backgroundColor = "#EEEEEE";
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
	this.optionsDisable = function() {
		//disable optional features
		for (var b = 0; b < 2; b++) {
			var k = 2*b + 1;
			var el = document.getElementById('powerLim'+'_'+k);
			el.disabled = true;
			el.style.backgroundColor = "#CCCCCC";
		}
		for (var b = 0; b < 2; b++) {
			var el = document.getElementById('chBandEnabled'+'_'+b);
			el.disabled = true;
			el.style.backgroundColor = "#CCCCCC";
		}
		for (var b = 0; b < 2; b++) {
			var el = document.getElementById('adjBandEnabled'+'_'+b);
			el.disabled = true;
			el.style.backgroundColor = "#CCCCCC";
		}
		for (var b = 0; b < 2; b++) {
			var el = document.getElementById('singleBandEnabled'+'_'+b);
			el.disabled = true;
			el.style.backgroundColor = "#CCCCCC";
		}
		for (var b = 4; b < 6; b++) {
			var el = document.getElementById('calDlPowDet_0_'+b);
			el.disabled = true;
			el.style.backgroundColor = "#CCCCCC";
			var el = document.getElementById('calDlPowDet_1_'+b);
			el.disabled = true;
			el.style.backgroundColor = "#CCCCCC";
			var el = document.getElementById('calPaCurr_'+b);
			el.disabled = true;
			el.style.backgroundColor = "#CCCCCC";
			var el = document.getElementById('calBoardCurr_'+b);
			el.disabled = true;
			el.style.backgroundColor = "#CCCCCC";
		}	
		for (var b = 0; b < 4; b++) {
			var el = document.getElementById('hpaULcurrent_'+b);
			el.disabled = true;
			el.style.backgroundColor = "#CCCCCC";
		}
		var el = document.getElementById('deepDischargeCounter_0');
		el.disabled = true;
		el.style.backgroundColor = "#CCCCCC";
	}
	this.disableBbuStatusElements = function() {
		for (var i = 0; i < this.Map[6].length; i++) {
			var el = document.getElementById(this.Map[6][i].id+'_0');
		el.disabled = true;
		el.style.backgroundColor = "#CCCCCC";
		}

	}
}

