function onloadInit() {
	eventLog = new EventLog();
	eventLog.reqLogData();
	showResultIcon(ERR_PENDING);
}
function reloadData() {
	if (typeof(eventLog) === "undefined" || !eventLog) {
		eventLog = new EventLog();
	}
	eventLog.reqLogData();
	showResultIcon(ERR_PENDING);
}
function submitform() {

}
function EventLog() {
	var self = this;
	this.reqLogData = function () {
		try {
			var xhr = xmlreq();
			xhr.onreadystatechange  = function(ev) {
				if (this.readyState === 4 && this.status === 200) {
					self.cleartimer();
					var tmout = self.computeTimeoutReqMs();
					self.timerId = setTimeout(function() {
						self.loadLogData();
					}, tmout);
				}
			}
			xhr.onerror = function(ev) {
				self.cleartimer();
				self.timerId = setTimeout(function() {
					self.reqLogData();
				}, 2000);
			}
			xhr.ontimeout = function(ev) {
				self.cleartimer();
				self.timerId = setTimeout(function() {
					self.reqLogData();
				}, 2000);
			}
			xhr.open("POST", self.pageNameMain, true);
			xhr.timeout = 25000;
			xhr.send("log_req="+1);
			xhr = null;
			self.gui.block(true);
		} catch (err) {}
	}
	this.loadLogData = function() {
		try {
			var xhr = xmlreq();
			xhr.onreadystatechange  = function(ev) {
				if (this.readyState === 4 && this.status === 200) {
					self.logdata = this.responseText;
					self.gui.showData()
				}
			}
			xhr.onerror = function(ev) {
				self.cleartimer();
				self.timerId = setTimeout(function() {
					self.loadLogData();
				}, 2000);
			}
			xhr.ontimeout = function(ev) {
				self.cleartimer();
				self.timerId = setTimeout(function() {
					self.loadLogData();
				}, 2000);
			}
			Date.now = Date.now || function() { return +new Date; };
			xhr.open("GET", this.pageNameData+"?co="+Date.now(), true);
			xhr.timeout = 10000;
			xhr.send(null);
			xhr = null;
		} catch (err) {}
	}
	this.clearLogData = function() {
		try {
			var xhr = xmlreq();
			xhr.onreadystatechange  = function(ev) {
				if (this.readyState === 4 && this.status === 200) {
					self.cleartimer();
					self.timerId = setTimeout(function() {
						self.countCheck = 0;
						self.checkResult();
					}, 100);
				}
			}
			xhr.onerror = function(ev) {
			}
			xhr.ontimeout = function(ev) {
			}
			xhr.open("POST", self.pageNameMain, true);
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
						if (++self.countCheck < 50) {
							self.cleartimer();
							self.timerId = setTimeout(function() {
								self.checkResult();
							}, 500);
							return;
						} else {
							error = ERR_FAIL;
						}
					}
					self.showResult(error);
					self.reqLogData();
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
		self.cleartimer();
		self.timerId = setTimeout(function() {
			showResultIcon(ERR_NONE);
		}, 1000);
	}
	this.cleartimer = function() {
		if (typeof(self.timerId) !== "undefined" && self.timerId) {
			clearTimeout(self.timerId);
		}
	}
	this.computeTimeoutReqMs = function() {
		if (window.parent.navi.isEthernetMode) {
			return 1000;
		} else {
			return 100;
		}
	}
	this.Gui = function() {
		this.create = function() {
			this.dataArea = document.getElementById(this.dataAreaId);
			this.refreshButton = document.getElementById(this.refreshButtonId);
			this.clearButton = document.getElementById(this.clearButtonId);
			this.saveButton = document.getElementById(this.saveButtonId);

			this.refreshButton.onclick = function(ev) {
				self.reqLogData();
				self.gui.block(true);
				showResultIcon(ERR_PENDING);
			}
			this.clearButton.onclick = function(ev) {
				self.clearLogData();
				self.gui.block(true);
				showResultIcon(ERR_PENDING);
			}
			this.saveButton.onclick = function(ev) {
				self.gui.downloadFile("AlarmLog.csv");
			}
		}
		this.getLogData = function(fieldSeparator, withBootDelimiters, withHeader) {
			var data="";
			if (self.gui.getLogDataParams(withBootDelimiters) == null) { //time is not updated when alarm log is exported to csv
				return data;
			}
			var factory = new Factory(window.parent.navi.factoryFrame);
			var NFPAcfg = new NFPAconf();
			if ( typeof(window.parent.navi.confNfpaFrame) !== "undefined" ) {
				NFPAcfg.parse(window.parent.navi.confNfpaFrame);
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
				if ( (r.devNr > 0) && (self.gui.EVENTTYPE_REMOTE_EXTALARM4 == r.type) ) {
					// no mostrar alarma 4 de remotos
					continue;
				}
				if ( !firstBootFound ) {
					var recMs = self.gui.deviceTime + r.time;
					var recDate = new Date();
					recDate.setTime(recMs);
					data += self.gui.getDateStr(recDate.getTime());
				} else {
					data += self.gui.getTimeStr(r.time);
				}
				if ( (self.gui.EVENTTYPEBOOT+1) == (r.type+1) ) {
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
				var alarmName = self.gui.getEventName(r.type, factory, NFPAcfg, r.devNr);
				if ( r.type == self.gui.EVENTTYPEPAOFF ) {
					if (r.status) {
						alarmName = "PA STATE OFF";
					} else {
						alarmName = "PA STATE ON";
					}
				}
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
			
			if (self.gui.getLogDataParams(true) == null) {
				self.showResult(ERR_FAIL);
				return;
			}
			self.showResult(ERR_NONE);
			var data = self.gui.getLogData("\t", true, false);
			self.gui.dataArea.value = data;
		}
		this.getLogDataParams = function(updateDeviceTime) {
			try {
				if (typeof(self.logdata.length) === "undefined"
					|| self.logdata.length < self.logDataHeaderLength
					|| !isHex(self.logdata) )
				{
					return null;
				}
				var secs = parseInt(self.logdata.substr(0, 8), 16);
				var n = parseInt(self.logdata.substr(8, 4), 16);
				if (self.logdata.length != 
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
			var ev = parseInt(self.logdata.substr(-p+8, 4), 16);
			var evType = ev & 0xFF;
			var evStat = !!(ev & 0x8000);
			var evDevice = ((ev & 0x7F00) >> 8); // 0 master, 1-8 remotos
			if ( evDevice > self.gui.MAXREMOTES ) {
				return null;
			}
			return { "time":ms, "type":evType, "status":evStat, "devNr":evDevice };
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
		this.getEventName = function(rtype, factory, NFPAcfg, rdevNr) {
			var alarmName = "";
			var NrAlarmsGeneral = NFPAcfg.NUMALARM;
			var NrAlarmsBand = Math.floor(NFPAcfg.alarmNames[1].length / 2);
			var index = rtype;
			if (rdevNr == 0) {
				if ( index >= 0 && index < NFPAcfg.NUMALARM ) {
					alarmName = NFPAcfg.alarmNames[index];
				}
			} else {
				if ( index >= 0 && index < NFPAcfg.remote[0].NUMALARM ) {
					alarmName = "Remote "+rdevNr+": "
					alarmName += NFPAcfg.remote[0].alarmNames[index];
				}
			}
			if ( factory.commomUl ) {
				if ( rdevNr == 0 ) {
					// master
					if ( index >= 6 && index <= 9 ) {
						// isolation, oscillation, antenna disconnection, PA UL
						if ( alarmName.search("B0") >= 0 ) {
							alarmName = alarmName.replace("B0", "");
						}
					} else {
						if ( alarmName.search("B0") >= 0 ) {
							alarmName = alarmName.replace("B0", factory.bandNames[0]);
						} else if ( alarmName.search("B1") >= 0 ) {
							alarmName = alarmName.replace("B1", factory.bandNames[1]);
						}
					}
				} else {
					// remotos
					if ( index == 1 || index == 4 || index == 8 || index == 9 ) {
						// LNA, overload
						if ( alarmName.search("B0") >= 0 ) {
							alarmName = alarmName.replace("B0", "");
						}
					} else {
						if ( alarmName.search("B0") >= 0 ) {
							alarmName = alarmName.replace("B0", factory.bandNames[0]);
						} else if ( alarmName.search("B1") >= 0 ) {
							alarmName = alarmName.replace("B1", factory.bandNames[1]);
						}
					}
				}
			} else {
				if ( alarmName.search("B0") >= 0 ) {
					alarmName = alarmName.replace("B0", factory.bandNames[0]);
				} else if ( alarmName.search("B1") >= 0 ) {
					alarmName = alarmName.replace("B1", factory.bandNames[1]);
				}
			}
			return alarmName;
		}
		this.dataArea;
		this.refreshButton;
		this.clearButton;
		this.dataAreaId = "logdata";
		this.refreshButtonId = "refreshB";
		this.clearButtonId = "clearB";
		this.saveButtonId = "saveB";
		this.Months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		this.EVENTTYPEBOOT = 126;
		this.EVENTTYPEPAOFF = 32;
		this.EVENTTYPE_REMOTE_EXTALARM4 = 13;
		this.timediff;
		this.nrRecords;
		this.MAXREMOTES = 8;
	}
	this.gui = new self.Gui();
	this.gui.create();
	this.pageNameMain = "eventlog.zhtml";
	this.pageNameData = "update_log.shtml";
	this.clearDataStr = "01";
	this.logDataHeaderLength = 12;
	this.logDataRecordLength = 12;
	this.logDataMaxRecords = 500;
	this.logdata;
	this.timerId;
	this.countCheck;
}
var eventLog;