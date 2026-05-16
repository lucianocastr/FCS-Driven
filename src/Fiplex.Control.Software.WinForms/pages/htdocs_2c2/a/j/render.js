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
		var currentPageType = self.pageType;
		self.pageType = this.pageTypes['NB'];	
		self.maxChannels = self.config.CHNR;
		if (fact.singleBandEnabled[0] || fact.singleBandEnabled[1]) self.maxChannels *= 2;
		self.maxChannelsADJ = self.config.ADJNR;
		if (typeof(serNr) !== 'undefined') {
			self.sernr = serNr;
		}
		self.draw(currentPageType != self.pageType);
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
		var redraw = self.computeShowFiltersBitmask(0,0) || pageTypeChange;
		redraw = self.computeShowFiltersBitmask(0,1) || redraw;
		redraw = self.computeShowFiltersBitmask(1,0) || redraw;
		redraw = self.computeShowFiltersBitmask(1,1) || redraw;
		redraw = self.checkFilteringOptions() || redraw;
		var msgEl = self.warningBox.getContainerEl();
		var rootEl = document.getElementById(self.id);
		if (!rootEl) {
			rootEl = document.createElement("div");
			rootEl.id = self.id;
			redraw = true;
		} else if (redraw) {
			remove_element(rootEl);
			rootEl = document.createElement("div");
			rootEl.id = self.id;
			var msgBox = document.getElementById(msgEl.id);
			if (msgBox) {
				document.getElementById(self.parentId).removeChild(msgBox);
			}
		}
		if (redraw) {
			document.getElementById(self.parentId).appendChild(rootEl);
			rootEl.appendChild(self.deepDischarge.getBox());
			var unit = self.createUnit();
			rootEl.appendChild(unit);
			
		}
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
	this.checkFilteringOptions = function(){
		var redraw = false;
		for (var band=0;band<2;band++){
			if (self.filterOptions[0][band]!=self.factory.chBandEnabled[band]){
				self.filterOptions[0][band] = self.factory.chBandEnabled[band];
				redraw = true;
			}
			if (self.filterOptions[1][band]!=self.factory.adjBandEnabled[band]){
				self.filterOptions[1][band] = self.factory.adjBandEnabled[band];
				redraw = true;
			}			
		}
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
	this.computeShowFiltersBitmask = function(adj, band) {
		var redraw = false;
		if (typeof(self.showFiltersMask[adj][band]) === 'undefined' 
			|| self.showFiltersMask[adj][band] === null
			|| !this.areEqual(self.showFiltersMask[adj][band],self.config.filterEnabled[adj][band][0]))
		{
		    	redraw = true;
		}
		self.showFiltersMask[adj][band] = this.copy(self.config.filterEnabled[adj][band][0]);
		return redraw;
	}
	this.createUnit = function() {
		var unitDiv = document.createElement("div");
		unitDiv.id = "unitDiv";
		unitDiv.className = "unitbox";
		var headDiv = this.createUnitHead();
		unitDiv.appendChild(headDiv);
		//ALARM INTERFACE
		var headDiv = this.createBandHead("ALARM INTERFACE");
		headDiv.id = "headDivAlarm";
		unitDiv.appendChild(headDiv);		
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDivAlarm";
		var tab = this.createAlarmInterface();
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
		var bt = this.createCloseButton();
		cell.appendChild(bt);
		var cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);			
		return box;
	}
	this.createCloseButton = function() {
		var bt = document.createElement("input");
		bt.type = "button";
		bt.id = "closeButton";
		bt.className = "buttonexpand";
		bt.state = true;
		bt.style.backgroundImage = "url('/i/close.png')"
		bt.onclick = function(ev) {
			try {
				bsToolWindow = false;
				walkthroughWindow = false;
				document.getElementById("headDivUlTools").style.display = "none";
				document.getElementById("contentDivUlTools").style.display = "none";
			} catch(e) {}
		}
		return bt;
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
	this.createAlarmInterface = function(){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb); 
		var isBbuMvo2Mode = uCSupportsBbuMvo2Mode(self.version);
		var rspan = 4;
		if (isBbuMvo2Mode) rspan--;
		if (!self.factory.extremeTempActionEnable) rspan--;
		if (!self.factory.oscFeatureEnable) rspan--;
		var cellOpf = this.createOPFContent(); cellOpf.className="contentcell";
		var cellAutoPaUL = this.createAutoPaUlOffContent(); cellAutoPaUL.className="contentcell";
		var cellTemp = this.createExtremeTempActionContent(); cellTemp.className="contentcell";
		var cellCnTimer = this.createCnAlarmTimeThresholdContent(); cellCnTimer.className="contentcell";
		var cellAutoAdjustUL = this.createAutoAdjustUL(); cellAutoAdjustUL.className="contentcell";
		var cellBbuTypeOfConnection = this.createBbuTypeOfConnectionContent(); cellBbuTypeOfConnection.className="contentcell";
		cellBbuTypeOfConnection.colSpan = 2;
		if (!isBbuMvo2Mode) {
			cellBbuTypeOfConnection.style.display = "none";
		}
		
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
		cell.rowSpan = (isBbuMvo2Mode?rspan:rspan-1);

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

		return tab;
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
		var row = document.createElement("tr");
		tab.appendChild(row);
		var cell = document.createElement("td");
		cell.className = "contentcell";
		cell.colSpan = 2;
		row.appendChild(cell);
		//cell.rowSpan = 3;
		var el = this.createGralCtlBox(band);
		cell.appendChild(el);
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
		for (var b = 0; b < 3; ++b) {
			var cell = document.createElement("td");
			row.appendChild(cell);
			cell.style.color = "black";
			cell.style.fontWeight = "bold";
			cell.style.textAlign = "center";
			cell.id = "titleTableFilt"+band+"_"+nbadj+"_"+(b-1);cell.name = cell.id;
			var str;
			if (b==0){
				str = "";
			} else {
				if (nbadj==1) {
					str = (b==1? Texts['FILTUL'] : Texts['FILTDL']) + "&nbsp;(ADJ.BW&nbsp;FILTERS)";
				} else {
					if (this.factory.chBandEnabled[band]){
						str = (b==1? Texts['FILTUL'] : Texts['FILTDL']) + "&nbsp;(NARROW&nbsp;BAND&nbsp;FILTERS)";
					} else {
						str = "CHANNEL SELECTION FOR "+(b==1? "UPLINK":"DOWNLINK")+" SQUELCH";
					}
				}
			}
			cell.innerHTML = str;
			cell.className = "cth";
		}
		row = document.createElement("tr");
		tb.appendChild(row);
		for (var i = 0; i < 3; ++i) {
			var cell = document.createElement("td");
			row.appendChild(cell);
			cell.appendChild(this.createFilterTable(i,band,nbadj));
			if (i==1 || i==2) cell.style.width="50%";
		}
		return mainTbl;
	}
	this.createGralCtlBox = function(band) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		tab.style.width = "100%";
		tab.style.paddingLeft = "0px";
		box.appendChild(tab);
		tab.style.borderSpacing = "3px";
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row, cell;
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.appendChild(this.createFreqSplit(band));
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.appendChild(this.squelchAdjBwModeCreate(band));
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "15px";
		cell.appendChild(this.createMuteMode(band));
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "35px";
		cell.appendChild(this.createUnitReset(band));
		cell.style.paddingRight = "20px";
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "15px";
		cell.appendChild(this.createSimplex(band));
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "15px";
		cell.appendChild(this.createTempBoard(band));
		
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		cell.style.paddingLeft = "20px";
		var showSimplex = self.factory.Simplex[band];
		var sz = self.getGralConfCellSize(showSimplex);
		cell.style.width = sz;


		var celladj, cellch;
		row = document.createElement("tr");
		body.appendChild(row);
		if (self.factory.adjBandEnabled[band]){
			celladj = document.createElement("td");	
			row.appendChild(celladj);
			celladj.appendChild(this.createShowFiltAdjTable(band));			
			celladj.colSpan = (self.factory.isClassB(band)?5:4);
			celladj.style.paddingRight = "10px";			
		}
		if (self.factory.chBandEnabled[band] || self.factory.isClassB(band)){
			cellch = document.createElement("td");	
			row.appendChild(cellch);
			cellch.appendChild(this.createShowFiltTable(band));			
			cellch.colSpan = (self.factory.isClassB(band)?5:4);
			cellch.style.paddingRight = "10px";
		}
		if (self.factory.adjBandEnabled[band] && 
			(self.factory.chBandEnabled[band] || self.factory.isClassB(band)))
		{
			celladj.colSpan = 1;
			cellch.colSpan = 4;
		}
				
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "15px";

		if (self.factory.adjBandEnabled[band]) {
			row = document.createElement("tr");
			body.appendChild(row);			
			var cell = document.createElement("td");
			cell.appendChild(this.createFreqStyleSw(band));
			cell.colSpan = 5;
			cell.align = "center";
			row.appendChild(cell);
		}
		return box;
	}
	this.getGralConfCellSize = function(showSimplex) {
		var sz;
		if (showSimplex) {
			sz =  "30%";
		} else {
			sz =  "40%";
		}
		return sz;
	}
	this.createShowFiltAdjTable = function(band) {
		var tab = document.createElement("table");
		tab.style.marginLeft = tab.style.marginRight = "auto";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var head = document.createElement("th");
		row.appendChild(head);
		var str = "On/Off&nbsp;Adj.Bw&nbsp;";
		head.className = "thdrht";
		str += "&nbsp;(1-"+self.factory.numADJFilters+")";
		if (self.factory.numADJFilters==1) str = "On/Off&nbsp;Adj.Bw&nbsp;Filter"
		head.innerHTML = str;
		for (var c = 0; c < self.factory.numADJFilters; ++c) {
			var cell = document.createElement("td");
			cell.appendChild(this.createFilterShow(c,band,1));
			row.appendChild(cell);
		}
		if (band==0){
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
	this.createShowFiltTable = function(band) {
		var tab = document.createElement("table");
		tab.id = "showFiltTable_"+band;
		tab.style.marginLeft = tab.style.marginRight = "auto";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var isSingle = self.factory.singleBandEnabled[band];
		var n = 0;
		var nrows = isSingle?4:2;
		var nch = self.config.CHNR / 2;
		var ncols = 0;
		for (var r = 0, c = 0; r < nrows; ++r) {
			var row = document.createElement("tr");
			tb.appendChild(row);
			var head = document.createElement("th");
			row.appendChild(head);
			var str = "On/Off&nbsp;filters&nbsp;(";
			str += (1+r*nch) + "-" + ((r+1)*nch) +")";
			head.innerHTML = str;
			head.className = "thdrht";
			for (var n = 0; n < nch; ++n, ++c) {
				var cell = document.createElement("td");
				cell.appendChild(this.createFilterShow(c,band,0));
				row.appendChild(cell);
			}
			ncols = row.cells.length;
		}
		var show = true;
		if (!self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
			show = self.config.squelchAdjBwMode[band];
		}
		tab.style.display = show?"table":"none";
		return tab;
	}
	this.showFiltTable = function(band, show) {
		try {
			document.getElementById("showFiltTable_"+band).style.display = (show?"table":"none");
		} catch(e){}
	}
	this.showFirstNet = function(on){
		for (var b=0;b<2;b++){
			document.getElementById("cellAdjF_0_"+b+"_0_0").colSpan = on?2:1;
			document.getElementById("cellAdjF_0_"+b+"_1_0").style.display = on?"none":"table-cell";	
			document.getElementById("chAdjF_0_"+b+"_0_0").style.display = on?"none":"block";
			document.getElementById("firstnet_"+b).style.display = on?"block":"none";
		}
	}
	this.createFirstNetCtl = function() {
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = el.name = "firstNet";
		el.onclick = function(ev) {
			if (this.checked) {
				document.getElementById("chAdjF_0_0_0_0").value = !self.freqStyle[0]?"788.000":"793.000";
				document.getElementById("chAdjF_0_0_1_0").value = !self.freqStyle[0]?"798.000":"10.000";
				document.getElementById("chAdjF_0_1_0_0").value = !self.freqStyle[0]?"758.000":"763.000";
				document.getElementById("chAdjF_0_1_1_0").value = !self.freqStyle[0]?"768.000":"10.000";
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
		el.onclick = function(ev) {
			self.setFilterShow(this.nr, this.band, this.nbadj, this.checked);
			self.displayFilters(band);
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
		cell.appendChild(tab);
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		row = document.createElement("tr");
		tb.appendChild(row);
		this.createFilterTableHeader(row, b, band, nbadj);
		var max = nbadj==0? this.maxChannels : self.factory.numADJFilters;
		for (var r = 0; r < max; r++) {
			row = document.createElement("tr");
			row.style.height = "22px";
			row.id = "filterRow_"+r+"_"+b+"_"+band+"_"+nbadj;
			var do_show = this.showFiltersMask[nbadj][band][r];
			if (!do_show) {
				row.style.display ="none";
			}
			tb.appendChild(row);
			if (b == 0) {
				this.createFilterEnable(row, r, band, nbadj);
			} else {
				this.createFilterChannel(row, b-1, r, band, nbadj);
			}
		}
		return chFiltTable;
	}
	this.setFilterShow = function(r, band, nbadj, do_show) {

		self.showFiltersMask[nbadj][band][r] = do_show;

		try {
			for (var b = 0; b < 3; ++b) {
				var row = document.getElementById("filterRow_"+r+"_"+b+"_"+band+"_"+nbadj);
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
			return;
		}
		if (b == 2) {
			var td = document.createElement("td");
			chFiltRow.appendChild(td);
			td.innerHTML = "CCH";
		}
		var td = document.createElement("td");
		td.id = "HeaderF1_"+b+"_"+band+"_"+nbadj;
		chFiltRow.appendChild(td);
		if (nbadj==1 && self.freqStyle[band] == 0) {
			td.innerHTML = "Fstart&nbsp;(MHz)";
		} else {
			td.innerHTML = "Fr.&nbsp;(MHz)";
		}
		td = document.createElement("td");
		td.id = "HeaderF2_"+b+"_"+band+"_"+nbadj;
		chFiltRow.appendChild(td);
		if (nbadj==1) {
			if (self.freqStyle[band] == 0) {
				td.innerHTML = "Fstop&nbsp;(MHz)";
			} else {
				td.innerHTML = "BW&nbsp;(MHz)";
			}
		} else {
			td.innerHTML = "BW&nbsp;(KHz)";
		}

		var show = true;
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
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
		td.id = "agcHeaderTxt_"+(b-1)+"_"+band+"_"+nbadj; // se oculta en modo agc max power
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "SQ(dBm)";
		td.style.whiteSpace = "nowrap";
		if (!(nbadj==1 || b==2)) td.style.display = "none";
		td.colSpan = 2;
		if (b > 0) {
			var dn = b-1;
			td.id = "chSqTitle_"+band+"_"+nbadj+"_"+dn;
			if (!self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
				if (self.config.squelchAdjBwMode[band]){
					if (nbadj==1){
						td.innerHTML = "SQ Enable";
					}
					td.colSpan = 1;
				}
			}
		}
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "C/N th(dBm)";
		td.style.whiteSpace = "nowrap";
		td.id = "cnHeader_"+band+"_"+nbadj;
		if (!(nbadj==1 && b==1)){
			td.style.display = "none";
		} else if (self.factory.isClassB(band) && (self.config.squelchAdjBwMode[band]==1)){
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
	this.createFilterEnable = function(chFiltRow, c, band, nbadj) {
		var cell = document.createElement("td");
		cell.innerHTML = c+1;
		cell.style.textAlign = "center";
		chFiltRow.appendChild(cell);
	}
	this.isFiltEnabled = function(c, band, nbadj) {
		var on = false;	
		try {
			on = self.getShowFilter(c, band, nbadj);
		} catch(err) {}
		return on;
	}
	this.createFilterChannel = function(chFiltRow, b, c, band, nbadj) {
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
		fr.title = "Min: "+(this.factory.fstart[2*band+b]/1e6) +
			", Max: "+(this.factory.fstop[2*band+b]/1e6)+" MHz";
		fr.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		fr.onchange = function(ev) {
			var b = this.path;
			var c = this.channel;
			var band = this.band;
			var fr = self.getFreqCh(b, c, band);
			if (fr < self.factory.fstart[2*band+b]) fr = self.factory.fstart[2*band+b];
			if (fr > self.factory.fstop[2*band+b]) fr = self.factory.fstop[2*band+b];
			fr = ~~Math.round(fr/self.factory.fstep);
			fr *= self.factory.fstep;
			self.setFreqCh(b, c, band, fr);
			if (!self.isFreqSplitFixed(band)) return;
			if ((b % 2)==0){
				fr += self.factory.uldlFreqSplit[band];
				b++;
			}else{
				fr -= self.factory.uldlFreqSplit[band];
				b--;
			}
			if (fr < self.factory.fstart[2*band+b]) fr = self.factory.fstart[2*band+b];
			if (fr > self.factory.fstop[2*band+b]) fr = self.factory.fstop[2*band+b];
			self.setFreqCh(b, c, band, fr);
		}
		cell.appendChild(fr);
		return cell;
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
		el.title = "Min: "+self.config.GfineRange+", Max: 0 dB";
		el.onchange = function(ev) {
			var num = parseInt(this.value);
			if (isNaN(num)) {
				num = 0;
			}
			if (num < self.config.GfineRange) {
				this.value = self.config.GfineRange;
			} else if (num > 0) {
				this.value = 0;
			} else {
				this.value = num;
			}
		}
		cell.appendChild(el);
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
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
		var box = document.createElement("div");
		var row = document.createElement("tr");
		box.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts["FREQSPLIT"];
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.paddingLeft = "15px";
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
			for (var c = 0; c < self.maxChannels; ++c) {
				self.frSplitChRedraw(c, band, fixed);
			}
			if (fixed){
				var band = this.band;
				for (var c = 0; c < self.config.ADJNR; ++c) {
					var fr = self.getAdjFreq(1, c, band);
					for (var s=0;s<2;s++){
						fr[s] -= self.factory.uldlFreqSplit[band];
					}
					self.setAdjFreqCh(0, c, band, fr[0], fr[1]);
				}
			}
		}	
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		cell.style.verticalAlign = "middle";
		cell.appendChild(el);
		return box;
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
		var fr = self.getFreqCh(b, c, band);
		if (fr < self.factory.fstart[2*band+b]) fr = self.factory.fstart[2*band+b];
		if (fr > self.factory.fstop[2*band+b]) fr = self.factory.fstop[2*band+b];
					fr = ~~Math.round(fr/self.factory.fstep);
		fr *= self.factory.fstep;
		self.setFreqCh(b, c, band, fr);
		if (!fixed) return;
		fr -= self.factory.uldlFreqSplit[band];
		b--;
		if (fr < self.factory.fstart[2*band+b]) fr = self.factory.fstart[2*band+b];
		if (fr > self.factory.fstop[2*band+b]) fr = self.factory.fstop[2*band+b];
		self.setFreqCh(b, c, band, fr);
	}
	this.squelchAdjBwModeCreate = function(band) {
		var box = document.createElement("div");
		box.id = "SquelchAdjBwModeBox_"+band;
		box.style.display = self.factory.isClassB(band)?"block":"none";
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
		el.id = "squelchAdjBwMode_"+band;
		el.name = el.id;
		var opts = [ "Normal", "Channel based" ];
		for (var i = 0; i < 2; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.selectedIndex = 0;
		el.band = band;
		el.onchange = function(ev){
			self.displayFilters(this.band);
		}
		cell.appendChild(el);
		return box;
	}
	this.squelchAdjBwModeDisplay = function(band, on) {
		try {
			document.getElementById("SquelchAdjBwModeBox_"+band).style.display = on?"block":"none";
		} catch(e){}
	}
	this.squelchAdjBwModeSet = function(band, filtersBaseMode) {
		try {
			var index = 0;
			if (self.factory.isClassB(band)) {
				index = (filtersBaseMode?1:0);
			}
			var el = document.getElementById("squelchAdjBwMode_"+band);
			var currentIndex = el.selectedIndex;
			el.selectedIndex = index;
			if (currentIndex != index) el.onchange();
		} catch(e){}
	}
	this.squelchAdjBwModeRead = function(band) {
		try {
			if (self.factory.isClassB(band)) {
				return document.getElementById("squelchAdjBwMode_"+band).selectedIndex;
			} else {
				return 0;
			}
		} catch(e){ return 0; }
	}
	this.isSquelchAdjBwModeFiltersBased = function(band) {
		try {
			if (!self.factory.isClassB(band)) return false;
			return (document.getElementById("squelchAdjBwMode_"+band).selectedIndex == 1);
		} catch(e){return false;}
	}
	this.createMuteMode = function(band) {
		var box = document.createElement("div");
		var row = document.createElement("tr");
		box.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts["MUTEMODE"];
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.paddingLeft = "5px";
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "mutemode"+band;
		el.name = el.id;
		var opts = [ Texts['INDEPENDENT'], Texts['LINKED'] ];
		for (var i = 0; i < 2; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.selectedIndex = 0;
		cell.appendChild(el);
		return box;
	}
	this.isMuteModeLinked = function(band) {
		try {
			var el = document.getElementById("mutemode"+band);
			return el.selectedIndex == 1;
		} catch (err) { return null;}
	}
	this.setMuteMode = function(band,mode) {
		try {
			var el = document.getElementById("mutemode"+band);
			el.selectedIndex = mode;
		} catch (err) { }
	}
	this.mutemodeDisable = function(band, doDisable) {
		try {
			var el = document.getElementById("mutemode"+band);
			if (doDisable) {
				el.disabled = true;
				el.style.backgroundColor = "#CCCCCC";
			} else {
				el.disabled = false;
				el.style.backgroundColor = "white";
			}
		} catch (err) {}
	}
	this.createUnitReset = function(band) {
		var box = document.createElement("div");
		var reset = document.createElement("input");
		reset.id = "reset"+band;
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
	this.createTempBoard = function(band) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = createMetRow("boardTemp"+band, board_temp_settings, Texts['TEMPERATURE'], "&ordm;C");
		tb.appendChild(row);
		return box;
	}
	this.boardTempSet = function(val) {
		setMetValue("boardTemp0", val);
		setMetValue("boardTemp1", val);
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
		var row;
		if (dn==0){
			row = this.createSquelchEnable(dn,band,0);
			body.appendChild(row);
			row = this.createSquelchThreshold(dn,band,0);
			body.appendChild(row);				
			row = this.crateCNThresholdULnb(band);
			body.appendChild(row);
		}
		row = this.createEqBw(dn,band);
		body.appendChild(row);
		if (dn==1){
			row = this.createEqSq(band);
			body.appendChild(row);
		}
		var bbAgcSettings = {min: 0, low_alarm: -128, low_warn: -128, high_warn: 127, high_alarm: 127, max: 32};
		row = createMetRow("bbAgc_"+band+"_"+dn, bbAgcSettings, "Input AGC", "dB");
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
		var bbAgcSettings = {min: 0, low_alarm: -128, low_warn: -128, high_warn: 127, high_alarm: 127, max: 32};
		row = createMetRow("bbAgcOut_"+band+"_"+dn, bbAgcSettings, "Output AGC", "dB" ,40);
		row.id = "bbAgcOutMeterId_"+band+"_"+dn;
		row.style.display = "none";
		body.appendChild(row);
		row = this.createAgcBandMode(dn,band);
		row.id = "agcBandModeRow_"+band+"_"+dn;
		row.style.display = "none";
		body.appendChild(row);
		return box;
	}
	this.showAgcBandOutElements = function(config) {
		for (var band = 0; band < 2; band++) {
			for (var dn = 0; dn < 2; dn++) {
				try {
					config.agcBandMode[band][dn]
					var id = "bbAgcOutMeterId_"+band+"_"+dn;
					var el1 = document.getElementById(id);
					id = "agcBandModeRow_"+band+"_"+dn;
					var el2 = document.getElementById(id);
					var show = false;
					var showAgcOutMeter = false;
					if (dn==0){
						/* no mostrar si ULlowGainMode==true */
						if (factory.ULlowGainMode){
							show = false;
						}else{
							show = true;
							/* mostrar meter en AGC mode ==MAX POWER, NO en STABLE COVERAGE*/
							showAgcOutMeter = config.agcBandMode[band][dn]?true:false;
						}
					} else {
						show = false; //no existe para DL
					}
					el1.style.display = (show && showAgcOutMeter)?"table-row":"none";
					el2.style.display = show?"table-row":"none";
					var showAgcInCh = !showAgcOutMeter;
					if (dn==0) self.showAgcInCh(band, showAgcInCh);
				} catch(e){}
			}
		}
	}
	this.showAgcInCh = function(band, show){
		var dn=0;
		for (var nbadj=0; nbadj<2; nbadj++){
			var maxCh = nbadj==0? self.maxChannels : self.factory.numADJFilters;
			for (var c=0; c < maxCh; c++){
				var id ="agc_"+c+"_"+dn+"_"+band+"_"+nbadj;
				var met = document.getElementById("met_"+id);
				var txt = document.getElementById("txt_"+id);
				if (nbadj==0){
					try { met.style.visibility=(show?"visible":"hidden");} catch(e){}
					try { txt.style.visibility=(show?"visible":"hidden");} catch(e){}
				}else{
					try { met.style.display=(show?"table-cell":"none");} catch(e){}
					try { txt.style.display=(show?"table-cell":"none");} catch(e){}
				}
			}
			// header text
			var hdr = document.getElementById("agcHeaderTxt_"+dn+"_"+band+"_"+nbadj);
			var showHdr = show && (nbadj==0?self.factory.chBandEnabled[band]:self.factory.adjBandEnabled[band]);
			if (nbadj==0){
				try { hdr.style.visibility=(showHdr?"visible":"hidden");} catch(e){}
			}else{
				try { hdr.style.display=(showHdr?"table-cell":"none");} catch(e){}
			}
		}
	}
	this.bbOutAgcSet = function(dn, band, val) {
		setMetValue("bbAgcOut_"+band+"_"+dn, val, "undefined", 1);
	}
	this.bbAgcSet = function(dn, band, val, isOn) {
		setMetValue("bbAgc_"+band+"_"+dn, val, "undefined", 0);
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
				self.equalSqAllCh(0, this.band);
			} else {
				self.originalSqAllCh(this.band);
			}
		}
		cell.appendChild(el);
		var show = true;
		if (!self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
			show = self.config.squelchAdjBwMode[band];
		}
		row.style.display = show?"table-row":"none";
		return row
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
		el.uldl = dn;
		el.band = band;
		el.onclick = function(ev) {
			if (this.checked) {
				self.equalBwAllCh(this.uldl, 0, this.band);
			} else {
				self.originalBwAllCh(this.uldl, this.band);
			}
		}
		cell.appendChild(el);
		var show = true;
		if (!self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
			show = self.config.squelchAdjBwMode[band];
		}
		row.style.display = show?"table-row":"none";
		return row
	}
	this.showEqBw = function(band, dn, show){
		try {
			document.getElementById("eqBwRow_"+band+"_"+dn).style.display = (show? "table-row":"none");			
		} catch(e){}
	}
	this.equalBwAllCh = function(b, c, band) {
		var id = "chBw_"+c+"_"+b+"_"+band;
		var el = document.getElementById(id);
		var ix;
		try {
			ix = el.selectedIndex;
		} catch(err) { ix = 0; }	
		for (var i = 0; i < self.maxChannels; ++i) {
			var id = "chBw_"+i+"_"+b+"_"+band;
			var el = document.getElementById(id);
			try {
				el.selectedIndex = ix;
			} catch(err) {}
		}
	}
	this.equalSqAllCh = function(c, band) {
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
		for (var i = 0; i < self.maxChannels; ++i) {
			txt = document.getElementById("sqThr_0_"+band+"_1_"+i);
			chk = document.getElementById("sqEn_0_"+band+"_1_"+i);
			try {
				chk.checked = sqEn;
				txt.value = sqTh;
			} catch(err) {}
		}
	}	
	this.originalBwAllCh = function(b, band) {
		for (var c = 0; c < self.maxChannels; ++c) {
			self.chBwSet(b, c, band, self.config.bwIndex[band][b][c]);
		}
	}
	this.originalSqAllCh = function(band) {
		for (var c = 0; c < self.maxChannels; ++c) {
			self.squelchChEnSet(1, c, band, 0, self.config.sqChEnabled[0][band][1][c]);
			self.squelchChThrSet(1, c, band, 0, self.config.sqChThreshold[0][band][1][c]);
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
	this.createAgcBandMode = function(dn, band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "AGC&nbsp;Mode";
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.colSpan = 2;
		cell.className = "mlong";
		var sp = document.createElement("span");
		sp.innerHTML = "AGC Mode:<br><br>Stable Coverage: Maximum UL power per channel will be fixed equally by the amount of configured filters. Channel Output power will not vary based on the UL traffic providing the most possible stable coverage<br><br>Max. Power: Maximum UL power per channel will be dependent on the amount of channels that are being transmitted. UL Channel Output power will be dynamic and will vary depending on the UL traffic. The Power per channel will trend to be larger when low traffic is present";
		cell.appendChild(sp);
		cell.style.textAlign = "left";
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "agcBandMode_"+band+"_"+dn;
		el.name = el.id;
		// el.title = "AGC Mode:\n\nStable Coverage: Maximum UL power per channel will be fixed equally by the amount of configured filters. Channel Output power will not vary based on the UL traffic providing the most possible stable coverage\n\nMax. Power: Maximum UL power per channel will be dependent on the amount of channels that are being transmitted. UL Channel Output power will be dynamic and will vary depending on the UL traffic. The Power per channel will trend to be larger when low traffic is present";
		el.uldl = dn;
		el.band = band;
		var opts = [ "Stable Coverage", "Max. Power" ];
		for (var i = 0; i < opts.length; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.selectedIndex = 0;
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		cell.appendChild(el);
		return row;
	}
	this.agcBandModeSet = function(dn, band, on) {
		try {
			var el = document.getElementById("agcBandMode_"+band+"_"+dn);
			el.selectedIndex = on? 1:0;
		} catch (err) {}
	}
	this.agcBandModeGet = function(dn, band) {
		try {
			var el = document.getElementById("agcBandMode_"+band+"_"+dn);
			return (el.selectedIndex == 1);
		} catch (err) {
			return false;
		}
	}	

	this.getSquelchThresholdMin = function(b, band) {
		var simplex = false;
		try {
			var el = document.getElementById("simplex"+band);
			simplex = el.checked;
		} catch(e) { simplex = false;}
		return self.config.sqThrLimits(simplex, b, self.factory.ULlowGainMode).MIN;
	}
	this.getSquelchThresholdMax = function(b, band) {
		var simplex = false;
		try {
			var el = document.getElementById("simplex"+band);
			simplex = el.checked;
		} catch(e) { simplex = false;}
		return self.config.sqThrLimits(simplex, b, self.factory.ULlowGainMode).MAX;
	}
	this.updateSquelchThresholdTitles = function(band, simplex) {
		for (var b = 0; b < 2; ++b) {
			try {
				var min = self.config.sqThrLimits(simplex, b, self.factory.ULlowGainMode).MIN;
				var max = self.config.sqThrLimits(simplex, b, self.factory.ULlowGainMode).MAX;
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
			if (!self.eqSqIsSet(band) || nbadj==1 || dn ==0) {
				return;
			}
			self.equalSqAllCh(ch, band);			
		}		
		cell.appendChild(el);
		cell.style.textAlign = "center";
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
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
			if (!self.eqSqIsSet(band) || nbadj==1 || dn ==0) {
				return;
			}
			setTimeout(function() {self.equalSqAllCh(ch, band);}, 100);		
		}
		el.className = "number";
		var simplex = self.isSimplexMode(band, self.config.simplexMode[band]);
		var min = self.config.sqThrLimits(simplex, dn, self.factory.ULlowGainMode).MIN;
		var max = self.config.sqThrLimits(simplex, dn, self.factory.ULlowGainMode).MAX;
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
			// reajustar límite de umbral C/N sin cambiar los valores desde este control de squelch
			// pero sin cambiar los valores, eso se deja para el submit por si el usuario hace otro cambio antes
			if (dn==0 && nbadj==1){
				if (!self.factory.isClassB(band) || (self.squelchAdjBwModeRead(band) == 0)) {
					var simplex = (self.getSimplexMode(band) && self.factory.Simplex[band]);
					self.setCNThresholdLimits(band, 1, ch, simplex, this.value);
				}
			}
			if (!self.eqSqIsSet(band) || nbadj==1 || dn ==0) {
				return;
			}
			self.equalSqAllCh(ch, band);			
		}
		cell.appendChild(el);
		var show = true;
		if ((nbadj==1) && !self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
			show = !self.config.squelchAdjBwMode[band];
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
		var simplex = self.isSimplexMode(band, self.config.simplexMode[band]);
		var min = self.config.sqThrLimits(simplex, dn, self.factory.ULlowGainMode).MIN;
		var max = self.config.sqThrLimits(simplex, dn, self.factory.ULlowGainMode).MAX;
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
				var simplex = (self.getSimplexMode(band) && self.factory.Simplex[band]);
				self.setCNThresholdLimits(band, 0, 0, simplex, this.value);
				// reajustar límite de umbral C/N de todos los filtros ADJ si squelch es filters based
				if (self.factory.isClassB(band) && (self.squelchAdjBwModeRead(band) == 1)) {
					for (var c=0; c < self.factory.numADJFilters; c++){
						self.setCNThresholdLimits(band, 1, c, simplex, this.value);
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
			if (self.factory.isClassB(band)){
				show = self.config.squelchAdjBwMode[band];
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
	this.createMainGainLim = function(dn, band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['GAINLIM'];
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
		self.mainGainMax[band][dn] = self.factory.gainlimit[2*band+dn];
		var gmin = self.factory.gainlimit[2*band+dn]+self.config.GmainRange[dn];
		el.title = "Min: "+gmin+", Max: " +
			self.factory.gainlimit[2*band+dn]+" dB";
		el.onchange = function(ev) {
			var target = this;
			var band = target.band;
			var dn = target.dn;
			var num = self.mainGainLimGet(dn,band);
			var gmin = self.factory.gainlimit[2*band+dn]+self.config.GmainRange[dn];
			if (num < gmin) {
				target.value = gmin;
			} else if (num > self.mainGainMax[band][dn]) {
				target.value = self.mainGainMax[band][dn];
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
	this.statGainMainTitle = function(b, band, g) {
		try {
			var maxgain = self.factory.gainlimit[2*band+b];
			var mingain = self.factory.gainlimit[2*band+b]+self.config.GmainRange[b];
			if (maxgain > g) {
				maxgain = g;
			}
			if (maxgain == self.mainGainMax[band][b]) {
				return;
			}
			if (maxgain<mingain) maxgain = self.factory.gainlimit[2*band+b];
			self.mainGainMax[band][b] = maxgain;
			var title = "Min: "+mingain+", Max: " +	self.mainGainMax[band][b]+" dB";
			var id = "mainGainLimit_"+band+"_"+b;
			var el = document.getElementById(id);
			el.title = title;
		} catch(err) {}
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
			if (this.factory.chBandEnabled[band]){
				opt.text = this.BWtable[i].txt+" "+FilterTypes[i]['data'][3]+"us";
			} else {
				opt.text = this.BWtable[i].txt;
			}
			opt.style.textAlign = "center";
			opt.value = this.BWtable[i].value;
			opt.khz = this.BWtable[i].khz;
			opt.index = this.BWtable[i].ix;
		}
		el.selectedIndex = 0;
		el.bandNr = b;
		el.chNr = c;
		el.band = band;
		el.onchange = function(ev) {
			if (!self.eqBwIsSet(this.bandNr,this.band)) {
				return;
			}
			self.equalBwAllCh(this.bandNr, el.chNr, this.band);
		}
		return cell;
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
			return el.options[k].value;
		} catch (err) {
			return null;
		}
	}
	this.chBwGetKHz = function(b, c, band) {
		try {
			var el = document.getElementById("chBw_"+c+"_"+b+"_"+band);
			var k = el.selectedIndex;
			return el.options[k].khz;
		} catch (err) {
			return null;
		}
	}
	this.chBwGetIndex = function(b, c, band) {
		try {
			var el = document.getElementById("chBw_"+c+"_"+b+"_"+band);
			var k = el.selectedIndex;
			return el.options[k].index;
		} catch (err) {
			return null;
		}
	}
	this.createMetPowIn = function(b, c, band, nbadj) {
		var simplex = self.isSimplexMode(band,self.config.simplexMode[band]);
		var settings = simplex ? chRfIn_settings[0] : chRfIn_settings[b];
		return createMetCell("rfInPow_"+c+"_"+b+"_"+band+"_"+nbadj, settings);
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
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
			cell.style.display = "none";
		}
		return cell;
	}
	this.createTextPowOut = function(b, c, band, nbadj,w) {
		var cell = createTextCell("rfOutPow_"+c+"_"+b+"_"+band+"_"+nbadj,w);
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
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
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
			cell.style.display = "none";
		}
		return cell;
	}
	this.createTextAgc = function(b, c, band, nbadj, w) {
		var cell = createTextCell("agc_"+c+"_"+b+"_"+band+"_"+nbadj,w);
		if ((nbadj==0) && !self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
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
					var fr = self.getFreqCh(b, c, band);
					if (fr < self.factory.fstart[2*band+b]) fr = self.factory.fstart[2*band+b];
					if (fr > self.factory.fstop[2*band+b]) fr = self.factory.fstop[2*band+b];
					fr = ~~Math.round(fr/self.factory.fstep);
					fr *= self.factory.fstep;
					cnf.freqHz[band][b][c] = fr;
					if (cnf.uldlLinkedFreq[band]) {
						fr -= self.factory.uldlFreqSplit[band];
						b--;					
						if (fr < self.factory.fstart[2*band+b]) fr = self.factory.fstart[2*band+b];
						if (fr > self.factory.fstop[2*band+b]) fr = self.factory.fstop[2*band+b];
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
		var filtSepKhz = this.FILTSEP90K;
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
			self.warningBox.setWarningMessage(fov, filtSepKhz, filtAdjSepKhz, filtNbAdjSepKhz, self.maxChannels, self.factory, uldlLinked,true);
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
	this._checkFreqsAsync = function(cnf, callback) {
		var showdialog = 0;
		var fov = [];
		for (var band=0;band<2;band++) fov.push(self.computeFiltersOverlap(cnf, band));
		for (var band=0;band<2;band++) fov.push(self.computeAdjFiltersOverlap(cnf, band));
		for (var band=0;band<2;band++) fov.push(self.computeNBAdjFiltersOverlap(cnf, band));
		for (var band=0;band<2;band++) fov.push(self.checkClassBFilters(cnf, band));
		var filtSepKhz = self.FILTSEP90K;
		var filtAdjSepKhz = self.FILTSEPADJKHZ;
		var filtNbAdjSepKhz = self.FILTSEPNBADJKHZ;
		var checkOv = false, checkB = false;
		for (var i=0;i<6;i++) { if (fov[i]['check']) checkOv = true; }
		for (var i=6;i<8;i++) { if (fov[i]['check']) checkB = true; }
		if (checkOv || checkB) {
			var uldlLinked = [self.isFreqSplitFixed(0), self.isFreqSplitFixed(1)];
			self.warningBox.setWarningMessage(fov, filtSepKhz, filtAdjSepKhz, filtNbAdjSepKhz, self.maxChannels, self.factory, uldlLinked, true);
			if (checkOv) showdialog |= 0x1;
			if (checkB) showdialog |= 0x2;
		}
		if (showdialog == 0) {
			self.warningBox.hide();
			callback(true);
			return;
		}
		self._showFreqWarningModal(showdialog, function() { callback(true); }, function() { callback(false); });
	}
	this._showFreqWarningModal = function(showdialog, onConfirm, onCancel) {
		var overlay = document.getElementById('fcs-confirm-overlay');
		if (!overlay) {
			overlay = document.createElement('div');
			overlay.id = 'fcs-confirm-overlay';
			document.body.appendChild(overlay);
		}
		var both = ((showdialog & 0x3) == 0x3);
		var html = '<b>NOTICE:</b><br/>';
		if ((showdialog & 0x2) != 0) {
			if (both) html += '<b>1.</b>&nbsp;';
			html += 'You selected a filter wider than 75KHz. This unit will operate as a Class B unit.<br/>';
		}
		if ((showdialog & 0x1) != 0) {
			if (both) html += '<b>2.</b>&nbsp;';
			html += 'Filter overlapping detected.<br/>';
		}
		html += '<br/>See details below. Please confirm before applying.';
		overlay.innerHTML = '<div style="background:#fff;border-radius:4px;min-width:340px;max-width:460px;box-shadow:0 4px 24px rgba(0,0,0,0.35);overflow:hidden;">'
			+ '<div style="background:#004a98;color:#fff;padding:11px 16px;font-size:13px;font-weight:bold;font-family:Arial,sans-serif;">&#9888;&nbsp;Configuration Warning</div>'
			+ '<div style="padding:16px 20px;font-size:13px;font-family:Arial,sans-serif;color:#222;line-height:1.7;">' + html + '</div>'
			+ '<div style="padding:10px 20px 14px;text-align:right;background:#f4f4f4;border-top:1px solid #ddd;">'
			+ '<button id="fcs-btn-cancel" style="margin-right:8px;padding:7px 20px;font-size:13px;background:#6b7280;color:#fff;border:none;border-radius:3px;cursor:pointer;font-family:Arial,sans-serif;">Cancel</button>'
			+ '<button id="fcs-btn-ok" style="padding:7px 20px;font-size:13px;background:#004a98;color:#fff;border:none;border-radius:3px;cursor:pointer;font-family:Arial,sans-serif;">Apply</button>'
			+ '</div></div>';
		overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;';
		document.getElementById('fcs-btn-ok').addEventListener('click', function() {
			overlay.style.display = 'none';
			onConfirm();
		});
		document.getElementById('fcs-btn-cancel').addEventListener('click', function() {
			overlay.style.display = 'none';
			onCancel();
		});
	}
	this.displayFilters = function(band) {
		var shownb = false;
		var showadj = false;
		for (var c=0;c<self.maxChannels;c++){
			if (self.showFiltersMask[0][band][c]) shownb = true;
		}
		shownb = shownb && (self.factory.chBandEnabled[band] || self.isSquelchAdjBwModeFiltersBased(band));
		for (var c=0;c<self.factory.numADJFilters;c++){
			if (self.showFiltersMask[1][band][c]) showadj = true;
		}
		var filtersBased = self.squelchAdjBwModeRead(band);
		if (!showadj && self.factory.isClassB(band) && filtersBased) shownb = false;
		showadj = (self.factory.adjBandEnabled[band]) && showadj;	
		var el = document.getElementById("TableFilter_"+band+"_0");
		el.style.display = (shownb) ? "table" : "none";
		el = document.getElementById("TableFilter_"+band+"_1");
		el.style.display = (showadj) ? "table" : "none";		
		el = document.getElementById("filtersRow_"+band);
		el.style.display = (showadj||shownb) ? "table-row" : "none";
		el = document.getElementById("freqStyle_"+band);
		if (el) el.style.display = (showadj) ? "block" : "none";
		//Added code from squelchAdjBwMode / onchange
		// NB
		if (self.factory.isClassB(band)){
			self.squelchAdjBwModeDisplay(band,showadj);
			shownb = filtersBased;
			if (!showadj) shownb = false;
			self.showFiltTable(band, shownb);
			self.showSquelchThreshold(band, shownb);
			self.showCNThresholdULnb(band, shownb);
			for (var dn=0;dn<2;dn++) self.showEqBw(band, dn, shownb);
			self.showEqSq(band, shownb);
			// ADJ
			for (var dn=0;dn<2;dn++){
				self.chSqTitleSet(band,1,dn,shownb);  // "SQ(dBm)" normal vs "SQ Enable" (filters based)
				self.chFiltTableTitleSet(band,dn,shownb);
				for (var ch=0; ch < self.factory.numADJFilters; ch++){
					self.showChSquelchThreshold(dn,ch,band,1, !shownb);
				}
			}
			// ocultar CN threshold de filtros ADJ en modo squelch based
			self.cnThresholdAdjShow(band, !shownb);
		}
	}
	this.computeShowOpfSettings = function() {
		return self.factory.oscFeatureEnable;
	}
	this.computeShowExtremeTempAction = function() {
		return self.factory.extremeTempActionEnable;
	}
	this.showConfs = function() {
		self.bbuAlarmsShow();
		self.showAgcBandOutElements(self.config);//se elimina agcOutCapable
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
		//relay timers
		for (var k=0;k<self.config.NR_OF_RELAYS_MAX;k++){
			this.delayLatchOnOffSet(0,k,self.config.delayTimerON[k]);
			this.delayLatchOnOffSet(1,k,self.config.latchTimerON[k]);
			this.delayLatchTimeSet(0,k,self.config.delayTimer[k]);
			this.delayLatchTimeSet(1,k,self.config.latchTimer[k]);
		}
		for (var band = 0; band < 2; ++band) {
			self.squelchAdjBwModeDisplay(band, self.factory.isClassB(band));
			self.squelchAdjBwModeSet(band, self.config.squelchAdjBwMode[band]);
			self.setMuteMode(band,self.config.muteModeLinked[band]);
			var simplex = self.isSimplexMode(band, self.config.simplexMode[band]);
			self.setSimplexMode(band,simplex);
			this.updateSquelchThresholdTitles(band,simplex);
			self.mutemodeDisable(band,simplex);	
			
			self.squelchChEnSet(0, 0, band, 0, self.config.sqChEnabled[0][band][0][0]);			
			self.squelchChThrSet(0, 0, band, 0, self.config.sqChThreshold[0][band][0][0]);
			for (var c = 0; c < self.maxChannels; ++c) {
				self.squelchChEnSet(1, c, band, 0, self.config.sqChEnabled[0][band][1][c]);	
				self.squelchChThrSet(1, c, band, 0, self.config.sqChThreshold[0][band][1][c]);	
			}
			self.eqSqSet(band, self.config.allSameSquelch[band]);
			for (var b = 0; b < 2; ++b) {
				for (var c = 0; c < self.factory.numADJFilters; ++c) {
					self.squelchChEnSet(b, c, band, 1, self.config.sqChEnabled[1][band][b][c]);	
					self.squelchChThrSet(b, c, band, 1, self.config.sqChThreshold[1][band][b][c]);	
				}
				self.mainGainLimSet(b, band, self.config.gain[band][b]);
				self.mainPowerLimSet(b, band, self.config.power[band][b]);
				self.eqBwSet(b, band, self.config.allChSameBW[band][b]);
				self.hpaSwSet(b, band, self.config.paEnabled[band][b]);
				self.agcBandModeSet(b, band, self.config.agcBandMode[band][b]);
			}
			self.displayFilters(band);
			for (var nbadj = 0;nbadj<2;nbadj++){
				for (var c = 0; c < (nbadj==0?self.maxChannels:self.factory.numADJFilters); ++c) {
					var show = self.showFiltersMask[nbadj][band][c];
					this.setShowFilter(c, band, nbadj, show);
					var active = self.config.filterEnabled[nbadj][band][1][c]; //se usa DL					
					for (var b = 0; b < 2; ++b) {
						self.setAdjFreqCh(b, c, band, self.config.fstartHzAdjFilter[band][b][c], self.config.fstopHzAdjFilter[band][b][c]);
						self.setGfine(b, c, band, nbadj, self.config.fineGainFilter[nbadj][band][b][c]);
						var settings = simplex ? chRfIn_settings[0] : chRfIn_settings[b];
						setMetRange("rfInPow_"+c+"_"+b+"_"+band+"_"+nbadj, settings);						
					}
				}
			}
			for (var c = 0; c < self.maxChannels; ++c) {
				for (var b = 0; b < 2; ++b) {
					self.chBwSet(b, c, band, self.config.bwIndex[band][b][c]);

				}
			}
			self.simplexSettingsDisable(band);	
			self.setCNThresholdUlNb(band, self.config.cn_threshold_nb[band]);
			for (var c = 0; c < self.factory.numADJFilters; ++c) {
				self.setCNThresholdUlAdj(band, c, self.config.cn_threshold_adj[band][c]);
			}
			self.setControlChannelNr(band, self.config.controlChannel[band]);
			// reajustar límite de umbral C/N de filtros NB, para el caso de venir de un submit anterior
			self.setCNThresholdLimits(band, 0, 0, simplex, self.config.sqChThreshold[0][band][0][0]);
			// reajustar límite de umbral C/N de filtros ADJ, para el caso de venir de un submit anterior
			for (var c = 0; c < self.factory.numADJFilters; c++) {
				if (!self.factory.isClassB(band) || (self.config.squelchAdjBwMode[band] == 0)) {
					// si squelch NO es filters based
					self.setCNThresholdLimits(band, 1, c, simplex, self.config.sqChThreshold[1][band][0][c]);
				} else {
					// si squelch es filters based
					self.setCNThresholdLimits(band, 1, c, simplex, self.config.sqChThreshold[0][band][0][0]);
				}
			}
		}
		var el = window.parent.head.document.getElementById('maintab');
		var w =  document.getElementById("tagName").getBoundingClientRect().width;
		
		el.style.width = w+'px';		
	}
	this.computeFiltersCombine = function(cnf, b, n, band) {
		var filts = [];
		for (var c = 0; c < self.maxChannels; ++c) {
			if (c == n) {
				continue;
			}
			if (!cnf.filterEnabled[0][band][1][c]) {
				continue;
			}
			if (self.isFilterCombination(cnf, b, n, c, band)) {
				filts.push(c);
			}
		}
		return filts;
	}
	this.filterBelongsToCombination = function(cnf, b, n, band) {
		if (!cnf.filterEnabled[0][band][1][n]) {
			return false;
		}
		var filts = self.computeFiltersCombine(cnf, b, n, band);
		return (filts.length != 0);
	}
	this.getFilterCombinations = function(cnf, b, band) {
		var filts = [];
		for (var n = 0; n < self.maxChannels; ++n) {
			filts.push([]);
			if (!cnf.filterEnabled[0][band][1][n]) {
				continue;
			}
			for (var c = 0; c < self.maxChannels; ++c) {
				if (c == n) {
					continue;
				}
				if (!cnf.filterEnabled[0][band][1][c]) {
					continue;
				}
				/*if (self.isFilterAlreadyCounted(filts, c)) {
					continue;
				}*/
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
		var filts = self.getFilterCombinations(cnf, b, band);
		//agrupar filtros
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
		var groups = 0;
		for (var i = 0; i < filts.length; ++i) {
			if (filts[i].length > 0) {
				groups++;
			}
		}
		var fnr = self.computeNrActiveFilts(cnf,band);
		var rednr = fnr - groups;
		return rednr;
	}
	this.isFilterAlreadyCounted = function(filts, c) {
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
		var n = 0;
		for (var c = 0; c < self.maxChannels; ++c) {
			if (cnf.filterEnabled[0][band][1][c]) {
				n++;
			}
		}
		return n;
	}
	this.computeFiltersOverlap = function(cnf, band) {
		var ovlp = [];
		var check = false;
		for (var b = 0; b < 2; ++b) {
			ovlp.push([]);
			for (var c = 0; c < self.maxChannels; ++c) {
				ovlp[b].push([]);
				if (!self.factory.chBandEnabled[band] || !cnf.filterEnabled[0][band][1][c]) {
					continue;
				}
				ovlp[b][c] = self.findFiltersOverlap(cnf, b, c, band);
				if (ovlp[b][c].length != 0) {
					check = true;
				}
			}
		}
		return {'check': check, 'ovlp': ovlp};
	}
	this.findFiltersOverlap = function(cnf, b, n, band) {
		var filts = [];
		for (var c = n + 1; c < self.maxChannels; ++c) {
			if (!cnf.filterEnabled[0][band][1][c]) {
				continue;
			}
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
		var f1 = cnf.freqHz[band][b][n];
		var f2 = cnf.freqHz[band][b][c];
		var b1 = cnf.computeBWFromIndex(cnf.bwIndex[band][b][n]);
		var b2 = cnf.computeBWFromIndex(cnf.bwIndex[band][b][c]);
		var filtSep = Math.abs(f2 - f1);
		var bandSep;
		if (b1 == 150 && b2 == 150) {
			bandSep = ~~Math.round(self.FILTSEP90K*1000);
			if (filtSep == bandSep) {
				var g = cnf.fineGainFilter[0][band][b][n];
				var g1 = cnf.fineGainFilter[0][band][b][c];
				return (g != g1);
			} else {
				return (filtSep < bandSep);
			}
		} else {
			bandSep = ~~Math.round((b1 + b2) * 1000 / 2 * 1.6);
			return (filtSep < bandSep);
		}
	}
	this.isFilterCombination = function(cnf, b, n, c, band) {
		if (n == c) {
			return false;
		}
		if (!(cnf.filterEnabled[0][band][1][n] && cnf.filterEnabled[0][band][1][c])) {
			return false;
		}
		if (self.computeCombinedFilters(cnf, b, n, c, band)) {
			return true;
		}
		if (!self.mayBeCombinedFilters(cnf, b, n, c, band)) {
			return false;
		}
		if (!self.checkFiltersInBetween(cnf, b, n, c, band)) {
			return false;
		}
		return true;
	}
	this.computeCombinedFilters = function(cnf, b, n, c, band) {
		if (n == c) {
			return false;
		}
		if (!(cnf.filterEnabled[0][band][1][n] && cnf.filterEnabled[0][band][1][c])) {
			return false;
		}
		var k = cnf.bwIndex[band][b][n];
		var k1 = cnf.bwIndex[band][b][c];
		if (!(k == 0 && k1 == 0)) {
			return false;
		}
		var g = cnf.fineGainFilter[0][band][b][n];
		var g1 = cnf.fineGainFilter[0][band][b][c];
		if (g != g1) {
			return false;
		}
		var f1 = cnf.freqHz[band][b][n];
		var f2 = cnf.freqHz[band][b][c];
		var filtSep = Math.abs(f2 - f1);
		var bandSep = self.FILTSEP90K*1000;
		return (filtSep == bandSep);
	}
	this.mayBeCombinedFilters = function(cnf, b, n, c, band) {
		if (n == c) {
			return false;
		}
		if (!(cnf.filterEnabled[0][band][1][n] && cnf.filterEnabled[0][band][1][c])) {
			return false;
		}
		var k = cnf.bwIndex[band][b][n];
		var k1 = cnf.bwIndex[band][b][c];
		if (!(k == 0 && k1 == 0)) {
			return false;
		}
		var g = cnf.fineGainFilter[0][band][b][n];
		var g1 = cnf.fineGainFilter[0][band][b][c];
		if (g != g1) {
			return false;
		}
		var f1 = cnf.freqHz[band][b][n];
		var f2 = cnf.freqHz[band][b][c];
		var filtSep = Math.abs(f2 - f1);
		var bandSep = self.FILTSEP90K*1000;
		if (filtSep % bandSep != 0) {
			return false;
		}
		if (filtSep / bandSep > 1) {
			return true;
		}
		return false;
	}
	this.checkFiltersInBetween = function(cnf, b, n, c, band) {
		var f1 = cnf.freqHz[band][b][n];
		var f2 = cnf.freqHz[band][b][c];
		var filtSep = Math.abs(f2 - f1);
		var bandSep = self.FILTSEP90K*1000;
		if (filtSep % bandSep != 0) {
			return false;
		}
		var steps = ~~Math.round(filtSep / bandSep);
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
		for (var k = 0; k < self.maxChannels; ++k) {
			if (k == n || k == c) {
				continue;
			}
			if (!cnf.filterEnabled[0][band][1][k]) {
				continue;
			}
			if (f != cnf.freqHz[band][b][k]) {
				continue;
			}
			return k;
		}
		return null;
	}
	this.readConfsFrm = function(isReset, isIsolVerif, isIsolClear, band, forceSend, isForcePaOn, isForcePaOff, doSetDefaultRelay, onResult) {
		var cnf = new ConfigBDA();
		cnf.parse(self.config.frm);
		var frm = [];
		if (isReset) {
			cnf.resetSoft = true;
			frm.push(cnf.getFrm());
			if (onResult) { onResult(frm); return; }
			return frm;
		}
		if (isIsolVerif) {
			cnf.runIsolationMeas[band] = true;
			cnf.forceDLMaxGain = false;
			frm.push(cnf.getFrm());
			if (onResult) { onResult(frm); return; }
			return frm;
		}
		if (isIsolClear) {
			cnf.clearOscAlarm[band] = true;
			frm.push(cnf.getFrm());
			if (onResult) { onResult(frm); return; }
			return frm;
		}
		if (doSetDefaultRelay){
			cnf.bbu_serial_mode = self.readBbuTypeOfConnection();
			frm.push(cnf.getFrm());
			if (onResult) { onResult(frm); return; }
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
		if (onResult) {
			self._checkFreqsAsync(cnf, function(ok) { onResult(ok ? frm : []); });
			return;
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
			for (var c = self.factory.numADJFilters; c < self.maxChannelsADJ; ++c) {
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
	}
	this.getCombinationSettings = function(cnf, b, band){
		cnf.numberOfFilterNonGrouped[band][b] = self.computeFilterCombineReduction(cnf, b, band);
		for (var c = 0; c <self.maxChannels; ++c) {
			cnf.isFilterGrouped[band][b][c] = self.filterBelongsToCombination(cnf, b, c, band);
		}
	}
	this.getBandConf = function(cnf, b, band) {
		cnf.squelchAdjBwMode[band] = self.squelchAdjBwModeRead(band);
		var simplex = (self.getSimplexMode(band) && self.factory.Simplex[band]);
		cnf.simplexMode[band] = simplex;
		cnf.muteModeLinked[band] = self.isMuteModeLinked(band);
		cnf.allChSameBW[band][b] = self.eqBwIsSet(b,band);
		if (b==1) cnf.allSameSquelch[band] = self.eqSqIsSet(band);
		cnf.agcBandMode[band][b] = b==0?self.agcBandModeGet(b, band):false; //en DL no existe AGC Mode
		
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
				var sqthMin = self.config.sqThrLimits(simplex, b, self.factory.ULlowGainMode).MIN;
				var sqthMax = self.config.sqThrLimits(simplex, b, self.factory.ULlowGainMode).MAX;
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
		//simplex
		if (simplex){
			cnf.muteModeLinked[band] = false;
			for (var nbadj = 0;nbadj<2;nbadj++){
				var cmax = nbadj==0?self.maxChannels:self.factory.numADJFilters;
				if (nbadj==0 && b==0) cmax=1;
				for (var c=0;c<self.config.CHNR;c++) cnf.sqChEnabled[nbadj][band][b][c] = true;
			}
		}
		if (b == 0) {
			var sqth = self.squelchChThrGet(0,0,band,0);	// UL ch0 band NB
			var cnThrLimits = self.cnThresholdLimits(simplex, sqth)
			var cn = self.getCNThresholdUlNb(band);
			if (cn < cnThrLimits.MIN) {
				cn = cnThrLimits.MIN;
			} else if (cn > cnThrLimits.MAX) {
				cn = cnThrLimits.MAX;
			}
			cnf.cn_threshold_nb[band] = cn;
			for (var ch = 0; ch < self.factory.numADJFilters; ch++) {
				var sqth;
				if (!self.factory.isClassB(band) || self.squelchAdjBwModeRead(band) == 0) {	// modo normal
					sqth = self.squelchChThrGet(0,ch,band,1);	// UL ch band ADJ
				} else {					// modo filter based
					sqth = self.squelchChThrGet(0,0,band,0);	// UL ch0 band NB
				}
				var cnThrLimits = self.cnThresholdLimits(simplex, sqth)
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
		var on = (self.isFiltEnabled(c, band, 0) && 
			(self.factory.chBandEnabled[band] || self.factory.isClassB(band)) );
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
		self.setLastRetryTime(monitor.retryTime[0]);
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
				self.rfOutPowSet(b, band, monitor.estTxPow[band][b], oneChOutOn);
				if (self.config.oscFeatureEnabled[0] && self.factory.oscFeatureEnable){
					self.setConfGain(b, band, monitor.configGain[band][b]);
					self.statGainMainTitle(b, band, monitor.maxAllowGain[band]);
					self.setStatePaOn(b, band, monitor);
				}
				self.bbAgcSet(b, band, monitor.bbAgc[band][b]);
				var bbAgcOut = monitor.bbAgcOut[band][b];
				if ((b==0) && self.config.agcBandMode[band][b]) { //si AGC mode UL==MAX POWER
					bbAgcOut = self.computeAgcOutUlMaxpower(band,monitor);
				}
				self.bbOutAgcSet(b, band, monitor.statePaOn[band][b]?bbAgcOut:0);
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
		if (factory.singleBandEnabled[band]) maxchNB*=2;
		var maxChAgcUl = 0;
		for (var nbadj=0; nbadj<2; nbadj++){
			for (var c=0; c<(nbadj==0?maxchNB:maxchADJ); c++){
				var chOutOn = self.computeChOutOn(0, c, band, nbadj, monitor);
				var agc = chOutOn ? self.computeAgc(0, c, band, nbadj, monitor) : 0;
				if (agc>maxChAgcUl) maxChAgcUl = agc;
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
		if (!chInOn) {
			self.rfChInPowSet(b, c, band, nbadj, monitor.level[nbadj][band][b][c], "#D0D0D0");
		} else if (monitor.overload[band][b]) {
			self.rfChInPowSet(b, c, band, nbadj, monitor.level[nbadj][band][b][c], "alarm");
		} else {
			self.rfChInPowSet(b, c, band, nbadj, monitor.level[nbadj][band][b][c]);
		}
		var chOutOn = self.computeChOutOn(b, c, band, nbadj, monitor);
		self.rfChOutPowSet(b, c, band, nbadj, monitor.level[nbadj][band][b][c]+monitor.gain[nbadj][band][b][c], chOutOn);
		var agc = chOutOn ? self.computeAgc(b, c, band, nbadj, monitor) : 0;
		self.agcSet(b, c, band, nbadj, agc);
	}
	this.computeChOutOn = function(b, c, band, nbadj, monitor) {
		var ch = c;
		if (nbadj==0 && b==0) ch=0;
		if (!monitor.statePaOn[band][b]) {
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
		if (b == 0) {
			if (self.config.muteModeLinked[band] && !monitor.signalDet[nbadj][band][1][c]) {
				return false;
			}
		}
		return true;
	}
	this.computeOneChOutOn = function(b, band, monitor) {
		var oneChOutOn = false;
		for (var c = 0; c < self.maxChannels; ++c) {
			if (self.computeChOutOn(b, c, band, 0, monitor)) {
				oneChOutOn = true;
				break;
			}
		}
		for (var c = 0; c < self.factory.numADJFilters; ++c) {
			if (self.computeChOutOn(b, c, band, 1, monitor)) {
				oneChOutOn = true;
				break;
			}
		}		
		
		return oneChOutOn;
	}
	this.computeChInOn = function(b, c, band, nbadj, monitor) {
		var ch = c;
		if (nbadj==0 && b==0) ch=0;
		if (!self.config.filterEnabled[nbadj][band][1][c]) {
			return false;
		}
		var simplex = self.isSimplexMode(band, self.config.simplexMode[band]);
		if (!monitor.signalDet[nbadj][band][b][c]) {
			if (self.config.sqChEnabled[nbadj][band][b][ch] || simplex) {
				return false;
			}
		}
		if (b == 0 && !simplex) {
			if (self.config.muteModeLinked[band] && !monitor.signalDet[nbadj][band][1][c]) {
				return false;
			}
		}
		if (!monitor.statePaOn[band][b]) return false;
		
		return true;
	}
	this.computeChSignalInputIsOn = function(b, c, band, nbadj, monitor) {
		// Ignorar muteModeLinked de canales NB UL si se usan para el squelch ADJ.BW basado en filtros
		var ch = c; if (nbadj==0 && b==0) ch=0;	// canal de squelch
		if (!self.config.filterEnabled[nbadj][band][1][c]) {
			return false;
		}
		var simplex = self.isSimplexMode(band, self.config.simplexMode[band]);
		if (!monitor.signalDet[nbadj][band][b][c]) {
			if (self.config.sqChEnabled[nbadj][band][b][ch] || simplex) {
				return false;
			}
		}
		if (b == 0 && !simplex) {
			var ignoreMuteModeLinked = false;
			if ((nbadj==0) && self.factory.isClassB(band) && self.isSquelchAdjBwModeFiltersBased(band)) {
				ignoreMuteModeLinked = true;
			}
			if (!ignoreMuteModeLinked) {
				if (self.config.muteModeLinked[band] && !monitor.signalDet[nbadj][band][1][c]) {
					return false;
				}
			}
		}
		return true;
	}
	this.computeAgc = function(b, c, band, nbadj, monitor) {
		var ch = c;
		if ((nbadj==0) && (b==0)) ch=0;
		var agc = self.config.gain[band][b] + self.config.fineGainFilter[nbadj][band][b][c]	- monitor.gain[nbadj][band][b][c];
		if (agc < 0) {
			agc = 0;
		}
		if (!monitor.signalDet[nbadj][band][b][c] && self.config.sqChEnabled[nbadj][band][b][ch]) {
			agc = 0;
		}
		if (b == 0 && self.config.muteModeLinked[band] && !monitor.signalDet[nbadj][band][1][c]) {
			agc = 0;
		}
		if (!self.config.filterEnabled[nbadj][band][1][c]) {
			agc = 0;
		}
		return agc;
	}

	this.createSimplex = function(band) {
		var box = document.createElement("div");
		box.id = "simplexBox"+band;
		var show = self.factory.Simplex[band];
		box.style.display = show ? "block" : 'none';
		var row = document.createElement("tr");
		box.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Simplex&nbsp;Mode";
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "simplex"+band;
		el.name = el.id;
		el.type = "checkbox";
		el.band = band;
		el.onclick = function(ev) {
			self.updateSquelchThresholdTitles(this.band, this.checked);
			self.mutemodeDisable(this.band, this.checked);
			for (var b = 0; b < 2; ++b) {
				self.sqEnDisable(b, this.band, 0, this.checked);
				self.sqEnDisable(b, this.band, 1, this.checked);
			}
		}
		cell.appendChild(el);
		return box;
	}
	this.setSimplexMode = function(band,s) {
		try {
			var el = document.getElementById("simplex"+band);
			el.checked = s;
		} catch(e) {}
	}
	this.getSimplexMode = function(band) {
		try {
			var el = document.getElementById("simplex"+band);
			var s = el && el.checked;
			return s;
		} catch(e) {}
	}
	this.isSimplexMode = function(band, simplex) {
		return (simplex && self.factory.Simplex[band]);
	}
	this.uldlLinkedDisable = function(band){
		//se fuerza a false si bw ul/dl no son iguales
		if ((self.factory.fstop[2*band+1]-self.factory.fstart[2*band+1])!=(self.factory.fstop[2*band]-self.factory.fstart[2*band])){
			var el = document.getElementById("freqSplit"+band);
			el.disabled = true;
			el.style.backgroundColor = "#CCCCCC";
		}	
	}
	this.simplexSettingsDisable = function(band) {
		var simplex = self.isSimplexMode(band, self.config.simplexMode[band]);
		self.mutemodeDisable(band,simplex);
		for (var b = 0; b < 2; ++b) {
			self.sqEnDisable(b, band, 0, simplex);
			self.sqEnDisable(b, band, 1, simplex);
		}
	}

	this.createFreqStyleSw = function(band) {
		var el = document.createElement("input");
		el.id = "freqStyle_"+band;
		el.name = el.id;
		el.type = "button";
		el.value = self.freqStyle[band] == 0 ? "Start/Stop" : "Center/Bandwidth";
		el.style.fontWeight = "bold";
		el.style.width = "130px";
		el.style.minWidth = "130px";
		el.style.borderRadius = "10px";
		el.align = "center";
		el.band = band;
		el.onclick = function(ev) {
			try {
				var fcurr = [];
				var band = this.band;
				for (b = 0; b < 2; ++b) {
					fcurr.push([])
					for (var c = 0; c < self.config.ADJNR; ++c) {
						fcurr[b].push(self.getAdjFreq(b, c, band));
					}
				}
				self.freqStyle[band] = self.freqStyle[band] == 0 ? 1 : 0;
				localStorage.setItem('freqStyle_'+band+'_'+Prjstr+window.location.host, self.freqStyle[band]);
				this.value = self.freqStyle[band] == 0 ? "Start/Stop" : "Center/Bandwidth";
				self.setAdjFreqHeaders(band);
				self.setAdjFreqTitles(band);
				for (b = 0; b < 2; ++b) {
					for (var c = 0; c < self.config.ADJNR; ++c) {
						var chnr = [];
						for (var s = 0; s < 2; ++s) {
							chnr.push(self.computeAdjChNr(fcurr[b][c][s], b, band));
						}
						self.setAdjFreqCh(b, c, band, self.computeAdjChFreq(chnr[0], b, band), self.computeAdjChFreq(chnr[1], b, band));
					}
				}
			} catch (err) {}
		}
		return el;
	}
	this.setAdjFreqHeaders = function(band) {
		try {
			for (var b = 0; b < 2; ++b) {
				var td1 = document.getElementById("HeaderF1_"+(b+1)+"_"+band+"_1");
				var td2 = document.getElementById("HeaderF2_"+(b+1)+"_"+band+"_1");
				if (self.freqStyle[band] == 0) {
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
		var titles = this.computeAdjFreqTitles(b, band);
		if (s == 0) {
			fr.title = titles[0];
		} else {
			fr.title = self.freqStyle[band] == 0 ? titles[0] : titles[1];
		}
		fr.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		fr.onchange = function(ev) {
			var b = this.path;
			var c = this.channel;
			var s = this.ss;
			var band = this.band;
			var v = self.checkAdjFrSetting(b, c, s, band, this.value);
			this.value = v;
			var f = self.getAdjFreq(b, c, band);
			var g = [];
			if (self.freqStyle[band] == 0) {
				g = self.adjustFreqLimitsSp(b, s, band, f);
			} else if (s == 0) {
				g = self.adjustFreqLimitsFc(b, band, f);
			} else {
				g = self.adjustFreqLimitsBw(b, c, band, f);
			}
			var chnr = [];
			for (var s = 0; s < 2; ++s) {
				chnr.push(self.computeAdjChNr(g[s], b, band));
			}
			self.setAdjFreqCh(b, c, band, self.computeAdjChFreq(chnr[0], b, band), self.computeAdjChFreq(chnr[1], b, band));
			if (!self.isFreqSplitFixed(band)) {
				return;
			}
			self.adjustFreqLimitsOtherBand(b, c, band, chnr);
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
		var fmin = self.factory.fstart[2*band+b];
		var fmax = self.factory.fstop[2*band+b];
		var bwmin = self.BW_ADJ_MIN_HZ;
		var bwmax = fmax - fmin;
		var r;
		if (s == 0 || self.freqStyle[band] == 0) {
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
	this.computeAdjFreqTitles = function(b, band) {
		var fmin = self.factory.fstart[2*band+b];
		var fmax = self.factory.fstop[2*band+b];
		var bwmax = (fmax - fmin);
		if (bwmax > self.maxBw(b, band)) {
			bwmax = self.maxBw(b, band);
		}
		var bwmin = self.BW_ADJ_MIN_HZ;
		var title = "Min: "+(fmin/1e6)+", Max: "+(fmax/1e6)+" MHz";
		var title1 = "Min: "+(bwmin/1e6)+", Max: "+(bwmax/1e6)+" MHz";
		return [title, title1];
	}
	this.setAdjFreqTitles = function(band) {
		for (var b = 0; b < 2; ++b) {
			var titles = self.computeAdjFreqTitles(b, band);
			var t = [];
			t.push(titles[0]);
			if (self.freqStyle[band] == 0) {
				t.push(titles[0]);
			} else {
				t.push(titles[1]);
			}
			for (var c = 0; c < self.config.ADJNR; ++c) {
				for (var s = 0; s < 2; ++s) {
					var id = "chAdjF_"+c+"_"+b+"_"+s+"_"+band;
					var el = document.getElementById(id);
					try {
						el.title = t[s];
					} catch(e) {}
				}
			}
		}
	}
	this.setAdjFreqCh = function(b, c, band, fstart, fstop) {
		var fc = (fstart + fstop) / 2;
		var bw = Math.abs(fstop - fstart);
		var f = [];
		if (self.freqStyle[band] == 0) {
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
				if (s == 0 || self.freqStyle[band] == 0) {
					el.value = (f[s] / 1.0e6).toFixed(3);
				} else {
					el.value = (f[s] / 1.0e6).toFixed(3);
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
				if (s == 0 || self.freqStyle[band] == 0) {
					v = ~~Math.round(parseFloat(el.value)*1e6);
				} else {
					v = ~~Math.round(parseFloat(el.value)*1e6);
				}
				f.push(v);
			} catch(e) {}
		}
		if (self.freqStyle[band] != 0) {
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
	this.computeAdjChNrOtherBand = function(chnr, b, band) {
		var fr = self.computeAdjChFreq(chnr, b, band);
		var diff = fr - self.factory.fstart[2*band+b];
		var a = (b + 1) % 2;
		fr = self.factory.fstart[2*band+a] + diff;
		var num = self.computeAdjChNr(fr, a, band);
		return num;
	}
	this.adjustFreqLimitsSp = function(b, k, band, f) {
		var factS = self.factory.fstart[2*band+b];
		var factP = self.factory.fstop[2*band+b];
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
		} else if (bw > self.maxBw(b, band)) {
			bw = self.maxBw(b, band);
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
	this.adjustFreqLimitsFc = function(b, band, f) {
		if (f[0] > f[1]) {
			var fr = f[0];
			f[0] = f[1];
			f[1] = fr;
		}
		var fc = ~~Math.round((f[0] + f[1]) / 2);
		var bw2 = ~~Math.round(Math.abs(f[1] - f[0]) / 2);
		var factS = self.factory.fstart[2*band+b];
		var factP = self.factory.fstop[2*band+b];
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
		} else if (bw > self.maxBw(b, band)) {
			bw = self.maxBw(b, band);
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
		fconf[0] = self.config.fstartHzAdjFilter[band][b][c];
		fconf[1] = self.config.fstopHzAdjFilter[band][b][c];
		var fcp = ~~Math.round((fconf[0] + fconf[1]) / 2);
		if (fc % self.BW2_ADJ_MIN_HZ != fcp % self.BW2_ADJ_MIN_HZ) {
			fc = fcp;
		}
		var bw = Math.abs(f[1] - f[0]);
		var step = ~~Math.round(self.factory.fstepAdj*2);
		bw = ~~Math.round(bw / step) * step;
		if (bw > self.maxBw(b, band)) {
			bw = self.maxBw(b, band);
		} else if (bw < self.BW2_ADJ_MIN_HZ) {
			bw = self.BW2_ADJ_MIN_HZ;
		}
		var bw2 = ~~Math.round(bw / 2);
		var factS = self.factory.fstart[2*band+b];
		var factP = self.factory.fstop[2*band+b];
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
			var chnr = self.computeAdjChNrOtherBand(ch[k], b, band);
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
		var on = self.isFiltEnabled(c, band, 1) && self.factory.adjBandEnabled[band];
		for (var b = 0; b < 2; ++b) {
			if (on !== null) {
				cnf.filterEnabled[1][band][b][c] = on;
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
		var ovlp = [];
		var check = false;
		for (var b = 0; b < 2; ++b) {
			ovlp.push([]);
			for (var c = 0; c < self.factory.numADJFilters; ++c) {
				ovlp[b].push([]);
				if (!self.factory.adjBandEnabled[band] || !cnf.filterEnabled[1][band][1][c]) {
					continue;
				}
				ovlp[b][c] = self.findAdjFiltersOverlap(cnf, b, c, band);
				if (ovlp[b][c].length != 0) {
					check = true;
				}
			}
		}
		return {'check': check, 'ovlp': ovlp};
	}
	this.checkClassBFilters = function(cnf,band) {
		if (self.factory.chBandEnabled[band]){
			for (var b = 0; b < 2; ++b) {
				for (var c = 0; c < self.factory.numADJFilters; ++c) {
					if (cnf.filterEnabled[1][band][b][c]) return {'check': true};
				}
				for (var c = 0; c < self.maxChannels; ++c) {
					if (cnf.filterEnabled[0][band][b][c] && cnf.bwKHz[band][b][c]>75) return {'check': true};
				}
			}
		}
		return {'check': false};
	}
	this.computeNBAdjFiltersOverlap = function(cnf,band) {
		var ovlp = [];
		var check = false;
		for (var b = 0; b < 2; ++b) {
			ovlp.push([]);
			for (var c = 0; c < self.factory.numADJFilters; ++c) {
				ovlp[b].push([]);
				if (!self.factory.chBandEnabled[band] || !self.factory.adjBandEnabled[band] || !cnf.filterEnabled[1][band][1][c]) {
					continue;
				}
				ovlp[b][c] = self.findNBAdjFiltersOverlap(cnf, b, c, band);
				if (ovlp[b][c].length != 0) {
					check = true;
				}
			}
		}
		return {'check': check, 'ovlp': ovlp};
	}	
	this.findAdjFiltersOverlap = function(cnf, b, n, band) {
		var filts = [];
		for (var c = n + 1; c < self.factory.numADJFilters; ++c) {
			if (!cnf.filterEnabled[1][band][1][c]) {
				continue;
			}
			if (self.isAdjFilterOverlap(cnf, b, n, c, band)) {
				filts.push(c);
			}
		}
		return filts;
	}
	this.findNBAdjFiltersOverlap = function(cnf, b, n, band) {
		var filts = [];
		for (var c = 0; c < self.maxChannels; ++c) {
			if (!cnf.filterEnabled[0][band][1][c]) {
				continue;
			}
			if (self.isNBAdjFilterOverlap(cnf, b, n, c, band)) {
				filts.push(c);
			}
		}
		return filts;
	}	
	this.isAdjFilterOverlap = function(cnf, b, n, c, band) {
		var f1 = [cnf.fstartHzAdjFilter[band][b][n],cnf.fstopHzAdjFilter[band][b][n]];
		var f2 = [cnf.fstartHzAdjFilter[band][b][c],cnf.fstopHzAdjFilter[band][b][c]];
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
		var f1 = [cnf.fstartHzAdjFilter[band][b][n],cnf.fstopHzAdjFilter[band][b][n]];
		var f2 = cnf.freqHz[band][b][c];
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
			if (g == self.config.gain[band][b]) {
				return;
			}
			self.config.gain[band][b] = g;
			self.config.getFrm();
			self.mainGainLimSet(b, band, g);
			initFormChangeCheck();
		} catch(err) {}
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
		var simplex = self.isSimplexMode(band, self.config.simplexMode[band]);
		var sqth = self.config.sqChThreshold[0][band][0][0];	// NB band UL ch0
		var cnThrLimits = self.cnThresholdLimits(simplex, sqth);
		el.title = "Min: "+cnThrLimits.MIN+", Max: "+cnThrLimits.MAX+" dBm";
		el.onchange = function(ev) {
			var band = this.band;
			var cn = parseInt(this.value);
			var simplex = (self.getSimplexMode(band) && self.factory.Simplex[band]);
			var sqth = self.squelchChThrGet(0,0,band,0);	// UL ch0 band NB
			var cnThrLimits = self.cnThresholdLimits(simplex, sqth);
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
		if (!self.factory.chBandEnabled[band] && self.factory.isClassB(band)) {
			show = self.config.squelchAdjBwMode[band];
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
		var simplex = self.isSimplexMode(band, self.config.simplexMode[band]);
		var sqth;
		if (!self.factory.isClassB(band) || self.config.squelchAdjBwMode[band] == 0){ // normal
			sqth = self.config.sqChThreshold[1][band][0][ch];	// ADJ band UL ch
		} else {						 // filter based
			sqth = self.config.sqChThreshold[0][band][0][0]; // NB band UL ch0
		}
		var cnThrLimits = self.cnThresholdLimits(simplex, sqth);
		el.title = "Min: "+cnThrLimits.MIN+", Max: "+cnThrLimits.MAX+" dBm";
		el.onchange = function(ev) {
			var target = this;
			var band = this.band;
			var ch = this.ch;
			var cn = parseInt(this.value);
			var simplex = (self.getSimplexMode(band) && self.factory.Simplex[band]);
			var sqth;
			if (self.squelchAdjBwModeRead(band) == 0) {	// normal
				sqth = self.squelchChThrGet(0,ch,band,1);	// UL ch band ADJ
			} else {					// filter based
				sqth = self.squelchChThrGet(0,0,band,0);	// UL ch0 band NB
			}
			var cnThrLimits = self.cnThresholdLimits(simplex, sqth);
			this.title = "Min: "+cnThrLimits.MIN+", Max: "+cnThrLimits.MAX+" dBm";
			if (cn < cnThrLimits.MIN) {
				cn = cnThrLimits.MIN;
				this.value = cn;
			} else if (cn > cnThrLimits.MAX) {
				cn = cnThrLimits.MAX;
				this.value = cn;
			}
		}
		if (self.factory.isClassB(band) && (self.config.squelchAdjBwMode[band]==1)){
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
	this.cnThresholdLimits = function(simplex, sqth) {
		var sqThrMin = self.config.sqThrLimits(simplex, 0, self.factory.ULlowGainMode).MIN;
		var sqThrMax = self.config.sqThrLimits(simplex, 0, self.factory.ULlowGainMode).MAX;
		var cnThrMin = self.CNminLimitdBm;
		// var cnThrMax = sqth - self.CNminToSqthrMinDifference;
		// el límite máximo de CN pasa a ser fijo como el máximo de squelch, sin depender del valor actual
		var cnThrMax = sqThrMax;
		return {MIN: cnThrMin, MAX: cnThrMax};
	}
	this.setCNThresholdLimits = function(band, na, ch, simplex, sqth){
		var cnThrLimits = self.cnThresholdLimits(simplex, sqth);
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
				// al hacer click en firstNet, no hay que actuar sobre el control channel de 700MHz
				return;
			}
			if (this.checked) {
				/* desactivar en el resto de canales de la banda*/
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
		for (var nbadj=0; nbadj < 2; nbadj++) {
			var maxch = (nbadj==0? self.maxChannels:self.config.ADJNR);
			for (var ch = 0; ch < maxch; ch++) {
				if ((nbAdjNr == nbadj) && (controlChNr == ch)) {
					continue;
				}
				var setChecked = false;
				if (band==0 && nbadj==1 && ch==0 && self.config.firstADJisFirstNet){
					setChecked = true;
				}
				try {
					var id = "controlCh_"+band+"_"+nbadj+"_"+ch;
					var el = document.getElementById(id);
					el.checked = setChecked;
				} catch(e){}
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
					maxCh = self.maxChannels;
					ch = controlCh;
				}
			} else {  // isADJ
				if ( !self.factory.adjBandEnabled[band] ) {
					isUnset = true;
				} else {
					maxCh = self.factory.numADJFilters;
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
			for (var ch = 0; ch < maxch; ch++) {
				var setChecked = false;
				if (!controlChNr.ISUNSET && 
				    ((controlChNr.ISNB && (nbadj==0)) ||
				     (!controlChNr.ISNB && (nbadj==1)) ) && 
				    (controlChNr.CHNR == ch) )
				{
					setChecked = true;
				}
				var setDisabled = false;
				if (band==0 && nbadj==1 && ch==0 && self.config.firstADJisFirstNet){
					setChecked = true;
					setDisabled = true;
				}
				try {
					var id = "controlCh_"+band+"_"+nbadj+"_"+ch;
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
	this.getControlChannelNr = function(band) {
		var controlChNr = 0;
		var isSet = false;
		var nbadj;
		for ( nbadj=0; nbadj < 2; nbadj++) {
			if ( ((nbadj==0) && !self.factory.chBandEnabled[band]) ||
			     ((nbadj==1) && !self.factory.adjBandEnabled[band])) {
				continue;
			}
			var maxch = (nbadj==0? self.maxChannels:self.config.ADJNR);
			for (var ch = 0; ch < maxch; ch++) {
				try {
					var id = "controlCh_"+band+"_"+nbadj+"_"+ch;
					var el = document.getElementById(id);
					if (el.checked) {
						isSet = true;
						controlChNr = ch+1;
						if (nbadj==1) {
							controlChNr = -controlChNr;
						}
						if (band==0 && nbadj==1 && ch==0 && self.config.firstADJisFirstNet){
							//firstnet siempre estará checkeado, pero puede haber otro adj de 700MHz también checkeado
							continue;
						}
						break;
					}
				} catch(e){}
			}
			if (isSet) {
				break;
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
			bsToolonload();
			self.bsToolWindowCheckConfigApplied();
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
			walkthroughonload();
			self.walkthroughToolWindowCheckConfigApplied();
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
		if ( !self.factory.extremeTempActionEnable ) {
			return 0;
		}
		try {
			var el = document.getElementById('bbuTypeOfConnection');
			return el.selectedIndex;
		} catch(err) { return 0; }
	}

	// this.opfModes = ['Automatic Shut Down', 'Run Isolation Meas.', 'Only Alarm'];
	this.opfModes = ['Automatic Shut Down', 'Run Isolation Meas.'];

	var self = this;
	this.pageTypes = {'NB': 0, 'ADJ': 1};
	this.pageType = 'undefined';
	this.FILTSEP90K = FILT90KSTEPKHZ;
	this.FILTSEPADJKHZ = 100;
	this.FILTSEPNBADJKHZ = 200;
	this.factory = null;
	this.tags = null;
	this.version = null;
	this.sernr = new SerialNrT();
	var freqStyle = [0,0];
	freqStyle[0] = parseInt(localStorage.getItem('freqStyle_0_'+Prjstr+window.location.host));
	freqStyle[1] = parseInt(localStorage.getItem('freqStyle_1_'+Prjstr+window.location.host));
	for (var band=0;band<2;band++){
		if (isNaN(freqStyle[band]) || freqStyle[band] != 0) {
			freqStyle[band] = 1;
		}
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
	this.maxChannels = 32;
	this.mainGainMax = [[0,0],[0,0]];
	this.ISOL_GAIN_MARGIN_OLD = 15;
	this.ISOL_GAIN_MARGIN_NEW = 20;
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
	h+='<th class="thdrht">700 MHz Narrow Band</th>';
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
	h+='<tr style="min-height:5px;"><td class="contentcell" colspan="8"> </tr>';
	h+='<tr id="walkthroughRowBand_1_0" style="display:none;">';
	h+='<td><input type="checkbox" id="walkthroughEnable_1_0" name="walkthroughEnable_1_0" value="" checked="true"></td>';
	h+='<th class="thdrht">800 MHz Narrow Band</th>';
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
	this.maxChannels = 32;
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
	this.setWarningMessage = function(fovlp, filtSepKhz, filtAdjSepKhz, filtNbAdjSepKhz, maxch, fact, uldlLinked,standardGUI) {
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
			var titles = ["<h3>CONFLICTING NARROW BAND FILTERS:</h3>","<h3>CONFLICTING ADJ.BW FILTERS:</h3>","<h3>CONFLICT BETWEEN NARROW AND ADJ.BW FILTERS:</h3>"];
			for (var k=0;k<3;k++){
				if (fovlp[2*k]['check'] || fovlp[2*k+1]['check']){
					message += titles[k];
					
					for (var band = 0; band < 2; ++band) {
						var showOnlyOneBand = (k>0) && uldlLinked[band];
						for (var b = 0; b < (showOnlyOneBand?1:2); ++b) {
							for (var c = 0; c < (k==0?maxch:fact.numADJFilters); ++c) {
								if (fovlp[2*k+band]['ovlp'][b][c].length == 0) {
									continue;
								}
								var bname = (b ? " Downlink":" Uplink");
								if (showOnlyOneBand) bname = " Uplink/Downlink";
								var msg = fact.bandNames[band]+ bname + (k==2?" ADJ.BW":"") +" Filter "
									+ (c+1) + " conflicts with " + (k==2?"narrow band ":"") + "filter(s) "; 
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
					if (k==0) message += self.filterWarnText(filtSepKhz);
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
	this.filterWarnText = function(filtSepKhz) {
		var str =
		"</br><h3>RULES FOR SETTING NARROW BAND FILTER FREQUENCIES</h3>"
		+ "As a general rule, the frequency difference between two filters must be "
		+ "equal or greater than 1.6 times the semi-sum of their bandwidths,</br>"
		+ "Example: Consider 2 filters with bandwidths 75 KHz and 50 KHz. "
		+ "The minimum frequency difference between these filters is 1.6·(75 + 50)/2 = 100KHz.</br>"
		+ "As an exception, several filters with smaller frequency difference "
		+ "can be combined to build a wider one, as long as they meet the following "
		+ "requirements:</br>"
		+ "1) All of them must have the same bandwidth setting.</br>"
		+ "2) The bandwidth setting must be 150 KHz.</br>"
		+ "3) All of them must have the same fine-gain setting.</br>"
		+ "4) The frequency separation must be: " + filtSepKhz +" KHz.";
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
		"</br><h3>RULES FOR SETTING ADJ.BW AND NARROW BAND FILTER FREQUENCIES</h3>"
		+ "The frequency separation between one ADJ.BW filter and a narrow band filter must be must be at least "
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
			$('#filtclass_'+k).val(this.cchExists[k]?(this.cchNa[k]==0?"Narrow Band":"Adj.Bw"):"-");
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
		if (this.factory.singleBandEnabled[0] || this.factory.singleBandEnabled[1]) this.maxChannels = 2*this.config.CHNR; 
		var k,p,na,c=0;
		for (var k=0;k<3;k++){	// 700,800,B14
			p=k;
			if (k==2) p=0; //resultados de band14 se toman de band0
			this.n[k][0] = this.numEnabledFilts(p,0);	// NB
			this.n[k][1] = this.numEnabledFilts(p,1);	// ADJ
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
			if (k==2 && this.config.firstADJisFirstNet && this.config.filterEnabled[1][0][1][0]) cch=-1
			if (Math.abs(cch)<(2*this.config.CHNR)){
				if (cch>0){
					na=0;
					c=cch-1;
					cchExists = this.config.filterEnabled[na][p][1][c];
				}
				if (cch<0){
					na=1;
					c=-cch-1;
					cchExists = this.config.filterEnabled[na][p][1][c];
				}
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
			$('#filtclass_'+k).val(this.cchExists[k]?(this.cchNa[k]==0?"Narrow Band":"Adj.Bw"):"-");
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
		var k,max,cchExists,c,na;
		for (k=0;k<2;k++){
			max=-140;
			cchExists = false;
			cch = self.config.controlChannel[k];
			if (k==0 && self.config.firstADJisFirstNet && cch==-1) cch=0; //se considera que no hay CCH si está fijado en Band14
			if (Math.abs(cch)<(2*self.config.CHNR)){
				if (cch>0){
					na=0;
					c=cch-1;
					cchExists = self.config.filterEnabled[na][k][1][c];
				}
				if (cch<0){
					na=1;
					c=-cch-1;
					cchExists = self.config.filterEnabled[na][k][1][c];
				}
			}
			if (cchExists){
				max = monitor.level[na][k][1][c];
				self.naComm[k]=na;
			}else{
				for (na=0;na<2;na++){
					for (c=0;c<(na==0?2*self.config.CHNR:factory.numADJFilters);c++){
						var isFn = (k==0 && c==0 && na==1 && self.config.firstADJisFirstNet)
						if (self.config.filterEnabled[na][k][1][c] && !isFn){
							if (monitor.level[na][k][1][c]>max) {
								max=monitor.level[na][k][1][c];
								self.naComm[k]=na;
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
	this.numEnabledFilts = function(band,na){
		var n=0;
		var num;
		if (na==0){
			num = this.factory.singleBandEnabled[band]?64:32;
		}else{
			num = this.factory.numADJFilters;
		}
		for (k=0;k<=num;k++){
			if (self.config.filterEnabled[na][band][1][k]) n++;
		}
		return n;
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
	this.NFPAcfg = new NFPAconf();
	this.maxChannels = this.config.CHNR;
	this.n = [[0,0], [0,0], [0,0]];	//700[NB,ADJ],800[NB,ADJ],Band14[NB,ADJ]
	this.bandEnabled = [false,false,false];	// 700,800,Band14
	this.cchExists = [false,false,false];	// 700,800,Band14
	this.cch = [0,0,0];	// 700,800,Band14
	this.cchNa = [0,0,0];	// 700,800,Band14
	this.naComm = [0,0,1];	// 700,800,Band14
	this.rssiComm = [-140,-140,-140];	// 700,800,Band14
	this.pmax = [0,0];	// 700,800
	this.n_retry = 0;
	this.isStatusUlGainRunning = false;
	this.showCh = [[false,false,false,false,false],[false,false,false,false,false]];
	this.firstGainCell = [-1,1];
	this.monitoring = false;
	this.showGainProposal = [false, false];
	this.gainProposal = [];
	this.gainUlNotEnough = [];
	this.levelUlMin =  [[128,128,128,128,128],[128,128,128,128,128]];
	
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
			var rspan = 0;
			self.firstGainCell[band] = -1;
			self.showCh[band][0] = self.factory.chBandEnabled[band] && (self.n[band][0] > 0);
			$('#walkthroughRowBand_'+band+'_0').css({"display":(self.showCh[band][0]?"table-row":"none")});
			if (self.showCh[band][0]) {
				cnfToSend.gain[band][0] = self.factory.gainlimit[2*band];
				/** use widest channel to set initial squelch threshold for walkthrough commissioning */
				var bwHz = self.getWidestNBfilterBw(band);
				//cnfToSend.sqChThreshold[0][band][0][0] = Math.ceil(-174+5+15+(10*Math.log(bwHz)/Math.LN10)); //CN=15dB contando NF=5dB
				rspan++;
				if (self.firstGainCell[band]<0) self.firstGainCell[band]=0;
			}
			for (var k=0; k<self.config.ADJNR;k++){
				self.showCh[band][1+k] = self.factory.adjBandEnabled[band] && self.config.filterEnabled[1][band][0][k];
				$('#walkthroughRowBand_'+band+'_'+(1+k)).css({"display":(self.showCh[band][1+k]?"table-row":"none")});
				if (self.showCh[band][1+k]){
					cnfToSend.gain[band][0] = self.factory.gainlimit[2*band];
					var bw = self.config.fstopHzAdjFilter[band][0][k] - self.config.fstartHzAdjFilter[band][0][k];
					//cnfToSend.sqChThreshold[1][band][0][k] = Math.ceil(-174+5+15+(10*Math.log(bw)/Math.LN10)); //CN=15dB contando NF=5dB
					rspan++;
					if (self.firstGainCell[band]<0) self.firstGainCell[band]=1+k;
				}
			}
			for (var k=0; k<1+self.config.ADJNR; k++) {
				var show = (k==self.firstGainCell[band]);
				$('#gainCurrent_'+band+'_'+k).css({"visibility":(show?"visible":"hidden")});
				$('#gainProposal_'+band+'_'+k).css({"visibility":(show?"visible":"hidden")});
			}
		}
		this.commULGainConfigSet();
		this.commULSquelchThresholdConfigSet();
		if (this.monitoring) this.load_status();
		for (var band=0;band<2;band++){
			for (var k=0;k<1+self.config.ADJNR;k++){
				$('#squelchThreshold_'+band+'_'+k).prop("disabled", true);
				$('#squelchThreshold_'+band+'_'+k).css("backgroundColor", '#cccccc');
				$('#gainCurrent_'+band+'_'+k).prop("disabled", true);
				$('#gainCurrent_'+band+'_'+k).css("backgroundColor", '#cccccc');
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
		if (this.factory.singleBandEnabled[0] || this.factory.singleBandEnabled[1]) this.maxChannels = 2*this.config.CHNR; 
		var k,p,na,c=0;
		for (var k=0;k<3;k++){	// 700,800,B14
			p=k;
			if (k==2) p=0; //resultados de band14 se toman de band0
			this.n[k][0] = this.numEnabledFilts(p,0);	// NB
			this.n[k][1] = this.numEnabledFilts(p,1);	// ADJ
		}
	}
	this.commUlGainSetSquelchAndGain = function(ev){
		cnfToSend = new ConfigBDA();
		cnfToSend.parse(self.config.frm);
		for (var band=0;band<2;band++){
			for (var k=0;k<(1+self.config.ADJNR);k++){
				try {
					var v=parseInt($('#squelchThreshold_'+band+'_'+k).val());
					var nbadj = (k==0?0:1);
					var ch = (k==0?0:(k-1));
					cnfToSend.sqChThreshold[nbadj][band][0][ch] = v;
				}catch(e){}
			}
			try{
				var k=self.firstGainCell[band];
				if (k<0) k=0;
				var v=parseInt($('#gainCurrent_'+band+'_'+k).val());
				cnfToSend.gain[band][0] = v;
			}catch(e){}
		}
		self.clearFineGains(cnfToSend);
		showResultIcon(ERR_PENDING);
		self.disableAllButtons();
		$("#ctl_conf_str").val(cnfToSend.getFrm());
		$.post( "start.zhtml", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
			n_retry=0;
			setTimeout(function() { self.check_result(WAITINGACKSETSQUELCH); }, 1000);
		});
	}
	this.commUlGainStart = function(ev){
		cnfToSend = new ConfigBDA();
		cnfToSend.parse(self.config.frm);
		if (!self.isStatusUlGainRunning){
			$(this).val("Start");
			cnfToSend.automatic_ul_gain_reset = true;	// reset minholds al iniciar
			cnfToSend.automatic_ul_gain_running = true;
			self.clearFineGains(cnfToSend); // por si acaso no se ha pulsado antes "Set Squelch"
			self.isStatusUlGainRunning = true;
			self.disableAllButtons();
			this.levelUlMin = [[128,128,128,128,128],[128,128,128,128,128]];
		} else {
			$(this).val("Stop");
			cnfToSend.automatic_ul_gain_running = false;
			self.isStatusUlGainRunning = false;
			self.disableAllButtons();
		}
		for (var k=0;k<3;k++){
			$("#gainProposal_"+k).val('');
		}
		showResultIcon(ERR_PENDING);
		$("#ctl_conf_str").val(cnfToSend.getFrm());
		$.post( "start.zhtml", { ctl_conf_str: cnfToSend.getFrm()}).done(function( data ) {
			n_retry=0;
			setTimeout(function() { self.check_result(WAITINGACKULGAINRESET); }, 1000);
		});
	}
	this.clearFineGains = function(conf){
		for (var band=0;band<2;band++){
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
				var srNFPA = srarr[6]; 
				self.config.parse(srConf);
				self.factory.parse(srFact);
				self.NFPAcfg.parse(srNFPA);
				
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
			for(var k=0;k<1+self.config.ADJNR;k++){
				$('#gainCurrent_'+band+'_'+k).val(gain);
			}
		}
		for (var band=0;band<2;band++){
			var gain = self.config.gain[band][0].toFixed(0);
			for(var k=0;k<1+self.config.ADJNR;k++){
				var max = self.factory.gainlimit[2*band];
				var min = self.factory.gainlimit[2*band]+self.config.GmainRange[0];
				var title = "Min: "+min+", Max: "+max+" dBm";
				$('#gainCurrent_'+band+'_'+k).prop("title",("Min: "+min+", Max: "+max+" dBm"));
				$('#gainCurrent_'+band+'_'+k).prop("min",min);
				$('#gainCurrent_'+band+'_'+k).prop("max",max);
				$('#gainCurrent_'+band+'_'+k).change(function(){
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
			var simplex = self.config.simplexMode[band] && self.factory.Simplex[band];
			for(var k=0;k<1+self.config.ADJNR;k++){
				var min = self.config.sqThrLimits(simplex, 0, self.factory.ULlowGainMode).MIN;
				var max = self.config.sqThrLimits(simplex, 0, self.factory.ULlowGainMode).MAX;
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
	 	var p,na;
		var gain = [[0,0,0,0,0],[0,0,0,0,0]];
		var n=[0,0];
		var pmax=[0,0];
		var levelminband = [[-128,-128,-128,-128,-128],[-128,-128,-128,-128,-128]];
		var levelmaxband =  [[-128,-128,-128,-128,-128],[-128,-128,-128,-128,-128]];
		var gainUlProposal = [0,0];
		var enabled = [false,false];
		var isCallsMade = [false,false,false,false,false];
		var gainmargin = 0; // margen en dB para no reducir cobertura
		var mingain;
		var maxAllowComm = [];
		var isMakeProposal = [[false,false,false,false,false],[false,false,false,false,false]];
		var squelchProposal = [[-128,-128,-128,-128,-128],[-128,-128,-128,-128,-128]];
		self.gainUlNotEnough = [];
		for (var band=0;band<2;band++){
			self.gainUlNotEnough.push([]);
			for (var k=0; k<(1+self.config.ADJNR);k++){
				self.gainUlNotEnough[band].push(false);
			}
		}
		for (var band=0;band<2;band++){
			maxAllowComm[band]=self.monitor.maxAllowGain[band];
			mingain = self.factory.gainlimit[2*band]+self.config.GmainRange[band];
			n[0] = self.numEnabledFilts(band,0);
			n[1] = self.numEnabledFilts(band,1);
			enabled[band] = (self.factory.chBandEnabled[band] && n[0]>0) || (self.factory.adjBandEnabled[band] && n[1]>0);
			gainUlProposal[band] = mingain;
			if (enabled[band]){
				for (na=0;na<2;na++){
					pmax[na] = self.config.power[band][0];
					if (self.factory.chBandEnabled[band] && n[0]>0 && self.factory.adjBandEnabled[band] && n[1]>0) pmax[na]-=3;
					if (n[na]>1){
						pmax[na]-=(10*Math.log((n[na]))/Math.LN10);
					}
				}
				for (var k=0; k<(1+self.config.ADJNR);k++){
					// nivel de entrada mínimo
					levelminband[band][k]= self.monitor.level_in_ul_minmax[band][k][0];
					//levelmaxband[band][k]=parseFloat($("#levelMax_"+band+"_"+k).val());
					isCallsMade[k]=(levelminband[band][k]!=-128);
					if (isCallsMade[k] && (self.levelUlMin[band][k]>levelminband[band][k])){
						self.levelUlMin[band][k] = levelminband[band][k];
					}
					gain[band][k] = Math.round(pmax[k==0?0:1]-levelminband[band][k]+gainmargin);
					if (gain[band][k]>self.factory.gainlimit[2*band]){
						gain[band][k]=self.factory.gainlimit[2*band];
						if (isCallsMade[k]) self.gainUlNotEnough[band][k] = true;
					}
					if (gain[band][k]>maxAllowComm[band]){
						gain[band][k]=maxAllowComm[band];
						if (isCallsMade[k]) self.gainUlNotEnough[band][k] = true;
					}
					if (gain[band][k]<mingain) gain[band][k] = mingain;
					// máximo de las ganancias de canales activos y seleccionados
					isMakeProposal[band][k] = $("#walkthroughEnable_"+band+"_"+k).prop("checked");
					if (isMakeProposal[band][k] && self.showCh[band][k] && isCallsMade[k]) {
						if (gainUlProposal[band] < gain[band][k]){
							gainUlProposal[band] = gain[band][k];
						}
					}
					self.gainProposal[band] = gainUlProposal[band];
					// squelch inicializado con valor de configuración
					if (k==0){
						squelchProposal[band][k] = self.config.sqChThreshold[0][band][0][0];
					} else {
						squelchProposal[band][k] = self.config.sqChThreshold[1][band][0][k-1];
					}
					// modificar solamente donde aplique
					if (isMakeProposal[band][k] && self.showCh[band][k] && isCallsMade[k]) {
						// margen de 10dB respecto al nivel mínimo de entrada
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
				self.showGainProposal[band] = false;
				for (var k=0; k<(1+self.config.ADJNR);k++){
					if (isMakeProposal[band][k] && self.showCh[band][k] && isCallsMade[k]) self.showGainProposal[band] = true;
				}
				for (var k=0; k<(1+self.config.ADJNR);k++){
					$("#gainProposal_"+band+"_"+k).val(self.showGainProposal[band]?gainUlProposal[band].toFixed(0):'---');
				}
			}
		}
		self.showGainBsWarning();
	}
	this.commUlGainSquelchApply = function(ev){
		var levelminband = [[-128,-128,-128,-128,-128],[-128,-128,-128,-128,-128]];
		var levelmaxband =  [[-128,-128,-128,-128,-128],[-128,-128,-128,-128,-128]];
		var isMakeProposal = [[false,false,false,false,false],[false,false,false,false,false]];
		var isCallsMade = [false,false,false,false,false];
		var enabled = [false,false];

		var sendNewConf = false;
		var cnfToSend = new ConfigBDA();
		cnfToSend.parse(self.config.frm);

		var result = JSON.parse(localStorage.getItem("commResult"));
		for (var band=0;band<2;band++){
			var applyGain = false;
			var g;
			for (var k=0; k<(1+self.config.ADJNR);k++){
				levelminband[band][k]=self.monitor.level_in_ul_minmax[band][k][0];
				//levelmaxband[band][k]=parseFloat($("#levelMax_"+band+"_"+k).val());
				isCallsMade[k]=(levelminband[band][k]!=-128);
				isMakeProposal[band][k] = $("#walkthroughEnable_"+band+"_"+k).prop("checked");
				if (isMakeProposal[band][k] && self.showCh[band][k] && isCallsMade[k]) {
					var v = ~~Math.round(parseFloat($("#sqThrProposal_"+band+"_"+k).val()));
					if (k==0){
						cnfToSend.sqChThreshold[0][band][0][0] = v;
					} else {
						cnfToSend.sqChThreshold[1][band][0][k-1] = v;
					}
					applyGain = true;
					g = ~~Math.round(parseFloat($("#gainProposal_"+band+"_"+k).val()));
					sendNewConf = true;
				}
			}
			if (applyGain) cnfToSend.gain[band][0] = g;
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
	this.numEnabledFilts = function(band,na){
		var n=0;
		var num;
		if (na==0){
			num = this.factory.singleBandEnabled[band]?64:32;
		}else{
			num = this.factory.numADJFilters;
		}
		for (k=0;k<=num;k++){
			if (self.config.filterEnabled[na][band][1][k]) n++;
		}
		return n;
	}
	this.showGainBsWarning = function(){
		for (var band=0;band<2;band++){
			var showWarningBsGain = false;
			if (self.showGainProposal[band]) {
				for (var k=0; k<(1+self.config.ADJNR);k++){
					if (k==0 && (!self.factory.chBandEnabled[band] || self.numEnabledFilts(band,0)==0) || 
						k>0 && (!self.factory.adjBandEnabled[band] || !self.config.filterEnabled[1][band][1][k-1]))
						{
							continue;
						}
					var bandBS = band;
					if (band==0 && k==1 && self.config.firstADJisFirstNet && self.config.filterEnabled[1][0][1][0]){
						bandBS = 2;
					}
					if (self.gainUlNotEnough[band][k])
					{
						showWarningBsGain = true;
					}
				}
			}
			$("#wtWarningBand_"+band).css("display",showWarningBsGain?"table-row":"none");
			if (typeof(redrawWTTable)!=="undefined") redrawWTTable();
		}
	}
}