var hpa_settings = [{min: -20, low_alarm: -128, low_warn: -128, high_warn: 19, high_alarm: 22, max: 25 },
		    {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 45 }];
var board_temp_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 80, high_alarm: 85, max: 90 };
var chRfIn_settings = [{min: -110, low_alarm: -121, low_warn: -121, high_warn: 0, high_alarm: 0, max: 0 }, 
		       {min:  -80, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 }];
var chRfOut_settings = [{min: -35, low_alarm: 20, low_warn: 20, high_warn: 36, high_alarm: 40, max: 25 },
			{min: -20, low_alarm: 20, low_warn: 20, high_warn: 36, high_alarm: 40, max: 40 }];
var agc_settings = [{min: 0, low_alarm: 0, low_warn: 0, high_warn: 300, high_alarm: 300, max: 80 },
		    {min: 0, low_alarm: 0, low_warn: 0, high_warn: 300, high_alarm: 300, max: 80 }];
var chRfIn_settings_adj = [{min: -100, low_alarm: -121, low_warn: -121, high_warn: 0, high_alarm: 0, max: 0 }, 
		{min:  -80, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 }];
var frameSeparator = "\t\t\t";

function Page() {
	this.show = function(tags, fact, version, serNr, config) {
		self.tags = tags;
		self.factory = fact;
		self.version = version;
		self.config = config;
		self.nfpa = new PageNfpa(self.factory, self.config);

		if (typeof(serNr) !== 'undefined') {
			self.sernr = serNr;
		}
		self.draw(true);
	}
	this.isAdj = function() {
		return false;
	}
	this.drawMsg = function(msg) {
		var rootEl = document.getElementById(self.id);
		if (!rootEl) {
			rootEl = document.createElement("div");
			rootEl.id = self.id;
		}
		rootEl.innerHTML = msg;
		rootEl.style.fontWeight = "bold";
		rootEl.style.fontSize = "20px";
		document.getElementById(self.parentId).appendChild(rootEl);
	}
	this.draw = function(pageTypeChange) {
		var redraw = pageTypeChange;
		var rootEl = document.getElementById(self.id);
		if (!rootEl) {
			rootEl = document.createElement("div");
			rootEl.id = self.id;
			redraw = true;
		} else if (redraw) {
			remove_element(rootEl);
			rootEl = document.createElement("div");
			rootEl.id = self.id;
		}
		if (redraw) {
			document.getElementById(self.parentId).appendChild(rootEl);
			rootEl.appendChild(self.deepDischarge.getBox());
			var unit = self.createUnit();
			rootEl.appendChild(unit);
	
		}
		self.showTags();
		self.showConfs();
		self.nfpa.show(self.config,isBbuSerialMode(self.config));

		initFormChangeCheck();
	}
	this.close = function() {
		var rootEl = document.getElementById(self.id);
		if (rootEl) {
			remove_element(rootEl);
		}
		self.showChannelsBitmask = 0;
	}

	this.checkFirmwareChange = function() {
		var redraw = false;
		var firmwareNr = (self.factory.commonUl ? 0 : 1);
		if (self.lastFirmwareNr != firmwareNr) {
			redraw = true;
		}
		self.lastFirmwareNr = firmwareNr;
		return redraw;
	}
	this.areEqual = function(x,y){
		if (x.length!=y.length) return false;
		for (var k=0;k<x.length;k++){
			if (x[k]!=y[k]) return false;
		}
		return true;
	}
	this.copy = function(x){
		var y = [];
		for (var k=0;k<x.length;k++){
			y[k] = x[k];
		}
		return y;
	}	

	this.createUnit = function() {
		var unitDiv = document.createElement("div");
		unitDiv.id = "unitDiv";
		unitDiv.className = "unitbox";
		var id = "unitContentDiv";
		var headDiv = this.createUnitHead("TAG","tagName");
		unitDiv.appendChild(headDiv);
		var unitContent = document.createElement("div");
		unitContent.id = id;
		unitDiv.appendChild(unitContent);
		//ALARM INTERFACE
		id = "contentDivAlarm";
		var headDiv = this.createUnitHead("ALARM INTERFACE");
		headDiv.id = "headDivAlarm";
		unitContent.appendChild(headDiv);		
		var contentDiv = document.createElement("div");
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = id;
		contentDiv.min = false;
		var tab = this.createAlarmInterface();
		contentDiv.appendChild(tab);
		headDiv.style.display = "block";
		contentDiv.style.display = "block";
		//FIBER INTERFACE
		id = "contentDivFO";
		var headDiv = this.createUnitHead("FIBER OPTIC INTERFACE");
		headDiv.id = "headDivFO";
		unitContent.appendChild(headDiv);		
		var contentDiv = document.createElement("div");
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.min = false;
		contentDiv.id = id;
		var tab = this.createFOInterface();
		contentDiv.appendChild(tab);
		//ALARM CONFIG: BBU PARAMETERS
		id = "contentDivBBU";
		var headDiv = this.createUnitHead("BATTERY&nbsp;BACKUP&nbsp;PARAMETERS");
		headDiv.id = "headDivBBU";
		unitContent.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = id;
		var tab = self.nfpa.createBatteryBackupParameters();
		contentDiv.appendChild(tab);
		if (!self.nfpa.bbuSerialMode) {
			headDiv.style.display = "none";
			contentDiv.style.display = "none";
		}
		//ALARM CONFIG: RELAYS
		id = "contentDivAlarmC";
		var headDiv = this.createUnitHead("CONFIGURATION&nbsp;ALARMS");
		headDiv.id = "headDivAlarmC";
		unitContent.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		contentDiv.id = id;
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = self.nfpa.createRelayConfig();
		contentDiv.appendChild(tab);
		//ALARM CONFIG: ALARM THRESHOLDS
		id = "contentDivThreshold";
		var headDiv = this.createUnitHead("ALARM&nbsp;THRESHOLDS");
		headDiv.id = "headDivThreshold";
		unitContent.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		contentDiv.id = id;
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = self.nfpa.createAlarmThresholds();
		contentDiv.appendChild(tab);
		return unitDiv;
	}
	this.displayFOinterface = function(doShow) {
		try {
			var el = document.getElementById("headDivFO");
			el.style.display = ( doShow ? "block" : "none" );
			var el = document.getElementById("contentDivFO");
			var min = el.getAttribute("min");
			if (!min) el.style.display = ( doShow ? "block" : "none" );
		} catch(e){}
	}
	this.blockContent = function(doblock) {

		if (doblock) {
			self.displayFOinterface(false);
		}
		document.getElementById("headDivAlarm").style.display = doblock ? "none":"block";
		document.getElementById("contentDivAlarm").style.display = doblock ? "none":"block";
		document.getElementById("headDivBBU").style.display = doblock ? "none":"block";
		document.getElementById("contentDivBBU").style.display = doblock ? "none":"block";
		document.getElementById("headDivAlarmC").style.display = doblock ? "none":"block";
		document.getElementById("contentDivAlarmC").style.display = doblock ? "none":"block";
		document.getElementById("headDivThreshold").style.display = doblock ? "none":"block";
		document.getElementById("contentDivThreshold").style.display = doblock ? "none":"block";

	}
	this.createUnitHead = function(title,idt) {
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
		cell.style.width = "100px";	
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
		cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);
		return box;
	}
	this.showTags = function() {
		try {
			var el = document.getElementById("tagName");
			if(typeof String.prototype.trim !== 'function'){
				String.prototype.trim = function() {
					return this.replace(/^\s+|\s+$/g, '');
				}
			}
			var name = entify(self.tags.tag);
			el.innerHTML = name.trim();
		} catch (err) {}
	}
	this.showTag = function() {
		try {
			var el = document.getElementById("tagName");
			if(typeof String.prototype.trim !== 'function'){
				String.prototype.trim = function() {
					return this.replace(/^\s+|\s+$/g, '');
				}
			}
			var name = entify(self.tags.tag);
			el.innerHTML = name.trim();

		} catch (err) {}
	}
	this.showTagBlocked = function() {
		try {
			var el = document.getElementById("tagName");
			el.innerHTML = "BLOCKED";
		} catch (err) {}
	}
	this.createAlarmInterface = function(){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		
		var rowb = document.createElement("tr");
		tab.appendChild(rowb); 

		var cell = this.createAlarmTable();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = 2;
		
		var cell = this.createMasterContent();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		
		var cell = this.createRelayTable();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = 2;
			
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		
		var cell = this.createBbuTypeOfConnectionContent();
		rowb.appendChild(cell);
		cell.className="contentcell";

		return tab;
	}
	this.createAlarmTable = function(){
		var cellb = document.createElement("td");
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.className = "cth";
		cell.innerHTML = "GENERAL ALARMS";
		cell.colSpan = 2;
		row.appendChild(cell);
		if (!self.factory.commonUl){//VU. Se eliminan UL Pa Fail / Ant. Disconnection como gral alarm (en remoto es incondicional)
			self.config.globalAlarmsInstalled[4] = false;
			self.config.globalAlarmsInstalled[5] = false;
		}
		//fiberAlarms se dejan de tratar como generalAlarms y reciben tratamiento específico en master
		self.config.globalAlarmsInstalled[6] = false;
		self.config.globalAlarmsInstalled[7] = false;

		for (var k=0;k<self.config.globalAlarmsInstalled.length;k++){
			var show = self.config.globalAlarmsInstalled[k];
			if (k>=16) show = false;
			var alName = self.config.alarmNames[0][k];
			tb.appendChild(this.createGralAlarm(k,alName,show));
		}
		var bbuSerialMode = isBbuSerialMode(self.config);
		var row = document.createElement("tr");
		row.style.minHeight = "20px";
		tb.appendChild(row);
		var row = document.createElement("tr");
		row.id = "BBUalarmsHeaderRow";
		if (!bbuSerialMode) {
			row.style.display = "none";
		}
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.className = "cth";
		cell.innerHTML = "BBU ALARMS";
		cell.colSpan = 2;
		row.appendChild(cell);
		for (var k=0;k<self.config.bbuAlarmsInstalled.length;k++){
			var show = self.config.bbuAlarmsInstalled[k]&&bbuSerialMode;
			tb.appendChild(this.createBbuAlarm(k,self.config.alarmNamesBbu[k],show));
		}	
		return cellb;
	}
	this.createRelayTable = function(){
		var cellb = document.createElement("td");
		var tbl = document.createElement("table");
		tbl.align = "center";
		tbl.style.marginRight = "5px;"
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = "RELAY&nbsp;STATUS";
		cell.className = "cth";
		cell.colSpan = 9;
		row.appendChild(cell);
		var row = document.createElement("tr");
		tb.appendChild(row);		
		var cell = document.createElement("th");
		cell.colSpan = 3;
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
		cell.innerHTML = "Enabled";
		row.appendChild(cell);			
		var cell = document.createElement("th");
		cell.colSpan = 2;
		cell.innerHTML = "Status";
		row.appendChild(cell);		
		var nrOfRelaysSupported = getNrOfRelaysSupported(self.config);
		for (var k=0;k<this.config.NR_OF_RELAYS_MAX*2;k++){
			var row = document.createElement("tr");
			row.id = "RelayRow_"+k;
			if (k >= 2*nrOfRelaysSupported) {
				row.style.display = "none";
			}
			tb.appendChild(row);
			if ((k % 2)==0){
				var cell = document.createElement("th");
				cell.innerHTML = "RELAY&nbsp"+(k/2+1);
				cell.className = "thdrht";
				cell.rowSpan = 2;
				cell.style.paddingLeft = "4px";
				row.appendChild(cell);
				var cell = document.createElement("th");
				cell.innerHTML = "Delay";
				cell.className = "thdrht";
				row.appendChild(cell);
				var cell = document.createElement("td");
				cell.style.paddingLeft = "2px";
				cell.style.paddingRight = "2px";
				cell.className = "tabval";
				cell.style.width = "85px";
				cell.style.textAlign = "right";
				cell.id = "timerStat_"+(k/2)+"_0";
				row.appendChild(cell);
				for (var j=2;j>=0;j--) row.appendChild(this.createDelayLatchTime(j,0,k/2));
				var cell = this.createDelayLatchButton(0,k/2);
				cell.style.textAlign = "center";
				row.appendChild(cell);			
				var cell = document.createElement("th");
				cell.id = "relStat_"+(k/2);
				cell.style.width = "25px";
				cell.style.paddingLeft = "4px";
				row.appendChild(cell);
				cell.rowSpan = 2;
				var cell = document.createElement("td");
				cell.id = "relStatImg_"+(k/2);
				cell.style.width = "38px";
				//cell.style.paddingLeft = "4px";
				cell.style.textAlign = "center";
				row.appendChild(cell);
				cell.rowSpan = 2;
			}else{
				var cell = document.createElement("th");
				cell.innerHTML = "Latch";
				cell.className = "thdrht";			
				row.appendChild(cell);				
				var cell = document.createElement("td");
				cell.style.paddingLeft = "2px";
				cell.style.paddingRight = "2px";
				cell.className = "tabval";
				cell.style.width = "85px";
				cell.style.textAlign = "right";
				cell.id = "timerStat_"+((k-1)/2)+"_1";		
				row.appendChild(cell);								
				for (var j=2;j>=0;j--) row.appendChild(this.createDelayLatchTime(j,1,(k-1)/2));
				var cell = this.createDelayLatchButton(1,(k-1)/2);
				cell.style.textAlign = "center";
				row.appendChild(cell);
			}
		}
		return cellb;
	}
	this.relayStateSet=function(nrelay,openclose,onoff){
		var isNormalACPowerRelay = (isBbuSerialMode(self.config)) && self.config.isRelayAssignNormalACpowerExclusive(nrelay);
		var el = document.getElementById("relStat_"+nrelay);
		if (!isNormalACPowerRelay) {
			el.innerHTML = onoff?"Alarm<br/>ON":"Alarm<br/>OFF";
		} else {
			el.innerHTML = "";
		}
		el = document.getElementById("relStatImg_"+nrelay);
		el.innerHTML = "<img src="+(openclose?"open":"closed")+".png><br>"+(openclose?"Open":"Closed");
		if (!isNormalACPowerRelay) {
			el.style.color = onoff?'#ffffff':'#000000';
			el.style.backgroundColor = onoff?"#e20000":"white";
		} else {
			el.style.color = '#000000';
			el.style.backgroundColor = "white";
		}
	}
	this.createDelayLatchButton = function(dl,nrelay){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "dl_onoff_"+dl+"_"+nrelay;
		el.name = el.id;
		el.type = "checkbox";
		cell.appendChild(el);
		return cell;		
	}
	this.delayLatchOnOffSet = function(dl,nrelay,val){
		var el = document.getElementById("dl_onoff_"+dl+"_"+nrelay);
		el.checked = !!val;
	}
	this.delayLatchOnOffGet = function(dl,nrelay){
		var el = document.getElementById("dl_onoff_"+dl+"_"+nrelay);
		return el.checked;
	}	
	this.createDelayLatchTime = function(hms,dl,nrelay) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "dl_time_"+hms+"_"+dl+"_"+nrelay;
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "32px";
		el.allowInfiniteValue = (dl==1 && hms==2); //permite el valor 9999 en el campo hours de timer Latch
		el.max = hms==2?1000:59;
		el.min = 0;
		el.value = hms==2?24:0;
		
		if (hms==0)
			el.title = "Min: 0sec, Max: 59sec";
		else if (hms==1)
			el.title = "Min: 0min, Max: 59min";
		else{
			var titl = "Min: 0hours, Max: 1000hours"
			if (dl==1) titl += " ; Infinte: 9999hours"
			el.title = titl;
		}
			
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var target = this;
			var num = ~~target.value;
			var max = ~~target.max;
			var min = ~~target.min;
			var allowInf = target.allowInfiniteValue;
			if (num < min) {
				target.value = min;
			} else if (num > max && !(allowInf && target.value==9999)) { //excepción para permitir hours = 9999
				target.value = max;
			} else {
				target.value = num;
			}
		}		
		cell.appendChild(el);
		return cell;
	}
	this.delayLatchTimeSet = function(dl,nrelay,val){
		var times = [0,0,0];
		var res;
		times[2] = Math.floor(val/3600);
		res = ~~(val-3600*times[2]);
		times[1] = Math.floor(res/60);
		times[0] = res % 60;
		for (var k=0;k<3;k++){
			var el = document.getElementById("dl_time_"+k+"_"+dl+"_"+nrelay);
			el.value = times[k];
		}
	}
	this.delayLatchTimeGet = function(dl,nrelay){
		var	res = parseInt(document.getElementById("dl_time_0_"+dl+"_"+nrelay).value);
		res +=  60*parseInt(document.getElementById("dl_time_1_"+dl+"_"+nrelay).value);
		res +=  3600*parseInt(document.getElementById("dl_time_2_"+dl+"_"+nrelay).value);
		return res;
	}
	this.delayLathTimeStatSet = function(dl,nrelay,val,running,noShow){
		var times = [0,0,0];
		var res;
		if (noShow){
			document.getElementById("timerStat_"+nrelay+"_"+dl).innerHTML = "--Infinite--";
			return;
		}
		if (running){
			times[2] = Math.floor(val/3600);
			res = ~~(val-3600*times[2]);
			times[1] = Math.floor(res/60);
			times[0] = res % 60;
		}
		var str = "";
		str += times[2] + "h&nbsp;";
		str += ("0"+times[1]).substr(-2,2) + "m&nbsp;";
		str += ("0"+times[0]).substr(-2,2) + "s";
		document.getElementById("timerStat_"+nrelay+"_"+dl).innerHTML = str;
	}
	this.createMasterContent = function(){
		var cellb = document.createElement("td");
		var tab2 = document.createElement("table");
		tab2.style.borderCollapse = "separate";
		tab2.style.borderSpacing = "2px 2px";
		tab2.style.width = "100%";	
		cellb.appendChild(tab2);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		var cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createMasterGralCtrl();
		cell.appendChild(el);
		return cellb;
	}
	this.createMasterGralCtrl = function() {
		var box = document.createElement("div"); 
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		box.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = "GENERAL PARAMETERS";
		cell.className = "cth";
		cell.colSpan = 4; 
		row.appendChild(cell);
		row = document.createElement("tr");
		row.style.height = "5px";
		tb.appendChild(row);
		//RESET
		row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);		
		var cell = document.createElement("td");
		cell.appendChild(this.createUnitReset(0, 0));
		row.appendChild(cell);
		//FIRMWARE
		row = document.createElement("tr");
		tb.appendChild(row);
		this.createFirmwareSelect(row);
		//TEMPERATURE
		row = createMetRow("boardTemp", board_temp_settings, "Temperature", "&ordm;C", 50);
		row.style.height = "22px";
		tb.appendChild(row);
		row = document.createElement("tr");
		tb.appendChild(row);
		return box;
	}

	this.createUnitReset = function(band) {
		var box = document.createElement("div");
		var reset = document.createElement("input");
		reset.id = "reset"+band;
		reset.name = reset.id;
		reset.type = "button";
		reset.value = "RESET";
		reset.className = "resetbutton";
		reset.onclick = function() { submitform(true); } 
		box.appendChild(reset);
		return box;
	}
	this.resetDisableStateSet = function(disable) {
		try {
			var el = document.getElementById("reset");
			el.disabled = disable? true : false;
		} catch (err) {}
	}
	this.boardTempSet = function(val) {
		setMetValue("boardTemp", val);
	}
	
	this.createGralAlarm = function(num,txt,show){
		var row = document.createElement("tr");
		row.id = "generalAlarmRow_"+num;
		var cell = document.createElement("th");
		cell.style.width = "70%";
		cell.style.maxWidth = "135pt";
		cell.style.overflow = "hidden";
		row.appendChild(cell);
		if (num==11)
			cell.innerHTML = "Force RF OFF";
		else
			cell.innerHTML = txt;
		cell.className = "thdrht";
		cell.style.fontSize = "10px";
		cell = createLedBox("gralAlarm_"+num);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
		var nosh = (!show)||(num==6)||(num==7);
		row.style.display = (nosh)?"none":"table-row";
		return row;
	}
	this.gralAlarmSet = function(num, alarm) {
		ledSetColor("gralAlarm_"+num, alarm ? "red" : "grey");
	}
	this.opticalAlarmDisplay = function(opticalLinkNr, show) {
		try {
			var alarmNr;
			alarmNr = opticalLinkNr+16; //alarmas de fibra son alarmas generales 16 a 23
			document.getElementById("generalAlarmRow_"+alarmNr).style.display = (show ? "table-row":"none");

		} catch(e){}
	}	

	this.createBbuAlarm = function(num,txt,show){
		var row = document.createElement("tr");
		row.id = "BbuAlarmRow_"+num;
		var cell = document.createElement("th");
		cell.style.width = "70%";
		cell.style.maxWidth = "110pt";
		cell.style.overflow = "hidden";
		row.appendChild(cell);
		if (txt != "Battery Charger Fail") {
			cell.innerHTML = txt;
		} else  {
			var cont = document.createElement("span");
			cont.innerHTML = txt;
			cell.appendChild(cont);
			cont = document.createElement("span");
			cont.innerHTML = "&nbsp;&nbsp;"
			cell.appendChild(cont);
			cont = document.createElement("span");
			cont.id = "ChargerErrorCodeId";
			cont.style.paddingLeft = cont.style.paddingRight = "3px";
			cont.style.backgroundColor = "white";
			cont.style.outline = "thin solid grey";
			cont.style.display = "inline-block";
			cont.style.minWidth = "25px";
			cont.style.minHeight = "10px";
			cont.style.visibility = "hidden";
			cell.appendChild(cont);
		}
		cell.className = "thdrht";
		cell.style.fontSize = "10px";
		cell = createLedBox("bbuAlarm_"+num);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
		row.style.display = show?"table-row":"none";
		return row;
	}
	this.bbuAlarmSet = function(num,alarm, ChargerErrorCodeValue) {
		var id = "bbuAlarm_"+num;
		var color = "grey";
		if (alarm) {
			color = num>0?"red":"green";
		}
		ledSetColor(id, color);
		if (num == 3) {
			// Battery Charger Fail
			var el = document.getElementById("ChargerErrorCodeId");
			if (!alarm) {
				el.style.visibility = "hidden";
				el.style.outline = "none";
			} else if (typeof(ChargerErrorCodeValue) != "undefined") {
				var str = ChargerErrorCodeValue.toString(16).toUpperCase();
				el.innerHTML = ("0000"+str).slice(-4);
				// From info by G.A. and F.B.: this feature is not implemented in charger board and must be hidden
				// el.style.visibility = "visible";
				// el.style.outline = "thin solid grey";
				el.style.visibility = "hidden";
				el.style.outline = "none";
			}
		}
	} 
	this.bbuAlarmsShow = function() {
		var bbuSerialMode = isBbuSerialMode(this.config);
		var bbuAlarmShowTable = bbuSerialMode;
		var nrOfRelaysSupported = getNrOfRelaysSupported(this.config);
		var el = document.getElementById("BBUalarmsHeaderRow");
		try {
			el.style.display = (bbuAlarmShowTable? "table-row":"none");
		} catch(e){}
		for (var k=0;k<self.config.bbuAlarmsInstalled.length;k++){
			var alarmInstalled = self.config.bbuAlarmsInstalled[k];
			var show = alarmInstalled&&bbuAlarmShowTable;
			if (self.config.bbu_type==2 && k==10) show=false;   // battery bank alarm not available in H.P. bbu
			var el = document.getElementById("BbuAlarmRow_"+k);
			try {
				el.style.display = (show? "table-row":"none");
			} catch(e){}
		}
		// number of relays to show can be: 4 if dry-contact mode and, 10 (fip519) or 8+1 (fip421) in serial mode
		for (var relayNr=7; relayNr < this.config.NR_OF_RELAYS_MAX; relayNr++) {
			var show = (bbuSerialMode && (relayNr < nrOfRelaysSupported));
			for (var i = 0; i < 2; i++) {
				var k = relayNr*2 + i;
				var el = document.getElementById("RelayRow_"+k);
				try {
					el.style.display = (show?"table-row":"none");
				} catch(e){}
			}
		}
	}
	this.updateRelayShow = function(monitor) {
		var bbuSerialMode = isBbuSerialMode(self.config);
		var nrOfRelaysSupported = getNrOfRelaysSupported(self.config);
		var statusBbuSerialMode = monitor.getBbuSerialMode();
		var statusNrOfRelaysSupported = monitor.getNrOfRelaysSupported();
		var reloadRequired = ((bbuSerialMode != statusBbuSerialMode) || (nrOfRelaysSupported != statusNrOfRelaysSupported));
		if (reloadRequired) {
			if (!reloadIcon){
				showResultIcon(ERR_RELOAD);
				reloadIcon = true;
			}
		}
		return reloadRequired;
	}
	this.getAlarmConf = function(cnf){
		for (var k=0;k<cnf.NR_OF_RELAYS_MAX;k++){
			cnf.delayTimerON[k] = this.delayLatchOnOffGet(0,k);
			cnf.latchTimerON[k] = this.delayLatchOnOffGet(1,k);
			cnf.delayTimer[k] = this.delayLatchTimeGet(0,k);
			cnf.latchTimer[k] = this.delayLatchTimeGet(1,k);
		}
		cnf.bbu_serial_mode = self.readBbuTypeOfConnection();

		return cnf;
	}
	this.showConfs = function() {

		self.bbuAlarmsShow();
		this.masterFirmwareSet(self.factory.commonUl ? 0:1);

		self.showBbuTypeOfConnection(self.config.bbu_serial_mode);
		//relay timers
		for (var k=0;k<self.config.NR_OF_RELAYS_MAX;k++){
			this.delayLatchOnOffSet(0,k,self.config.delayTimerON[k]);
			this.delayLatchOnOffSet(1,k,self.config.latchTimerON[k]);
			this.delayLatchTimeSet(0,k,self.config.delayTimer[k]);
			this.delayLatchTimeSet(1,k,self.config.latchTimer[k]);
		}
		try{
			var el = window.parent.head.document.getElementById('maintab');
			var w =  document.getElementById("headDivAlarm").getBoundingClientRect().width;
			el.style.width = w+'px';		
		} catch(e) {}
	}
	this.readConfsFrm = function(isReset, isClearErrors, forceSend, doSetDefaultRelay) {
		var cnf = new Config();
		cnf.parse(self.config.frm,self.factory);
		var frm = [];

		if (isReset) {
			cnf.resetSoft = true;
			frm.push(cnf.getFrm());
			return frm;
		}
		if (isClearErrors) {
			cnf.FOclearErrorCounters = true;
			frm.push(cnf.getFrm());
			return frm;
		}
		if (doSetDefaultRelay){
			cnf.bbu_serial_mode = self.readBbuTypeOfConnection();
			cnf.setDefaultRelayAssign(cnf.bbu_serial_mode);
			frm.push(cnf.getFrm());
			return frm;
		}
		cnf.resetSoft = false;

		cnf = self.getAlarmConf(cnf);
		self.nfpa.readConf(cnf);
		var fr = cnf.getFrm();
		if (self.config.frm != fr || forceSend) {
			frm.push(fr);
		}
		return frm;
	}

	this.showStatus = function(monitor) {
		self.blockedSet(monitor.blocked);
		if (self.blocked) return;

		self.boardTempSet(monitor.boardTemp);
		
		for (var k=0;k<monitor.gralAlarm.length;k++){
			self.gralAlarmSet(k, monitor.gralAlarm[k]);
		}
		for (var k=0;k<self.config.NR_OF_RELAYS_MAX;k++){
			var noShow = self.config.latchTimerON[k] && (self.config.latchTimer[k]>=35996400); //hours = 9999
			self.delayLathTimeStatSet(0,k,monitor.delayTimer[k],monitor.delayTimerRunning[k],false);
			self.delayLathTimeStatSet(1,k,monitor.latchTimer[k],monitor.latchTimerRunning[k],noShow);
			self.relayStateSet(k,monitor.relayOpenClosed[k],monitor.relayONOFF[k]);
		}
		
		for (var k=0;k<16;k++){
			self.bbuAlarmSet(k, monitor.bbuAlarm[k], monitor.bbuChargerErrorCode);
		}
		if (self.config.bbu_serial_mode) {
			if ( monitor.isBbuDisconnectionAlarm() ) {
				self.isBbuConnected = false;
			} else {
				if ( !self.isBbuConnected ) {
					self.updateRelayShow(monitor);
				}
				self.isBbuConnected = true;
			}
		}

		self.showFOstatus(monitor);
		self.deepDischarge.showDeepDischargeMvo2(monitor.bbuDeepDischarge, self.config);
		self.nfpa.showStatus(monitor);
		
	}

	this.blockedSet = function(doblock) {
		if ( doblock ) {
			if ( self.blocked ) {
				return;
			}
			self.blocked = true;
			self.blockContent(self.blocked);
			self.showTagBlocked();

		} else {
			if ( !self.blocked ) {
				return;
			}
			self.blocked = false;
			self.blockContent(self.blocked);
			self.showTag();
		}
	}

	this.createFOInterface = function() {
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		
		var cell = this.createFOAlarmTable();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		
		var cell = this.createFOCtrlTable();
		rowb.appendChild(cell);
		cell.className = "contentcell";

		return tab;
	}
	this.createFOCtrlTable = function() {
		var cellb = document.createElement("td");
		cellb.style.verticalAlign = "middle";
		var tbl = document.createElement("table");
		tbl.align = "center";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		row.appendChild(this.createClearFiberErrors());
		return cellb;
	}
	this.FOalarmLabels = ["Active Link", "Remote Port", "Loss<br>Communication", "Loss Optical<br>Signal",
		"FO Transceiver<br>Status", "Rx Power<br>(dBm)", "Error Count"];
	this.FOalarmBaseID = ["ActiveLink", "remotePort", "LossCommunication", "LossOpticalSignal",
		"FOTransceiverStatus", "FORxPower", "ErrorCount"];
	this.createFOAlarmTable = function() {
		var nports = 8;
		var cellb = document.createElement("td");
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		row.style.minHeight = "20px";
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.id = "portCell_0";
		row.appendChild(cell);
		var nCols = this.FOalarmLabels.length;
		for (var k = 0; k < nCols; k++) {
			var cell = document.createElement("th");
			cell.className = "thdrht";
			cell.innerHTML = this.FOalarmLabels[k];
			cell.style.minWidth = "20pt";
			cell.style.textAlign = "center";
			cell.style.paddingLeft = "inherit";
			cell.id = this.FOalarmLabels[k];
			cell.style.display = (k==0)?"none":"table-cell";//hide active link
			row.appendChild(cell);
		}
		for (var port = 0; port < nports; port++) {
			var row = document.createElement("tr");
			row.id = "FOportInfo_"+port;
			row.style.display = "none";
			row.style.minHeight = "20px";
			tb.appendChild(row);
			var cell = document.createElement("th");
			cell.id = "portCell_"+(port+1);
			cell.className = "thdrht";
			cell.style.minWidth = "10pt";
			row.appendChild(cell);
			var el = document.createElement("a");
			var title = "OPTICAL PORT "+(port+1);
			el.innerHTML = title;
			el.id = "linknumbertitle";
			cell.appendChild(el);
			var idx = 1;
			el.className = "m";
			el.href = "/optLinkE.html?p="+port;
			el.oport = port;
			el.onclick = function(ev) {self.optPopup(~~this.oport);return false;};
			cell.appendChild(el);
			for (var k = 0; k < nCols; k++) {
				var id = this.FOalarmBaseID[k]+"_"+port;
				if (k < 5 && k!=1) {
					var cell = createLedBox(id);
				} else {
					var cell = document.createElement("td");
					cell.id = id;
					cell.className = "tabval";
					cell.style.textAlign = "center";
					cell.style.minWidth = "30px";
				}
				if (k==0) cell.style.display = "none"; //hide active link
				row.appendChild(cell);
			}
		}
		return cellb;
	}
	this.createClearFiberErrors = function() {
		var cell = document.createElement("td");
		cell.colSpan = 2;
		cell.style.textAlign = "center";
		var el = document.createElement("input");
		el.id = "clearFiberErrors";
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.width = "120px";
		el.style.height = "20px";
		el.style.fontWeight = "bold";
		el.value = "Clear Error Counters";
		el.onclick = function(ev) {
			submitform(false,true);
		}
		cell.appendChild(el);
		return cell;
	}

	this.showFOstatus = function(monitor) {
		self.displayFOinterface(!monitor.blocked);
		var nports = 8;
		for ( var port = 0; port < nports; port++ ) {
			for (var k = 1; k < this.FOalarmBaseID.length; k++) {
				var id = this.FOalarmBaseID[k]+"_"+port;
				if (k < 5 && k!=1) {
					var color = "grey";
					switch (k) {
						case 2: 
						{
							color = monitor.FOlossCommunication[port] ? "red" : "green";
							break;
						}
						case 3:
						{
							color = monitor.FOlossOpticalSignal[port] ? "red" : "green";
							break;
						}
						case 4:
						{
							if (  monitor.FOtransceiverAlarm[port] ) {
								color = "red";
							} else if ( monitor.FOtransceiverWarning[port] ) {
								color = "yellow";
							} else {
								color = "green";
							}
							break;
						}
					}
					if (!monitor.FOmoduleConnected[port]) {
						color = "grey";
					}
					ledSetColor(id, color);
				} else {
					var cell = document.getElementById(id);
					var val = "";
					switch (k) {
						case 1: val = monitor.FOlossCommunication[port]?'---':(port==7?'MASTER':monitor.FORemotesOpticalPort[port]+1); break;
						case 5: val = monitor.FORxPow[port].toFixed(1); break;
						case 6: val = monitor.FOerrors[port]; break;
					}
					if (!monitor.FOmoduleConnected[port]) {
						val = "";
					}
					try { cell.innerHTML = val; } catch(e){}
				}
			}
		}

		self.setFOactiveOpticalLink(monitor);
		self.fibersUpdateDisplay(monitor);
	}
	this.setFOactiveOpticalLink = function(monitor) {
		for (var port = 0; port < 2; port++) {
			var id = this.FOalarmBaseID[0]+"_"+port;
			var color = "grey";
			if (monitor.FOActiveOpticalLink == 0 && port == 0) {
				color = "green";
			} else if (monitor.FOActiveOpticalLink == 1 && port == 1) {
				color = "green";
			}
			if (!monitor.FOmoduleConnected[port]) {
				color = "grey";
			}
			ledSetColor(id, color);
		}
	}
	this.fibersUpdateDisplay = function(monitor) {
		var nports = 8;
		for (var port = 0; port < nports; port++) {
			document.getElementById("FOportInfo_"+port).style.display = monitor.FOmoduleConnected[port]? "table-row":"none";
			self.opticalAlarmDisplay(port, monitor.FOmoduleConnected[port]);
		}
	}

	this.optPopup = function(port) {
		if (self.optPopupWindow && !self.optPopupWindow.closed)
			self.optPopupWindow.close();
		var w = 640;
		var h = 280;
		var left = (screen.width/2)-(w/2);
		var top = (screen.height/2)-(h/2);
		var url = "/optLinkE.html?p="+port;
		var name = "Optical_Link";
		var wspecs = 'resizable=1,scrollbars=1,toolbar=no,menubar=no,directories=no,status=no,titlebar=no,height='+h+',width='+w+',left='+left+',top='+top;
		self.optPopupWindow = window.open(url, name, wspecs);
	}
	this.createBbuTypeOfConnectionContent = function(){
		var cellb = document.createElement("td");
		cellb.id = "bbuTypeOfConnectionCell";
		var tab2 = document.createElement("table");
		tab2.style.borderCollapse = "separate";
		tab2.style.borderSpacing = "2px 2px";
		tab2.style.width = "100%";
		cellb.appendChild(tab2);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		var cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createBbuTypeOfConnectionBox();
		cell.appendChild(el);	
		return cellb;
	}
	this.createBbuTypeOfConnectionBox = function() {
		var box = document.createElement("div");
		box.id = 'bbuTypeOfConnectionBox';
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		box.appendChild(tbl);
		tbl.style.borderCollapse = "separate";
		tbl.style.borderSpacing = "2px 2px";
		tbl.style.width = "100%";
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = "TYPE&nbsp;OF&nbsp;BBU&nbsp;CONNECTION";
		cell.className = "cth";
		cell.colSpan = 6;
		row.appendChild(cell);		
		row = document.createElement("tr");
		tb.appendChild(row);			
		this.createBbuTypeOfConnection(row);
		return box;
	}
	this.showBbuTypeBox = function(doShow) {
		try {
			var el = document.getElementById('bbuTypeOfConnectionCell');
			el.style.display = doShow ? "table-cell":"none";
		} catch(err) {}		
	}
	this.createBbuTypeOfConnection = function(row) {
		var cell = document.createElement('th');
		cell.innerHTML = "Type of BBU Connection";
		cell.className = "thdrht";
		row.appendChild(cell);
		cell = document.createElement('td');
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "bbuTypeOfConnection";
		el.name = el.id;
		el.self = this;
		var opts = [ "Dry Contacts", "Serial" ];
		var max_opts = opts.length;
		for (var i = 0; i < max_opts; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.onchange = function(ev) {
			var alertMsg = "NOTICE:\nWith this action, relay assignment settings will be configured to default values.\nPlease confirm.";
			if (confirm(alertMsg)) {
				submitform(false, false, false, true);
			}else{
				self.showBbuTypeOfConnection(self.config.bbu_serial_mode);
			}
		}
		el.selectedIndex = 1;
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.style.width = "140px";
		el.style.textAlign = "right";
		cell.style.verticalAlign = "middle";
		cell.appendChild(el);
	}
	this.showBbuTypeOfConnection = function(value) {
		if ( typeof(value) === 'undefined' || isNaN(value) ) {
			return;
		}
		value = ~~value;
		try {
			var el = document.getElementById('bbuTypeOfConnection');
			if ( value >= el.options.length ) {
				value = 0;
			}
			el.selectedIndex = value;
		} catch(err) {}
	}
	this.readBbuTypeOfConnection = function() {
		try {
			var el = document.getElementById('bbuTypeOfConnection');
			return el.selectedIndex;
		} catch(err) { return 0; }
	}
	this.createFirmwareSelect = function(mRow){
		var cell = document.createElement("th");
		cell.innerHTML = "Firmware Band";
		cell.className = "thdrht";
		mRow.appendChild(cell);
		cell = document.createElement("td");
		cell.colSpan = 3;
		cell.style.paddingLeft = "15px";
		mRow.appendChild(cell);
		var el = document.createElement("select");
		el.id = "firmwareBand";
		el.name = el.id;
		var opts = ['700/800 MHz','VHF/UHF'];
		for (var i = 0; i < opts.length; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.onchange = function(){
			var color;
			if (this.selectedIndex == 0) {
				color = (self.factory.commonUl ? "white":"yellow");
			} else {
				color = (self.factory.commonUl ? "yellow":"white");
			}
			this.style.backgroundColor = color;
		}
		el.style.minWidth = "112px";
		cell.appendChild(el);
	}

	this.masterFirmwareSet = function(val){
		try {
			var el = document.getElementById("firmwareBand");
			el.selectedIndex = (val != 0);
			var color;
			if (el.selectedIndex == 0) {
				color = (self.factory.commonUl ? "white":"yellow");
			} else {
				color = (self.factory.commonUl ? "yellow":"white");
			}
			el.style.backgroundColor = color;
		} catch (err) { }
	}
	this.masterFirmwareGet = function(){
		try {
			var el = document.getElementById("firmwareBand");
			return el.selectedIndex;
		} catch (err) { return 0; }
	}
	this.masterFimwareIsChanged = function(){
		var currentFw =  (self.factory.commonUl ? 0:1);
		var selectedFw = this.masterFirmwareGet();
		return (currentFw != selectedFw);
	}

	var self = this;
	this.tags = null;
	this.version = null;
	this.sernr = new SerialNrT();
	
	this.id = 'rootElement';
	this.parentId = 'page';
	this.showFiltersMask = [];
	this.blocked = false;
	this.lastFirmwareNr = -1;
	this.deepDischarge = new createDeepDischargeBox();
	this.isBbuConnected = false;
	this.nfpa = null;
}

function createMetCell(id, s) {
	var tdNode = document.createElement("td");
	tdNode.id = "met_"+id;
	var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn, 40);
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
function createTextCell(id,w) {
	var tdNode = document.createElement("td");
	tdNode.id = "txt_"+id;
	tdNode.style.minWidth = w==1?"43px":"36px"; //(pasando directamente el width no iba)
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	return tdNode;
}

function createMetRow(id, s, title, units, w) {
	var trNode = document.createElement("tr");
	var tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = title;
	tdNode.className = "thdrht";
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "met_"+id;
	var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn, w);
	met.attachTo(tdNode);
	met.valueSet(s.min);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "txt_"+id;
	tdNode.style.minWidth = "50px";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	tdNode.innerHTML = "0";
	tdNode = document.createElement("td");
	tdNode.innerHTML = units;
	tdNode.style.textAlign = "center";
	trNode.appendChild(tdNode);
	return trNode;
}

function setMetValue(id, val, opt, precision) {
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
				var p = 1;
				if (typeof(precision) !== 'undefined' 
					&& !isNaN(precision)
					&& (precision == 0 || precision == 1 || precision == 2 || precision == 3))
				{
					p = precision;
				}
				txt.innerHTML = val.toFixed(p);
			}
		}
	} catch (err) { }
}

function createLedBox(id) {
	var tdNode = document.createElement("td");
	tdNode.id = "ledcell_"+id;
	var led = document.createElement("img");
	led.id = id;
	led.src = "bullet_grey.png";
	led.className = "centered";
	led.align = "center";
	tdNode.appendChild(led);
	return tdNode;
}
function ledSetDisplay(id, displayVal) {
	try {
		var id = "ledcell_"+id;
		document.getElementById(id).style.display = displayVal;
	} catch(e){}
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

function mMeter(min, max, loA, hiA, loW, hiW,w) {
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
	this.mDiv.style.width = w+"px";
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