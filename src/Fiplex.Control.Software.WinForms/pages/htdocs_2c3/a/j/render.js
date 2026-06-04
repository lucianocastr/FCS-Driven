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
var bsToolWindow = false;
var walkthroughWindow = false;

function Page() {
	this.init = function(fact,config){ //función abreviada para assistedGUI
		self.factory = fact;
		self.config = config;
	}
	this.show = function(tags, fact, version, serNr, config, NFPAcfg) {
		self.tags = tags;
		self.factory = fact;
		self.version = version;
		self.config = config;
		self.NFPA = NFPAcfg;
		if (typeof(serNr) !== 'undefined') {
			self.sernr = serNr;
		}
		self.draw();
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
	this.draw = function() {
		self.computeFilterVariables();
		var msgEl = self.warningBox.getContainerEl();
		var rootEl = document.getElementById(self.id);
		if (!rootEl) {
			rootEl = document.createElement("div");
			rootEl.id = self.id;
		} else {
			remove_element(rootEl);
			rootEl = document.createElement("div");
			rootEl.id = self.id;
			var msgBox = document.getElementById(msgEl.id);
			if (msgBox) {
				document.getElementById(self.parentId).removeChild(msgBox);
			}
		}

		document.getElementById(self.parentId).appendChild(rootEl);
		rootEl.appendChild(self.deepDischarge.getBox());
		var unit = self.createUnit();
		rootEl.appendChild(unit);	

		if (!document.getElementById(msgEl.id)) {
			document.getElementById(self.parentId).appendChild(msgEl);
		}
		self.showTag();
		self.showFreqs();
		self.showConfs();
		self.doFrequencyCheck = true;
		initFormChangeCheck();
	}
	this.close = function() {
		var rootEl = document.getElementById(self.id);
		if (rootEl) {
			remove_element(rootEl);
		}
		self.showChannelsBitmask = 0;
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
	this.computeFilterVariables = function() {
		for (var adj=0;adj<2;adj++){
			for (var band=0;band<2;band++){
				self.showFiltersMask[adj][band] = this.copy(self.config.filterEnabled[adj][band][1]);
			}
		}
	}
	this.createUnit = function() {
		var unitDiv = document.createElement("div");
		unitDiv.id = "unitDiv";
		unitDiv.className = "unitbox";
		var headDiv = this.createUnitHead();
		unitDiv.appendChild(headDiv);
		//GENERAL
		var headDiv = this.createBandHead("GENERAL");
		headDiv.id = "headDivAlarm";
		unitDiv.appendChild(headDiv);		
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDivAlarm";
		var tab = this.createGeneralInterface();
		contentDiv.appendChild(tab);
		headDiv.style.display = "block";
		contentDiv.style.display = "block";
		//AUTOMATIC TOOLS
		var headDiv = this.createULToolBox();
		unitDiv.appendChild(headDiv);		
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDivUlTools";
		contentDiv.style.display = "none";
		var tab = document.createElement("table");
		tab.className = "contenttable";
		contentDiv.appendChild(tab);
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);	
		var cellb = document.createElement("td");
		cellb.id = "contentCellUlTools";
		cellb.className = "contentcell";
		rowb.appendChild(cellb);
		//FILTER ENABLE
		var headDiv = this.createBandHead("FILTER ENABLE");
		headDiv.id = "headDivGeneral";
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDivGeneral";
		var tab = this.createFilterEnables();
		contentDiv.appendChild(tab);
		headDiv.style.display = "block";
		contentDiv.style.display = "block";
		//BAND CONTENT
		for (var band = 0;band<2;band++){
			var headDiv = this.createBandHead(self.factory.bandNames[band]);
			headDiv.id = "headDiv"+band;
			unitDiv.appendChild(headDiv);		
			var contentDiv = document.createElement("div");
			unitDiv.appendChild(contentDiv);
			contentDiv.className = "contentbox";
			contentDiv.id = "contentDiv"+band;
			var tab = this.createContentCtrl(band);
			contentDiv.appendChild(tab);
			var show = self.factory.chBandEnabled[band] || self.factory.adjBandEnabled[band];
			headDiv.style.display = show? "block" :"none";
			contentDiv.style.display = show? "block" :"none";
		}
		return unitDiv;
	}
	this.createULToolBox = function() {
		var box = document.createElement("div");
		box.id = "headDivUlTools";
		box.style.display = "none";
		box.className = "headbox";
		var tab = document.createElement("table");
		box.appendChild(tab);
		tab.className = "headtable";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.id = "ulToolTitle";
		cell.className = "band";
		cell.style.width = "100%";
		cell.style.textAlign = "center";
		var cell = document.createElement("td");
		row.appendChild(cell);		
		cell.className = "band";
		cell.style.width = "100px";	
		var bt = this.createCloseButton();
		cell.appendChild(bt);
		var cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);			
		return box;
	}
	this.createCloseButton = function(nr) {
		var img = document.createElement("img");
		img.src = "i/close.png";
		img.id = "closeButton";
		img.onclick = function(ev) {
			try {
				document.getElementById("headDivUlTools").style.display = "none";
				document.getElementById("contentDivUlTools").style.display = "none";
			} catch(e) {}
		}
		return img;
	}
	this.blockContent = function(doblock) {
		var id = "headDivAlarm";
		var headDiv = document.getElementById(id);
		if ( headDiv !== null ) {
			headDiv.style.display = doblock ? "none":"block";
		}
		id = "contentDivAlarm";
		var contentDiv = document.getElementById(id);
		if (contentDiv !== null) {
			contentDiv.style.display = doblock ? "none":"block";
		}
		var id = "headDivGeneral";
		var headDiv = document.getElementById(id);
		if ( headDiv !== null ) {
			headDiv.style.display = doblock ? "none":"block";
		}
		id = "contentDivGeneral";
		var contentDiv = document.getElementById(id);
		if (contentDiv !== null) {
			contentDiv.style.display = doblock ? "none":"block";
		}
		for (var band = 0;band<2;band++){
			id = "headDiv"+band;
			headDiv = document.getElementById(id);
			if ( headDiv !== null ) {
				headDiv.style.display = doblock ? "none":"block";
			}
			id = "contentDiv"+band;
			var contentDiv = document.getElementById(id);
			if (contentDiv !== null) {
				contentDiv.style.display = doblock ? "none":"block";
			}
		}
	}
	this.createUnitHead = function() {
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
		cell.id = "tagName";
		cell.innerHTML = "Tag";
		cell.className = "tag";
		cell.style.textAlign = "center";
		row.appendChild(cell);	
		var cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);		
		return box;
	}
	this.createBandHead = function(title) {
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
	this.showTag = function() {
		try {
			var el = document.getElementById("tagName");
			if(typeof String.prototype.trim !== 'function'){
				String.prototype.trim = function() {
					return this.replace(/^\s+|\s+$/g, '');
				}
			}
			var name = entify(self.tags.getTag());
			el.innerHTML = name.trim();
		} catch (err) {}
	}
	this.showTagBlocked = function() {
		try {
			var el = document.getElementById("tagName");
			el.innerHTML = "BLOCKED";
		} catch (err) {}
	}	
	this.createGeneralInterface = function(){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb); 
		var rspan = 3;
		if (!self.factory.extremeTempActionEnable) rspan--;
		if (!self.factory.oscFeatureEnable) rspan--;
		var cellOpf = this.createOPFContent(); cellOpf.className="contentcell";
		var cellAutoPaUL = this.createAutoPaUlOffContent(); cellAutoPaUL.className="contentcell";
		var cellTemp = this.createExtremeTempActionContent(); cellTemp.className="contentcell";
		var cellCnTimer = this.createCnAlarmTimeThresholdContent(); cellCnTimer.className="contentcell";
		var cellAutoAdjustUL = this.createAutoAdjustUL(); cellAutoAdjustUL.className="contentcell";
		var cellBbuTypeOfConnection = this.createBbuTypeOfConnectionContent(); cellBbuTypeOfConnection.className="contentcell";
		cellBbuTypeOfConnection.colSpan = 2;
		
		var cell = this.createAlarmTable();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = rspan;
		
		var cell = this.createAlarmTableBand();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = rspan;

		var cell = self.factory.oscFeatureEnable?cellOpf:cellAutoPaUL;
		cell.className = "contentcell";
		rowb.appendChild(cell);
		
		var cell = this.createRelayTable();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = rspan;

		if (self.factory.oscFeatureEnable){
			rowb = document.createElement("tr");
			tab.appendChild(rowb);
			rowb.appendChild(cellAutoPaUL);
			if (self.factory.extremeTempActionEnable){
				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellTemp);

				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellBbuTypeOfConnection);
				rowb.appendChild(cellCnTimer);
				rowb.appendChild(cellAutoAdjustUL);
			} else {
				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellBbuTypeOfConnection);
				rowb.appendChild(cellCnTimer);
				rowb.appendChild(cellAutoAdjustUL);

				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellTemp);
			}
		} else {
			if (self.factory.extremeTempActionEnable){
				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellTemp);

				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellBbuTypeOfConnection);
				rowb.appendChild(cellCnTimer);
				rowb.appendChild(cellAutoAdjustUL);
			} else {
				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellBbuTypeOfConnection);
				rowb.appendChild(cellCnTimer);
				rowb.appendChild(cellAutoAdjustUL);

				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellTemp);
			}
			rowb = document.createElement("tr");
			tab.appendChild(rowb);
			rowb.appendChild(cellOpf);
		}
		rowb = document.createElement("tr");
		tab.appendChild(rowb);
		rowb.appendChild(this.createExternalPAConfiguration());

		rowb.appendChild(this.createGeneralControls());

		return tab;
	}
	this.createExternalPAConfiguration = function(){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.colSpan = 2;
		var tab2 = document.createElement("table");
		tab2.style.borderCollapse = "separate";
		tab2.style.borderSpacing = "2px 2px";
		tab2.style.width = "100%";
		cellb.appendChild(tab2);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		var cell = document.createElement("th");
		cell.innerHTML = "POWER&nbsp;AMPLIFIER&nbsp;CONFIGURATION";
		cell.colSpan = 2;
		cell.className = "cth";
		row.appendChild(cell);
		row = document.createElement("tr");
		tab2.appendChild(row);	
		this.createExternalPASelect(row);
		return cellb;
	}
	this.createExternalPASelect = function(row) {
		var cell = document.createElement('th');
		cell.innerHTML = "PA Type (Standard/High Power)";
		cell.className = "thdrht";
		cell.style.width = "180px";
		row.appendChild(cell);
		cell = document.createElement('td');
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "paType";
		el.name = el.id;
		el.self = this;
		var opts = [ "Standard Power. Internal PA", "High Power. External PA" ];
		for (var i = 0; i < opts.length; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.selectedIndex = 0;
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.style.width = "180px";
		el.style.textAlign = "left";
		cell.appendChild(el);
	}
	this.showExternalPAConfig = function(value) {
		if ( typeof(value) === 'undefined' || isNaN(value) ) {
			return;
		}
		value = ~~value;
		try {
			var el = document.getElementById('paType');
			if ( value >= el.options.length ) {
				value = 0;
			}
			el.selectedIndex = value;
		} catch(err) {}
	}
	this.readExternalPAConfig = function() {
		try {
			var el = document.getElementById('paType');
			return el.selectedIndex;
		} catch(err) { return 0; }
	}
	this.createGeneralControls = function(){
		var cellb = document.createElement("td");
		cellb.className = "contentcell";
		cellb.colSpan = 2;
		//table containing reset, freq style, squelchAdjBwMode and temp board
		var tab = document.createElement("table");
		cellb.appendChild(tab);
		tab.style.width = "100%";
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row, cell;
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.width = "25%";
		cell.appendChild(this.createUnitReset());
		cell = document.createElement("td");
		cell.appendChild(this.createFreqStyleSw());
		cell.style.width = "25%";
		row.appendChild(cell);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.appendChild(this.createTempBoard());
		cell.style.width = "25%";
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.appendChild(this.squelchAdjBwModeCreate());
		cell.style.width = "25%";
		return cellb;
	}
	this.createAutoAdjustUL = function() {
		var cellb = document.createElement("td");
		var tbl =document.createElement("table");
		tbl.style.width = "100%"
		tbl.style.marginRight = "5px;"
		cellb.appendChild(tbl);
		var tb =document.createElement("tbody");
		tbl.appendChild(tb);
		row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = "AUTOMATIC&nbsp;UPLINK&nbsp;SETTINGS";
		cell.className = "cth";
		cell.colSpan = 3;
		row.appendChild(cell);
		var row = document.createElement("tr");
		tb.appendChild(row);
		cell = document.createElement("td");
		cell.style.textAlign="center";
		row.appendChild(cell);
		cell.appendChild(this.createBSautoAdjustButton());
		cell = document.createElement("td");
		cell.style.width = "3px";
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.style.textAlign="center";
		row.appendChild(cell);
		cell.appendChild(this.createWalkthroughButton());
		return cellb;
	}
	this.createAlarmTableBand = function(){
		var show;
		var cellb = document.createElement("td");
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);			
		for (var band=0;band<2;band++){
			if (band==1 && show){
				var row = document.createElement("tr");
				var cell = document.createElement("th");
				cell.style.paddingTop = "5px";
				row.appendChild(cell);
				tb.appendChild(row);
			}
			show = self.factory.chBandEnabled[band] || self.factory.adjBandEnabled[band];
			var row = document.createElement("tr");
			row.style.display = show? "table-row" :"none";
			tb.appendChild(row);
			var cell = document.createElement("th");
			cell.className = "cth";
			cell.innerHTML = self.factory.bandNames[band].replace("BAND","")+ "&nbsp;ALARMS";
			cell.style.paddingLeft = "10px";
			cell.style.paddingRight = "10px";
			cell.colSpan = 2;
			cell.style.minWidth = "100pt";
			row.appendChild(cell);
			for (var k=0;k<self.NFPA.bandAlarmsInstalled.length;k++){
				tb.appendChild(this.createBandAlarm(band,k,self.NFPA.alarmNames[1][k],show && self.NFPA.bandAlarmsInstalled[k]));
			}
		}	
		return cellb;
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
		for (var k=0;k<self.NFPA.globalAlarmsInstalled.length;k++){
			tb.appendChild(this.createGralAlarm(k,self.NFPA.alarmNames[0][k],self.NFPA.globalAlarmsInstalled[k]));
		}	
		var bbuSerialMode = isBbuSerialMode(this.config, this.factory, this.version);
		var row = document.createElement("tr");
		row.style.minHeight = "50px";
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
		for (var k=0;k<self.NFPA.bbuAlarmsInstalled.length;k++){
			var show = self.NFPA.bbuAlarmsInstalled[k]&&bbuSerialMode;
			tb.appendChild(this.createBbuAlarm(k,self.NFPA.alarmNames[2][k],show));
		}	
		return cellb;
	}
	this.createRelayTable = function(){
		var cellb = document.createElement("td");
		var tbl = document.createElement("table");
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
		var nrOfRelaysSupported = getNrOfRelaysSupported(self.config, self.factory, self.version)
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
		var isNormalACPowerRelay = isBbuSerialMode(self.config, self.factory, self.version) && self.NFPA.isRelayAssignNormalACpowerExclusive(nrelay);
		var el = document.getElementById("relStat_"+nrelay);
		if (!isNormalACPowerRelay) {
			el.innerHTML = onoff?"Alarm<br/>ON":"Alarm<br/>OFF";
		} else {
			el.innerHTML = "";
		}
		el = document.getElementById("relStatImg_"+nrelay);
		el.innerHTML = "<img src=/i/"+(openclose?"open":"closed")+".png><br>"+(openclose?"Open":"Closed");
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
	this.createAutoPaUlOffContent = function(){
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
		var el = this.createAutoPaUlOff();
		cell.appendChild(el);
		return cellb;
	}
	this.createExtremeTempActionContent = function(){
		var cellb = document.createElement("td");
		cellb.id = "extremeTempActionCell";
		var tab2 = document.createElement("table");
		tab2.style.borderCollapse = "separate";
		tab2.style.borderSpacing = "2px 2px";
		tab2.style.width = "100%";
		cellb.appendChild(tab2);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		var cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createExtremeTempActionBox();
		cell.appendChild(el);	
		return cellb;
	}
	this.createOPFContent = function(){
		var cellb = document.createElement("td");
		cellb.id = "opfSettingsCell";
		var tab2 = document.createElement("table");
		tab2.style.borderCollapse = "collapse";
		//tab2.style.borderSpacing = "2px 2px";
		tab2.style.width = "100%";
		cellb.appendChild(tab2);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		var cell = document.createElement("td");
		var el = this.createOpfSettingsAntIsol();
		cell.appendChild(el);
		row.appendChild(cell);	
		var row = document.createElement("tr");
		tab2.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);		
		row.style.height = "1px";		
		var row = document.createElement("tr");
		tab2.appendChild(row);
		var cell = document.createElement("td");
		var el = this.createOpfSettingsOscDet();
		cell.appendChild(el);
		row.appendChild(cell);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		return cellb;
	}
	
	this.createContentCtrl = function(band) {
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var row = document.createElement("tr");
		tab.appendChild(row);		
		for (var i = 0; i < 2; ++i) {
			var cell = document.createElement("td");
			row.appendChild(cell);
			cell.className = "contentcell";
			var el = this.createBandBox(i,band);
			cell.appendChild(el);
		}
		row = document.createElement("tr");
		row.id = "filtersRow_"+band;
		row.style.display = "none";
		tab.appendChild(row);
		var cell = document.createElement("td");	
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 2;
		cell.className = "contentcell";
		cell.style.minHeight = "50px";
		cell.appendChild(this.createFilterTables(band,1));
		cell.appendChild(this.createFilterTables(band,0));
		return tab;
	}
	this.createFilterTables = function(band,nbadj) {
		var mainTbl = document.createElement("table");
		mainTbl.style.width="100%";
		var tb = document.createElement("tb");
		tb.id = "TableFilter_"+band+"_"+nbadj;
		tb.style.width="100%";
		mainTbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		for (var b = 0; b < 2; ++b) {
			var cell = document.createElement("td");
			row.appendChild(cell);
			cell.style.color = "black";
			cell.style.fontWeight = "bold";
			cell.style.textAlign = "center";
			cell.id = "titleTableFilt"+band+"_"+nbadj+"_"+b;cell.name = cell.id;
			var str;
			if (nbadj==1) {
				str = (b==0? Texts['FILTUL'] : Texts['FILTDL']) + "&nbsp;(ADJ.BW&nbsp;FILTERS: " + numEnabledFilts(band,nbadj,self.config,self.factory)+ ")";
			} else {
				if (this.factory.chBandEnabled[band]){
					str = (b==0? Texts['FILTUL'] : Texts['FILTDL']) + "&nbsp;(CHANNEL&nbsp;FILTERS: " + numEnabledFilts(band,nbadj,self.config,self.factory)+ ")";
				} else {
					str = "CHANNEL SELECTION FOR "+(b==0? "UPLINK":"DOWNLINK")+" SQUELCH";
				}
			}
			cell.innerHTML = str;
			cell.className = "cth";
		}
		row = document.createElement("tr");
		tb.appendChild(row);
		for (var i = 0; i < 2; ++i) {
			var cell = document.createElement("td");
			row.appendChild(cell);
			cell.appendChild(this.createFilterTable(i,band,nbadj));
			cell.style.width="50%";
		}
		return mainTbl;
	}
	this.createFilterEnables = function() {
		//table containing enables
		var tab = document.createElement("table");
		tab.className = "contenttable";
		tab.style.width = "100%";
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var celladj, cellch;
		row = document.createElement("tr");
		body.appendChild(row);
		//enables adj bw
		celladj = document.createElement("td");
		celladj.className = "contentcell";
		celladj.style.verticalAlign = "middle";
		row.appendChild(celladj);
		celladj.appendChild(this.createShowFiltAdjTable());	
		celladj.style.display = (self.factory.adjBandEnabled[0] || self.factory.adjBandEnabled[1])?"table-cell":"none";
		//enables channels
		cellch = document.createElement("td");	
		cellch.className = "contentcell";
		cellch.style.verticalAlign = "middle";
		row.appendChild(cellch);
		cellch.appendChild(this.createShowFiltTable());
		cellch.id = "showFiltTable";	
		cellch.style.display = (self.factory.chBandEnabled[0] || self.factory.chBandEnabled[1] || self.factory.isClassB())?"table-cell":"none";
		return tab;
	}
	this.createShowFiltAdjTable = function() {
		var tab = document.createElement("table");
		tab.style.margin = "auto";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var head = document.createElement("th");
		row.appendChild(head);
		var str = "On/Off&nbsp;Adj.Bw&nbsp;";
		head.className = "thdrht";
		str += "&nbsp;(1-"+2*self.factory.numADJFilters+")";
		if (self.factory.numADJFilters==1) str = "On/Off&nbsp;Adj.Bw&nbsp;Filter";
		head.innerHTML = str;
		for (var b=0;b<2;b++){
			for (var c = 0; c < self.factory.numADJFilters; ++c) {
				var cell = document.createElement("td");
				cell.appendChild(this.createFilterShow(c,b,1));
				row.appendChild(cell);
			}
		}
		if (self.factory.adjBandEnabled[0]){
			var row = document.createElement("tr");
			tb.appendChild(row);
			var head = document.createElement("th");
			row.appendChild(head);
			head.innerHTML = "Assign 1st ADJBW to Band 14";
			head.className = "thdrht";
			var cell = document.createElement("td");
			cell.appendChild(this.createFirstNetCtl());
			row.appendChild(cell);			
		}
		return tab;
	}
	this.createShowFiltTable = function() {
		var tab = document.createElement("table");
		tab.style.marginLeft = tab.style.marginRight = "auto";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var nch = self.config.CHNR;
		var enablesPerRow = 20; // Show exactly 20 filter enables per row
		
		// Calculate total number of filters (both bands combined)
		var totalFilters = nch * 2; // nch filters per band * 2 bands
		var numRows = Math.ceil(totalFilters / enablesPerRow);
		
		// Create rows with exactly 20 enables each (except possibly the last row)
		for (var rowIndex = 0; rowIndex < numRows; rowIndex++){
			var row = document.createElement("tr");
			tb.appendChild(row);
			var head = document.createElement("th");
			row.appendChild(head);
			
			// Calculate filter range for this row
			var startFilter = rowIndex * enablesPerRow + 1;
			var endFilter = Math.min(startFilter + enablesPerRow - 1, totalFilters);
			
			var str = "On/Off&nbsp;filters&nbsp;(";
			str += startFilter + "-" + endFilter + ")";
			head.innerHTML = str;
			head.className = "thdrht";
			
			// Add filter enable cells for this row (up to 20)
			for (var cellIndex = 0; cellIndex < enablesPerRow && (rowIndex * enablesPerRow + cellIndex) < totalFilters; cellIndex++) {
				var globalFilterIndex = rowIndex * enablesPerRow + cellIndex;
				
				// Determine which band and channel this filter belongs to
				var b = Math.floor(globalFilterIndex / nch); // band (0 or 1)
				var n = globalFilterIndex % nch; // channel index within the band
				
				var cell = document.createElement("td");
				cell.appendChild(this.createFilterShow(n, b, 0));
				row.appendChild(cell);
			}
		}
		return tab;
	}
	this.showFilterTable = function(show) {
		try {
			document.getElementById("showFiltTable").style.display = show?"table-cell":"none";
		} catch(e){}
	}
	this.showFirstNet = function(on){
		var showFn = on;
		if (self.bandGet(0,1,0)!=0) showFn = false; //if first ADJ filter is not assigned to 700MHz, filter is shown in normal style
		for (var b=0;b<2;b++){
			try {
				document.getElementById("cellAdjF_0_"+b+"_0_0").colSpan = showFn?2:1;
				document.getElementById("cellAdjF_0_"+b+"_1_0").style.display = showFn?"none":"table-cell";	
				document.getElementById("chAdjF_0_"+b+"_0_0").style.display = showFn?"none":"block";
				document.getElementById("firstnet_"+b).style.display = showFn?"block":"none";
			} catch(err) {}
		}
	}
	this.createFirstNetCtl = function() {
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = el.name = "firstNet";
		el.onclick = function(ev) {
			if (this.checked) {
				if (self.bandGet(0,1,0)!=0) {
					this.checked = false;
					alert("The first Adj.Bw filter is not assigned to " + self.factory.bandNames[0] + ". Band 14 cannot be selected.");
				}else{
					document.getElementById("chAdjF_0_0_0_0").value = !self.freqStyle?"788.000":"793.000";
					document.getElementById("chAdjF_0_0_1_0").value = !self.freqStyle?"798.000":"10.000";
					document.getElementById("chAdjF_0_1_0_0").value = !self.freqStyle?"758.000":"763.000";
					document.getElementById("chAdjF_0_1_1_0").value = !self.freqStyle?"768.000":"10.000";
				}
			}else{
				for (var b=0;b<2;b++)
					self.setAdjFreqCh(b, 0, 0, self.config.fstartHzAdjFilter[0][b][0], self.config.fstopHzAdjFilter[0][b][0]);
			}
			self.showFirstNet(this.checked);
		}
		return el;
	}
	this.setFirstNet = function(on) {
		try {
			var el = document.getElementById("firstNet");
			el.checked = on;
		} catch (err) {}
	}
	this.getFirstNet = function() {
		try {
			var el = document.getElementById("firstNet");
			return el.checked;
		} catch (err) {
			return false;
		}
	}
	this.createFilterShow = function(c, band, nbadj) {
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = el.name = "filtShow_"+nbadj+"_"+band+"_"+c;
		el.nr = c;
		el.band = band;
		el.nbadj = nbadj;
		if (nbadj==0){
			el.title = "Channel Filter "+(self.maxChannels*band+c+1);
		}else{
			el.title = "Adj Filter "+(self.factory.numADJFilters*band+c+1);
		}
		el.onclick = function(ev) {
			self.setFilterShow(this.nr, this.band, this.nbadj, this.checked);
			self.displayFilters();
		}
		return el;
	}
	this.setShowFilter = function(c, band, nbadj, on) {
		try {
			var el = document.getElementById("filtShow_"+nbadj+"_"+band+"_"+c);
			el.checked = on;
		} catch(err) {}
	}
	this.getShowFilter = function(c, band, nbadj) {
		try {
			var el = document.getElementById("filtShow_"+nbadj+"_"+band+"_"+c);
			return el.checked;
		} catch(err) { return false; }
	}
	this.createFilterTable = function(b,band,nbadj) {
		var chFiltTable = document.createElement("table");
		chFiltTable.className = "bt";
		chFiltTable.style.padding = "1px 1px 1px 1px";
		var chFiltBody = document.createElement("tbody");
		chFiltTable.appendChild(chFiltBody);
		var row = document.createElement("tr");
		chFiltBody.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);
		var tab = document.createElement("table");
		tab.id = "filterTable_"+b+"_"+band+"_"+nbadj;
		tab.style.borderSpacing = "0px"
		cell.appendChild(tab);
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		row = document.createElement("tr");
		tb.appendChild(row);
		this.createFilterTableHeader(row, b, band, nbadj);
		var max = nbadj==0? this.maxChannels : self.factory.numADJFilters;
		for (var fb=0;fb<2;fb++){ //both arrays are required to identify filters belonging to each band
			for (var r = 0; r < max; r++) {
				if (self.config.filterBand[nbadj][fb][1][r] != band) { //discard filters not belonging to this band
					continue;
				}
				row = document.createElement("tr");
				row.style.height = "22px";
				row.id = "filterRow_"+r+"_"+b+"_"+fb+"_"+nbadj;
				var do_show = this.showFiltersMask[nbadj][fb][r];
				if (!do_show) {
					row.style.display ="none";
				}
				tb.appendChild(row);
				this.createFilterChannel(row, b, r, fb, nbadj);
			}
		}
		return chFiltTable;
	}
	this.setFilterShow = function(c, band, nbadj, do_show) {

		self.showFiltersMask[nbadj][band][c] = do_show;
		for (var b = 0; b < 2; ++b) {
			if (do_show){
				if (nbadj==1){
					var fband = self.config.filterBand[1][band][1][c];
					if (!self.factory.adjBandEnabled[fband]){
						self.bandSet(band,1,c,1-fband); //assure that filter is assigned to a valid band
						document.getElementById("band_"+c+"_"+band+"_1").onchange();
					}
					self.setAdjFreqTitles(b, band, c);
					self.limitAdjFilterValues(b, c, 0, band);
				}else{
					var fband = self.config.filterBand[0][band][1][c];
					if (!self.factory.chBandEnabled[fband] && !self.factory.adjBandEnabled[fband]){
						self.bandSet(band,0,c,1-fband); //assure that filter is assigned to a valid band
						document.getElementById("band_"+c+"_"+band+"_0").onchange();
					}
					self.setFiltFreqTitles(b, band, c);
					self.limitChFilterValues(b, c, band);
				}
			}
		}
		try {
			for (var b = 0; b < 2; ++b) {
				var row = document.getElementById("filterRow_"+c+"_"+b+"_"+band+"_"+nbadj);
				row.style.display = do_show ? "table-row" : "none";
			}
		} catch(err) {}
	}
	this.createFilterTableHeader = function(chFiltRow, b, band, nbadj) {
		chFiltRow.style.textAlign = "center";
		if (b == 0) {
			var td = document.createElement("td");
			chFiltRow.appendChild(td);
			td.innerHTML = "Nr.";
			var td = document.createElement("td");
			chFiltRow.appendChild(td);
			td.innerHTML = "Band";
		}
		if (b == 1) {
			var td = document.createElement("td");
			chFiltRow.appendChild(td);
			td.innerHTML = "CCH";
		}
		var td = document.createElement("td");
		td.id = "HeaderF1_"+b+"_"+band+"_"+nbadj;
		chFiltRow.appendChild(td);
		if (nbadj==1 && self.freqStyle == 0) {
			td.innerHTML = "Fstart&nbsp;(MHz)";
		} else {
			td.innerHTML = "Fr.&nbsp;(MHz)";
		}
		td = document.createElement("td");
		td.id = "HeaderF2_"+b+"_"+band+"_"+nbadj;
		chFiltRow.appendChild(td);
		if (nbadj==1) {
			if (self.freqStyle == 0) {
				td.innerHTML = "Fstop&nbsp;(MHz)";
			} else {
				td.innerHTML = "BW&nbsp;(MHz)";
			}
		} else {
			td.innerHTML = "BW&nbsp;(KHz)";
		}

		var show = true;
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB()) {
			show = false;
		}
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "G(dB)";
		td.style.whiteSpace = "nowrap";
		td.style.display = (show?"table-cell":"none");
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "Power&nbsp;IN(dBm)";
		td.colSpan = 2;
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "Det";
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "Power&nbsp;OUT(dBm)";
		td.colSpan = 2;
		td.style.display = (show?"table-cell":"none");
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "AGC/ch(dB)";
		td.colSpan = 2;
		td.style.display = (show?"table-cell":"none");
		td.id = "agcHeaderTxt_"+b+"_"+band+"_"+nbadj; // se oculta en modo agc max power
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "SQ(dBm)";
		td.style.whiteSpace = "nowrap";
		if (!(nbadj==1 || b==1)) td.style.display = "none";
		td.colSpan = 2;
		td.id = "chSqTitle_"+band+"_"+nbadj+"_"+b;
		if (!self.factory.chBandEnabled[band] && self.factory.isClassB()) {
			if (self.config.squelchAdjBwMode){
				if (nbadj==1){
					td.innerHTML = "SQ Enable";
				}
				td.colSpan = 1;
			}
		}
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "C/N th(dBm)";
		td.style.whiteSpace = "nowrap";
		td.id = "cnHeader_"+band+"_"+nbadj;
		if (!(nbadj==1 && b==0)){
			td.style.display = "none";
		} else if (self.factory.isClassB() && (self.config.squelchAdjBwMode)){
			td.style.display = "none";
		}

	}
	this.chFiltTableTitleSet = function(band,dn,sqAdjbwMode){
		try {
			var el = document.getElementById("titleTableFilt"+band+"_0_"+dn);
			var ud = (dn==0? "UPLINK":"DOWNLINK");
			var txt = "CHANNEL SELECTION FOR "+ud+" SQUELCH";
			if (sqAdjbwMode) txt+= " FOR SELECTED ADJ BW FILTER<br><span style='font-weight:normal;font-size:8pt'>WARNING: These are not channel filters. This is only to select the channels that will activate<br>the squelch in the Adj BW filter</span>";
			el.innerHTML = txt;
		} catch(e){}
	}
	this.chSqTitleSet = function(band,nbadj,dn,sqAdjbwMode){
		try {
			var el = document.getElementById("chSqTitle_"+band+"_"+nbadj+"_"+dn);
			el.innerHTML = (sqAdjbwMode ? "SQ Enable":"SQ(dBm)");
			el.colSpan = (sqAdjbwMode ? 1 : 2);
		} catch(e){}
	}
	this.isFiltEnabled = function(c, band, nbadj) {
		var on = false;	
		try {
			on = self.getShowFilter(c, band, nbadj);
		} catch(err) {}
		return on;
	}
	this.createFilterChannel = function(chFiltRow, b, c, band, nbadj) {
		if (b==0){
			var cell = document.createElement("td");
			cell.innerHTML = 1+(nbadj==0?self.maxChannels:self.factory.numADJFilters)*band + c;
			cell.style.textAlign = "center";
			cell.style.paddingRight = "10px";
			chFiltRow.appendChild(cell);
			chFiltRow.appendChild(this.createBand(band, nbadj, c));
		}
		if (b==1){
			chFiltRow.appendChild(this.createControlChannel(band, nbadj, c));
		}
		if (nbadj==1){
			chFiltRow.appendChild(this.createAdjFr(b, c, 0, band));
			chFiltRow.appendChild(this.createAdjFr(b, c, 1, band));
		}else{
			chFiltRow.appendChild(this.createFiltFrequency(b, c, band));
			chFiltRow.appendChild(this.createChBw(b, c, band));		
		}
		chFiltRow.appendChild(this.createGfine(b, c, band, nbadj));
		chFiltRow.appendChild(this.createMetPowIn(b, c, band, nbadj));
		chFiltRow.appendChild(this.createTextPowIn(b, c, band, nbadj,1));
		chFiltRow.appendChild(this.createSignalDetect(b, c, band, nbadj));
		chFiltRow.appendChild(this.createMetPowOut(b, c, band, nbadj));
		chFiltRow.appendChild(this.createTextPowOut(b, c, band, nbadj,0));
		chFiltRow.appendChild(this.createMetAgc(b, c, band, nbadj));
		chFiltRow.appendChild(this.createTextAgc(b, c, band, nbadj,0));
		if (nbadj==1 || b==1){
			chFiltRow.appendChild(this.createChSquelchEnable(b, c, band, nbadj));
			chFiltRow.appendChild(this.createChSquelchThreshold(b, c, band, nbadj));
		}
		if (nbadj==1 && b==0) {
			chFiltRow.appendChild(this.createCNThresholdULadj(band, c));
		}
	}
	this.setFiltFreqTitles = function(b, band, c) {
		var fr = document.getElementById("chFreq_"+c+"_"+b+"_"+band);
		if (!fr) return;
		var fband = self.bandGet(band,0,c);
		fr.title = "Min: "+(self.factory.fstart[2*fband+b]/1e6) + ", Max: "+(self.factory.fstop[2*fband+b]/1e6)+" MHz";
		
	}
	this.createFiltFrequency = function(b, c, band) {
		var cell = document.createElement("td");
		var fr = document.createElement("input")
		fr.type = "text";
		fr.id = "chFreq_"+c+"_"+b+"_"+band;
		fr.name = fr.id;
		fr.style.width = "65px";
		fr.className = "number";
		fr.channel = c;
		fr.path	= b;
		fr.band = band;
		var fband = this.config.filterBand[0][band][b][c];
		fr.title = "Min: "+(this.factory.fstart[2*fband+b]/1e6) + ", Max: "+(this.factory.fstop[2*fband+b]/1e6)+" MHz";
		fr.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		fr.onchange = function(ev) {
			var b = this.path;
			var c = this.channel;
			var band = this.band;
			self.limitChFilterValues(b, c, band);
		}
		cell.appendChild(fr);
		return cell;
	}
	this.limitChFilterValues = function(b, c, band){
		var fband = self.bandGet(band,0,c);
		var fr = self.getFreqCh(b, c, band);
		if (fr < self.factory.fstart[2*fband+b]) fr = self.factory.fstart[2*fband+b];
		if (fr > self.factory.fstop[2*fband+b]) fr = self.factory.fstop[2*fband+b];
		fr = ~~Math.round(fr/self.factory.fstep);
		fr *= self.factory.fstep;
		self.setFreqCh(b, c, band, fr);
		if (!self.isFreqSplitFixed(fband)) return;
		if ((b % 2)==0){
			fr += self.factory.uldlFreqSplit[fband];
			b++;
		}else{
			fr -= self.factory.uldlFreqSplit[fband];
			b--;
		}
		if (fr < self.factory.fstart[2*fband+b]) fr = self.factory.fstart[2*fband+b];
		if (fr > self.factory.fstop[2*fband+b]) fr = self.factory.fstop[2*fband+b];
		self.setFreqCh(b, c, band, fr);
	}
	this.setFreqCh = function(b, c, band, frq) {
		try {
			var val = (frq / 1.0e6).toFixed(6);
			var el = document.getElementById("chFreq_"+c+"_"+b+"_"+band);
			if (el) {
				el.value = val;
			}
		} catch (err) { }
	}
	this.getFreqCh = function(b, c, band) {
		try {
			var el = document.getElementById("chFreq_"+c+"_"+b+"_"+band);
			return ~~Math.round(parseFloat(el.value) * 1.0e6);
		} catch (err) { return Number.NaN; }
	}
	this.createGfine = function(b, c, band, nbadj) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		cell.appendChild(el);
		el.id = "Gfine_"+c+"_"+b+"_"+band+"_"+nbadj;
		el.name = el.id;
		el.type = "text";
		el.style.width = "20px";
		el.className = "number";
		el.path = b;
		el.chNr = c;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.title = "Min: "+self.config.limitgFine[b].MIN+", Max: "+self.config.limitgFine[b].MAX+" dB";
		el.onchange = function(ev) {
			var num = parseInt(this.value);
			if (isNaN(num)) {
				num = 0;
			}
			if (num < self.config.limitgFine[b].MIN) {
				this.value = self.config.limitgFine[b].MIN;
			} else if (num > self.config.limitgFine[b].MAX) {
				this.value = self.config.limitgFine[b].MAX;
			} else {
				this.value = num;
			}
		}
		cell.appendChild(el);
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB()) {
			cell.style.display = "none";
		}
		return cell;
	}
	this.setGfine = function(b, c, band, nbadj, val) {
		try {
			var el = document.getElementById("Gfine_"+c+"_"+b+"_"+band+"_"+nbadj);
			if (el && !isNaN(val)) {
				el.value = val.toString();
			}
		} catch (err) { }
	}
	this.getGfine = function(c, b, band, nbadj) {
		try {
			var el = document.getElementById("Gfine_"+c+"_"+b+"_"+band+"_"+nbadj);
			if (el) {
				return parseInt(el.value);
			}
			return 0;
		} catch (err) { return 0; }
	}
	this.createFreqSplit = function(band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts["FREQSPLIT"];
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "freqSplit"+band;
		el.name = el.id;
		el.self = this;
		el.band = band;
		var opts = [ Texts['FIXED'], Texts['VARIABLE'] ];
		for (var i = 0; i < 2; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.selectedIndex = 0;
		el.onchange = function(ev) {
			var fixed = this.selectedIndex == 0;
			var band = this.band;
			for (var fb = 0; fb < 2; fb++) {//it is necessary to check filters of both arrays, discarding those that do not belong to the real band
				for (var c = 0; c < self.maxChannels; ++c) {
					if (self.bandGet(fb, 0, c) != band) continue; //discard filters that do not belong to the real band
					self.frSplitChRedraw(c, fb, fixed);
				}
			}
			if (fixed){
				for (var fb = 0; fb < 2; fb++) {//it is necessary to check filters of both arrays, discarding those that do not belong to the real band
					for (var c = 0; c < self.config.ADJNR; ++c) {
						if (self.bandGet(fb, 0, c) != band) continue; //discard filters that do not belong to the real band
						var fr = self.getAdjFreq(1, c, fb);
						for (var s=0;s<2;s++){
							fr[s] -= self.factory.uldlFreqSplit[band];
						}
						self.setAdjFreqCh(0, c, fb, fr[0], fr[1]);
					}
				}
			}
		}	
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		cell.style.verticalAlign = "middle";
		cell.appendChild(el);
		return row;
	}
	this.setFreqSplit = function(band,mode) {
		try {
			var el = document.getElementById("freqSplit"+band);
			el.selectedIndex = mode ? 0 : 1;
		} catch (err) { }
	}
	this.isFreqSplitFixed = function(band) {
		try {
			var el = document.getElementById("freqSplit"+band);
			return el.selectedIndex == 0;
		} catch (err) { return 0;}
	}
	this.frSplitChRedraw = function (c, band, fixed) {
		var b = 1;
		var fband = self.bandGet(band, 0, c);
		var fr = self.getFreqCh(b, c, band);
		if (fr < self.factory.fstart[2*fband+b]) fr = self.factory.fstart[2*fband+b];
		if (fr > self.factory.fstop[2*fband+b]) fr = self.factory.fstop[2*fband+b];
		fr = ~~Math.round(fr/self.factory.fstep);
		fr *= self.factory.fstep;
		self.setFreqCh(b, c, band, fr);
		if (!fixed) return;
		fr -= self.factory.uldlFreqSplit[fband];
		b--;
		if (fr < self.factory.fstart[2*fband+b]) fr = self.factory.fstart[2*fband+b];
		if (fr > self.factory.fstop[2*fband+b]) fr = self.factory.fstop[2*fband+b];
		self.setFreqCh(b, c, band, fr);
	}
	this.squelchAdjBwModeCreate = function() {
		var box = document.createElement("div");
		box.id = "SquelchAdjBwModeBox";
		box.style.display = self.factory.isClassB()?"block":"none";
		var row = document.createElement("tr");
		box.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Squelch Adj.Bw Mode";
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.paddingLeft = "5px";
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "squelchAdjBwMode";
		el.name = el.id;
		var opts = [ "Normal", "Channel based" ];
		for (var i = 0; i < 2; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.style.width = "100px";
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.selectedIndex = 0;
		el.onchange = function(ev){
			self.displayFilters();
		}
		cell.appendChild(el);
		return box;
	}
	this.squelchAdjBwModeDisplay = function(on) {
		try {
			document.getElementById("SquelchAdjBwModeBox").style.display = on?"table-row":"none";
		} catch(e){}
	}
	this.squelchAdjBwModeSet = function(filtersBaseMode) {
		try {
			var index = 0;
			if (self.factory.isClassB()) {
				index = (filtersBaseMode?1:0);
			}
			var el = document.getElementById("squelchAdjBwMode");
			var currentIndex = el.selectedIndex;
			el.selectedIndex = index;
			if (currentIndex != index) el.onchange();
		} catch(e){}
	}
	this.squelchAdjBwModeRead = function() {
		try {
			if (!self.factory.isClassB()) return false;
			return (document.getElementById("squelchAdjBwMode").selectedIndex == 1);
		} catch(e){return false;}
	}
	this.createUnitReset = function() {
		var box = document.createElement("div");
		var reset = document.createElement("input");
		reset.id = "reset";
		reset.name = reset.id;
		reset.type = "button";
		reset.value = "RESET";
		reset.className = "resetbutton";
		reset.onclick = function() { submitform(true, false, false); } 
		box.appendChild(reset);
		return box;
	}
	this.resetDisableStateSet = function(disable) {
		try {
			var el = document.getElementById("reset");
			el.disabled = disable? true : false;
		} catch (err) {}
	}
	this.createTempBoard = function() {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = createMetRow("boardTemp", board_temp_settings, Texts['TEMPERATURE'], "&ordm;C");
		tb.appendChild(row);
		return box;
	}
	this.boardTempSet = function(val) {
		setMetValue("boardTemp", val);
	}

	this.createGralAlarm = function(num,txt,show){
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.style.width = "70%";
		cell.style.maxWidth = "100pt";
		cell.style.overflow = "hidden";
		row.appendChild(cell);
		cell.innerHTML = txt;
		cell.className = "thdrht";
		cell = createLedBox("gralAlarm_"+num);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
		row.style.display = show?"table-row":"none";
		return row;
	}
	this.gralAlarmSet = function(num,alarm) {
		ledSetColor("gralAlarm_"+num, alarm ? "red" : "grey");
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
		cell = createLedBox("bbuAlarm_"+num);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
		row.style.display = show?"table-row":"none";
		return row;
	}
	this.bbuAlarmSet = function(num,alarm, ChargerErrorCodeValue) {
		ledSetColor("bbuAlarm_"+num, alarm ? (num>0?"red":"green") : "grey");
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
		var bbuSerialMode = isBbuSerialMode(this.config, this.factory, this.version);
		var nrOfRelaysSupported = getNrOfRelaysSupported(this.config, this.factory, this.version);
		var el = document.getElementById("BBUalarmsHeaderRow");
		try {
			el.style.display = (bbuSerialMode? "table-row":"none");
		} catch(e){}
		for (var k=0;k<self.NFPA.bbuAlarmsInstalled.length;k++){
			var show = self.NFPA.bbuAlarmsInstalled[k]&&bbuSerialMode;
			if (self.config.bbu_type==2 && k==10) show=false;   // battery bank alarm not available in H.P. bbu
			var el = document.getElementById("BbuAlarmRow_"+k);
			try {
				el.style.display = (show? "table-row":"none");
			} catch(e){}
		}
		// number of relays to show can be: 4 if dry-contact mode and, 10 (fip519) or 8+1 (fip421) in serial mode
		for (var relayNr=4; relayNr < this.config.NR_OF_RELAYS_MAX; relayNr++) {
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
	this.createBandAlarm = function(band,num,txt,show){
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.style.width = "70%";
		row.appendChild(cell);
		cell.innerHTML = txt;
		cell.className = "thdrht";
		cell = createLedBox("bandAlarm_"+num+"_"+band);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
		row.style.display = show?"table-row":"none";
		return row;
	}	
	this.bandAlarmSet = function(band,num,alarm) {
		ledSetColor("bandAlarm_"+num+"_"+band, alarm ? "red" : "grey");
	}
	this.createBandBox = function(dn,band) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		tab.style.marginRight = tab.style.marginLeft = "auto";
		box.appendChild(tab);
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row = document.createElement("tr");
		body.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = dn ? Texts['DNLINK'] : Texts['UPLINK'];
		cell.colSpan = 3;
		cell.className = 'nhb';
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['INPUT'];
		cell.className = "cth";
		row.appendChild(document.createElement("td"));
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['OUTPUT'];
		cell.className = "cth";
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "tabbox";
		var el = this.createBandCtrlBox(dn,band);
		cell.appendChild(el);
		row.appendChild(document.createElement("td"));
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "tabbox";
		el = this.createBandOutBox(dn,band);
		cell.appendChild(el);
		return box;
	}
	this.createBandCtrlBox = function(dn,band) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var body = document.createElement("tbody");
		tab.appendChild(body);
		if (dn==0){
			body.appendChild(this.createSquelchEnable(dn,band,0));
			body.appendChild(this.createSquelchThreshold(dn,band,0));				
			body.appendChild(this.crateCNThresholdULnb(band));
			body.appendChild(this.createEqBw(dn,band));
		}
		if (dn==1){
			body.appendChild(this.createEqSq(band));
			body.appendChild(this.createEqBw(dn,band));
			body.appendChild(this.createFreqSplit(band));
		}
		var bbAgcSettings = {min: 0, low_alarm: -128, low_warn: -128, high_warn: 127, high_alarm: 127, max: 32};
		body.appendChild(createMetRow("bbAgc_"+band+"_"+dn, bbAgcSettings, "Input AGC", "dB"));

		var bbAgcSettings = {min: 0, low_alarm: -128, low_warn: -128, high_warn: 127, high_alarm: 127, max: 32};
		row = createMetRow("bbAgcOut_"+band+"_"+dn, bbAgcSettings, "Output AGC", "dB" ,50);
		row.style.display = (dn==0) ? "table-row" : "none"; //only visible in UL
		row.id = "bbAgcOutMeterId_"+band;
		body.appendChild(row);

		return box;
	}
	this.createBandOutBox = function(dn,band) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row = this.createMainGainLim(dn,band);
		body.appendChild(row);
		row = this.createCurrentGain(dn,band);
		body.appendChild(row);
		row = this.createMainPowerLim(dn,band);
		body.appendChild(row);		
		row = this.createHpaCtl(dn,band);
		body.appendChild(row);
		hpa_settings[dn].max = this.factory.powerlimit[2*band+dn] + this.factory.MAX_PWR_DELTA;
		hpa_settings[dn].min = hpa_settings[dn].max - 45;
		hpa_settings[dn].high_warn = this.factory.powerlimit[2*band+dn];
		hpa_settings[dn].high_alarm = this.factory.powerlimit[2*band+dn] + this.factory.MAX_PWR_DELTA;
		row = createMetRow("rfOutPow_"+band+"_"+dn, hpa_settings[dn], Texts['POWER'], "dBm");
		body.appendChild(row);
		if (dn==0){ //only UL
			row = this.createAgcBandMode(band);
			row.id = "agcBandModeRow_"+band;
			body.appendChild(row);
		}
		return box;
	}
	this.bbOutAgcSet = function(band, b, val) {
		setMetValue("bbAgcOut_"+band+"_"+b, val, "undefined", 1);
	}
	this.bbAgcSet = function(dn, band, val, isOn) {
		setMetValue("bbAgc_"+band+"_"+dn, val, "undefined", 1);
	}
	this.rfOutPowSet = function(dn, band, val, isOn) {
		if (isOn && val >= -127) {
			setMetValue("rfOutPow_"+band+"_"+dn, val);
		} else {
			setMetValue("rfOutPow_"+band+"_"+dn, "OFF");
		}
	}
	this.createSquelchEnable = function(dn,band,nbadj) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = (nbadj==0? "Filters&nbsp;":"Adj.BW&nbsp;")+Texts['SQUELCH'];
		cell.className = "thdrht";
		cell.style.margin = "2px 2px 2px 2px";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "sqEn_"+nbadj+"_"+band+"_"+dn+"_0";
		el.name = el.id;
		el.type = "checkbox";
		cell.appendChild(el);
		var show = true;
		if (nbadj==0 && !self.factory.chBandEnabled[band]) show = false;
		if (nbadj==1 && !self.factory.adjBandEnabled[band]) show = false;
		row.style.display = show? "table-row":"none";
		return row;
	}
	this.squelchChEnSet = function(dn, ch, band, nbadj, on) {
		try {
			var el = document.getElementById("sqEn_"+nbadj+"_"+band+"_"+dn+"_"+ch);
			el.checked = on? true: false;
		} catch (err) {}
	}
	this.squelchChEnIsSet = function(dn, ch, band, nbadj) {
		try {
			var el = document.getElementById("sqEn_"+nbadj+"_"+band+"_"+dn+"_"+ch);
			return el.checked;
		} catch (err) {
			return false;
		}
	}	
	this.sqEnDisable = function(dn, band, nbadj, doDisable) {
		var kmax = (nbadj==0?self.maxChannels:self.factory.numADJFilters);
		if (nbadj==0 && dn==0) kmax = 1;
		try {
			for (var k=0;k<kmax;k++){
				var el = document.getElementById("sqEn_"+nbadj+"_"+band+"_"+dn+"_"+k);
				if (doDisable) {
					//el.checked = true;
					el.disabled = true;
					el.style.backgroundColor = "#BBBBBB";
				} else {
					//el.checked = self.config.sqChEnabled[nbadj][band][dn][k];
					el.disabled = false;
					el.style.backgroundColor = "white";
				}
			}
		} catch (err) {}
	}
	this.createEqSq = function(band) {
		var row = document.createElement("tr");
		row.id = "eqSqRow_"+band;
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "All&nbsp;Filters&nbsp;Same<br>Squelch&nbsp;Settings";
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "eqSq_"+band;
		el.name = el.id;
		el.title = "All Filters Same Squelch";
		el.type = "checkbox";
		el.band = band;
		el.onclick = function(ev) {
			if (this.checked) {
				var firstFilter = self.searchFirstFilterOfBand(this.band);
				if (firstFilter!=null) {
					self.equalSqAllCh(firstFilter.c, firstFilter.fb, this.band);
				}
			} else {
				self.originalSqAllCh(this.band);
			}
		}
		cell.appendChild(el);
		var show = true;
		if (!self.factory.chBandEnabled[band] && self.factory.isClassB()) {
			show = self.config.squelchAdjBwMode;
		}
		row.style.display = show?"table-row":"none";
		return row
	}
	this.searchFirstFilterOfBand = function(band){
		for (var fb=0;fb<2;fb++){
			for (var c = 0; c < self.maxChannels; ++c) {
				if (self.showFiltersMask[0][fb][c] && self.bandGet(fb,0,c) == band) {
					return {fb: fb, c: c};
				}
			}
		}
		return null;
	}
	this.showEqSq = function(band, show){
		try {
			document.getElementById("eqSqRow_"+band).style.display = (show? "table-row":"none");			
		} catch(e){}
	}

	this.createEqBw = function(dn, band) {
		var row = document.createElement("tr");
		row.id = "eqBwRow_"+band+"_"+dn;
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "All&nbsp;Filters&nbsp;Same&nbsp;BW";
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "eqBw_"+band+"_"+dn;
		el.name = el.id;
		el.title = "All Filters Same BW";
		el.type = "checkbox";
		el.dn = dn;
		el.band = band;
		el.onclick = function(ev) {
			var b = this.dn;
			var band = this.band;
			if (this.checked) {
				var firstFilter = self.searchFirstFilterOfBand(this.band);
				if (firstFilter!=null) {
					self.equalBwAllCh(b, firstFilter.c, firstFilter.fb, band);
				}
			} else {
				self.originalBwAllCh(b,band);
			}
		}
		cell.appendChild(el);
		var show = true;
		if (!self.factory.chBandEnabled[band] && self.factory.isClassB()) {
			show = self.config.squelchAdjBwMode;
		}
		row.style.display = show?"table-row":"none";
		return row
	}
	this.showEqBw = function(band, dn, show){
		try {
			document.getElementById("eqBwRow_"+band+"_"+dn).style.display = (show? "table-row":"none");			
		} catch(e){}
	}
	this.equalBwAllCh = function(b, c, band, realBand) {
		var id = "chBw_"+c+"_"+b+"_"+band;
		var el = document.getElementById(id);
		var ix;
		try {
			ix = el.selectedIndex;
		} catch(err) { ix = 0; }
		for (var fb=0;fb<2;fb++){ //it is necessary to check filters of both arrays, discarding those that do not belong to the realBand
			for (var i = 0; i < self.maxChannels; ++i) {
				if (self.bandGet(fb,0,i) != realBand) continue; //Discard filters that do not belong to the realBand
				var id = "chBw_"+i+"_"+b+"_"+fb;
				var el = document.getElementById(id);
				try {
					el.selectedIndex = ix;
				} catch(err) {}
			}
		}
	}
	this.equalSqAllCh = function(c, band, realBand) {
		var txt = document.getElementById("sqThr_0_"+band+"_1_"+c);
		var chk = document.getElementById("sqEn_0_"+band+"_1_"+c);
		var sqEn, sqTh;
		try {
			sqEn = chk.checked;
			sqTh = txt.value;
		} catch(err) {
			sqEn = true;
			sqTh = -80;
		}
		if (isNaN(sqTh)) sqTh = -80;
		for (var fb=0;fb<2;fb++){ //it is necessary to check filters of both arrays, discarding those that do not belong to the realBand
			for (var i = 0; i < self.maxChannels; ++i) {
				if (self.bandGet(fb,0,i) != realBand) continue; //Discard filters that do not belong to the realBand
				txt = document.getElementById("sqThr_0_"+fb+"_1_"+i);
				chk = document.getElementById("sqEn_0_"+fb+"_1_"+i);
				try {
					chk.checked = sqEn;
					txt.value = sqTh;
				} catch(err) {}
			}
		}
	}	
	this.originalBwAllCh = function(b, band) {
		for (var fb=0;fb<2;fb++){ //it is necessary to check filters of both arrays, discarding those that do not belong to the band
			for (var c = 0; c < self.maxChannels; ++c) {
				if (self.bandGet(fb,0,c) != band) continue; //Discard filters that do not belong to the band
				self.chBwSet(b, c, fb, self.config.bwIndex[fb][b][c]);
			}
		}
	}
	this.originalSqAllCh = function(band) {
		for (var fb=0;fb<2;fb++){ //it is necessary to check filters of both arrays, discarding those that do not belong to the band
			for (var c = 0; c < self.maxChannels; ++c) {
				if (self.bandGet(fb,0,c) != band) continue; //Discard filters that do not belong to the band
				self.squelchChEnSet(1, c, fb, 0, self.config.sqChEnabled[0][fb][1][c]);
				self.squelchChThrSet(1, c, fb, 0, self.config.sqChThreshold[0][fb][1][c]);
			}
		}
	}
	this.eqBwSet = function(dn, band, on) {
		try {
			var el = document.getElementById("eqBw_"+band+"_"+dn);
			el.checked = on? true: false;
		} catch (err) {}
	}
	this.eqBwIsSet = function(dn, band) {
		try {
			var el = document.getElementById("eqBw_"+band+"_"+dn);
			return el.checked;
		} catch (err) {
			return false;
		}
	}
	this.eqSqSet = function(band, on) {
		try {
			var el = document.getElementById("eqSq_"+band);
			el.checked = on? true: false;
		} catch (err) {}
	}
	this.eqSqIsSet = function(band) {
		try {
			var el = document.getElementById("eqSq_"+band);
			return el.checked;
		} catch (err) {
			return false;
		}
	}	
	this.createAgcBandMode = function(band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "AGC&nbsp;Mode";
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.colSpan = 2;
		cell.className = "mlong";
		var sp = document.createElement("span");
		var str = "AGC Mode:<br><br>Stable Coverage: Maximum UL power per channel will be fixed equally by the amount of configured filters. Channel Output power will not vary based on the UL traffic providing the most possible stable coverage<br><br>";
		str += "Max. Power: Maximum UL power per channel will be dependent on the amount of channels that are being transmitted. UL Channel Output power will be dynamic and will vary depending on the UL traffic. The Power per channel will trend to be larger when low traffic is present<br><br>";
		str += "Hybrid: It is an intermediate option. With few configured filters works like stable coverage mode, but power reduction per channel is limited to user configured back-off respect the power limit";
		sp.innerHTML = str;
		cell.appendChild(sp);
		cell.style.textAlign = "left";
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "agcBandMode_"+band;
		el.name = el.id;
		el.band = band;
		var opts = [ "Stab.Coverage", "Max.Power", "Hybrid" ];
		for (var i = 0; i < opts.length; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.selectedIndex = 0;
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.onchange = function(ev){
			self.showBackOffSetting(this.band, this.selectedIndex==2);
		}
		cell.appendChild(el);
		//back off cells
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.id = "backOffCell_0_"+band;
		cell.innerHTML = "Back-off";
		cell.className = "thdrht";
		cell = this.createBackOffSetting(band);
		row.appendChild(cell);
		cell.id = "backOffCell_1_"+band;
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dB";
		cell.style.textAlign = "left";
		cell.id = "backOffCell_2_"+band;
		return row;
	}
	this.showBackOffSetting = function(band, show) {
		for (var b = 0; b < 3; ++b) {
			try {
				document.getElementById("backOffCell_"+b+"_"+band).style.display = show?"table-cell":"none";
			} catch(e){}
		}
	}
	this.createBackOffSetting = function(band) {
		var cell = document.createElement("th");
		var el = document.createElement("input");
		el.id = "backOff_"+band;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.title = "Min: "+self.config.limitBackOff.MIN+", Max: " +	self.config.limitBackOff.MAX+" dB";
		el.onchange = function(ev) {
			var vmin = self.config.limitBackOff.MIN;
			var vmax = self.config.limitBackOff.MAX;
			var num = parseFloat(this.value);
			if (num < vmin) {
				this.value = vmin;
			} else if (num > vmax) {
				this.value = vmax;
			}
		}
		cell.appendChild(el);
		return cell;
	}
	this.backOffSet = function(band, val) {
		try {
			var el = document.getElementById("backOff_"+band);
			if (!isNaN(val))
				el.value = val.toFixed(1);
		} catch (err) { }
	}
	this.backOffGet = function(band) {
		try {
			var el = document.getElementById("backOff_"+band);
			return parseFloat(el.value);
		} catch (err) { return 7.8; }
	}
	this.agcBandModeSet = function(band, val) {
		try {
			var el = document.getElementById("agcBandMode_"+band);
			el.selectedIndex = val;
		} catch (err) {}
	}
	this.agcBandModeGet = function(band) {
		try {
			var el = document.getElementById("agcBandMode_"+band);
			return (el.selectedIndex);
		} catch (err) {
			return 0;
		}
	}	

	this.getSquelchThresholdMin = function(b, band) {
		return self.config.sqThrLimits(b, self.factory.ULlowGainMode).MIN;
	}
	this.getSquelchThresholdMax = function(b, band) {
		return self.config.sqThrLimits(b, self.factory.ULlowGainMode).MAX;
	}
	this.updateSquelchThresholdTitles = function(band) {
		for (var b = 0; b < 2; ++b) {
			try {
				var min = self.config.sqThrLimits(b, self.factory.ULlowGainMode).MIN;
				var max = self.config.sqThrLimits(b, self.factory.ULlowGainMode).MAX;
				for (var nbadj=0;nbadj<2;nbadj++){
					var cmax = nbadj==0?self.config.CHNR:self.factory.numADJFilters;
					if (nbadj==0 && b==0) cmax = 1;
					for (var c=0;c<cmax;c++){
						var el = document.getElementById("sqThr_"+nbadj+"_"+band+"_"+b+"_"+c);
						el.title = "Min: "+min+", Max: "+max+" dBm";
					}
				}
			} catch(e) {}
		}
	}
	this.createBand = function(band, nbadj, c){
		var cell = document.createElement("td");
		var el = document.createElement("select");
		cell.appendChild(el);
		el.id = "band_"+c+"_"+band+"_"+nbadj;
		el.name = el.id;
		el.className = "centered";
		el.style.fontSize = "10px";
		el.style.disabled = "false";
		for (var i = 0; i < 2; i++) {
			if (nbadj==1 && !self.factory.adjBandEnabled[i]) continue;
			if (nbadj==0 && !self.factory.chBandEnabled[i] && !(self.factory.isClassB() && self.factory.adjBandEnabled[i])) continue;
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.style.textAlign = "center";
			opt.value = i;
			opt.text = this.factory.bandNames[i];
		}
		el.nbadj = nbadj;
		el.chNr = c;
		el.band = band;
		el.onchange = function(ev) {
			var nbadj = this.nbadj;
			var c = this.chNr;
			var band = this.band;
			var fb = this.value;
			// band 14:
			try{
				if (nbadj==1 && c==0 && band==0) document.getElementById("firstNet").onclick();
			}catch(e){}
			// update titles and limits
			for (var b=0;b<2;b++){
				if (nbadj==1){
					//config freqs are restored
					if (fb==self.config.filterBand[1][band][1][c]){
						self.setAdjFreqCh(b, c, band, self.config.fstartHzAdjFilter[band][b][c], self.config.fstopHzAdjFilter[band][b][c]);
					}
					self.setAdjFreqTitles(b, band, c);
					var el =document.getElementById("cellAdjF_"+c+"_"+b+"_0_"+band);
					self.limitAdjFilterValues(b, c, 0, band);
				}else{
					//config freq are restored
					if (fb==self.config.filterBand[0][band][1][c]){
						self.setFreqCh(b, c, band, self.config.freqHz[band][b][c]);
					}
					var firstFilter = self.searchFirstFilterOfBand(fb);
					if (self.eqBwIsSet(b,fb)){ //if filter is moved check if eq bw is set to force same filter
						if (firstFilter!=null) self.equalBwAllCh(b, firstFilter.c, firstFilter.fb, fb);
					}
					if (self.eqSqIsSet(fb)){ //if filter is moved check if eq sq is set to force same squelch
						if (firstFilter!=null) self.equalSqAllCh(firstFilter.c, firstFilter.fb, fb);
					}
					self.setFiltFreqTitles(b, band, c);
					self.limitChFilterValues(b, c, band);
				}
			}
			self.filterMoveRow(nbadj,band,c);
		}
		return cell;
	}
	this.filterMoveRow = function(nbadj, band, c){
		var fb = self.bandGet(band,nbadj,c);//band destination
		var indexCh = (nbadj==0?self.maxChannels:self.factory.numADJFilters)*band + c + 1;
		for (var b=0;b<2;b++){
			var row = document.getElementById("filterRow_"+c+"_"+b+"_"+band+"_"+nbadj);
			var tab  = document.getElementById("filterTable_"+b+"_"+fb+"_"+nbadj);
			//look position to insert
			var r;
			if (b==0) {
				for (r=1;r<tab.rows.length;r++){
					var rowCheck = tab.rows[r];
					var cell = rowCheck.cells[0];
					if (cell.innerHTML>=indexCh) break;
				}
			}
			var tbody = tab.getElementsByTagName("tbody")[0];
			tbody.insertBefore(row, tbody.rows[r]);
		}
		self.displayFilters();
	}
	this.createChSquelchEnable = function(dn,ch,band,nbadj) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.style.margin = "2px 2px 2px 2px";
		el.id = "sqEn_"+nbadj+"_"+band+"_"+dn+"_"+ch;
		el.name = el.id;
		el.type = "checkbox";
		el.dn = dn;
		el.band = band;
		el.nbadj = nbadj;
		el.ch = ch;
		el.onchange = function(ev) {
			var target = this;
			var dn = target.dn;
			var band = target.band;
			var nbadj = target.nbadj;
			var ch = target.ch;
			var realBand = self.bandGet(band,0,ch);
			if (!self.eqSqIsSet(realBand) || nbadj==1 || dn ==0) {
				return;
			}
			self.equalSqAllCh(ch, band, realBand);
		}
		cell.appendChild(el);
		cell.style.textAlign = "center";
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB()) {
			cell.style.display = "none";
		}
		return cell;
	}
	this.createChSquelchThreshold = function(dn,ch,band,nbadj) {
		var cell = document.createElement("td");
		cell.id = "chSqThrTd_"+nbadj+"_"+band+"_"+dn+"_"+ch;
		var el = document.createElement("input");
		el.id = "sqThr_"+nbadj+"_"+band+"_"+dn+"_"+ch;
		el.name = el.id;
		el.type = "text";
		el.style.width = "28px";
		el.dn = dn;
		el.band = band;
		el.nbadj = nbadj;
		el.ch = ch;
		el.onkeypress = function(ev) {
			if (!isKeyDecimalNumber(ev)) return false;
			var target = this;
			var dn = target.dn;
			var band = target.band;
			var nbadj = target.nbadj;
			var ch = target.ch;
			var realBand = self.bandGet(band,0,ch);
			if (!self.eqSqIsSet(realBand) || nbadj==1 || dn ==0) {
				return;
			}
			setTimeout(function() {self.equalSqAllCh(ch, band, realBand);}, 100);
		}
		el.className = "number";
		var min = self.config.sqThrLimits(dn, self.factory.ULlowGainMode).MIN;
		var max = self.config.sqThrLimits(dn, self.factory.ULlowGainMode).MAX;
		el.title = "Min: "+min+", Max: "+max+" dBm";
		el.onchange = function(ev) {
			var target = this;
			var dn = target.dn;
			var band = target.band;
			var nbadj = target.nbadj;
			var ch = target.ch;
			var num = self.squelchChThrGet(dn,ch,band,nbadj);
			var min = self.getSquelchThresholdMin(dn, band);
			var max = self.getSquelchThresholdMax(dn, band);
			if (num < min) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
			var realBand = self.bandGet(band,0,ch);
			if (dn==0 && nbadj==1){
				if (!self.factory.isClassB() || (!self.squelchAdjBwModeRead())) {
					self.setCNThresholdLimits(band, 1, ch);
				}
			}
			if (!self.eqSqIsSet(realBand) || nbadj==1 || dn ==0) {
				return;
			}
			self.equalSqAllCh(ch, band, realBand);			
		}
		cell.appendChild(el);
		var show = true;
		if ((nbadj==1) && !self.factory.chBandEnabled[band] && self.factory.isClassB()) {
			show = !self.config.squelchAdjBwMode;
		}
		cell.style.display = (show? "table-cell":"none");
		return cell;
	}
	this.showChSquelchThreshold = function(dn,ch,band,nbadj, show){
		try {
			var id = "chSqThrTd_"+nbadj+"_"+band+"_"+dn+"_"+ch;
			document.getElementById(id).style.display = (show? "table-cell":"none");
		} catch(e){}
	}
	this.createSquelchThreshold = function(dn,band,nbadj) {
		var row = document.createElement("tr");
		row.id = "sqThrRow_"+nbadj+"_"+band+"_"+dn+"_0";
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = (nbadj==0? "Filters&nbsp;":"Adj.BW&nbsp;")+Texts['THRS'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "sqThr_"+nbadj+"_"+band+"_"+dn+"_0";
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.dn = dn;
		el.band = band;
		el.nbadj = nbadj;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		var min = self.config.sqThrLimits(dn, self.factory.ULlowGainMode).MIN;
		var max = self.config.sqThrLimits(dn, self.factory.ULlowGainMode).MAX;
		el.title = "Min: "+min+", Max: "+max+" dBm";
		el.onchange = function(ev) {
			var target = this;
			var dn = target.dn;
			var band = target.band;
			var nbadj = target.nbadj;
			var num = self.squelchChThrGet(dn,0,band,nbadj);
			var min = self.getSquelchThresholdMin(dn, band);
			var max = self.getSquelchThresholdMax(dn, band);
			if (num < min) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
			// reajustar límite de umbral C/N sin cambiar los valores desde este control de squelch
			// pero sin cambiar los valores, eso se deja para el submit por si el usuario hace otro cambio antes
			if (dn==0 && nbadj==0){
				// reajustar límite de umbral C/N de filtros NB
				self.setCNThresholdLimits(band, 0, 0);
				// reajustar límite de umbral C/N de todos los filtros ADJ si squelch es filters based
				if (self.factory.isClassB() && (self.squelchAdjBwModeRead())) {
					for (var c=0; c < self.factory.numADJFilters; c++){
						self.setCNThresholdLimits(band, 1, c);
					}
				}
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dBm";
		cell.style.textAlign = "left";
		var show = true;
		if (nbadj==0 && !self.factory.chBandEnabled[band] ) {
			if (self.factory.isClassB()){
				show = self.config.squelchAdjBwMode;
			} else {
				show = false;
			}
		}
		if (nbadj==1 && !self.factory.adjBandEnabled[band]) show = false;
		row.style.display = show? "table-row":"none";
		return row;
	}
	this.showSquelchThreshold = function(band, show){
		try {
			var id = "sqThrRow_"+0+"_"+band+"_"+0+"_0"; // UL NB ch0
			document.getElementById(id).style.display = (show? "table-row":"none");
		} catch(e){}
	}
	this.squelchChThrSet = function(dn, ch, band, nbadj, val) {
		try {
			var el = document.getElementById("sqThr_"+nbadj+"_"+band+"_"+dn+"_"+ch);
			if (!isNaN(val))
				el.value = val;
		} catch (err) {}
	}
	this.squelchChThrGet = function(dn, ch, band, nbadj) {
		try {
			var el = document.getElementById("sqThr_"+nbadj+"_"+band+"_"+dn+"_"+ch);
			return parseInt(el.value);
		} catch (err) {
			return -128;
		}
	}
	this.createCurrentGain = function(dn,band){
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Current&nbsp;Gain";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "currGain_"+band+"_"+dn;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.className = "number";
		el.disabled = true;
		el.style.backgroundColor = "#CCCCCC";
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dB";
		cell.style.textAlign = "left";
		return row;
	}
	this.createMainGainLim = function(dn, band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Configured&nbsp;Gain";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "mainGainLimit_"+band+"_"+dn;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.dn = dn;
		el.band = band;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		var gmin = self.factory.gainlimit[2*band+dn]+self.config.GmainRange[dn];
		el.title = "Min: "+gmin+", Max: " +	self.factory.gainlimit[2*band+dn]+" dB";
		el.onchange = function(ev) {
			var target = this;
			var band = target.band;
			var dn = target.dn;
			var num = self.mainGainLimGet(dn,band);
			var gmin = self.factory.gainlimit[2*band+dn]+self.config.GmainRange[dn];
			var gmax = self.factory.gainlimit[2*band+dn];
			if (num < gmin) {
				target.value = gmin;
			} else if (num > gmax) {
				target.value = gmax;
			} else {
				target.value = num;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dB";
		cell.style.textAlign = "left";
		return row;
	}
	this.mainGainLimSet = function(dn, band, val) {
		try {
			var el = document.getElementById("mainGainLimit_"+band+"_"+dn);
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.mainGainLimGet = function(dn, band) {
		try {
			var el = document.getElementById("mainGainLimit_"+band+"_"+dn);
			return parseInt(el.value);
		} catch (err) { return -128; }
	}
	this.createMainPowerLim = function(dn, band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		if ( this.factory.ULlowGainMode ) {
			cell.innerHTML = dn==0?"Power per channel":"Composite Power";
		} else {
			cell.innerHTML = Texts['POWERLIM'];
		}
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "mainPowerLimit_"+band+"_"+dn;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.dn = dn;
		el.band = band;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		var max = this.factory.powerlimit[2*band+dn];
		var min = max - this.MAIN_POWER_RANGE;
		el.title = "Min: "+min+", Max: "+max+" dBm";
		el.onchange = function(ev) {
			var target = this;
			var band = target.band;
			var dn = target.dn;
			var num = self.mainPowerLimGet(dn,band);
			var max = self.factory.powerlimit[2*band+dn];
			var min = max - self.MAIN_POWER_RANGE;
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
		cell.innerHTML = "dBm";
		cell.style.textAlign = "left";
		return row;
	}
	this.mainPowerLimSet = function(dn, band, val) {
		try {
			var el = document.getElementById("mainPowerLimit_"+band+"_"+dn);
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.mainPowerLimGet = function(dn, band) {
		try {
			var el = document.getElementById("mainPowerLimit_"+band+"_"+dn);
			return parseInt(el.value);
		} catch (err) { return -128; }
	}
	this.createHpaCtl = function(dn,band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['ENABLE'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createHpaSwitch(dn,band);
		cell.appendChild(el);
		return row
	}
	this.createHpaSwitch = function(dn,band) {
		var box = document.createElement("div");
		box.id = "hpaSwBox_"+band+"_"+dn;
		box.style.border = "medium solid #00AAAA";
		box.style.width = "40px";
		box.style.height = "10px";
		box.style.verticalAlign = "middle";
		box.style.textAlign = "center";
		box.style.padding = "2px";
		box.style.backgroundColor = "#D0FFD0";
		box.style.borderStyle = "inset";
		box.style.borderRadius = "3px";
		box.style.margin = "auto";
		box.onmouseover = function() { this.style.borderColor = "#3030A0"; };
		box.onmouseout = function() { this.style.borderColor = "#30AAAA"; };
		var lbl = document.createElement("label");
		box.appendChild(lbl);
		lbl.id = "hpaSwLbl_"+band+"_"+dn;
		lbl.className = "togglebuttonlabel";
		lbl.setAttribute("unselectable", "on");
		lbl.style.whiteSpace = "nowrap";
		lbl.style.fontWeight = "bold";
		lbl.style.display = "inline-block";
		lbl.style.width = "40px";
		lbl.style.height = "12px";
		lbl.innerHTML = "ON";
		var el = document.createElement("input");
		el.id = "hpaSwInp_"+band+"_"+dn;
		el.name = el.id;
		el.type = "checkbox";
		el.className = "hidden";
		el.style.marginRight = "2px";
		el.checked = true;
		var id = el.id;
		lbl.setAttribute("for", id);
		lbl.title = "Control-Click for all PAs";
		el.band = band;
		el.dn = dn;
		el.onclick = function() {
			var on = this.checked;
			var forcePaOn = [[false,false],[false,false]];
			var forcePaOff = [[false,false],[false,false]];				
			if (window.event.ctrlKey) {
				for (var b = 0; b < 2; b++) {
					for (var r = 0; r < 2; r++) {
						self.hpaSwSet(r, b, on);
						if (on){
							forcePaOn[b][r] = true;
						}else{
							forcePaOff[b][r] = true;
						}
					}
				}
				submitform(false, false, false, 0, true, forcePaOn, forcePaOff);
			} else {
				var band = this.band;
				var b = this.dn;
				self.hpaSwToggle(this.dn,this.band);
				if (on){
					forcePaOn[band][b] = true;
				}else{
					forcePaOff[band][b] = true;
				}					
				submitform(false, false, false, 0, true, forcePaOn, forcePaOff);
			}
		};
		box.appendChild(el);
		return box;
	}
	this.hpaSwToggle = function(dn,band) {
		try {
			var box = document.getElementById("hpaSwBox_"+band+"_"+dn);
			var lbl = document.getElementById("hpaSwLbl_"+band+"_"+dn);
			var el =  document.getElementById("hpaSwInp_"+band+"_"+dn);
			if (el.checked) {
				lbl.innerHTML = "ON";
				box.style.backgroundColor = "#C0FFC0";
				lbl.style.color = "#000000";
				box.style.borderStyle = "inset";
			} else {
				lbl.innerHTML = "OFF";
				box.style.backgroundColor = "#e20000";
				lbl.style.color = "#ffffff";
				box.style.borderStyle = "outset";
			}
		} catch (err) { }
	}
	this.hpaIsOn = function(dn,band) {
		try {
			var el = document.getElementById("hpaSwInp_"+band+"_"+dn);
			return el.checked;
		} catch (err) {	return false; }
	}
	this.hpaSwSet= function(dn, band, on) {
		try {
			var box = document.getElementById("hpaSwBox_"+band+"_"+dn);
			var lbl = document.getElementById("hpaSwLbl_"+band+"_"+dn);
			var el =  document.getElementById("hpaSwInp_"+band+"_"+dn);
			el.checked = on ? true : false;
			if (el.checked) {
				lbl.innerHTML = "ON";
				lbl.style.color = "#000000";
				box.style.backgroundColor = "#D0FFD0";
				box.style.borderStyle = "inset";
			} else {
				lbl.innerHTML = "OFF";
				lbl.style.color = "#ffffff";
				box.style.backgroundColor = "#e20000";
				box.style.borderStyle = "outset";
			}
		} catch(err) { }
	}
	this.hpaSwDisableStateSet = function(dn, disable) {
		try {
			var hpaEn = document.getElementById("hpaSwInp"+(dn? 1 : 0));
			hpaEn.disabled = disable? true : false;
		} catch (err) { }
	}
	this.createPaEnLed = function(b) {
		return createLedBox("paEnLed_"+b);
	}
	this.setStatePaOn = function(b, band, monitor) {
		var statOn = monitor.statePaOn[band][b];
		var currentState = self.hpaIsOn(b,band);
		if (statOn != currentState) {
			self.hpaSwSet(b, band, statOn);
			initFormChangeCheck();
		}
	}
	this.BWtable = [
		{ix:   0, include: true, value:   0, txt: "150KHz", khz:  150.0},
		{ix:   1, include: true, value:   1, txt: "100KHz", khz:  100.0},
		{ix:   2, include: true, value:   2, txt: "75KHz", khz:  75.0},
		{ix:   3, include: true, value:   3, txt: "62.5KHz", khz:  62.5},
		{ix:   4, include: true, value:   4, txt: "50KHz", khz:  50.0},
		{ix:   5, include: true, value:   5, txt: "37.5KHz", khz:  37.5},
		{ix:   6, include: true, value:   6, txt: "25KHz", khz:  25.0},
		{ix:   7, include: true, value:   7, txt: "12.5KHz", khz:  12.5},
	];
	this.createChBw = function(b, c, band) {
		var cell = document.createElement("td");
		var el = document.createElement("select");
		cell.appendChild(el);
		el.id = "chBw_"+c+"_"+b+"_"+band;
		el.name = el.id;
		el.className = "centered";
		el.style.fontSize = "10px";
		el.style.minWidth = "69px";
		el.style.disabled = "false";
		for (var i = 0; i < this.BWtable.length; i++) {
			this.BWtable[i].include = !(this.BWtable[i].ix < 0);
		}
		for (var i = 0; i < this.BWtable.length; i++) {
			if (!this.BWtable[i].include) {
				continue;
			}
			var opt = document.createElement("option");
			el.options.add(opt);
			if (!this.factory.isClassB()){
				opt.text = this.BWtable[i].txt+" "+(FilterTypes[i].delay).toFixed(1)+"us";
			} else {
				opt.text = this.BWtable[i].txt;
			}
			opt.style.textAlign = "center";
			opt.value = this.BWtable[i].value;
			opt.khz = this.BWtable[i].khz;
			opt.index = this.BWtable[i].ix;
		}
		el.selectedIndex = 0;
		el.dn = b;
		el.chNr = c;
		el.band = band;
		el.onchange = function(ev) {
			var b = this.dn;
			var c = this.chNr;
			var band = this.band;
			var realBand = self.bandGet(band,0,c);
			if (!self.eqBwIsSet(b,realBand)) {
				return;
			}
			self.equalBwAllCh(b,c,band,realBand);
		}
		return cell;
	}
	this.bandSet = function(band, nbadj, c, fband){
		var el = document.getElementById("band_"+c+"_"+band+"_"+nbadj);
		try {
			for (var i = 0; i < el.options.length; ++i) {
				if (fband != el.options[i].value) {
					continue;
				}
				el.selectedIndex = i;
				break;
			}
			if (!(i < el.options.length)) {
				el.selectedIndex = 0;
			}
		} catch (err) {}
	}
	this.bandGet = function(band, nbadj, c) {
		try {
			var el = document.getElementById("band_"+c+"_"+band+"_"+nbadj);
			var k = el.selectedIndex;
			return ~~el.options[k].value;
		} catch (err) {
			return self.config.filterBand[nbadj][band][1][c];
		}
	}
	this.chBwSet = function(b, c, band, bw) {
		var el = document.getElementById("chBw_"+c+"_"+b+"_"+band);
		try {
			for (var i = 0; i < el.options.length; ++i) {
				if (bw != el.options[i].value) {
					continue;
				}
				el.selectedIndex = i;
				break;
			}
			if (!(i < el.options.length)) {
				el.selectedIndex = 0;
			}
		} catch (err) {}
	}
	this.chBwGet = function(b, c, band) {
		try {
			var el = document.getElementById("chBw_"+c+"_"+b+"_"+band);
			var k = el.selectedIndex;
			return parseInt(el.options[k].value);
		} catch (err) {
			return null;
		}
	}
	this.createMetPowIn = function(b, c, band, nbadj) {
		return createMetCell("rfInPow_"+c+"_"+b+"_"+band+"_"+nbadj, chRfIn_settings[b]);
	}
	this.createTextPowIn = function(b, c, band, nbadj,w) {
		return createTextCell("rfInPow_"+c+"_"+b+"_"+band+"_"+nbadj,w);
	}
	this.rfChInPowSet = function(b, c, band, nbadj, val, color) {
		setMetValue("rfInPow_"+c+"_"+b+"_"+band+"_"+nbadj, val, color);
	}
	this.createSignalDetect = function(b, c, band, nbadj) {
		return createLedBox("rfSignalIn_"+c+"_"+b+"_"+band+"_"+nbadj);
	}
	this.rfSignalLedSet = function(b, c, band, nbadj, color) {
		ledSetColor("rfSignalIn_"+c+"_"+b+"_"+band+"_"+nbadj, color);
	}
	this.createMetPowOut = function(b, c, band, nbadj) {
		var cell = createMetCell("rfOutPow_"+c+"_"+b+"_"+band+"_"+nbadj, chRfOut_settings[b]);
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB()) {
			cell.style.display = "none";
		}
		return cell;
	}
	this.createTextPowOut = function(b, c, band, nbadj,w) {
		var cell = createTextCell("rfOutPow_"+c+"_"+b+"_"+band+"_"+nbadj,w);
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB()) {
			cell.style.display = "none";
		}
		return cell;
	}
	this.rfChOutPowSet = function(b, c, band, nbadj, val, isOn) {
		var id = "rfOutPow_"+c+"_"+b+"_"+band+"_"+nbadj;
		if (isOn) {
			setMetValue(id, val, "normal");
		} else {
			setMetValue(id, "OFF", "warning");
		}
	}
	this.createMetAgc = function(b, c, band, nbadj) {
		var cell = createMetCell("agc_"+c+"_"+b+"_"+band+"_"+nbadj, agc_settings[b]);
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB()) {
			cell.style.display = "none";
		}
		return cell;
	}
	this.createTextAgc = function(b, c, band, nbadj, w) {
		var cell = createTextCell("agc_"+c+"_"+b+"_"+band+"_"+nbadj,w);
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB()) {
			cell.style.display = "none";
		}
		return cell;
	}
	this.agcSet = function(b, c, band, nbadj, val) {
		setMetValue("agc_"+c+"_"+b+"_"+band+"_"+nbadj, val);
	}

	this.showFreqs = function() {
		for (var band=0;band<2;band++){
			self.setFreqSplit(band,self.config.uldlLinkedFreq[band]);
			for (var c = 0; c < self.maxChannels; ++c) {
				for (var b = 0; b < 2; ++b) self.setFreqCh(b, c, band, self.config.freqHz[band][b][c]);
			}			
		}

	}
	this.getFreqs = function() {
		var cnf = new ConfigBDA();
		cnf.parse(self.config.frm);
		for (var band = 0; band < 2; ++band) {	
			cnf.uldlLinkedFreq[band] = self.isFreqSplitFixed(band);		
			for (var c = 0; c < self.maxChannels; ++c) {
				for (var b = 1; b >= 0; --b) {
					var fband = self.bandGet(band, 0, c);
					cnf.filterBand[0][band][b][c] = fband;
					var fr = self.getFreqCh(b, c, band);
					if (fr < self.factory.fstart[2*fband+b]) fr = self.factory.fstart[2*fband+b];
					if (fr > self.factory.fstop[2*fband+b]) fr = self.factory.fstop[2*fband+b];
					fr = ~~Math.round(fr/self.factory.fstep);
					fr *= self.factory.fstep;
					cnf.freqHz[band][b][c] = fr;
					if (cnf.uldlLinkedFreq[band]) {
						fr -= self.factory.uldlFreqSplit[fband];
						b--;	
						cnf.filterBand[0][band][b][c] = fband				
						if (fr < self.factory.fstart[2*fband+b]) fr = self.factory.fstart[2*fband+b];
						if (fr > self.factory.fstop[2*fband+b]) fr = self.factory.fstop[2*fband+b];
						self.setFreqCh(b, c, band, fr);
						cnf.freqHz[band][b][c] = fr;
						break;
					}
				}
			}
		}
		return cnf;
	}
	this.checkFreqs = function(confirmdialog, cnf) {
		if (!confirmdialog) cnf = self.config;
		var showdialog = 0;
		var fov = [];
		for (var band=0;band<2;band++) fov.push(self.computeFiltersOverlap(cnf, band));
		for (var band=0;band<2;band++) fov.push(self.computeAdjFiltersOverlap(cnf, band));
		for (var band=0;band<2;band++) fov.push(self.computeNBAdjFiltersOverlap(cnf, band));
		for (var band=0;band<2;band++) fov.push(self.checkClassBFilters(cnf, band));
		var overlappingBWs = self.overlappingBWs;
		var filtAdjSepKhz = this.FILTSEPADJKHZ;
		var filtNbAdjSepKhz = this.FILTSEPNBADJKHZ;
		var checkOv = false, checkB = false;
		for (var i=0;i<6;i++){
			if (fov[i]['check']) checkOv=true;
		}
		for (var i=6;i<8;i++){
			if (fov[i]['check']) checkB=true;
		}
		if (checkOv || checkB) {
			var uldlLinked = [self.isFreqSplitFixed(0),self.isFreqSplitFixed(1)];
			self.warningBox.setWarningMessage(fov, overlappingBWs, filtAdjSepKhz, filtNbAdjSepKhz, 2*self.maxChannels, self.factory, uldlLinked,true);
			if (checkOv) showdialog |= 0x1; //Filter Overlapping
			if (checkB) showdialog |= 0x2; //Class B Filters
		}
		if (showdialog==0){
			self.warningBox.hide();
		}		
		if (showdialog!=0 && confirmdialog){
			var alertMsg = "NOTICE:\n";
			if ((showdialog&0x2)!=0){
				if ((showdialog&0x3)==0x3) alertMsg += '1. ';
				alertMsg += "You selected a filter wider than 75KHz. This unit will operate as a Class B unit\n";
			}
			if ((showdialog&0x1)!=0){
				if ((showdialog&0x3)==0x3) alertMsg += '2. ';
				alertMsg += "Fiter overlapping detected.\n";
			}
			alertMsg += "See details below. Please, confirm before applying.\n";
			if (!confirm(alertMsg)) {
				return false;
			}
		}
		return true;
	}
	this.highLightModifiedFilters = function() {
		for (nbadj=0;nbadj<2;nbadj++){
			for (var band=0;band<2;band++){
				for (var c=0;c<(nbadj==0?self.maxChannels:self.factory.numADJFilters);c++){
					var highlightFilter = false;
					if (!self.config.filterEnabled[nbadj][band][1][c] && self.showFiltersMask[nbadj][band][c]) highlightFilter = true;
					if (self.config.filterBand[nbadj][band][1][c]!=self.bandGet(band,nbadj,c)) highlightFilter = true;
					for (var b=0;b<2;b++){
						var row = document.getElementById("filterRow_"+c+"_"+b+"_"+band+"_"+nbadj);
						row.style.backgroundColor = highlightFilter ? "#FFFF99" : "transparent";
					}
				}
			}
		}	
	}
	this.displayFilters = function() {
		self.squelchAdjBwModeDisplay(self.factory.isClassB());
		var filtersBased = self.squelchAdjBwModeRead();
		var shownb = [false,false];
		var showadj = [false,false];
		for (var band=0;band<2;band++){
			for (var fb=0;fb<2;fb++){
				for (var c=0;c<self.maxChannels;c++){
					if (self.bandGet(fb,0,c)==band && self.showFiltersMask[0][fb][c]) shownb[band] = true;
				}
			}
			shownb[band] = shownb[band] && (self.factory.chBandEnabled[band] || self.squelchAdjBwModeRead());
			for (var fb=0;fb<2;fb++){
				for (var c=0;c<self.factory.numADJFilters;c++){
					if (self.bandGet(fb,1,c)==band && self.showFiltersMask[1][fb][c]) showadj[band] = true;
				}
			}
			//if (!showadj[band] && self.factory.isClassB() && filtersBased) shownb[band] = false;
			showadj[band] = (self.factory.adjBandEnabled[band]) && showadj[band];	
			var el = document.getElementById("TableFilter_"+band+"_0");
			el.style.display = (shownb[band]) ? "table" : "none";
			el = document.getElementById("TableFilter_"+band+"_1");
			el.style.display = (showadj[band]) ? "table" : "none";		
			el = document.getElementById("filtersRow_"+band);
			el.style.display = (showadj[band] || shownb[band]) ? "table-row" : "none";
			//Added code from squelchAdjBwMode / onchange
			// NB
			if (self.factory.isClassB()){
				shownb[band] = filtersBased;
				//if (!showadj[band]) shownb[band] = false;
			}
		}
		//some tables are not band-specific now
		if (self.factory.isClassB()){
			var shownbs = shownb[0]||shownb[1]; //combined for both bands
			self.showFilterTable(shownbs);
			for (var band=0;band<2;band++){
				self.showSquelchThreshold(band, shownbs);
				self.showCNThresholdULnb(band, shownbs);
				for (var dn=0;dn<2;dn++) self.showEqBw(band, dn, shownbs);
				self.showEqSq(band, shownbs);
				// ADJ
				for (var dn=0;dn<2;dn++){
					self.chSqTitleSet(band,1,dn,shownbs);  // "SQ(dBm)" normal vs "SQ Enable" (filters based)
					self.chFiltTableTitleSet(band,dn,shownbs);
					for (var ch=0; ch < self.factory.numADJFilters; ch++){
						self.showChSquelchThreshold(dn,ch,band,1, !shownbs);
					}
				}
				// ocultar CN threshold de filtros ADJ en modo squelch based
				self.cnThresholdAdjShow(band, !shownbs);
			}
		}
		self.highLightModifiedFilters();
	}
	this.computeShowOpfSettings = function() {
		return self.factory.oscFeatureEnable;
	}
	this.computeShowExtremeTempAction = function() {
		return self.factory.extremeTempActionEnable;
	}
	this.showConfs = function() {
		self.bbuAlarmsShow();
		self.setAutoPaUlOffTime(self.config.autoUlPaOffTimer);
		self.setFirstNet(self.config.firstADJisFirstNet);
		self.showFirstNet(self.config.firstADJisFirstNet);
		self.showOpfSettings(self.computeShowOpfSettings());
		self.opfEnSet(true);		
		self.opfModeSet(self.config.oscActionAfterAlarm[0]);
		self.setAbnSqTime(self.config.oscTimeThSeconds[0]);
		self.showRetrySettings(self.config.oscActionAfterAlarm[0]<2);	
		self.setRetryTime(self.config.oscRetryTimeHours[0]);
		self.showExtremeTempActionBox(self.computeShowExtremeTempAction());
		self.showExtremeTempAction(self.config.extremeTempAction);
		self.setCnUlLowAlarmTime(self.config.cnAlarmTime);
		self.showBbuTypeOfConnection(self.config.bbu_serial_mode);
		self.showExternalPAConfig(self.config.externalPA);
		//relay timers
		for (var k=0;k<self.config.NR_OF_RELAYS_MAX;k++){
			this.delayLatchOnOffSet(0,k,self.config.delayTimerON[k]);
			this.delayLatchOnOffSet(1,k,self.config.latchTimerON[k]);
			this.delayLatchTimeSet(0,k,self.config.delayTimer[k]);
			this.delayLatchTimeSet(1,k,self.config.latchTimer[k]);
		}
		self.squelchAdjBwModeDisplay(self.factory.isClassB());
		self.squelchAdjBwModeSet(self.config.squelchAdjBwMode);
		for (var band = 0; band < 2; ++band) {

			this.updateSquelchThresholdTitles(band);
			
			self.squelchChEnSet(0, 0, band, 0, self.config.sqChEnabled[0][band][0][0]);			
			self.squelchChThrSet(0, 0, band, 0, self.config.sqChThreshold[0][band][0][0]);
			self.backOffSet(band, self.config.backOff[band]);
			self.showBackOffSetting(band, self.config.agcBandMode[band]==2); //shown if hybrid mode
			for (var c = 0; c < self.maxChannels; ++c) {
				self.squelchChEnSet(1, c, band, 0, self.config.sqChEnabled[0][band][1][c]);	
				self.squelchChThrSet(1, c, band, 0, self.config.sqChThreshold[0][band][1][c]);	
			}
			self.eqSqSet(band, self.config.allSameSquelch[band]);
			self.agcBandModeSet(band, self.config.agcBandMode[band]);
			for (var b = 0; b < 2; ++b) {
				for (var c = 0; c < self.factory.numADJFilters; ++c) {
					self.squelchChEnSet(b, c, band, 1, self.config.sqChEnabled[1][band][b][c]);	
					self.squelchChThrSet(b, c, band, 1, self.config.sqChThreshold[1][band][b][c]);	
				}
				self.mainGainLimSet(b, band, self.config.gain[band][b]);
				self.mainPowerLimSet(b, band, self.config.power[band][b]);
				self.eqBwSet(b, band, self.config.allChSameBW[band][b]);
				self.hpaSwSet(b, band, self.config.paEnabled[band][b]);
			}
			for (var nbadj = 0;nbadj<2;nbadj++){
				for (var c = 0; c < (nbadj==0?self.maxChannels:self.factory.numADJFilters); ++c) {
					var show = self.showFiltersMask[nbadj][band][c];
					this.setShowFilter(c, band, nbadj, show);
					self.bandSet(band, nbadj, c, self.config.filterBand[nbadj][band][1][c]); //DL is considered				
					for (var b = 0; b < 2; ++b) {
						self.setAdjFreqCh(b, c, band, self.config.fstartHzAdjFilter[band][b][c], self.config.fstopHzAdjFilter[band][b][c]);
						self.setGfine(b, c, band, nbadj, self.config.fineGainFilter[nbadj][band][b][c]);
						setMetRange("rfInPow_"+c+"_"+b+"_"+band+"_"+nbadj, chRfIn_settings[b]);						
					}
				}
			}
			for (var c = 0; c < self.maxChannels; ++c) {
				for (var b = 0; b < 2; ++b) {
					self.chBwSet(b, c, band, self.config.bwIndex[band][b][c]);

				}
			}
			self.setCNThresholdUlNb(band, self.config.cn_threshold_nb[band]);
			for (var c = 0; c < self.factory.numADJFilters; ++c) {
				self.setCNThresholdUlAdj(band, c, self.config.cn_threshold_adj[band][c]);
			}
			self.setControlChannelNr(band, self.config.controlChannel[band]);
			// reajustar límite de umbral C/N de filtros NB, para el caso de venir de un submit anterior
			self.setCNThresholdLimits(band, 0, 0);
			// reajustar límite de umbral C/N de filtros ADJ, para el caso de venir de un submit anterior
			for (var c = 0; c < self.factory.numADJFilters; c++) {
				if (!self.factory.isClassB() || (self.config.squelchAdjBwMode[band] == 0)) {
					// si squelch NO es filters based
					self.setCNThresholdLimits(band, 1, c);
				} else {
					// si squelch es filters based
					self.setCNThresholdLimits(band, 1, c);
				}
			}
		}
		self.displayFilters();

		var el = window.parent.head.document.getElementById('maintab');
		var w =  document.getElementById("tagName").getBoundingClientRect().width;
		
		el.style.width = w+'px';		
	}
	this.computeFiltersCombine = function(cnf, b, n, band) {
		//this function computes the filters that are combined with filter n
		var filts = [];
		for (var c = 0; c < 2*self.maxChannels; ++c) {
			//filters must be different
			if (c == n) {
				continue;
			}
			var band_c = c < self.maxChannels ? 0: 1;
			var nch_c = c % self.maxChannels;
			//filter c must belong to band. It is assumed that filter n belongs to band due to filterBelongsToCombination implementation
			if(cnf.filterBand[0][band_c][1][nch_c] != band) {
				continue;
			}
			//filter c must be enabled
			if (!cnf.filterEnabled[0][band_c][1][nch_c]) {
				continue;
			}
			//check if filters n and c are combined
			if (self.isFilterCombination(cnf, b, n, c, band)) {
				filts.push(c);
			}
		}
		return filts;
	}
	this.filterBelongsToCombination = function(cnf, b, n, band) {
		//this function checks if filter band / n belongs to a combination in band
		//filter n must be enabled
		if (!cnf.filterEnabled[0][band][1][n]) {
			return false;
		}
		var fband = cnf.filterBand[0][band][1][n];
		var nch = band*self.maxChannels + n;
		var filts = self.computeFiltersCombine(cnf, b, nch, fband);
		return (filts.length != 0);
	}
	this.getFilterCombinations = function(cnf, b, band) {
		//returns array of combined filter groups
		var filts = [];
		for (var n = 0; n < 2*self.maxChannels; ++n) {
			filts.push([]);
			var band_n = n < self.maxChannels ? 0: 1;
			var nch_n = n % self.maxChannels;
			//filter n must belong to band
			if(cnf.filterBand[0][band_n][1][nch_n] != band) {
				continue;
			}
			//filter n must be enabled
			if (!cnf.filterEnabled[0][band_n][1][nch_n]) {
				continue;
			}
			for (var c = 0; c < 2*self.maxChannels; ++c) {
				//filters must be different
				if (c == n) {
					continue;
				}
				var band_c = c < self.maxChannels ? 0: 1;
				var nch_c = c % self.maxChannels;
				//filter c must belong to band
				if(cnf.filterBand[0][band_c][1][nch_c] != band) {
					continue;
				}
				//filter c must be enabled
				if (!cnf.filterEnabled[0][band_c][1][nch_c]) {
					continue;
				}
				//check if filters n and c are combined
				if (self.isFilterCombination(cnf, b, n, c, band)) {
					if (filts[n].length == 0) {
						filts[n].push(n);
					}
					filts[n].push(c);
				}
			}
			if (filts[n].length == 0 && !self.isFilterAlreadyCounted(filts, n)) {
				filts[n].push(n);
			}
		}
		return filts;
	}
	this.computeFilterCombineReduction = function(cnf, b, band) {
		//this function computes the number of filter groups
		var filts = self.getFilterCombinations(cnf, b, band);
		//merge groups with common filters
		//each filts[i] is an array of filters belonging
		//filters can be repeated in different groups after merging. For instance
		//before merging: filts = [[0],[1,2],[2,1],[3,4],[4,3,5],[5,4]]
		//after merging: filts = [[0],[1,2,2,1],[],[3,4,4,3,5,5,4],]
		for (var i = 0; i < filts.length; i++) {
			if (filts[i].length > 0){
				for (var j = 0; j < filts[i].length; j++){
					if ((filts[i][j]!=i) && filts[filts[i][j]].length>0){
						for (var k = 0; k < filts[filts[i][j]].length; k++){
							filts[i].push(filts[filts[i][j]][k]);
						}
						filts[filts[i][j]]=[];
					}
				}
			}
		}
		//count non empty arrays
		var groups = 0;
		for (var i = 0; i < filts.length; ++i) {
			if (filts[i].length > 0) {
				groups++;
				//TESTING PURPOSES removing duplicates on each group
				/*var uniqueFilts = [];
				for (var j = 0; j < filts[i].length; j++) {
					if (!uniqueFilts.includes(filts[i][j])) {
						uniqueFilts.push(filts[i][j]);
					}
				}
				filts[i] = uniqueFilts;*/
			}
		}
		//TESTING PURPOSES
		/*for (var i = 0, num = 0; i < filts.length; ++i) {
			if (filts[i].length > 1) {
				var message = "Group "+num+" "+(b==0?"UL":"DL")+((band==0)?"700":"800")+": ";
				num++;
				for (var j = 0; j < filts[i].length; j++) {
					message += filts[i][j]+ " ";
				}
				console.log(message);
			}
		}*/
		//compute reduction = number of active filters - number of groups
		var fnr = self.computeNrActiveFilts(cnf,band);
		var rednr = fnr - groups;
		return rednr;
	}
	this.isFilterAlreadyCounted = function(filts, c) {
		//this function checks if filter c is already present in filts arrays
		for (var i = 0; i < filts.length - 1; ++i) {
			for (var j = 0; j < filts[i].length; ++j) {
				if (filts[i][j] == c) {
					return true;
				}
			}
		}
		return false;
	}
	this.computeNrActiveFilts = function(cnf,band) {
		//this function computes the number of active filters in band
		var n = 0;
		for (var c = 0; c < 2*self.maxChannels; ++c) {
			var band_c = c < self.maxChannels ? 0 : 1;
			var nch_c = c % self.maxChannels;
			//filter must be enabled and belong to band
			if (cnf.filterEnabled[0][band_c][1][nch_c] && (cnf.filterBand[0][band_c][1][nch_c] == band)) {
				n++;
			}
		}
		return n;
	}
	this.computeFiltersOverlap = function(cnf, band) {
		//this function computes the overlapping channel filters in band not meeting combination criteria
		var ovlp = [];
		var check = false;
		for (var b = 0; b < 2; ++b) {
			ovlp.push([]);
			for (var c = 0; c < 2*self.maxChannels; ++c) {
				var band_c = c < self.maxChannels ? 0 : 1;
				var nch_c = c % self.maxChannels;
				ovlp[b].push([]);
				//filters n must belong to band
				if (cnf.filterBand[0][band_c][1][nch_c] != band) {
					continue;
				}
				//filter must be enabled and band enabled in factory
				if (!self.factory.chBandEnabled[band] || !cnf.filterEnabled[0][band_c][1][nch_c]) {
					continue;
				}
				//find overlapping filters. result is array of filter indexes
				ovlp[b][c] = self.findFiltersOverlap(cnf, b, c, band);
				if (ovlp[b][c].length != 0) {
					check = true;
				}
			}
		}
		return {'check': check, 'ovlp': ovlp};
	}
	this.findFiltersOverlap = function(cnf, b, n, band) {
		//this function finds the filters that overlap with filter n (index in filtOrder) in band not meeting combination criteria
		var filts = [];
		for (var c = n + 1; c < 2*self.maxChannels; ++c) {
			var band_c = c < self.maxChannels ? 0 : 1;
			var nch_c = c % self.maxChannels;
			//filter c must be enabled
			if (!cnf.filterEnabled[0][band_c][1][nch_c]) {
				continue;
			}
			//check if filters n and c meets combination criteria
			if (self.isFilterCombination(cnf, b, n, c, band)) {
				continue;
			}
			if (self.isFilterOverlap(cnf, b, n, c, band)) {
				filts.push(c);
			}
		}
		return filts;
	}
	this.isFilterOverlap = function(cnf, b, n, c, band) {
		//this function checks if filters n and c are overlapped with 160% bandwidth criteria except valid separation freqs
		var band_n = n < self.maxChannels ? 0 : 1;
		var nch_n = n % self.maxChannels;
		var band_c = c < self.maxChannels ? 0 : 1;
		var nch_c = c % self.maxChannels;
		var f1 = cnf.freqHz[band_n][b][nch_n];
		var f2 = cnf.freqHz[band_c][b][nch_c];
		var b1 = cnf.computeBWFromIndex(cnf.bwIndex[band_n][b][nch_n]);
		var b2 = cnf.computeBWFromIndex(cnf.bwIndex[band_c][b][nch_c]);
		var filtSep = Math.abs(f2 - f1);
		var bandSep;
		for (var i=0; i<self.overlappingBWs.length; i++) {
			var bw = parseInt(self.overlappingBWs[i].name);
			if (b1 == bw && b2 == bw) {
				bandSep = ~~Math.round(self.overlappingBWs[i].validSep * 1000);
				if (filtSep == bandSep) {
					var g = cnf.fineGainFilter[0][band][b][n];
					var g1 = cnf.fineGainFilter[0][band][b][c];
					return (g != g1);
				} else {
					return (filtSep < bandSep);//for 150KHz filters 160% criteria is not applied. Just separation greater than combination valid separation
				}
			}
		}
		bandSep = ~~Math.round((b1 + b2) * 1000 / 2 * 1.6);
		return (filtSep < bandSep);
	}
	this.isFilterCombination = function(cnf, b, n, c, band) {
		//this function checks if filters n and c are combined
		//filters must be different
		if (n == c) {
			return false;
		}
		var band_n = n < self.maxChannels ? 0 : 1;
		var nch_n = n % self.maxChannels;
		var band_c = c < self.maxChannels ? 0 : 1;
		var nch_c = c % self.maxChannels;
		//filters n and c must belong to band
		if (cnf.filterBand[0][band_n][1][nch_n] != band || cnf.filterBand[0][band_c][1][nch_c] != band) {
			return false;
		}
		//filters must be enabled
		if (!(cnf.filterEnabled[0][band_n][1][nch_n] && cnf.filterEnabled[0][band_c][1][nch_c])) {
			return false;
		}
		//first, check if they are adjacent and combined filters
		if (self.computeCombinedFilters(cnf, b, n, c, band)) {
			return true;
		}
		//if not adjacent, check if they may be combined
		if (!self.mayBeCombinedFilters(cnf, b, n, c, band)) {
			return false;
		}
		//check if all filters in between are combined with them
		if (!self.checkFiltersInBetween(cnf, b, n, c, band)) {
			return false;
		}
		return true;
	}
	this.computeCombinedFilters = function(cnf, b, n, c, band) {
		//this function checks if filters n and c are adjacent and combined filters: both BWS must be equal and one of the available overlapping BWs
		//same fine gain, and frequency separation equal to valid separation
		if (n == c) {
			return false;
		}
		var band_n = n < self.maxChannels ? 0 : 1;
		var nch_n = n % self.maxChannels;
		var band_c = c < self.maxChannels ? 0 : 1;
		var nch_c = c % self.maxChannels;
		//filters n and c must belong to band
		if (cnf.filterBand[0][band_n][1][nch_n] != band || cnf.filterBand[0][band_c][1][nch_c] != band) {
			return false;
		}
		//filters must be enabled
		if (!(cnf.filterEnabled[0][band_n][1][nch_n] && cnf.filterEnabled[0][band_c][1][nch_c])) {
			return false;
		}
		//check for all available overlapping BWs
		for (var i = 0; i < self.overlappingBWs.length; i++) {
			var bwIndex = parseInt(self.overlappingBWs[i].index);
			var validSep = ~~Math.round(self.overlappingBWs[i].validSep * 1000);
			//both filters must have equal and one of the available overlapped BWs
			var k = cnf.bwIndex[band_n][b][nch_n];
			var k1 = cnf.bwIndex[band_c][b][nch_c];
			if (k!=k1 || k!=bwIndex) {
				continue;
			}
			//both filters must have same fine gain
			var g = cnf.fineGainFilter[0][band_n][b][nch_n];
			var g1 = cnf.fineGainFilter[0][band_c][b][nch_c];
			if (g != g1) {
				continue;
			}
			//frequency separation must be equal to valid separation
			var f1 = cnf.freqHz[band_n][b][nch_n];
			var f2 = cnf.freqHz[band_c][b][nch_c];
			var filtSep = Math.abs(f2 - f1);
			if (filtSep == validSep) return true;
		}
		return false;
	}
	this.mayBeCombinedFilters = function(cnf, b, n, c, band) {
		//this function checks if filters n and c may be combined according to their parameters: both BWS must be equal and one of the available overlapping BWs
		//same fine gain, and frequency separation equal to valid separation or multiple of valid separation
		//filters must be different
		if (n == c) {
			return false;
		}
		var band_n = n < self.maxChannels ? 0 : 1;
		var nch_n = n % self.maxChannels;
		var band_c = c < self.maxChannels ? 0 : 1;
		var nch_c = c % self.maxChannels;
		//filters n and c must belong to band
		if (cnf.filterBand[0][band_n][1][nch_n] != band || cnf.filterBand[0][band_c][1][nch_c] != band) {
			return false;
		}
		//filters must be enabled
		if (!(cnf.filterEnabled[0][band_n][1][nch_n] && cnf.filterEnabled[0][band_c][1][nch_c])) {
			return false;
		}
		//check for all available overlapping BWs
		for (var i = 0; i < self.overlappingBWs.length; i++) {
			var bwIndex = parseInt(self.overlappingBWs[i].index);
			var validSep = ~~Math.round(self.overlappingBWs[i].validSep * 1000);
			//both filters must have equal and one of the available overlapped BWs
			var k = cnf.bwIndex[band_n][b][nch_n];
			var k1 = cnf.bwIndex[band_c][b][nch_c];
			if (k!=k1 || k!=bwIndex) {
				continue;
			}
			//both filters must have same fine gain
			var g = cnf.fineGainFilter[0][band_n][b][nch_n];
			var g1 = cnf.fineGainFilter[0][band_c][b][nch_c];
			if (g != g1) {
				continue;
			}
			//frequency separation must be multiple of valid separation and greater than valid separation
			var f1 = cnf.freqHz[band_n][b][nch_n];
			var f2 = cnf.freqHz[band_c][b][nch_c];
			var filtSep = Math.abs(f2 - f1);
			if (filtSep % validSep != 0) {
				continue;
			}
			if (filtSep / validSep > 1) {
				return true;
			}
		}
		return false;
	}
	this.checkFiltersInBetween = function(cnf, b, n, c, band) {
		//this function checks if all filters between n and c are combined with them
		var band_n = n < self.maxChannels ? 0 : 1;
		var nch_n = n % self.maxChannels;
		var band_c = c < self.maxChannels ? 0 : 1;
		var nch_c = c % self.maxChannels;
		//filters n and c must belong to band
		if (cnf.filterBand[0][band_n][1][nch_n] != band || cnf.filterBand[0][band_c][1][nch_c] != band) {
			return false;
		}
		var f1 = cnf.freqHz[band_n][b][nch_n];
		var f2 = cnf.freqHz[band_c][b][nch_c];
		var filtSep = Math.abs(f2 - f1);

		//this function only is called after mayBeCombinedFilters, so both filters have same BW. Used first to know valid separation
		var k = cnf.bwIndex[band_n][b][nch_n];
		var validSep;
		//if this field does not exist in FilterTypes, return false
		try{
			validSep = ~~Math.round(FilterTypes[k].validSep * 1000);
		}catch(e){
			return false;	
		}
		if (filtSep % validSep != 0) {
			return false;
		}
		var steps = ~~Math.round(filtSep / validSep);
		if (steps == 0) {
			return false;
		}
		if (steps == 1) {
			return true;
		}
		var fst = f2 > f1 ? f1 : f2;
		for (var i = 1; i < steps; ++i) {
			var f = fst + filtSep * i;
			var k = self.hasFilterFreq(cnf, b, n, c, f, band);
			if (k === null) {
				return false;
			}
			if (!self.mayBeCombinedFilters(cnf, b, n, k, band)) {
				return false;
			}

		}
		return true;
	}
	this.hasFilterFreq = function(cnf, b, n, c, f, band) {
		//this function returns index of filter with frequency f different from filters n and c, or null if not found
		for (var k = 0; k < 2*self.maxChannels; ++k) {
			var band_k = k < self.maxChannels ? 0 : 1;
			var nch_k = k % self.maxChannels;
			//filters must be different from n and c
			if (k == n || k == c) {
				continue;
			}
			//filter must belong to band
			if (cnf.filterBand[0][band_k][1][nch_k] != band) {
				continue;
			}
			//filter must be enabled
			if (!cnf.filterEnabled[0][band_k][1][nch_k]) {
				continue;
			}
			//filter frequency must be f
			if (f != cnf.freqHz[band_k][b][nch_k]) {
				continue;
			}
			return k;
		}
		return null;
	}
	this.readConfsFrm = function(isReset, isIsolVerif, isIsolClear, band, forceSend, isForcePaOn, isForcePaOff, doSetDefaultRelay) {
		var cnf = new ConfigBDA();
		cnf.parse(self.config.frm);
		var frm = [];
		if (isReset) {
			cnf.resetSoft = true;
			frm.push(cnf.getFrm());
			return frm;
		}
		if (isIsolVerif) {
			cnf.runIsolationMeas[band] = true;
			cnf.forceDLMaxGain = false;
			frm.push(cnf.getFrm());
			return frm;
		}
		if (isIsolClear) {
			cnf.clearOscAlarm[band] = true;
			frm.push(cnf.getFrm());
			return frm;
		}
		if (doSetDefaultRelay){
			cnf.bbu_serial_mode = self.readBbuTypeOfConnection();
			frm.push(cnf.getFrm());
			return frm;
		}
		cnf.resetSoft = false;
		for (var k=0;k<2;k++){
			cnf.runIsolationMeas[k] = false;
			cnf.clearOscAlarm[k] = false;
		}
		cnf = self.getFreqs();
		self.getConf(cnf);
		for (var i=0;i<2;i++){
			for (var j=0;j<2;j++){
				cnf.forcePaOn[i][j] = isForcePaOn[i][j];
				if (cnf.forcePaOn[i][j]) cnf.paEnabled[i][j] = true;
				cnf.forcePaOff[i][j] = isForcePaOff[i][j];
				if (cnf.forcePaOff[i][j]) cnf.paEnabled[i][j] = false;
			}
		}
		
		fr = cnf.getFrm();
		if (self.config.frm != fr || forceSend) {
			frm.push(fr);
		}
		if (!self.checkFreqs(true,cnf)) return [];
		return frm;
	}
	this.getConf = function(cnf) {
		for (var band = 0; band < 2; ++band) {
			for (var b = 0; b < 2; ++b) {
				self.getBandConf(cnf, b, band);
			}	
			for (var c = 0; c <self.maxChannels; ++c) {
				self.getChConf(cnf, c, band);
			}
			for (var b = 0; b < 2; ++b) {
				self.getCombinationSettings(cnf, b, band);
			}
			for (var c = 0; c < self.factory.numADJFilters; ++c) {
				self.getAdjChConf(cnf, c, band);
			}
			for (var c = self.factory.numADJFilters; c < self.maxChannelsAdj; ++c) {
				cnf.filterEnabled[1][band][0][c] = false; 
				cnf.filterEnabled[1][band][1][c] = false; 
			}
			for (var k=0;k<self.config.NR_OF_RELAYS_MAX;k++){
				cnf.delayTimerON[k] = this.delayLatchOnOffGet(0,k);
				cnf.latchTimerON[k] = this.delayLatchOnOffGet(1,k);
				cnf.delayTimer[k] = this.delayLatchTimeGet(0,k);
				cnf.latchTimer[k] = this.delayLatchTimeGet(1,k);
			}
			cnf.controlChannel[band] = self.getControlChannelNr(band);
		}
		cnf.bbu_serial_mode = self.readBbuTypeOfConnection();
		cnf.externalPA = self.readExternalPAConfig();
		//TESTING PURPOSES
		/*for (var b = 0; b < 2; ++b) {
			console.log("Filter Groups "+(b==1?"DL":"UL"));
			for (var band = 0; band < 2; ++band) {
				console.log("Filter reduction "+(b==1?"DL":"UL")+" band "+band+": "+cnf.numberOfFilterNonGrouped[band][b]);
				for ( var n = 0; n < self.maxChannels; ++n) {
					if (cnf.isFilterGrouped[band][b][n]) console.log("Filter band "+(self.maxChannels*band+n+1)+" belongs to a combination in band "+cnf.filterBand[0][band][1][n]);
				}
			}
		}*/
	}
	this.getCombinationSettings = function(cnf, b, band){
		cnf.numberOfFilterNonGrouped[band][b] = self.computeFilterCombineReduction(cnf, b, band);
		for (var c = 0; c <self.maxChannels; ++c) {
			cnf.isFilterGrouped[band][b][c] = self.filterBelongsToCombination(cnf, b, c, band);
		}
	}
	this.getBandConf = function(cnf, b, band) {
		cnf.squelchAdjBwMode = self.squelchAdjBwModeRead();
		cnf.allChSameBW[band][b] = self.eqBwIsSet(b,band);
		if (b==1) cnf.allSameSquelch[band] = self.eqSqIsSet(band);
		if (b==0){//AGC band mode and back-off only exist in UL
			cnf.agcBandMode[band] = self.agcBandModeGet(band); 
			cnf.backOff[band] = self.backOffGet(band);
		}
		cnf.paEnabled[band][b] = self.config.paEnabled[band][b];
		
		cnf.oscTimeThSeconds[0] = self.getAbnSqTime();
		cnf.oscRetryTimeHours[0] = self.getRetryTime();
		cnf.oscFeatureEnabled[0] = true;
		cnf.oscActionAfterAlarm[0] = self.opfModeGet();
		cnf.autoUlPaOffTimer = self.getAutoPaUlOffTime();
		cnf.cnAlarmTime = self.getCnUlLowAlarmTime();
		cnf.firstADJisFirstNet = self.getFirstNet();
		if (band == 0 && b == 0) {
			cnf.extremeTempAction = self.readExtremeTemperatureAction();
		}
		
		for (var nbadj = 0;nbadj<2;nbadj++){
			var cmax = nbadj==0?self.config.CHNR:self.factory.numADJFilters;
			if (nbadj==0 && b==0) cmax=1;
			for (var c=0;c<self.maxChannels;c++){
				cnf.sqChEnabled[nbadj][band][b][c] = self.squelchChEnIsSet(b,c,band,nbadj);
				var sqth = self.squelchChThrGet(b,c,band,nbadj);
				var sqthMin = self.config.sqThrLimits(b, self.factory.ULlowGainMode).MIN;
				var sqthMax = self.config.sqThrLimits(b, self.factory.ULlowGainMode).MAX;
				if (sqth < sqthMin) sqth = sqthMin;
				if (sqth > sqthMax) sqth = sqthMax;
				cnf.sqChThreshold[nbadj][band][b][c] = sqth;
			}
		}
		var gmain = self.mainGainLimGet(b, band);
		var gainMax = self.factory.gainlimit[2*band+b];
		var gainMin = self.factory.gainlimit[2*band+b]+self.config.GmainRange[b];
		if (gmain > gainMax) gmain = gainMax;
		if (gmain < gainMin) gmain = gainMin;
		cnf.gain[band][b] = gmain;
		var pmain = self.mainPowerLimGet(b,band);
		var powerMax = self.factory.powerlimit[2*band+b];
		var powerMin = self.factory.powerlimit[2*band+b] - self.config.limitPowerRange[b];
		if (pmain > powerMax) pmain = powerMax;
		if (pmain < powerMin) pmain = powerMin;
		cnf.power[band][b] = pmain;

		if (b == 0) {
			var cnThrLimits = self.cnThresholdLimits();
			var cn = self.getCNThresholdUlNb(band);
			if (cn < cnThrLimits.MIN) {
				cn = cnThrLimits.MIN;
			} else if (cn > cnThrLimits.MAX) {
				cn = cnThrLimits.MAX;
			}
			cnf.cn_threshold_nb[band] = cn;
			for (var ch = 0; ch < self.factory.numADJFilters; ch++) {
				var cnThrLimits = self.cnThresholdLimits();
				var cn = self.getCNThresholdUlAdj(band,ch);
				if (cn < cnThrLimits.MIN) {
					cn = cnThrLimits.MIN;
				} else if (cn > cnThrLimits.MAX) {
					cn = cnThrLimits.MAX;
				}
				cnf.cn_threshold_adj[band][ch] = cn;
			}
		}
	}
	this.getChConf = function(cnf, c, band) {
		var fb = self.bandGet(band, 0, c);
		var on = (self.isFiltEnabled(c, band, 0) && (self.factory.chBandEnabled[fb] || self.factory.isClassB()) );
		for (var b = 0; b < 2; ++b) {
			if (on !== null) {
				cnf.filterEnabled[0][band][b][c] = on;
			}
			var bw = self.chBwGet(b, c, band);
			if (bw !== null) {
				cnf.bwIndex[band][b][c] = bw;
			}
			var gfine = self.getGfine(c, b, band, 0);
			if (gfine !== null) {
				if (gfine > self.config.limitgFine[b].MAX) gfine = self.config.limitgFine[b].MAX;
				if (gfine < self.config.limitgFine[b].MIN) gfine = self.config.limitgFine[b].MIN;
				cnf.fineGainFilter[0][band][b][c] = gfine;
			}
		}
	}
	this.showStatus = function(monitor) {
		self.blockedSet(monitor.blocked);
		if (self.blocked) {
			return;
		}
		self.boardTempSet(monitor.boardTemp);
		self.opfRoutineRunningSet(monitor.isolMeasRunning[0]);		
		self.setIsolGain(monitor.maxAllowGain);
		self.setLastRetryTime(monitor.retryTime);
		self.showExtremeTempStatus(monitor.extremeTempActionOn);
		self.extremeTempActionStatusOn = monitor.extremeTempActionOn;
		for (var k=0;k<16;k++)
			self.gralAlarmSet(k, monitor.gralAlarm[k]);
		for (var k=0;k<config.NR_OF_RELAYS_MAX;k++){
			var noShow = self.config.latchTimerON[k] && (self.config.latchTimer[k]>=35996400); //hours = 9999
			self.delayLathTimeStatSet(0,k,monitor.delayTimer[k],monitor.delayTimerRunning[k],false);
			self.delayLathTimeStatSet(1,k,monitor.latchTimer[k],monitor.latchTimerRunning[k],noShow);
			self.relayStateSet(k,monitor.relayOpenClosed[k],monitor.relayONOFF[k]);
		}
		for (var k=0;k<16;k++){
			self.bbuAlarmSet(k, monitor.bbuAlarm[k], monitor.bbuChargerErrorCode);
		}
		for (var band = 0; band < 2; ++band) {
			for (var b = 0; b < 2; ++b) {
				for (var nbadj=0;nbadj<2;nbadj++){
					for (var c = 0; c < (nbadj==0?self.maxChannels:self.factory.numADJFilters); ++c) {
						self.showStatusCh(monitor, b, c, band, nbadj);
					}
				}
				var oneChOutOn = self.computeOneChOutOn(b, band, monitor);
				if (b==0) oneChOutOn = true; //UL always on in output, because is based on FPGA detectors
				self.rfOutPowSet(b, band, monitor.estTxPow[band][b], oneChOutOn);
				if (self.config.oscFeatureEnabled[0] && self.factory.oscFeatureEnable){
					self.setConfGain(b, band, monitor.configGain[band][b]);
					self.setStatePaOn(b, band, monitor);
				}
				self.bbAgcSet(b, band, monitor.bbAgc[band][b]);
				self.bbOutAgcSet(band, b, monitor.statePaOn[band][b]?monitor.bbAgcOut[band][b]:0);
			}
			
			for (var k=0;k<8;k++)
				self.bandAlarmSet(band, k, monitor.bandAlarm[band][k]);
		}
		if ( uCSupportsBbuMvo2Mode(self.version) && isBbuSerialMode(self.config, self.factory, self.version) ) {
			self.deepDischarge.showDeepDischargeMvo2(monitor.bbuDeepDischarge, self.config);
		}
		if (self.doFrequencyCheck) {
			self.checkFreqs(false);
			self.doFrequencyCheck = false;
		}
	}
	this.showNfpaStatus = function(NFPAstat){
		self.deepDischarge.showDeepDischargeMvo1(NFPAstat, self.config, self.factory, self.version);
	}
	this.computeAgcOutUlMaxpower = function(band,monitor){
		// máximo de agc de canales nb y adj activos
		var maxchADJ = (self.factory.adjBandEnabled[band]?self.factory.numADJFilters:0);
		var maxchNB = (self.factory.chBandEnabled[band]?self.config.CHNR:0);
		var maxChAgcUl = 0;
		for (var nbadj=0; nbadj<2; nbadj++){
			for (var fb=0;fb<2;fb++){//search maximum in filters band0/band1
				for (var c=0; c<(nbadj==0?maxchNB:maxchADJ); c++){
					if (self.config.filterBand[nbadj][fb][1][c] != band) continue; //filter belongs to band
					var agc =  self.computeAgc(0, c, fb, nbadj, monitor);//only UL
					if (agc>maxChAgcUl) maxChAgcUl = agc;
				}
			}
		}
		// agc BB de entrada
		var bbInputAgcUl = monitor.bbAgc[band][0];
		// agc BB de salida en modo maxpower = max. agc de canal - agc BB entrada
		var bbOuputAgcUl = maxChAgcUl - bbInputAgcUl;
		if (bbOuputAgcUl < 0) bbOuputAgcUl = 0;
		return bbOuputAgcUl;
	}
	this.showStatusCh = function(monitor, b, c, band, nbadj) {
		var isInput = monitor.signalDet[nbadj][band][b][c] && self.config.filterEnabled[nbadj][band][1][c];
		var chInOn = self.computeChSignalInputIsOn(b, c, band, nbadj, monitor);		
		var abnSq = false;
		if (self.factory.oscFeatureEnable) abnSq = b==0?monitor.oscDetectCH[nbadj][band][c]:false;
		if (abnSq){
			self.rfSignalLedSet(b, c, band, nbadj, "red");
		} else if (monitor.cnDet[nbadj][band][c] && (b==0)) {
			self.rfSignalLedSet(b, c, band, nbadj, "yellow");
		} else if (isInput && chInOn) {
			self.rfSignalLedSet(b, c, band, nbadj, "green");
		} else {
			self.rfSignalLedSet(b, c, band, nbadj, "grey");
		}
		var realBand = self.config.filterBand[nbadj][band][1][c];
		if (monitor.bandAlarm[realBand][b]) { //bandAlarm[][0] is overload UL, bandAlarm[][1] is overload DL
			self.rfChInPowSet(b, c, band, nbadj, monitor.level[nbadj][band][b][c], "alarm");
		}else if (!chInOn) {
			self.rfChInPowSet(b, c, band, nbadj, monitor.level[nbadj][band][b][c], "#D0D0D0");
		} else {
			self.rfChInPowSet(b, c, band, nbadj, monitor.level[nbadj][band][b][c]);
		}
		var chOutOn = self.computeChOutOn(b, c, band, nbadj, monitor);
		var rfOut = monitor.level[nbadj][band][b][c]+monitor.gain[nbadj][band][b][c];
		rfOut -= (monitor.bbAgc[realBand][b]); //substract bb agc input
		rfOut -= (monitor.bbAgcOut[realBand][b]); //substract bb agc output
		self.rfChOutPowSet(b, c, band, nbadj, rfOut, chOutOn);
		var agc = self.computeAgc(b, c, band, nbadj, monitor);
		self.agcSet(b, c, band, nbadj, agc);
	}
	this.computeChOutOn = function(b, c, band, nbadj, monitor) {
		var ch = c;
		if (nbadj==0 && b==0) ch=0;
		var realBand = self.config.filterBand[nbadj][band][1][c];
		if (!monitor.statePaOn[realBand][b]) {
			return false;
		}
		if (!self.config.filterEnabled[nbadj][band][1][c]) {
			return false;
		}
		if (!monitor.signalDet[nbadj][band][b][c]) {
			if (self.config.sqChEnabled[nbadj][band][b][ch]) {
				return false;
			}
		}
		return true;
	}
	this.computeOneChOutOn = function(b, band, monitor) {
		var oneChOutOn = false;
		for (var fb=0;fb<2;fb++){
			for (var c = 0; c < self.maxChannels; ++c) {
				if (self.config.filterBand[0][fb][1][c]!=band) continue;
				if (self.computeChOutOn(b, c, fb, 0, monitor)) {
					oneChOutOn = true;
					break;
				}
			}
			for (var c = 0; c < self.factory.numADJFilters; ++c) {
				if (self.config.filterBand[1][fb][1][c]!=band) continue;
				if (self.computeChOutOn(b, c, fb, 1, monitor)) {
					oneChOutOn = true;
					break;
				}
			}
		}
		return oneChOutOn;
	}
	this.computeChSignalInputIsOn = function(b, c, band, nbadj, monitor) {
		var ch = c; if (nbadj==0 && b==0) ch=0;	// canal de squelch
		if (!self.config.filterEnabled[nbadj][band][1][c]) {
			return false;
		}
		if (!monitor.signalDet[nbadj][band][b][c]) {
			if (self.config.sqChEnabled[nbadj][band][b][ch]) {
				return false;
			}
		}
		return true;
	}
	this.computeAgc = function(b, c, band, nbadj, monitor) {
		var realBand = self.config.filterBand[nbadj][band][1][c];
		var sqon = self.config.sqChEnabled[nbadj][band][b][c];
		if ((nbadj==0) && (b==0)) sqon = self.config.sqChEnabled[0][realBand][0][0]; // canal de squelch UL NB
		var agc = monitor.configGain[realBand][b] + self.config.fineGainFilter[nbadj][band][b][c]	- monitor.gain[nbadj][band][b][c];
		if (agc < 0) {
			agc = 0;
		}
		if (!monitor.statePaOn[realBand][b]) {
			agc = 0;
		}
		if (!monitor.signalDet[nbadj][band][b][c] && sqon) {
			agc = 0;
		}
		if (!self.config.filterEnabled[nbadj][band][1][c]) {
			agc = 0;
		}
		return agc;
	}

	this.uldlLinkedDisable = function(band){
		//se fuerza a false si bw ul/dl no son iguales
		if ((self.factory.fstop[2*band+1]-self.factory.fstart[2*band+1])!=(self.factory.fstop[2*band]-self.factory.fstart[2*band])){
			var el = document.getElementById("freqSplit"+band);
			el.disabled = true;
			el.style.backgroundColor = "#CCCCCC";
		}	
	}

	this.createFreqStyleSw = function() {
		var el = document.createElement("input");
		el.id = "freqStyle";
		el.name = el.id;
		el.type = "button";
		el.value = self.freqStyle == 0 ? "Start/Stop" : "Center/Bandwidth";
		el.style.fontWeight = "bold";
		el.style.width = "130px";
		el.style.minWidth = "130px";
		el.style.borderRadius = "10px";
		el.align = "center";
		el.onclick = function(ev) {
			try {
				//read adj frequencies with old freqStyle
				var fcurr = [];
				for (var band = 0; band < 2; ++band) {
					fcurr.push([]);
					self.setAdjFreqHeaders(band);
					for (b = 0; b < 2; ++b) {
						fcurr[band].push([]);
						for (var c = 0; c < self.config.ADJNR; ++c) {
							fcurr[band][b].push(self.getAdjFreq(b, c, band));
						}
					}
				}
				//toggle freqStyle
				self.freqStyle = self.freqStyle == 0 ? 1 : 0;
				localStorage.setItem('freqStyle_'+Prjstr+window.location.host, self.freqStyle);
				this.value = self.freqStyle == 0 ? "Start/Stop" : "Center/Bandwidth";
				//write adj frequencies with new freqStyle
				for (var band = 0; band < 2; ++band) {
					for (b = 0; b < 2; ++b) {
						for (var c = 0; c < self.config.ADJNR; ++c) {
							self.setAdjFreqTitles(b, band, c);
							var chnr = [];
							for (var s = 0; s < 2; ++s) {
								chnr.push(self.computeAdjChNr(fcurr[band][b][c][s], b, band));
							}
							self.setAdjFreqCh(b, c, band, self.computeAdjChFreq(chnr[0], b, band), self.computeAdjChFreq(chnr[1], b, band));
						}
					}
				}
			} catch (err) {}
		}
		return el;
	}
	this.setAdjFreqHeaders = function(band) {
		try {
			for (var b = 0; b < 2; ++b) {
				var td1 = document.getElementById("HeaderF1_"+b+"_"+band+"_1");
				var td2 = document.getElementById("HeaderF2_"+b+"_"+band+"_1");
				if (self.freqStyle == 0) {
					td1.innerHTML = "Fstart&nbsp;(MHz)";
					td2.innerHTML = "Fstop&nbsp;(MHz)";
				} else {
					td1.innerHTML = "Fr.&nbsp;(MHz)";
					td2.innerHTML = "BW&nbsp;(MHz)";
				}
			}
			for (var b = 0; b < 2; ++b) {
				for (var c = 0; c < self.config.ADJNR; ++c) {
					var id
				}
			}
		} catch(e) {}
	}
	this.limitAdjFilterValues = function(b, c, s, band){
		var f = self.getAdjFreq(b, c, band);
		var g = [];
		if (self.freqStyle == 0) {
			g = self.adjustFreqLimitsSp(b, s, band, f, c);
		} else if (s == 0) {
			g = self.adjustFreqLimitsFc(b, band, f, c);
		} else {
			g = self.adjustFreqLimitsBw(b, c, band, f);
		}
		var chnr = [];
		for (var s = 0; s < 2; ++s) {
			chnr.push(self.computeAdjChNr(g[s], b, band));
		}
		self.setAdjFreqCh(b, c, band, self.computeAdjChFreq(chnr[0], b, band), self.computeAdjChFreq(chnr[1], b, band));
		var fband = self.bandGet(band,1,c);
		if (!self.isFreqSplitFixed(fband)) {
			return;
		}
		self.adjustFreqLimitsOtherBand(b, c, band, chnr);

	}
	this.createAdjFr = function(b, c, s, band) {
		var cell = document.createElement("td");
		cell.id = "cellAdjF_"+c+"_"+b+"_"+s+"_"+band;
		var fr = document.createElement("input");
		fr.type = "text";
		fr.id = "chAdjF_"+c+"_"+b+"_"+s+"_"+band;
		fr.name = fr.id;
		fr.style.width = "52px";
		fr.className = "number";
		fr.channel = c;
		fr.path	= b;
		fr.ss = s;
		fr.band = band;
		var titles = this.computeAdjFreqTitles(b, band, c);
		if (s == 0) {
			fr.title = titles[0];
		} else {
			fr.title = self.freqStyle == 0 ? titles[0] : titles[1];
		}
		fr.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		fr.onchange = function(ev) {
			var b = this.path;
			var c = this.channel;
			var s = this.ss;
			var band = this.band;
			self.limitAdjFilterValues(b, c, s, band);
		}
		cell.appendChild(fr);
		if (c==0 && s==0 && band==0){
			fr = document.createElement("input");
			fr.id = "firstnet_"+b;
			fr.readOnly = true;
			fr.style.display = "none";
			fr.style.width = "114px";
			fr.value = "BAND 14 "+(b==0?"788-798MHz":"758-768MHz");
			fr.style.textAlign = "center";
			cell.appendChild(fr);
		}
		return cell;
	}
	this.checkAdjFrSetting = function(b, c, s, band, value) {
		var fband = self.bandGet(band,1,c);
		var fmin = self.factory.fstart[2*fband+b];
		var fmax = self.factory.fstop[2*fband+b];
		var bwmin = self.BW_ADJ_MIN_HZ;
		var bwmax = fmax - fmin;
		var r;
		if (s == 0 || self.freqStyle == 0) {
			var v = ~~Math.round(parseFloat(value)*1e6);
			if (v < fmin) {
				v = fmin;
			} else if (v > fmax) {
				v = fmax;
			}
			r = (v / 1e6).toFixed(3);
		} else {
			var v = ~~Math.round(parseFloat(value)*1e6);
			if (v < bwmin) {
				v = bwmin;
			} else if (v > bwmax) {
				v = bwmax;
			}
			r = (v / 1e6).toFixed(3);
		}
		return r;
	}
	this.computeAdjFreqTitles = function(b, band, c) {
		var fband = self.bandGet(band,1,c);
		var fmin = self.factory.fstart[2*fband+b];
		var fmax = self.factory.fstop[2*fband+b];
		var bwmax = (fmax - fmin);
		if (bwmax > self.maxBw(b, fband)) {
			bwmax = self.maxBw(b, fband);
		}
		var bwmin = self.BW_ADJ_MIN_HZ;
		var title = "Min: "+(fmin/1e6)+", Max: "+(fmax/1e6)+" MHz";
		var title1 = "Min: "+(bwmin/1e6)+", Max: "+(bwmax/1e6)+" MHz";
		return [title, title1];
	}
	this.setAdjFreqTitles = function(b, band, c) {
		var titles = self.computeAdjFreqTitles(b, band, c);
		var t = [];
		t.push(titles[0]);
		if (self.freqStyle == 0) {
			t.push(titles[0]);
		} else {
			t.push(titles[1]);
		}
		for (var s = 0; s < 2; ++s) {
			var id = "chAdjF_"+c+"_"+b+"_"+s+"_"+band;
			var el = document.getElementById(id);
			try {
				el.title = t[s];
			} catch(e) {}
		}
	}
	this.setAdjFreqCh = function(b, c, band, fstart, fstop) {
		var fc = (fstart + fstop) / 2;
		var bw = Math.abs(fstop - fstart);
		var f = [];
		if (self.freqStyle == 0) {
			f.push(fstart);
			f.push(fstop);
		} else {
			f.push(fc);
			f.push(bw);
		}
		for (var s = 0; s < 2; ++s) {
			var id = "chAdjF_"+c+"_"+b+"_"+s+"_"+band;
			var el = document.getElementById(id);
			try {
				if (s == 0 || self.freqStyle == 0) {
					el.value = (f[s] / 1.0e6).toFixed(4);
				} else {
					el.value = (f[s] / 1.0e6).toFixed(4);
				}
			} catch(e) {}
		}
	}
	this.getAdjFreq = function(b, c, band) {
		var f = [];
		for (var s = 0; s < 2; ++s) {
			var id = "chAdjF_"+c+"_"+b+"_"+s+"_"+band;
			var el = document.getElementById(id);
			try {
				var v;
				if (s == 0 || self.freqStyle == 0) {
					v = ~~Math.round(parseFloat(el.value)*1e6);
				} else {
					v = ~~Math.round(parseFloat(el.value)*1e6);
				}
				f.push(v);
			} catch(e) {}
		}
		if (self.freqStyle != 0) {
			var fstart = ~~Math.round(f[0]-f[1]/2);
			var fstop = ~~Math.round(f[0]+f[1]/2);
			f = [];
			f.push(fstart);
			f.push(fstop);
		}
		return f;
	}
	this.computeAdjChFreq = function(chnr, b, band) {
		var fo = self.factory.fref[2*band+b];
		var fstep = self.factory.fstepAdj;
		var fr = chnr * fstep + fo;
		return fr;
	}
	this.computeAdjChNr = function(fr, b, band) {
		var fo = self.factory.fref[2*band+b];
		var fstep = self.factory.fstepAdj;
		var chnr = ~~Math.round((fr - fo)/fstep);
		return chnr;
	}
	this.computeAdjChNrOtherBand = function(chnr, b, band, c) {
		var fband = self.bandGet(band,1,c);
		var fr = self.computeAdjChFreq(chnr, b, band);
		var diff = fr - self.factory.fstart[2*fband+b];
		var a = (b + 1) % 2;
		fr = self.factory.fstart[2*fband+a] + diff;
		var num = self.computeAdjChNr(fr, a, band);
		return num;
	}
	this.adjustFreqLimitsSp = function(b, k, band, f, c) {
		var fband = self.bandGet(band,1,c);
		var factS = self.factory.fstart[2*fband+b];
		var factP = self.factory.fstop[2*fband+b];
		if (f[0] < factS) {
			f[0] = factS;
		} else if (f[0] >= factP) {
			f[0] = factP - self.BW_ADJ_MIN_HZ;
		}
		if (f[1] > factP) {
			f[1] = factP;
		} else if (f[1] <= factS) {
			f[1] = factS + self.BW_ADJ_MIN_HZ;
		}
		if (f[0] >= f[1]) {
			if (k == 0) {
				f[1] = f[0] + self.BW2_ADJ_MIN_HZ;
			} else {
				f[0] = f[1] - self.BW2_ADJ_MIN_HZ;
			}
		}
		var bw = Math.abs(f[1] - f[0]);
		if (bw < self.BW_ADJ_MIN_HZ) {
			bw = self.BW_ADJ_MIN_HZ;
		} else if (bw > self.maxBw(b, fband)) {
			bw = self.maxBw(b, fband);
		}
		var step = ~~Math.round(self.factory.fstepAdj*2);
		bw = ~~Math.round(bw / step) * step;
		if (k == 0) {
			f[1] = f[0] + bw;
			if (f[1] > factP) {
				f[1] = factP;
			}
			if (f[0] >= factP) {
				f[0] = factP - self.BW2_ADJ_MIN_HZ;
			}
		} else {
			f[0] = f[1] - bw;
			if (f[0] < factS) {
				f[0] = factS;
			}
			if (f[1] <= factS) {
				f[1] = factS + self.BW2_ADJ_MIN_HZ;
			}
		}
		for (var i = 0; i < 2; ++i) {
			var num = self.computeAdjChNr(f[i], b, band);
			if (!isNaN(num)) {
				f[i] = self.computeAdjChFreq(num, b, band);
			}
		}
		return f;
	}
	this.adjustFreqLimitsFc = function(b, band, f, c) {
		if (f[0] > f[1]) {
			var fr = f[0];
			f[0] = f[1];
			f[1] = fr;
		}
		var fc = ~~Math.round((f[0] + f[1]) / 2);
		var bw2 = ~~Math.round(Math.abs(f[1] - f[0]) / 2);
		var fband = self.bandGet(band,1,c);
		var factS = self.factory.fstart[2*fband+b];
		var factP = self.factory.fstop[2*fband+b];
		if (fc <= factS) {
			fc = factS + self.BW2_ADJ_MIN_HZ;
		} else if (fc >= factP) {
			fc = factP - self.BW2_ADJ_MIN_HZ;
		}
		if (fc - bw2 < factS) {
			bw2 = fc - factS;
		} else if (fc + bw2 > factP) {
			bw2 = factP - fc;
		}
		var bw = bw2 * 2;
		if (bw < self.BW2_ADJ_MIN_HZ) {
			bw = self.BW2_ADJ_MIN_HZ;
		} else if (bw > self.maxBw(b, fband)) {
			bw = self.maxBw(b, fband);
		}
		f[0] = ~~Math.round(fc - bw / 2);
		f[1] = ~~Math.round(fc + bw / 2);
		var bw = f[1] - f[0];
		var step = ~~Math.round(self.factory.fstepAdj*2);
		bw = ~~Math.round(bw / step) * step;
		f[1] = f[0] + bw;
		for (var i = 0; i < 2; ++i) {
			var num = self.computeAdjChNr(f[i], b, band);
			if (!isNaN(num)) {
				f[i] = self.computeAdjChFreq(num, b, band);
			}
		}
		return f;
	}
	this.adjustFreqLimitsBw = function(b, c, band, f) {
		if (f[0] > f[1]) {
			var fr = f[0];
			f[0] = f[1];
			f[1] = fr;
		}
		var fc = ~~Math.round((f[0] + f[1]) / 2);
		var fconf = [0,0];
		var fband = self.bandGet(band,1,c);
		fconf[0] = self.config.fstartHzAdjFilter[band][b][c];
		fconf[1] = self.config.fstopHzAdjFilter[band][b][c];
		var fcp = ~~Math.round((fconf[0] + fconf[1]) / 2);
		if (fc % self.BW2_ADJ_MIN_HZ != fcp % self.BW2_ADJ_MIN_HZ) {
			fc = fcp;
		}
		var bw = Math.abs(f[1] - f[0]);
		var step = ~~Math.round(self.factory.fstepAdj*2);
		bw = ~~Math.round(bw / step) * step;
		if (bw > self.maxBw(b, fband)) {
			bw = self.maxBw(b, fband);
		} else if (bw < self.BW2_ADJ_MIN_HZ) {
			bw = self.BW2_ADJ_MIN_HZ;
		}
		var bw2 = ~~Math.round(bw / 2);
		var factS = self.factory.fstart[2*fband+b];
		var factP = self.factory.fstop[2*fband+b];
		if (fc <= factS) {
			fc = factS + self.BW2_ADJ_MIN_HZ;
		} else if (fc >= factP) {
			fc = factP - self.BW2_ADJ_MIN_HZ;
		}
		if (fc - bw2 < factS) {
			fc = factS + bw2;
		} else if (fc + bw2 > factP) {
			fc = factP - bw2;
		}
		f[0] = ~~Math.round(fc - bw2);
		f[1] = ~~Math.round(fc + bw2);
		for (var i = 0; i < 2; ++i) {
			var num = self.computeAdjChNr(f[i], b, band);
			if (!isNaN(num)) {
				f[i] = self.computeAdjChFreq(num, b, band);
			}
		}
		return f;
	}
	this.adjustFreqLimitsOtherBand = function(b, c, band, ch) {
		var d = (b + 1) % 2;
		var g = [];
		for (var k = 0; k < 2; ++k) {
			var chnr = self.computeAdjChNrOtherBand(ch[k], b, band, c);
			g.push(chnr);
		}
		self.setAdjFreqCh(d, c, band, self.computeAdjChFreq(g[0], d, band), self.computeAdjChFreq(g[1], d, band));
	}
	this.maxBw = function(b, band) {
		var bw =  Math.abs(Math.abs(self.factory.fstop[2*band+b]
			- self.factory.fstart[2*band+b]));
		if (bw > self.BW_ADJ_MAX_HZ) {
			bw = self.BW_ADJ_MAX_HZ;
		}
		return bw;
	}
	this.adjSplitChRedraw = function (c, fixed) {
		for (var b = 0; b < 2; ++b) {
			for (var s = 0; s < 2; ++s) {
				var id = "chAdjF_"+c+"_"+b+"_"+s;
				var el = document.getElementById(id);
				try {
					el.onchange();
				} catch(e) {}
			}
		}
	}
	this.getAdjChConf = function(cnf, c, band) {
		var f = [];
		var fb = self.bandGet(band, 1, c);
		var on = self.isFiltEnabled(c, band, 1) && self.factory.adjBandEnabled[fb];
		for (var b = 0; b < 2; ++b) {
			if (on !== null) {
				cnf.filterEnabled[1][band][b][c] = on;
				cnf.filterBand[1][band][b][c] = fb;
			}
			var gfine = self.getGfine(c, b, band, 1);
			if (gfine !== null) {
				if (gfine > self.config.limitgFine[b].MAX) {
					gfine = self.config.limitgFine[b].MAX;
				} else if (gfine < self.config.limitgFine[b].MIN) {
					gfine = self.config.limitgFine[b].MIN;
				}
				cnf.fineGainFilter[1][band][b][c] = gfine;
			}
			f = this.getAdjFreq(b, c, band);
			if (on) {
				cnf.fstartHzAdjFilter[band][b][c] = f[0];
				cnf.fstopHzAdjFilter[band][b][c] = f[1];
			}
		}
	}
	this.computeAdjFiltersOverlap = function(cnf,band) {
		//this function computes the overlapping adj filters in band
		var ovlp = [];
		var check = false;
		for (var b = 0; b < 2; ++b) {
			ovlp.push([]);
			for (var c = 0; c < 2*self.factory.numADJFilters; ++c) {
				var band_c = c < self.factory.numADJFilters ? 0 : 1;
				var nch_c = c % self.factory.numADJFilters;
				ovlp[b].push([]);
				//filters n must belong to band
				if (cnf.filterBand[1][band_c][1][nch_c] != band) {
					continue;
				}
				//filter must be enabled and band enabled in factory
				if (!self.factory.adjBandEnabled[band] || !cnf.filterEnabled[1][band_c][1][nch_c]) {
					continue;
				}
				//find overlapping filters. result is array of filter indexes
				ovlp[b][c] = self.findAdjFiltersOverlap(cnf, b, c, band);
				if (ovlp[b][c].length != 0) {
					check = true;
				}
			}
		}
		return {'check': check, 'ovlp': ovlp};
	}
	this.checkClassBFilters = function(cnf,band) {
		for (var b = 0; b < 2; ++b) {
			if (self.factory.adjBandEnabled[band]){
				for (var c = 0; c < self.factory.numADJFilters; ++c) {
					if (cnf.filterEnabled[1][band][b][c]) return {'check': true};
				}
			}
			if (self.factory.chBandEnabled[band]){
				for (var c = 0; c < self.maxChannels; ++c) {
					if (cnf.filterEnabled[0][band][b][c] && cnf.bwKHz[band][b][c]>75) return {'check': true};
				}
			}
		}
		return {'check': false};
	}
	this.computeNBAdjFiltersOverlap = function(cnf,band) {
		//this function computes the overlapping channel filters and adj filters in band
		var ovlp = [];
		var check = false;
		for (var b = 0; b < 2; ++b) {
			ovlp.push([]);
			for (var c = 0; c < 2*self.factory.numADJFilters; ++c) {
				var band_c = c < self.factory.numADJFilters ? 0 : 1;
				var nch_c = c % self.factory.numADJFilters;
				ovlp[b].push([]);
				//filters n must belong to band
				if (cnf.filterBand[1][band_c][1][nch_c] != band) {
					continue;
				}
				//adj filter must be enabled and band enabled in factory
				if (!self.factory.chBandEnabled[band] || !self.factory.adjBandEnabled[band] || !cnf.filterEnabled[1][band_c][1][nch_c]) {
					continue;
				}
				//find overlapping filters. result is array of filter indexes
				ovlp[b][c] = self.findNBAdjFiltersOverlap(cnf, b, c, band);
				if (ovlp[b][c].length != 0) {
					check = true;
				}
			}
		}
		return {'check': check, 'ovlp': ovlp};
	}	
	this.findAdjFiltersOverlap = function(cnf, b, n, band) {
		//this function finds the adj filters that overlap with adj filter n
		var filts = [];
		for (var c = n + 1; c < 2*self.factory.numADJFilters; ++c) {
			var band_c = c < self.factory.numADJFilters ? 0 : 1;
			var nch_c = c % self.factory.numADJFilters;
			//filters c must belong to band
			if (cnf.filterBand[1][band_c][1][nch_c] != band) {
				continue;
			}
			//filter must be enabled
			if (!cnf.filterEnabled[1][band_c][1][nch_c]) {
				continue;
			}
			if (self.isAdjFilterOverlap(cnf, b, n, c, band)) {
				filts.push(c);
			}
		}
		return filts;
	}
	this.findNBAdjFiltersOverlap = function(cnf, b, n, band) {
		//this function finds the channel filters that overlap with adj filter n
		var filts = [];
		for (var c = 0; c < 2*self.maxChannels; ++c) {
			var band_c = c < self.maxChannels ? 0 : 1;
			var nch_c = c % self.maxChannels;
			//filters c must belong to band
			if (cnf.filterBand[0][band_c][1][nch_c] != band) {
				continue;
			}
			//filter must be enabled
			if (!cnf.filterEnabled[0][band_c][1][nch_c]) {
				continue;
			}
			if (self.isNBAdjFilterOverlap(cnf, b, n, c, band)) {
				filts.push(c);
			}
		}
		return filts;
	}	
	this.isAdjFilterOverlap = function(cnf, b, n, c, band) {
		//this function checks if adj filters n and c are overlapped
		var band_n = n < self.factory.numADJFilters ? 0 : 1;
		var nch_n = n % self.factory.numADJFilters;
		var band_c = c < self.factory.numADJFilters ? 0 : 1;
		var nch_c = c % self.factory.numADJFilters;
		var f1 = [cnf.fstartHzAdjFilter[band_n][b][nch_n],cnf.fstopHzAdjFilter[band_n][b][nch_n]];
		var f2 = [cnf.fstartHzAdjFilter[band_c][b][nch_c],cnf.fstopHzAdjFilter[band_c][b][nch_c]];
		var s = ~~Math.round(self.FILTSEPADJKHZ*1000);
		var ovlp = false;
		if (f1[0] < f2[0]) {
			ovlp = (f1[1] + s > f2[0]);
		} else if (f1[1] > f2[1]) {
			ovlp = (f2[1] + s > f1[0]);
		} else {
			ovlp = true;
		}
		return ovlp;
	}
	this.isNBAdjFilterOverlap = function(cnf, b, n, c, band) {
		//this function checks if channel filter c and adj filter n are overlapped
		var band_n = n < self.factory.numADJFilters ? 0 : 1;
		var nch_n = n % self.factory.numADJFilters;
		var band_c = c < self.maxChannels ? 0 : 1;
		var nch_c = c % self.maxChannels;
		var f1 = [cnf.fstartHzAdjFilter[band_n][b][nch_n],cnf.fstopHzAdjFilter[band_n][b][nch_n]];
		var f2 = cnf.freqHz[band_c][b][nch_c];
		var s = ~~Math.round(self.FILTSEPNBADJKHZ*1000);
		var ovlp = false;
		if ((f2 > (f1[0] - s)) && (f2 < (f1[1] + s))) ovlp = true;
		return ovlp;
	}	

	this.createOpfSettingsAntIsol = function() {
		var box = document.createElement("div"); 
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		box.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.className = "cth";
		cell.innerHTML = "ANTENNA&nbsp;ISOLATION";
		cell.colSpan = 3;
		row.appendChild(cell);		
		var row = document.createElement("tr");
		tb.appendChild(row);
		this.createIsolVerify(row);
		var row = document.createElement("tr");
		tb.appendChild(row);			
		this.createIsol(row);
		var row = document.createElement("tr");
		this.createIsolGain(row);
		tb.appendChild(row);		
		return box;
	}
	this.createAutoPaUlOff = function() {
		var box = document.createElement("div"); 
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		box.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = "AUTO&nbsp;UL&nbsp;PA&nbsp;OFF";
		cell.className = "cth";
		cell.colSpan = 6;
		row.appendChild(cell);		
		row = document.createElement("tr");
		tb.appendChild(row);			
		this.createAutoPaUlOffTime(row);
		return box;
	}

	this.createExtremeTempActionBox = function() {
		var box = document.createElement("div");
		box.id = 'extremeTempActionBox';
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
		cell.innerHTML = "EXTREME&nbsp;TEMPERATURE&nbsp;ACTION";
		cell.className = "cth";
		cell.colSpan = 6;
		row.appendChild(cell);		
		row = document.createElement("tr");
		tb.appendChild(row);			
		this.createExtremeTempAction(row);
		return box;
	}
	this.showExtremeTempActionBox = function(doShow) {
		try {
			var el = document.getElementById('extremeTempActionCell');
			el.style.display = doShow ? "table-cell":"none";
		} catch(err) {}		

	}
	this.createExtremeTempAction = function(row) {
		var cell = document.createElement('th');
		cell.innerHTML = "Action";
		cell.className = "thdrht";
		row.appendChild(cell);
		cell = document.createElement('td');
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "extremeTempAction";
		el.name = el.id;
		el.self = this;
		var opts = [ "No Action", "Reduce 6dB DL Power", "PA OFF" ];
		for (var i = 0; i < opts.length; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.selectedIndex = 0;
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.style.width = "140px";
		cell.style.verticalAlign = "middle";
		cell.appendChild(el);
		cell = document.createElement('td');
		cell.id = "extremeTempActionStatus";
		cell.className = "tabval";
		//cell.style.minWidth = "100px";
		row.appendChild(cell);
	}
	this.showExtremeTempAction = function(value) {
		if ( typeof(value) === 'undefined' || isNaN(value) ) {
			return;
		}
		value = ~~value;
		try {
			var el = document.getElementById('extremeTempAction');
			if ( value >= el.options.length ) {
				value = 0;
			}
			el.selectedIndex = value;
		} catch(err) {}
	}
	this.readExtremeTemperatureAction = function() {
		if ( !self.factory.extremeTempActionEnable ) {
			return 0;
		}
		try {
			var el = document.getElementById('extremeTempAction');
			return el.selectedIndex;
		} catch(err) { return 0; }
	}
	this.showExtremeTempStatus = function(on) {
		on = on || false;
		try {
			var el = document.getElementById('extremeTempActionStatus');
			if ( on ) {
				el.innerHTML = "EXTREME&nbsp;TEMP.";
			} else {
				el.innerHTML = "";
			}
		} catch(err) {}
	}
	this.isExtremeTempActionStatusPaOff = function() {
		var isExtrTempPaOff = false;
		if ( self.factory.extremeTempActionEnable 
			&& ( self.config.extremeTempAction == 2 )
			&& self.extremeTempActionStatusOn )
		{
			isExtrTempPaOff = true;
		} else {
			isExtrTempPaOff = false;
		}
		return isExtrTempPaOff;
	}

	this.createOpfSettingsOscDet = function() {
		var box = document.createElement("div"); 
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		box.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = "OSCILLATION&nbsp;DETECTION";
		cell.className = "cth";
		cell.colSpan = 6;
		row.appendChild(cell);		
		row = document.createElement("tr");
		tb.appendChild(row);
		this.createClearAbnSqAlarm(row);
		row = document.createElement("tr");
		tb.appendChild(row);			
		this.createAbnSqTime(row);
		row = document.createElement("tr");
		tb.appendChild(row);	
		this.createOpfMode(row);
		row = document.createElement("tr");
		row.id = "retryMode";
		tb.appendChild(row);			
		this.createRetryTime(row);
		this.createLastRetryTime(row);
		return box;
	}	
	this.showRetrySettings = function(show){
		var el = document.getElementById("retryMode");
		el.style.display = show ? "table-row" : "none";
	}
	this.showOpfSettings = function(show) {
		try {
			var el = document.getElementById("opfSettingsCell");
			el.style.display = show ? "table-cell" : "none";
		} catch(err) {}
	}
	this.createAutoPaUlOffTime = function(row) {
		var cell = document.createElement("th");
		cell.innerHTML = "Auto&nbsp;UL&nbsp;PA&nbsp;OFF&nbsp;Timer";
		cell.className = "thdrht";
		cell.style.minWidth = "200px";
		row.appendChild(cell);		
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "autoUlPaOff";
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "45px";
		var max = self.config.limitAutoPaUlOffTime.MAX;
		var min = self.config.limitAutoPaUlOffTime.MIN;
		el.title = "OFF 0min, Min. "+min+"min, Max. "+max+"min";
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var target = this;
			var num = self.getAutoPaUlOffTime(target.band);
			var max = self.config.limitAutoPaUlOffTime.MAX;
			var min = self.config.limitAutoPaUlOffTime.MIN;
			if (num < min && num != 0) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
		}		
		cell.appendChild(el);
		cell = document.createElement("td");
		cell.innerHTML = "min.";
		cell.style.fontWeight = "normal";
		row.appendChild(cell);
	}	
	this.createAbnSqTime = function(row) {
		var cell = document.createElement("th");
		cell.innerHTML = "Osc.&nbsp;Time&nbsp;Threshold";
		cell.className = "thdrht";
		row.appendChild(cell);		
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "abnSqTime";
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "50px";
		var max = self.config.limitAbnSqTime.MAX;
		var min = self.config.limitAbnSqTime.MIN;
		el.title = "OFF 0sec, Min. "+min+"sec, Max. "+max+"sec";
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var target = this;
			var num = self.getAbnSqTime(target.band);
			var max = self.config.limitAbnSqTime.MAX;
			var min = self.config.limitAbnSqTime.MIN;
			if (num < min && num != 0) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
		}		
		cell.appendChild(el);
		cell = document.createElement("td");
		cell.innerHTML = "sec.";
		cell.style.fontWeight = "normal";
		row.appendChild(cell);
	}
	this.setAbnSqTime = function(v) {
		try {
			var el = document.getElementById("abnSqTime");
			el.value = v;
		} catch(err) {}
	}
	this.getAbnSqTime = function() {
		try {
			var el = document.getElementById("abnSqTime");
			return parseInt(el.value);
		} catch(err) {}
	}
	this.setAutoPaUlOffTime = function(v) {
		try {
			var el = document.getElementById("autoUlPaOff");
			el.value = v;
		} catch(err) {}
	}
	this.getAutoPaUlOffTime = function() {
		try {
			var el = document.getElementById("autoUlPaOff");
			return parseInt(el.value);
		} catch(err) {}
	}	
	this.createRetryTime = function(row) {
		var cell = document.createElement("th");
		cell.innerHTML = "Retry&nbsp;timer&nbsp;after<br>auto&nbsp;PA&nbsp;Off";
		cell.className = "thdrht";
		row.appendChild(cell);		
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "retryTime";
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "50px";
		var max = self.config.limitRetryTime.MAX;
		var min = self.config.limitRetryTime.MIN;
		el.title = "OFF 0hours, Min. 1hour, Max. "+max+"hours";
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var target = this;
			var num = self.getRetryTime();
			var max = self.config.limitRetryTime.MAX;
			var min = self.config.limitRetryTime.MIN;
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
		cell.innerHTML = "h.";
		cell.style.fontWeight = "normal";
		row.appendChild(cell);					
	}
	this.createLastRetryTime = function(row) {
		cell = document.createElement("th");
		cell.className = "thdrht";
		cell.id = "lastRetryTitle";
		cell.innerHTML = "Next&nbsp;retry&nbsp;in";
		cell.style.visibility = "hidden";
		row.appendChild(cell);				
		cell = document.createElement("td");
		cell.id = "lastRetry";
		cell.name = cell.id;
		cell.style.minWidth = "43px";
		cell.style.visibility = "hidden";
		cell.innerHTML = "";
		row.appendChild(cell);	
	}
	this.setLastRetryTime = function(v) {
		try {
			var t = document.getElementById("lastRetryTitle");
			var el = document.getElementById("lastRetry");
			if (v == 0xFFFF) {
				t.style.visibility = "hidden";
				el.style.visibility = "hidden";
			} else {
				var h = ~~Math.floor(v / 60);
				var m = v % 60;
				if (h == 0) {
					el.innerHTML = v+"m";
				} else {
					var s = ("0"+m).substr(-2);
					el.innerHTML = h+"h:"+s+"m";
				}
				t.style.visibility = "visible";
				el.style.visibility = "visible";
			}
		} catch(err) {}
	}
	this.setRetryTime = function(v) {
		try {
			var el = document.getElementById("retryTime");
			el.value = v;
		} catch(err) {}
	}
	this.getRetryTime = function() {
		try {
			var el = document.getElementById("retryTime");
			return parseInt(el.value);
		} catch(err) {}
	}	
	this.createIsol = function(row) {
		var cell = document.createElement("th");
		cell.className = "thdrht";
		var b = [false,false];
		for (var k=0;k<2;k++)
			b[k] = self.factory.adjBandEnabled[k]||self.factory.chBandEnabled[k];
		var dual = b[0] && b[1];
		if (dual){
			cell.innerHTML = "Last&nbsp;Isolation&nbsp;Meas.("+self.factory.bandNames[0]+"/"+self.factory.bandNames[1]+")";
		}else{
			cell.innerHTML = "Last&nbsp;Isolation&nbsp;Meas.";	
		}
		cell.style.height = "20px";
		row.appendChild(cell);
		cell = createTextCell("isol",1);
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.innerHTML = "dB";
		cell.style.fontWeight = "normal";
		row.appendChild(cell);
	}	
	this.createIsolGain = function(row) {
		var cell = document.createElement("th");
		var b = [false,false];
		for (var k=0;k<2;k++)
			b[k] = self.factory.adjBandEnabled[k]||self.factory.chBandEnabled[k];
		var dual = b[0] && b[1];
		if (dual){
			cell.innerHTML = "Max.&nbsp;Allowable&nbsp;Gain("+self.factory.bandNames[0]+"/"+self.factory.bandNames[1]+")";
		}else{
			cell.innerHTML = "Max.&nbsp;Allowable&nbsp;Gain";
		}
		cell.className = "thdrht";
		cell.style.height = "20px";
		row.appendChild(cell);
		cell = createTextCell("isolGain",1);
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.innerHTML = "dB";
		cell.style.fontWeight = "normal";
		row.appendChild(cell);
	}
	this.setIsolGain = function(g) {
		try {
			var m = self.getIsolGainMargin();
			var isol = [0,0];
			var gainAllow = [0,0];
			var maxGLimits = [0,0];
			var uldlMax = [0,0];
			//Se determina el max(gainlimits) para cada banda
			for (var k=0;k<2;k++){
				for (var j=0;j<2;j++){
					if (maxGLimits[k]<self.factory.gainlimit[2*k+j]){
						maxGLimits[k] = self.factory.gainlimit[2*k+j];
						uldlMax[k] = j;
					}
				}
			}
			for (var k=0;k<2;k++){
				var gmin = maxGLimits[k]+self.config.GmainRange[uldlMax[k]];
				isol[k] = ((g[k]>=self.factory.gainlimit[2*k+uldlMax[k]])?">="+(g[k]+m[k]):g[k]+m[k])+".0";
				gainAllow[k] = (g[k]<gmin?"<"+gmin:g[k])+".0"
			}
			var b = [false,false];
			for (k=0;k<2;k++)
				b[k] = self.factory.adjBandEnabled[k]||self.factory.chBandEnabled[k];
			var dual = b[0] && b[1];

			if (dual){
				setTextCell("isol",isol[0] + " / " + isol[1]);
				setTextCell("isolGain",gainAllow[0]+ " / " + gainAllow[1]);
			}else{
				var ind = b[0]?0:1;
				setTextCell("isol",isol[ind]);
				setTextCell("isolGain",gainAllow[ind]);				
			}
		} catch(err) {}
	}
	this.getIsolGainMargin = function() {
		return self.config.gainIsolMargin;
	}
	this.createConfGain = function(row) {
		var cell = document.createElement("th");
		cell.innerHTML = "Conf.&nbsp;Gain";
		row.appendChild(cell);
		for (var b = 0; b < 2; ++b) {
			cell = document.createElement("td");
			cell.id = "confGain_"+b;
			row.appendChild(cell);
		}
	}
	this.setConfGain = function(b, band, g) {
		try {
			var el = document.getElementById("currGain_"+band+"_"+b);
			if (!isNaN(g))
				el.value = g.toString();
		} catch (err) { }
	}
	this.createIsolVerify = function(row) {
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 3;
		cell.style.textAlign = "center";
		var el = document.createElement("input");
		el.id = "isolVerif";
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.value = "Isolation Measurement";
		el.onclick = function(ev) {
			submitform(false, true, false, 0);
		}
		cell.appendChild(el);
	}
	this.createOpfRoutineStatus = function(row) {
		var cell = createLedBox("opfRoutineRunning");
		row.appendChild(cell);
	}
	this.opfRoutineRunningSet = function(alarm) {
		setTextCell("opfrunning",alarm?"BUSY":"");
	}
	this.createOpfEnable = function(row) {
		var cell = document.createElement("th");
		cell.innerHTML = "Osc.&nbsp;Prevent";
		row.appendChild(cell);
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "opfEn";
		el.name = el.id;
		el.type = "checkbox";
		el.onclick = function(ev) {
			var el = document.getElementById("opfBox");
			el.style.display = this.checked ? "table-row" : "none";
		}
		cell.appendChild(el);
	}
	this.opfEnSet = function(band, on) {
		try {
			var el = document.getElementById("opfEn"+band);
			el.checked = on ? true : false;
			el.onclick();
		} catch(err) {}
	}
	this.opfEnGet = function(band) {
		try {
			var el = document.getElementById("opfEn"+band);
			return el.checked ? true : false;
		} catch(err) {return true;}
	}
	this.createClearAbnSqAlarm = function(row) {
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 5;
		cell.style.textAlign = "center";
		var el = document.createElement("input");
		el.id = "isolClearAlarm";
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.value = "Clear Alarm";
		el.onclick = function(ev) {
			submitform(false, false, true, 0);
		}
		cell.appendChild(el);
	}
	this.createOpfMode = function(row) {
		var cell = document.createElement("th");
		cell.innerHTML = "Action&nbsp;After&nbsp;Alarm";
		cell.className = "thdrht";
		row.appendChild(cell);	
		cell = document.createElement("td");
		row.appendChild(cell);	
		cell.colSpan = 3;		
		var el = document.createElement("select");
		el.id = "opfMode";
		el.name = el.id;
		for (var i = 0; i < this.opfModes.length; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = this.opfModes[i];
			opt.value = i;
		}
		el.onchange = function(ev) {
			self.showRetrySettings(this.value<2);
		}		
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.style.width = "140px";
		el.selectedIndex = 1;
		cell.appendChild(el);
		cell = document.createElement("td");
		cell=createTextCell("opfrunning",1);
		row.appendChild(cell);			
	}
	
	this.opfModeSet = function(mode) {
		if (mode < 0 || mode >= this.opfModes.length) {
			return;
		}
		try {
			var el = document.getElementById("opfMode");
			el.selectedIndex = mode;
		} catch(err) {}
	}
	this.opfModeGet = function(band) {
		try {
			var el = document.getElementById("opfMode");
			return el.selectedIndex;
		} catch(err) { return 0;}
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
	this.createCnAlarmTimeThresholdContent = function(){
		var cellb = document.createElement("td");
		cellb.id = "cnAlarmTimeThresholdCell";
		var tab2 = document.createElement("table");
		tab2.style.borderCollapse = "separate";
		tab2.style.borderSpacing = "2px 2px";
		tab2.style.width = "100%";
		cellb.appendChild(tab2);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		var cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createCnAlarmTimeBox();
		cell.appendChild(el);	
		return cellb;
	}
	this.createCnAlarmTimeBox = function() {
		var box = document.createElement("div"); 
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		box.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = "C/N&nbsp;UL&nbsp;LOW&nbsp;ALARM&nbsp;TIMER";
		cell.className = "cth";
		cell.colSpan = 6;
		row.appendChild(cell);		
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = "C/N&nbsp;UL&nbsp;Low&nbsp;Alarm&nbsp;Time&nbsp;Threshold";
		cell.className = "thdrht";
		cell.style.minWidth = "200px";
		row.appendChild(cell);		
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "cnUlLowAlarmTimeThreshold";
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "45px";
		var max = self.config.limitCnAlarmTime.MAX;
		var min = self.config.limitCnAlarmTime.MIN;
		el.title = "OFF 0sec, Min. "+min+"sec, Max. "+max+"sec";
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var num = parseInt(this.value);
			if (isNaN(num)) num=0;
			var max = self.config.limitCnAlarmTime.MAX;
			var min = self.config.limitCnAlarmTime.MIN;
			if (num < min && num != 0) {
				this.value = min;
			} else if (num > max) {
				this.value = max;
			} else {
				this.value = num;
			}
		}		
		cell.appendChild(el);
		cell = document.createElement("td");
		cell.innerHTML = "sec.";
		cell.style.fontWeight = "normal";
		row.appendChild(cell);
		return box;
	}
	this.setCnUlLowAlarmTime = function(v) {
		try {
			var el = document.getElementById("cnUlLowAlarmTimeThreshold");
			el.value = v;
		} catch(err) {}
	}
	this.getCnUlLowAlarmTime = function() {
		try {
			var el = document.getElementById("cnUlLowAlarmTimeThreshold");
			return parseInt(el.value);
		} catch(err) {}
	}	

	this.crateCNThresholdULnb = function(band) {
		var row = document.createElement("tr");
		row.id = "filtersNbCNthresholdRow_"+band;
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Filters&nbsp;C/N&nbsp;Threshold";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "cnThrUlNb_"+band;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.band = band;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		var cnThrLimits = self.cnThresholdLimits();
		el.title = "Min: "+cnThrLimits.MIN+", Max: "+cnThrLimits.MAX+" dBm";
		el.onchange = function(ev) {
			var band = this.band;
			var cn = parseInt(this.value);
			var cnThrLimits = self.cnThresholdLimits();
			this.title = "Min: "+cnThrLimits.MIN+", Max: "+cnThrLimits.MAX+" dBm";
			if (cn < cnThrLimits.MIN) {
				cn = cnThrLimits.MIN;
				this.value = cn;
			} else if (cn > cnThrLimits.MAX) {
				cn = cnThrLimits.MAX;
				this.value = cn;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dBm";
		cell.style.textAlign = "left";
		var show = true;
		if (!self.factory.chBandEnabled[band] && self.factory.isClassB()) {
			show = self.config.squelchAdjBwMode;
		}
		row.style.display = show? "table-row":"none";
		return row;
	}
	this.showCNThresholdULnb = function(band, show) {
		try {
			document.getElementById("filtersNbCNthresholdRow_"+band).style.display = (show?"table-row":"none");
		} catch(e){}
	}
	this.createCNThresholdULadj = function(band, ch) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "cnThrUlAdj_"+band+"_"+ch;
		el.name = el.id;
		el.type = "text";
		el.style.width = "28px";
		el.band = band;
		el.ch = ch;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		var cnThrLimits = self.cnThresholdLimits();
		el.title = "Min: "+cnThrLimits.MIN+", Max: "+cnThrLimits.MAX+" dBm";
		el.onchange = function(ev) {
			var cn = parseInt(this.value);
			var cnThrLimits = self.cnThresholdLimits();
			this.title = "Min: "+cnThrLimits.MIN+", Max: "+cnThrLimits.MAX+" dBm";
			if (cn < cnThrLimits.MIN) {
				cn = cnThrLimits.MIN;
				this.value = cn;
			} else if (cn > cnThrLimits.MAX) {
				cn = cnThrLimits.MAX;
				this.value = cn;
			}
		}
		if (self.factory.isClassB() && (self.config.squelchAdjBwMode[band])){
			el.style.display="none";
		}
		cell.appendChild(el);
		return cell;
	}
	this.cnThresholdAdjShow = function(band, show) {
		try {
			var header = document.getElementById("cnHeader_"+band+"_"+1); // C/N threshold adj
			header.style.display = (show?"table-cell":"none");
			for (var ch = 0; ch < self.factory.numADJFilters; ch++) {
				var el = document.getElementById("cnThrUlAdj_"+band+"_"+ch);
				el.style.display = (show?"block":"none");
			}

		}catch(e){}
	}
	this.cnThresholdLimits = function() {
		var sqThrMax = self.config.sqThrLimits(0, self.factory.ULlowGainMode).MAX;
		var cnThrMin = self.CNminLimitdBm;
		// var cnThrMax = sqth - self.CNminToSqthrMinDifference;
		// el límite máximo de CN pasa a ser fijo como el máximo de squelch, sin depender del valor actual
		var cnThrMax = sqThrMax;
		return {MIN: cnThrMin, MAX: cnThrMax};
	}
	this.setCNThresholdLimits = function(band, na, ch){
		var cnThrLimits = self.cnThresholdLimits();
		var el;
		if (na==0) {
			el = document.getElementById("cnThrUlNb_"+band);
		} else {
			el = document.getElementById("cnThrUlAdj_"+band+"_"+ch);
		}
		try {
			el.title = "Min: "+cnThrLimits.MIN+", Max: "+cnThrLimits.MAX+" dBm";
		} catch(e){}
	}
	this.setCNThresholdUlNb = function(band, v) {
		try {
			document.getElementById("cnThrUlNb_"+band).value = v;
		} catch(e){}
	}
	this.setCNThresholdUlAdj = function(band, ch, v) {
		try {
			document.getElementById("cnThrUlAdj_"+band+"_"+ch).value = v;
		} catch(e){}
	}
	this.getCNThresholdUlNb = function(band) {
		var v = 0;
		try {
			v = parseInt(document.getElementById("cnThrUlNb_"+band).value);
		} catch(e){}
		return v;
	}
	this.getCNThresholdUlAdj = function(band, ch) {
		var v = 0;
		try {
			v = parseInt(document.getElementById("cnThrUlAdj_"+band+"_"+ch).value);
		} catch(e){}
		return v;
	}
	this.createControlChannel = function(band, nbadj, ch) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.style.margin = "2px 2px 2px 2px";
		el.id = "controlCh_"+band+"_"+nbadj+"_"+ch;
		el.name = el.id;
		el.type = "checkbox";
		el.band = band;
		el.nbadj = nbadj;
		el.ch = ch;
		el.onchange = function(ev) {
			var band = this.band;
			var nbadj = this.nbadj;
			var ch = this.ch;
			if (band==0 && nbadj==1 && ch==0 && self.config.firstADJisFirstNet){
				// no action when clicking on CCH Band14
				return;
			}
			if (this.checked) {
				// uncheck the rest of control channels
				self.unsetRestOfControlChannels(band, nbadj, ch);
			}
		}		
		cell.appendChild(el);
		return cell;
	}
	this.controlChannelFirstnetDisable = function(){
		var setDisable = self.config.firstADJisFirstNet;
		var el = document.getElementById("controlCh_0_1_0");
		try { 
			el.disabled = setDisable;
			el.style.backgroundColor = (setDisable?'#999999':'#ffffff');
		} catch(e){}
		var id = "controlCh_0_1_0";
	}
	this.unsetRestOfControlChannels = function(band, nbAdjNr, controlChNr) {
		var fband = self.bandGet(band,nbAdjNr,controlChNr);
		for (var nbadj=0; nbadj < 2; nbadj++) {
			for (var fb=0;fb<2;fb++){
				var maxch = (nbadj==0? self.maxChannels:self.config.ADJNR);
				for (var ch = 0; ch < maxch; ch++) {
					if (self.bandGet(fb,nbadj,ch) != fband) {
						continue;
					}
					if ((nbAdjNr == nbadj) && (controlChNr == ch) && (fb == band)) {
						continue;
					}
					var setChecked = false;
					if (fb==0 && nbadj==1 && ch==0 && self.config.firstADJisFirstNet){
						setChecked = true;
					}
					try {
						var id = "controlCh_"+fb+"_"+nbadj+"_"+ch;
						var el = document.getElementById(id);
						el.checked = setChecked;
					} catch(e){}
				}
			}
		}
	}
	this.computeControlChannelNr = function(band, controlCh) {
		var isNB = (controlCh > 0);
		var isADJ = (controlCh < 0);
		var isUnset = (controlCh == 0);
		var controlChNr = 'undefined';
		if ( !isUnset ) {
			var ch = 0, maxCh = 0;
			if (isNB) {
				if ( !self.factory.chBandEnabled[band] ) {
					isUnset = true;
				} else {
					maxCh = 2*self.config.CHNR;
					ch = controlCh;
				}
			} else {  // isADJ
				if ( !self.factory.adjBandEnabled[band] ) {
					isUnset = true;
				} else {
					maxCh = 2*self.config.ADJNR;
					ch = -controlCh;
				}
			}
			if ( ch > maxCh ) {
				isUnset = true;
			} else {
				controlChNr = ch - 1;
			}
		}
		return {'ISUNSET': isUnset, 'ISNB':isNB, 'CHNR':controlChNr};
	}
	this.setControlChannelNr = function(band, controlCh) {
		var controlChNr = self.computeControlChannelNr(band, controlCh);
		for (var nbadj=0; nbadj < 2; nbadj++) {
			var maxch = (nbadj==0? self.maxChannels:self.factory.numADJFilters);
			for (var fb=0;fb<2;fb++){
				var chOffset = fb*(nbadj==0?self.config.CHNR:self.config.ADJNR);
				for (var ch = 0; ch < maxch; ch++) {
					if (self.config.filterBand[nbadj][fb][1][ch] != band) { //discard channels not in this band
						continue;
					}
					var setChecked = false;
					if (!controlChNr.ISUNSET && 
						((controlChNr.ISNB && (nbadj==0)) ||
						(!controlChNr.ISNB && (nbadj==1)) ) && 
						(controlChNr.CHNR == (ch+chOffset)) )
					{
						setChecked = true;
					}
					var setDisabled = false;
					if (fb==0 && nbadj==1 && ch==0 && self.config.firstADJisFirstNet){
						setChecked = true;
						setDisabled = true;
					}
					try {
						var id = "controlCh_"+fb+"_"+nbadj+"_"+ch;
						var el = document.getElementById(id);
						el.checked = setChecked;
						el.disabled = setDisabled;
						if (setDisabled) el.style.backgroundColor = '#777777';
					} catch(e){
						alert("error")
					}
				}
			}
		}
	}
	this.getControlChannelNr = function(band) {
		var controlChNr = 0;
		var isSet = false;
		var nbadj;
		for (var fb=0;fb<2;fb++){
			for ( nbadj=0; nbadj < 2; nbadj++) {
				if ( ((nbadj==0) && !self.factory.chBandEnabled[band]) ||
					((nbadj==1) && !self.factory.adjBandEnabled[band])) {
					continue;
				}
				var maxch = (nbadj==0? self.config.CHNR:self.config.ADJNR);
				for (var ch = 0; ch < maxch; ch++) {
					if (!self.showFiltersMask[nbadj][fb][ch] || self.bandGet(fb,nbadj,ch) != band) { //discard channels not in this band and disabled filters
						continue;
					}
					if (fb==0 && nbadj==1 && ch==0 && self.config.firstADJisFirstNet){
						//firstnet siempre estará checkeado, pero puede haber otro adj de 700MHz también checkeado
						continue;
					}
					try {
						var id = "controlCh_"+fb+"_"+nbadj+"_"+ch;
						var el = document.getElementById(id);
						if (el.checked) {
							isSet = true;
							controlChNr = fb*maxch+ch+1;
							if (nbadj==1) {
								controlChNr = -controlChNr;
							}

							break;
						}
					} catch(e){}
				}
				if (isSet) {
					break;
				}
			}
		}
		return controlChNr;
	}
	this.createBSautoAdjustButton = function() {
		var el = document.createElement("input");
		el.type = "button";
		el.id = "bsAutoAdjust";
		el.name = el.id;
		el.value = "Automatic Uplink Output Power Setting";
		el.style.fontWeight = "bold";
		// window specs
		var h = 520;
		var w = 820;
		var left = (screen.width/2)-(w/2);
		var top = (screen.height/2)-(h/2)-50;
		var wspecs = "height="+h+",width="+w+',left='+left+',top='+top;
		wspecs += ",toolbar=no,menubar=no,directories=no,status=no,titlebar=no";
		wspecs += ",resizable=1,scrollbars=1";
		el.wspecs = wspecs;
		el.onclick = function(ev) {
			document.getElementById("headDivUlTools").style.display = "block";
			document.getElementById("contentDivUlTools").style.display = "block";
			document.getElementById("ulToolTitle").innerHTML = "AUTOMATIC UPLINK OUTPUT POWER SETTING";
			var el = document.getElementById("contentCellUlTools");
			remove_children(el);
			el.innerHTML = self.createBSToolContent();
			bsToolWindow = true;
			if (typeof jQuery === 'undefined') {
				// Load the JS file and wait for it to load
				var script = document.createElement('script');
				script.src = 'a/j/jquery.min.js';
				script.onload = function() {
					// Script loaded, now call bsToolonload
					if (typeof jQuery !== 'undefined') {
						bsToolonload();
						self.bsToolWindowCheckConfigApplied();
					} else {
						alert('Error loading library');
					}
				};
				script.onerror = function() {
					alert('Error loading library');
				};
				document.head.appendChild(script);
			} else {
				// jquery already exists, call bsToolonload directly
				bsToolonload();
				self.bsToolWindowCheckConfigApplied();
			}

		}
		return el;
	}
	
	this.timerAp = null;
	this.bsToolWindowCheckConfigApplied = function() {
		if (typeof(self.timerAp) !== 'undefined' && self.timerAp) {
			clearTimeout(self.timerAp);
		}
		if (!bsToolWindow) {
			return;
		}
		try {
			if (bsGui.configAppliedEvent) {
				bsGui.configAppliedEvent = false;
				var srConf = self.config.retrieveFrameStr();
				self.config.parse(srConf);
				self.showConfs();
				initFormChangeCheck();
			}
		} catch(err) {}
		self.timerAp = setTimeout(function() {
			self.bsToolWindowCheckConfigApplied();
		}, 100);
	}

	this.createWalkthroughButton = function(cell) {
		var el = document.createElement("input");
		el.type = "button";
		el.id = "walkthroughButton";
		el.name = el.id;
		el.value = "Automatic Uplink Gain and Squelch Setting";
		el.style.fontWeight = "bold";
		// window specs
		var h = 520;
		var w = 820;
		var left = (screen.width/2)-(w/2);
		var top = (screen.height/2)-(h/2)-50;
		var wspecs = "height="+h+",width="+w+',left='+left+',top='+top;
		wspecs += ",toolbar=no,menubar=no,directories=no,status=no,titlebar=no";
		wspecs += ",resizable=1,scrollbars=1";
		el.wspecs = wspecs;
		el.onclick = function(ev) {
			document.getElementById("headDivUlTools").style.display = "block";
			document.getElementById("contentDivUlTools").style.display = "block";
			document.getElementById("ulToolTitle").innerHTML = "AUTOMATIC UPLINK GAIN AND SQUELCH SETTING";
			var el = document.getElementById("contentCellUlTools");
			remove_children(el);
			el.innerHTML = self.createWthToolContent();
			walkthroughWindow = true;
			if (typeof jQuery === 'undefined') {
				// Load the JS file and wait for it to load
				var script = document.createElement('script');
				script.src = 'a/j/jquery.min.js';
				script.onload = function() {
					// Script loaded, now call walkthroughonload
					if (typeof jQuery !== 'undefined') {
						walkthroughonload();
						self.walkthroughToolWindowCheckConfigApplied();
					} else {
						alert('Error loading library');
					}
				};
				script.onerror = function() {
					alert('Error loading library');
				};
				document.head.appendChild(script);
			} else {
				// jquery already exists, call walkthroughonload directly
				walkthroughonload();
				self.walkthroughToolWindowCheckConfigApplied();
			}

		}
		return el;
	}
	this.timerWt = null;
	this.walkthroughToolWindowCheckConfigApplied = function() {
		if (typeof(self.timerWt) !== 'undefined' && self.timerWt) {
			clearTimeout(self.timerWt);
		}
		if (!walkthroughWindow) {
			return;
		}
		try {
			if (wtGui.configAppliedEvent) {
				wtGui.configAppliedEvent = false;
				var srConf = self.config.retrieveFrameStr();
				self.config.parse(srConf);
				self.showConfs();
				initFormChangeCheck();
			}
		} catch(err) {}
		self.timerWt = setTimeout(function() {
			self.walkthroughToolWindowCheckConfigApplied();
		}, 100);
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
		var cell = document.createElement("th");
		cell.innerHTML = "TYPE&nbsp;OF&nbsp;BBU&nbsp;CONNECTION";
		cell.colSpan = 2;
		cell.className = "cth";
		row.appendChild(cell);
		row = document.createElement("tr");
		tab2.appendChild(row);	
		this.createBbuTypeOfConnection(row);
		return cellb;
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
		cell.style.width = "180px";
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "bbuTypeOfConnection";
		el.name = el.id;
		el.self = this;
		var opts = [ "Dry Contacts", "Serial" ];
		for (var i = 0; i < opts.length; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.onchange = function(ev) {
			var alertMsg = "NOTICE:\nWith this action, relay assignment settings will be configured to default values.\nPlease confirm.";
			if (confirm(alertMsg)) {
				var forcePa = [[false,false],[false,false]];
				submitform(false, false, false, 0, false, forcePa, forcePa, true);
			}else{
				self.showBbuTypeOfConnection(self.config.bbu_serial_mode);
			}
		}
		el.selectedIndex = 1;
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.style.width = "180px";
		el.style.textAlign = "left";
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

	//this.opfModes = ['Automatic Shut Down', 'Run Isolation Meas.', 'Only Alarm'];
	this.opfModes = ['Automatic Shut Down', 'Run Isolation Meas.'];

	var self = this;
	this.overlappingBWs = [];
	//overlapping contains the filter types that can be overlapped with proper separation
	for (var i=0;i<FilterTypes.length;i++){
		if (FilterTypes[i].ftool){
			this.overlappingBWs.push({'index': i, 'name': FilterTypes[i].name, 'validSep': FilterTypes[i].validSep});
		}
	}
	this.FILTSEPADJKHZ = 100;
	this.FILTSEPNBADJKHZ = 200;
	this.factory = null;
	this.tags = null;
	this.version = null;
	this.sernr = new SerialNrT();
	this.config = new ConfigBDA();
	var freqStyle = parseInt(localStorage.getItem('freqStyle_'+Prjstr+window.location.host));
	if (isNaN(freqStyle) || freqStyle != 0) {
		freqStyle = 1;
	}
	this.freqStyle = freqStyle;
	this.showChannelsBitmask = 0;
	this.showFiltersMask = [[0,0],[0,0]];
	this.filterOptions = [[true,true],[true,true]];
	self.extremeTempActionStatusOn = false;
	this.id = 'rootElement';
	// this.msgElId = 'msgElement';
	this.parentId = 'page';
	this.BW_ADJ_MAX_HZ = 18000000;
	this.BW_ADJ_MIN_HZ = 100000;
	this.BW2_ADJ_MIN_HZ = (this.BW_ADJ_MIN_HZ/2);	
	this.maxChannels = this.config.CHNR;
	this.maxChannelsAdj = this.config.ADJNR;
	this.VERSION_SW_GAIN_CHANGE = {
		'MAIN': 6,
		'SUB': 31
	};
	this.MAIN_POWER_RANGE = 20;
	this.CNminToSqthrMinDifference = 5;
	this.CNminLimitdBm = -120;
	this.doFrequencyCheck = true;
	this.blocked = false;
	this.warningBox = new WarningBox();
	this.deepDischarge = new createDeepDischargeBox();
	this.createBSToolContent = function(){
		var h = '<h4><table id="bswarning" name="bswarning" style="border-collapse:collapse;margin-right:auto;margin-left:auto;"><tr>';
		h+='<td class="contentcell"><img src="/i/warning.png" width="25" height="25"></td>'
		h+='<td class="contentcell" style="font-size: 14px;color:black;vertical-align:middle;">Make sure BDA RF ports are connected and installation is complete</td>';
		h+='</tr></table></h4>';
		h+='<table width="80%" id="bs700params" name="bs700params" style="border-collapse:collapse;margin-right:auto;margin-left:auto;">';
		h+='<tr>';
		h+='<th class="cth"></th>';
		h+='<th class="cth" rowspan="2" colspan="2">Insert Base Station<br/>Power per channel</th>';
		h+='<th class="cth" rowspan="2">Insert Base Station<br/>Sensitivity</th>';
		h+='<th class="cth" style="vertical-align:middle" colspan="2">Control Channel</th>';
		h+='<th class="cth" style="vertical-align:middle" rowspan="2">RSSI</th>';
		h+='<th class="cth" style="display:none" rowspan="2">Power per Channel</th>';
		h+='<th class="cth" rowspan="2">Composite Power<br/>Setting Proposal</th>';
		h+='</tr>';
		h+='<tr>';
		h+='</tr>';
		h+='<tr>';
		h+='<th class="cth"></th>';
		h+='<th class="cth">(Watt)</th>';
		h+='<th class="cth">(dBm)</th>';
		h+='<th class="cth">(dBm)</th>';
		h+='<th class="cth">Nr.</th>';
		h+='<th class="cth">Type</th>';
		h+='<th class="cth" style="vertical-align:middle">(dBm)</th>';
		h+='<th class="cth" style="display:none"></th>';
		h+='<th class="cth">(dBm)</th>';
		h+='</tr>';
		h+='<tr id="bsRowBand_0" style="display:none;">';
		h+='<th class="thdrht">700 MHz</th>';
		h+='<td><input type="text" class="number" id="bsPowerW_0" name="bsPowerW_0" value="" size="5"onchange="bsPowerDBMchange(0,this.value);" onkeypress="return isKeyDecimalNumber(event);" ></td>';
		h+='<td><input type="text" class="number" id="bsPower_0" name="bsPower_0" value="" size="5" onchange="bsPowerWchange(0,this.value);" onkeypress="return isKeyDecimalNumber(event);"></td>';
		h+='<td><input type="text" class="number" id="bsSens_0" name="bsSens_0" value="" size="5" onkeypress="return isKeyDecimalNumber(event);"></td>';
		h+='<td><input type="text" class="number" id="cch_0" name="cch_0" value="" size="2" disabled="true" style="background-color:#cccccc;text-align:center;"></td>';
		h+='<td><input type="text" class="number" id="filtclass_0" name="filtclass_0" value="" size="12" disabled="true" style="background-color:#cccccc;text-align:center;"></td>';
		h+='<td><input type="text" class="number" id="rssi_0" name="rssi_0" value="" size="5" disabled="true" style="background-color:#cccccc;"></td>';
		h+='<td style="display:none"><input type="text" class="number" id="poutch_0" name="poutch_0" value="" size="5" disabled="true" style="background-color:#cccccc;"></td>';
		h+='<td><input type="text" class="number" id="bsProposal_0" name="bsProposal_0" value="" size="5" disabled="true" style="background-color:#cccccc;"></td>';
		h+='</tr>';
		h+='<tr id="bsRowBand_1" style="display:none;">';
		h+='<th class="thdrht">800 MHz</th>';
		h+='<td><input type="text" class="number" id="bsPowerW_1" name="bsPowerW_1" value=""size="5" onchange="bsPowerDBMchange(1,this.value);" onkeypress="return isKeyDecimalNumber(event);"></td>';
		h+='<td><input type="text" class="number" id="bsPower_1" name="bsPower_1" value="" size="5" onchange="bsPowerWchange(1,this.value);" onkeypress="return isKeyDecimalNumber(event);"></td>';
		h+='<td><input type="text" class="number" id="bsSens_1" name="bsSens_1" value="" size="5" onkeypress="return isKeyDecimalNumber(event);"></td>';
		h+='<td><input type="text" class="number" id="cch_1" name="cch_1" value="" size="2" disabled="true" style="background-color:#cccccc;text-align:center;"></td>';
		h+='<td><input type="text" class="number" id="filtclass_1" name="filtclass_1" value="" size="12" disabled="true" style="background-color:#cccccc;text-align:center;"></td>';
		h+='<td><input type="text" class="number" id="rssi_1" name="rssi_1" value="" size="5" disabled="true" style="background-color:#cccccc;"></td>';
		h+='<td style="display:none"><input type="text" class="number" id="poutch_1" name="poutch_1" value="" size="5" disabled="true" style="background-color:#cccccc;"></td>';
		h+='<td><input type="text" class="number" id="bsProposal_1" name="bsProposal_1" value="" size="5" disabled="true" style="background-color:#cccccc;"></td>';
		h+='</tr>';
		h+='<tr id="bsRowBand_2" style="display:none;">';
		h+='<th class="thdrht">Band14</th>';
		h+='<td><input type="text" class="number" id="bsPowerW_2" name="bsPowerW_2" value="" size="5" onchange="bsPowerDBMchange(2,this.value);" onkeypress="return isKeyDecimalNumber(event);"></td>';
		h+='<td><input type="text" class="number" id="bsPower_2" name="bsPower_2" value=""size="5" onchange="bsPowerWchange(2,this.value);" onkeypress="return isKeyDecimalNumber(event);"></td>';
		h+='<td><input type="text" class="number" id="bsSens_2" name="bsSens_2" value="" size="5" onkeypress="return isKeyDecimalNumber(event);"></td>';
		h+='<td><input type="text" class="number" id="cch_2" name="cch_2" value="" size="2" disabled="true" style="background-color:#cccccc;text-align:center;"></td>';
		h+='<td><input type="text" class="number" id="filtclass_2" name="filtclass_2" value="" size="12" disabled="true" style="background-color:#cccccc;text-align:center;"></td>';
		h+='<td><input type="text" class="number" id="rssi_2" name="rssi_2" value="" size="5" disabled="true" style="background-color:#cccccc;"></td>';
		h+='<td style="display:none"><input type="text" class="number" id="poutch_2" name="poutch_2" value="" size="5" disabled="true" style="background-color:#cccccc;"></td>';
		h+='<td><input type="text" class="number" id="bsProposal_2" name="bsProposal_2" value="" size="5" disabled="true" style="background-color:#cccccc;"></td>';
		h+='</tr>';
		h+='<tr>';
		h+='<td colspan="8" style="text-align:center;padding-top:10px;"><input type="button" id="bsComputeButton" name="bsComputeButton" style="width:200px;font-Weight:bold;" value="Compute Uplink Output Power"></td>';
		h+='</tr>';
		h+='<tr><td colspan="8">';
		h+='<table width="100%" id="bsComputeTable" name="bsComputeTable" style="font-size:10pt;display:none;">';
		h+='<tr><td style="padding-left:100px;text-align:left;font-size:10pt;color:black;" id="commbs2" name="commbs2">1. Obtaining Downlink RSSI levels on control channels or maximum RSSI of them <span id="progcommbs"></span></td></tr>';
		h+='<tr><td style="padding-left:100px;text-align:left;font-size:10pt;color:black;" id="commbs3" name="commbs3">2. Computing Uplink Output Power Setting</td></tr>';
		h+='<tr style="height:10px"></tr>';
		h+='<tr><td style="padding-left:100px;text-align:left;font-size:10pt;color:blue;display:none" id="poutBand14warning">Note: Band14 and 700MHz bands share the same Uplink Power Setting. The maximum of both bands is chosen.</td></tr>';
		h+='<tr><td style="padding-left:100px;text-align:left;font-size:10pt;color:red;display:none" id="poutlow0">700MHz: required Uplink Output Power Setting is higher than maximum limit.</td></tr>';
		h+='<tr><td style="padding-left:100px;text-align:left;font-size:10pt;color:red;display:none" id="poutlow1">800MHz: required Uplink Output Power Setting is higher than maximum limit.</td></tr>';
		h+='<tr><td style="padding-left:100px;text-align:left;font-size:10pt;color:red;display:none" id="poutlow2">Band14: required Uplink Output Power Setting is higher than maximum limit.</td></tr>';
		h+='</table>';
		h+='</td></tr>';
		h+='<tr>';
		h+='<td colspan="8" style="text-align:center;padding:10px;"><input type="button" id="bsApplyButton" name="bsApplyButton" style="width:200px;font-Weight:bold;display:none;" value="Apply Proposal"></td>';
		h+='</tr>';
		h+='</table>';
		return h;
	}
	this.createWthToolContent = function(){
	var h= '<h4><table id="bswarning" name="bswarning" style="border-collapse:collapse;margin-right:auto;margin-left:auto;"><tr>';
	h+='<td class="contentcell"><img src="/i/warning.png" width="25" height="25"></td>';
	h+='<td class="contentcell" style="font-size: 14px;color:black;vertical-align:middle;">Make sure BDA RF ports are connected and installation is complete</td>';
	h+='</tr></table></h4>';
	h+='<h4><table id="walkthroughwarningpaoff" name="walkthroughwarningpaoff" style="border-collapse:collapse;margin-right:auto;margin-left:auto;display:none"><tr>';
	h+='<td class="contentcell"><img src="/i/warning.png" width="25" height="25"></td>';
	h+='<td class="contentcell" id="walkthroughWarningText" style="font-size: 14px;color:black;vertical-align:middle;">';
	h+='Walkthrough cannot be performed because power amplifiers are off due to poor isolation';
	h+='</td>';
	h+='</tr></table></h4>';
	h+='<h4><table id="bswarning2" name="bswarning2" style="border-collapse:collapse;margin-right:auto;margin-left:auto;"><tr>';
	h+='<td class="contentcell"><img src="/i/bulb.png" width="25" height="25"></td>';
	h+='<td class="contentcell" style="font-size: 12px;color:black;vertical-align:middle;text-align:left;">';
	h+='1. Hit "Start" button to begin reading RSSI levels. Note that this action will reset the minimum and maximum RSSI values.<br>';
	h+='2. Make calls throughout the coverage area, to find the minimum uplink input levels.<br>';
	h+='3. When finished, hit the "Stop" button to compute Uplink Gain. Uncheck any row in which a modification is not wanted.<br>';
	h+='4. Finally, confirm proposed settings with "Apply" button.<br>';
	h+='</td>';
	h+='</tr></table></h4>';
	h+='<h4><table id="wtButtonsTable" name="wtButtonsTable" style="border-collapse:collapse;margin-right:auto;margin-left:auto;"><tr>';
	h+='<td style="text-align:center;"><input type="button" id="walkthroughStartButton" name="walkthroughStartButton" style="width:120px;font-weight:bold;" value="Start" disabled="true"></td>';
	h+='<td style="text-align:center;"><input type="button" id="walkthroughApplyButton" name="walkthroughApplyButton" style="width:120px;font-weight:bold;" value="Apply" disabled="true"></td>';
	h+='</tr></table></h4>';
	h+='<table width="80%" id="walkthroughparams" name="walkthroughparams" style="color:black;border-collapse:collapse;margin-right:auto;margin-left:auto;">';
	h+='<tr>';
	h+='<th class="cth"></th>';
	h+='<th class="cth"></th>';
	h+='<th class="cth" colspan="2">Input Level (dBm)</th>';
	h+='<th class="cth" colspan="2">Squelch Threshold (dBm)</th>';
	h+='<th class="cth" colspan="2">Gain (dB)</th>';
	h+='</tr>';
	h+='<tr>';
	h+='<th class="cth"></th>';
	h+='<th class="cth"></th>';
	h+='<th class="cth">Min.</th>';
	h+='<th class="cth">Max.</th>';
	h+='<th class="cth">Setting</th>';
	h+='<th class="cth">Proposal</th>';
	h+='<th class="cth">Setting</th>';
	h+='<th class="cth">Proposal</th>';
	h+='</tr>';
	h+='<tr id="walkthroughRowBand_0_0" style="display:none;">';
	h+='<td><input type="checkbox" id="walkthroughEnable_0_0" name="walkthroughEnable_0_0" value="" checked="true"></td>';
	h+='<th class="thdrht">700 MHz Channels</th>';
	h+='<td><input type="text" class="number" id="levelMin_0_0" name="levelMin_0_0" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="levelMax_0_0" name="levelMax_0_0" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="squelchThreshold_0_0" name="squelchThreshold_0_0" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td><input type="text" class="number" id="sqThrProposal_0_0" name="sqThrProposal_0_0" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td id="gainCurrentCell_0_0"><input type="text" class="number" id="gainCurrent_0_0" name="gainCurrent_0_0" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td id="gainPropCell_0_0"><input type="text" class="number" id="gainProposal_0_0" name="gainProposal_0_0" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='</tr>';
	h+='<tr id="walkthroughRowBand_0_1" style="display:none;">';
	h+='<td><input type="checkbox" id="walkthroughEnable_0_1" name="walkthroughEnable_0_1" value="" checked="true"></td>';
	h+='<th class="thdrht">700 MHz Adj.BW 1</th>';
	h+='<td><input type="text" class="number" id="levelMin_0_1" name="levelMin_0_1" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="levelMax_0_1" name="levelMax_0_1" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="squelchThreshold_0_1" name="squelchThreshold_0_1" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td><input type="text" class="number" id="sqThrProposal_0_1" name="sqThrProposal_0_1" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td id="gainCurrentCell_0_1"><input type="text" class="number" id="gainCurrent_0_1" name="gainCurrent_0_1" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td id="gainPropCell_0_1"><input type="text" class="number" id="gainProposal_0_1" name="gainProposal_0_1" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='</tr>';
	h+='<tr id="walkthroughRowBand_0_2" style="display:none;">';
	h+='<td><input type="checkbox" id="walkthroughEnable_0_2" name="walkthroughEnable_0_2" value="" checked="true"></td>';
	h+='<th class="thdrht">700 MHz Adj.BW 2</th>';
	h+='<td><input type="text" class="number" id="levelMin_0_2" name="levelMin_0_2" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="levelMax_0_2" name="levelMax_0_2" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="squelchThreshold_0_2" name="squelchThreshold_0_2" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td><input type="text" class="number" id="sqThrProposal_0_2" name="sqThrProposal_0_2" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td id="gainCurrentCell_0_2"><input type="text" class="number" id="gainCurrent_0_2" name="gainCurrent_0_2" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td id="gainPropCell_0_2"><input type="text" class="number" id="gainProposal_0_2" name="gainProposal_0_2" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='</tr>';
	h+='<tr id="walkthroughRowBand_0_3" style="display:none;">';
	h+='<td><input type="checkbox" id="walkthroughEnable_0_3" name="walkthroughEnable_0_3" value="" checked="true"></td>';
	h+='<th class="thdrht">700 MHz Adj.BW 3</th>';
	h+='<td><input type="text" class="number" id="levelMin_0_3" name="levelMin_0_3" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="levelMax_0_3" name="levelMax_0_3" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="squelchThreshold_0_3" name="squelchThreshold_0_3" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td><input type="text" class="number" id="sqThrProposal_0_3" name="sqThrProposal_0_3" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td id="gainCurrentCell_0_3"><input type="text" class="number" id="gainCurrent_0_3" name="gainCurrent_0_3" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td id="gainPropCell_0_3"><input type="text" class="number" id="gainProposal_0_3" name="gainProposal_0_3" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='</tr>';
	h+='<tr id="walkthroughRowBand_0_4" style="display:none;">';
	h+='<td><input type="checkbox" id="walkthroughEnable_0_4" name="walkthroughEnable_0_4" value="" checked="true"></td>';
	h+='<th class="thdrht">700 MHz Adj.BW 4</th>';
	h+='<td><input type="text" class="number" id="levelMin_0_4" name="levelMin_0_4" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="levelMax_0_4" name="levelMax_0_4" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="squelchThreshold_0_4" name="squelchThreshold_0_4" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td><input type="text" class="number" id="sqThrProposal_0_4" name="sqThrProposal_0_4" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td id="gainCurrentCell_0_4"><input type="text" class="number" id="gainCurrent_0_4" name="gainCurrent_0_4" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td id="gainPropCell_0_4"><input type="text" class="number" id="gainProposal_0_4" name="gainProposal_0_4" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='</tr>';
	h+='<tr id="walkthroughRowBand_1_0" style="display:none;">';
	h+='<td><input type="checkbox" id="walkthroughEnable_1_0" name="walkthroughEnable_1_0" value="" checked="true"></td>';
	h+='<th class="thdrht">800 MHz Channels</th>';
	h+='<td><input type="text" class="number" id="levelMin_1_0" name="levelMin_1_0" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="levelMax_1_0" name="levelMax_1_0" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="squelchThreshold_1_0" name="squelchThreshold_1_0" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td><input type="text" class="number" id="sqThrProposal_1_0" name="sqThrProposal_1_0" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td id="gainCurrentCell_1_0"><input type="text" class="number" id="gainCurrent_1_0" name="gainCurrent_1_0" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td id="gainPrpCell_1_0"><input type="text" class="number" id="gainProposal_1_0" name="gainProposal_1_0" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='</tr>';
	h+='<tr id="walkthroughRowBand_1_1" style="display:none;">';
	h+='<td><input type="checkbox" id="walkthroughEnable_1_1" name="walkthroughEnable_1_1" value="" checked="true"></td>';
	h+='<th class="thdrht">800 MHz Adj.BW 1</th>';
	h+='<td><input type="text" class="number" id="levelMin_1_1" name="levelMin_1_1" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="levelMax_1_1" name="levelMax_1_1" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="squelchThreshold_1_1" name="squelchThreshold_1_1" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td><input type="text" class="number" id="sqThrProposal_1_1" name="sqThrProposal_1_1" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td id="gainCurrentCell_1_1"><input type="text" class="number" id="gainCurrent_1_1" name="gainCurrent_1_1" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td id="gainPropCell_1_1"><input type="text" class="number" id="gainProposal_1_1" name="gainProposal_1_1" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='</tr>';
	h+='<tr id="walkthroughRowBand_1_2" style="display:none;">';
	h+='<td><input type="checkbox" id="walkthroughEnable_1_2" name="walkthroughEnable_1_2" value="" checked="true"></td>';
	h+='<th class="thdrht">800 MHz Adj.BW 2</th>';
	h+='<td><input type="text" class="number" id="levelMin_1_2" name="levelMin_1_2" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="levelMax_1_2" name="levelMax_1_2" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="squelchThreshold_1_2" name="squelchThreshold_1_2" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td><input type="text" class="number" id="sqThrProposal_1_2" name="sqThrProposal_1_2" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td id="gainCurrentCell_1_2"><input type="text" class="number" id="gainCurrent_1_2" name="gainCurrent_1_2" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td id="gainPropCell_1_2"><input type="text" class="number" id="gainProposal_1_2" name="gainProposal_1_2" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='</tr>';
	h+='<tr id="walkthroughRowBand_1_3" style="display:none;">';
	h+='<td><input type="checkbox" id="walkthroughEnable_1_3" name="walkthroughEnable_1_3" value="" checked="true"></td>';
	h+='<th class="thdrht">800 MHz Adj.BW 3</th>';
	h+='<td><input type="text" class="number" id="levelMin_1_3" name="levelMin_1_3" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="levelMax_1_3" name="levelMax_1_3" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="squelchThreshold_1_3" name="squelchThreshold_1_3" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td><input type="text" class="number" id="sqThrProposal_1_3" name="sqThrProposal_1_3" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td id="gainCurrentCell_1_3"><input type="text" class="number" id="gainCurrent_1_3" name="gainCurrent_1_3" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td id="gainPropCell_1_3"><input type="text" class="number" id="gainProposal_1_3" name="gainProposal_1_3" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='</tr>';
	h+='<tr id="walkthroughRowBand_1_4" style="display:none;">';
	h+='<td><input type="checkbox" id="walkthroughEnable_1_4" name="walkthroughEnable_1_4" value="" checked="true"></td>';
	h+='<th class="thdrht">800 MHz Adj.BW 4</th>';
	h+='<td><input type="text" class="number" id="levelMin_1_4" name="levelMin_1_4" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="levelMax_1_4" name="levelMax_1_4" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td><input type="text" class="number" id="squelchThreshold_1_4" name="squelchThreshold_1_4" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td><input type="text" class="number" id="sqThrProposal_1_4" name="sqThrProposal_1_4" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='<td id="gainCurrentCell_1_4"><input type="text" class="number" id="gainCurrent_1_4" name="gainCurrent_1_4" value="" size=5 onkeypress="return isKeyDecimalNumber(event);"></td>';
	h+='<td id="gainPropCell_1_4"><input type="text" class="number" id="gainProposal_1_4" name="gainProposal_1_4" value="" size=5 disabled="true" style="background-color:#cccccc;"></td>';
	h+='</tr>';
	h+='</table>';
	h+='<h4><table id="wtWarningTable" name="wtWarningTable" style="border-collapse:collapse;margin-right:auto;margin-left:auto;">';
	h+='<tr id="wtWarningBand_0" style="display:none">';
	h+='<td><img src="/i/warning.png" width="25" height="25"></td>';
	h+='<td style="font-size: 14px;color:black;vertical-align:middle;">Band 700 MHz. Maximum UL Gain is not enough to reach BS Sensitivity with minimum RSSI level</td>';
	h+='</tr>';
	h+='<tr id="wtWarningBand_1" style="display:none">';
	h+='<td><img src="/i/warning.png" width="25" height="25"></td>';
	h+='<td style="font-size: 14px;color:black;vertical-align:middle;">Band 800 MHz. Maximum UL Gain is not enough to reach BS Sensitivity with minimum RSSI level</td>';
	h+='</tr>';
	h+='</table></h4>';
	return h;
}

}

function WarningBox() {
	var self = this;
	this.id = 'msgElement';
	this.displayStates = ['NONE', 'MAXIMIZED', 'MINIMIZED'];
	this.displayState = this.displayStates[0];
	this.create = function() {
		var el = document.createElement("div");
		el.id = this.id;
		el.style.display = "none";
		el.style.marginTop = "10px";
		el.style.marginBottom = "10px";

		var box = document.createElement("div");
		box.className = "unitbox";
		el.appendChild(box);

		var titleBox = this.createTitleBox();
		box.appendChild(titleBox);

		var txt = document.createElement("div");
		txt.id = "msgText";
		txt.contentEditable = true;
		txt.readOnly = true;
		txt.disabled = true;
		txt.className = "msgbox";
		box.appendChild(txt);

		return el;
	}
	this.createTitleBox = function() {
		var box = document.createElement("div");
		box.className = "headbox";
		var tab = document.createElement("table");
		box.appendChild(tab);
		tab.className = "headtable";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "FILTER&nbsp;SETTINGS&nbsp;WARNINGS";
		cell.className = "band";
		cell.style.width = "100%";
		cell.style.textAlign = "center";
		var cell = document.createElement("td");
		row.appendChild(cell);		
		cell.className = "band";
		var hideButton = this.createHideButton();
		cell.appendChild(hideButton);
		var cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);			
		return box;
	}
	this.createHideButton = function() {
		var hideButton = document.createElement("input");
		hideButton.type = "button";
		hideButton.id = "hideButton";
		hideButton.className = "buttonexpand";
		hideButton.state = true;
		hideButton.style.backgroundImage = "url('/i/minimize.png')"
		hideButton.onclick = function(ev) {
			try {
				var el = document.getElementById("msgText");
				var currentState = (el.style.display != "none");
				var nextState = !currentState;
				this.state = nextState;
				this.style.backgroundImage = this.state ? "url('/i/minimize.png')" : "url('/i/maximize.png')";
				el.style.display = this.state ? "block" : "none";
			} catch(e) {}
		}
		return hideButton;
	}
	this.setWarningMessage = function(fovlp, overlappingBWs, filtAdjSepKhz, filtNbAdjSepKhz, maxch, fact, uldlLinked,standardGUI) {
		var message = "";
		var checkOv = false, checkB = false;
		for (var i=0;i<6;i++){
			if (fovlp[i]['check']) checkOv=true;
		}
		if (standardGUI){
			for (var i=6;i<8;i++){
				if (fovlp[i]['check']) checkB=true;
			}
		}
		if (checkB){
			message += '<table style="width:100%"><body><tr><td>';
			message += '<h3 style="padding-right:10px;"><br>NOTICE: YOU SELECTED A FILTER WIDER THAN 75KHZ. THIS UNIT <br>WILL OPERATE AS A CLASS B UNIT. ';
			message += 'PLEASE USE THE FOLLOWING<br> LABEL TO INDICATE THIS.</h3><br>';
			message += '</td><td style="padding-left:10px;">';
			message += '<table style="width:100%;background-color:white;border:solid black thin; padding:10px; border-radius:15px; -moz-border-radius:15px;"><body><tr><td style="font-size:9.5pt;">';
			message += '<b>Part 90 Signal Boosters. This is a 90.219 CLASS B DEVICE.<br>';
			message += 'WARNING</b>. This is <b>NOT a CONSUMER</b> device. It is designed for installation by <b>FCC LICENSEES</b><br>';
			message += 'and <b>QUALIFIED INSTALLERS</b>. You <b>MUST</b> have an <b>FCC LICENSE</b> or express consent of an FCC<br>';
			message += 'Licensee to operate this device. You <b>MUST</b> register Class B signal boosters (as defined in 47 CFR <br>';
			message += '90.219) online at <b>wwww.fcc.gov/signal-boosters/registration</b>. Unauthorized use may result in <br>';
			message += 'significant forfeiture penalties, including penalties in excess of $100,000 for each continuing violation.<br>';
			message += '</td><td><img src="/i/FccLogo.png"></img></td></tr><body></table>';
			message += '</tr><body></table>';
		}
		if (checkOv){
			var titles = ["<h3>CONFLICTING CHANNEL FILTERS:</h3>","<h3>CONFLICTING ADJ.BW FILTERS:</h3>","<h3>CONFLICT BETWEEN CHANNEL AND ADJ.BW FILTERS:</h3>"];
			for (var k=0;k<3;k++){//k=0 overlapped channel, k=1 overlapped adj.bw, k=2 overlapped between channel and adj.bw
				if (fovlp[2*k]['check'] || fovlp[2*k+1]['check']){ //consider UL and DL
					message += titles[k];
					
					for (var band = 0; band < 2; ++band) {
						var showOnlyOneSide = (k>0) && uldlLinked[band];//channel filters are shown UL/DL indepndetly because they can have different BWs and
						//overlapping can be different between UL and DL
						for (var b = 0; b < (showOnlyOneSide?1:2); ++b) { //only considers uplink side if only one side is shown
							for (var c = 0; c < (k==0?maxch:2*fact.numADJFilters); ++c) {
								//if array is empty, nothing to show
								if (fovlp[2*k+band]['ovlp'][b][c].length == 0) {
									continue;
								}
								var bname = (b ? " Downlink":" Uplink");
								if (showOnlyOneSide) bname = " Uplink/Downlink";
								var msg = fact.bandNames[band]+ bname + (k==2?" ADJ.BW":"") +" Filter " + (c+1) + " conflicts with " + (k==2?"channel ":"") + "filter(s) "; 
								for (var n = 0; n < fovlp[2*k+band]['ovlp'][b][c].length; ++n) {
									if (n > 0) {
										msg += ", ";
									}
									msg += (fovlp[2*k+band]['ovlp'][b][c][n] + 1).toString();
								}
								msg += "</br>";
								message += msg;
							}
						}
					}
					if (k==0) message += self.filterWarnText(overlappingBWs);
					if (k==1) message += self.filterAdjWarnText(filtAdjSepKhz);
					if (k==2) message += self.filterNBAdjWarnText(filtNbAdjSepKhz);
				}				
			}
		}
		if (standardGUI){
			var el = document.getElementById(self.id);
			el.style.display = "block";
			var txtel = document.getElementById("msgText");
			txtel.style.paddingLeft = "20px";
			txtel.style.paddingRight = "20px";
			txtel.style.paddingTop = "5px";
			txtel.style.paddingBottom = "10px";	
			txtel.innerHTML = message;
			//window.location.hash = '#'+self.id;
		}else{
			return message;
		}
	}
	this.filterWarnText = function(overlappingBWs) {
		var str =
		"</br><h3>RULES FOR SETTING CHANNEL FILTER FREQUENCIES</h3>"
		+ "As a general rule, the frequency difference between two filters must be "
		+ "equal or greater than 1.6 times the semi-sum of their bandwidths,</br>"
		+ "Example: Consider 2 filters with bandwidths 75 KHz and 50 KHz. "
		+ "The minimum frequency difference between these filters is 1.6·(75 + 50)/2 = 100KHz.</br>"
		+ "As an exception, several filters with smaller frequency difference "
		+ "can be combined to build a wider one, as long as they meet the following "
		+ "requirements:</br>"
		+ "1) All of them must have the same bandwidth setting.</br>";
		str += "2) The bandwidth setting must be ";
		for (var i=0;i<overlappingBWs.length;i++) str += overlappingBWs[i].name + "KHz or ";
		if (overlappingBWs.length>1) str = str.substring(0, str.length - 4);
		str += ".</br>3) All of them must have the same fine-gain setting.</br>"
		str += "4) The frequency separation must be: ";
		for (var i=0;i<overlappingBWs.length;i++) str += overlappingBWs[i].validSep + "KHz for " + overlappingBWs[i].name + "KHz, ";
		if (overlappingBWs.length>1) str = str.substring(0, str.length - 2);
		return str;
	}
	this.filterAdjWarnText = function(filtSepKhz) {
		var str =
		"</br><h3>RULES FOR SETTING ADJ.BW FILTER FREQUENCIES</h3>"
		+ "The frequency separation between two ADJ.BW filters must be must be at least "
		+ filtSepKhz +" KHz.";
		return str;
	}
	this.filterNBAdjWarnText = function(filtSepKhz) {
		var str =
		"</br><h3>RULES FOR SETTING ADJ.BW AND CHANNEL FILTER FREQUENCIES</h3>"
		+ "The frequency separation between one ADJ.BW filter and a channel filter must be must be at least "
		+ filtSepKhz +" KHz.";
		return str;
	}	
	this.containerEl = this.create();
	this.getContainerEl = function() {
		return this.containerEl;
	}
	this.hide = function() {
		try {
			document.getElementById(self.id).style.display = "none";
		} catch(e) {}
	}
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
function createTextCell(id,w) {
	var tdNode = document.createElement("td");
	tdNode.id = "txt_"+id;
	tdNode.style.minWidth = w==1?"43px":"36px"; //(pasando directamente el width no iba)
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
	var led = document.createElement("img");
	led.id = id;
	led.src = "i/bullet_grey.png";
	led.className = "centered";
	led.align = "center";
	tdNode.appendChild(led);
	return tdNode;
}

function ledSetColor(id, color) {
	try {
		var led = document.getElementById(id);
		if (color == "red") {
			led.src = "i/bullet_red.png";
		} else if (color == "green") {
			led.src = "i/bullet_green.png";
		} else if (color == "yellow") {
			led.src = "i/bulletyellow.png";
		} else if (color == "grey") {
			led.src = "i/bullet_grey.png";
		} else {
			led.src = "i/bullet_grey.png";
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
	this.mDiv.style.width = "40px";
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

var bsGui;

function bsToolonload() {
	//document.title = "";
	bsGui = new bsToolGui();
	bsGui.create();
}

function bsToolGui() {
	var self = this;
	this.config = new ConfigBDA();
	this.monitor = new Monitor();
	this.factory;
	this.maxChannels = this.config.CHNR;
	this.n = [[0,0], [0,0], [0,0]];	//700[NB,ADJ],800[NB,ADJ],Band14[NB,ADJ]
	this.bandEnabled = [false,false,false];	// 700,800,Band14
	this.cchExists = [false,false,false];	// 700,800,Band14
	this.cch = [0,0,0];	// 700,800,Band14
	this.cchNa = [0,0,0];	// 700,800,Band14
	this.naComm = [0,0,1];	// 700,800,Band14
	this.rssiComm = [-140,-140,-140];	// 700,800,Band14
	this.pmax = [0,0];	// 700,800
	this.poutproposedlow = [false,false,false];	// 700,800,Band14
	this.statCount = 0;
	this.NUMCOMMMEAS = 10;
	this.n_retry = 0;
	this.baseStation = { 
		'power': [0,0,0],
		'sensitivity': [0,0,0],
		'loss': [0,0,0],
		'powerch': [0,0,0],
		'powerProposal': [0,0,0],
		'powerMargin': 0
	};
	var tmrIdStat;
	var cnfToSend;
	this.configAppliedEvent = false;

	this.create = function() {
		waitIcon = new MovingIcon(document.getElementById("cmdResult"));
		document.getElementById("bsComputeButton").onclick=function(ev){self.bsComputeProposal(ev);};
		document.getElementById("bsApplyButton").onclick=function(ev){self.bsApplyProposal(ev);};
		this.initialize();
		for (var k=0;k<3;k++){	// 700,800,B14
			$('#bsPower_'+k).val(this.config.base_station_power[k].toFixed(1));
			$('#bsPower_'+k).change();
			$('#bsSens_'+k).val(this.config.base_station_sensitivity[k].toFixed(1));
			$('#cch_'+k).val(this.cchExists[k]?this.cch[k]+1:"-");
			$('#filtclass_'+k).val(this.cchExists[k]?(this.cchNa[k]==0?"Channel":"Adj.Bw"):"-");
			$('#bsProposal_'+k).val("");
			$('#bsRowBand_'+k).css({"display":(this.bandEnabled[k]?"table-row":"none")});
		}
	}
	this.initialize = function() {
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		this.factory = new Factory(str);
		factory=this.factory;	
		str = localStorage.getItem("Conf"+Prjstr+window.location.host);
		this.config.parse(str);
		var k,p,na,c=0;
		for (var k=0;k<3;k++){	// 700,800,B14
			p=k;
			if (k==2) p=0; //resultados de band14 se toman de band0
			this.n[k][0] = numEnabledFilts(p,0,this.config,this.factory);	// NB
			this.n[k][1] = numEnabledFilts(p,1,this.config,this.factory);	// ADJ
			if (k<2){
				this.bandEnabled[k] = (this.factory.chBandEnabled[p] && this.n[k][0]>0) || (this.factory.adjBandEnabled[p] && this.n[k][1]>0);
				//si en banda700 sólo hay un filtro y es el 'band14' se considera que sólo hay band14 y no 700
				if (k==0 && this.config.filterEnabled[1][0][1][0] && this.config.firstADJisFirstNet && 
					(this.n[k][0]==0 || !factory.chBandEnabled[p]) && this.n[k][1]==1)
				{
					this.bandEnabled[0]=false;
				}
			}else{
				this.bandEnabled[k] = this.config.filterEnabled[1][0][1][0] && this.config.firstADJisFirstNet && this.factory.adjBandEnabled[0];
			}
			var cchExists = false;
			var cch = this.config.controlChannel[p];
			//en banda700 se considera que no hay CCH si está fijado en Band14
			if (k==0 && this.config.firstADJisFirstNet && cch==-1) cch=0;
			//si firstNet está activa, se considera cch activo incluso si cch != -1
			if (k==2 && this.config.firstADJisFirstNet && this.config.filterEnabled[1][0][1][0]) cch=-1;
			//channel filters
			if (cch>0){
				na=0;
				c=cch-1;
				var band_c = Math.floor(c / this.config.CHNR);
				var nch_c = c % this.config.CHNR;
				if (band_c<2) cchExists = (this.config.filterEnabled[na][band_c][1][nch_c] && this.config.filterBand[na][band_c][1][nch_c]==p);
			}
			//ajj.filters
			if (cch<0){
				na=1;
				c=-cch-1;
				var band_c = Math.floor(c / this.config.ADJNR);
				var nch_c = c % this.config.ADJNR;
				if (band_c<2) cchExists = (this.config.filterEnabled[na][band_c][1][nch_c] && this.config.filterBand[na][band_c][1][nch_c]==p);
				c = band_c * this.factory.numADJFilters + nch_c; //re-indexing according to available adj.filters
			}

			this.cchExists[k] = cchExists;
			this.cch[k] = c;
			this.cchNa[k] = na;
		}
	}
	this.bsComputeProposal = function(ev) {
		this.initialize();
		for (var k=0;k<3;k++){	// 700,800,B14
			$('#cch_'+k).val(this.cchExists[k]?this.cch[k]+1:"-");
			$('#filtclass_'+k).val(this.cchExists[k]?(this.cchNa[k]==0?"Channel":"Adj.Bw"):"-");
			$('#bsProposal_'+k).val("");
			$('#bsRowBand_'+k).css({"display":(this.bandEnabled[k]?"table-row":"none")});
		}
		$('#commbs2').css({"color":"black"});
		$('#commbs3').css({"color":"black"});
		for (var k=0;k<3;k++){
			$('#bsPower_'+k).prop("disabled",true);
			$('#bsSens_'+k).prop("disabled",true);
			$('#bsApplyButton').css({"display":"none"});
			$('#rssi_'+k).val("");
			$('#poutch_'+k).val("");
			$('#bsProposal_'+k).val("");
			self.poutproposedlow[k] = false;
			$('#poutlow'+k).css("display","none");
			self.rssiComm = [-140,-140,-140];	// 700,800,Band14
		}
		document.getElementById("bsComputeTable").style.display="table";
		document.getElementById("commbs2").style.color="blue";
		showResultIcon(ERR_PENDING);
		self.statCount = 0;
		self.load_status();
	}
	this.load_status = function(){
		$.get( "/update.shtml?c="+Date.now(), function( data ) {
			if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
				clearTimeout(tmrIdStat);
			}
			self.statCount++;
			self.monitor.parse(data);
			$('#progcommbs').html('('+self.statCount+'/'+self.NUMCOMMMEAS+' measures)');
			self.getRSSILevels(self.monitor);
			for (var k=0;k<3;k++){
				$('#rssi_'+k).val(self.rssiComm[k].toFixed(1));
			}
			if (self.statCount<self.NUMCOMMMEAS){
				tmrIdStat = setTimeout(function() { self.load_status(); }, (isEthernetMode? 1500 : 500));
			} else {
				document.getElementById("commbs3").style.color="blue";
				self.computePowerOutUL();
				for (var k=0;k<3;k++){
					if (self.bandEnabled[k]) {
						$('#poutch_'+k).val(self.baseStation.powerch[k].toFixed(1));
						var power = ~~Math.round(self.baseStation.powerProposal[k]);
						$('#bsProposal_'+k).val(power);
					} else {
						$('#poutch_'+k).val("-");
						$('#bsProposal_'+k).val("-");
					}
					$('#bsPower_'+k).prop("disabled",false);
					$('#bsSens_'+k).prop("disabled",false);
					$('#poutlow'+k).css("display",self.poutproposedlow[k]?"block":"none"); 
				}
				showResultIcon(ERR_NONE);
				$('#bsApplyButton').css({"display":"inline"});
				var k;
				cnfToSend = new ConfigBDA();
				cnfToSend.parse(self.config.frm);
				for (k=0;k<3;k++){
					cnfToSend.base_station_power[k] = parseFloat($('#bsPower_'+k).val());
					cnfToSend.base_station_sensitivity[k] = parseFloat($('#bsSens_'+k).val());
					if (!self.bandEnabled[k]){
						continue;
					}
				}
				var strToSend = cnfToSend.getFrm();
				if (strToSend!=self.config.frm){
					$("#ctl_conf_str").val(strToSend);
					$.post( "start.zhtml", { ctl_conf_str: strToSend}).done(function( data ) {
						self.config.parse(strToSend);
						localStorage.setItem("Conf"+Prjstr+window.location.host,strToSend);
					});
				}
				if (typeof(redrawBSTable)!=="undefined") redrawBSTable(false);
			}
		});
	}
	this.getRSSILevels = function(monitor){
		var k,max,cchExists,c,na,band_cch,n_cch;
		for (k=0;k<2;k++){
			max=-140;
			cchExists = false;
			cch = self.config.controlChannel[k];
			if (k==0 && self.config.firstADJisFirstNet && cch==-1) cch=0; //se considera que no hay CCH si está fijado en Band14
			if (Math.abs(cch)<=(2*self.config.CHNR)){
				if (cch>0){
					na=0;
					c=cch-1;
					band_cch = Math.floor(c / self.config.CHNR);
					n_cch = c % self.config.CHNR;
					cchExists = self.config.filterEnabled[na][band_cch][1][n_cch];
				}
				if (cch<0){
					na=1;
					c=-cch-1;
					band_cch = Math.floor(c / this.config.ADJNR);
					n_cch = c % this.config.ADJNR;
					cchExists = this.config.filterEnabled[na][band_cch][1][n_cch];
					
				}
			}
			if (cchExists){
				max = monitor.level[na][band_cch][1][n_cch];
				self.naComm[k]=na;
			}else{
				for (na=0;na<2;na++){
					for (var fb=0;fb<2;fb++){//it is necessary to check both arrays due to flexible filters
						for (c=0;c<(na==0?self.config.CHNR:factory.numADJFilters);c++){
							var isFn = (fb==0 && c==0 && na==1 && self.config.firstADJisFirstNet)
							if (self.config.filterEnabled[na][fb][1][c] && self.config.filterBand[na][fb][1][c]==k && !isFn){
								if (monitor.level[na][fb][1][c]>max) {
									max=monitor.level[na][fb][1][c];
									self.naComm[k]=na;
								}
							}
						}
					}
				}
			}

			if (max>self.rssiComm[k]) self.rssiComm[k]=max;
		}
		if (self.config.filterEnabled[1][0][1][0] && self.config.firstADJisFirstNet){
			if (monitor.level[1][0][1][0]>self.rssiComm[2]) self.rssiComm[2]=monitor.level[1][0][1][0];
			self.naComm[2] = 1;
		}
		for (k=0;k<3;k++)
			console.log('rssiComm['+k+']='+self.rssiComm[k]);
	}
	this.computePowerOutUL = function(){
		var k,max,c,na;
		for (k=0;k<3;k++){
			p=k;
			if (k==2) p=0; //resultados de band14 se toman de band0
			if (!self.bandEnabled[k]){
				continue;
			}
			var bspower = parseFloat($('#bsPower_'+k).val());
			var sensitivity = parseFloat($('#bsSens_'+k).val());
			self.baseStation.loss[k] = bspower-self.rssiComm[k];
			self.baseStation.powerch[k] = sensitivity+self.baseStation.loss[k]+self.baseStation.powerMargin;
			var ulpout = self.baseStation.powerch[k];
			// si hay canales NB y ADJ, se repartirá la potencia a medias (3dB)
			// excepto si los canales NB son solamente para modo squelch ADJ basado en filtros NB
			if ((self.factory.chBandEnabled[p] && this.n[k][0]>0) && (self.factory.adjBandEnabled[p] && this.n[k][1]>0))
			{
				ulpout+=3;
			}
			/* reparto de potencia por número de canales en NB y ADJ: se elige el mayor de NB y ADJ
			para que al repartir, la mínima potencia por canal sea igual a baseStation.powerch[k] */
			// excepto si los canales NB son solamente para modo squelch ADJ basado en filtros NB
			var dp=0;
			// if (k<2) {   // en Band14 solamente hay el filtro ancho fijo
				// se vuelve a incluir band14 para que la potencia propuesta coincide con la
				// de 700MHz si existen ambas
				for (na=(k==2?1:0);na<2;na++){ //En caso Band14 no considerar NB
					var bandEnabled = (na==0?self.factory.chBandEnabled[p]:self.factory.adjBandEnabled[p]);
					if (self.n[k][na]>1 && bandEnabled){
						/* se quita el factor 0.1*(self.n[k][na]-1) de la reducción de potencia
						 tal como se ha hecho en el micro */
						var power=10*Math.log((self.n[k][na]))/Math.LN10;
						if (power>dp) dp=power;
					}
				}
			// }
			ulpout+=dp;
			
			//potencia limitada por settings de factory
			if (ulpout > self.factory.powerlimit[p*2]){
				self.poutproposedlow[k] = true;
				ulpout=self.factory.powerlimit[p*2];
			} else if (ulpout<(factory.powerlimit[p*2]-self.factory.MAIN_POWER_RANGE)){
				ulpout=self.factory.powerlimit[p*2]-self.factory.MAIN_POWER_RANGE;
			}
			self.baseStation.powerProposal[k] = Math.ceil(ulpout);
		}
		var ulPowerConfig = [~~Math.round(self.baseStation.powerProposal[0]),
			~~Math.round(self.baseStation.powerProposal[2])];
		if (self.bandEnabled[0] && self.bandEnabled[2] && (ulPowerConfig[0] != ulPowerConfig[2]) )
		{
			$('#poutBand14warning').css("display","block"); 
		} else {
			$('#poutBand14warning').css("display","none"); 
		}
	}
	this.bsApplyProposal = function(ev){
		showResultIcon(ERR_PENDING);
		var k,p;
		cnfToSend = new ConfigBDA();
		cnfToSend.parse(self.config.frm);
		var ulPowerConfig = [0,0];
		/* si hay firstnet y 700MHz, elegir la mayor de ambas */
		if (self.bandEnabled[0] && self.bandEnabled[2]){
			if (self.baseStation.powerProposal[0]>self.baseStation.powerProposal[2]) {
				ulPowerConfig[0] = ~~Math.round(self.baseStation.powerProposal[0]);
			} else {
				ulPowerConfig[0] = ~~Math.round(self.baseStation.powerProposal[2]);
			}
		} else if (self.bandEnabled[0]) {
			ulPowerConfig[0] = ~~Math.round(self.baseStation.powerProposal[0]);
		} else if (self.bandEnabled[2]) {
			ulPowerConfig[0] = ~~Math.round(self.baseStation.powerProposal[2]);
		}
		ulPowerConfig[1] = ~~Math.round(self.baseStation.powerProposal[1]);
		for (k=0;k<3;k++){
			p=k;
			if (k==2) p=0; //resultados de band14 se toman de band0
			cnfToSend.base_station_power[k] = parseFloat($('#bsPower_'+k).val());
			cnfToSend.base_station_sensitivity[k] = parseFloat($('#bsSens_'+k).val());
			if (!self.bandEnabled[k]){
				continue;
			}
		}
		if (self.bandEnabled[0] || self.bandEnabled[2]){
			cnfToSend.power[0][0]=ulPowerConfig[0];
		}
		if (self.bandEnabled[1]) cnfToSend.power[1][0]=ulPowerConfig[1];
		//for (var p=0;p<2;p++) cnfToSend.agcBandMode[p][0] = false; //stable coverage
		$("#ctl_conf_str").val(cnfToSend.getFrm());
		$.post( "start.zhtml", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
			self.n_retry=0;
			setTimeout(function() { self.check_result(); }, 1000);
		});
	}
	this.check_result = function(){
		$.get( "/result.shtml?c="+Date.now(), function( data ) {
			if (data!=0 && self.n_retry<10){
				self.n_retry++;
				setTimeout(function() { self.check_result(); }, 1000);
			}else{
				if (self.n_retry<10){
					showResultIcon(ERR_OK);
				if (typeof(redrawBSTable)!=="undefined") redrawBSTable(true);
				}else{
					showResultIcon(ERR_FAIL);
				}
				setTimeout(function() { self.getGlobalConfig(); }, 500);
			}
		});
	}
	this.getGlobalConfig = function(){
		$('#global_req').val("1");
		$.post( "start.zhtml", { global_req:"1"}).done(function( data ) {

			$.get( "/global_conf.shtml?c="+Date.now(), function( str ) {
				if ( typeof(str) === 'undefined' || str === null ) {
					alert("Error 3");
					showResultIcon(ERR_FAIL);
					return;
				}
				str = correctASCII(str);
				var srarr = str.split('\t');
				if (srarr.length < 7) {
					alert("Error 4");
					showResultIcon(ERR_FAIL);
					return;
				}
				var srConf = srarr[0];
				self.config.parse(srConf);
				self.config.saveFrameStr(srConf);
				setTimeout(function() { showResultIcon(ERR_NONE); }, 1000);
				self.configAppliedEvent = true;
			});
		});
	}
}

function bsPowerWchange(band,val){
	try{
		var v = parseFloat(val);
		var w = Math.pow(10, (v-30)/10);
		$('#bsPowerW_'+band).val(w.toFixed(1));
		$('#bsPower_'+band).val(v.toFixed(1));
	}catch(err){}
}

function bsPowerDBMchange(band,val){
	try{
		var v = parseFloat(val);
		if (v<=0.01) v=0.01;
		var dbm = 30+10*Math.log(v)/Math.LN10;
		$('#bsPower_'+band).val(dbm.toFixed(1));
		$('#bsPowerW_'+band).val(v.toFixed(1));
	}catch(err){}
}

var wtGui;

function walkthroughonload() {
	//document.title = "";
	wtGui = new walkthroughGui();
	wtGui.monitoring = true;
	wtGui.create();
}

function walkthroughGui() {
	var self = this;
	this.config = new ConfigBDA();
	this.monitor = new Monitor();
	this.factory;
	this.n = [[0,0], [0,0]]; //700[NB,ADJ],800[NB,ADJ] num enabled filters per band and type nb / adj
	this.n_retry = 0;
	this.isStatusUlGainRunning = false; //to know if UL Gain commissioning is running
	this.showCh = [[false,false,false,false,false],[false,false,false,false,false]]; //enabled filters: nb 700/800 is the first element of each sub-array, the other
	//4 are adj, but filterBand needs to be checked to know which adj filters belong to each band. It is used during initialization to show/hide rows, but also during runtime
	//to know which filters are enabled when computing gain proposal
	this.monitoring = false; //used mainly from assisted GUI
	this.showGainProposal = [false, false]; //gain proposal visible per band
	this.gainProposal = []; //array per band with gain proposal computed from levelUlMin
	this.gainUlNotEnough = []; //2 sub-arrays for 700/800 to indicate if gain proposal is not enough (first element nb, other 4 adj)
	this.levelUlMin =  [[128,128,128,128,128],[128,128,128,128,128]]; //levelUlMin to compute gainProposal: nb 700/800 is the first element of each sub-array, the other
	//4 are adj, but filterBand needs to be checked to know which adj filters belong to each band
	
	var tmrIdStat;
	var cnfToSend;
	this.configAppliedEvent = false;
	var WAITINGACKSETSQUELCH = 4;
	var WAITINGACKULGAINRESET = 5;
	var WAITINGACKULGAINRESULT = 6;

	this.create = function() {
		waitIcon = new MovingIcon(document.getElementById("cmdResult"));
		document.getElementById("walkthroughStartButton").onclick=function(ev){self.commUlGainStart(ev);};
		document.getElementById("walkthroughApplyButton").onclick=function(ev){self.commUlGainSquelchApply(ev);};
		self.initialize();
		cnfToSend = new ConfigBDA();
		cnfToSend.parse(self.config.frm);
		for (var band=0;band<2;band++){
			self.showCh[band][0] = self.factory.chBandEnabled[band] && (self.n[band][0] > 0);
			$('#walkthroughRowBand_'+band+'_0').css({"display":(self.showCh[band][0]?"table-row":"none")});
			//$('#walkthroughRowBand_'+band+'_0').css({"display":"table-row"});
			if (self.showCh[band][0]) {
				cnfToSend.gain[band][0] = self.factory.gainlimit[2*band];
				/** use widest channel to set initial squelch threshold for walkthrough commissioning */
				//var bwHz = self.getWidestNBfilterBw(band);
				//cnfToSend.sqChThreshold[0][band][0][0] = Math.ceil(-174+5+15+(10*Math.log(bwHz)/Math.LN10)); //CN=15dB contando NF=5dB
			}
			for (var k=0; k<self.config.ADJNR;k++){
				self.showCh[band][1+k] = self.factory.adjBandEnabled[band] && self.config.filterEnabled[1][band][1][k];
				$('#walkthroughRowBand_'+band+'_'+(1+k)).css({"display":(self.showCh[band][1+k]?"table-row":"none")});
				//$('#walkthroughRowBand_'+band+'_'+(1+k)).css({"display":"table-row"});
				if (self.showCh[band][1+k]){
					cnfToSend.gain[band][0] = self.factory.gainlimit[2*band];
					//var bw = self.config.fstopHzAdjFilter[band][0][k] - self.config.fstartHzAdjFilter[band][0][k];
					//cnfToSend.sqChThreshold[1][band][0][k] = Math.ceil(-174+5+15+(10*Math.log(bw)/Math.LN10)); //CN=15dB contando NF=5dB
				}
			}
		}
		this.commULGainConfigSet();
		this.commULSquelchThresholdConfigSet();
		if (this.monitoring) this.load_status();
		for (var band=0;band<2;band++){
			$('#gainCurrent_'+band).prop("disabled", true);
			$('#gainCurrent_'+band).css("backgroundColor", '#cccccc');
			for (var k=0;k<1+self.config.ADJNR;k++){
				$('#squelchThreshold_'+band+'_'+k).prop("disabled", true);
				$('#squelchThreshold_'+band+'_'+k).css("backgroundColor", '#cccccc');
			}
		}
		if (!self.config.automatic_ul_gain_running && self.config.compare(cnfToSend)>=0){
			showResultIcon(ERR_PENDING);
			self.disableAllButtons();
			$("#ctl_conf_str").val(cnfToSend.getFrm());
			$.post( "start.zhtml", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
				n_retry=0;
				setTimeout(function() { self.check_result(WAITINGACKSETSQUELCH); }, 1000);
			});
		}
	}
	this.getWidestNBfilterBw = function(band){
		var bw = 12.5;
		for (var c=0; c<self.config.CHNR; c++){
			if ( !self.config.filterEnabled[0][band][0][c] ){
				continue;
			}
			if (bw < self.config.bwKHz[band][0][c]){
				bw = self.config.bwKHz[band][0][c];
			}
		}
		return (bw*1e3);
	}
	this.initialize = function() {
		var str = localStorage.getItem("Factory"+Prjstr+window.location.host);
		this.factory = new Factory(str);
		factory=this.factory;
		str = localStorage.getItem("Conf"+Prjstr+window.location.host);
		this.config.parse(str);
		var k,na=0;
		for (na=0;na<2;na++){	// NB,ADJ
			for (k=0;k<2;k++){	// 700,800
				this.n[k][na] = numEnabledFilts(k,na,this.config,this.factory);
			}
		}
		self.reOrderAdjRowFilters();
	}
	this.showGainTextBoxes = function(band,c,show,realBand){ //remove undesired gain text boxes
		if (show){
			$('#gainCurrent_'+band+'_'+c).prop({"id":'gainCurrent_'+realBand});
			$('#gainProposal_'+band+'_'+c).prop({"id":'gainProposal_'+realBand});
		}else{
			$('#gainCurrent_'+band+'_'+c).remove();
			$('#gainProposal_'+band+'_'+c).remove();
		}
	}
	this.reOrderAdjRowFilters = function(){
		var rightOrder = []; //array to store the right order of the table walkthroughparams and the label to show. Also determines with row shows gain text boxes
		for (var band=0;band<2;band++){
			var firstRowShown = false;
			var txt = (band==0 ? "700":"800") + " MHz Channels";
			if (numEnabledFilts(band,0,this.config,this.factory)>0) firstRowShown = true;
			rightOrder.push({band: band,c: 0, label: txt, show: firstRowShown, realBand: band}); //added row for channel filters first
			for (var fb=0;fb<2;fb++){
				for (var c=0;c<this.config.ADJNR;c++){
					if (self.config.filterBand[1][fb][1][c]==band){
						var txt = (band==0 ? "700":"800") + " MHz Adj.BW "+ (fb*self.factory.numADJFilters + c+1);
						var show;
						if (!firstRowShown && self.config.filterEnabled[1][fb][1][c]){ //if first ADJ is found enabled, the rest are not shown
							firstRowShown = true;
							show = true;
						}else{
							show = false;
						}
						rightOrder.push({band: fb, c: 1+c, label: txt, show: show, realBand: band});
					}
				}
			}
		}
		//put the rows in the right order
		var tab = document.getElementById('walkthroughparams');
		var tbody = tab.getElementsByTagName("tbody")[0];
		for (var k=0;k<rightOrder.length;k++){
			var row = document.getElementById('walkthroughRowBand_'+rightOrder[k].band+"_"+rightOrder[k].c);
			row.cells[1].innerHTML = rightOrder[k].label;
			tbody.insertBefore(row, tbody.rows[k+3]); //2 header rows in advanced GUI, 3 in assisted GUI
			self.showGainTextBoxes(rightOrder[k].band, rightOrder[k].c, rightOrder[k].show, rightOrder[k].realBand);
		}
	}
	this.commUlGainStart = function(ev){
		cnfToSend = new ConfigBDA();
		cnfToSend.parse(self.config.frm);
		if (!self.isStatusUlGainRunning){
			$(this).val("Start");
			cnfToSend.automatic_ul_gain_reset = true;	// reset minholds al iniciar
			cnfToSend.automatic_ul_gain_running = true;
			self.clearGains(cnfToSend); // por si acaso no se ha pulsado antes "Set Squelch"
			self.isStatusUlGainRunning = true;
			self.disableAllButtons();
			self.levelUlMin = [[128,128,128,128,128],[128,128,128,128,128]];
			for (var k=0;k<2;k++){
				$("#gainProposal_"+k).val('');
			}
		} else {
			$(this).val("Stop");
			cnfToSend.automatic_ul_gain_running = false;
			self.isStatusUlGainRunning = false;
			self.disableAllButtons();
		}
		showResultIcon(ERR_PENDING);
		$("#ctl_conf_str").val(cnfToSend.getFrm());
		$.post( "start.zhtml", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
			n_retry=0;
			setTimeout(function() { self.check_result(WAITINGACKULGAINRESET); }, 1000);
		});
	}
	this.clearGains = function(conf){
		for (var band=0;band<2;band++){
			cnfToSend.gain[band][0] = self.factory.gainlimit[2*band];
			for (var nbadj=0; nbadj<2; nbadj++){
				var maxch = (nbadj==0?2*conf.CHNR:conf.ADJNR);
				for (var ch=0; ch<maxch; ch++){
					conf.fineGainFilter[nbadj][band][0][ch] = 0;
				}
			}
		}
	}
	this.check_result = function(op){
		$.get( "/result.shtml?c="+Date.now(), function( data ) {
			if (data!=0 && self.n_retry<10){
				self.n_retry++;
				setTimeout(function() { self.check_result(op); }, 1000);
			}else{
				setTimeout(function() { self.loadpage(op); }, 1000);
			}
		});
	}
	this.loadpage = function(op){
		self.getGlobalConfig(op);
	}
	this.getGlobalConfig = function(op){
		if ( typeof(op) === 'undefined') op=0;
		$('#global_req').val("1");
		$.post( "start.zhtml", { global_req:"1"}).done(function( data ) {

			$.get( "/global_conf.shtml?c="+Date.now(), function( str ) {
				if ( typeof(str) === 'undefined' || str === null ) {
					alert("Error 3");
					showResultIcon(ERR_FAIL);
					return;
				}
				str = correctASCII(str);
				var srarr = str.split('\t');
				if (srarr.length < 7) {
					alert("Error 4");
					showResultIcon(ERR_FAIL);
					return;
				}
				var srConf = srarr[0];
				var srFact = srarr[1];

				self.config.parse(srConf);
				self.factory.parse(srFact);
				
				self.config.saveFrameStr(srConf);
				self.configAppliedEvent = true;
				self.commULGainConfigSet();
				self.commULSquelchThresholdConfigSet();
				self.isStatusUlGainRunning = self.config.automatic_ul_gain_running;
				self.setButtonsEnableState(self.isStatusUlGainRunning);

				if (op==WAITINGACKULGAINRESET) {
					self.isStatusUlGainRunning = true;
					showResultIcon(ERR_OK);
					self.load_status();
					setTimeout(function() { showResultIcon(ERR_NONE); }, 1000);
				}else if (op==WAITINGACKULGAINRESULT){
					showResultIcon(ERR_OK);
					setTimeout(function() { showResultIcon(ERR_NONE); }, 1000);
				} else if (op==WAITINGACKSETSQUELCH){
					showResultIcon(ERR_OK);
					setTimeout(function() { showResultIcon(ERR_NONE); }, 1000);
				}
			});
		});
	}
	this.load_status = function(){
		if (typeof(tmrIdStat) !== "undefined" && tmrIdStat) {
			clearTimeout(tmrIdStat);
		}
		var lastDate = localStorage.getItem("StatDate"+Prjstr+window.location.host);
		Date.now = Date.now || function() { return +new Date; };
		var d = Date.now();
		if ((d-lastDate)>1500){
			console.log("direct request");
			$.get( "/update.shtml?c="+Date.now(), function( data ) {
				self.procStatus(data);
			});
		}else{
			var data = localStorage.getItem("Stat"+Prjstr+window.location.host);
			this.procStatus(data);
		}
	}
	this.procStatus = function(data){
		self.monitor.parse(data);
		self.paStatusAction(self.monitor);
		self.isStatusUlGainRunning = self.monitor.automatic_ul_gain_running;
		self.setButtonsEnableState(self.isStatusUlGainRunning);
		if (self.isStatusUlGainRunning) {
			self.showUlLevelInput(self.monitor);
			self.showGainUlResults();
			if (self.monitoring) tmrIdStat = setTimeout(function() { self.load_status(); }, 1000);
		} else {
			var check=false;
			for (var band=0;band<2;band++){
				if (self.monitor.maxAllowGain[band] < self.factory.gainlimit[2*band]){
					check = true;
				}
			}
			if (check) self.commULGainConfigSet();
		}
	}
	this.isPaOn = function(band, monitor){
		var lic = [self.factory.chBandEnabled[0]||self.factory.adjBandEnabled[0],
			self.factory.chBandEnabled[1]||self.factory.adjBandEnabled[1]];
		return (lic[band] && monitor.statePaOn[band][0] && monitor.statePaOn[band][1]);
	}
	this.isPaOffBecauseOfIsolation = function(band, monitor){
		var lic = [self.factory.chBandEnabled[0]||self.factory.adjBandEnabled[0],
			self.factory.chBandEnabled[1]||self.factory.adjBandEnabled[1]];
		var poorIsolationPaOff = [false, false];
		var gainRangeForPaOff = 30;
		for (var b=0;b<2;b++){
			if (!lic[b]) continue;
			var factoryGainLimit = 0;
			for (var i=0;i<2;i++) {
				if (factoryGainLimit<self.factory.gainlimit[2*b]){
					factoryGainLimit = self.factory.gainlimit[2*b];
				}
			}
			if (monitor.maxAllowGain[b] < (factoryGainLimit-gainRangeForPaOff)){
				poorIsolationPaOff[b] = true;
			}
		}
		if (band>1) band=0;
		return poorIsolationPaOff[band];
	}
	this.paStatusAction = function(monitor){
		// comprobar que los PA de las secciones con licencia no estén OFF por la medida de aislamiento
		var isPoorIsolationPAoff = (self.isPaOffBecauseOfIsolation(0, self.monitor) ||
			self.isPaOffBecauseOfIsolation(1, self.monitor));

		$('#walkthroughwarningpaoff').css({"display":(isPoorIsolationPAoff?"table":"none")});
		if (isPoorIsolationPAoff){
			$('#walkthroughStartButton').prop({"disabled":true});
			$('#walkthroughwarningpaoff').css("display","table");
			$('#walkthroughparams').css("display","none");
			if ($('#bswarning')) $('#bswarning').css("display","none");
			$('#bswarning2').css("display","none");
			$('#wtButtonsTable').css("display","none");
		} else {
			$('#walkthroughStartButton').prop({"disabled":false});
			$('#walkthroughwarningpaoff').css("display","none");
			$('#walkthroughparams').css("display","table");
			if ($('#bswarning')) $('#bswarning').css("display","table");
			$('#bswarning2').css("display","table");
			$('#wtButtonsTable').css("display","table");
		}
	}
	this.setButtonsEnableState = function(isStatusUlGainRunning){
		$('#walkthroughStartButton').val(isStatusUlGainRunning?"Stop":"Start");
		$('#walkthroughStartButton').prop("disabled", false);
		$('#walkthroughApplyButton').prop("disabled", isStatusUlGainRunning?true:false);
	}
	this.disableAllButtons = function(){
		$('#walkthroughStartButton').prop("disabled",true);
		$('#walkthroughApplyButton').prop("disabled",true);
	}
	this.showUlLevelInput = function(monitor){
		for (var band=0;band<2;band++){
			for(var k=0;k<1+self.config.ADJNR;k++){
				var v = monitor.level_in_ul_minmax[band][k][0];
				$('#levelMin_'+band+'_'+k).val(v>-128?v:'---');
				v = monitor.level_in_ul_minmax[band][k][1];
				$('#levelMax_'+band+'_'+k).val(v>-128?v:'---');
			}
		}1
	}
	this.commULGainConfigSet = function(){
		/* set values */
		for (var band=0;band<2;band++){
			var gain = self.config.gain[band][0].toFixed(0);
			$('#gainCurrent_'+band).val(gain);
		}
	}
	this.commULSquelchThresholdConfigSet = function(){
		/* set values */
		for (var band=0;band<2;band++){
			$('#squelchThreshold_'+band+'_0').val(self.config.sqChThreshold[0][band][0][0]);
			for(var k=0;k<self.config.ADJNR;k++){
				$('#squelchThreshold_'+band+'_'+(1+k)).val(self.config.sqChThreshold[1][band][0][k]);
			}
		}
		/*set limits */ 
		for (var band=0;band<2;band++){
			for(var k=0;k<1+self.config.ADJNR;k++){
				var min = self.config.sqThrLimits(0, self.factory.ULlowGainMode).MIN;
				var max = self.config.sqThrLimits(0, self.factory.ULlowGainMode).MAX;
				var title = "Min: "+min+", Max: "+max+" dBm";
				$('#squelchThreshold_'+band+'_'+k).prop("title",("Min: "+min+", Max: "+max+" dBm"));
				$('#squelchThreshold_'+band+'_'+k).prop("min",min);
				$('#squelchThreshold_'+band+'_'+k).prop("max",max);
				$('#squelchThreshold_'+band+'_'+k).change(function(){
					var min = $(this).prop("min");
					var max = $(this).prop("max");
					var v = parseInt($(this).val());
					if (v < min) v=min;
					if (v > max) v=max;
					$(this).val(v);
				});
			}
		}
	}
	this.showGainUlResults = function(){
	 	var na;
		var gain = [[0,0,0,0,0],[0,0,0,0,0]];
		var pmax=[[0,0],[0,0]];
		var levelminband = [[-128,-128,-128,-128,-128],[-128,-128,-128,-128,-128]];
		var gainUlProposal = [0,0];
		var isCallsMade = [[false,false,false,false,false],[false,false,false,false,false]];
		var gainmargin = 0; // margen en dB para no reducir cobertura
		var mingain = [0,0];
		var maxAllowComm = [];
		var isMakeProposal = [[false,false,false,false,false],[false,false,false,false,false]];
		var squelchProposal = [[-128,-128,-128,-128,-128],[-128,-128,-128,-128,-128]];
		self.gainUlNotEnough = [];
		//init to all false gainUlNotEnough
		for (var band=0;band<2;band++){
			self.gainUlNotEnough.push([]);
			for (var k=0; k<(1+self.config.ADJNR);k++){
				self.gainUlNotEnough[band].push(false);
			}
		}//precompute pmax, mingain, gainUlProposal, enabled and maxAllowComm for all bands and filter types nb/adj
		for (var band=0;band<2;band++){ //for each band
			mingain[band] = self.factory.gainlimit[2*band]+self.config.GmainRange[band];
			gainUlProposal[band] = mingain[band];
			maxAllowComm[band]=self.monitor.maxAllowGain[band];
			for (na=0;na<2;na++){ 
				pmax[band][na] = self.config.power[band][0]; //UL
				if (self.factory.chBandEnabled[band] && self.n[band][0]>0 && self.factory.adjBandEnabled[band] && self.n[band][1]>0) pmax[band][na]-=3;
				if (self.n[band][na]>1){ //more than one filter enabled of this type, apply 10*log(N) reduction
					pmax[band][na]-=(10*Math.log((self.n[band][na]))/Math.LN10); //max power per band and filter type according to number of enabled filters on each band
				}
			}
		}
		for (var band=0;band<2;band++){ //for each band
			for (var k=0; k<(1+self.config.ADJNR);k++){
				// minimum input level received during walkthrough
				levelminband[band][k]= self.monitor.level_in_ul_minmax[band][k][0];

				isCallsMade[band][k]=(levelminband[band][k]!=-128);
				if (isCallsMade[band][k] && (self.levelUlMin[band][k]>levelminband[band][k])){
					self.levelUlMin[band][k] = levelminband[band][k];
				}
				var realBand = band;
				if (k>0) realBand = self.config.filterBand[1][band][1][k-1];
				gain[band][k] = Math.round(pmax[realBand][k==0?0:1]-levelminband[band][k]+gainmargin); //comsider pmax according to real band of each filter (adj)
				if (gain[band][k]>self.factory.gainlimit[2*realBand]){
					gain[band][k]=self.factory.gainlimit[2*realBand];
					if (isCallsMade[band][k]) self.gainUlNotEnough[band][k] = true;
				}
				if (gain[band][k]>maxAllowComm[realBand]){
					gain[band][k]=maxAllowComm[realBand];
					if (isCallsMade[band][k]) self.gainUlNotEnough[band][k] = true;
				}
				if (gain[band][k]<mingain[realBand]) gain[band][k] = mingain[realBand];
			}
		}
		for (var band=0;band<2;band++){ //for each band
			for (var k=0; k<(1+self.config.ADJNR);k++){
				var realBand = band;
				if (k>0) realBand = self.config.filterBand[1][band][1][k-1];
				//obtain maximum of enabled filters per band considering user selection of checkboxes
				isMakeProposal[band][k] = $("#walkthroughEnable_"+band+"_"+k).prop("checked");
				if (isMakeProposal[band][k] && self.showCh[band][k] && isCallsMade[band][k]) {
					if (gainUlProposal[realBand] < gain[band][k]){
						gainUlProposal[realBand] = gain[band][k];
					}
					self.gainProposal[realBand] = gainUlProposal[realBand];
				}
				//squelch initializaed with current config
				if (k==0){
					squelchProposal[band][k] = self.config.sqChThreshold[0][band][0][0];
				} else {
					squelchProposal[band][k] = self.config.sqChThreshold[1][band][0][k-1];
				}
				//modify only if making proposal
				if (isMakeProposal[band][k] && self.showCh[band][k] && isCallsMade[band][k]) {
					//suggested SQ threshold is min level detected -10dB
					var v = levelminband[band][k]-10;
					var min = $('#squelchThreshold_'+band+'_'+k).prop("min");
					var max = $('#squelchThreshold_'+band+'_'+k).prop("max");
					if (v < min) v=min;
					if (v > max) v=max;
					$("#sqThrProposal_"+band+"_"+k).val(v);
				}else{
					$("#sqThrProposal_"+band+"_"+k).val('---');
				}
			}
		}
		self.showGainProposal = [false,false];
		for (var band=0;band<2;band++){ //for each band
			for (var k=0; k<(1+self.config.ADJNR);k++){
				var realBand = band;
				if (k>0) realBand = self.config.filterBand[1][band][1][k-1];
				if (isMakeProposal[band][k] && self.showCh[band][k] && isCallsMade[band][k]) self.showGainProposal[realBand] = true;
			}
		}
		// set values in text boxes
		for (var band=0;band<2;band++){ //for each band
			$("#gainProposal_"+band).val(self.showGainProposal[band]?gainUlProposal[band].toFixed(0):'---');
		}
		self.showGainBsWarning();
	}
	this.commUlGainSquelchApply = function(ev){
		var levelminband = [[-128,-128,-128,-128,-128],[-128,-128,-128,-128,-128]];
		var isMakeProposal = [[false,false,false,false,false],[false,false,false,false,false]];
		var isCallsMade = [[false,false,false,false,false],[false,false,false,false,false]];
		var applyGain = [false,false];
		var sendNewConf = false;
		var g = [0,0];
		var cnfToSend = new ConfigBDA();
		cnfToSend.parse(self.config.frm);

		var result = JSON.parse(localStorage.getItem("commResult"));
		for (var band=0;band<2;band++){ //for each band
			for (var k=0; k<(1+self.config.ADJNR);k++){
				levelminband[band][k]=self.monitor.level_in_ul_minmax[band][k][0];
				isCallsMade[band][k]=(levelminband[band][k]!=-128);
				isMakeProposal[band][k] = $("#walkthroughEnable_"+band+"_"+k).prop("checked");
				var realBand = band;
				if (k>0) realBand = self.config.filterBand[1][band][1][k-1];
				if (isMakeProposal[band][k] && self.showCh[band][k] && isCallsMade[band][k]) {
					var v = ~~Math.round(parseFloat($("#sqThrProposal_"+band+"_"+k).val()));
					if (k==0){
						cnfToSend.sqChThreshold[0][band][0][0] = v;
					} else {
						cnfToSend.sqChThreshold[1][band][0][k-1] = v;
					}
					applyGain[realBand] = true;
					g[realBand] = ~~Math.round(parseFloat($("#gainProposal_"+realBand).val()));
					sendNewConf = true;
				}
			}
		}
		for (var band=0;band<2;band++){
			if (applyGain[band]) cnfToSend.gain[band][0] = g[band];
		}
		if (sendNewConf){
			showResultIcon(ERR_PENDING);
			localStorage.setItem("commResult",JSON.stringify(result));
			$("#ctl_conf_str").val(cnfToSend.getFrm());
			$.post( "start.zhtml", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
				n_retry=0;
				setTimeout(function() { self.check_result(WAITINGACKULGAINRESULT); }, 1000);
			});
		}
	}
	this.showGainBsWarning = function(){
		var showWarningBsGain = [false,false];
		for (var band=0;band<2;band++){
			if (self.showGainProposal[band]) {
				//narrow band
				if(self.factory.chBandEnabled[band] && numEnabledFilts(band,0,self.config,self.factory)>0){
					if (self.gainUlNotEnough[band][0]){
						showWarningBsGain[band] = true;
					}
				}
				//adj band
				for (var fb=0;fb<2;fb++){//it is necessary to consider both arrays
					for (var k=0; k<self.config.ADJNR;k++){
						if (self.factory.adjBandEnabled[band] && self.config.filterEnabled[1][fb][1][k] && self.config.filterBand[1][fb][1][k]==band){
							if (self.gainUlNotEnough[fb][k+1]){
								showWarningBsGain[band] = true;
							}
						}
					}
				}
			}
		}
		for (var band=0;band<2;band++){
			$("#wtWarningBand_"+band).css("display",showWarningBsGain[band]?"table-row":"none");
			if (typeof(redrawWTTable)!=="undefined") redrawWTTable();
		}
	}
}
function refreshEnables(){
	for (var b=0;b<2;b++){
		for (var band=0;band<2;band++){
			try{
				var el = document.getElementById("currGain_"+band+"_"+b);
				if (el){
					el.disabled = true;
					el.style.backgroundColor = "#CCCCCC";
				}
			} catch (err) {}
		}
	}
}