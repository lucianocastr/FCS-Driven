var remoteConfResponseValid = [false, false];
var frameSeparator = "\t\t\t";
var nrOfRemotes = 2;
var remoteHeaderLength = 4;
var eventLog;
var timerId;
var countCheck;

function onloadInit() {
	eventLog = [];
	for (var n=0;n<=nrOfRemotes;n++)
		eventLog.push(new EventLog(n));
	logDataReq();
	showResultIcon(ERR_PENDING);
}
function reloadData() {
	logDataReq();
	showResultIcon(ERR_PENDING);
}
function cleartimer() {
	if (typeof(timerId) !== "undefined" && timerId) {
		clearTimeout(timerId);
	}
}
function computeTimeoutReqMs() {
	if (window.parent.navi.isEthernetMode) {
		return 2500;
	} else {
		return 100;
	}
}
function logDataReq(){
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				cleartimer();
				var tmout = computeTimeoutReqMs();
				timerId = setTimeout(function() {
					loadLogData();
				}, tmout);
			}
		}
		xhr.onerror = function(ev) {
			cleartimer();
			timerId = setTimeout(function() {
				logDataReq();
			}, 2000);
		}
		xhr.ontimeout = function(ev) {
			cleartimer();
			timerId = setTimeout(function() {
				logDataReq();
			}, 2000);
		}
		xhr.open("POST", "eventlog.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("log_req="+1);
		xhr = null;
		for (var n=0;n<=nrOfRemotes;n++)
			eventLog[n].gui.block(true);
	} catch (err) {}
}

function loadLogData() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var ldata = parseLogData(this.responseText);
				if (ldata.length != 1+nrOfRemotes) {
					logDataReq();
					return;
				}
				for (var n=0;n<=nrOfRemotes;n++){
					eventLog[n].logdata = ldata[n];
					eventLog[n].gui.showData();
				}
			}
		}
		xhr.onerror = function(ev) {
			cleartimer();
			timerId = setTimeout(function() {
				loadLogData();
			}, 2000);
		}
		xhr.ontimeout = function(ev) {
			cleartimer();
			timerId = setTimeout(function() {
				loadLogData();
			}, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };
		xhr.open("GET", "update_log.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function parseLogData(str){
	var deviceStr = str.split(frameSeparator);
	if (deviceStr.length != 1+nrOfRemotes) {
		//si la trama no tiene toda la info de los equipos se genera una con el tamaño correspondiente a todos los equipos
		//utilizando la info disponible de deviceStr
		var auxStr = [];
		for (var n = 0; n <= nrOfRemotes; n++ ){
			auxStr.push(hexformat(n,2)+'00');
		}
		auxStr[0] = deviceStr[0];
		for (var n = 1; n < deviceStr.length; n++ ){
			var headerN = parseInt(deviceStr[n].substring(0,2));
			if ((deviceStr[n].length >= remoteHeaderLength) && headerN>=0 && headerN<=nrOfRemotes) {
				auxStr[headerN] = deviceStr[n];
			}
		}
		deviceStr = auxStr;
	}
	for (var n = 0; n < nrOfRemotes; n++ ) {
		var remoteNr = n+1;
		remoteConfResponseValid[n] = (1 === parseInt(deviceStr[remoteNr].substring(2,4),16));
		if (remoteConfResponseValid[n]) {
			if (deviceStr[remoteNr].length < remoteHeaderLength) {
				remoteConfResponseValid[n] = false;
			}else
				deviceStr[remoteNr] = deviceStr[remoteNr].substr(remoteHeaderLength);
		}
	}
	return deviceStr;
}

function EventLog(n) {
	var self = this;
	this.n = n;
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
			xhr.send("log_event_str="+self.clearDataStr);
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
					timerId = setTimeout(function() {logDataReq();}, 2000);
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

	this.Gui = function() {
		this.create = function() {
			var mainDiv = document.getElementById("page");
			var tab = document.createElement("table");
			this.tableGUI = tab;
			tab.style.display = "none";
			tab.className = "logtab";
			mainDiv.appendChild(tab);
			var head = document.createElement("thead");
			tab.appendChild(head);
			var row = document.createElement("tr");
			head.appendChild(row);
			var cell = document.createElement("td");
			cell.className = "nrtitle";
			cell.style.width = "150px";
			this.subtitle = cell;
			cell.style.paddingLeft = "30px";
			row.appendChild(cell);
			var cell = document.createElement("th");
			cell.className = "tag";
			cell.innerHTML = "ALARM LOG";
			row.appendChild(cell);
			var cell = document.createElement("td");
			cell.className = "nrtitle";
			cell.style.width = "150px";
			cell.style.paddingLeft = "30px";
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
			btn.id = btn.name = "refreshB_"+self.n;
			btn.value = "REFRESH";
			if (self.n>0) btn.style.display = "none";
			btn.onclick = function(ev) {
				logDataReq();
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
			btn.id = btn.name = "clearB_"+self.n;
			btn.value = "CLEAR";
			if (self.n>0) btn.style.display = "none";
			btn.onclick = function(ev) {
				//OJO
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
			btn.id = btn.name = "saveB_"+self.n;
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
			txt.id = txt.name = "logdata_"+self.n;
			txt.setAttribute("cols",100);
			txt.setAttribute("rows",20);
			txt.setAttribute("readonly","readonly");
			cell.appendChild(txt);
			var row = document.createElement("tr");
			row.style.height = "10px";
			body.appendChild(row);
			
		}
		this.getLogData = function(fieldSeparator, withBootDelimiters, withHeader) {
			var data="";
			if (self.gui.getLogDataParams(withBootDelimiters) == null) { //time is not updated when alarm log is exported to csv
				return data;
			}
			var factory = new Factory(window.parent.navi.factoryFrame);
			var NFPAcfg = new NFPAconf();
			if ( typeof(window.parent.navi.confNfpaFrame[self.n]) !== "undefined" ) {
				NFPAcfg.parse(window.parent.navi.confNfpaFrame[self.n]);
			}
			var firstBootFound = false;

			if (withHeader) {
				data +="Date / Time since boot, Alarm Status, Alarm Description\n";
			}

			for (var n = 0; n < self.logDataMaxRecords; n++) {
				var r = self.gui.getRecord(n);
				if (r == null) {
					break;
				}
				if ( !firstBootFound ) {
					var recMs = self.gui.deviceTime + r.time;
					var recDate = new Date();
					recDate.setTime(recMs);
					data += self.gui.getDateStr(recDate.getTime());
				} else {
					data += self.gui.getTimeStr(r.time);
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
				if (r.status) {
					data += "ALARM ON ";
				} else {
					data += "ALARM OFF";
				}
				var alarmName = self.gui.getEventName(r.type, factory, NFPAcfg);
				/*if ( r.type == self.gui.EventTypes.PA_OFF ) {
					if (r.status) {
						alarmName = "PA STATE OFF";
					} else {
						alarmName = "PA STATE ON";
					}
				}*/
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
			var bdaOnly = !remoteConfResponseValid[0] && !remoteConfResponseValid[1];
			self.gui.block(false);
			if (self.n==0 || remoteConfResponseValid[self.n-1]) {
				this.tableGUI.style.display = "table";
				if (!bdaOnly){
					if (self.n==0)
						this.subtitle.innerHTML = masterName;
					else
						this.subtitle.innerHTML = remoteName+" "+self.n;
				}
				if (self.gui.getLogDataParams(true) == null) {
					self.showResult(ERR_FAIL);
					return;
				}
				self.showResult(ERR_NONE);
				var data = self.gui.getLogData("\t", true, false);
				self.gui.dataArea.value = data;
			}
		}
		this.getLogDataParams = function(updateDeviceTime) {
			try {
				if (typeof(self.logdata.length) === "undefined"
					|| self.logdata.length < self.logDataHeaderLength
					//|| !isHex(self.logdata)
					)
				{
					return null;
				}
				var secs = parseInt(self.logdata.substr(0, 8), 16);
				var n = parseInt(self.logdata.substr(8, 4), 16);
				if (self.logdata.length < 
					(self.logDataHeaderLength + n*self.logDataRecordLength ))
				{
					return null;
				}
				var currentDate = new Date();
				if (updateDeviceTime) self.gui.deviceTime = currentDate.getTime() - secs*998.415; // 0.998415 factor to consider uC time drift
				self.gui.nrRecords = n;
				return self.gui.nrRecords;

			} catch(err) {}
		}
		this.getRecord = function(n) {
			var p = (n+1)*self.logDataRecordLength;
			if ( p > (self.logdata.length - self.logDataHeaderLength) ) {
				return null;
			}
			var ms = parseInt(self.logdata.substr(-p, 8), 16)*998.415; // 0.998415 factor to consider uC time drift
			var ev = parseInt(self.logdata.substr(-p+8, 2), 16);
			var evType = ev & 0x7F;
			var evStat = !!(ev & 0x80);
			return { "time":ms, "type":evType, "status":evStat };
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
		this.getEventName = function(rtype, factory, NFPAcfg) {
			var alarmName = "";
			var NrAlarmsGeneral = NFPAcfg.alarmNames[0].length;
			var NrAlarmsBand = NFPAcfg.alarmNames[1].length;
			var index = rtype;
			if ( index >= 0 && index < NrAlarmsGeneral ) {
				alarmName = NFPAcfg.alarmNames[0][index];
			} else {
				index -= NrAlarmsGeneral;
				if ( index >= 0 && index < NrAlarmsBand ) {
					alarmName = NFPAcfg.alarmNames[1][index];
					alarmName += "  ";
					alarmName += factory.bandNames[0];
				} else {
					index -= NrAlarmsBand; 
					if ( index >= 0 && index < NrAlarmsBand ) {
						alarmName = NFPAcfg.alarmNames[1][index];
						alarmName += "  ";
						alarmName += factory.bandNames[1];
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
			HWFAIL: 	0  ,
			HITEMP: 	1  ,
			ISOLATION: 	2  ,
			OSCILLATION: 	3  ,
			PA_FAIL_UL: 	4  ,
			DOOR_OPEN: 	5  ,
			PREV_GRAL_01: 	6  ,
			PREV_GRAL_02: 	7  ,

			EXTERNAL1: 	8  ,
			EXTERNAL2: 	9  ,
			EXTERNAL3: 	10 ,
			EXTERNAL4: 	11 ,
			PREV_GRAL_11: 	12 ,
			PREV_GRAL_12: 	13 ,
			PREV_GRAL_13: 	14 ,
			PREV_GRAL_14: 	15 ,

			OVERLOAD_UL_B0: 16 ,
			OVERLOAD_DL_B0: 17 ,
			PA_FAIL_DL_B0: 	18 ,
			TX_LOW_DL_B0: 	19 ,
			VSWR_B0: 	20 ,
			RX_LOW_DL_B0: 	21 ,
			PREV_BAND_01: 	22 ,
			PREV_BAND_02: 	23 ,

			OVERLOAD_UL_B1: 24 ,
			OVERLOAD_DL_B1: 25 ,
			PA_FAIL_DL_B1: 	26 ,
			TX_LOW_DL_B1: 	27 ,
			VSWR_B1: 	28 ,
			RX_LOW_DL_B1: 	29 ,
			PREV_BAND_11: 	20 ,
			PREV_BAND_12: 	31 ,

			PA_OFF: 	32 ,
			BOOT: 		126
		};
		this.timediff;
		this.nrRecords;
	}
	this.tableGUI;
	this.subTitle;
	this.dataArea;
	this.refreshButton;
	this.clearButton;
	this.gui = new self.Gui();
	this.gui.create();
	this.clearDataStr = "01";
	this.logDataHeaderLength = 12;
	this.logDataRecordLength = 10;
	this.logDataMaxRecords = 500;
	this.logdata;
}