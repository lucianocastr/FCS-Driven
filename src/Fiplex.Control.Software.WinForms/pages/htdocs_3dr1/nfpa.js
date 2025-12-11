var gui;
var NFPAStr;
var NFPAcfg;
var NFPAstat;
var tmrId;
var tmrIdStat;
var countCheck;
var factory;
var RFsettings = {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 45 };
var VSWRsettings = {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 25 };
var BBLevelInsettings = {min:  -80, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 };
var config;
var version;
var reloadIcon = false;

function onloadInit() {
	factory = new Factory();
	var frm = window.parent.navi.factoryFrame;
	if (frm) {
		factory.parse(frm);
	} else {
		//reloadData();
		return;
	}	
	config = new Config();
	if ((typeof(window.parent.navi.confFrame)!=='undefined') && (window.parent.navi.confFrame!==null)) {
		config.parse(window.parent.navi.confFrame);
	} else {
		config.parse(config.retrieveFrameStr());
	}
	version = new Version();
	version.parse(window.parent.navi.versionFrame);
	gui = new GUI_NFPA();
	NFPAcfg = new NFPAconf();
	NFPAstat = new NFPAstatus();
	showResultIcon(ERR_NONE);
	NFPAReq();
	cursorWait();
	showResultIcon(ERR_PENDING);
}
function reloadData(){
	try {
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
	} catch(err) {}
	cursorWait();
	showResultIcon(ERR_PENDING);
	globalConfigReq();
}
function NFPAReq() {
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

function load_NFPA() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					NFPAcfg.parse(serverResponse);
					gui.createForm();
					gui.show(NFPAcfg);
					NFPAStr = serverResponse;
					window.top.submitLocked = false;
					xhrOnEnd();
					refreshEnables();
					reloadIcon = false;
					load_status();
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
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState ===4 && this.status === 200) {
				NFPAstat.parse(this.responseText);
				gui.showStatus(NFPAstat);
				var timeoutMs = isFileOpBusy() ? 10000 : 1000;
				tmrIdStat = setTimeout(function() { load_status(); }, timeoutMs);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			tmrIdStat = setTimeout(function() { load_status(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat)
				clearTimeout(tmrIdStat);
			tmrIdStat = setTimeout(function() { load_status(); }, 1000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_nfpa.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function submitform(setDefaultRelay) {
	var doSetDefaultRelay = false;
	if (typeof(setDefaultRelay) !== "undefined") {
		doSetDefaultRelay = setDefaultRelay || false;
	}
	if ((typeof window.top.submitLocked == "undefined") || !window.top.submitLocked) {
		window.top.submitLocked = true;
	} else if (window.top.submitLocked) {
		return;
	}
	var NFPAcfgToSend = new NFPAconf();
	NFPAcfgToSend.parse(NFPAStr);
	gui.read(NFPAcfgToSend);
	if (doSetDefaultRelay) NFPAcfgToSend.setDefaultRelayAssign(config.bbu_serial_mode);
	if (NFPAcfgToSend.buzzerMuteTime > 24*3600) {
		NFPAcfgToSend.buzzerMuteTime = 24*3600;
		gui.bbuBuzzerMuteTimeSet(NFPAcfgToSend.buzzerMuteTime);
	}
	var frm = NFPAcfgToSend.getFrm();
	if (frm==NFPAStr) {
		window.top.submitLocked = false;
		return;
	}
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
		xhr.open("POST", "/nfpa.zhtml", true);
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
				gui.show(NFPAcfg);
				window.top.submitLocked = false;
				cursorClear();
				reloadIcon = false;
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
	var srarr = str.split('\t');
	if (srarr.length < 7) {
		return;
	}
	var srConf = srarr[0];
	var srFact = srarr[1];
	var srTag = srarr[4];
	var srVersion = srarr[5];
	var srNFPA = srarr[6]; 
		
	factory.parse(srFact);
	NFPAcfg.parse(srNFPA);
	version.parse(srVersion);
	config.parse(srConf);
	
	NFPAStr = srNFPA;
}

function computeTimeoutReqMs() {
	if (window.parent.navi.isEthernetMode) {
		return 1000;
	} else {
		return 100;
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
function refreshCtrlEnable(num,mode,val){
	try{
		document.getElementById("enabled_"+num+"_"+mode+"_0").disabled = !val;
		//document.getElementById("enabled_"+num+"_"+mode+"_0").style.backgroundColor = val?"white":"#cccccc"; //Se cambió a checkbox
		/*for (var j=0;j<4;j++){
			document.getElementById("relay_enabled_"+num+"_"+mode+"_"+j).disabled = !val;
			document.getElementById("relay_enabled_"+num+"_"+mode+"_"+j).style.backgroundColor = val?"white":"#cccccc";
		}
		document.getElementById("AlName_"+num+"_"+mode).style.backgroundColor = val?"white":"#cccccc";
		if ((mode==0 && num<6) || (mode==1 && num<6)){
			document.getElementById("AlName_"+num+"_"+mode).disabled = true;
		}else{
			document.getElementById("AlName_"+num+"_"+mode).disabled = !val;
		}*/
		//todos los textos blancos y disabled
		var isExtGlobalAlarm = (mode == 0 && num >=8 && num <= 11);
		var isAnunciatorAlarm = (mode == 2 && num >=12 && num <= 15);
		var enableAlarmName = isExtGlobalAlarm || isAnunciatorAlarm;
		document.getElementById("AlName_"+num+"_"+mode).style.backgroundColor = (enableAlarmName ? "white" : "#DDDDDD");
		document.getElementById("AlName_"+num+"_"+mode).disabled = !enableAlarmName;
	} catch (err) {alert("refreshCtrlEnable")}
}
function refreshEnables(){
	/*for (var mode=0;mode<2;mode++){
		for (var num=0;num<(mode==0?16:8);num++){
			var en = document.getElementById("enabled_"+num+"_"+mode+"_1").checked;
			refreshCtrlEnable(num,mode,en);
		}
	}*/
	//Se reutiliza refreshEnables para forzar disabled Antenna isolation y Osc. Detection
	for (var mode=0;mode<2;mode++){
		for (var num=0;num<(mode==0?16:8);num++){
			refreshCtrlEnable(num,mode, !(mode==0 && (num==3)));
			if ( (mode==1 && (num==1||num==5))
			    || (mode==0 && (num>=12 && num<=14)))
			{
				//checkbox system alarm deshabilitado en Overload DL ni Rx Power Low and general system alarms
				for (var i = 0; i < NrOfGralSystemAlarms; i++) {
					try {
						var el = document.getElementById("systemAlarm_"+num+"_"+mode+"_0"+"_"+i);
						el.checked = false;
						el.disabled = true;
					}catch(e){}
				}
			}
		}
	}

	for (var num=0;num<18;num++){
		var mode = 2;
		refreshCtrlEnable(num,mode, true);
	}
	for (var n = 0; n < gui.bbuMeasurements.length; n++) {
		document.getElementById(gui.bbuMeasurements[n].id).style.backgroundColor = "#DDDDDD";
		document.getElementById(gui.bbuMeasurements[n].id).disabled = true;
	}
	document.getElementById("bbuBuzzerStatus").style.backgroundColor = "#DDDDDD";
	document.getElementById("bbuBuzzerStatus").disabled = true;
	if (config.bbu_type == 2) {
		/* disable battery bank alarm (k=10) if H.P. bbu */
		var k=10;
		refreshCtrlEnable(k, 2, false);
		for (var j=0;j<config.NR_OF_RELAYS_MAX;j++) {
			var el = document.getElementById("relay_enabled_"+k+"_2_"+j);
			el.checked = false;
			el.disabled = true;
		}
		for (var i = 0; i < NrOfGralSystemAlarms; i++) {
			var el = document.getElementById("systemAlarm_"+k+"_2_0"+"_"+i);
			el.checked = false;
			el.disabled = true;
		}
	}
}

function GUI_NFPA() {
	this.isBbuConnected = false;
	this.bbuSerialMode = isBbuSerialMode(config);
	this.nrOfRelaysSupported = getNrOfRelaysSupported(config);
	this.read = function(nfpa){
		for (var band=0;band<2;band++){
			nfpa.retLossTh[band] = this.RetLossThGet(band);
			nfpa.minPowerVSWR[band] = this.VSWRMinPowerGet(band);
			nfpa.alarmNumSens[band] = this.AlarmSensGet(band);
			nfpa.timeTxLowPowLow[band] = this.timeTriggerGet(band);
		}
		for (var k=0;k<3;k++)
			nfpa.relayLogicConfigNormal[k] = this.relayStatusCtrlGet(k)==1;
		
		for (var k=8;k<12;k++)
			nfpa.alarmNames[0][k] = document.getElementById("AlName_"+k+"_0").value;
		
		for (var k=0;k<16;k++){
			nfpa.globalAlarmsEnabled[k] = document.getElementById("enabled_"+k+"_0_0").checked; //Se cambió a checkbox
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				nfpa.generalSystemAlarm[i][0][k] = document.getElementById("systemAlarm_"+k+"_0_0"+"_"+i).checked;
			}
			for (var j=0;j<config.NR_OF_RELAYS_MAX;j++) {
				nfpa.relayAssignGlobalAlarm[k][j] = document.getElementById("relay_enabled_"+k+"_0_"+j).checked;
			}
			if ( k >= 8 && k <= 11 ) {
				var externalAlarmNr = k - 8;
				nfpa.externalAlarmPolarity[externalAlarmNr] = document.getElementById("extAlarmPolarity_"+externalAlarmNr).checked;
			}
		}
		for (var k=0;k<8;k++){
			// se usa el primer byte de alarm enable
			nfpa.bandAlarmsEnabled[0][k] = document.getElementById("enabled_"+k+"_1_0").checked; //Se cambió a checkbox
			for (var j=0;j<config.NR_OF_RELAYS_MAX;j++)
				nfpa.relayAssignBandAlarm[0][k][j] = document.getElementById("relay_enabled_"+k+"_1_"+j).checked;
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				nfpa.generalSystemAlarm[i][1][k] = document.getElementById("systemAlarm_"+k+"_1_0"+"_"+i).checked;
			}
		}
		/* antennaDisconnectionThresold solamente banda #0 */
		nfpa.antennaDisconnectionThreshold[0] = this.bbLevelInThGet();
		for (var k = 0; k < this.alarmThrshElements.length; k++) {
			var el = document.getElementById(this.AlarmThrshElementsId(k, 0));
			nfpa.alarmThrshData[k].valueThr = parseInt(el.value);
			var el = document.getElementById(this.AlarmThrshElementsId(k, 1));
			nfpa.alarmThrshData[k].hysteresis = parseFloat(el.value);
		}
		if (factory.limitTo32CH){
			// disable general system alarm in miniDAS
			nfpa.globalAlarmsEnabled[12] = false;
			// disable DL output power alarm in miniDAS
			nfpa.bandAlarmsEnabled[0][7] = false;
		}
		for (var k=0;k<16;k++){
			nfpa.bbuAlarmsEnabled[k] = document.getElementById("enabled_"+k+"_2_0").checked;
			if (k<12) {
				nfpa.bbuAlarmsEnabled[k] = document.getElementById("enabled_"+k+"_2_0").checked;
				for (var j=0;j<config.NR_OF_RELAYS_MAX;j++) nfpa.relayAssignBbuAlarm[k][j] = document.getElementById("relay_enabled_"+k+"_2_"+j).checked;
			} else if (k>=12) {	// common row for annunciators
				// annunciators relay assign and enable is the same for the four of them and set in row with k==11
				nfpa.bbuAlarmsEnabled[k] = true; //always true
				for (var j=0;j<config.NR_OF_RELAYS_MAX;j++) nfpa.relayAssignBbuAlarm[k][j] = document.getElementById("relay_enabled_12_2_"+j).checked;
				// annunciators installed in annunciator's enable checkboxes
				nfpa.bbuAlarmsInstalled[k] = document.getElementById("enabled_"+k+"_2_0").checked;
			}
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				nfpa.generalSystemAlarm[i][2][k] = document.getElementById("systemAlarm_"+k+"_2_0"+"_"+i).checked;
			}
		}
		for (var k=12;k<16;k++) {
			nfpa.alarmNamesBbu[k] = document.getElementById("AlName_"+k+"_2").value;
		}
		nfpa.buzzerMuteTime = this.buzzerMuteTimeGet();
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
		setMetValue("bbLevelIn", nfpa.bbLevel[0]);
		var bbuCommErr = nfpa.bbuAlarmResult[4];
		document.getElementById("ChargerTemperature").value = bbuCommErr?"---": nfpa.bbuChargerTemperature;
		document.getElementById("BatteryTemperature").value = bbuCommErr?"---": nfpa.bbuBatteryTemperature;
		document.getElementById("IndividualBatteryVoltage1").value = bbuCommErr?"---": (nfpa.bbuBatteryStatusVoltage[0]/1000).toFixed(2);
		document.getElementById("IndividualBatteryVoltage2").value = bbuCommErr?"---": (nfpa.bbuBatteryStatusVoltage[1]/1000).toFixed(2);
		document.getElementById("IndividualBatteryVoltage3").value = bbuCommErr?"---": (nfpa.bbuBatteryStatusVoltage[2]/1000).toFixed(2);
		document.getElementById("IndividualBatteryVoltage4").value = bbuCommErr?"---": (nfpa.bbuBatteryStatusVoltage[3]/1000).toFixed(2);
		document.getElementById("SystemVoltage").value = bbuCommErr?"---": (nfpa.bbuSystemVoltage/1000).toFixed(2);
		document.getElementById("BatteryBankVoltage").value = bbuCommErr?"---": (nfpa.bbuBatteryVoltageBank/1000).toFixed(2);
		document.getElementById("MainCurrent").value = bbuCommErr?"---": (nfpa.bbuMainCurrent/1000).toFixed(2);
		document.getElementById("BatteryCurrent").value = bbuCommErr?"---": (nfpa.bbuBatteryCurrent/1000).toFixed(2);
		this.bbuBuzzerStatusSet(nfpa.bbuBuzzerStatus, bbuCommErr);
		this.bbuBuzzerRemainingTimeSet(nfpa.bbuBuzzerRemainingTime, bbuCommErr);
		if (config.bbu_serial_mode) {
			if ( nfpa.isBbuDisconnectionAlarm() ) {
				this.isBbuConnected = false;
			} else {
				if ( !this.isBbuConnected ) {
					this.updateRelayShow(nfpa);
				}
				this.isBbuConnected = true;
			}
		}
	}
	this.updateRelayShow = function(nfpaStat) {
		var bbuSerialMode = isBbuSerialMode(config);
		var nrOfRelaysSupported = getNrOfRelaysSupported(config);
		var statusBbuSerialMode = nfpaStat.getBbuSerialMode();
		var statusNrOfRelaysSupported = nfpaStat.getNrOfRelaysSupported();
		var reloadRequired = ((bbuSerialMode != statusBbuSerialMode) || (nrOfRelaysSupported != statusNrOfRelaysSupported) );
		if (reloadRequired) {
			if (!reloadIcon){
				showResultIcon(ERR_RELOAD);
				reloadIcon = true;
			}
		}
		return reloadRequired;
	}
	this.show = function(nfpa){
		for (var band=0;band<2;band++){
			var show = factory.chBandEnabled[band] || factory.adjBandEnabled[band];
			var el = document.getElementById("vswrtitle_"+band);
			el.innerHTML = "VSWR METER " + factory.bandNames[band];
			if (!show) el.style.display = "none";
			var el = document.getElementById("donortitle_"+band);
			el.innerHTML = "DONOR ANTENNA FAILURE ADJUSTMENT " + factory.bandNames[band];
			if (!show) el.style.display = "none";
			if (!show){
				document.getElementById("powerCell_"+band).style.display = "none";
				document.getElementById("vswrCell_"+band).style.display = "none";
				document.getElementById("donorCell_"+band).style.display = "none";
			}
			this.RetLossThSet(band,nfpa.retLossTh[band]);
			this.VSWRMinPowerSet(band,nfpa.minPowerVSWR[band]);
			this.AlarmSensSet(band,nfpa.alarmNumSens[band]);
			this.timeTriggerSet(band,nfpa.timeTxLowPowLow[band]);
		}
		for (var k=0;k<3;k++)
			this.relayStatusCtrlSet(k,nfpa.relayLogicConfigNormal[k]);
		
		for (var k=0;k<16;k++){
			document.getElementById("AlName_"+k+"_0").value = nfpa.alarmNames[0][k];
			document.getElementById("enabled_"+k+"_0_0").checked = nfpa.globalAlarmsEnabled[k]; //Se cambió a checkbox
			//document.getElementById("enabled_"+k+"_0_1").checked = nfpa.globalAlarmsInstalled[k];//Se quita available
			for (var j=0;j<config.NR_OF_RELAYS_MAX;j++) document.getElementById("relay_enabled_"+k+"_0_"+j).checked = nfpa.relayAssignGlobalAlarm[k][j];
			if ( k >= 8 && k <= 11 ) {
				var externalAlarmNr = k - 8;
				document.getElementById("extAlarmPolarity_"+externalAlarmNr).checked = nfpa.externalAlarmPolarity[externalAlarmNr];
			}
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				document.getElementById("systemAlarm_"+k+"_0_0"+"_"+i).checked = nfpa.generalSystemAlarm[i][0][k];
			}
		}
		for (var k=0;k<8;k++){
			if (k==5)
				document.getElementById("AlName_"+k+"_1").value = "Rx Power Low / Donor Antenna";
			else
				document.getElementById("AlName_"+k+"_1").value = nfpa.alarmNames[1][k];
			document.getElementById("enabled_"+k+"_1_0").checked = nfpa.bandAlarmsEnabled[0][k]; //Se cambió a checkbox
			//document.getElementById("enabled_"+k+"_1_1").checked = nfpa.bandAlarmsInstalled[k];//Se quita available
			for (var j=0;j<config.NR_OF_RELAYS_MAX;j++) document.getElementById("relay_enabled_"+k+"_1_"+j).checked = nfpa.relayAssignBandAlarm[0][k][j];
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				document.getElementById("systemAlarm_"+k+"_1_0"+"_"+i).checked = nfpa.generalSystemAlarm[i][1][k];
			}
		}
		/* antennaDisconnectionThresold solamente banda #0 */
		this.bbLevelInThSet(nfpa.antennaDisconnectionThreshold[0]);
		for (var k = 0; k < this.alarmThrshElements.length; k++) {
			var el = document.getElementById(this.AlarmThrshElementsId(k, 0));
			el.value = nfpa.alarmThrshData[k].valueThr;
			var el = document.getElementById(this.AlarmThrshElementsId(k, 1));
			el.value = nfpa.alarmThrshData[k].hysteresis.toFixed(1);
		}
		for (var k=0;k<16;k++){
			document.getElementById("AlName_"+k+"_2").value = nfpa.alarmNamesBbu[k];
			if (k<12) {
				document.getElementById("enabled_"+k+"_2_0").checked = nfpa.bbuAlarmsEnabled[k];
			} else  {
				// annunciators installed in annunciator's enable checkboxes
				document.getElementById("enabled_"+k+"_2_0").checked = nfpa.bbuAlarmsInstalled[k];
			}
			for (var j=0;j<config.NR_OF_RELAYS_MAX;j++) document.getElementById("relay_enabled_"+k+"_2_"+j).checked = nfpa.relayAssignBbuAlarm[k][j];				
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				document.getElementById("systemAlarm_"+k+"_2_0"+"_"+i).checked = nfpa.generalSystemAlarm[i][2][k];
			}
		}
		document.getElementById("AlName_16_2").value = "Annunciators";
		document.getElementById("enabled_16_2_0").checked = nfpa.bbuAlarmsEnabled[12];
		this.bbuBuzzerMuteTimeSet(nfpa.buzzerMuteTime);
	}
	this.createForm = function() {
		var Texts = TextEn;
		var cont = document.getElementById("page");
		var id = "unitDiv";
		var el =  document.getElementById(id);
		if (el) remove_element(el);
		var unitDiv = document.createElement("div");
		unitDiv.id = id;
		unitDiv.style.width = "1450px";
		unitDiv.className = "unitbox";
		cont.appendChild(unitDiv);
		var headDiv = this.createUnitHead("POWER&nbsp;MEASUREMENTS");
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDivAlarm";
		var tab = this.createRowPowerBand();
		contentDiv.appendChild(tab);
		var headDiv = this.createUnitHead("BATTERY&nbsp;BACKUP&nbsp;PARAMETERS");
		headDiv.id = "BatteryBackupParametersHeader";
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "BatteryBackupParametersContentBox";
		var tab = this.createBatteryBackupParameters();
		contentDiv.appendChild(tab);
		if (!this.bbuSerialMode) {
			headDiv.style.display = "none";
			contentDiv.style.display = "none";
		}
		var headDiv = this.createUnitHead("CONFIGURATION&nbsp;ALARMS");
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = this.createRelayConfig();
		contentDiv.appendChild(tab);
		var headDiv = this.createUnitHead("ALARM&nbsp;THRESHOLDS");
		headDiv.style.display = factory.limitTo32CH ? "none":"block";
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		contentDiv.style.display = factory.limitTo32CH ? "none":"block";
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = this.createAlarmThresholds();
		contentDiv.appendChild(tab);
	}
	this.createBroadbandLevelIn = function() {
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";	
		var tbl = document.createElement("table");
		tbl.style.width = "95%"
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = createMetRow("bbLevelIn", BBLevelInsettings, "Broadband&nbsp;Input&nbsp;Level", "dBm");
		tb.appendChild(row);
		var row = this.createBBLevelInTh();
		tb.appendChild(row);
		return cellb;
	}
	this.createBBLevelInTh = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Broadband&nbsp;Input&nbsp;Threshold";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);		
		var el = document.createElement("input");
		el.id = "bbLevelInTh";
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
	this.bbLevelInThSet = function(val) {
		try {
			var el = document.getElementById("bbLevelInTh");
			if (!isNaN(val)) {
				el.value = val.toFixed(0);
			}
		} catch (err) { }
	}
	this.bbLevelInThGet = function() {
		try {
			var el = document.getElementById("bbLevelInTh");
			return parseFloat(el.value);
		} catch (err) { return -128; }
	}
	this.createRelayConfig = function(){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		var cell = this.createRelayStatusAlarm();
		if (this.bbuSerialMode) cell.style.display = "none";
		rowb.appendChild(cell);
		for (var mode = 0; mode < 3; mode++){
			var rowb = document.createElement("tr");
			if (!this.bbuSerialMode && mode==2) rowb.style.display = "none";
			tab.appendChild(rowb);
			var cell = this.createGeneralRelayConfig(mode);
			cell.className = "contentcell";		
			rowb.appendChild(cell);
		}
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		var cell = this.createRestoreRelayButton();
		rowb.appendChild(cell);
		return tab;
	}
	this.createRestoreRelayButton = function() {
		var cell = document.createElement("td");
		cell.className = "contentcell";	
		cell.style.textAlign = "center";
		var el = document.createElement("input");
		el.id = "restoreRelay";
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.value = "Restore Relay Assignment To Default";
		el.onclick = function(ev) {
			var alertMsg = "NOTICE:\nRelay assignment settings will be configured to default values.\nPlease confirm.";
			if (confirm(alertMsg)) {
				submitform(true);
			}
		}
		cell.appendChild(el);
		return cell;
	}
	this.createGeneralRelayConfig = function(mode){
		var cellb = document.createElement("td");
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
		var modeName = (mode==0?"GENERAL":(mode==1?"BAND-SPECIFIC":"BBU"))
		cell.innerHTML = modeName+"&nbsp;RELAY&nbsp;SETTINGS";
		var nrOfGralSystemAlarmsSupported = getNrOfGralSystemAlarmsSupported(config);
		cell.colSpan = 2*(4+nrOfGralSystemAlarmsSupported+getNrOfRelaysSupported(config));
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
				if (factory.limitTo32CH) {
					cell.style.display = "none"
				}
				row.appendChild(cell);
			}
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			cell.innerHTML = "Relay";
			cell.colSpan = getNrOfRelaysSupported(config);
			row.appendChild(cell);
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			if (mode==0) cell.innerHTML = "Polarity"+"<br/>"+"High";
			cell.rowSpan = 2;
			row.appendChild(cell);

		}
		var row = document.createElement("tr");
		tb.appendChild(row);		
		for (var k=0;k<2;k++){
			for (var j=0;j<config.NR_OF_RELAYS_MAX;j++){
				var cell = document.createElement("th");row.appendChild(cell);
				cell.className = "alarmTable";
				cell.innerHTML = j+1;
				if (j >= getNrOfRelaysSupported(config)) cell.style.display = "none";
			}
		}
		var alarmNrShow = 0;
		var nr_of_rows = (mode==0?9:(mode==1?4:9));
		for (var j=0;j<nr_of_rows;j++) {
			var increaseAlarmNr = true;
			var isUserAlarm = false;
			var isAnnunciatorAlarm = false;
			var row = document.createElement("tr");
			tb.appendChild(row);
			if (mode == 0) {
				if ( j > 7 || j == 2 ) // En remoto se oculta fila con PA UL FAIL y ANTENNA DISCONNECTION
				{
					row.style.display = "none";
					increaseAlarmNr = false;
				} else if (j == 6 || j == 7) {
					isUserAlarm = true;
					increaseAlarmNr = false;
				}
			} 
			if (mode == 2) {
				if (j == 7 || j == 8) {
					isAnnunciatorAlarm = true;
				}
			}
			for (var k=0;k<2;k++){
				var hideCell = (mode == 0 && j == 5 && k == 1); // se oculta alarm 10 que no existe
				hideCell = hideCell || (mode == 2 && j == 6 && k == 1);	// hide BBU ALARM14
				var ix = k+2*j;
				if (mode==1) {
					if (!factory.limitTo32CH &&  factory.masterRxLowAlarm) {
						hideCell = hideCell || (ix>6);
					} else {
						hideCell = hideCell || (ix>5);
					}
				}
				if ( factory.limitTo32CH ) {
					// hide General System Alarms
					hideCell = hideCell || (mode == 0 && ix>=8 && ix<11);
					// hide "DL Output Power"
					if (!factory.masterRxLowAlarm) {
						hideCell = hideCell || (mode == 1 && ix==5);
					}
				}

				var cell = document.createElement("th");
				if ( isUserAlarm ) {
					var userAlarmNr = 2*(j-6) + k + 1;
					cell.innerHTML = "USER&nbsp;ALARM&nbsp;"+userAlarmNr;
				} else if ( isAnnunciatorAlarm ) {
					var annunciatorAlarmNr = 2*(j-7)+k+1;
					cell.innerHTML = "ANNUNCIATOR&nbsp;"+annunciatorAlarmNr;
				} else if ( increaseAlarmNr && ! hideCell) {
					alarmNrShow++;
					cell.innerHTML = "ALARM&nbsp;"+alarmNrShow; //Se cambia ordenación (*)
				} else {
					cell.innerHTML = "ALARM&nbsp;"+(ix+1); //Se cambia ordenación (*)
				}
				cell.style.minWidth = "80px";
				var index = ix;
				if (mode==0){
					var ord = [0,1,2,3,4,5,6,7,12,13,14,15,8,9,10,11];
					ix = ord[ix];
					index = ix;
				}
				else if (mode==1){
					var ord = [0,2,3,4,6,7,5,1];
					if ( factory.limitTo32CH && factory.masterRxLowAlarm) {
						ord = [0,2,3,4,6,5,7,1];
					}
					ix = ord[ix];
					index = ix;
				}
				else if (mode==2){
					if (j>=6) index = j==6?index+4:index-2; //Change to insert a row for Annunciators keeping index of annunciators 1,2,3,4 
				}
				cell.style.paddingLeft = "5px";
				cell.style.paddingRight = "5px";
				cell.className = "alarmTable";
				if (hideCell) {
					cell.style.display = "none";
				}
				row.appendChild(cell);
				var cell = this.createInputText("AlName",index,mode); //Se cambia ordenación (*)
				row.appendChild(cell);
				cell.className = "alarmTable";
				if (hideCell) {
					cell.style.display = "none";
				}
				var cell = this.createEnabledCheckBox(index,mode,0); //Se cambia ordenación (*)
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
					var cell = this.createSystemCheckBox(index,mode,0,i); //Se cambia ordenación (*)
					row.appendChild(cell);
					cell.className = "alarmTable";
					cell.style.textAlign = "center";
					if (hideCell || factory.limitTo32CH) {
						cell.style.display = "none";
					}
					if (mode==2 && j==6 && k==0) {
						// row for annunciators's relay assign, not for individual annunciator enable
						cell.style.visibility = "hidden";
					}
				}
				for (var i=0;i<config.NR_OF_RELAYS_MAX;i++){
					var cell = this.createCheckBox(ix,mode,i); //Se cambia ordenación (*)
					if (i >= getNrOfRelaysSupported(config)) cell.style.display="none";
					if (isAnnunciatorAlarm) {
						// relay assign checkbox for individual annunciators
						if (i==0) {
							cell.style.visibility = "hidden";
							cell.colSpan = getNrOfRelaysSupported(config);
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
				var cell = mode==0?this.createPolarityCheckBox(ix):document.createElement("td");
				cell.className = "alarmTable";
				cell.style.textAlign = "center";
				cell.style.minWidth = "40px";
				if (hideCell) {
					cell.style.display = "none";
				}
				row.appendChild(cell);
			}
		}
				return cellb;

	}
	this.createInputText = function(id,num,mode){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.input = "text";
		el.style.fontWeight = "bold";
		el.id = id+"_"+num+"_"+mode;
		el.size = 30;
		el.maxLength = 30;
		el.style.width = "140px";
		cell.appendChild(el);
		return cell;
	}
	this.createEnabledCheckBox = function(num,mode,enav){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "enabled_"+num+"_"+mode+"_"+enav;
		el.name = el.id;
		el.type = "checkbox";
		el.enav = enav;
		cell.appendChild(el);
		return cell;		
	}
	this.createSystemCheckBox = function(num,mode,enav,sysAlarmNr){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "systemAlarm_"+num+"_"+mode+"_"+enav+"_"+sysAlarmNr;
		el.name = el.id;
		el.type = "checkbox";
		el.enav = enav;
		cell.appendChild(el);
		return cell;		
	}
	this.createPolarityCheckBox = function(num) {
		var cell = document.createElement("td");
		if (num < 8 || num > 11) {
			return cell;
		}
		var el = document.createElement("input");
		var externalAlarmNr = num - 8;
		el.id = "extAlarmPolarity_"+externalAlarmNr;
		el.name = el.id;
		el.type = "checkbox";
		cell.appendChild(el);
		return cell;
	}
	this.createCheckBox = function(num,mode,nrelay){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "relay_enabled_"+num+"_"+mode+"_"+nrelay;
		el.name = el.id;
		el.type = "checkbox";			
		cell.appendChild(el);
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
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		for (var band=0;band<2;band++){
			var cell = document.createElement("th");
			cell.id = "vswrtitle_"+band;
			cell.className = "cth";
			cell.colSpan = 2;
			rowb.appendChild(cell);	
			var cell = document.createElement("th");
			cell.style.display = "none";
			cell.id = "donortitle_"+band;
			cell.className = "cth";
			rowb.appendChild(cell);
		}			
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		for (var band=0;band<2;band++){
			var cell = this.createPowerCell(band);
			cell.id = "powerCell_"+band;
			rowb.appendChild(cell);		
			var cell = this.createVSWRCell(band);
			cell.id = "vswrCell_"+band;
			rowb.appendChild(cell);	
			var cell = this.createDonorAntFailCell(band);
			cell.id = "donorCell_"+band;
			cell.style.display = "none";
			rowb.appendChild(cell);	
		}
		var rowb = document.createElement("tr");
		rowb.style.display = "none";
		tab.appendChild(rowb);
		for (var k=0;k<2;k++){
			var cell = document.createElement("th");
			cell.innerHTML = "ANTENNA&nbsp;DISCONNECTION";
			cell.id = "antDisconnTitle_"+k;
			cell.className = "cth";			
			rowb.appendChild(cell);	
		}
		var rowb = document.createElement("tr");
		rowb.style.display = "none";
		tab.appendChild(rowb);
		for (var k=0;k<2;k++){	
			var cell = this.createBroadbandLevelIn(k);
			cell.id = "antDisconnCtrl_"+k;
			cell.style.paddingLeft = "100px";
			cell.style.paddingRight = "100px";
			rowb.appendChild(cell);
		}
		return tab;
	}
	this.createPowerCell = function(band){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";
		var tbl = document.createElement("table");
		tbl.align = "center";
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
		cell.innerHTML = "TX&nbsp;Power&nbsp;Too&nbsp;Low&nbsp;For VSWR&nbsp;Measurement";
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
		cell.style.paddingRight = "15px";
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
	this.createRetLossTh = function(band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Return&nbsp;Loss&nbsp;Threshold";
		cell.style.paddingRight = "15px";
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
	this.createVSWRCell = function(band){
		var cellb = document.createElement("td");
		cellb.style.paddingTop = "20px";
		cellb.className = "contentcell";
		var tbl = document.createElement("table");
		tbl.align = "center";
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
	this.createDonorAntFailCell = function(band){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";
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
		cell.className = "thdrht";
		for (var j=2;j>=0;j--) row.appendChild( this.createTimeTriggerBox(band,j));
		var cell = document.createElement("th");
		cell.style.width = "40px";
		row.appendChild(cell);		
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.id = "altimer_"+band;
		cell.className = "thdrht";		
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
		cell.innerHTML = title;
		cell.className = "band";
		cell.style.width = "100%";
		cell.style.textAlign = "center";
		var cell = document.createElement("td");
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

	this.alarmThrshElements = [
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
			lbl: "Donwlink&nbsp;Output&nbsp;Power&nbsp;Alarm&nbsp;(Band 1) (dBm)",
			lblaux: "Alarm occurs after 2 minutes below the threshold",
			sign: "<",
			id: "dlpwr_1"
		},
		{
			lbl: "Donwlink&nbsp;Output&nbsp;Power&nbsp;Alarm&nbsp;(Band 2) (dBm)",
			lblaux: "Alarm occurs after 2 minutes below the threshold",
			sign: "<",
			id: "dlpwr_2"
		}
	];
	this.AlarmThrshElementsId = function(k, i) {
		return (this.alarmThrshElements[k].id+"_"+i);
	}
	this.createAlarmThresholds = function() {
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
		for (var k = 0; k < this.alarmThrshElements.length; ++k) {
			var row = document.createElement("tr");
			var cell = document.createElement("th");
			if (k==3 || k==4) {
				var band = k - 3;
				this.alarmThrshElements[k].lbl = "Downlink&nbsp;Output&nbsp;Power&nbsp;Alarm&nbsp;"+
					factory.bandNames[band].toUpperCase()+" (dBm)";
				var show = factory.chBandEnabled[band] || factory.adjBandEnabled[band];
				row.style.display = show? "table-row" :"none";
			}
			cell.innerHTML = this.alarmThrshElements[k].lbl;
			cell.style.paddingRight = "20px";
			cell.className = "thdrht";
			row.appendChild(cell);
			cell = document.createElement("th");
			cell.innerHTML = this.alarmThrshElements[k].sign;
			row.appendChild(cell);
			for (var i = 0; i < 2; ++i) {
				var cell = document.createElement("td");
				row.appendChild(cell);
				var el = document.createElement("input");
				el.type = "text";
				el.id = el.name = this.AlarmThrshElementsId(k, i);
				el.isHys = (i == 1);
				if (el.isHys) {
					el.min = NFPAcfg.alrmThrshHystLimits.min;
					el.max = NFPAcfg.alrmThrshHystLimits.max;
				} else {
					el.min = NFPAcfg.alarmThrshLimits[k].min;
					el.max = NFPAcfg.alarmThrshLimits[k].max;
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
					el.title = "Min: "+NFPAcfg.alarmThrshLimits[k].min+
						", Max: "+NFPAcfg.alarmThrshLimits[k].max+", Resolution: 1";
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
			if (this.alarmThrshElements[k].lblaux.length>0){
				cell = document.createElement("th");
				cell.innerHTML = this.alarmThrshElements[k].lblaux;
				row.appendChild(cell);
			}
			tb.appendChild(row);
		}
		return tab;
	}
	this.createBatteryBackupParameters = function() {
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
			var cell = this.createBbuMeasurements();
			rowb.appendChild(cell);		
			var cell = this.createBbuBuzzerParams();
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
	this.createBbuMeasurements = function(){
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
			param.id = this.bbuMeasurements[n].id;
			param.style.textAlign = "right";
			param.style.width = "40px";
			param.className = "tabval";
			var cell2 = document.createElement("td");
			cell2.style.width = "60px";
			cell2.appendChild(param);
			row.appendChild(cell2);
			if (config.bbu_type == 2) {		// High Power BBU
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
	this.createBbuBuzzerParams = function(){
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
		param.id = "bbuBuzzerStatus";
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
		this.createBuzzerTimers(tb);
		return cellb;
	}
	this.createBuzzerTimers = function(tb){
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
		for (var j=2;j>=0;j--) row.appendChild( this.createBuzzerTimer(j));
		var cell = document.createElement("td");
		cell.style.paddingLeft = "2px";
		cell.style.paddingRight = "2px";
		cell.className = "tabval";
		cell.style.width = "85px";
		cell.style.textAlign = "right";
		cell.id = "BuzzerRemainingTimerId";
		row.appendChild(cell);
	}
	this.createBuzzerTimer = function(hms) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "buzzerMuteTimerId_"+hms;
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
	this.bbuBuzzerMuteTimeSet = function(val){
		var times = [0,0,0];
		var res;
		times[2] = Math.floor(val/3600);
		res = ~~(val-3600*times[2]);
		times[1] = Math.floor(res/60);
		times[0] = res % 60;
		for (var k=0;k<3;k++){
			var el = document.getElementById("buzzerMuteTimerId_"+k);
			el.value = times[k];
		}
	}
	this.buzzerMuteTimeGet = function(){
		var	res = parseInt(document.getElementById("buzzerMuteTimerId_0").value);
		res +=  60*parseInt(document.getElementById("buzzerMuteTimerId_1").value);
		res +=  3600*parseInt(document.getElementById("buzzerMuteTimerId_2").value);
		return res;
	}
	this.bbuBuzzerRemainingTimeSet = function(val,bbuCommErr){
		var times = [0,0,0];
		var res;
		if (bbuCommErr) {
			document.getElementById("BuzzerRemainingTimerId").style.textAlign = "center";
			document.getElementById("BuzzerRemainingTimerId").innerHTML = "---";
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
		document.getElementById("BuzzerRemainingTimerId").style.textAlign = "center";
		document.getElementById("BuzzerRemainingTimerId").innerHTML = str;
	}
	this.bbuBuzzerStatusSet = function(buzzerStatus, bbuCommErr) {
		var str = bbuCommErr? "---" : (buzzerStatus? "ON" : "OFF");
		document.getElementById("bbuBuzzerStatus").value = str;
	}
}
