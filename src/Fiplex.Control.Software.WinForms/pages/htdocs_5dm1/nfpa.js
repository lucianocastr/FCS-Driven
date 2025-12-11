var gui;
var NFPAStr;
var NFPAcfg;
var NFPAstat;
var tags;
var timerId;
var tmrIdStat;
var countCheck;
var factory;
var RFsettings = {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 45 };
var VSWRsettings = {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 25 };
var BBLevelInsettings = {min:  -80, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 };
var remoteGlobalConfResponseValid = [false, false];
var remoteStatResponseValid = [false, false];
var frameSeparator = "\t\t\t";
var version;
var serNr;
function onloadInit() {	
	gui = new GUI_NFPA();
	NFPAcfg = [];
	NFPAStr = [];
	factory = [];
	tags = [];
	version = [];
	config = [];
	serNr = [];
	for ( var n = 0; n <=nrOfRemotes; n++ ) {
		NFPAcfg.push(new NFPAconf(n));
		factory.push(new Factory());
		NFPAStr.push("");
		tags.push(new Tags());
		version.push(new Version());
		config.push(new Config());
		serNr.push(new SerialNrT());
	}
	showResultIcon(ERR_NONE);
	globalConfigReq();
	cursorWait();
	showResultIcon(ERR_PENDING);
}
function reloadData(){
	try {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
	} catch(err) {}
	showResultIcon(ERR_PENDING);
	waitACK = false;
	cursorWait();
	globalConfigReq();
}
function globalConfigReq() {
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
				gui.createForm();
				gui.showConf(NFPAcfg);
				window.top.submitLocked = false;
				cursorClear();
				reloadIcon = false;
				waitACK = false;	
				showResultIcon(ERR_NONE);
				guiBlocked(false);
				refreshEnables();
				load_status();
				
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
		globalConfigReq();
		return;
	}
	str = correctASCII(str);
	var deviceStr = str.split(frameSeparator);
	if (deviceStr.length < (1+nrOfRemotes)) {
		globalConfigReq();
		return;
	}
	parseGlobalConfigUnit(deviceStr[0], 0);
	for (var n = 0; n < nrOfRemotes; n++ ) {
		var remoteNr = n+1;
		if (deviceStr[remoteNr].length < remoteGlobalConfigLength+remoteHeaderLength) {
			remoteGlobalConfResponseValid[n] = false;
		}else{
			remoteGlobalConfResponseValid[n] = (1 === parseInt(deviceStr[remoteNr].substring(2,4),16));
			parseGlobalConfigUnit(deviceStr[remoteNr].substr(remoteHeaderLength), remoteNr);
		}
	}
}
function parseNFPAStatus(str) {
	var nfpa = [];
	for (var nr=0;nr<=nrOfRemotes;nr++)
		nfpa.push(new NFPAstatus(nr));
	
	if ( typeof(str) === 'undefined' || str === null ) {
		if (!waitACK){
			tmrIdStat = setTimeout(function() { load_status(); }, 1000);
		}
		return;
	}
	str = correctASCII(str);
	var deviceStr = str.split(frameSeparator);
	if (deviceStr.length < (1+nrOfRemotes)) {
		if (!waitACK){
			tmrIdStat = setTimeout(function() { load_status(); }, 1000);
		}
		return;
	}
	nfpa[0].parse(deviceStr[0]);
	for (var n = 0; n < nrOfRemotes; n++ ) {
		var remoteNr = n+1;
		if (deviceStr[remoteNr].length < statLength+remoteHeaderLength) {
			remoteStatResponseValid[n] = false;
		}else{
			remoteStatResponseValid[n] = (1 === parseInt(deviceStr[remoteNr].substring(2,4),16));
			nfpa[remoteNr].parse(deviceStr[remoteNr].substr(remoteHeaderLength));
		}
		if (!remoteStatResponseValid[n]) remoteGlobalConfResponseValid[n] = false;
	}
	return nfpa;
}
function parseGlobalConfigUnit(str, n) {
	var srarr = str.split('\t');
	if (srarr.length < 7) {
		return;
	}
	var srConf = srarr[0];
	var srFact = srarr[1];
	var srTag = srarr[4];
	var srVersion = srarr[5];
	var srNFPA = srarr[6]; 
	var srSerNr = srarr[3];
	
	tags[n].parseRawText(srTag);
	factory[n].parse(srFact);
	NFPAcfg[n].parse(srNFPA, n);
	version[n].parse(srVersion);
	config[n].parse(srConf,factory[n],n);
	serNr[n].parse(srSerNr);
	NFPAStr[n] = srNFPA;
}

function load_status() {
	var tmout = computeTimeoutReqMs(true);
	try {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState ===4 && this.status === 200) {
				if (!waitACK){
					NFPAstat = parseNFPAStatus(this.responseText);
					gui.showStatus(NFPAstat);
				}
				var timeoutMs = isFileOpBusy() ? 10000 : tmout;
				if (!waitACK){
					tmrIdStat = setTimeout(function() { load_status(); }, timeoutMs);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			if (!waitACK){
				tmrIdStat = setTimeout(function() { load_status(); }, tmout);
			}
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			if (!waitACK){
				tmrIdStat = setTimeout(function() { load_status(); }, tmout);
			}
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_nfpa.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function submitform(ndev, setDefaultRelay) {//ndev is number of unit (nr) where restore button was clicked
	var doSetDefaultRelay = false;
	if (typeof(setDefaultRelay) !== "undefined") {
		doSetDefaultRelay = setDefaultRelay || false;
	}
	localStorage.setItem(serNr[0].sernr+"_alarmposition",document.documentElement.scrollTop);
	if ((typeof window.top.submitLocked == "undefined") || !window.top.submitLocked) {
		window.top.submitLocked = true;
	} else if (window.top.submitLocked) {
		return;
	}
	var frameArray = [];
	var NFPAcfgToSend = new NFPAconf(0);
	NFPAcfgToSend.parse(NFPAStr[0], 0);
	gui.readConf(NFPAcfgToSend,0);
	if (doSetDefaultRelay && ndev==0) NFPAcfgToSend.setDefaultRelayAssign(self.config[0].bbu_serial_mode,0);
	if (NFPAcfgToSend.buzzerMuteTime > 24*3600) {
		NFPAcfgToSend.buzzerMuteTime = 24*3600;
		gui.bbuBuzzerMuteTimeSet(NFPAcfgToSend.buzzerMuteTime,0);
	}
	var frm = NFPAcfgToSend.getFrm();

	if (frm != NFPAStr[0]) {
		var remoteHeader = hexformat(0, 2);    // master + valid==true
		remoteHeader += hexformat(1, 2);
		frameArray.push(remoteHeader+frm);
	}
	
	for (var i = 0; i < nrOfRemotes; i++) {
		if ( remoteGlobalConfResponseValid[i] ){

			var NFPAcfgToSend = new NFPAconf(i+1);
			NFPAcfgToSend.parse(NFPAStr[i+1], i+1);
			gui.readConf(NFPAcfgToSend, i+1 );
			if (doSetDefaultRelay && ndev==(i+1)) NFPAcfgToSend.setDefaultRelayAssign(self.config[i+1].bbu_serial_mode,i+1);
			if (NFPAcfgToSend.buzzerMuteTime > 24*3600) {
				NFPAcfgToSend.buzzerMuteTime = 24*3600;
				gui.bbuBuzzerMuteTimeSet(NFPAcfgToSend.buzzerMuteTime,i+1);
			}
			frm = NFPAcfgToSend.getFrm();
			if (frm != NFPAStr[i+1]) {
				var remoteHeader = hexformat(i+1, 2);
				remoteHeader += hexformat(1, 2);
				frameArray.push(remoteHeader+frm);
			}
			
		}
	}

	clearTimeout(tmrIdStat);
	waitACK = true;
	submitFrms(frameArray);
}

function submitFrms(frms) {
	var self = this;
	if (typeof(frms) !== 'undefined') {
		self.frms = frms;
	} 
	try {
		if (self.frms.length == 0) {
			showResultIcon(ERR_OK);
			setTimeout(function() { globalConfigReq(); }, 1000);
			return;
		}
		var frm = self.frms.splice(0, 1);
	doSubmit(frm);
	} catch (e) {}
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
		document.getElementById("nfpa_str").value = frm;
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
	reloadIcon = false;
	waitACK = false;	
	showResultIcon(ERR_NONE);
	guiBlocked(false);
	globalConfigReq();
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
				if (error == ERR_FAIL) {
					showResultIcon(error);
					setTimeout(function() { xhrOnEnd(); }, 1500);
					return;
				}
				submitFrms();
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
function refreshCtrlEnable(num,mode,nr,val){
	try{
		document.getElementById("enabled_"+num+"_"+mode+"_0_"+nr).disabled = !val;
		//todos los textos blancos y disabled
		var isExtGlobalAlarm = (nr==0 && mode == 0 && num >=8 && num <= 10) || (nr>0 && mode == 0 && num >=8 && num <= 11);
		var isAnnunciatorAlarm = (mode == 2 && num >=12 && num <= 15);
		var enableAlarmName = isExtGlobalAlarm || isAnnunciatorAlarm;
		document.getElementById("AlName_"+num+"_"+mode+"_"+nr).style.backgroundColor = (enableAlarmName ? "white" : "#DDDDDD");
		document.getElementById("AlName_"+num+"_"+mode+"_"+nr).disabled = !enableAlarmName;
	} catch (err) {}
}
function refreshEnables(){
	//Se reutiliza refreshEnables para forzar disabled Antenna isolation, Osc. Detection en general y
	//Overload UL, DL PA Fail, Tx Power Low, VSWR, DL AGC Fail en band-specific
	for (var nr=0;nr<=nrOfRemotes;nr++){
		for (var mode=0;mode<2;mode++){
			var numAlarm = mode==0?24:16;
			for (var num=0;num < numAlarm;num++){
				var alDisable = (mode==0 && ((nr==0 && num==2)||num==3));
				alDisable = alDisable || (nr==0 && mode==1 && (num==0 || num==6  || num==7 || (num>=2 && num<=4)));
				refreshCtrlEnable(num,mode,nr,!alDisable);
				if ( (nr==0 && mode==1 && (num==0 || num==6  || num==7 || (num>=2 && num<=4))) ||
					(nr==0 && mode==0 && (num==2 || num==3)) ||  //antenna isolation y oscillation detection en master
					(mode==0 && (num>=12 && num<=14)))
				{
					//checkbox system alarm deshabilitado en las alarmas inexistentes y la propia system alarm en master y remoto
					for (var i = 0; i < NrOfGralSystemAlarms; i++) {
						try {
							var el = document.getElementById("systemAlarm_"+num+"_"+mode+"_0_"+nr+"_"+i);
							el.checked = false;
							el.disabled = true;
						}catch(e){}
					}
				}
			}
		}
		if (version[0].compareSw(2,0) < 0) {
			// si la versión de micro del master es <2.00, deshabilitar checkbox General System Alarm
			var el = document.getElementById("enabled_12_0_0_"+nr);
			el.checked = false;
			el.disabled = true;
		}

		for (var num=0;num<18;num++){
			var mode = 2;
			var alDisable = (nr==0 && self.config[0].bbu_serial_mode==0);
			refreshCtrlEnable(num,mode, nr, !alDisable);
			if (alDisable){
				document.getElementById("enabled_"+num+"_"+mode+"_0_"+nr).checked = false;
				for (var i = 0; i < NrOfGralSystemAlarms; i++) {
					try {
						var el = document.getElementById("systemAlarm_"+num+"_"+mode+"_0_"+nr+"_"+i);
						el.checked = false;
						el.disabled = true;
					}catch(e){}
				}
			}
		}
		for (var n = 0; n < gui.bbuMeasurements.length; n++) {
			document.getElementById(gui.bbuMeasurements[n].id+"_"+nr).style.backgroundColor = "#DDDDDD";
			document.getElementById(gui.bbuMeasurements[n].id+"_"+nr).disabled = true;
		}
		document.getElementById("bbuBuzzerStatus"+"_"+nr).style.backgroundColor = "#DDDDDD";
		document.getElementById("bbuBuzzerStatus"+"_"+nr).disabled = true;
		if (self.config[nr].bbu_type == 2) {
			/* disable battery bank alarm (k=10) if H.P. bbu */
			var k=10;
			refreshCtrlEnable(k, 2, nr, false);
			if (nr>0){
				for (var j=0;j<config[nr].NR_OF_RELAYS_MAX;j++) {
					var el = document.getElementById("relay_enabled_"+k+"_2_"+j+"_"+nr);
					el.checked = false;
					el.disabled = true;
				}
			}
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				var el = document.getElementById("systemAlarm_"+k+"_2_0"+"_"+nr+"_"+i);
				el.checked = false;
				el.disabled = true;
			}
		}
	}
}
function GUI_NFPA() {
	this.isBbuConnected = [false,false,false,false,false,false,false,false,false,];
	this.readConf = function(nfpa,nr){
		for (var band=0;band<2;band++){
			nfpa.retLossTh[band] = this.RetLossThGet(band,nr);
			nfpa.minPowerVSWR[band] = this.VSWRMinPowerGet(band,nr);
			nfpa.alarmNumSens[band] = this.AlarmSensGet(band,nr);
			nfpa.timeTxLowPowLow[band] = this.timeTriggerGet(band,nr);
		}
		for (var k=0;k<3;k++)
			nfpa.relayLogicConfigNormal[k] = this.relayStatusCtrlGet(k,nr)==1;

		if (nr==0 && use7relaysInMaster(version[0])) {
			for (var k=4;k<7;k++)
				nfpa.relayLogicConfigNormal[k] = this.relayStatusCtrlGet(k,nr)==1;
		}
		for (var k=8;k<12;k++)
			nfpa.alarmNames[0][k] = document.getElementById("AlName_"+k+"_0_"+nr).value;
		if (nr==0) {
			if (use7relaysInMaster(version[0])) {
				nfpa.alarmNames[0][11] = "Force RF OFF/Remote Ext.Input 4";
			} else {
				nfpa.alarmNames[0][11] = "Force RF OFF";
			}
		}
		for (var k=0;k<24;k++){
			nfpa.globalAlarmsEnabled[k] = document.getElementById("enabled_"+k+"_0_0_"+nr).checked; //Se cambió a checkbox
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				nfpa.generalSystemAlarm[i][0][k] = document.getElementById("systemAlarm_"+k+"_0_0_"+nr+"_"+i).checked;
			}
			for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++) {
				nfpa.relayAssignGlobalAlarm[k][j] = document.getElementById("relay_enabled_"+k+"_0_"+j+"_"+nr).checked;
			}
			if ( k >= 8 && k <= 11 ) {
				var externalAlarmNr = k - 8;
				nfpa.externalAlarmPolarity[externalAlarmNr] = document.getElementById("extAlarmPolarity_"+externalAlarmNr+"_"+nr).checked;
			}
		}
		if (version[0].compareSw(2,0) < 0) {
			// si la versión de micro del master es <2.00, no hay General System Alarm
			nfpa.globalAlarmsEnabled[12]= false;
			nfpa.globalAlarmsInstalled[12]= false;
		}
		for (var k=0;k<16;k++){
			// se usa el primer byte de alarm enable
			nfpa.bandAlarmsEnabled[k] = document.getElementById("enabled_"+k+"_1_0_"+nr).checked; //Se cambió a checkbox
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				nfpa.generalSystemAlarm[i][1][k] = document.getElementById("systemAlarm_"+k+"_1_0_"+nr+"_"+i).checked;
			}
			for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++)
				nfpa.relayAssignBandAlarm[k][j] = document.getElementById("relay_enabled_"+k+"_1_"+j+"_"+nr).checked;
		}
		if (nr==0){ //Se fuerza algunas alarmas como siempre deshabilitadas
			var forceDis = [0,2,3,4,6,7]; //Overload UL,DL PA Fail,TX Power Low,VSWR,DL AGC Fail,DL Output Power
			for (var k=0;k<forceDis.length;k++)
				nfpa.bandAlarmsEnabled[forceDis[k]] = false; 
		}
		for (var j=0;j<2;j++)
			nfpa.antennaDisconnectionThreshold[j] = this.bbLevelInThGet(nr,j);
		var m = (nr==0?0:1);
		for (var k = 0; k < this.alarmThrshElements[m].length; k++) {
			var el = document.getElementById(this.AlarmThrshElementsId(k, 0, nr));
			nfpa.alarmThrshData[k].valueThr = parseInt(el.value);
			var el = document.getElementById(this.AlarmThrshElementsId(k, 1, nr));
			nfpa.alarmThrshData[k].hysteresis = parseFloat(el.value);
		}
		for (var k=0;k<16;k++){
			nfpa.bbuAlarmsEnabled[k] = document.getElementById("enabled_"+k+"_2_0"+"_"+nr).checked;
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				nfpa.generalSystemAlarm[i][2][k] = document.getElementById("systemAlarm_"+k+"_2_0"+"_"+nr+"_"+i).checked;
			}
			if (k<12) {
				nfpa.bbuAlarmsEnabled[k] = document.getElementById("enabled_"+k+"_2_0"+"_"+nr).checked;
				for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++) nfpa.relayAssignBbuAlarm[k][j] = document.getElementById("relay_enabled_"+k+"_2_"+j+"_"+nr).checked;
				
			} else if (k>=12) {
				// annunciators relay assign and enable is the same for the four of them and set in row with k==12
				nfpa.bbuAlarmsEnabled[k] = true; //always true
				for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++) nfpa.relayAssignBbuAlarm[k][j] = document.getElementById("relay_enabled_12_2_"+j+"_"+nr).checked;
				// annunciators installed in annunciator's enable checkboxes
				nfpa.bbuAlarmsInstalled[k] = document.getElementById("enabled_"+k+"_2_0"+"_"+nr).checked;
			}
		}
		for (var k=12;k<16;k++) {
			nfpa.alarmNamesBbu[k] = document.getElementById("AlName_"+k+"_2"+"_"+nr).value;
		}
		nfpa.buzzerMuteTime = this.buzzerMuteTimeGet(nr);
		if (nr==0) {
			nfpa.relayAssignPolicy = this.relayAssignPolicyGet();
		}
	}
	this.showStatus = function(nfpa){
		try{
			for (var nr=0;nr<=nrOfRemotes;nr++){
				if (nr>0){
					if (!remoteStatResponseValid[nr-1]) this.showUnit(nr,false);
					if (remoteStatResponseValid[nr-1] && !remoteGlobalConfResponseValid[nr-1]){
						if (!reloadIcon){
							showResultIcon(ERR_RELOAD);
							reloadIcon = true;
						}
					}
				}
				for (var k=0;k<2;k++){
					setMetValue("rfPowFwd_"+k+"_"+nr, nfpa[nr].powDirect[k]);
					setMetValue("rfPowRev_"+k+"_"+nr, nfpa[nr].powReverse[k]);
					setMetValue("returnLoss_"+k+"_"+nr, nfpa[nr].retLoss[k]);
					var el = document.getElementById("warnPowerMess_"+k+"_"+nr);
					el.style.display = nfpa[nr].powDirect[k]<NFPAcfg[nr].minPowerVSWR[k]?"table-cell":"none";	
					this.timeElapsedSet(k,nr,nfpa[nr].txLowerPowerTimeHigh[k],nfpa[nr].txLowerPowerTimeLow[k],NFPAcfg[nr].timeTxLowPowLow[k]);
					setMetValue("bbLevelIn_"+nr+"_"+k, nfpa[nr].bbLevel[k]);
				}
				var bbuCommErr = nfpa[nr].bbuAlarmResult[4];
				document.getElementById("ChargerTemperature"+"_"+nr).value = bbuCommErr?"---": nfpa[nr].bbuChargerTemperature;
				document.getElementById("BatteryTemperature"+"_"+nr).value = bbuCommErr?"---": nfpa[nr].bbuBatteryTemperature;
				document.getElementById("IndividualBatteryVoltage1"+"_"+nr).value = bbuCommErr?"---": (nfpa[nr].bbuBatteryStatusVoltage[0]/1000).toFixed(2);
				document.getElementById("IndividualBatteryVoltage2"+"_"+nr).value = bbuCommErr?"---": (nfpa[nr].bbuBatteryStatusVoltage[1]/1000).toFixed(2);
				document.getElementById("IndividualBatteryVoltage3"+"_"+nr).value = bbuCommErr?"---": (nfpa[nr].bbuBatteryStatusVoltage[2]/1000).toFixed(2);
				document.getElementById("IndividualBatteryVoltage4"+"_"+nr).value = bbuCommErr?"---": (nfpa[nr].bbuBatteryStatusVoltage[3]/1000).toFixed(2);
				document.getElementById("SystemVoltage"+"_"+nr).value = bbuCommErr?"---": (nfpa[nr].bbuSystemVoltage/1000).toFixed(2);
				document.getElementById("BatteryBankVoltage"+"_"+nr).value = bbuCommErr?"---": (nfpa[nr].bbuBatteryVoltageBank/1000).toFixed(2);
				document.getElementById("MainCurrent"+"_"+nr).value = bbuCommErr?"---": (nfpa[nr].bbuMainCurrent/1000).toFixed(2);
				document.getElementById("BatteryCurrent"+"_"+nr).value = bbuCommErr?"---": (nfpa[nr].bbuBatteryCurrent/1000).toFixed(2);
				this.bbuBuzzerStatusSet(nfpa[nr].bbuBuzzerStatus, bbuCommErr,nr);
				this.bbuBuzzerRemainingTimeSet(nfpa[nr].bbuBuzzerRemainingTime, bbuCommErr,nr);
				if (config[nr].bbu_serial_mode) {
					if ( nfpa[nr].isBbuDisconnectionAlarm() ) {
						this.isBbuConnected[nr] = false;
					} else {
						if ( !this.isBbuConnected[nr] ) {
							this.updateRelayShow(nr, nfpa[nr]);
						}
						this.isBbuConnected[nr] = true;
					}
				}
			}
			setScrollPos();
		} catch(e){}
	}
	function setScrollPos(){
		if (firstStatus){
			firstStatus = false;
			var pos = localStorage.getItem(serNr[0].sernr+"_alarmposition");
			if (pos!=null) window.scrollTo(0, pos);
		}else{
			localStorage.setItem(serNr[0].sernr+"_alarmposition",document.documentElement.scrollTop);
		}
	}
	this.updateRelayShow = function(nr, monitor) {
		var bbuSerialMode = isBbuSerialMode(config[nr]);
		var nrOfRelaysSupported = getNrOfRelaysSupported(config[nr], nr);
		var statusBbuSerialMode = monitor.getBbuSerialMode();
		var statusNrOfRelaysSupported = monitor.getNrOfRelaysSupported();
		var reloadRequired = ((bbuSerialMode != statusBbuSerialMode) || (nrOfRelaysSupported != statusNrOfRelaysSupported) );
		if (reloadRequired) {
			if (!reloadIcon){
				showResultIcon(ERR_RELOAD);
				reloadIcon = true;
			}
		}
		return reloadRequired;
	}
	this.showUnit = function(nr,show){
		try {
			var el = document.getElementById("unitDiv_"+nr);
			el.style.display = ( show ? "block" : "none" );
		} catch(e){}
	}
	this.configurationAlarmsTitle = function(nr, nfpa) {
		var titleStr = "";
		if (nr==0)
		{
			if (nfpa[0].relayAssignPolicy == 0) {	/* Remote alarm triggers master relays according to master table */
				titleStr = "MASTER&nbsp;&&nbsp;REMOTE&nbsp;UNIT&nbsp;ALARMS";
			} else {
				titleStr = "MASTER&nbsp;UNIT&nbsp;ALARMS";
			}
			titleStr += "&nbsp;-&nbsp;" + tags[0].getTag();
		}
		else
		{
			titleStr = "REMOTE&nbsp;UNIT&nbsp;"+nr+"&nbsp;ALARMS";
			titleStr += "&nbsp;-&nbsp;" + tags[nr].getTag();
		}
		return titleStr;
	}
	this.setConfigurationAlarmsTitle = function(nr, nfpa) {
		var el = document.getElementById("tagcName_"+nr);
		el.innerHTML = this.configurationAlarmsTitle(nr, nfpa);
	}
	this.generalRelaySettingsTitle = function(nr, mode, nfpa) {
		var titleStr = "";
		var modeName = (mode==0?"GENERAL":(mode==1?"BAND-SPECIFIC":"BBU"));
		var unitName = (nr==0?"MASTER":"REMOTE");
		if (nr == 0)
		{
			unitName = "MASTER";
		}
		else
		{
			if (nfpa[0].relayAssignPolicy == 1) {	/* Remote alarm triggers master relays according to each remote table */
				unitName = "REMOTE&nbsp;&&nbsp;MASTER";
			} else {
				unitName = "REMOTE";
			}
		}
		titleStr = modeName+"&nbsp;"+unitName+"&nbsp;RELAY&nbsp;SETTINGS";
		return titleStr;
	}
	this.setGeneralRelaySettingsTitle = function(nr, mode, nfpa) {
		var titleStr = this.generalRelaySettingsTitle(nr, mode, nfpa);
		var cell = document.getElementById("generalRelaySettingsTitle_"+mode+"_"+nr);
		cell.innerHTML = titleStr;
	}
	this.showConf = function(nfpa){
		this.showUnit(0,true);
		for (var nr=0;nr<=nrOfRemotes;nr++){
			if (nr>0 && remoteGlobalConfResponseValid[nr-1]) this.showUnit(nr,true);
			var el = document.getElementById("powmeas_"+nr);
			el.innerHTML =  nr==0?"MASTER":"REMOTE "+nr;
			var el = document.getElementById("bbuParams_"+nr);
			el.innerHTML =  nr==0?"MASTER":"REMOTE "+nr;
			var el = document.getElementById("confAlarm_"+nr);
			el.innerHTML =  nr==0?"MASTER":"REMOTE "+nr;
			var el = document.getElementById("althres_"+nr);
			el.innerHTML =  nr==0?"MASTER":"REMOTE "+nr;
			var el = document.getElementById("tagpName_"+nr);
			el.innerHTML = "POWER&nbsp;MEASUREMENTS - " + tags[nr].getTag();
			this.setConfigurationAlarmsTitle(nr, nfpa);
			for (var mode=0; mode < relayAssignPolicies.length; mode++){
				this.setGeneralRelaySettingsTitle(nr, mode, nfpa);
			}
			var el = document.getElementById("tagbName_"+nr);
			el.innerHTML = "BATTERY&nbsp;BACKUP&nbsp;PARAMETERS - " + tags[nr].getTag();
		}
		for (var nr=0;nr<=nrOfRemotes;nr++){
			for (var band=0;band<2;band++){
				//visualizaciones que dependen de factory				
				var show = factory[nr].chBandEnabled[band] || factory[nr].adjBandEnabled[band];
				if (nr==0){
					if (!factory[nr].commonUl){
						document.getElementById("antDisconnTitle_"+band).innerHTML = "ANTENNA&nbsp;DISCONNECTION " + factory[nr].bandNames[band];
						document.getElementById("antDisconnTitle_"+band).style.display = show?"table-cell":"none";
						document.getElementById("antDisconnCtrl_"+band).style.display = show?"table-cell":"none";
					}else{
						document.getElementById("antDisconnTitle_"+band).colSpan = 2;
						document.getElementById("antDisconnCtrl_"+band).colSpan = 2;
					}
				}
				var el = document.getElementById("vswrtitle_"+band+"_"+nr);
				el.innerHTML = "VSWR METER " + factory[nr].bandNames[band];
				if (!show) el.style.display = "none";
				var el = document.getElementById("donortitle_"+band+"_"+nr);
				el.innerHTML = "DONOR ANTENNA FAILURE ADJUSTMENT " + factory[nr].bandNames[band];
				if (!show) el.style.display = "none";
				if (!show){
					document.getElementById("powerCell_"+band+"_"+nr).style.display = "none";
					document.getElementById("vswrCell_"+band+"_"+nr).style.display = "none";
					document.getElementById("donorCell_"+band+"_"+nr).style.display = "none";
				}
				RFsettings.max = factory[nr].powerlimit[2*band+1] + 5;
				RFsettings.min = RFsettings.max - 50;
				RFsettings.high_warn = factory[nr].powerlimit[2*band+1];
				RFsettings.high_alarm = factory[nr].powerlimit[2*band+1] + factory[nr].MAX_PWR_DELTA;
				setMetRange("rfPowFwd_"+band+"_"+nr, RFsettings);
				setMetRange("rfPowRev_"+band+"_"+nr, RFsettings);
				var el = document.getElementById("minPowerVSWR_"+band+"_"+nr);
				el.setAttribute("max",factory[nr].powerlimit[2*band+1]);
				el.title = "Min: "+el.min+", Max: "+el.max+" dBm";
				if (nr>0) {
					var el = document.getElementById("althresrow_"+band+"_"+nr);
					el.style.display = show? "table-row" :"none";
					var el = document.getElementById("althrestitle_"+band+"_"+nr);
					el.innerHTML = "Downlink&nbsp;Output&nbsp;Power&nbsp;Alarm&nbsp;"+factory[nr].bandNames[band].toUpperCase()+" (dBm)";
				}
				//
				this.RetLossThSet(band,nr,nfpa[nr].retLossTh[band]);
				this.VSWRMinPowerSet(band,nr,nfpa[nr].minPowerVSWR[band]);
				this.AlarmSensSet(band,nr,nfpa[nr].alarmNumSens[band]);
				this.timeTriggerSet(band,nr,nfpa[nr].timeTxLowPowLow[band]);

				for (var k=0;k<3;k++)
					this.relayStatusCtrlSet(k,nr,nfpa[nr].relayLogicConfigNormal[k]);

				if (nr==0 && use7relaysInMaster(version[0])) {
					for (var k=4;k<7;k++)
						this.relayStatusCtrlSet(k,nr,nfpa[nr].relayLogicConfigNormal[k]);
				}
				for (var k=0;k<24;k++){
					if (k==11 && nr==0)
						document.getElementById("AlName_"+k+"_0_0").value = (use7relaysInMaster(version[0])?"Force RF OFF/Remote Ext.Input 4":"Force RF OFF");
					else if (nr>0 && k==12 && getNrOfGralSystemAlarmsSupported(config[nr], nr)==1) {			// for legacy remote device
						var alName =  nfpa[nr].alarmNames[0][k].substr(0, nfpa[nr].alarmNames[0][k].length-2);	// delete '1' from end of general system alarm name
						document.getElementById("AlName_"+k+"_0_"+nr).value = alName;
					} else
						document.getElementById("AlName_"+k+"_0_"+nr).value = nfpa[nr].alarmNames[0][k];
					if (nr==0 && (k==2 || k==3))
						document.getElementById("enabled_"+k+"_0_0_"+nr).checked = false; //se fuerza el valor de Ant.Isolation y Osc.Detection en master
					else
						document.getElementById("enabled_"+k+"_0_0_"+nr).checked = nfpa[nr].globalAlarmsEnabled[k]; //Se cambió a checkbox
					for (var j=0;j<nfpa[nr].NR_OF_RELAYS_MAX;j++) document.getElementById("relay_enabled_"+k+"_0_"+j+"_"+nr).checked = nfpa[nr].relayAssignGlobalAlarm[k][j];
					if ( k >= 8 && k <= 11 ) {
						var externalAlarmNr = k - 8;
						document.getElementById("extAlarmPolarity_"+externalAlarmNr+"_"+nr).checked = nfpa[nr].externalAlarmPolarity[externalAlarmNr];
					}
					for (var i = 0; i < NrOfGralSystemAlarms; i++) {
						document.getElementById("systemAlarm_"+k+"_0_0_"+nr+"_"+i).checked = nfpa[nr].generalSystemAlarm[i][0][k];
					}
				}
				for (var k=0;k<16;k++){
					if (k==5)
						document.getElementById("AlName_"+k+"_1_"+nr).value = "Rx Power Low / Donor Antenna";
					else
						document.getElementById("AlName_"+k+"_1_"+nr).value = nfpa[nr].alarmNames[1][k];
					document.getElementById("enabled_"+k+"_1_0_"+nr).checked = nfpa[nr].bandAlarmsEnabled[k];
					for (var j=0;j<nfpa[nr].NR_OF_RELAYS_MAX;j++) document.getElementById("relay_enabled_"+k+"_1_"+j+"_"+nr).checked = nfpa[nr].relayAssignBandAlarm[k][j];
					for (var i = 0; i < NrOfGralSystemAlarms; i++) {
						document.getElementById("systemAlarm_"+k+"_1_0_"+nr+"_"+i).checked = nfpa[nr].generalSystemAlarm[i][1][k];
					}
				}
						
			}
			for (var k = 0; k < 2; k++) 
				this.bbLevelInThSet(nr,k,nfpa[nr].antennaDisconnectionThreshold[k]);
			var m = (nr==0?0:1);
			for (var k = 0; k < this.alarmThrshElements[m].length; k++) {
				var el = document.getElementById(this.AlarmThrshElementsId(k, 0, nr));
				el.value = nfpa[nr].alarmThrshData[k].valueThr;
				var el = document.getElementById(this.AlarmThrshElementsId(k, 1, nr));
				el.value = nfpa[nr].alarmThrshData[k].hysteresis.toFixed(1);
			}
			for (var k=0;k<16;k++){
				document.getElementById("AlName_"+k+"_2_"+nr).value = nfpa[nr].alarmNamesBbu[k];
				if (k<12) {
					document.getElementById("enabled_"+k+"_2_0_"+nr).checked = nfpa[nr].bbuAlarmsEnabled[k];
				} else  { 
					// annunciators installed in annunciator's enable checkboxes
					document.getElementById("enabled_"+k+"_2_0_"+nr).checked = nfpa[nr].bbuAlarmsInstalled[k];
				}
				for (var j=0;j<nfpa[nr].NR_OF_RELAYS_MAX;j++) document.getElementById("relay_enabled_"+k+"_2_"+j+"_"+nr).checked = nfpa[nr].relayAssignBbuAlarm[k][j];

				for (var i = 0; i < NrOfGralSystemAlarms; i++) {
					document.getElementById("systemAlarm_"+k+"_2_0_"+nr+"_"+i).checked = nfpa[nr].generalSystemAlarm[i][2][k];
				}
			}
			document.getElementById("AlName_16_2_"+nr).value = "Annunciators";
			document.getElementById("enabled_16_2_0_"+nr).checked = nfpa[nr].bbuAlarmsEnabled[12];
			this.bbuBuzzerMuteTimeSet(nfpa[nr].buzzerMuteTime,nr);
		}
		this.relayAssignPolicySet(nfpa[0].relayAssignPolicy);
	}
	this.createForm = function(){
		minButtonStates = [];
		var cont = document.getElementById("page");
			for(var nr=0;nr<=nrOfRemotes;nr++){
				this.createUnit(cont, nr);
			}
		firstStatus = true;
		setMinButtonState();
	}
	function setMinButtonState(){
		for (var k=0;k<minButtonStates.length;k++){
			setMinimizedState(minButtonStates[k][0],minButtonStates[k][1]);
		}
		for (var nr=0;nr<=nrOfRemotes;nr++){
			if (!isBbuSerialMode(config[nr])){
				document.getElementById("contentDivBBU_"+nr).style.display = "none"; //BBU content forced to hidden if it is not serial mode regardless localstorage
			}
		}
	}
	this.createUnit = function(cont,nr) {
		var id = "unitDiv_"+nr;
		var el = document.getElementById(id);
		if (el) remove_element(el);
		var unitDiv = document.createElement("div");
		unitDiv.id = id;
		unitDiv.style.width = "1450px";
		unitDiv.className = "unitbox";
		unitDiv.style.display = "none";
		cont.appendChild(unitDiv);
		id = "contentDivPow_"+nr;
		var headDiv = this.createUnitHead("POWER&nbsp;MEASUREMENTS","tagpName_"+nr,"","powmeas_"+nr,nr,true,id);
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = id;
		id = "contentDivBBU_"+nr;
		var tab = this.createRowPowerBand(nr);
		contentDiv.appendChild(tab);
		//if (!isBbuSerialMode(config[nr])) localStorage.setItem(serNr[0].sernr +"_min_"+ id,1); //forces frame to minimized state if BBU is not serial mode
		var headDiv = this.createUnitHead("BATTERY&nbsp;BACKUP&nbsp;PARAMETERS","tagbName_"+nr,"","bbuParams_"+nr,nr,true,id);
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		contentDiv.id = id;
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = this.createBatteryBackupParameters(nr);
		contentDiv.appendChild(tab);
		if (!isBbuSerialMode(config[nr])) {
			headDiv.style.display = "none";
			contentDiv.style.display = "none";
		}
		id = "contentDivAlarmC_"+nr;
		var headDiv = this.createUnitHead("CONFIGURATION&nbsp;ALARMS","tagcName_"+nr,"","confAlarm_"+nr,nr,true,id);
		unitDiv.appendChild(headDiv);
		if (nr==0) {
			contentDiv = document.createElement("div");
			contentDiv.id = "relayAssignPolicyDiv";
			contentDiv.className = "contentbox";
			unitDiv.appendChild(contentDiv);
			var tab = this.createRelayAssignPolicy();
			contentDiv.appendChild(tab);
		}
		var contentDiv = document.createElement("div");
		contentDiv.id = id;
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = this.createRelayConfig(nr);
		contentDiv.appendChild(tab);
		id = "contentDivThreshold_"+nr;
		var headDiv = this.createUnitHead("ALARM&nbsp;THRESHOLDS&nbsp;-&nbsp;"+tags[nr].getTag(),"","","althres_"+nr,nr,true,id);
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		contentDiv.id = id;
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = this.createAlarmThresholds(nr);
		contentDiv.appendChild(tab);
	}
	this.createBroadbandLevelIn = function(nr, band) {
		var cellb = document.createElement("td");
		cellb.className = "contentcell";	
		var tbl = document.createElement("table");
		tbl.align = "center";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = createMetRow("bbLevelIn_"+nr+"_"+band, BBLevelInsettings, "Broadband&nbsp;Input&nbsp;Level", "dBm");
		tb.appendChild(row);
		var row = this.createBBLevelInTh(nr,band);
		tb.appendChild(row);
		return cellb;
	}
	this.createBBLevelInTh = function(nr,band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Broadband&nbsp;Input&nbsp;Threshold";
		cell.style.paddingRight = "30px";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);		
		var el = document.createElement("input");
		el.id = "bbLevelInTh_"+nr+"_"+band;
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
	this.bbLevelInThSet = function(nr, band, val) {
		try {
			var el = document.getElementById("bbLevelInTh_"+nr+"_"+band);
			if (!isNaN(val)) {
				el.value = val.toFixed(0);
			}
		} catch (err) { }
	}
	this.bbLevelInThGet = function(nr, band) {
		try {
			var el = document.getElementById("bbLevelInTh_"+nr+"_"+band);
			return parseFloat(el.value);
		} catch (err) { return -128; }
	}
	this.createRelayConfig = function(nr){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		var cell = this.createRelayStatusAlarm(nr);
		if (isBbuSerialMode(config[nr])) cell.style.display = "none";
		rowb.appendChild(cell);
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		var cell = document.createElement("td");
		cell.className = "contentcell";
		rowb.appendChild(cell);
		var tbl = document.createElement("table");
		tbl.className = "alarmTable";
		tbl.setAttribute("border","1");
		tbl.style.width = "100%";
		cell.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		for (var mode = 0; mode < 3; mode++){
			var hide = !isBbuSerialMode(config[nr]) && mode==2 && nr>0;
			if (nr==0 && mode==2){
				var bbuShowTable = false;
				for (var k=0;k<=nrOfRemotes;k++){
					bbuShowTable = bbuShowTable || isBbuSerialMode(config[k]);
				}
				hide = !bbuShowTable;
			}
			this.createGeneralRelayConfig(tb,mode,nr, hide);
		}
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		var cell = this.createRestoreRelayButton(nr);
		rowb.appendChild(cell);
		return tab;
	}
	this.createRestoreRelayButton = function(nr) {
		var cell = document.createElement("td");
		cell.className = "contentcell";	
		cell.style.textAlign = "center";
		var el = document.createElement("input");
		el.id = "restoreRelay_"+nr;
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.value = "Restore Relay Assignment To Default";
		el.nr = nr;
		el.onclick = function(ev) {
			var alertMsg = "NOTICE:\nRelay assignment settings of "+(this.nr==0?"MASTER":"REMOTE "+this.nr)+" unit will be configured to default values.\nPlease confirm.";
			if (confirm(alertMsg)) {
				submitform(this.nr,true);
			}
		}
		cell.appendChild(el);
		return cell;
	}
	this.createGeneralRelayConfig = function(tb, mode,nr, hide){
		var row = document.createElement("tr"); if (hide) row.style.display = "none";
		row.style.height = "20px";
		tb.appendChild(row);
		var cell = document.createElement("th");
		var modeName = (mode==0?"GENERAL":(mode==1?"BAND-SPECIFIC":"BBU"));
		cell.innerHTML = modeName+"&nbsp;RELAY&nbsp;SETTINGS";
		cell.id = "generalRelaySettingsTitle_"+mode+"_"+nr;
		var nrOfGralSystemAlarmsSupported = getNrOfGralSystemAlarmsSupported(config[nr], nr);
		cell.colSpan = 2*(4+nrOfGralSystemAlarmsSupported+getNrOfRelaysSupported(config[nr], nr));
		row.appendChild(cell);
		var row = document.createElement("tr"); if (hide) row.style.display = "none";
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
			for (var j=0; j < NrOfGralSystemAlarms; j++) {
				var cell = document.createElement("th");row.appendChild(cell);
				cell.className = "alarmTable";
				cell.rowSpan = 2;
				var str = "System</br>Alarm";
				if (nrOfGralSystemAlarmsSupported > 1) str += "&nbsp;"+(j+1);
				cell.innerHTML = str;
				if ((nrOfGralSystemAlarmsSupported == 1) && (j > 0)) {
					cell.style.display = "none";
				}
				row.appendChild(cell);
			}
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			cell.innerHTML = "Relay";
			cell.colSpan = getNrOfRelaysSupported(config[nr], nr);
			row.appendChild(cell);	
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			if (mode==0) cell.innerHTML = "Polarity"+"<br/>"+"High";
			cell.rowSpan = 2;
			row.appendChild(cell);
		}
		var row = document.createElement("tr"); if (hide) row.style.display = "none";
		tb.appendChild(row);		
		for (var k=0;k<2;k++){
			for (var j=0;j<config[nr].NR_OF_RELAYS_MAX;j++){
				var cell = document.createElement("th");row.appendChild(cell);
				cell.className = "alarmTable";
				cell.innerHTML = j+1;
				if (j >= getNrOfRelaysSupported(config[nr], nr)) cell.style.display = "none";
			}
		}
		var alarmNrShow = 0;
		var nrows = (mode==0?12:(mode==1?8:9));
		for (var j=0;j<nrows;j++) {
			var increaseAlarmNr = true;
			var isUserAlarm = false;
			var isAnnunciatorAlarm = false;
			var row = document.createElement("tr"); if (hide) row.style.display = "none";
			tb.appendChild(row);
			var VU = !factory[nr].commonUl;
			var hideCond = (mode==0 && nr>0 && j==2); //se oculta UL PA Fail y AntennaDisconnection de remote 
			hideCond = hideCond || ((mode==1) && (nr>0 && j>3)); //Se ocultan las 3 últimas filas de alarmas banda remoto
			hideCond = hideCond || ((mode==0) && VU && (nr==0 && j==2)); //se oculta UL PA Fail y AntennaDisconnection de master si VU
			hideCond = hideCond || (nr>0 && mode==0 && config[nr].isRemoteLegacyType() && j==5); //en los remotos legacy se oculta la quinta fila
			hideCond = hideCond || (nr>0 && j>7 && (mode==0) ); //en los remotos se oculta a partir de fila 8
			hideCond = hideCond || (nr>0 && j>6 && (mode==1) ); //en los remotos se oculta a partir de fila 7
			hideCond = hideCond || (nr==0 && mode==0 && (j==3 || j>11)); //en los master se oculta fila 3(antigua alarma fiber 1 y 2) ylas 1 últimas filas
			row.id = "alarmRow_"+nr+"_"+mode+"_"+j;
			if (hideCond) { 
				row.style.display = "none";
				increaseAlarmNr = false;
			} else if (nr>0 && mode==0 && (j == 6 || j == 7)) {
				isUserAlarm = true;
				increaseAlarmNr = false;
			} else if (nr==0 && mode==0 && (j == 8 || j == 9)) {
				isUserAlarm = true;
				increaseAlarmNr = false;
			}
			if (mode == 2) {
				if (j == 7 || j == 8) {
					isAnnunciatorAlarm = true;
				}
			}
			for (var k=0;k<2;k++){
				var ix = k+2*j;
				var hideCell = (nr>0 && mode == 1 && ix>5); //se oculta la última + rx power low + overload DL de band-specific remoto
				hideCell = hideCell || (!VU && nr==0 && mode == 1 && ix>7); //se oculta a partir de la 8 si 7/8
				hideCell = hideCell || (VU && nr==0 && mode == 1 && ix>9); //se oculta a partir de la 10 si V/U
				hideCell = hideCell || (nr>0 && mode==0 && config[nr].isRemoteLegacyType() && j==4 && k==1); //en remotos legacy general, se quita la celda derecha a a general sys alarm 1
				hideCell = hideCell || (nr>0 && mode==0 && j==5 && k==1); //en remotos general, se quita la celda derecha a general sys alarm 3
				hideCell = hideCell || (nr==0 && mode==0 && j==11 && k==1); //en master general, se quita la celda derecha a other remotes alarms
				hideCell = hideCell || (mode==2 && j==6 && k==1); // hide BBU ALARM14
				var cell = document.createElement("th");
				if ( isUserAlarm ) {
					var userAlarmNr = 2*(j-(nr==0?8:6)) + k + 1;
					if (userAlarmNr==4 && nr==0){
						cell.innerHTML = "EXTERNAL<br>INPUT";
					}else{
						cell.innerHTML = "USER<br>ALARM&nbsp;"+userAlarmNr;
					}
				} else if ( isAnnunciatorAlarm ) {
					var annunciatorAlarmNr = 2*(j-7)+k+1;
					cell.innerHTML = "ANNUN."+annunciatorAlarmNr;
				} else if ( increaseAlarmNr && ! hideCell) {
					alarmNrShow++;
					cell.innerHTML = "ALARM&nbsp;"+alarmNrShow; //Se cambia ordenación (*)
				} else {
					cell.innerHTML = "ALARM&nbsp;"+(ix+1); //Se cambia ordenación (*)
				}
				var index = ix;
				if (mode==0 && nr==0){
					if (ix>=8 && ix<16)
						ix+=8;
					else if(ix>=16)
						ix-=8;
					index = ix;
				}
				if (mode==0 && nr>0){
					var ord = [0,1,2,3,4,5,6,7,12,13,14,15,8,9,10,11];
					ix = ix>15?ix:ord[ix];
					index = ix;
				}
				if (mode==1 && nr>0){
					var ord = [0,2,3,4,6,7,5,1];
					ix = ix>7?ix:ord[ix];
					index = ix;
				}
				if (VU && mode==1 && nr==0){
					var ord = [0,1,2,3,4,5,6,8,9,7];
					ix = ix>9?ix:ord[ix];
					index = ix;
				}
				if (mode == 2 && j>=6){
					index = j==6?index+4:index-2; //Change to insert a row for Annunciators keeping index of annunciators 1,2,3,4 
				}
				cell.style.paddingLeft = "5px";
				cell.style.paddingRight = "5px";
				cell.className = "alarmTable";
				cell.id = "alarmCell_"+nr+"_"+mode+"_"+j+"_"+k;
				if (hideCell) {
					cell.style.display = "none";
				}
				row.appendChild(cell);
				var cell = this.createInputText("AlName",index,mode,nr); //Se cambia ordenación (*)
				row.appendChild(cell);
				cell.className = "alarmTable";
				if (hideCell) {
					cell.style.display = "none";
				}
				var cell = this.createEnabledCheckBox(index,mode,0,nr); //Se cambia ordenación (*)
				row.appendChild(cell);
				cell.className = "alarmTable";
				cell.style.textAlign = "center";
				cell.style.minWidth = "40px";
				if (hideCell) {
					cell.style.display = "none";
				}
				if (mode==2 && j==6 && k==0) {
					// row for annunciators's relay assign, not for individual annunciator enable
					cell.style.visibility = "hidden";
				}
				for (var i = 0; i < NrOfGralSystemAlarms; i++) {
					var cell = this.createSystemCheckBox(index,mode,0,nr,i); //Se cambia ordenación (*)
					if (i >= nrOfGralSystemAlarmsSupported) {
						cell.style.display = "none";
					}
					row.appendChild(cell);
					cell.className = "alarmTable";
					cell.style.textAlign = "center";
					if (hideCell) {
						cell.style.display = "none";
					}
					if (mode==2 && j==6 && k==0) {
						// row for annunciators's relay assign, not for individual annunciator enable
						cell.style.visibility = "hidden";
					}
				}
				for (var i=0;i<config[nr].NR_OF_RELAYS_MAX;i++){
					var cell = this.createCheckBox(ix,mode,i,nr); //Se cambia ordenación (*)
					cell.style.textAlign = "center";
					if (i >= getNrOfRelaysSupported(config[nr], nr)) cell.style.display="none";
					if (isAnnunciatorAlarm) {
						// relay assign checkbox for individual annunciators
						if (i==0) {
							cell.style.visibility = "hidden";
							cell.colSpan = getNrOfRelaysSupported(config[nr], nr);
						} else {
							cell.style.display = "none";
						}
					}
					row.appendChild(cell);
					cell.className = "alarmTable";
					if (hideCell) {
						cell.style.display = "none";
					}
				}
				var cell = mode==0?this.createPolarityCheckBox(ix,nr):document.createElement("td");
				cell.className = "alarmTable";
				cell.style.textAlign = "center";
				cell.style.minWidth = "40px";
				if (hideCell) {
					cell.style.display = "none";
				}
				row.appendChild(cell);
			}
		}
	}
	this.createInputText = function(id,num,mode,nr){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.input = "text";
		el.style.fontWeight = "bold";
		el.id = id+"_"+num+"_"+mode+"_"+nr;
		el.size = 30;
		el.maxLength = 30;
		cell.appendChild(el);
		return cell;
	}
	this.createEnabledCheckBox = function(num,mode,enav,nr){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "enabled_"+num+"_"+mode+"_"+enav+"_"+nr;
		el.name = el.id;
		el.type = "checkbox";
		el.enav = enav;
		cell.appendChild(el);
		return cell;		
	}
	this.createSystemCheckBox = function(num,mode,enav,nr,sysAlarmNr){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "systemAlarm_"+num+"_"+mode+"_"+enav+"_"+nr+"_"+sysAlarmNr;
		el.name = el.id;
		el.type = "checkbox";
		el.enav = enav;
		cell.appendChild(el);
		return cell;		
	}
	this.createPolarityCheckBox = function(num,nr) {
		var cell = document.createElement("td");
		if (num < 8 || num > 11) {
			return cell;
		}
		var el = document.createElement("input");
		var externalAlarmNr = num - 8;
		el.id = "extAlarmPolarity_"+externalAlarmNr+"_"+nr;
		el.name = el.id;
		el.type = "checkbox";
		cell.appendChild(el);
		return cell;
	}
	this.createCheckBox = function(num,mode,nrelay,nr){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "relay_enabled_"+num+"_"+mode+"_"+nrelay+"_"+nr;
		el.name = el.id;
		el.type = "checkbox";			
		cell.appendChild(el);
		return cell;		
	}
	this.createRelayStatusAlarm = function(nr){
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
		if (nr==0 && use7relaysInMaster(version[0])) {
			cell.colSpan = cell.colSpan*2+1;
		}
		var row = document.createElement("tr");
		tb.appendChild(row);		
		for (var num = 0;num<3;num++){
			var row = document.createElement("tr");
			this.createRelayStatusCtrl(row,num,nr);
			if (nr==0 && use7relaysInMaster(version[0])) {
				var cell = document.createElement("td");
				cell.style.minWidth = "80px";
				row.appendChild(cell);
				this.createRelayStatusCtrl(row,num+4,nr);
			}
			tb.appendChild(row);
		}
		return cellb;
	}
	this.createRelayStatusCtrl = function(row, num,nr){
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Relay " +(num+1);
		cell.style.width = "80px";
		for (var j=0;j<2;j++){
			var cell = document.createElement("td");
			row.appendChild(cell);
			var el = document.createElement("input");
			el.type = "radio";
			el.name = "relayStatus_"+num+"_"+nr;
			el.value = j;
			el.className = "contentcell";
			cell.appendChild(el);
			var cell = document.createElement("td");
			cell.innerHTML = j==0?"Closed":"Open";
			row.appendChild(cell);
		}
		return row;
	}
	this.relayStatusCtrlGet = function(num,nr){
		var el = document.getElementsByName("relayStatus_"+num+"_"+nr);
		for (var i=0;i<el.length;i++){
			if(el[i].checked) return el[i].value;
		}
		return true;
	}
	this.relayStatusCtrlSet = function(num,nr,val){
		var el = document.getElementsByName("relayStatus_"+num+"_"+nr);
		el[val?1:0].checked = true;
	}
	this.createRelayAssignPolicy = function() {
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		var cell = document.createElement("td");
		cell.className = "contentcell";
		rowb.appendChild(cell);
		var tbl = document.createElement("table");
		tbl.className = "alarmTable";
		// tbl.setAttribute("border","1");
		tbl.style.marginLeft = tbl.style.marginRight = "auto";
		cell.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var rowb = document.createElement("tr");
		tb.appendChild(rowb);
		var cell = document.createElement("th");
		cell.innerHTML = "RELAY&nbsp;ASSIGN&nbsp;POLICY&nbsp;FOR&nbsp;ALARMS&nbsp;OF&nbsp;REMOTE&nbsp;DEVICES";
		cell.style.paddingLeft = cell.style.paddingRight = "20px";
		rowb.appendChild(cell);
		cell = document.createElement("td");
		cell.style.paddingLeft = cell.style.paddingRight = "20px";
		rowb.appendChild(cell);
		var el = document.createElement("select");
		el.id = "relayAssignPolicy";
		el.name = el.id;
		el.style.width = "440px";
		for (var i = 0; i < relayAssignPolicies.length; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = relayAssignPolicies[i].text;
			opt.value = relayAssignPolicies[i].ix;
		}
		cell.appendChild(el);
		var cell = document.createElement("th");
		cell.innerHTML = "NOTE: Normal AC Power condition on Remotes does not trigger relay on Master";
		rowb.appendChild(cell);
		return tab;
	}
	this.relayAssignPolicySet = function(val) {
		for (var i = 0; i < relayAssignPolicies.length; ++i) {
			if (relayAssignPolicies[i].ix == val) {
				document.getElementById("relayAssignPolicy").selectedIndex = i;
				break;
			}
		}
	}
	this.relayAssignPolicyGet = function() {
		return document.getElementById("relayAssignPolicy").selectedIndex;
	}
	this.createRowPowerBand = function(nr){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		for (var band=0;band<2;band++){
			var cell = document.createElement("th");
			cell.id = "vswrtitle_"+band+"_"+nr;
			cell.className = "cth";
			cell.colSpan = 2;
			if (nr==0) cell.style.display = "none";
			rowb.appendChild(cell);	
			var cell = document.createElement("th");
			if (nr>0) cell.style.display = "none";
			cell.id = "donortitle_"+band+"_"+nr;
			cell.className = "cth";
			rowb.appendChild(cell);	
		}			
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		for (var band=0;band<2;band++){
			var cell = this.createPowerCell(nr,band);
			cell.id = "powerCell_"+band+"_"+nr;
			if (nr==0) cell.style.display = "none";
			rowb.appendChild(cell);		
			var cell = this.createVSWRCell(nr,band);
			cell.id = "vswrCell_"+band+"_"+nr;
			if (nr==0) cell.style.display = "none";
			rowb.appendChild(cell);	
			var cell = this.createDonorAntFailCell(nr,band);
			cell.id = "donorCell_"+band+"_"+nr;
			if (nr>0) cell.style.display = "none";
			rowb.appendChild(cell);	
		}
		var rowb = document.createElement("tr");
		if (nr>0) rowb.style.display = "none";
		tab.appendChild(rowb);
		for (var k=0;k<2;k++){
			var cell = document.createElement("th");
			if (k>0) cell.style.display = "none";
			cell.innerHTML = "ANTENNA&nbsp;DISCONNECTION";
			cell.id = "antDisconnTitle_"+k;
			cell.className = "cth";			
			rowb.appendChild(cell);	
		}
		var rowb = document.createElement("tr");
		if (nr>0) rowb.style.display = "none";
		tab.appendChild(rowb);
		for (var k=0;k<2;k++){	
			var cell = this.createBroadbandLevelIn(nr,k);
			cell.id = "antDisconnCtrl_"+k;
			if (k>0) cell.style.display = "none";
			cell.style.paddingLeft = "100px";
			cell.style.paddingRight = "100px";
			rowb.appendChild(cell);
		}
		return tab;
	}
	this.createPowerCell = function(nr,band){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";
		var tbl = document.createElement("table");
		tbl.align = "center";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		RFsettings.max = 40;
		RFsettings.min = -10;
		RFsettings.high_warn = 33;
		RFsettings.high_alarm = 40;
		var row = createMetRow("rfPowFwd_"+band+"_"+nr, RFsettings, "Power&nbsp;Forward", "dBm");
		tb.appendChild(row);
		var row = createMetRow("rfPowRev_"+band+"_"+nr, RFsettings, "Power&nbsp;Reverse", "dBm");
		tb.appendChild(row);
		var row = this.createVSWRMinPower(nr,band);
		tb.appendChild(row);
		var row = this.warnPowerVSWRMessage(nr,band);
		tb.appendChild(row);
		return cellb;
	}
	this.warnPowerVSWRMessage = function(nr,band){
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.colSpan = 4;
		cell.innerHTML = "TX&nbsp;Power&nbsp;Too&nbsp;Low&nbsp;For VSWR&nbsp;Measurement";
		cell.className = "tabval";
		row.style.height = "30px";
		cell.id = "warnPowerMess_"+band+"_"+nr;
		cell.style.display = "none";
		return row;
	}
	this.createVSWRMinPower = function(nr, band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Minimum&nbsp;TX&nbsp;Power<br>for&nbsp;VSWR&nbsp;Detection";
		cell.style.paddingRight = "10px";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);	
		var el = document.createElement("input");
		el.id = "minPowerVSWR_"+band+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.max = 30;
		el.min = -10;
		el.title = "Min: "+el.min+", Max: "+el.max+" dBm";
		el.onchange = function(ev) {
			var target = this;
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
	this.VSWRMinPowerSet = function(band, nr, val) {
		try {
			var el = document.getElementById("minPowerVSWR_"+band+"_"+nr);
			if (!isNaN(val))
				el.value = val.toFixed(1);
		} catch (err) { }
	}
	this.VSWRMinPowerGet = function(band, nr) {
		try {
			var el = document.getElementById("minPowerVSWR_"+band+"_"+nr);
			return parseFloat(el.value);
		} catch (err) { return -128; }
	}
	this.createAlarmSens = function(nr,band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Alarm&nbsp;Sensitivity";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);		
		var el = document.createElement("input");
		el.id = "alarmSens_"+band+"_"+nr;
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
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "sec";
		cell.colSpan = 2;
		cell.style.textAlign = "right";
		return row;
	}
	this.AlarmSensSet = function(band, nr, val) {
		try {
			var el = document.getElementById("alarmSens_"+band+"_"+nr);
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.AlarmSensGet = function(band, nr) {
		try {
			var el = document.getElementById("alarmSens_"+band+"_"+nr);
			return parseInt(el.value);
		} catch (err) { return -128; }
	}			
	this.createRetLossTh = function(nr,band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Return&nbsp;Loss&nbsp;Threshold";
		cell.style.paddingRight = "10px";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);		
		var el = document.createElement("input");
		el.id = "retLossTh_"+band+"_"+nr;
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
		el.nr = nr;
		el.onchange = function(ev) {
			var target = this;
			var band = target.band;
			var nr = target.nr;
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
	this.RetLossThSet = function(band, nr, val) {
		try {
			var el = document.getElementById("retLossTh_"+band+"_"+nr);
			if (!isNaN(val))
				el.value = val.toFixed(1);
			setMetLowWarn("returnLoss_"+band+"_"+nr,val);
		} catch (err) { }
	}
	this.RetLossThGet = function(band,nr) {
		try {
			var el = document.getElementById("retLossTh_"+band+"_"+nr);
			return parseFloat(el.value);
		} catch (err) { return -128; }
	}		
	this.createVSWRCell = function(nr,band){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";
		var tbl = document.createElement("table");
		tbl.align = "center";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = createMetRow("returnLoss_"+band+"_"+nr, VSWRsettings, "Return&nbsp;Loss", "dB");
		tb.appendChild(row);
		var row = this.createRetLossTh(nr,band);
		tb.appendChild(row);
		var row = this.createAlarmSens(nr,band);
		tb.appendChild(row);		
		return cellb;
	}
	this.createDonorAntFailCell = function(nr,band){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		var tbl = document.createElement("table");
		tbl.align = "center";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		this.createTimeTrigger(tb,band,nr);
		return cellb;
	}
	this.createTimeTrigger = function(tb,band,nr){
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
		cell.style.paddingRight = "30px";
		cell.className = "thdrht";
		for (var j=2;j>=0;j--) row.appendChild( this.createTimeTriggerBox(band,j,nr));
		var cell = document.createElement("th");
		cell.style.width = "40px";
		row.appendChild(cell);		
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.id = "altimer_"+band+"_"+nr;
		cell.className = "thdrht";		
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 4;
		cell.className = "tabval";
		cell.id = "timeElap_" + band+"_"+nr;
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 4;
		cell.className = "tabval";
		cell.style.color = "black";
		cell.id = "alRxPowLow_" + band+"_"+nr;
		
	}
	this.timeElapsedSet = function(band,nr,valH,valL,valLth){
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
		var el = document.getElementById("timeElap_"+band+"_"+nr);
		el.innerHTML = str;
		el.style.color = (valH>valL || (valH==0 && valL==0)) ?"black":"red";
		var txtbold = false;
		if (valH<=valL) txtbold = valL>=valLth;
		el.style.fontWeight = txtbold?"bold":"normal";
		el = document.getElementById("alRxPowLow_"+band+"_"+nr);
		el.innerHTML = (valH>valL || (valH==0 && valL==0))?"Rx&nbsp;Power&nbsp;OK":"Rx&nbsp;Power&nbsp;Low";
		el.style.color = (valH<=valL && valL>=valLth && !(valH==0 && valL==0))?"red":"black";
		el = document.getElementById("altimer_"+band+"_"+nr);
		el.innerHTML = valH>valL?"":"Alarm&nbsp;Timer";
		
	}
	this.timeTriggerSet = function(band,nr,val){
		var times = [0,0,0];
		var res;
		times[2] = Math.floor(val/3600);
		res = ~~(val-3600*times[2]);
		times[1] = Math.floor(res/60);
		times[0] = res % 60;
		for (var k=0;k<3;k++)
			document.getElementById("timeTrigger_"+band+"_"+k+"_"+nr).value = times[k];
	}
	this.timeTriggerGet = function(band, nr){
		var	res = parseInt(document.getElementById("timeTrigger_"+band+"_0"+"_"+nr).value);
		res +=  60*parseInt(document.getElementById("timeTrigger_"+band+"_1"+"_"+nr).value);
		res +=  3600*parseInt(document.getElementById("timeTrigger_"+band+"_2"+"_"+nr).value);
		return res;
	}
	this.createTimeTriggerBox = function(band,hms,nr) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "timeTrigger_"+band+"_"+hms+"_"+nr;
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
	this.createUnitHead = function(title,idt,titleaux,idsubt,nr,minbutton,elToMin) {
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
		cell.innerHTML = titleaux;
		cell.id = idsubt;
		cell.style.width = "100px";
		cell.style.paddingLeft = "30px";	
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.id = idt;
		cell.innerHTML = title;
		cell.className = "tag";
		cell.style.width = "50%";
		cell.style.textAlign = "center";
		var cell = document.createElement("td");		
		row.appendChild(cell);
		cell.className = "nrtitle";
		cell.style.width = "100px";	
		cell.style.paddingRight= "10px";
		if (minbutton){
			cell.style.textAlign = "right";
			cell.appendChild(this.createMinButton(elToMin));
		}
		cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);
		return box;
	}
	function setMinimizedState(id,min){
		var st = (min==1);
		var el = document.getElementById(id.substring(4));
		el.style.display = st?"none":"block";
		el.setAttribute("min",st);
		el = document.getElementById(id);
		el.src = (st?"maximize":"minimize") + ".png";
	}
	this.createMinButton = function(elToMin){
		var img = document.createElement("img");
		img.src = "minimize.png";
		img.id = "min_"+elToMin;
		var minState = localStorage.getItem(serNr[0].sernr +"_"+ img.id);
		if (minState == null) minState = false;
		minButtonStates.push([img.id,minState]);
		img.name = img.id;
		img.onclick = function(ev) {
			var min = (this.src.search("minimize.png")>=0)?1:0;
			setMinimizedState(this.id,min);
			localStorage.setItem(serNr[0].sernr +"_"+ this.id,min);
		}
		return img;
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
		tdNode.className = "thdrht";
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.id = "met_"+id;
		var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
		met.attachTo(tdNode);
		met.valueSet(s.min);
		tdNode = document.createElement("td");
		trNode.appendChild(tdNode);
		tdNode.id = "txt_"+id;
		tdNode.style.minWidth = "50px";
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
		this.colorNormal = "#00a500";
		this.colorWarn = "#f2b200";
		this.colorAlarm = "#e20000";
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

	this.alarmThrshElements =  [
	[
		{
			lbl: "Loss&nbsp;Of&nbsp;Optical&nbsp;Signal&nbsp;Link&nbsp;#1 (dBm)",
			lblaux: "",
			sign: "<",
			id: "los1"
		},
		{
			lbl: "Loss&nbsp;Of&nbsp;Optical&nbsp;Signal&nbsp;Link&nbsp;#2 (dBm)",
			lblaux: "",
			sign: "<",
			id: "los2"
		},
		{
			lbl: "Loss&nbsp;Of&nbsp;Optical&nbsp;Signal&nbsp;Link&nbsp;#3 (dBm)",
			lblaux: "",
			sign: "<",
			id: "los3"
		},
		{
			lbl: "Loss&nbsp;Of&nbsp;Optical&nbsp;Signal&nbsp;Link&nbsp;#4 (dBm)",
			lblaux: "",
			sign: "<",
			id: "los4"
		},
		{
			lbl: "Loss&nbsp;Of&nbsp;Optical&nbsp;Signal&nbsp;Link&nbsp;#5 (dBm)",
			lblaux: "",
			sign: "<",
			id: "los5"
		},
		{
			lbl: "Loss&nbsp;Of&nbsp;Optical&nbsp;Signal&nbsp;Link&nbsp;#6 (dBm)",
			lblaux: "",
			sign: "<",
			id: "los6"
		},
		{
			lbl: "Loss&nbsp;Of&nbsp;Optical&nbsp;Signal&nbsp;Link&nbsp;#7 (dBm)",
			lblaux: "",
			sign: "<",
			id: "los7"
		},
		{
			lbl: "Loss&nbsp;Of&nbsp;Optical&nbsp;Signal&nbsp;Link&nbsp;#8 (dBm)",
			lblaux: "",
			sign: "<",
			id: "los8"
		},
		{
			lbl: "Over&nbsp;Temperature (&deg;C)",
			lblaux: "",
			sign: ">",
			id: "temp"
		}
	],
	[
		{
			lbl: "Loss&nbsp;Of&nbsp;Optical&nbsp;Signal&nbsp;Link&nbsp;#1 (dBm)",
			lblaux: "",
			sign: "<",
			id: "los1"
		},
		{
			lbl: "Loss&nbsp;Of&nbsp;Optical&nbsp;Signal&nbsp;Link&nbsp;#2 (dBm)",
			lblaux: "",
			sign: "<",
			id: "los2"
		},
		{
			lbl: "Over&nbsp;Temperature (&deg;C)",
			lblaux: "",
			sign: ">",
			id: "temp"
		},
		{
			lbl: "Downlink&nbsp;Output&nbsp;Power&nbsp;Alarm&nbsp;(Band 1) (dBm)",
			lblaux: "Alarm occurs after 2 minutes below the threshold",
			sign: "<",
			id: "dlpwr_1"
		},
		{
			lbl: "Downlink&nbsp;Output&nbsp;Power&nbsp;Alarm&nbsp;(Band 2) (dBm)",
			lblaux: "Alarm occurs after 2 minutes below the threshold",
			sign: "<",
			id: "dlpwr_2"
		}
	]];
	this.AlarmThrshElementsId = function(k, i, nr) {
		var m = (nr==0?0:1);
		return (this.alarmThrshElements[m][k].id+"_"+i+"_"+nr);
	}
	this.createAlarmThresholds = function(nr) {
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
		var row = document.createElement("tr");
		tab.appendChild(row);
		// labels
		var cell = document.createElement("td");
		cell.className = "contentcell";
		row.appendChild(cell);
		var tbl = document.createElement("table");
		tbl.align = "center";
		cell.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = "Threshold";
		cell.style.minWidth = "100px";
		row.appendChild(cell);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = "Hysteresis";
		cell.style.minWidth = "100px";
		row.appendChild(cell);
		// data
		var m = (nr==0?0:1);
		for (var k = 0; k < this.alarmThrshElements[m].length; ++k) {
			var row = document.createElement("tr");
			var cell = document.createElement("th");
			if (nr>0 && (k==3 || k==4)) {
				var band = k - 3;
				row.style.display = "none";
				row.id = "althresrow_"+band+"_"+nr;
				cell.id = "althrestitle_"+band+"_"+nr;
			}
			cell.innerHTML = this.alarmThrshElements[m][k].lbl;
			cell.paddintRight = "20px";
			cell.className = "thdrht";
			row.appendChild(cell);
			cell = document.createElement("th");
			cell.innerHTML = this.alarmThrshElements[m][k].sign;
			row.appendChild(cell);
			for (var i = 0; i < 2; ++i) {
				var cell = document.createElement("td");
				row.appendChild(cell);
				var el = document.createElement("input");
				el.type = "text";
				el.id = el.name = this.AlarmThrshElementsId(k, i, nr);
				el.isHys = (i == 1);
				if (el.isHys) {
					el.min = NFPAcfg[nr].alrmThrshHystLimits.min;
					el.max = NFPAcfg[nr].alrmThrshHystLimits.max;
				} else {
					el.min = NFPAcfg[nr].alarmThrshLimits[m][k].min;
					el.max = NFPAcfg[nr].alarmThrshLimits[m][k].max;
				}
				el.onkeypress = function(ev) {
					if (this.isHys) {
						return isKeyDecimalPositive(ev);
					}
					return isKeySignedNumber(ev);
				}
				el.onchange = function(ev) {
					var v;
					if (this.isHys) {
						v = Math.round(parseFloat(this.value)*2)/2;
					} else {
						v = parseInt(this.value);
					}
					if (v < this.min) {
						v = Number(this.min);
					} else if (v > this.max) {
						v = Number(this.max);
					}
					if (this.isHys) {
						this.value = v.toFixed(1);
					} else {
						this.value = v;
					}
				}
				if (el.isHys) {
					el.title = "Min: 0, Max: 10, Resolution: 0.5"
				} else {
					el.title = "Min: "+NFPAcfg[nr].alarmThrshLimits[m][k].min+
						", Max: "+NFPAcfg[nr].alarmThrshLimits[m][k].max+", Resolution: 1";
				}
				el.size = 5;
				el.className = "centered";
				el.style.textAlign = "right";
				cell.appendChild(el);
				if (!el.isHys) {
					cell = document.createElement("th");
					cell.innerHTML = "&#177;";
					row.appendChild(cell);
				}
			}
			if (this.alarmThrshElements[m][k].lblaux.length>0){
				cell = document.createElement("th");
				cell.innerHTML = this.alarmThrshElements[m][k].lblaux;
				row.appendChild(cell);
			}
			tb.appendChild(row);
		}
		return tab;
	}
	this.createBatteryBackupParameters = function(nr) {
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
			var rowb = document.createElement("tr");
			tab.appendChild(rowb);
			var cell = document.createElement("th");
			cell.innerHTML = "PARAMETERS";
			cell.className = "cth";
			rowb.appendChild(cell);	
			var cell = document.createElement("th");
			cell.innerHTML = "BUZZER";
			cell.className = "cth";
			rowb.appendChild(cell);		

			var rowb = document.createElement("tr");
			tab.appendChild(rowb);
			var cell = this.createBbuMeasurements(nr);
			rowb.appendChild(cell);		
			var cell = this.createBbuBuzzerParams(nr);
			rowb.appendChild(cell);	
		return tab;
	}
	this.bbuMeasurements = [
		{id:"ChargerTemperature", text:"Charger Temperature (ºC)"},
		{id:"IndividualBatteryVoltage1", text:"Battery Voltage 1 (V)"},
		{id:"IndividualBatteryVoltage3", text:"Battery Voltage 3 (V)"},
		{id:"SystemVoltage", text:"System Voltage (V)"},
		{id:"BatteryBankVoltage", text:"Power Supply Voltage (V)"},
		{id:"BatteryTemperature", text:"Battery Temperature (ºC)"},
		{id:"IndividualBatteryVoltage2", text:"Battery Voltage 2 (V)"},
		{id:"IndividualBatteryVoltage4", text:"Battery Voltage 4 (V)"},
		{id:"BatteryCurrent", text:"Battery Current (A)"},
		{id:"MainCurrent", text:"Power Supply Current (A)"}
	];
	this.createBbuMeasurements = function(nr){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";
		var tbl = document.createElement("table");
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		for (var n = 0; n < this.bbuMeasurements.length; n++) {
			if (n%5 == 0) {
				var row = document.createElement("tr");
				tb.appendChild(row);
			}
			var cell = document.createElement("th");
			cell.innerHTML = this.bbuMeasurements[n].text;
			cell.className = "thdrht";
			cell.style.textAlign = "left";
			row.appendChild(cell);
			var param = document.createElement("input");
			param.input = "text";
			param.disabled = true;
			param.id = this.bbuMeasurements[n].id+"_"+nr;
			param.style.textAlign = "right";
			param.style.width = "40px";
			param.className = "tabval";
			var cell2 = document.createElement("td");
			cell2.style.width = "60px";
			cell2.appendChild(param);
			row.appendChild(cell2);
			if (self.config[nr].bbu_type == 2) {		// High Power BBU
				cell.style.whiteSpace = "normal";
				if (this.bbuMeasurements[n].id == "BatteryBankVoltage" || this.bbuMeasurements[n].id == "BatteryCurrent") {	// power supply voltage/current
					cell.style.display = "none";
					cell2.style.display = "none";
				}
			} else {
				if (this.bbuMeasurements[n].id == "IndividualBatteryVoltage3" || this.bbuMeasurements[n].id == "IndividualBatteryVoltage4") {
					cell.style.display = "none";
					cell2.style.display = "none";
				}
			}

		}
		return cellb;
	}
	this.createBbuBuzzerParams = function(nr){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr")
		tb.appendChild(row);
		// buzzer status
		var cell = document.createElement("th");
		cell.innerHTML = "Buzzer&nbsp;Status";
		cell.className = "thdrht";
		cell.style.textAlign = "left";
		cell.style.width = "90px";
		row.appendChild(cell);
		var param = document.createElement("input");
		param.input = "text";
		param.disabled = true;
		param.id = "bbuBuzzerStatus"+"_"+nr;
		param.style.textAlign = "right";
		param.style.width = "60px";
		param.className = "tabval";
		param.style.textAlign = "center";
		// param.style.fontWeight = "bold";
		// param.style.fontSize = "11px";
		cell = document.createElement("td");
		cell.colSpan = 3;
		cell.style.textAlign = "center";
		// cell.style.width = "60px";
		cell.appendChild(param);
		row.appendChild(cell);
		// buzzer timers
		this.createBuzzerTimers(tb,nr);
		return cellb;
	}
	this.createBuzzerTimers = function(tb,nr){
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
		var cell = document.createElement("th");
		cell.innerHTML = "Remaining&nbsp;Time";
		row.appendChild(cell);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Mute&nbsp;Time";
		cell.className = "thdrht";
		for (var j=2;j>=0;j--) row.appendChild( this.createBuzzerTimer(j,nr));
		var cell = document.createElement("td");
		cell.style.paddingLeft = "2px";
		cell.style.paddingRight = "2px";
		cell.className = "tabval";
		cell.style.width = "85px";
		cell.style.textAlign = "right";
		cell.id = "BuzzerRemainingTimerId"+"_"+nr;
		row.appendChild(cell);
	}
	this.createBuzzerTimer = function(hms,nr) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "buzzerMuteTimerId_"+hms+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "32px";
		el.max = hms==2?24:59;
		el.min = 0;
		el.value = hms==2?24:0;
		if (hms==0)
			el.title = "Min: 0sec, Max: 59sec";
		else if (hms==1)
			el.title = "Min: 0min, Max: 59min";
		else{
			el.title = "Min: 0hours, Max: 24hours"
		}
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
	this.bbuBuzzerMuteTimeSet = function(val,nr){
		var times = [0,0,0];
		var res;
		times[2] = Math.floor(val/3600);
		res = ~~(val-3600*times[2]);
		times[1] = Math.floor(res/60);
		times[0] = res % 60;
		for (var k=0;k<3;k++){
			var el = document.getElementById("buzzerMuteTimerId_"+k+"_"+nr);
			el.value = times[k];
		}
	}
	this.buzzerMuteTimeGet = function(nr){
		var	res = parseInt(document.getElementById("buzzerMuteTimerId_0"+"_"+nr).value);
		res +=  60*parseInt(document.getElementById("buzzerMuteTimerId_1"+"_"+nr).value);
		res +=  3600*parseInt(document.getElementById("buzzerMuteTimerId_2"+"_"+nr).value);
		return res;
	}
	this.bbuBuzzerRemainingTimeSet = function(val,bbuCommErr,nr){
		var times = [0,0,0];
		var res;
		if (bbuCommErr) {
			document.getElementById("BuzzerRemainingTimerId"+"_"+nr).style.textAlign = "center";
			document.getElementById("BuzzerRemainingTimerId"+"_"+nr).innerHTML = "---";
			return;
		}
		times[2] = Math.floor(val/3600);
		res = ~~(val-3600*times[2]);
		times[1] = Math.floor(res/60);
		times[0] = res % 60;
		var str = "";
		str += times[2] + "h&nbsp;";
		str += ("0"+times[1]).substr(-2,2) + "m&nbsp;";
		str += ("0"+times[0]).substr(-2,2) + "s";
		document.getElementById("BuzzerRemainingTimerId"+"_"+nr).style.textAlign = "center";
		document.getElementById("BuzzerRemainingTimerId"+"_"+nr).innerHTML = str;
	}
	this.bbuBuzzerStatusSet = function(buzzerStatus, bbuCommErr,nr) {
		var str = bbuCommErr? "---" : (buzzerStatus? "ON" : "OFF");
		document.getElementById("bbuBuzzerStatus"+"_"+nr).value = str;
	}
}
function computeTimeoutReqMs(isStatus) {
	if (window.parent.navi.isEthernetMode) {
		if (typeof(isStatus) !== "undefined" && isStatus) {
			return 1000;
		}
		return 4000;
	} else {
		return 1000;
	}
}
