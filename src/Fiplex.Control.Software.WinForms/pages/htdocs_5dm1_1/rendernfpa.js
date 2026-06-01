var RFsettings = {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 45 };
var VSWRsettings = {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 25 };
var BBLevelInsettings = {min:  -80, low_alarm: -121, low_warn: -121, high_warn: 0, high_alarm: 0, max: 0 };
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

function PageNfpa(factory,config,nr,nunit) {
	this.factory = factory;
	this.config = config;
	this.bbuSerialMode = isBbuSerialMode(config);
	this.nrOfRelays = getNrOfRelaysSupported(config,nunit,self.version);
	
	this.createRowPowerBand = function(nr){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		for (var band=0;band<2;band++){
			var cell = document.createElement("th");
			cell.innerHTML = "VSWR METER " + this.factory.bandNames[band];
			cell.id = "vswrtitle_"+band+"_"+nr;
			cell.className = "cth";
			cell.colSpan = 2;
			if (unitToMon[nr]==0) cell.style.display = "none";
			rowb.appendChild(cell);	
			var cell = document.createElement("th");
			if (unitToMon[nr]>0) cell.style.display = "none";
			cell.innerHTML = "DONOR ANTENNA FAILURE ADJUSTMENT " + this.factory.bandNames[band];
			cell.id = "donortitle_"+band+"_"+nr;
			cell.className = "cth";
			rowb.appendChild(cell);	
		}			
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		for (var band=0;band<2;band++){
			var cell = this.createPowerCell(nr,band);
			cell.id = "powerCell_"+band+"_"+nr;
			if (unitToMon[nr]==0) cell.style.display = "none";
			rowb.appendChild(cell);		
			var cell = this.createVSWRCell(nr,band);
			cell.id = "vswrCell_"+band+"_"+nr;
			if (unitToMon[nr]==0) cell.style.display = "none";
			rowb.appendChild(cell);	
			var cell = this.createDonorAntFailCell(nr,band);
			cell.id = "donorCell_"+band+"_"+nr;
			if (unitToMon[nr]>0) cell.style.display = "none";
			rowb.appendChild(cell);	
		}
		var rowb = document.createElement("tr");
		if (unitToMon[nr]>0) rowb.style.display = "none";
		tab.appendChild(rowb);
		for (var band=0;band<2;band++){
			var cell = document.createElement("th");
			cell.innerHTML = "ANTENNA&nbsp;DISCONNECTION " + this.factory.bandNames[band];
			cell.id = "antDisconnTitle_"+band+"_"+nr;
			cell.className = "cth";			
			rowb.appendChild(cell);	
		}
		var rowb = document.createElement("tr");
		if (unitToMon[nr]>0) rowb.style.display = "none";
		tab.appendChild(rowb);
		for (var band=0;band<2;band++){
			var cell = this.createBroadbandLevelIn(nr,band);
			cell.id = "antDisconnCtrl_"+band+"_"+nr;
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
		el.style.color = (valH>valL) ?"black":"red";
		var txtbold = false;
		if (valH<=valL) txtbold = valL>=valLth;
		el.style.fontWeight = txtbold?"bold":"normal";
		el = document.getElementById("alRxPowLow_"+band+"_"+nr);
		el.innerHTML = (valH>valL )?"Rx&nbsp;Power&nbsp;OK":"Rx&nbsp;Power&nbsp;Low";
		el.style.color = (valH<=valL && valL>=valLth)?"red":"black";
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
		el.max = -50;
		el.min = -110;
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
	this.createBbuMeasurements = function(nr){
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
			param.id = bbuMeasurements[n].id+"_"+nr;
			param.style.textAlign = "right";
			param.style.width = "40px";
			param.className = "tabval";
			var cell2 = document.createElement("td");
			cell2.style.width = "60px";
			cell2.appendChild(param);
			row.appendChild(cell2);
			if (self.config[nr].bbu_type == 2) {		// High Power BBU
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
	this.createRelayConfig = function(nr){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
		if (unitToMon[nr]==0) {
			var rowb = document.createElement("tr");
			tab.appendChild(rowb);
			var cell = document.createElement("td");
			cell.className = "contentcell";
			rowb.appendChild(cell);
			var tab = this.createRelayAssignPolicy();
			cell.appendChild(tab);
		}
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		var cell = this.createRelayStatusAlarm(nr);
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
		for (var mode = 0; mode < 3; mode++){
			this.createGeneralRelayConfig(tb,mode,nr);
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
			var n = unitToMon[this.nr];
			var n1=n&0xff;var n2=(n>>8)&0xff;
			var txt = n==0?"MASTER":n1==0?"EXPANSION "+n2+".0":"REMOTE "+n2+"."+n1;
			var alertMsg = "NOTICE:\nRelay assignment settings of "+txt+" unit will be configured to default values.\nPlease confirm.";
			if (confirm(alertMsg)) {
				cfgParams = new submitParams();
				cfgParams.ndev = this.nr;
				cfgParams.setDefaultRelay = true;
				submitform(cfgParams);
			}
		}
		cell.appendChild(el);
		return cell;
	}
	this.createGeneralRelayConfig = function(tb, mode,nr){
		var isMaster = unitToMon[nr]==0;
		var isExp = ((unitToMon[nr]&0xff)==0) && !isMaster;
		var isRemote = (unitToMon[nr]&0xff)!=0;
		var row = document.createElement("tr");
		var nrow = 0;
		row.id = "bbuRelay_"+nr+"_"+mode+"_"+nrow;row.name = row.id;nrow++;
		if (isExp && mode==1) row.style.display = "none";
		row.style.height = "20px";
		tb.appendChild(row);
		var cell = document.createElement("th");
		var modeName = (mode==0?"GENERAL":(mode==1?"BAND-SPECIFIC":"BBU"));
		cell.innerHTML = modeName+"&nbsp;RELAY&nbsp;SETTINGS";
		cell.id = "generalRelaySettingsTitle_"+mode+"_"+nr;
		var nrOfGralSystemAlarmsSupported = getNrOfGralSystemAlarmsSupported(this.config, nr);
		cell.colSpan = 2*(5+nrOfGralSystemAlarmsSupported+this.nrOfRelays);
		row.appendChild(cell);
		var row = document.createElement("tr");
		row.id = "bbuRelay_"+nr+"_"+mode+"_"+nrow;row.name = row.id;nrow++;
		if (isExp && mode==1) row.style.display = "none";
		tb.appendChild(row);
		var showTwoEnCols = (isMaster && mode==1);
		showTwoEnCols = showTwoEnCols && ((this.factory.chBandEnabled[0] || this.factory.adjBandEnabled[0]) && (this.factory.chBandEnabled[1] || this.factory.adjBandEnabled[1])); //two bands enabled
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
			cell.rowSpan =(showTwoEnCols)?1:2;
			cell.colSpan = 2;
			row.appendChild(cell);
			var cell = document.createElement("th");row.appendChild(cell);
			cell.className = "alarmTable";
			cell.innerHTML ="System&nbsp;Alarm";
			cell.style.backgroundColor = sysColor;
			cell.colSpan = nrOfGralSystemAlarmsSupported;
			row.appendChild(cell);
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			cell.innerHTML = "Relay";
			cell.colSpan = this.nrOfRelays;
			row.appendChild(cell);	
			var cell = document.createElement("th");
			cell.className = "alarmTable";
			if (mode==0) cell.innerHTML = "Logic"+"<br/>"+"High";
			cell.rowSpan = 2;
			row.appendChild(cell);
		}
		var row = document.createElement("tr");
		row.id = "bbuRelay_"+nr+"_"+mode+"_"+nrow;row.name = row.id;nrow++;
		if (isExp && mode==1) row.style.display = "none";
		tb.appendChild(row);		
		for (var k=0;k<2;k++){
			if (showTwoEnCols){
				var cell = document.createElement("th");row.appendChild(cell);
				cell.className = "alarmTable";
				cell.innerHTML = this.factory.commonUl?"700":"VHF";
				var cell = document.createElement("th");row.appendChild(cell);
				cell.className = "alarmTable";
				cell.innerHTML = this.factory.commonUl?"800":"UHF";
			}
			for (var j=0; j < NrOfGralSystemAlarms; j++) {
				var cell = document.createElement("th");row.appendChild(cell);
				cell.className = "alarmTable";
				cell.innerHTML = j+1;
				cell.style.backgroundColor = sysColor;
				if ((nrOfGralSystemAlarmsSupported == 1) && (j > 0)) {
					cell.style.display = "none";
				}
				row.appendChild(cell);
			}
			for (var j=0;j<this.config.NR_OF_RELAYS_MAX;j++){
				var cell = document.createElement("th");row.appendChild(cell);
				cell.className = "alarmTable";
				cell.innerHTML = j+1;
				if (j >= this.nrOfRelays) cell.style.display = "none";
			}
		}
		var alarmNrShow = 0;
		var nrows = (mode==0?12:(mode==1?8:9));
		for (var j=0;j<nrows;j++) {
			var increaseAlarmNr = true;
			var isUserAlarm = false;
			var isAnnunciatorAlarm = false;
			var firstAnnuncRow = 7;
			var hideBankVoltRow = (!isMaster && this.config.bbu_type == 2); //master always shows batt bank voltage alarm because an exp or remote can have it
			var row = document.createElement("tr");
			tb.appendChild(row);
			var hideCond = isExp && mode==1; //band alarms hidden in exp
			hideCond = hideCond || ((mode==1) && (!isMaster && j>3)); //3 last band alarm rows hidden in remote
			hideCond = hideCond || (isRemote && mode==0 && !this.config.supportsBBU() && j==4); //5th general alarm row hidden on legacy remotes
			hideCond = hideCond || (isRemote && j>7 && (mode==0) ); //row>=8 hidden in remotes general alarm
			hideCond = hideCond || (isRemote && j>6 && (mode==1) ); //row>=7 hidden in remotes band alarm
			hideCond = hideCond || (!isRemote && mode==0 && (j==3 || j>11)); //3rd row general alarm hidden in master and exp (fiber1/2 remotes)
			hideCond = hideCond || (hideBankVoltRow && mode==2 && j==8);//remote high power BBU does not show 10th row
			hideCond = hideCond || (isExp && mode==0 && (j==1 || j==2)); //removed 2nd and 3rd row in expansion general alarm (opf and path loss)
			var pathLossAvailable = self.version.compareSw(6,0)>=0 && page.pathLossExist(); //path loss available in master SDRP
			if (!pathLossAvailable) hideCond = hideCond || (isMaster && mode==0 && j==2);//removed 3rd row for master general alarms: path loss 1 and 2
			row.id = "alarmRow_"+nr+"_"+mode+"_"+j;
			if (hideCond) { 
				row.style.display = "none";
				increaseAlarmNr = false;
			} else if (isRemote && mode==0 && (j == 6 || j == 7)) {
				isUserAlarm = true;
				increaseAlarmNr = false;
			} else if (!isRemote && mode==0 && (j == 8 || j == 9)) {
				isUserAlarm = true;
				increaseAlarmNr = false;
			}
			if (mode == 2) {
				if (hideBankVoltRow) {
					isAnnunciatorAlarm = (j == 6 || j == 7);
					firstAnnuncRow = 6;
				}else{
					isAnnunciatorAlarm = (j == 7 || j == 8);
				}
			}
			for (var k=0;k<2;k++){
				var ix = k+2*j;
				var hideCell = (isRemote && mode == 1 && ix>6); //remote shows 7 band alarms
				hideCell = hideCell || (isRemote && mode == 1 && ix==6 && !this.config.supportsFlex2());//remote<flex2.0 does not show C/N UL Low Alarm
				hideCell = hideCell || (isMaster && mode == 1 && ix>10); //master shows 11 band alarms
				hideCell = hideCell || (isRemote && mode==0 && !this.config.supportsBBU() && j==3 && k==1); //en remotos legacy general, se quita la celda derecha a a general sys alarm 1
				hideCell = hideCell || (isRemote && mode==0 && j==4 && k==1); //en remotos general, se quita la celda derecha a general sys alarm 3
				hideCell = hideCell || (!isRemote && mode==0 && j==11 && k==1); //en master and exp general, se quita la celda derecha a other remotes alarms
				hideCell = hideCell || (isExp && mode==0 && j==9 && k==1); //removed force RF OFF in expansion
				hideCell = hideCell || (mode==2 && j==6 && k==1 && !hideBankVoltRow); // hide BBU ALARM14
				hideCell = hideCell || (isMaster && mode==1 && j==5 && k==0 && self.version.compareSw(6,0)>=0 && !self.factory[0].masterOTA); //UL PA Fail master SDRP rack mount not visible
				var cell = document.createElement("th");
				if ( isUserAlarm ) {
					var userAlarmNr = 2*(j-(!isRemote?8:6)) + k + 1;
					if (userAlarmNr==4 && (!isRemote || this.config.supportsFlex2())){
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
				if (mode==0 && !isRemote){
					if (ix>=8 && ix<16)
						ix+=8;
					else if(ix>=16)
						ix-=8;
					index = ix;
				}
				if (mode==0 && isRemote){
					var ord = [0,1,2,3,6,7,12,13,14,15,4,5,8,9,10,11];
					ix = ix>15?ix:ord[ix];
					index = ix;
				}
				if (mode==1 && isRemote){
					var ord = [0,2,3,4,6,7,10,5,1,8,9];
					ix = ix>10?ix:ord[ix];
					index = ix;
				}
				if (mode==1 && !isRemote){
					var ord = [9,5,0,1,2,3,4,6,7,10,8]; //first ant.disconnection and rx power low to show 2 alarm enables
					ix = ix>10?ix:ord[ix];
					index = ix;
				}
				r_index = index;
				if (mode == 2){
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
				var bstart=-1;
				var bstop=-1;
				var twoEns = false;
				if (isMaster && mode==1 && (index==5 || index==9)){
					twoEns = true;
					bstart=0;bstop=1;//only for master bandAlarmEnables antenna disconnection/rx power low
				}
				for (var b=bstart;b<=bstop;b++){
					var cell = this.createEnabledCheckBox(index,mode,0,nr,b); //Se cambia ordenación (*)
					row.appendChild(cell);
					cell.className = "alarmTable";
					cell.style.textAlign = "center";
					if (hideCell || (twoEns && !(this.factory.chBandEnabled[b] || this.factory.adjBandEnabled[b]))) cell.style.display = "none";
					if (!showTwoEnCols) cell.colSpan = 2;
				}
				if (bstart==-1) cell.colSpan = 2;

				if (!hideBankVoltRow && mode==2 && j==6 && k==0) cell.style.visibility = "hidden"; // row for annunciators's relay assign, not for individual annunciator enable
				if (hideBankVoltRow && mode==2 && j==5 && k==1) cell.style.visibility = "hidden"; // row for annunciators's relay assign, not for individual annunciator enable	

				for (var i = 0; i < NrOfGralSystemAlarms; i++) {
					var cell = this.createSystemCheckBox(index,mode,0,nr,i); //Se cambia ordenación (*)
					if (i >= nrOfGralSystemAlarmsSupported) {
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
					var cell = this.createCheckBox(r_index,mode,i,nr); //Se cambia ordenación (*)
					cell.style.textAlign = "center";
					if (i >= this.nrOfRelays) cell.style.display="none";
					if (isAnnunciatorAlarm) {
						// relay assign checkbox for individual annunciators
						if (i==0) {
							cell.style.visibility = "hidden";
							cell.colSpan = this.nrOfRelays;
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
				cell.style.minWidth = "30px";
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
		el.style.width = "120px";
		cell.appendChild(el);
		return cell;
	}
	this.createEnabledCheckBox = function(num,mode,enav,nr,band){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		var id = "enabled_"+num+"_"+mode+"_"+enav+"_"+nr;
		if (band>=0) id += "_"+band;
		el.id = id;
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
		var i1 = unitToMon[nr] & 0xff; var i2= (unitToMon[nr]>>8)&0xff;
		var isExp = i1==0 && i2>0;
		var isMaster = unitToMon[nr]==0;
		var isMasterSDRP = isMaster && (self.version.compareSw(6, 0) >= 0);
		if (isExp || (isMaster && !isMasterSDRP)) { //master and expansion Flex2.0 can show 7 relays except masterSDRP
			cell.colSpan = cell.colSpan*2+1;
		}
		var row = document.createElement("tr");
		tb.appendChild(row);		
		for (var num = 0;num<3;num++){
			var row = document.createElement("tr");
			this.createRelayStatusCtrl(row,num,nr,false);
			if ((unitToMon[nr]&0xff)==0) { //master and expansion Flex2.0 shows 7 relays
				var cell = document.createElement("td");
				var hide = (isMasterSDRP); //hidden elements of 2nd column in master SDRP
				if (hide) cell.style.display = "none";
				cell.style.minWidth = "80px";
				row.appendChild(cell);
				this.createRelayStatusCtrl(row,num+4,nr,hide);
			}
			tb.appendChild(row);
		}
		return cellb;
	}
	this.createRelayStatusCtrl = function(row, num, nr, hide){
		var cell = document.createElement("th");
		if (hide) cell.style.display = "none";
		row.appendChild(cell);
		cell.innerHTML = "Relay " +(num+1);
		cell.style.width = "80px";
		for (var j=0;j<2;j++){
			var cell = document.createElement("td");
			if (hide) cell.style.display = "none";
			row.appendChild(cell);
			var el = document.createElement("input");
			el.type = "radio";
			el.name = "relayStatus_"+num+"_"+nr;
			el.value = j;
			el.className = "contentcell";
			cell.appendChild(el);
			var cell = document.createElement("td");
			if (hide) cell.style.display = "none";
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
		var isRemote = (unitToMon[nr] & 0xff)!=0;
		var m = (!isRemote?0:1);
		for (var k = 0; k < this.alarmThrshElements[m].length; ++k) {
			var row = document.createElement("tr");
			var cell = document.createElement("th");
			row.id = "althresrow_"+k+"_"+nr;
			if (isRemote && (k==3 || k==4)) {
				var band = k - 3;
				row.style.display = "none";
				cell.id = "althrestitle_"+k+"_"+nr;
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
					el.min = this.config.alrmThrshHystLimits.min;
					el.max = this.config.alrmThrshHystLimits.max;
				} else {
					el.min = this.config.alarmThrshLimits[m][k].min;
					el.max = this.config.alarmThrshLimits[m][k].max;
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
					el.title = "Min: "+this.config.alarmThrshLimits[m][k].min+
						", Max: "+this.config.alarmThrshLimits[m][k].max+", Resolution: 1";
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
		},
		{
			lbl: "Path&nbsp;Loss&nbsp;Analyzer&nbsp;Measurement&nbsp;1 (dBm)",
			lblaux: "",
			sign: "<",
			id: "plapwr_1"
		},
		{
			lbl: "Path&nbsp;Loss&nbsp;Analyzer&nbsp;Measurement&nbsp;2 (dBm)",
			lblaux: "",
			sign: "<",
			id: "plapwr_2"
		}
	]];
	this.AlarmThrshElementsId = function(k, i, nr) {
		var m = ((unitToMon[nr] & 0xff)==0?0:1);
		return (this.alarmThrshElements[m][k].id+"_"+i+"_"+nr);
	}
	this.showBBUTable = function(nr, show){
		for (var k=0;k<3;k++) document.getElementById("bbuRelay_"+nr+"_2_"+k).style.display = show?"table-row":"none";
		for (var k=0;k<8;k++) document.getElementById("alarmRow_"+nr+"_2_"+k).style.display = show?"table-row":"none";
		if (!this.config.bbu_type == 2 || !this.bbuSerialMode) document.getElementById("alarmRow_"+nr+"_2_8").style.display = show?"table-row":"none";
	}
	this.show = function(nfpa,nr,showBBUtb){
		var isMaster = unitToMon[nr]==0;
		var isExp = ((unitToMon[nr]&0xff)==0) && !isMaster;
		var isRemote = (unitToMon[nr]>0) && !isExp;
		this.showBBUTable(nr,showBBUtb); 
		for (var band=0;band<2;band++){
			//visualizaciones que dependen de factory				
			var show = this.factory.chBandEnabled[band] || this.factory.adjBandEnabled[band];
			var el = document.getElementById("vswrtitle_"+band+"_"+nr);
			if (!show) el.style.display = "none";
			var el = document.getElementById("donortitle_"+band+"_"+nr);
			if (!show) el.style.display = "none";
			document.getElementById("antDisconnTitle_"+band+"_"+nr).style.display = show?"table-cell":"none";
			document.getElementById("antDisconnCtrl_"+band+"_"+nr).style.display = show?"table-cell":"none";
			if (!show){
				document.getElementById("powerCell_"+band+"_"+nr).style.display = "none";
				document.getElementById("vswrCell_"+band+"_"+nr).style.display = "none";
				document.getElementById("donorCell_"+band+"_"+nr).style.display = "none";
			}
			RFsettings.max = this.factory.powerlimit[2*band+1] + 5;
			RFsettings.min = RFsettings.max - 50;
			RFsettings.high_warn = this.factory.powerlimit[2*band+1];
			RFsettings.high_alarm = this.factory.powerlimit[2*band+1] + this.factory.MAX_PWR_DELTA;
			setMetRange("rfPowFwd_"+band+"_"+nr, RFsettings);
			setMetRange("rfPowRev_"+band+"_"+nr, RFsettings);
			var el = document.getElementById("minPowerVSWR_"+band+"_"+nr);
			el.setAttribute("max",this.factory.powerlimit[2*band+1]);
			el.title = "Min: "+el.min+", Max: "+el.max+" dBm";
			if (isRemote) {
				var el = document.getElementById("althresrow_"+(band+3)+"_"+nr);
				el.style.display = show? "table-row" :"none";
				var el = document.getElementById("althrestitle_"+(band+3)+"_"+nr);
				el.innerHTML = "Downlink&nbsp;Output&nbsp;Power&nbsp;Alarm&nbsp;"+this.factory.bandNames[band].toUpperCase()+" (dBm)";
			}
			//
			this.RetLossThSet(band,nr,nfpa.retLossTh[band]);
			this.VSWRMinPowerSet(band,nr,nfpa.minPowerVSWR[band]);
			this.AlarmSensSet(band,nr,nfpa.alarmNumSens[band]);
			this.timeTriggerSet(band,nr,nfpa.timeTxLowPowLow[band]);
		}
		for (var k=0;k<3;k++)
			this.relayStatusCtrlSet(k,nr,nfpa.relayLogicConfigNormal[k]);

		if (!isRemote) {
			for (var k=4;k<7;k++)
				this.relayStatusCtrlSet(k,nr,nfpa.relayLogicConfigNormal[k]);
		}
		for (var k=0;k<24;k++){
			if (k==11)
				document.getElementById("AlName_"+k+"_0_"+nr).value = this.config.supportsFlex2()?"Force RF OFF":nfpa.alarmNames[0][k];
			else if (isRemote && k==12 && getNrOfGralSystemAlarmsSupported(this.config, nr)==1) {			// for legacy remote device
				var alName =  nfpa.alarmNames[0][k].substr(0, nfpa.alarmNames[0][k].length-2);	// delete '1' from end of general system alarm name
				document.getElementById("AlName_"+k+"_0_"+nr).value = alName;
			} else
				document.getElementById("AlName_"+k+"_0_"+nr).value = nfpa.alarmNames[0][k];
			if (isMaster && (k==2 || k==3))
				document.getElementById("enabled_"+k+"_0_0_"+nr).checked = false; //se fuerza el valor de Ant.Isolation y Osc.Detection en master
			else
				document.getElementById("enabled_"+k+"_0_0_"+nr).checked = nfpa.globalAlarmsEnabled[k]; //Se cambió a checkbox
			for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++) document.getElementById("relay_enabled_"+k+"_0_"+j+"_"+nr).checked = nfpa.relayAssignGlobalAlarm[k][j];
			if ( k >= 8 && k <= 11 ) {
				var externalAlarmNr = k - 8;
				document.getElementById("extAlarmPolarity_"+externalAlarmNr+"_"+nr).checked = nfpa.externalAlarmPolarity[externalAlarmNr];
			}
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				document.getElementById("systemAlarm_"+k+"_0_0_"+nr+"_"+i).checked = nfpa.generalSystemAlarm[i][0][k];
			}
		}
		for (var k=0;k<16;k++){
			document.getElementById("AlName_"+k+"_1_"+nr).value = nfpa.alarmNames[1][k];
			if (isMaster && (k==5 || k==9)){ //exception for master rx power low and ant.disconnection
				document.getElementById("enabled_"+k+"_1_0_"+nr+"_0").checked = nfpa.bandAlarmsEnabled[0][k];
				document.getElementById("enabled_"+k+"_1_0_"+nr+"_1").checked = nfpa.bandAlarmsEnabled[1][k];
			}else
				document.getElementById("enabled_"+k+"_1_0_"+nr).checked = nfpa.bandAlarmsEnabled[0][k];
			for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++) document.getElementById("relay_enabled_"+k+"_1_"+j+"_"+nr).checked = nfpa.relayAssignBandAlarm[k][j];
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				document.getElementById("systemAlarm_"+k+"_1_0_"+nr+"_"+i).checked = nfpa.generalSystemAlarm[i][1][k];
			}
		}
		for (var k = 0; k < 2; k++) 
			this.bbLevelInThSet(nr,k,nfpa.antennaDisconnectionThreshold[k]);
		var m = (!isRemote?0:1);
		for (var k = 0; k < this.alarmThrshElements[m].length; k++) {
			var el = document.getElementById(this.AlarmThrshElementsId(k, 0, nr));
			el.value = nfpa.alarmThrshData[k].valueThr;
			var el = document.getElementById(this.AlarmThrshElementsId(k, 1, nr));
			el.value = nfpa.alarmThrshData[k].hysteresis.toFixed(1);
		}
		for (var k=0;k<16;k++){
			document.getElementById("AlName_"+k+"_2_"+nr).value = nfpa.alarmNamesBbu[k];
			if (k<12) {
				document.getElementById("enabled_"+k+"_2_0_"+nr).checked = nfpa.bbuAlarmsEnabled[k];
			} else  { 
				// annunciators installed in annunciator's enable checkboxes
				document.getElementById("enabled_"+k+"_2_0_"+nr).checked = nfpa.bbuAlarmsInstalled[k];
			}
			for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++) document.getElementById("relay_enabled_"+k+"_2_"+j+"_"+nr).checked = nfpa.relayAssignBbuAlarm[k][j];

			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				document.getElementById("systemAlarm_"+k+"_2_0_"+nr+"_"+i).checked = nfpa.generalSystemAlarm[i][2][k];
			}
		}
		document.getElementById("AlName_16_2_"+nr).value = "Annunciators";
		document.getElementById("enabled_16_2_0_"+nr).checked = nfpa.bbuAlarmsEnabled[12];
		this.bbuBuzzerMuteTimeSet(nfpa.buzzerMuteTime,nr);

		if (isMaster) this.relayAssignPolicySet(nfpa.relayAssignPolicy);
	}
	this.showStatus = function(nfpa,nr){
		try{
			for (var k=0;k<2;k++){
				setMetValue("rfPowFwd_"+k+"_"+nr, nfpa.powDirect[k]);
				setMetValue("rfPowRev_"+k+"_"+nr, nfpa.powReverse[k]);
				setMetValue("returnLoss_"+k+"_"+nr, nfpa.retLoss[k]);
				var el = document.getElementById("warnPowerMess_"+k+"_"+nr);
				el.style.display = nfpa.powDirect[k]<this.config.minPowerVSWR[k]?"table-cell":"none";	
				this.timeElapsedSet(k,nr,nfpa.txLowerPowerTimeHigh[k],nfpa.txLowerPowerTimeLow[k],this.config.timeTxLowPowLow[k]);
				setMetValue("bbLevelIn_"+nr+"_"+k, nfpa.bbLevel[k]);
			}
			var bbuCommErr = nfpa.bbuAlarm[4];
			document.getElementById("ChargerTemperature"+"_"+nr).value = bbuCommErr?"---": nfpa.bbuChargerTemperature;
			document.getElementById("BatteryTemperature"+"_"+nr).value = bbuCommErr?"---": nfpa.bbuBatteryTemperature;
			document.getElementById("IndividualBatteryVoltage1"+"_"+nr).value = bbuCommErr?"---": (nfpa.bbuBatteryStatusVoltage[0]/1000).toFixed(2);
			document.getElementById("IndividualBatteryVoltage2"+"_"+nr).value = bbuCommErr?"---": (nfpa.bbuBatteryStatusVoltage[1]/1000).toFixed(2);
			document.getElementById("IndividualBatteryVoltage3"+"_"+nr).value = bbuCommErr?"---": (nfpa.bbuBatteryStatusVoltage[2]/1000).toFixed(2);
			document.getElementById("IndividualBatteryVoltage4"+"_"+nr).value = bbuCommErr?"---": (nfpa.bbuBatteryStatusVoltage[3]/1000).toFixed(2);
			document.getElementById("SystemVoltage"+"_"+nr).value = bbuCommErr?"---": (nfpa.bbuSystemVoltage/1000).toFixed(2);
			document.getElementById("BatteryBankVoltage"+"_"+nr).value = bbuCommErr?"---": (nfpa.bbuBatteryVoltageBank/1000).toFixed(2);
			document.getElementById("MainCurrent"+"_"+nr).value = bbuCommErr?"---": (nfpa.bbuMainCurrent/1000).toFixed(2);
			document.getElementById("BatteryCurrent"+"_"+nr).value = bbuCommErr?"---": (nfpa.bbuBatteryCurrent/1000).toFixed(2);
			this.bbuBuzzerStatusSet(nfpa.bbuBuzzerStatus, bbuCommErr,nr);
			this.bbuBuzzerRemainingTimeSet(nfpa.bbuBuzzerRemainingTime, bbuCommErr,nr);
		} catch(e){}
	}
	this.readConf = function(nfpa,nr){
		var isMaster = unitToMon[nr]==0;
		var isExp = ((unitToMon[nr]&0xff)==0) && !isMaster;
		var isRemote = (unitToMon[nr]&0xff)!=0;
		if (!isExp){
			for (var band=0;band<2;band++){
				nfpa.retLossTh[band] = this.RetLossThGet(band,nr);
				nfpa.minPowerVSWR[band] = this.VSWRMinPowerGet(band,nr);
				nfpa.alarmNumSens[band] = this.AlarmSensGet(band,nr);
				nfpa.timeTxLowPowLow[band] = this.timeTriggerGet(band,nr);
			}
		}	
		for (var k=0;k<3;k++)
			nfpa.relayLogicConfigNormal[k] = this.relayStatusCtrlGet(k,nr)==1;

		if (!isRemote) {
			for (var k=4;k<7;k++)
				nfpa.relayLogicConfigNormal[k] = this.relayStatusCtrlGet(k,nr)==1;
		}
		for (var k=8;k<12;k++)
			nfpa.alarmNames[0][k] = document.getElementById("AlName_"+k+"_0_"+nr).value;
		
		if (!isRemote || this.config.supportsFlex2()) nfpa.alarmNames[0][11] = "Force RF OFF";
		
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
		for (var k=0;k<16;k++){
			if (isMaster && (k==5 || k==9)){ //exception for master rx power low and ant.disconnection
				nfpa.bandAlarmsEnabled[0][k] = document.getElementById("enabled_"+k+"_1_0_"+nr+"_0").checked;
				nfpa.bandAlarmsEnabled[1][k] = document.getElementById("enabled_"+k+"_1_0_"+nr+"_1").checked;
			}else
				nfpa.bandAlarmsEnabled[0][k] = document.getElementById("enabled_"+k+"_1_0_"+nr).checked; //Se cambió a checkbox
			for (var i = 0; i < NrOfGralSystemAlarms; i++) {
				nfpa.generalSystemAlarm[i][1][k] = document.getElementById("systemAlarm_"+k+"_1_0_"+nr+"_"+i).checked;
			}
			for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++)
				nfpa.relayAssignBandAlarm[k][j] = document.getElementById("relay_enabled_"+k+"_1_"+j+"_"+nr).checked;
		}
		if (isMaster){ //Se fuerza algunas alarmas como siempre deshabilitadas
			var forceDis = [0,2,3,4,6,7]; //Overload UL,DL PA Fail,TX Power Low,VSWR,DL AGC Fail,DL Output Power
			for (var k=0;k<forceDis.length;k++)
				nfpa.bandAlarmsEnabled[0][forceDis[k]] = false; 
		}
		for (var j=0;j<2;j++)
			nfpa.antennaDisconnectionThreshold[j] = this.bbLevelInThGet(nr,j);
		var m = (!isRemote?0:1);
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
				nfpa.bbuAlarmsEnabled[k] = !isRemote || nfpa.device_version_index>0;//only false if remote does not supports BBU
				for (var j=0;j<nfpa.NR_OF_RELAYS_MAX;j++) nfpa.relayAssignBbuAlarm[k][j] = document.getElementById("relay_enabled_12_2_"+j+"_"+nr).checked;
				// annunciators installed in annunciator's enable checkboxes
				nfpa.bbuAlarmsInstalled[k] = document.getElementById("enabled_"+k+"_2_0"+"_"+nr).checked;
			}
		}
		for (var k=12;k<16;k++) {
			nfpa.alarmNamesBbu[k] = document.getElementById("AlName_"+k+"_2"+"_"+nr).value;
		}
		nfpa.buzzerMuteTime = this.buzzerMuteTimeGet(nr);
		if (isMaster) {
			nfpa.relayAssignPolicy = this.relayAssignPolicyGet();
		}
	}
}
function refreshCtrlEnable(num,mode,nr,val){
	try{
		//todos los textos blancos y disabled
		var indexMaxExtAlarm = (unitToMon[nr]==0 || self.config[nr].supportsFlex2())?10:11;
		var isExtGlobalAlarm = (mode == 0 && num >=8 && num <= indexMaxExtAlarm);
		var isAnnunciatorAlarm = (mode == 2 && num >=12 && num <= 15);
		var enableAlarmName = isExtGlobalAlarm || isAnnunciatorAlarm;
		document.getElementById("AlName_"+num+"_"+mode+"_"+nr).style.backgroundColor = (enableAlarmName ? "white" : "#DDDDDD");
		document.getElementById("AlName_"+num+"_"+mode+"_"+nr).disabled = !enableAlarmName;
		document.getElementById("enabled_"+num+"_"+mode+"_0_"+nr).disabled = !val;
	} catch (err) {}
}
function refreshNfpaEnables(){
	//Se reutiliza refreshNfpaEnables para forzar disabled Antenna isolation, Osc. Detection en general y
	//Overload UL, DL PA Fail, Tx Power Low, VSWR, DL AGC Fail en band-specific
	try {
		for (var nr=0;nr<nrOfDevices;nr++){
			var isMaster = unitToMon[nr]==0;
			var isExp = ((unitToMon[nr]&0xff)==0) && !isMaster;
			var isRemote = (unitToMon[nr]&0xff)!=0;
			for (var mode=0;mode<2;mode++){
				var numAlarm = mode==0?24:16;
				for (var num=0;num < numAlarm;num++){
					var alDisable = mode==0 && (!isRemote && (num>=2 && num<6));
					alDisable = alDisable || (mode==0 && num==3); //Osc detection checkbox disabled in remotes
					alDisable = alDisable || (isMaster && mode==1 && (num==0 || num==6  || num==7 || num==10 || (num>=2 && num<=4)));
					refreshCtrlEnable(num,mode,nr,!alDisable);
					alDisable = alDisable || (!isRemote && mode==0 && num>=12 && num<15);//added gen sys alarm assignment to gen sys alarm
					if (isRemote && mode==0 && num==3) alDisable = false; //exception for osc detection on remote. it cannot be disable but it can be assigned to gen sys alarm
					if (alDisable){
						//checkbox system alarm deshabilitado en las alarmas inexistentes y la propia system alarm en master y remoto
						for (var i = 0; i < NrOfGralSystemAlarms; i++) {
								var el = document.getElementById("systemAlarm_"+num+"_"+mode+"_0_"+nr+"_"+i);
								el.checked = false;
								el.disabled = true;
							
						}
					}
					if (isRemote && mode==0 && num>=12 && num<15){
						var j = num-12;
						for (var i = 0; i < NrOfGralSystemAlarms; i++) { 
							if (i!=j){ //gen sys alarms only can be assigned to same gen sys alarm in remotes
								var el = document.getElementById("systemAlarm_"+num+"_"+mode+"_0_"+nr+"_"+i);
								el.checked = false;
								el.disabled = true;
							}
						}
					}
				}
			}
			for (var num=0;num<18;num++){
				var mode = 2;
				var alDisable = (isMaster && self.config[0].bbu_serial_mode==0);
				refreshCtrlEnable(num,mode, nr, !alDisable);
				if (alDisable){
					document.getElementById("enabled_"+num+"_"+mode+"_0_"+nr).checked = false;
					for (var i = 0; i < NrOfGralSystemAlarms; i++) {
						
							var el = document.getElementById("systemAlarm_"+num+"_"+mode+"_0_"+nr+"_"+i);
							el.checked = false;
							el.disabled = true;
						
					}
				}
			}
			for (var n = 0; n < bbuMeasurements.length; n++) {
				document.getElementById(bbuMeasurements[n].id+"_"+nr).style.backgroundColor = "#DDDDDD";
				document.getElementById(bbuMeasurements[n].id+"_"+nr).disabled = true;
			}
			document.getElementById("bbuBuzzerStatus"+"_"+nr).style.backgroundColor = "#DDDDDD";
			document.getElementById("bbuBuzzerStatus"+"_"+nr).disabled = true;
			if (self.config[nr].bbu_type == 2) {
				/* disable battery bank alarm (k=10) if H.P. bbu */
				var k=10;
				refreshCtrlEnable(k, 2, nr, false);
				if (!isMaster){
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
	}catch(e){}
}