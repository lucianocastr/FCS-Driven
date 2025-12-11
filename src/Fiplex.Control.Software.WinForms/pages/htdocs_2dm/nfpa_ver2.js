var gui;
var NFPAStr;
var NFPAcfg;
var NFPAstat;
var tmrId;
var countCheck;
var factory;
var config;
var tags;
var RFsettings = {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 45 };
var VSWRsettings = {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 25 };
var BBLevelInsettings = {min:  -80, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 };
var maxDevicesToShow = 4;
var version;

function onloadInit() {
	factory = new Factory();
	config = new Config();
	tags = new Tags();
	var frm = window.parent.navi.factoryFrame;
	if (frm) {
		factory.parse(frm);
	} else {
		return;
	}
	frm = window.parent.navi.confFrame;
	if (frm) {
		config.parse(frm);
	} else {
		return;
	}
	version = new Version();
	var frm = version.retrieve();
	version.parse(frm);
	gui = new GUI_NFPA();
	NFPAcfg = new NFPAconf();
	NFPAstat = new NFPAstatus();
	showResultIcon(ERR_NONE);
	globalConfigReq();
	cursorWait();
	showResultIcon(ERR_PENDING);
}
function reloadData(){
	globalConfigReq();
	cursorWait();
	showResultIcon(ERR_PENDING);
}
function globalConfigReq() {
	if (isPCstyle()){
		loadConfigGlobal();
		return;
	}
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var tmout = computeTimeoutReqMs();
				timerId = setTimeout(function() { loadConfigGlobal(); }, tmout);
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
		// versionReq();
		return;
	}
	str = correctASCII(str);
	var srarr = str.split('\t');
	if (srarr.length < 10) {
		// versionReq();
		return;
	}
	var srFact = srarr[2];
	var srTag = srarr[5];
	var srVersion = srarr[6];
	var srNFPA = srarr[7] + "\t" + srarr[8];
	var srConf = srarr[0] + "\t" + srarr[1];
	
	window.parent.navi.confFrame = srConf;
	config.parse(srConf);
	config.saveFrameStr(srConf);
	
	window.parent.navi.tagsFrame = srTag;
	tags.parseRawText(srTag);

	window.parent.navi.factoryFrame = srFact;
	factory.parse(srFact);
	localStorage.setItem("Factory"+Prjstr+window.location.host, srFact);

	window.parent.navi.versionFrame = srVersion;
	version.parse(srVersion);
	version.store(srVersion);
	window.parent.navi.confNfpaFrame = srNFPA;
	NFPAcfg.parse(srNFPA);
	gui.createForm();
	end_loading(srNFPA);
}
function NFPAReq() {
	if (isPCstyle()){
		load_NFPA();
		return;
	}
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_NFPA(); }, 1000);
				} else {
					if (typeof(tmrId) !== "undefined" && tmrId)
						clearTimeout(tmrId);
					tmrId = setTimeout(function() { NFPAReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { NFPAReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { NFPAReq(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("POST", "/nfpa.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("nfpa_req="+1);
		xhr = null;
	} catch (err) {}
}
function end_loading(sr){
	NFPAcfg.parse(sr);
	gui.show(NFPAcfg,tags);
	NFPAStr = sr;
	window.top.submitLocked = false;
	xhrOnEnd();
	refreshEnables();
	load_status();
}
function load_NFPA() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					gui.show(NFPAcfg,tags);
					end_loading(serverResponse);
				} else {
					tmrId = setTimeout(function() { load_NFPA(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_NFPA(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_NFPA(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/conf_nfpa.shtml?co="+Date.now(), true);
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
				NFPAstat.parse(this.responseText);
				gui.showStatus(NFPAstat);
				var timeoutMs = isFileOpBusy() ? 10000 : 1000;
				tmrIdFact = setTimeout(function() { load_status(); }, timeoutMs);
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
		xhr.open("GET", "/update_nfpa.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function submitform() {
	if ((typeof window.top.submitLocked == "undefined") || !window.top.submitLocked) {
		window.top.submitLocked = true;
	} else if (window.top.submitLocked) {
		return;
	}
	var NFPAcfgToSend = new NFPAconf();
	NFPAcfgToSend.parse(NFPAStr);
	gui.read(NFPAcfgToSend);
	var frm = NFPAcfgToSend.getFrm();
	if (frm==NFPAStr)
		return;
	document.getElementById("nfpa_str").value = frm;
	doSubmit(frm);
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
					setTimeout(function() { xhrOnEnd(); }, 1500);
				}
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.open("POST", "/nfpa.zhtml", true);
		xhr.timeout = 5000;
		xhrOnStart();
		xhr.send("nfpa_str="+frm);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}

(function() {
	onunload = function() {
		window.top.submitLocked = false;
		cursorClear();
		showResultIcon(ERR_NONE);
		guiBlocked(false);
	};
})();

function xhrOnStart() {
	window.top.submitLocked = true;
	cursorWait();
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
}

function xhrOnEnd() {
	window.top.submitLocked = false;
	cursorClear();
	showResultIcon(ERR_NONE);
	guiBlocked(false);
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
						if (++countCheck < 25) {
							setTimeout(function() { check_result(); }, 1000);
							return;
						} else
							error = ERR_FAIL;
					}
				} else {
					error = ERR_FAIL;
				}
				showResultIcon(error);
				setTimeout(function() { NFPAReq(); }, 100);
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; }; 		
		xhr.open("GET", "/result.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function refreshCtrlEnable(num,nr,val,valrelay){
	document.getElementById("enabled_"+num+"_"+nr).disabled = !val;
	for (var j=0;j<4;j++){
		document.getElementById("relay_enabled_"+num+"_"+nr+"_"+j).disabled = !valrelay;
	}
	//todos los textos blancos y disabled
	//se vuelven a incluir alarmas externas en master
	var isExtGlobalAlarm =  (nr > 0 && num >= 10 && num <= 13) || (nr == 0 && num >= 20 && num <= 22); //excluye force rf off
	document.getElementById("AlName_"+num+"_"+nr).style.backgroundColor = (isExtGlobalAlarm ? "white" : "#DDDDDD");
	document.getElementById("AlName_"+num+"_"+nr).disabled = !isExtGlobalAlarm;
}
function refreshEnables(){
	//Se reutiliza refreshEnables para forzar disabled Antenna isolation y Osc. Detection
	for (var nr=0;nr<=8;nr++){
		for (var num=0;num<(nr==0?NFPAcfg.NUMALARM:NFPAcfg.remote[0].NUMALARM);num++){
			var enable = true;
			var enablerelay = true;
			var name = nr==0?NFPAcfg.alarmNames[num]:NFPAcfg.remote[nr-1].alarmNames[num];
			if ( nr == 0 ) {
				if ( nr==0 && (num==2 || num==4) ) {
					enable = false;
				}
				if ( factory.commomUl && num>=2 && num<=9 && num!=5 && (name.search("B1")>=0) ) {
					enable = false;
					enablerelay = false;
				}
				if (nr>0 && num == 15) {
					enable = false;
				}
			} else if (factory.commomUl) {
				if ( name.search("B1")>=0 && (name.search("LNA")>=0 || name.search("Overload")>=0) ) {
					enable = false;
					enablerelay = false;
				}
			}
			if (nr > 0 && name.search("Undefined")>=0) {
				enable = false;
				enablerelay = false;
			}
			// en micro se activa alarma "Remote Disconnect" si en la configuración de master el remoto está ON.
			// por tanto, aunque al usuario quisiera desactivarla en gui, no funcionaría
			if (nr > 0 && num == 14) {
				enable = false;
			}
			refreshCtrlEnable(num,nr, enable, enablerelay);
		}
	}
}
function GUI_NFPA() {
	this.read = function(nfpa){
		for (var band=0;band<2;band++){
			nfpa.retLossTh[band] = this.RetLossThGet(band);
			nfpa.minPowerVSWR[band] = this.VSWRMinPowerGet(band);
			nfpa.alarmNumSens[band] = this.AlarmSensGet(band);
			nfpa.timeTxLowPowLow[band] = this.timeTriggerGet(band);
		}
		for (var k=0;k<3;k++)
			nfpa.relayLogicConfigNormal[k] = this.relayStatusCtrlGet(k)==1;
		
		for (var k=20;k<23;k++) {  //nombres de alarmas externas de master, excepto force rf off
			nfpa.alarmNames[k] = document.getElementById("AlName_"+k+"_0").value;
		}
		for (k = 10; k <= 13; k++) {
			nfpa.remote[0].alarmNames[k] = document.getElementById("AlName_"+k+"_1").value;
		}
		
		for (var r=0;r<=nfpa.MAXREMOTES;r++){
			for (var k=0;k<(r==0?nfpa.NUMALARM:nfpa.remote[0].NUMALARM);k++){
				if (r==0){
					nfpa.alarmEnabled[k] = document.getElementById("enabled_"+k+"_"+r).checked;
					for (var j=0;j<4;j++) nfpa.relayAssignAlarm[k][j] = document.getElementById("relay_enabled_"+k+"_0_"+j).checked;
					if ( k >= 20 && k <= 23 ) {
						var externalAlarmNr = k - 20;
						nfpa.externalAlarmPolarity[externalAlarmNr] = document.getElementById("extAlarmPolarity_"+externalAlarmNr+"_0").checked;
					}					
				}else{
					nfpa.remote[r-1].alarmEnabled[k] = document.getElementById("enabled_"+k+"_"+r).checked;
					for (var j=0;j<4;j++) nfpa.relayAssignAlarmRemote[k][j] = document.getElementById("relay_enabled_"+k+"_"+r+"_"+j).checked;
					if ( k >= 10 && k < 14) {
						var externalAlarmNr = k - 10;
						nfpa.remote[r-1].externalAlarmPolarity[externalAlarmNr] = document.getElementById("extAlarmPolarity_"+externalAlarmNr+"_"+r).checked;
					}					
				}
			}
		}
		for (var band=0;band<2;band++){
			nfpa.antennaDisconnectionThreshold[band] = this.bbLevelInThGet(band);
		}
	}
	this.showStatus = function(nfpa){
		for (var k=0;k<2;k++){
			setMetValue("rfPowFwd_"+k, nfpa.powDirect[k]);
			setMetValue("rfPowRev_"+k, nfpa.powReverse[k]);
			setMetValue("returnLoss_"+k, nfpa.retLoss[k]);
			var el = document.getElementById("warnPowerMess_"+k);
			el.style.display = nfpa.powDirect[k]<NFPAcfg.minPowerVSWR[k]?"table-cell":"none";
			this.timeElapsedSet(k,nfpa.txLowerPowerTimeHigh[k],nfpa.txLowerPowerTimeLow[k],NFPAcfg.timeTxLowPowLow[k]);
		}
		for (var band=0;band<2;band++){
			setMetValue("bbLevelIn_"+band, nfpa.bbLevel[band]);
		}
	}
	this.show = function(nfpa,tags){
		for (var band=0;band<2;band++){
			this.RetLossThSet(band,nfpa.retLossTh[band]);
			this.VSWRMinPowerSet(band,nfpa.minPowerVSWR[band]);
			this.AlarmSensSet(band,nfpa.alarmNumSens[band]);
			this.timeTriggerSet(band,nfpa.timeTxLowPowLow[band]);
		}
		for (var k=0;k<3;k++)
			this.relayStatusCtrlSet(k,nfpa.relayLogicConfigNormal[k]);
		
		for (var r=0;r<=nfpa.MAXREMOTES;r++){
			document.getElementById("tagName_"+r).innerHTML = "CONFIGURATION&nbsp;ALARMS&nbsp;-&nbsp;"+tags.tagDevices[r];
			for (var k=0;k<(r==0?nfpa.NUMALARM:nfpa.remote[0].NUMALARM);k++){
				var name = r==0?nfpa.alarmNames[k]:nfpa.remote[r-1].alarmNames[k];
				if (factory.commomUl && ((r==0 && k>=6 && k<=9)||(r>0 && (name.search("LNA")>=0 || name.search("Overload")>=0) ))){
					name = name.replace("B0","");
					if (name.search("B1")>=0) name = "Undefined";
				}else{
					name = name.replace("B0",factory.bandNames[0]);
					name = name.replace("B1",factory.bandNames[1]);
				}
				name = name.replace("Rx Power Low","Rx Power Low / Donor Antenna");
				document.getElementById("AlName_"+k+"_"+r).value = name;
				document.getElementById("enabled_"+k+"_"+r).checked = r==0?nfpa.alarmEnabled[k]:nfpa.remote[r-1].alarmEnabled[k];
				for (var j=0;j<4;j++) document.getElementById("relay_enabled_"+k+"_"+r+"_"+j).checked = r==0?nfpa.relayAssignAlarm[k][j]:nfpa.relayAssignAlarmRemote[k][j];
				var extIndex = r==0?20:10;  // se vuelven a incluir las 4 alarmas externas de master
				if ( k >= extIndex && k < extIndex+4) {
					if (r==0) {
						var externalAlarmNr = k - extIndex;
						document.getElementById("extAlarmPolarity_"+externalAlarmNr+"_"+r).checked =nfpa.externalAlarmPolarity[externalAlarmNr];
					} else {
						var externalAlarmNr = k - extIndex;
						document.getElementById("extAlarmPolarity_"+externalAlarmNr+"_"+r).checked =nfpa.remote[r-1].externalAlarmPolarity[externalAlarmNr];
					}
				}
			}
		}
		for (var band=0;band<2;band++){
			this.bbLevelInThSet(band, nfpa.antennaDisconnectionThreshold[band]);
		}
	}
	this.createForm = function() {
		var Texts = TextEn;
		var cont = document.getElementById("page");
		cont.style.width = "1163px";
		unitDiv = document.getElementById("unitDiv");
		if (unitDiv) remove_element(unitDiv);
		unitDiv = document.createElement("div");
		unitDiv.id = "unitDiv";
		unitDiv.className = "unitbox";
		unitDiv.style.marginLeft = "0px";
		cont.appendChild(unitDiv);
		var headDiv = this.createUnitHead("POWER&nbsp;MEASUREMENTS");
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDivAlarm";
		var tab = this.createRowPowerBand();
		contentDiv.appendChild(tab);
		
		for (var k=0;k<=NFPAcfg.MAXREMOTES;k++){
			var headDiv = this.createUnitHeadAlarmConfig(k,"CONFIGURATION&nbsp;ALARMS");
			unitDiv.appendChild(headDiv);
			var disp = "block";
			if (k>0) disp = config.connectedRemotes[k-1]?"block":"none";
			if (k>maxDevicesToShow) disp="none";
			headDiv.style.display = disp;
			var contentDiv = document.createElement("div");
			unitDiv.appendChild(contentDiv);
			contentDiv.className = "contentbox";
			contentDiv.style.display = disp;
			var tab = this.createRelayConfig(k);
			contentDiv.appendChild(tab);
		}
		
	}
	this.createBroadbandLevelIn = function(band) {
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";
		var tbl = document.createElement("table");
		tbl.style.width = "95%"
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = createMetRow("bbLevelIn_"+band, BBLevelInsettings, "Broadband&nbsp;Input&nbsp;Level", "dBm");
		tb.appendChild(row);
		var row = this.createBBLevelInTh(band);
		tb.appendChild(row);
		return cellb;
	}
	this.createBBLevelInTh = function(band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Broadband&nbsp;Input&nbsp;Threshold";
		cell.className = "thdral";
		cell = document.createElement("td");
		row.appendChild(cell);		
		var el = document.createElement("input");
		el.id = "bbLevelInTh_"+band;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.max = -70;
		el.min = -100;
		el.title = "Min: "+el.min+", Max: "+el.max+" dBm";
		el.onchange = function(ev) {
			var num = parseFloat(this.value);
			var max = ~~this.max;
			var min = ~~this.min;
			if (num < min) {
				this.value = min;
			} else if (num > max) {
				this.value = max;
			} else {
				this.value = num;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 2;
		cell.innerHTML = "dBm";
		cell.style.textAlign = "right";
		return row;
	}
	this.bbLevelInThSet = function(band, val) {
		try {
			var el = document.getElementById("bbLevelInTh_"+band);
			if (!isNaN(val)) {
				el.value = val.toFixed(0);
			}
		} catch (err) { }
	}
	this.bbLevelInThGet = function(band) {
		try {
			var el = document.getElementById("bbLevelInTh_"+band);
			return parseFloat(el.value);
		} catch (err) { return -128; }
	}
	this.createRelayConfig = function(nr){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
		if (nr==0){
			var rowb = document.createElement("tr");
			tab.appendChild(rowb);
			var cell = this.createRelayStatusAlarm();
			rowb.appendChild(cell);
			cell.className = "contentcell";	
		}
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		var cellb = document.createElement("td");
		rowb.appendChild(cellb);
		cellb.className = "contentcell";
		var tbl = document.createElement("table");
		tbl.className = "alarmTable";
		tbl.setAttribute("border","1");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = "RELAY&nbsp;SETTINGS";
		cell.colSpan = 16;
		row.appendChild(cell);
		
		var row = document.createElement("tr");
		tb.appendChild(row);
		for (var k=0;k<2;k++){
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			cell.innerHTML = "Name";
			cell.rowSpan = 2;
			cell.colSpan = 2;
			row.appendChild(cell);
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			cell.innerHTML = "Enabled";
			cell.rowSpan = 2;
			row.appendChild(cell);

			var cell = document.createElement("th");
			cell.className = "alarmTable";
			cell.innerHTML = "Polarity"+"<br/>"+"High";
			cell.rowSpan = 2;
			row.appendChild(cell);

			var cell = document.createElement("th");
			cell.className = "alarmTable";
			cell.innerHTML = "Relay";
			cell.colSpan = 4;
			row.appendChild(cell);	
		}
		var row = document.createElement("tr");
		tb.appendChild(row);		
		for (var k=0;k<2;k++){
			for (var j=0;j<4;j++){
				var cell = document.createElement("th");row.appendChild(cell);
				cell.className = "alarmTable";
				cell.innerHTML = j+1;
			}
		}		
		this.createRelayConfigTable(tb, nr);
		
		return tab;
	}
	this.createRelayConfigTable = function(tb, nr){

		var alarmNrShow = 0;
		for (var j=0;j<(nr==0?16:8);j++) {	// un byte más de alarmas en master -> 32 alarmas, 16 filas
			var row = document.createElement("tr");
			tb.appendChild(row);
			for (var k=0;k<2;k++){
				var cell = document.createElement("th");
				var index = nr==0?NFPAcfg.naturalOrder[2*j+k]:NFPAcfg.remote[0].naturalOrder[k+2*j];
				var isUserAlarm = (nr==0? (index>=20 && index<=23) : (index>=10 && index<=13));
				var userAlarmNr;
				if (isUserAlarm) {
					userAlarmNr = (nr==0? (index-19) : (index-9));	// de 1 a 4 para mostrar en gui
				}
				if (nr>0) {
					if (j==6 && k==1 || j==7 && k==1) {
						//remote disconnection
						isUserAlarm = false;
						increaseAlarmNr = true;
					} if (j==7 && k==0) {
						//external alarm 4
						isUserAlarm = true;
						increaseAlarmNr = false;
					}
				}
				var hideCell;
				if (nr>0) {
					hideCell = (index==15);	// alarma no usada
				} else {
					if (NFPAcfg.isOverloadULcapable()) {
						hideCell = (index==14) || (index>=30 && index<32); // remote disconnection y alarmas añadidas y no usadas
					} else {
						hideCell = (index==14) || (index>=28 && index<32); // remote disconnection y alarmas añadidas y no usadas
					}
					hideCell = hideCell || (index==15); // se oculta door switch (door open) de master
				}
				hideCell = hideCell || (nr>0 && j>6);	//se oculta external alarm 4 y en su lugar se pone remote disonnection
				var increaseAlarmNr = !(isUserAlarm || hideCell);
				if ( isUserAlarm ) {
					if (nr > 0) {
						cell.innerHTML = "USER&nbsp;ALARM&nbsp;"+userAlarmNr;
					} else {
						cell.innerHTML = "EXTERNAL&nbsp;INPUT&nbsp;"+userAlarmNr;
					}
				} else if ( increaseAlarmNr && ! hideCell) {
					alarmNrShow++;
					cell.innerHTML = "ALARM&nbsp;"+alarmNrShow;
				} else {
					cell.innerHTML = "ALARM&nbsp;"+(k+2*j+1);
				}
				cell.style.paddingLeft = "5px";
				cell.style.paddingRight = "5px";
				cell.className = "alarmTable";
				if (hideCell) {
					cell.style.display = "none";
				}
				row.appendChild(cell);
				var cell = this.createInputText("AlName",index,nr); 
				row.appendChild(cell);
				cell.className = "alarmTable";
				if (hideCell) {
					cell.style.display = "none";
				}
				var cell = this.createEnabledCheckBox(index,nr); 
				row.appendChild(cell);
				cell.className = "alarmTable";
				cell.style.textAlign = "center";
				cell.style.minWidth = "60px";
				if (hideCell) {
					cell.style.display = "none";
				}
				if ( isUserAlarm ) {
					cell = this.createPolarityCheckBox(index,nr);
					cell.className = "alarmTable";
					cell.style.textAlign = "center";
					cell.style.minWidth = "40px";
					if (hideCell) {
						cell.style.display = "none";
					}
				}else
				 	cell = document.createElement("td");
				if (hideCell) {
						cell.style.display = "none";
				}
				row.appendChild(cell);
				for (var i=0;i<4;i++){
					var cell = this.createCheckBox(index,nr,i); 
					row.appendChild(cell);
					cell.className = "alarmTable";
					if (hideCell) {
						cell.style.display = "none";
					}
				}
			}
		}
	}
	this.createInputText = function(id,num,nr){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.input = "text";
		el.style.fontWeight = "bold";
		el.id = id+"_"+num+"_"+nr;
		el.size = 30;
		el.maxLength = 30;
		el.num = num;
		el.nr = nr;
		el.allId = id;
		if (nr > 0) {
			el.onchange = function(event) {
				for ( var n = 1; n <= 8; n++ ) {
					if (n == this.nr) {
						continue;
					}
					var id = this.allId+"_"+this.num+"_"+n;
					var otherEl = document.getElementById(id);
					if (!otherEl) {
						continue;
					}
					try {
						otherEl.value = this.value;
					} catch(e){}
				}
			}
		}
		cell.appendChild(el);
		return cell;
	}
	this.createEnabledCheckBox = function(num,nr){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "enabled_"+num+"_"+nr;
		el.name = el.id;
		el.type = "checkbox";
		cell.appendChild(el);
		return cell;		
	}
	this.createPolarityCheckBox = function(num, nr) {
		var cell = document.createElement("td");
		if (nr==0 && num < 20)	return cell;
		if (nr>0 && (num < 10 && num>13))	return cell;
		var el = document.createElement("input");
		var externalAlarmNr = num - (nr==0?20:10);
		el.id = "extAlarmPolarity_"+externalAlarmNr+"_"+nr;
		el.name = el.id;
		el.type = "checkbox";
		cell.appendChild(el);
		return cell;
	}
	this.createCheckBox = function(num,nr,nrelay){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "relay_enabled_"+num+"_"+nr+"_"+nrelay;
		el.name = el.id;
		el.type = "checkbox";
		el.num = num;
		el.nrelay = nrelay
		el.nr = nr;
		cell.appendChild(el);
		el.onclick = function(ev) {
			try {
				if (this.nr == 0) {
					return;
				}
				for (var k=0;k<NFPAcfg.MAXREMOTES;k++){
					if (k+1 == this.nr) {
						continue;
					}
					var el = document.getElementById("relay_enabled_"+this.num+"_"+(k+1)+"_"+this.nrelay);
					el.checked = this.checked;
				}
			} catch (err) {}
		}
		return cell;		
	}
	this.createBandRelayConfig = function(){
		var cell = document.createElement("th");
		cell.innerHTML = "BAND-SPECIFIC&nbsp;RELAY&nbsp;SETTINGS";
		return cell;
	}
	this.createRelayStatusAlarm = function(){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		var tbl = document.createElement("table");
		tbl.align = "center";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "RELAY&nbsp;STATUS&nbsp;ON&nbsp;ALARM";
		cell.className = "cth";
		cell.colSpan = 5;
		var row = document.createElement("tr");
		tb.appendChild(row);		
		for (var num = 0;num<3;num++){
			var row = this.createRelayStatusCtrl(num);
			tb.appendChild(row);
		}
		return cellb;
	}
	this.createRelayStatusCtrl = function(num){
		var row = cell = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Relay " +(num+1);
		cell.style.width = "80px";
		for (var j=0;j<2;j++){
			var cell = document.createElement("td");
			row.appendChild(cell);
			var el = document.createElement("input");
			el.type = "radio";
			el.name = "relayStatus_"+num;
			el.value = j;
			el.className = "contentcell";
			cell.appendChild(el);
			var cell = document.createElement("td");
			cell.innerHTML = j==0?"Closed":"Open";
			row.appendChild(cell);
		}
		return row;
	}
	this.relayStatusCtrlGet = function(num){
		var el = document.getElementsByName("relayStatus_"+num);
		for (var i=0;i<el.length;i++){
			if(el[i].checked) return el[i].value;
		}
		return true;
	}
	this.relayStatusCtrlSet = function(num,val){
		var el = document.getElementsByName("relayStatus_"+num);
		el[val?1:0].checked = true;
	}
	this.createRowPowerBand = function(){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";

		var show = ["none","none"];
		var enBand = [false,false];
		for (var band=0;band<2;band++){
			if (factory.chBandEnabled[band] || factory.adjBandEnabled[band]){
				enBand[band] = true;
				show[band]="table-cell";
			}
		}
		
		for (var band=0;band<2;band++){
			var rowb = document.createElement("tr");
			tab.appendChild(rowb);
			var cell = document.createElement("th");
			cell.innerHTML = factory.bandNames[band].toUpperCase();
			cell.style.display = show[band];
			cell.colSpan = factory.commomUl?3:4;
			cell.className = "cth";
			rowb.appendChild(cell);	
			if (factory.commomUl){
				if (!(band==1 && enBand[0] && enBand[1])){ //Si commomUl y 2 bandas activas sólo se muestra band0
					var cell = document.createElement("th");
					cell.innerHTML = "ANTENNA&nbsp;DISCONNECTION";
					cell.className = "cth";
					cell.rowSpan = 2;
					cell.style.display = show[band];
					rowb.appendChild(cell);
				}
			}
			var rowb = document.createElement("tr");
			tab.appendChild(rowb);
			
			var cell = document.createElement("th");
			cell.innerHTML = "VSWR&nbsp;METER";
			cell.style.display = show[band];
			cell.className = "cth";
			cell.colSpan = 2;
			rowb.appendChild(cell);
			
			var cell = document.createElement("th");
			cell.innerHTML = "DONOR&nbsp;ANTENNA&nbsp;FAILURE&nbsp;ADJUSTMENT";
			cell.className = "cth";
			cell.style.display = show[band];
			rowb.appendChild(cell);
			
			if (!factory.commomUl){
				var cell = document.createElement("th");
				cell.innerHTML = "ANTENNA&nbsp;DISCONNECTION";
				cell.className = "cth";
				cell.style.display = show[band];
				rowb.appendChild(cell);
			}
			var rowb = document.createElement("tr");
			tab.appendChild(rowb);
			
			var cell = this.createPowerCell(band);
			cell.style.display = show[band];
			rowb.appendChild(cell);	
			
			var cell = this.createVSWRCell(band);
			cell.style.display = show[band];
			rowb.appendChild(cell);	
			
			var cell = this.createDonorAntFailCell(band);
			cell.style.display = show[band];
			rowb.appendChild(cell);
			
			
			var bandToShow = band;
			if (factory.commomUl && !enBand[0] && enBand[1]) bandToShow = 1-band; //if commomUl y sólo banda 1, se invierten la presentación para mostrar el index 0
			var cell = this.createBroadbandLevelIn(bandToShow);
			var sh = show[band]; 
			if (factory.commomUl && enBand[0] && enBand[1]){
				sh = band==0?"table-cell":"none";//si commomUl y las 2 bandas están activadas, sólo se muestra el 0
				cell.rowSpan = 4;
				cell.style.verticalAlign = "middle";
			}
			cell.style.display = sh;
			rowb.appendChild(cell);

			

		}
		return tab;
	}
	this.createVSWRCell = function(band){
		var cellb = document.createElement("td");
		cellb.style.paddingTop = "20px";
		cellb.className = "contentcell";
		var tbl = document.createElement("table");
		tbl.style.width = "95%"
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = createMetRow("returnLoss_"+band, VSWRsettings, "Return&nbsp;Loss", "dB");
		tb.appendChild(row);
		var row = this.createRetLossTh(band);
		tb.appendChild(row);
		var row = this.createAlarmSens(band);
		tb.appendChild(row);		
		return cellb;
	}
	this.createRetLossTh = function(band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Return&nbsp;Loss&nbsp;Threshold";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);		
		var el = document.createElement("input");
		el.id = "retLossTh_"+band;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.max = 20;
		el.min = 0;
		el.title = "Min: "+el.min+", Max: "+el.max+" dB";
		el.band = band;
		el.onchange = function(ev) {
			var target = this;
			var band = target.band;
			var num = parseFloat(target.value);
			var max = ~~target.max;
			var min = ~~target.min;
			if (num < min) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dB";
		cell.colSpan = 2;
		cell.style.textAlign = "right";
		return row;
	}
	this.RetLossThSet = function(band, val) {
		try {
			var el = document.getElementById("retLossTh_"+band);
			if (!isNaN(val))
				el.value = val.toFixed(1);
			setMetLowWarn("returnLoss_"+band,val);
		} catch (err) { }
	}
	this.RetLossThGet = function(band) {
		try {
			var el = document.getElementById("retLossTh_"+band);
			return parseFloat(el.value);
		} catch (err) { return -128; }
	}
	this.createAlarmSens = function(band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Alarm&nbsp;Sensitivity";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);		
		var el = document.createElement("input");
		el.id = "alarmSens_"+band;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.max = 100;
		el.min = 0;
		el.title = "Min: "+el.min+" sec., Max: "+el.max+" sec.";
		el.band = band;
		el.onchange = function(ev) {
			var target = this;
			var band = target.band;
			var num = ~~target.value;
			var max = ~~target.max;
			var min = ~~target.min;
			if (num < min) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "sec";
		cell.colSpan = 2;
		cell.style.textAlign = "right";
		return row;
	}
	this.AlarmSensSet = function(band, val) {
		try {
			var el = document.getElementById("alarmSens_"+band);
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.AlarmSensGet = function(band) {
		try {
			var el = document.getElementById("alarmSens_"+band);
			return parseInt(el.value);
		} catch (err) { return -128; }
	}
	this.createPowerCell = function(band){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";
		var tbl = document.createElement("table");
		tbl.style.width = "95%"
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		RFsettings.max = factory.powerlimit[2*band+1] + 5;
		RFsettings.min = RFsettings.max - 50;
		RFsettings.high_warn = factory.powerlimit[2*band+1];
		RFsettings.high_alarm = factory.powerlimit[2*band+1] + factory.MAX_PWR_DELTA;
		var row = createMetRow("rfPowFwd_"+band, RFsettings, "Power&nbsp;Forward", "dBm");
		tb.appendChild(row);
		var row = createMetRow("rfPowRev_"+band, RFsettings, "Power&nbsp;Reverse", "dBm");
		tb.appendChild(row);
		var row = this.createVSWRMinPower(band);
		tb.appendChild(row);
		var row = this.warnPowerVSWRMessage(band);
		tb.appendChild(row);
		return cellb;
	}
	this.warnPowerVSWRMessage = function(band){
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.colSpan = 4;
		cell.innerHTML = "TX&nbsp;Power&nbsp;Too&nbsp;Low<br>For VSWR&nbsp;Measurement";
		cell.className = "tabval";
		row.style.height = "30px";
		cell.id = "warnPowerMess_"+band;
		cell.style.display = "none";
		return row;
	}
	this.createVSWRMinPower = function(band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Minimum&nbsp;TX&nbsp;Power<br>for&nbsp;VSWR&nbsp;Detection";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);	
		var el = document.createElement("input");
		el.id = "minPowerVSWR_"+band;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.max = factory.powerlimit[2*band+1];
		el.min = -10;
		el.title = "Min: "+el.min+", Max: "+el.max+" dBm";
		el.band = band;
		el.onchange = function(ev) {
			var target = this;
			var band = target.band;
			var num = parseFloat(target.value);
			var max = ~~target.max;
			var min = ~~target.min;
			if (num < min) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 2;
		cell.innerHTML = "dBm";
		cell.style.textAlign = "right";
		return row;
	}
	this.VSWRMinPowerSet = function(band, val) {
		try {
			var el = document.getElementById("minPowerVSWR_"+band);
			if (!isNaN(val))
				el.value = val.toFixed(1);
		} catch (err) { }
	}
	this.VSWRMinPowerGet = function(band) {
		try {
			var el = document.getElementById("minPowerVSWR_"+band);
			return parseFloat(el.value);
		} catch (err) { return -128; }
	}
	this.createDonorAntFailCell = function(band){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		this.createTimeTrigger(tb,band);
		return cellb;
	}
	this.createTimeTrigger = function(tb,band){
		var row = document.createElement("tr");
		row.style.height="10px";
		tb.appendChild(row);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		var cell = document.createElement("th");
		cell.innerHTML = "hours";
		row.appendChild(cell);		
		var cell = document.createElement("th");
		cell.innerHTML = "min";
		row.appendChild(cell);		
		var cell = document.createElement("th");
		cell.innerHTML = "sec";
		row.appendChild(cell);		
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Time&nbsp;Limit&nbsp;To&nbsp;Trigger&nbsp;Alarm";
		cell.className = "thdral";
		for (var j=2;j>=0;j--) row.appendChild( this.createTimeTriggerBox(band,j));
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.id = "altimer_"+band;
		cell.className = "thdral";		
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 4;
		cell.className = "tabval";
		cell.id = "timeElap_" + band;
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 4;
		cell.className = "tabval";
		cell.style.color = "black";
		cell.id = "alRxPowLow_" + band;
		
	}
	this.timeElapsedSet = function(band,valH,valL,valLth){
		var times = [0,0,0];
		var res;
		var val = valH>valL?valH:valL;
		times[2] = Math.floor(val/3600);
		res = ~~(val-3600*times[2]);
		times[1] = Math.floor(res/60);
		times[0] = res % 60;
		var str = "";
		str += times[2] + "h&nbsp;";
		str += ("0"+times[1]).substr(-2,2) + "m&nbsp;";
		str += ("0"+times[0]).substr(-2,2) + "s&nbsp;";
		var el = document.getElementById("timeElap_"+band);
		el.innerHTML = str;
		el.style.color = (valH>valL || (valH==0 && valL==0)) ?"black":"red";
		var txtbold = false;
		if (valH<=valL) txtbold = valL>=valLth;
		el.style.fontWeight = txtbold?"bold":"normal";
		// if (band == 0) alert("valH "+valH+", valL "+valL+", valLth "+valLth+", txtbold "+txtbold);
		el = document.getElementById("alRxPowLow_"+band);
		// el.innerHTML = valH>valL?"Rx&nbsp;Power&nbsp;OK":"Rx&nbsp;Power&nbsp;Low";
		// el.style.color = (valH<=valL && valL>valLth)?"red":"black";
		el.innerHTML = (valH>valL || (valH==0 && valL==0))?"Rx&nbsp;Power&nbsp;OK":"Rx&nbsp;Power&nbsp;Low";
		el.style.color = (valH<=valL && valL>=valLth && !(valH==0 && valL==0))?"red":"black";
		el = document.getElementById("altimer_"+band);
		el.innerHTML = valH>valL?"":"Alarm&nbsp;Timer";
		
	}
	this.timeTriggerSet = function(band,val){
		var times = [0,0,0];
		var res;
		times[2] = Math.floor(val/3600);
		res = ~~(val-3600*times[2]);
		times[1] = Math.floor(res/60);
		times[0] = res % 60;
		for (var k=0;k<3;k++)
			document.getElementById("timeTrigger_"+band+"_"+k).value = times[k];
	}
	this.timeTriggerGet = function(band){
		var	res = parseInt(document.getElementById("timeTrigger_"+band+"_0").value);
		res +=  60*parseInt(document.getElementById("timeTrigger_"+band+"_1").value);
		res +=  3600*parseInt(document.getElementById("timeTrigger_"+band+"_2").value);
		return res;
	}
	this.createTimeTriggerBox = function(band,hms) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "timeTrigger_"+band+"_"+hms;
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "32px";
		el.max = hms==2?1000:59;
		el.min = 0;
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var target = this;
			var num = ~~target.value;
			var max = ~~target.max;
			var min = ~~target.min;
			if (num < min) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
		}		
		cell.appendChild(el);
		return cell;
	}	
	this.createUnitHead = function(title) {
		var box = document.createElement("div");
		box.className = "headbox";
		var tab = document.createElement("table");
		box.appendChild(tab);
		tab.className = "headtable";
		tab.style.width = "100%";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);				
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "nrtitle";
		cell.innerHTML = "MASTER";
		cell.style.width = "100px";
		cell.style.paddingLeft = "30px";		
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = title;
		cell.className = "tag";
		cell.style.width = "50%";
		cell.style.textAlign = "center";
		var cell = document.createElement("td");		
		row.appendChild(cell);
		cell.className = "nrtitle";
		cell.style.width = "100px";	
		cell.style.paddingRight= "30px";	
		cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);	
		return box;
	}	
	this.createUnitHeadAlarmConfig = function(nr, title) {
		var box = document.createElement("div");
		box.className = "headbox";
		var tab = document.createElement("table");
		box.appendChild(tab);
		tab.className = "headtable";
		tab.style.width = "100%";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);			
		var cell = document.createElement("td");		
		row.appendChild(cell);
		cell.className = "nrtitle";
		cell.innerHTML = nr==0?"MASTER":"REMOTE&nbsp;"+nr;
		cell.style.width = "100px";
		cell.style.paddingLeft = "30px";		
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.id = "tagName_"+nr;
		cell.innerHTML = title;
		cell.className = "tag";
		cell.style.width = "50%";
		cell.style.textAlign = "center";
		var cell = document.createElement("td");		
		row.appendChild(cell);
		cell.className = "nrtitle";
		cell.style.width = "100px";	
		cell.style.paddingRight= "30px";	
		cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);
		return box;
	}	

	function createMetCell(id, s) {
		var tdNode = document.createElement("td");
		tdNode.id = "met_"+id;
		var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
		met.attachTo(tdNode);
		met.valueSet(s.min);
		return tdNode;
	}
	function setTextCell(id, val){
		try {
			var el = document.getElementById("txt_"+id);
			el.innerHTML = val;
		} catch(e) {}
	}
	function createTextCell(id) {
		var tdNode = document.createElement("td");
		tdNode.id = "txt_"+id;
		tdNode.style.minWidth = "43px";
		tdNode.style.textAlign = "center";
		tdNode.className = "tabval";
		return tdNode;
	}

	function createMetRow(id, s, title, units) {
		var trNode = document.createElement("tr");
		var tdNode = document.createElement("th");
		trNode.appendChild(tdNode);
		tdNode.innerHTML = title;
		tdNode.className = "thdral";
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.id = "met_"+id;
		var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
		met.attachTo(tdNode);
		met.valueSet(s.min);
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.id = "txt_"+id;
		tdNode.style.minWidth = "40px";
		tdNode.style.textAlign = "center";
		tdNode.className = "tabval";
		tdNode.innerHTML = "";
		tdNode = document.createElement("td");
		tdNode.innerHTML = units;
		tdNode.style.textAlign = "right";
		trNode.appendChild(tdNode);
		return trNode;
	}
	function setMetLowWarn(id, val) {
		try {
			var met = document.getElementById("met_"+id).mMeter;
			met.mLowWarning = val;
		} catch (err) { }
	}
	function setMetValue(id, val, opt) {
		try {
			var met = document.getElementById("met_"+id).mMeter;
			if (met) {
				var color;
				if (typeof(opt) !== "undefined") {
					if (opt.toLowerCase() == "normal") {
						color = met.colorNormal;
					} else if (opt.toLowerCase() == "warning") {
						color = met.colorWarn;
					} else if (opt.toLowerCase() == "alarm") {
						color = met.colorAlarm;
					} else {
						color = opt;
					}
				}
				met.valueSet(val, color);
			}
			var txt = document.getElementById("txt_"+id);
			if (txt) {
				if (isNaN(val)) {
					txt.innerHTML = val;
				} else {
					txt.innerHTML = val.toFixed(1);
				}
			}
		} catch (err) { }
	}

	function createLedBox(id) {
		var tdNode = document.createElement("td");
		var led = document.createElement("img");
		led.id = id;
		led.src = "bullet_grey.png";
		led.className = "centered";
		led.align = "center";
		tdNode.appendChild(led);
		return tdNode;
	}

	function ledSetColor(id, color) {
		try {
			var led = document.getElementById(id);
			if (color == "red") {
				led.src = "bullet_red.png";
			} else if (color == "green") {
				led.src = "bullet_green.png";
			} else if (color == "yellow") {
				led.src = "bullet_yellow.png";
			} else if (color == "grey") {
				led.src = "bullet_grey.png";
			} else {
				led.src = "bullet_grey.png";
			}
		} catch (err) {}
	}

	function mMeter(min, max, loA, hiA, loW, hiW) {
		this.mMax = max;
		this.mMin = min;
		this.mVal = max;
		this.mLowAlarm = loA;
		this.mHighAlarm = hiA;
		this.mLowWarning = loW;
		this.mHighWarning = hiW;
		this.colorNormal = "rgb(43,194,83)";
		this.colorWarn = "#f1a165";
		this.colorAlarm = "#df4040";
		this.mDiv = document.createElement("div");
		this.mSpan = document.createElement("span");
		this.mDiv.appendChild(this.mSpan);
		this.mDiv.className = "meter";
		this.mDiv.style.width = "45px";
		this.getDiv = function ()  {
			return this.mDiv;
		}
		this.attachTo = function(parent) {
			try {
				parent.mMeter = this;
				parent.appendChild(this.mDiv);
			} catch (err) {}
		}
		this.valueSet = function(val, color) {
			try {
				var percent;
				if (typeof(val) === "undefined" || val == null || isNaN(val) || isNaN(parseInt(val)) || val <= this.mMin)
					percent = 0;
				else if (val >= this.mMax)
					percent = 100;
				else
					percent = 100*(val - this.mMin)/(this.mMax - this.mMin);
				this.mSpan.style.width = ""+percent.toFixed(0)+"%";
				var bColor;
				if (typeof(color) === 'undefined') {
					if (typeof(val) === "undefined" || val == null || isNaN(val) || isNaN(parseInt(val)))
						bColor = this.colorNormal;
					else if (val < this.mLowAlarm)
						bColor = this.colorAlarm;
					else if (val < this.mLowWarning)
						bColor = this.colorWarn;
					else if (val > this.mHighAlarm)
						bColor = this.colorAlarm;
					else if (val > this.mHighWarning)
						bColor = this.colorWarn;
					else
						bColor = this.colorNormal;
				} else
					bColor = color;
				this.mSpan.style.backgroundColor = bColor;
			} catch (err) {}
		}
	}

	function setMetRange(id, settings) {
		try {
			var met = document.getElementById("met_"+id).mMeter;
			if (!met) {
				return;
			}
			met.mMax = settings.max;
			met.mMin = settings.min;
			met.mLowAlarm = settings.loA;
			met.mHighAlarm = settings.hiA;
			met.mLowWarning = settings.loW;
			met.mHighWarning = settings.hiW;
		} catch (err) { }
	}	
}

function computeTimeoutReqMs() {
	if (window.parent.navi.isEthernetMode) {
		return 300;
	} else {
		return 100;
	}
}
