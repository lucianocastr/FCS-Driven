var remoteConfResponseValid = [];
var frameSeparator = "\t\t\t";
var eventLog;
var timerId;
var countCheck;
var tags;
var ndev;
var nretr;
var nretrMax = 10;
var factory;
var configs;
var fibInfo = new fiberInfo(0);
function onloadInit() {
	ndev = ~~(localStorage.getItem("eLogSel"+Prjstr+window.location.host));
	if (typeof(ndev) === 'undefined' || ndev === null) {
		ndev = 0;
	}
	eventLog = new EventLog();
	eventLog.setDeviceNumber(ndev);
	tags = [];
	factory = new Factory();
	configs = [];
	globalConfigReq();
	showResultIcon(ERR_PENDING);
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
		xhr.send('gbconf_str="');
		xhr = null;
	} catch (err) {}
}
function navigateToOverview(){
	alert("DAS is being re-configured by another instance. This operation cannot be done while this GUI is in Alarm Log section");
	setTimeout(function() {
		window.parent.navi.document.getElementById("start").click();
		window.top.MonitorMode = 0;
	}, 1000);
}
function loadConfigGlobal() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState == 4 && this.status == 200) {
				if (this.responseText.indexOf("RCFG") >= 0) { //Load file operation: GUI goes to DAS Overview
					navigateToOverview();
					return;
				}
				parseGlobalConfig(this.responseText);
				eventLog.gui.create();
				logDataReq(ndev);
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
function computeTimeoutReqMs() {
	if (window.parent.navi.isEthernetMode) {
		return 4000;
	} else {
		return 1000;
	}
}
function logDataReq(ndev){
	if (ndev>0 && !remoteConfResponseValid[ndev]){
		ndev=0;
		document.getElementById("unitSel").value=ndev;
		localStorage.setItem("eLogSel"+Prjstr+window.location.host,ndev);
	}
	eventLog.gui.clearData();
	eventLog.setDeviceNumber(ndev);
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				cleartimer();
				var tmout = computeTimeoutReqMs();
				nretr = 0;
				timerId = setTimeout(function() {loadLogData();}, tmout);
			}
		}
		xhr.onerror = function(ev) {
			cleartimer();
			timerId = setTimeout(function() {
				logDataReq(ndev);
			}, 2000);
		}
		xhr.ontimeout = function(ev) {
			cleartimer();
			timerId = setTimeout(function() {
				logDataReq(ndev);
			}, 2000);
		}
		xhr.open("POST", "eventlog.zhtml", true);
		xhr.timeout = 25000;
		var p = "log_str="+hexformat(ndev,4)+"&log_req=1";
		xhr.send(p);
		xhr = null;
		eventLog.gui.block(true);
	} catch (err) {}
}

function loadLogData() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var sr = this.responseText;
				if (sr.indexOf("RCFG") >= 0) { //Load file operation: GUI goes to DAS Overview
					navigateToOverview();
					return;
				}
				if (sr.length == 0){
					if (++nretr < nretrMax) {
						tmrId = setTimeout(function() { loadLogData(); }, 500);
						return;
					}
				}
				if (eventLog.n>0){
					if (sr.length>6){
						eventLog.logdata = sr.substr(remoteHeaderLength+2);		/* skip remote generation index added after header */
						eventLog.logheader = sr.substring(0,remoteHeaderLength);
						var remoteGenerationStr = sr.substring(remoteHeaderLength,remoteHeaderLength+2); 	/* remote generation added after header, also for expansion */
						eventLog.device_version_index = parseInt(remoteGenerationStr,16);
					}else{
						eventLog.logdata = sr;
						eventLog.logheader = "000000";//bad header
					}
				}else{
					eventLog.logdata = sr;
					eventLog.logheader = "000001";
					eventLog.device_version_index = 2; //master generation
				}
				eventLog.gui.showData();
			}
		}
		xhr.onerror = function(ev) {
			cleartimer();
			timerId = setTimeout(function() {loadLogData();	}, 2000);
		}
		xhr.ontimeout = function(ev) {
			cleartimer();
			timerId = setTimeout(function() {loadLogData();	}, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };
		xhr.open("GET", "update_log.shtml?co="+Date.now(), true);
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
	if (deviceStr[0].length >= masterGlobalConfigLength) {
		remoteConfResponseValid[0] = true;
	}
	parseGlobalConfigUnit(deviceStr[0].substr(remoteHeaderLength), 0); //first master to obtain fiberinfo from master global config
	for (var k=1;k<deviceStr.length;k++){ //provisional while expansion and their remotes are implemented and basic frame is parsed
		var indexRemote = parseInt(deviceStr[k].substring(0,4),16); if (indexRemote<0) indexRemote+=65536;
		if (fibInfo.FOmoduleConnected[indexRemote]){
			var frameLength = (indexRemote & 0xff)==0?expBasicGlobalConfigLength:remoteBasicGlobalConfigLength;
			if (deviceStr[k].length < frameLength+remoteHeaderLength) {
				remoteConfResponseValid[indexRemote] = false;
			}else{
				remoteConfResponseValid[indexRemote] = (1 === parseInt(deviceStr[k].substring(4,6),16));
				if (remoteConfResponseValid[indexRemote]){
					parseGlobalBasicConfigUnit(deviceStr[k].substr(remoteHeaderLength), indexRemote);
				}
			}
		}
	}
}
function parseGlobalConfigUnit(str, n) {
	var srarr = str.split('\t');
	if ((n==0 && srarr.length < 7)||(n>0 && srarr.length < 5)) {
		return;
	}
	if (n==0){
		fibInfo.parse(srarr[5]);
		tags[0] = new Tags();
		tags[0].parseRawText(srarr[3]);
		factory.parse(srarr[1],0);
		configs[0] = new Config(0);
		configs[0].parse(srarr[0],factory);
	}
}

function parseGlobalBasicConfigUnit(str, n) {
	configs[n] = new BasicConf(n);
	configs[n].parse(str);
	var srTag = configs[n].tag;
	tags[n] = new Tags();
	tags[n].parseRawText(srTag);
}
function reloadData() {
	globalConfigReq();
	showResultIcon(ERR_PENDING);
}
function cleartimer() {
	if (typeof(timerId) !== "undefined" && timerId) {
		clearTimeout(timerId);
	}
}
function EventLog() {
	var self = this;
	this.n;
	this.setDeviceNumber = function(n){
		if (n != this.n) {
			self.config = new Config(n);
		}
		this.n = n;
	}
	this.clearLogData = function() {
		try {
			var xhr = xmlreq();
			xhr.onreadystatechange  = function(ev) {
				if (this.readyState === 4 && this.status === 200) {
					cleartimer();
					timerId = setTimeout(function() {
						countCheck = 0;
						self.checkResult();
					}, 100);
				}
			}
			xhr.onerror = function(ev) {
			}
			xhr.ontimeout = function(ev) {
			}
			xhr.open("POST", "eventlog.zhtml", true);
			xhr.timeout = 5000;
			xhr.send("log_event_str="+hexformat(ndev,4));
			xhr = null;
		} catch (err) {}
	}
	this.checkResult = function() {
		try {
			var xhr = xmlreq();
			xhr.onreadystatechange  = function(ev) {
				if (this.readyState==4 && this.status === 200) {
					var error = parseInt(this.responseText);
					if (error != ERR_OK && error != ERR_FAIL) {
						if (++countCheck < 50) {
							cleartimer();
							timerId = setTimeout(function() {
								self.checkResult();
							}, 500);
							return;
						} else {
							error = ERR_FAIL;
						}
					}
					self.showResult(error);
					cleartimer();
					timerId = setTimeout(function() {logDataReq(ndev);}, 2000);
				}
			}
			xhr.onerror = function(ev) {
				self.showResult(ERR_FAIL);
			}
			xhr.ontimeout = function(ev) {
				self.showResult(ERR_FAIL);
			}
			Date.now = Date.now || function() { return +new Date; }; 		
			xhr.open("GET", "/result.shtml?co="+Date.now(), true);
			xhr.timeout = 10000;
			xhr.send(null);
			xhr = null;
		} catch (err) {}
	}
	this.showResult = function(error) {
		showResultIcon(error);
		cleartimer();
		timerId = setTimeout(function() {
			showResultIcon(ERR_NONE);
		}, 1000);
	}
    // absolute timestamps in alarm log have an offset of -1704067200 seconds corresponding to 01/01/2024 00:00:00
    var timestamp2024 = 1704067200;    // 1704067200 = 01/01/2024 00:00:00
	this.Gui = function() {
		this.create = function() {
			var el = document.getElementById("refreshB");
			if (el){//si existe sólo se actualiza unitSel
				el = document.getElementById("unitSelCell");
				remove_children(el);
				this.createUnitSelector(el);
				return;
			}; 
			var mainDiv = document.getElementById("page");
			var tab = document.createElement("table");
			tab.className = "logtab";
			mainDiv.appendChild(tab);
			var head = document.createElement("thead");
			tab.appendChild(head);
			var row = document.createElement("tr");
			head.appendChild(row);
			var cell = document.createElement("td");
			cell.id = "unitSelCell";
			this.createUnitSelector(cell);
			cell.className = "nrtitle";
			cell.style.width = "400px";
			cell.style.paddingLeft = "10px";
			row.appendChild(cell);
			var cell = document.createElement("th");
			cell.className = "tag";
			cell.innerHTML = "ALARM LOG";
			row.appendChild(cell);
			var cell = document.createElement("td");
			cell.className = "nrtitle";
			cell.style.width = "400px";
			cell.style.paddingLeft = "10px";
			row.appendChild(cell);
			var body = document.createElement("tbody");
			tab.appendChild(body);
			var row = document.createElement("tr");
			row.style.height = "5px";
			body.appendChild(row);
			var row = document.createElement("tr");
			body.appendChild(row);
			var cell = document.createElement("td");
			cell.className = "controls";
			row.appendChild(cell);
			var btn = document.createElement("input");
			this.refreshButton = btn;
			btn.type = "button";
			btn.className = "controls";
			btn.id = btn.name = "refreshB";
			btn.value = "REFRESH";
			btn.onclick = function(ev) {
				logDataReq(ndev);
				self.gui.block(true);
				showResultIcon(ERR_PENDING);
			}
			cell.appendChild(btn);
			var cell = document.createElement("td");
			cell.className = "controls";
			row.appendChild(cell);
			var btn = document.createElement("input");
			this.clearButton = btn;
			btn.type = "button";
			btn.className = "controls";
			btn.id = btn.name = "clearB";
			btn.value = "CLEAR";
			btn.onclick = function(ev) {
				self.clearLogData();
				self.gui.block(true);
				showResultIcon(ERR_PENDING);
			}
			cell.appendChild(btn);
			var cell = document.createElement("td");
			cell.className = "controls";
			row.appendChild(cell);
			var btn = document.createElement("input");
			btn.type = "button";
			btn.className = "controls";
			btn.id = btn.name = "saveB";
			btn.value = "SAVE";
			btn.onclick = function(ev) {
				self.gui.downloadFile("AlarmLog.csv");
			}
			cell.appendChild(btn);
			var row = document.createElement("tr");
			body.appendChild(row);
			var cell = document.createElement("td");
			cell.colSpan = 3;
			row.appendChild(cell);
			var txt = document.createElement("textarea");
			this.dataArea = txt;
			txt.className = "logdata";
			txt.id = txt.name = "logdata";
			txt.setAttribute("cols",100);
			txt.setAttribute("rows",40);
			txt.setAttribute("readonly","readonly");
			cell.appendChild(txt);
			var row = document.createElement("tr");
			row.style.height = "10px";
			body.appendChild(row);
		}
		this.createUnitSelector = function(cell){
			var sp = document.createElement("span");
			cell.appendChild(sp);
			sp.innerHTML = "UNIT:&nbsp;&nbsp;&nbsp;&nbsp;";
			var el = document.createElement("select");
			var cond=false;
			for (var j=0;j<2;j++){ //1st iteration master and expansion with cond = false, 2nd iteration remotes with cond = true
				for (var i in remoteConfResponseValid) {
					var i1 = i & 0xff; var i2= (i>>8)&0xff;
					if ((i1==0)==cond) continue;
					if (i==0 || remoteConfResponseValid[i]){
						var opt = document.createElement('option');
						el.options.add(opt);
						opt.value = i;
						opt.innerHTML = (i==0?"MASTER":(i1==0?"EXPANSION "+i2+".0":"REMOTE "+i2+"."+i1))+" - "+tags[i].tag.trim();
					}
				}
				cond = true;
			}
			el.value = ndev;
			if (el.value==""){ //if ndev element is not present on unit selector, master is selected
				el.value = 0;
				ndev = 0;
			}
			el.id = el.name = "unitSel";
			el.onchange = function(ev) {
				ndev = ~~this.value;
				localStorage.setItem("eLogSel"+Prjstr+window.location.host,ndev);
				reloadData();
			}
			cell.appendChild(el);
		}
		this.getLogData = function(fieldSeparator, withBootDelimiters, withHeader) {
			var data="";
			if (self.gui.getLogDataParams(withBootDelimiters) == null) { //time is not updated when alarm log is exported to csv
				return data;
			}
			var config = configs[self.n];
			var firstBootFound = false;
			var indexOffset = self.n>0?8:0; //offset between master and remote alarm indexs
			if (withHeader) {
				data +="Date / Time since boot, Alarm Status, Alarm Description\n";
			}
			for (var n = 0; n < self.logDataMaxRecords; n++) {
				var r = self.gui.getRecord(n);
				if (r == null) {
					break;
				}
				if (!config.bbu_serial_mode)
				{
					if (r.type >= (self.gui.EventTypes.NORMAL_AC_POWER-indexOffset)
						&& r.type <= (self.gui.EventTypes.ANNUNCIATOR_4-indexOffset))
					{
						continue;
					}
				}
                if (r.isAbsoluteTime) {
                    var recMs = r.time;
                    var recDate = new Date();
                    recDate.setTime(recMs);
                    data += self.gui.getDateStr(recDate.getTime());
                } else {
                    if ( !firstBootFound ) {
                        var recMs = self.gui.deviceTime + r.time;
                        var recDate = new Date();
                        recDate.setTime(recMs);
                        data += self.gui.getDateStr(recDate.getTime());
                    } else {
                        data += self.gui.getTimeStr(r.time);
                    }
                }
                if ( (self.gui.EventTypes.BOOT+1) == (r.type+1) ) {
                    data += fieldSeparator;
                    data += "BOOT";
                    data += "\n";
                    if (withBootDelimiters) {
                        for (var i = 0; i < self.gui.dataArea.cols; i++) {
                            data += "_";
                        }
                        data += "\n\n";
                    }
                    firstBootFound = true;
                    continue;
                }

				data += fieldSeparator;
				if (r.type == (self.gui.EventTypes.NORMAL_AC_POWER-indexOffset)) {
					data += "ALARM " + (r.status?"OFF":"ON ");
				} else {
					data += "ALARM " + (r.status?"ON ":"OFF");
				}
				var alarmName = self.gui.getEventName(r.type, factory);
				data += fieldSeparator;
				data += alarmName;
				data += "\n";
			}
			return data;
		}
		this.block = function(doBlock) {
			try {
				self.gui.refreshButton.disabled = !!doBlock;
				self.gui.clearButton.disabled =  !!doBlock;
			} catch(err) {}
		}
		this.downloadFile = function(filename) {
			if (!filename) {
				return;
			}
			var data = self.gui.getLogData(",", false, true);
			var fdata = [];
			fdata.push(data);
			var blob = new Blob(fdata, {type: 'text/plain'});
			if(window.navigator.msSaveOrOpenBlob) {
				window.navigator.msSaveBlob(blob, filename);
			} else {
				var elem = window.document.createElement('a');
				elem.href = window.URL.createObjectURL(blob);
				elem.download = filename;        
				document.body.appendChild(elem);
				elem.click();        
				document.body.removeChild(elem);
			}
		}
		this.showData = function() {
			self.gui.block(false);
			if (self.n==0 || remoteConfResponseValid[self.n]) {
				if (self.gui.getLogDataParams(true) == null) {
					self.showResult(ERR_FAIL);
					return;
				}
				self.showResult(ERR_NONE);
				var data = self.gui.getLogData("\t", true, false);
				self.gui.dataArea.value = data;
			}
		}
		this.clearData = function(){
			self.gui.dataArea.value = "";
		}
		this.getLogDataParams = function(updateDeviceTime) {
			try {
				var s = self.logdata;
				if (typeof(s.length) === "undefined" || s.length < self.logDataHeaderLength){
					alert("Error retrieving alarm log. Wrong length");
					return null;
				}
				var header = self.logheader;
				if (self.n!=parseInt(header.substring(0,4), 16)||parseInt(header.substring(4,6),16)!=1){
					alert("Error retrieving alarm log. Wrong header");
					return null;
				}
				//EXTERNAL INPUT NAMES
				var ind = 0;
				for (var k=0;k<4;k++){
					self.config.alarmNames[0][8+k] = s.substring(ind,ind+30).trim();ind+=30;
				}
				//ANNUNCIATOR NAMES
				for (var k=0;k<4;k++){ 
					self.config.alarmNamesBbu[12+k] = s.substring(ind,ind+30).trim();ind+=30;
				}
				var secs = parseInt(s.substring(ind, ind+8), 16);ind+=8;
				var isAbsoluteTime = secs > 0x7FFFFFFF;
                if (isAbsoluteTime) {
					secs = secs & 0x7FFFFFFF;
                    secs += timestamp2024;
                }
				var n = parseInt(s.substring(ind, ind+4), 16);ind+=4;
				if (s.length < (self.logDataHeaderLength + n*self.logDataRecordLength ))
				{
					return null;
				}
				var currentDate = new Date();
				if (updateDeviceTime) {
					if (isAbsoluteTime) {
						self.gui.deviceTime = currentDate.getTime();
					} else {
						self.gui.deviceTime = currentDate.getTime() - secs*1000;
						if ((self.n > 0) && (self.device_version_index < 2)) {
							/* for remote bbu.mvo2(gen=1) and older (gen=0) */
							self.gui.deviceTime = currentDate.getTime() - secs*998.415; // 0.998415 factor to consider uC time drift
						}
						if (window.parent.navi.isEthernetMode) {
							self.gui.deviceTime -= 2900;	/* fixed ~3 second delay it takes for web operation with rabbit board */
						}
					}
				}
				self.gui.nrRecords = n;
				return self.gui.nrRecords;

			} catch(err) {}
		}
		this.getRecord = function(n) {
			var p = (n+1)*self.logDataRecordLength;
			if ( p > (self.logdata.length - self.logDataHeaderLength) ) {
				return null;
			}
			var secs = parseInt(self.logdata.substr(-p, 8), 16);
			// if secs > 0x7FFFFFFF, it is an absolute time
			var isAbsoluteTime = secs > 0x7FFFFFFF;
			if (isAbsoluteTime) {
				secs = secs & 0x7FFFFFFF;
                secs += timestamp2024;
			}
			var ms = secs*1000;
			if (!isAbsoluteTime && (self.n > 0) && (self.device_version_index < 2)) {
				/* for remote bbu.mvo2(gen=1) and older (gen=0) */
				ms = ms*0.998415; // 0.998415 factor to consider uC time drift
			}
			var ev = parseInt(self.logdata.substr(-p+8, 2), 16);
			var evType = ev & 0x7F;
			var evStat = !!(ev & 0x80);
			return { "time":ms, "type":evType, "status":evStat, "isAbsoluteTime":isAbsoluteTime };
		}
		this.getDateStr = function(ms) {
			var d = new Date();
			d.setTime(ms);
			return (("  "+d.getDate()).substr(-2)+"/"
				+self.gui.Months[d.getMonth()]+"/"
				+d.getFullYear()+" "
				+("  "+d.getHours()).substr(-2)+":"
				+("00"+d.getMinutes()).substr(-2)+":"
				+("00"+d.getSeconds()).substr(-2) );
		}
		this.getTimeStr = function(ms) {
			var t = Math.round(ms / 1000);
			var s = t % 60;
			var ss = ("  "+s).substr(-2, 2);
			t = Math.floor(t/60);
			var m = t % 60;
			var mm = ("  "+m).substr(-2, 2);
			t = Math.floor(t/60);
			var h = t % 24;
			var hh = ("  "+h).substr(-2, 2);
			t = Math.floor(t/24);
			var d = t;
			var dd = (" "+d);
			var str = dd+"d "+hh+"h "+mm+"m "+ss+"s";
			str += "                    ";
			str = str.substr(0, 20);
			return (str);
		}
		this.getEventName = function(rtype, factory) {
			var alarmName = "";
			var NrAlarmsGeneral = self.config.alarmNames[0].length;
			var NrAlarmsBand = self.config.alarmNames[1].length;
			var NrAlarmsBbu = self.config.alarmNamesBbu.length;
			var index = rtype;
			if ( index >= 0 && index < NrAlarmsGeneral ) {
				alarmName = self.config.alarmNames[0][index];
			} else {
				index -= NrAlarmsGeneral;
				if ( index >= 0 && index < NrAlarmsBand ) {
					alarmName = self.config.alarmNames[1][index];
					alarmName += "  ";
					alarmName += factory.bandNames[0];
				} else {
					index -= NrAlarmsBand; 
					if ( index >= 0 && index < NrAlarmsBand ) {
						alarmName = self.config.alarmNames[1][index];
						alarmName += "  ";
						alarmName += factory.bandNames[1];
					} else {
						index -= NrAlarmsBand+1;	// skip PA off
						if ( index >= 0 && index < NrAlarmsBbu ) {
							alarmName = self.config.alarmNamesBbu[index];
						}
					}
				}
			}
			return alarmName;
		}
		this.dataArea;
		this.refreshButton;
		this.clearButton;
		this.Months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		this.EventTypes = {
			// MMS EVENT NUMBERS
			NORMAL_AC_POWER: 			57,
			LOSS_NORMAL_AC_POWER:		58,
			BATTERY_CAPACITY_LT_30PC:	59,
			BATTERY_CHARGER_FAIL:		60,
			COMMUNICATION_ERROR:		61,
			CHARGER_TEMPERATURE:		62,
			BATTERY_TEMPERATURE:		63,
			INDIVIDUAL_BATTERY_VOLTAGE:	64,
			BATTERY_DISCONNECTION:		65,
			SYSTEM_VOLTAGE:				66,
			BATTERY_BANK_VOLTAGE:		67,
			EXTERNAL_INPUT2_NOT_USED:	68,
			ANNUNCIATOR_1:				69,
			ANNUNCIATOR_2:				70,
			ANNUNCIATOR_3:				71,
			ANNUNCIATOR_4:				72,
			BOOT: 		126
		};
		this.timediff;
		this.nrRecords;
	}
	this.config = new Config(0);
	this.dataArea;
	this.refreshButton;
	this.clearButton;
	this.gui = new self.Gui();
	this.logDataHeaderLength = 252;
	this.logDataRecordLength = 10;
	this.logDataMaxRecords = 500;
	this.logdata;
	this.logheader;
	this.device_version_index;
}