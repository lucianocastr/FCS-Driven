var RFsettings = {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 45 };
var VSWRsettings = {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 25 };
var BBLevelInsettings = {min:  -80, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 };
var sysColor = "#dddddd";

var bbuMeasurements = [
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

function PageNfpa(factory,config) {
	this.factory = factory;
	this.config = config;
	this.isBbuConnected = false;
	this.bbuSerialMode = isBbuSerialMode(config);
	this.nrOfRelaysSupported = getNrOfRelaysSupported(config);
	
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
	this.createBbuMeasurements = function(){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.style.paddingTop = "20px";
		var tbl = document.createElement("table");
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		for (var n = 0; n < bbuMeasurements.length; n++) {
			if (n%5 == 0) {
				var row = document.createElement("tr");
				tb.appendChild(row);
			}
			var cell = document.createElement("th");
			cell.innerHTML = bbuMeasurements[n].text;
			cell.className = "thdrht";
			cell.style.textAlign = "left";
			row.appendChild(cell);
			var param = document.createElement("input");
			param.input = "text";
			param.disabled = true;
			param.id = bbuMeasurements[n].id;
			param.style.textAlign = "right";
			param.style.width = "40px";
			param.className = "tabval";
			var cell2 = document.createElement("td");
			cell2.style.width = "60px";
			cell2.appendChild(param);
			row.appendChild(cell2);
			if (self.config.bbu_type == 2) {		// High Power BBU
				cell.style.whiteSpace = "normal";
				if (bbuMeasurements[n].id == "BatteryBankVoltage" || bbuMeasurements[n].id == "BatteryCurrent" || bbuMeasurements[n].id == "MainCurrent") {	// power supply voltage/current
					cell.style.display = "none";
					cell2.style.display = "none";
				}
			} else {
				if (bbuMeasurements[n].id == "IndividualBatteryVoltage3" || bbuMeasurements[n].id == "IndividualBatteryVoltage4") {
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
	this.createRelayConfig = function(){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		var cell = this.createRelayStatusAlarm();
		if (this.bbuSerialMode) cell.style.display = "none";
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
		for (var mode = 0; mode < 3; mode+=2){
			this.createGeneralRelayConfig(tb,mode);
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
				submitform(false, false, false, true);
			}
		}
		cell.appendChild(el);
		return cell;
	}
	this.createGeneralRelayConfig = function(tb, mode){
		var row = document.createElement("tr");
		var nrow = 0;
		row.id = "bbuRelay_"+mode+"_"+nrow;row.name = row.id;nrow++;
		row.style.height = "20px";
		tb.appendChild(row);
		var cell = document.createElement("th");
		var modeName = (mode==0?"GENERAL":(mode==1?"BAND-SPECIFIC":"BBU"));
		cell.innerHTML = modeName+"&nbsp;RELAY&nbsp;SETTINGS";
		cell.id = "generalRelaySettingsTitle_"+mode;
		cell.colSpan = 2*(5+NrOfGralSystemAlarms+getNrOfRelaysSupported(this.config));
		row.appendChild(cell);
		var row = document.createElement("tr");
		row.id = "bbuRelay_"+mode+"_"+nrow;row.name = row.id;nrow++;
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
			cell.innerHTML = "Enable";
			cell.rowSpan = 2;
			row.appendChild(cell);
			var cell = document.createElement("th");row.appendChild(cell);
			cell.className = "alarmTable";
			cell.innerHTML ="System&nbsp;Alarm";
			cell.style.backgroundColor = sysColor;
			cell.colSpan = NrOfGralSystemAlarms;
			row.appendChild(cell);
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			cell.innerHTML = "Relay";
			cell.colSpan = getNrOfRelaysSupported(this.config);
			row.appendChild(cell);	
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			if (mode==0) cell.innerHTML = "Logic"+"<br/>"+"High";
			cell.rowSpan = 2;
			row.appendChild(cell);
		}
		var row = document.createElement("tr");
		row.id = "bbuRelay_"+mode+"_"+nrow;row.name = row.id;nrow++;
		tb.appendChild(row);		
		for (var k=0;k<2;k++){
			for (var j=0; j < NrOfGralSystemAlarms; j++) {
				var cell = document.createElement("th");row.appendChild(cell);
				cell.className = "alarmTable";
				cell.innerHTML = j+1;
				cell.style.backgroundColor = sysColor;
				if ((NrOfGralSystemAlarms == 1) && (j > 0)) {
					cell.style.display = "none";
				}
				row.appendChild(cell);
			}
			for (var j=0;j<this.config.NR_OF_RELAYS_MAX;j++){
				var cell = document.createElement("th");row.appendChild(cell);
				cell.className = "alarmTable";
				cell.innerHTML = j+1;
				if (j >= getNrOfRelaysSupported(this.config)) cell.style.display = "none";
			}
		}
		var alarmNrShow = 0;
		var nrows = (mode==0?12:(mode==1?8:9));
		for (var j=0;j<nrows;j++) {
			var increaseAlarmNr = true;
			var isUserAlarm = false;
			var isAnnunciatorAlarm = false;
			var firstAnnuncRow = 7;
			var hideBankVoltRow = (this.config.bbu_type == 2);
			var row = document.createElement("tr");
			tb.appendChild(row);
			var hideCond = (mode==0 && ((j>=1 && j<4) || j>11)); //hide row 1,2,3(path loss and old fiber alarm 1 and 2) and last row
			
			row.id = "alarmRow_"+mode+"_"+j;
			if (hideCond) { 
				row.style.display = "none";
				increaseAlarmNr = false;
			} else if (mode==0 && (j == 8 || j == 9)) {
				isUserAlarm = true;
				increaseAlarmNr = false;
			}
			if (mode == 2) {
				if (hideBankVoltRow) {
					isAnnunciatorAlarm = (j == 6 || j == 7);
					firstAnnuncRow = 6;
					if ( j > 7 ) row.style.display = "none";

				}else{
					isAnnunciatorAlarm = (j == 7 || j == 8);
				}
			}
			for (var k=0;k<2;k++){
				var ix = k+2*j;
				var hideCell = (mode==0 && (j==9 || j==11) && k==1); //hide right cell of external input 4 and gen sys alarm 4
				hideCell = hideCell || (mode==2 && j==6 && k==1 && !hideBankVoltRow); // hide BBU ALARM14
				
				var cell = document.createElement("th");
				if ( isUserAlarm ) {
					var userAlarmNr = 2*(j-8) + k + 1;
					if (userAlarmNr==4){
						cell.innerHTML = "EXTERNAL<br>INPUT";
					}else{
						cell.innerHTML = "USER<br>ALARM&nbsp;"+userAlarmNr;
					}
				} else if ( isAnnunciatorAlarm ) {
					var annunciatorAlarmNr = 2*(j-firstAnnuncRow)+k+1;
					cell.innerHTML = "ANNUN."+annunciatorAlarmNr;
				} else if ( increaseAlarmNr && ! hideCell) {
					alarmNrShow++;
					cell.innerHTML = "ALARM&nbsp;"+alarmNrShow; //Se cambia ordenación (*)
				} else {
					cell.innerHTML = "ALARM&nbsp;"+(ix+1); //Se cambia ordenación (*)
				}
				var index = ix;
				var r_index; //variable for re-order relay assign
				if (mode==0){
					index = ix;
					r_index = index;
					if (ix>=8 && ix<16)
						ix+=8;
					else if(ix>=16)
						ix-=8;
					index = ix;
					r_index = index;
				}
				else if (mode==2){
					if (hideBankVoltRow){
						var ord = 		[0,1,2,3,4,5,6,7,8,9,11,16,12,13,14,15,10,17];
						var ord_relay = [0,1,2,3,4,5,6,7,8,9,11,12,14,15,16,17,10,13];
					}else{
						var ord = 		[0,1,2,3,4,5,6,7,8,9,10,11,16,17,12,13,14,15];
						var ord_relay = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
					}
					index = ord[ix];
					r_index = ord_relay[ix];
				}
				cell.style.paddingLeft = "5px";
				cell.style.paddingRight = "5px";
				cell.className = "alarmTable";
				cell.id = "alarmCell_"+mode+"_"+j+"_"+k;
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
				if (hideCell) cell.style.display = "none";

				if (!hideBankVoltRow && mode==2 && j==6 && k==0) cell.style.visibility = "hidden"; // row for annunciators's relay assign, not for individual annunciator enable
				if (hideBankVoltRow && mode==2 && j==5 && k==1) cell.style.visibility = "hidden"; // row for annunciators's relay assign, not for individual annunciator enable
				
				for (var i = 0; i < NrOfGralSystemAlarms; i++) {
					var cell = this.createSystemCheckBox(index,mode,0,i); //Se cambia ordenación (*)
					if (i >= NrOfGralSystemAlarms) {
						cell.style.display = "none";
					}
					row.appendChild(cell);
					cell.className = "alarmTable";
					cell.style.textAlign = "center";
					cell.style.backgroundColor = sysColor;
					if (hideCell) {
						cell.style.display = "none";
					}
					if (!hideBankVoltRow && mode==2 && j==6 && k==0) cell.style.visibility = "hidden"; // row for annunciators's relay assign, not for individual annunciator enable
					if (hideBankVoltRow && mode==2 && j==5 && k==1) cell.style.visibility = "hidden"; // row for annunciators's relay assign, not for individual annunciator enable
				}
				for (var i=0;i<this.config.NR_OF_RELAYS_MAX;i++){
					var cell = this.createCheckBox(r_index,mode,i); //Se cambia ordenación (*)
					cell.style.textAlign = "center";
					if (i >= getNrOfRelaysSupported(this.config)) cell.style.display="none";
					if (isAnnunciatorAlarm) {
						// relay assign checkbox for individual annunciators
						if (i==0) {
							cell.style.visibility = "hidden";
							cell.colSpan = getNrOfRelaysSupported(this.config);
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
				cell.style.minWidth = "30px";
				if (hideCell) {
					cell.style.display = "none";
				}
				row.appendChild(cell);
			}
		}
	}
	this.createInputText = function(id,num,mode){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.input = "text";
		el.style.fontWeight = "bold";
		el.id = id+"_"+num+"_"+mode;
		el.size = 30;
		el.maxLength = 30;
		el.style.width = "120px";
		cell.appendChild(el);
		return cell;
	}
	this.createEnabledCheckBox = function(num,mode,enav){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		var id = "enabled_"+num+"_"+mode+"_"+enav;
		el.id = id;
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
		cell.colSpan = 11;
		var row = document.createElement("tr");
		tb.appendChild(row);		
		for (var num = 0;num<3;num++){
			var row = document.createElement("tr");
			this.createRelayStatusCtrl(row,num);
			var cell = document.createElement("td");
			cell.style.minWidth = "80px";
			row.appendChild(cell);
			this.createRelayStatusCtrl(row,num+4);
			tb.appendChild(row);
		}
		return cellb;
	}
	this.createRelayStatusCtrl = function(row, num){
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
			row.id = "althresrow_"+k;
			cell.innerHTML = this.alarmThrshElements[k].lbl;
			cell.paddintRight = "20px";
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
					el.min = this.config.alrmThrshHystLimits.min;
					el.max = this.config.alrmThrshHystLimits.max;
				} else {
					el.min = this.config.alarmThrshLimits[k].min;
					el.max = this.config.alarmThrshLimits[k].max;
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
					el.title = "Min: "+this.config.alarmThrshLimits[k].min+
						", Max: "+this.config.alarmThrshLimits[k].max+", Resolution: 1";
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
	this.alarmThrshElements =  [
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
	];
	this.AlarmThrshElementsId = function(k, i) {
		return (this.alarmThrshElements[k].id+"_"+i);
	}
	this.showBBUTable = function(show){
		for (var k=0;k<3;k++) document.getElementById("bbuRelay_2_"+k).style.display = show?"table-row":"none";
		for (var k=0;k<8;k++) document.getElementById("alarmRow_2_"+k).style.display = show?"table-row":"none";
		document.getElementById("alarmRow_2_8").style.display = (show && !(this.config.bbu_type == 2))?"table-row":"none";
	}
	this.show = function(nfpa,showBBUtb){
		this.showBBUTable(showBBUtb); 
		for (var k=0;k<3;k++)
			this.relayStatusCtrlSet(k,nfpa.relayLogicConfigNormal[k]);
		for (var k=4;k<7;k++)
			this.relayStatusCtrlSet(k,nfpa.relayLogicConfigNormal[k]);
		for (var k=0;k<24;k++){
			if (k==11)
				document.getElementById("AlName_"+k+"_0").value = "Force RF OFF";
			else
				document.getElementById("AlName_"+k+"_0").value = nfpa.alarmNames[0][k];
			if (k==2 || k==3)
				document.getElementById("enabled_"+k+"_0_0").checked = false; //se fuerza el valor de Ant.Isolation y Osc.Detection en master
			else
				document.getElementById("enabled_"+k+"_0_0").checked = nfpa.globalAlarmsEnabled[k]; //Se cambió a checkbox
			for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++) document.getElementById("relay_enabled_"+k+"_0_"+j).checked = nfpa.relayAssignGlobalAlarm[k][j];
			if ( k >= 8 && k <= 11 ) {
				var externalAlarmNr = k - 8;
				document.getElementById("extAlarmPolarity_"+externalAlarmNr).checked = nfpa.externalAlarmPolarity[externalAlarmNr];
			}
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				document.getElementById("systemAlarm_"+k+"_0_0_"+i).checked = nfpa.generalSystemAlarm[i][0][k];
			}
		}
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
			for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++) document.getElementById("relay_enabled_"+k+"_2_"+j).checked = nfpa.relayAssignBbuAlarm[k][j];

			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				document.getElementById("systemAlarm_"+k+"_2_0_"+i).checked = nfpa.generalSystemAlarm[i][2][k];
			}
		}
		document.getElementById("AlName_16_2").value = "Annunciators";
		document.getElementById("enabled_16_2_0").checked = nfpa.bbuAlarmsEnabled[12];
		this.bbuBuzzerMuteTimeSet(nfpa.buzzerMuteTime);
	}
	this.showStatus = function(nfpa){
		try{
			var bbuCommErr = nfpa.bbuAlarm[4];
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
			if (this.config.bbu_serial_mode) {
				if ( nfpa.isBbuDisconnectionAlarm() ) {
					this.isBbuConnected = false;
				} else {
					if ( !this.isBbuConnected ) {
						this.updateRelayShow(nfpa);
					}
					this.isBbuConnected = true;
				}
			}
		} catch(e){}
	}
	this.readConf = function(nfpa){
		for (var k=0;k<3;k++)
			nfpa.relayLogicConfigNormal[k] = this.relayStatusCtrlGet(k)==1;
		for (var k=4;k<7;k++)
			nfpa.relayLogicConfigNormal[k] = this.relayStatusCtrlGet(k)==1;

		for (var k=8;k<12;k++)
			nfpa.alarmNames[0][k] = document.getElementById("AlName_"+k+"_0").value;
		
		nfpa.alarmNames[0][11] = "Force RF OFF";
		
		for (var k=0;k<24;k++){
			nfpa.globalAlarmsEnabled[k] = document.getElementById("enabled_"+k+"_0_0").checked; //Se cambió a checkbox
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				nfpa.generalSystemAlarm[i][0][k] = document.getElementById("systemAlarm_"+k+"_0_0_"+i).checked;
			}
			for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++) {
				nfpa.relayAssignGlobalAlarm[k][j] = document.getElementById("relay_enabled_"+k+"_0_"+j).checked;
			}
			if ( k >= 8 && k <= 11 ) {
				var externalAlarmNr = k - 8;
				nfpa.externalAlarmPolarity[externalAlarmNr] = document.getElementById("extAlarmPolarity_"+externalAlarmNr).checked;
			}
		}
		for (var k = 0; k < this.alarmThrshElements.length; k++) {
			var el = document.getElementById(this.AlarmThrshElementsId(k, 0));
			nfpa.alarmThrshData[k].valueThr = parseInt(el.value);
			var el = document.getElementById(this.AlarmThrshElementsId(k, 1));
			nfpa.alarmThrshData[k].hysteresis = parseFloat(el.value);
		}
		for (var k=0;k<16;k++){
			nfpa.bbuAlarmsEnabled[k] = document.getElementById("enabled_"+k+"_2_0").checked;
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				nfpa.generalSystemAlarm[i][2][k] = document.getElementById("systemAlarm_"+k+"_2_0_"+i).checked;
			}
			if (k<12) {
				nfpa.bbuAlarmsEnabled[k] = document.getElementById("enabled_"+k+"_2_0").checked;
				for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++) nfpa.relayAssignBbuAlarm[k][j] = document.getElementById("relay_enabled_"+k+"_2_"+j).checked;
				
			} else if (k>=12) {
				// annunciators relay assign and enable is the same for the four of them and set in row with k==12
				nfpa.bbuAlarmsEnabled[k] = true; //always true
				for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++) nfpa.relayAssignBbuAlarm[k][j] = document.getElementById("relay_enabled_12_2_"+j).checked;
				// annunciators installed in annunciator's enable checkboxes
				nfpa.bbuAlarmsInstalled[k] = document.getElementById("enabled_"+k+"_2_0").checked;
			}
		}
		for (var k=12;k<16;k++) {
			nfpa.alarmNamesBbu[k] = document.getElementById("AlName_"+k+"_2").value;
		}
		nfpa.buzzerMuteTime = this.buzzerMuteTimeGet();
	}
}
function refreshCtrlEnable(num,mode,val){
	try{
		//todos los textos blancos y disabled
		document.getElementById("enabled_"+num+"_"+mode+"_0").disabled = !val;
		var isExtGlobalAlarm = (mode == 0 && num >=8 && num <= 10);
		var isAnnunciatorAlarm = (mode == 2 && num >=12 && num <= 15);
		var enableAlarmName = isExtGlobalAlarm || isAnnunciatorAlarm;
		document.getElementById("AlName_"+num+"_"+mode).style.backgroundColor = (enableAlarmName ? "white" : "#DDDDDD");
		document.getElementById("AlName_"+num+"_"+mode).disabled = !enableAlarmName;
	} catch (err) {}
}
function refreshNfpaEnables(){
	//Se reutiliza refreshNfpaEnables para forzar disabled Antenna isolation, Osc. Detection en general y
	try {
		for (var mode=0;mode<2;mode+=2){
			var numAlarm = mode==0?24:16;
			for (var num=0;num < numAlarm;num++){
				var alDisable = mode==0 && (num>=2 && num<6);
				refreshCtrlEnable(num,mode,!alDisable);
				alDisable = alDisable || (mode==0 && (num>=12 && num<15));
				if (alDisable){
					//checkbox system alarm deshabilitado en las alarmas inexistentes y la propia system alarm en master y remoto
					for (var i = 0; i < NrOfGralSystemAlarms; i++) {
						
							var el = document.getElementById("systemAlarm_"+num+"_"+mode+"_0_"+i);
							el.checked = false;
							el.disabled = true;
						
					}
				}
			}
		}
		for (var num=0;num<18;num++){
			var mode = 2;
			refreshCtrlEnable(num,mode,true);
		}
		for (var n = 0; n < bbuMeasurements.length; n++) {
			document.getElementById(bbuMeasurements[n].id).style.backgroundColor = "#DDDDDD";
			document.getElementById(bbuMeasurements[n].id).disabled = true;
		}
		document.getElementById("bbuBuzzerStatus").style.backgroundColor = "#DDDDDD";
		document.getElementById("bbuBuzzerStatus").disabled = true;
		if (self.config.bbu_type == 2) {
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
	}catch(e){}
}