var hpa_settings = [{min: -20, low_alarm: -128, low_warn: -128, high_warn: 19, high_alarm: 22, max: 25 },
		    {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 45 }];
var board_temp_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 80, high_alarm: 85, max: 90 };
var chRfIn_settings = [{min: -110, low_alarm: -121, low_warn: -121, high_warn: 0, high_alarm: 0, max: 0 }, 
		       {min:  -80, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 }];

var agc_settings = [{min: 0, low_alarm: 0, low_warn: 0, high_warn: 300, high_alarm: 300, max: 80 },
		    {min: 0, low_alarm: 0, low_warn: 0, high_warn: 300, high_alarm: 300, max: 80 }];
var chRfIn_settings_adj = [{min: -100, low_alarm: -121, low_warn: -121, high_warn: 0, high_alarm: 0, max: 0 }, 
		{min:  -80, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 }];

function Page() {
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
			var unit = self.createUnit();
			rootEl.appendChild(unit);
			
		}
		self.showTag();
		self.showFreqs();
		self.showConfs();
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
		//var headDiv = this.createBandHead("ALARM INTERFACE");
		//headDiv.id = "headDivAlarm";
		//unitDiv.appendChild(headDiv);		
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDivAlarm";
		var tab = this.createAlarmInterface();
		contentDiv.appendChild(tab);
		headDiv.style.display = "block";
		contentDiv.style.display = "block";
		
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
			headDiv.style.display = "none";
			contentDiv.style.display = "none";
		}
		return unitDiv;
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
		
		var cell = this.createRFConfiguration();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		
		var cell = this.createMonitoring();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		
		var cell = this.createAlarmTable();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		
		var cell = self.factory.oscFeatureEnable?this.createOPFContent():this.createAutoPaUlOffContent();
		cell.className = "contentcell";
		cell.style.display = "none"; //SCA
		rowb.appendChild(cell);
		
		var cell = this.createRelayTable();
		rowb.appendChild(cell);
		cell.className = "contentcell";
		
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		var cell = self.factory.oscFeatureEnable?this.createAutoPaUlOffContent():this.createExtremeTempActionContent();
		cell.className = "contentcell";
		cell.style.display = "none"; //SCA
		rowb.appendChild(cell);	

		
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);		
		var cell = self.factory.oscFeatureEnable?this.createExtremeTempActionContent():this.createOPFContent();
		cell.className = "contentcell";
		cell.style.display = "none"; //SCA
		rowb.appendChild(cell);

		return tab;
	}
	this.createRFConfiguration = function(){
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
		cell.innerHTML = "CONFIGURATION";
		cell.colSpan = 3;
		row.appendChild(cell);
		var row = document.createElement("tr");
		row.style.height = "10px";
		tb.appendChild(row);
		var band,b,c;
		for (band=0;band<2;band++){
			for (b=0;b<2;b++){
				var noShow = (!self.factory.chBandEnabled[band] && !self.factory.adjBandEnabled[band]) || b!=self.factory.uldl;
				//PA ENABLED
				var row = this.createHpaCtl(b,band);
				if (noShow) row.style.display = "none";
				tb.appendChild(row);
				//PA STATUS
				var row = document.createElement("tr");
				if (noShow) row.style.display = "none";
				tb.appendChild(row);
				var cell = document.createElement("th");
				cell.innerHTML = "PA State";
				cell.className = "thr";
				cell.style.paddingRight = "10px";
				row.appendChild(cell);
				row.appendChild(createLedBoxWithText("paState_"+band+"_"+b));
				for (c=0;c<2;c++){
					//FREQUENCY
					var row = document.createElement("tr");
					if (noShow) row.style.display = "none";
					if (c==1 && !self.factory.secondCH) row.style.display = "none";
					tb.appendChild(row);
					var cell = document.createElement("th");
					cell.innerHTML = "Frequency";
					cell.className = "thr";
					cell.style.paddingRight = "10px";
					row.appendChild(cell);
					row.appendChild(this.createFiltFrequency(b, c, band));
					var cell = document.createElement("th");
					cell.innerHTML = "MHz";
					cell.className = "thdrht";
					row.appendChild(cell);
					//BANDWIDTH
					var row = document.createElement("tr");
					if (noShow) row.style.display = "none";
					if (c==1 && !self.factory.secondCH) row.style.display = "none";
					tb.appendChild(row);
					var cell = document.createElement("th");
					cell.innerHTML = "Bandwidth";
					cell.style.paddingRight = "10px";
					cell.className = "thr";
					row.appendChild(cell);
					row.appendChild(this.createChBw(b, c, band));
					var cell = document.createElement("th");
					cell.innerHTML = "KHz";
					cell.className = "thdrht";
					row.appendChild(cell);
				}
				//MAIN GAIN
				var row = this.createMainGainLim(b,band);
				if (noShow) row.style.display = "none";
				tb.appendChild(row);
				//POWER LIMIT
				var row = this.createMainPowerLim(b,band);
				if (noShow) row.style.display = "none";
				tb.appendChild(row);
				//SQUELCH ENABLE
				var row = document.createElement("tr");
				if (noShow) row.style.display = "none";
				tb.appendChild(row);
				var cell = document.createElement("th");
				cell.innerHTML = "Squelch Enable";
				cell.className = "thr";
				cell.style.paddingRight = "10px";
				row.appendChild(cell);
				row.appendChild(this.createChSquelchEnable(b,0,band,0));
				//SQUELCH THRESHOLD
				var row = document.createElement("tr");
				if (noShow) row.style.display = "none";
				tb.appendChild(row);
				var cell = document.createElement("th");
				cell.innerHTML = "Squelch Threshold";
				cell.className = "thr";
				cell.style.paddingRight = "10px";
				row.appendChild(cell);
				row.appendChild(this.createChSquelchThreshold(b,0,band,0));
				var cell = document.createElement("th");
				cell.innerHTML = "dBm";
				cell.className = "thdrht";
				row.appendChild(cell);
				
			}
		}
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("td");
		cell.appendChild(this.createUnitReset());
		cell.colSpan = 3;
		row.appendChild(cell);
		return cellb;
	}
	this.createMonitoring = function(){
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
		cell.innerHTML = "MONITORING";
		cell.colSpan = 4;
		row.appendChild(cell);
		var row = document.createElement("tr");
		row.style.height = "10px";
		tb.appendChild(row);
		var band,b,c;
		for (band=0;band<2;band++){
			for (b=0;b<2;b++){
				for (c=0;c<2;c++){
					var noShow = (!self.factory.chBandEnabled[band] && !self.factory.adjBandEnabled[band]) || b!=self.factory.uldl || (c==1 && !factory.secondCH);
					//SIGNAL DETECTION
					var row = document.createElement("tr");
					if (noShow) row.style.display = "none";
					tb.appendChild(row);
					var cell = document.createElement("th");
					cell.innerHTML = "Signal IN";
					cell.className = "thr";
					cell.style.paddingRight = "10px";
					row.appendChild(cell);
					row.appendChild(this.createSignalDetect(b,c,band,0));
					row.style.height = "20px";
					//INPUT Power
					var row = document.createElement("tr");
					if (noShow) row.style.display = "none";
					tb.appendChild(row);
					var cell = document.createElement("th");
					cell.innerHTML = "Power IN";
					cell.className = "thr";
					cell.style.paddingRight = "10px";
					row.appendChild(cell);
					row.appendChild(this.createMetPowIn(b,c,band,0));
					row.appendChild(this.createTextPowIn(b,c,band,0,1));
					var cell = document.createElement("th");
					cell.innerHTML = "dBm";
					cell.className = "thdrht";
					row.appendChild(cell);
					row.style.height = "20px";
					//GAIN
					var maxGain = self.factory.gainlimit[2*band+b]
					var minGain = maxGain - 100;
					var chRfGainSettings = {min: minGain, low_alarm: minGain, low_warn: minGain, high_warn: maxGain, high_alarm: maxGain, max: maxGain };
					row = createMetRow("rfChGain_"+b+"_"+c+"_"+band, chRfGainSettings, "Gain", "dB");
					if (noShow) row.style.display = "none";
					tb.appendChild(row);
					row.style.height = "20px";
					//OUTPUT Power
					var row = document.createElement("tr");
					if (noShow) row.style.display = "none";
					tb.appendChild(row);
					var cell = document.createElement("th");
					cell.innerHTML = "Power OUT";
					cell.className = "thr";
					cell.style.paddingRight = "10px";
					row.appendChild(cell);
					row.appendChild(this.createMetPowOut(b,c,band,0));
					row.appendChild(this.createTextPowOut(b,c,band,0,0));
					var cell = document.createElement("th");
					cell.innerHTML = "dBm";
					cell.className = "thdrht";
					row.appendChild(cell);
					row.style.height = "20px";
					//AGC
					var row = document.createElement("tr");
					if (noShow) row.style.display = "none";
					tb.appendChild(row);
					var cell = document.createElement("th");
					cell.innerHTML = "AGC";
					cell.className = "thr";
					cell.style.paddingRight = "10px";
					row.appendChild(cell);
					row.appendChild(this.createMetAgc(b,c,band,0));
					row.appendChild(this.createTextAgc(b,c,band,0,0));
					var cell = document.createElement("th");
					cell.innerHTML = "dB";
					cell.className = "thdrht";
					row.style.height = "20px";
					row.appendChild(cell);
				}
			}
		}
		//TEMPERATURE
		var row = this.createTempBoard();
		row.style.height = "20px";
		tb.appendChild(row);
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
		cell.innerHTML = "ALARMS";
		cell.colSpan = 2;
		row.appendChild(cell);
		var row = document.createElement("tr");
		row.style.height = "10px";
		tb.appendChild(row);
		tb.appendChild(this.createGralAlarm(0,self.NFPA.alarmNames[0][0],self.NFPA.globalAlarmsEnabled[0]));
		var show = [false,false];
		for (var band=0;band<2;band++){
			show[band] = self.factory.chBandEnabled[band] || self.factory.adjBandEnabled[band];
			tb.appendChild(this.createBandAlarm(band,1,self.NFPA.alarmNames[1][1],show[band] && self.NFPA.bandAlarmsEnabled[1]));
			tb.appendChild(this.createBandAlarm(band,5,self.NFPA.alarmNames[1][5],show[band] && self.NFPA.bandAlarmsEnabled[5]));
			tb.appendChild(this.createBandAlarm(band,3,self.NFPA.alarmNames[1][3],show[band] && self.NFPA.bandAlarmsEnabled[3]));
			tb.appendChild(this.createBandAlarm(band,4,self.NFPA.alarmNames[1][4],show[band] && self.NFPA.bandAlarmsEnabled[4]));
		}
		tb.appendChild(this.createGralAlarm(5,self.NFPA.alarmNames[0][5],self.NFPA.globalAlarmsEnabled[5])); 
		for (var band=0;band<2;band++) tb.appendChild(this.createBandAlarm(band,6,self.NFPA.alarmNames[1][6],show[band] && self.NFPA.bandAlarmsEnabled[6]));
		tb.appendChild(this.createGralAlarm(1,self.NFPA.alarmNames[0][1],self.NFPA.globalAlarmsEnabled[1]));
		for (var band=0;band<2;band++) tb.appendChild(this.createBandAlarm(band,2,self.NFPA.alarmNames[1][2],show[band] && self.NFPA.bandAlarmsEnabled[2]));
		/*for (var k=0;k<self.NFPA.globalAlarmsInstalled.length;k++){
			tb.appendChild(this.createGralAlarm(k,self.NFPA.alarmNames[0][k],self.NFPA.globalAlarmsInstalled[k]));
		}*/
		/*for (var band=0;band<2;band++){
			show = self.factory.chBandEnabled[band] || self.factory.adjBandEnabled[band];
			for (var k=0;k<self.NFPA.bandAlarmsInstalled.length;k++){
				tb.appendChild(this.createBandAlarm(band,k,self.NFPA.alarmNames[1][k],show && self.NFPA.bandAlarmsInstalled[k]));
			}
		}	*/
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
		row.style.height = "5px";
		tb.appendChild(row);
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
		for (var k=0;k<8;k++){
			var row = document.createElement("tr");
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
		var row = document.createElement("tr");
		row.style.height = "10px";
		tb.appendChild(row);
		return cellb;
	}
	this.relayStateSet=function(nrelay,openclose,onoff){
		var el = document.getElementById("relStat_"+nrelay);
		el.innerHTML = onoff?"Alarm<br/>ON":"Alarm<br/>OFF";
		el = document.getElementById("relStatImg_"+nrelay);
		el.innerHTML = "<img src="+(openclose?"open":"closed")+".png><br>"+(openclose?"Open":"Closed");
		el.style.color = onoff?'#ffffff':'#000000';
		el.style.backgroundColor = onoff?"#e20000":"white";
		
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
		var tb = document.createElement("tb");
		tb.id = "TableFilter_"+band+"_"+nbadj;
		mainTbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		for (var i = 0; i < 3; ++i) {
			var cell = document.createElement("td");
			row.appendChild(cell);
			cell.appendChild(this.createFilterTable(i,band,nbadj));
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
		cell.style.display = "none";//forced SCA
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "15px";
		cell.appendChild(this.createMuteMode(band));
		cell.style.display = "none";//forced SCA
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "15px";
		cell.appendChild(this.createSimplex(band));
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		cell.style.paddingLeft = "20px";
		var showSimplex = self.factory.Simplex[band];
		var sz = self.getGralConfCellSize(showSimplex);
		cell.style.width = sz;



		row = document.createElement("tr");
		body.appendChild(row);
		if (self.factory.adjBandEnabled[band]){
			var celladj = document.createElement("td");	
			row.appendChild(celladj);
			celladj.appendChild(this.createShowFiltAdjTable(band));			
			celladj.colSpan = 5;
			celladj.style.paddingRight = "10px";			
		}
		if (self.factory.chBandEnabled[band]){
			var cellch = document.createElement("td");	
			row.appendChild(cellch);
			cellch.appendChild(this.createShowFiltTable(band));			
			cellch.colSpan = 5;
			cellch.style.paddingRight = "10px";
		}
		if (self.factory.adjBandEnabled[band] && self.factory.chBandEnabled[band]){
			celladj.colSpan = 1;
			cellch.colSpan = 4;
		}
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
		tab.style.display = "none";//SCA
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
		return tab;
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
		for (var r = 0; r < max; r++) {//r=2 SCA
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
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "G(dB)";
		td.style.display="none";//SCA
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
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "AGC/ch(dB)";
		td.colSpan = 2;
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "SQ(dBm)";
		if (!(nbadj==1 || b==2)) td.style.display = "none";
		td.colSpan = 2;
	
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
		if (nbadj==1){
			chFiltRow.appendChild(this.createAdjFr(b, c, 0, band));
			chFiltRow.appendChild(this.createAdjFr(b, c, 1, band));
		}else{
			if (c>1){
				chFiltRow.appendChild(this.createFiltFrequency(b, c, band));
				chFiltRow.appendChild(this.createChBw(b, c, band));
			}			
		}
		chFiltRow.appendChild(this.createGfine(b, c, band, nbadj));
		if (nbadj==0 && c>0){
			chFiltRow.appendChild(this.createMetPowIn(b, c, band, nbadj));
			chFiltRow.appendChild(this.createTextPowIn(b, c, band, nbadj,1));
			chFiltRow.appendChild(this.createSignalDetect(b, c, band, nbadj));
			chFiltRow.appendChild(this.createMetPowOut(b, c, band, nbadj));
			chFiltRow.appendChild(this.createTextPowOut(b, c, band, nbadj,0));
			chFiltRow.appendChild(this.createMetAgc(b, c, band, nbadj));
			chFiltRow.appendChild(this.createTextAgc(b, c, band, nbadj,0));
		}
		if (nbadj==1 || b==1){
			if (nbadj==0 && c>0){
				chFiltRow.appendChild(this.createChSquelchEnable(b, c, band, nbadj));
				chFiltRow.appendChild(this.createChSquelchThreshold(b, c, band, nbadj));
			}
		}
	}
	this.createFiltFrequency = function(b, c, band) {
		var cell = document.createElement("td");
		var fr = document.createElement("input")
		fr.type = "text";
		fr.id = "chFreq_"+c+"_"+b+"_"+band;
		fr.name = fr.id;
		fr.style.width = "70px";
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
		cell.style.display = "none";//SCA
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
		var row = createMetRow("boardTemp", board_temp_settings, "Temperature", "&ordm;C");
		return row;
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
		var row = this.createEqBw(dn,band);
		row.style.display = "none";//SCA
		body.appendChild(row);
		if (dn==1){
			row = this.createEqSq(band);
			row.style.display = "none";//SCA
			body.appendChild(row);
		}
		var bbAgcSettings = {min: 0, low_alarm: -128, low_warn: -128, high_warn: 127, high_alarm: 127, max: 32};
		row = createMetRow("bbAgc_"+band+"_"+dn, bbAgcSettings, "Broadband&nbsp;AGC", "dB");
		row.style.display = "none";//SCA
		body.appendChild(row);
		return box;
	}
	this.createBandOutBox = function(dn,band) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var body = document.createElement("tbody");
		tab.appendChild(body);	
		hpa_settings[dn].max = this.factory.powerlimit[2*band+dn] + this.factory.MAX_PWR_DELTA;
		hpa_settings[dn].min = hpa_settings[dn].max - 45;
		hpa_settings[dn].high_warn = this.factory.powerlimit[2*band+dn];
		hpa_settings[dn].high_alarm = this.factory.powerlimit[2*band+dn] + this.factory.MAX_PWR_DELTA;
		row = createMetRow("rfOutPow_"+band+"_"+dn, hpa_settings[dn], Texts['POWER'], "dBm");
		body.appendChild(row);
		row = document.createElement("tr");
		body.appendChild(row);
		return box;
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
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "All&nbsp;Filters&nbsp;Same&nbsp;Squelch&nbsp;Settings";
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
		return row
	}	
	this.createEqBw = function(dn, band) {
		var row = document.createElement("tr");
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
		return row
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
		var cell = document.createElement("tr");
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
		return cell;
	}
	this.createChSquelchThreshold = function(dn,ch,band,nbadj) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "sqThr_"+nbadj+"_"+band+"_"+dn+"_"+ch;
		el.name = el.id;
		el.type = "text";
		el.style.width = "70px";
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
			if (!self.eqSqIsSet(band) || nbadj==1 || dn ==0) {
				return;
			}
			self.equalSqAllCh(ch, band);			
		}
		cell.appendChild(el);
		return cell;
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
		cell.className = "thr";
		cell.style.paddingRight = "10px";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "mainGainLimit_"+band+"_"+dn;
		el.name = el.id;
		el.type = "text";
		el.style.width = "70px";
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
		cell.className = "thdrht";
		cell.style.fontWeight = "bold";
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
			self.mainGainMax[band][b] = maxgain;
			var title = "Min: "+mingain+", Max: " +
				self.mainGainMax[band][b]+" dB";
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
		cell.style.paddingRight = "10px";
		cell.className = "thr";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "mainPowerLimit_"+band+"_"+dn;
		el.name = el.id;
		el.type = "text";
		el.style.width = "70px";
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
		cell.className = "thdrht";
		cell.style.fontWeight = "bold";
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
		cell.innerHTML = "PA Enable"
		cell.className = "thr";
		cell.style.paddingRight = "10px";
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
		if (monitor.gralAlarm[5]){ //Comm. Error
			ledSetColor("paState_"+band+"_"+b, "grey");
			document.getElementById("paState_"+band+"_"+b+"_span").innerHTML = "Comm. Error";
		}else{
			ledSetColor("paState_"+band+"_"+b, monitor.statePaOn[band][b]?"green":"red");
			document.getElementById("paState_"+band+"_"+b+"_span").innerHTML = monitor.statePaOn[band][b]?"ON":"OFF";
		}
	}
	this.BWtable = [
		{ix:   0, include: true, value:   0, txt: "90", khz:  90.0},
		{ix:   1, include: true, value:   1, txt: "45", khz:  45.0},
		{ix:   2, include: true, value:   2, txt: "30", khz:  30.0},
		{ix:   3, include: true, value:   3, txt: "20", khz:  20.0},
		{ix:   4, include: true, value:   4, txt: "15", khz:  15.0},
		{ix:   5, include: true, value:   5, txt: "25 Hi Sel", khz:  25.0},
		{ix:   6, include: true, value:   6, txt: "12.5 Hi Sel", khz:  12.5},
		{ix:   7, include: false, value:   7, txt: "6.25 Hi Sel", khz:  6.25},
	];
	this.createChBw = function(b, c, band) {
		var cell = document.createElement("td");
		var el = document.createElement("select");
		cell.appendChild(el);
		el.id = "chBw_"+c+"_"+b+"_"+band;
		el.name = el.id;
		el.className = "centered";
		el.style.fontSize = "10px";
		el.style.minWidth = "70px";
		el.style.disabled = "false";
		for (var i = 0; i < this.BWtable.length; i++) {
			if (!this.BWtable[i].include) {
				continue;
			}
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = this.BWtable[i].txt;
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
		var chRfOut_settings = {min: -20, low_alarm: -20, low_warn: -20, high_warn: self.factory.powerlimit[2*band+b], high_alarm: self.factory.powerlimit[2*band+b]+self.factory.MAX_PWR_DELTA, max: 45 };
		return createMetCell("rfOutPow_"+c+"_"+b+"_"+band+"_"+nbadj, chRfOut_settings);
	}
	this.createTextPowOut = function(b, c, band, nbadj,w) {
		return createTextCell("rfOutPow_"+c+"_"+b+"_"+band+"_"+nbadj,w);
	}
	this.rfChOutPowSet = function(b, c, band, nbadj, val, isOn) {
		var id = "rfOutPow_"+c+"_"+b+"_"+band+"_"+nbadj;
		if (isOn) {
			setMetValue(id, val);//SCA: if is ON, bar color is defined by chRfOut_settings
		} else {
			setMetValue(id, "OFF", "warning");
		}
	}
	this.createMetAgc = function(b, c, band, nbadj) {
		return createMetCell("agc_"+c+"_"+b+"_"+band+"_"+nbadj, agc_settings[b]);
	}
	this.createTextAgc = function(b, c, band, nbadj, w) {
		return createTextCell("agc_"+c+"_"+b+"_"+band+"_"+nbadj,w);
	}
	this.agcSet = function(b, c, band, nbadj, val) {
		setMetValue("agc_"+c+"_"+b+"_"+band+"_"+nbadj, val);
		if (nbadj==0 && c<2)
		setMetValue("rfChGain_"+b+"_"+c+"_"+band, self.config.gain[band][b]-val);
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
		var cnf = new Config();
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

	this.displayFilters = function(band) {
		var shownb = false;
		var showadj = false;
		for (var c=0;c<self.maxChannels;c++){
			if (self.showFiltersMask[0][band][c]) shownb = true;
		}
		shownb = (self.factory.chBandEnabled[band]) && shownb;
		for (var c=0;c<self.factory.numADJFilters;c++){
			if (self.showFiltersMask[1][band][c]) showadj = true;
		}
		showadj = (self.factory.adjBandEnabled[band]) && showadj;
		var el = document.getElementById("TableFilter_"+band+"_0");
		el.style.display = (shownb) ? "table" : "none";
		el = document.getElementById("TableFilter_"+band+"_1");
		el.style.display = (showadj) ? "table" : "none";		
		el = document.getElementById("filtersRow_"+band);
		el.style.display = (showadj||shownb) ? "table-row" : "none";
	}
	this.computeShowOpfSettings = function() {
		return self.factory.oscFeatureEnable;
	}
	this.computeShowExtremeTempAction = function() {
		return self.factory.extremeTempActionEnable;
	}
	this.showConfs = function() {
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
		//relay timers
		for (var k=0;k<4;k++){
			this.delayLatchOnOffSet(0,k,self.config.delayTimerON[k]);
			this.delayLatchOnOffSet(1,k,self.config.latchTimerON[k]);
			this.delayLatchTimeSet(0,k,self.config.delayTimer[k]);
			this.delayLatchTimeSet(1,k,self.config.latchTimer[k]);
		}
		for (var band = 0; band < 2; ++band) {
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

		}
		var el = window.parent.head.document.getElementById('maintab');
		var w =  document.getElementById("tagName").getBoundingClientRect().width;
		
		el.style.width = w+'px';		
	}


	this.readConfsFrm = function(isReset, isIsolVerif, isIsolClear, band, forceSend, isForcePaOn, isForcePaOff) {
		var cnf = new Config();
		cnf.parse(self.config.frm);
		var frm = [];
		if (isReset) {
			cnf.resetSoft = true;
			frm.push(cnf.getFrm());
			return frm;
		}
		if (isIsolVerif) {
			cnf.runIsolationMeas[band] = true;
			frm.push(cnf.getFrm());
			return frm;
		}
		if (isIsolClear) {
			cnf.clearOscAlarm[band] = true;
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
			for (var c = 0; c < self.factory.numADJFilters; ++c) {
				self.getAdjChConf(cnf, c, band);
			}
			for (var c = self.factory.numADJFilters; c < self.maxChannelsADJ; ++c) {
				cnf.filterEnabled[1][band][0][c] = false; 
				cnf.filterEnabled[1][band][1][c] = false; 
			}
			for (var k=0;k<4;k++){
				cnf.delayTimerON[k] = this.delayLatchOnOffGet(0,k);
				cnf.latchTimerON[k] = this.delayLatchOnOffGet(1,k);
				cnf.delayTimer[k] = this.delayLatchTimeGet(0,k);
				cnf.latchTimer[k] = this.delayLatchTimeGet(1,k);
			}
		}
		
	}
	this.getBandConf = function(cnf, b, band) {
		var simplex = (self.getSimplexMode(band) && self.factory.Simplex[band]);
		cnf.simplexMode[band] = simplex;
		cnf.muteModeLinked[band] = self.isMuteModeLinked(band);
		cnf.numberOfFilterNonGrouped[band][b] = 0;
		cnf.allChSameBW[band][b] = self.eqBwIsSet(b,band);
		if (b==1) cnf.allSameSquelch[band] = self.eqSqIsSet(band);
		
		cnf.paEnabled[band][b] = self.config.paEnabled[band][b];
		
		cnf.oscTimeThSeconds[0] = self.getAbnSqTime();
		cnf.oscRetryTimeHours[0] = self.getRetryTime();
		cnf.oscFeatureEnabled[0] = true;
		cnf.oscActionAfterAlarm[0] = self.opfModeGet();
		cnf.autoUlPaOffTimer = self.getAutoPaUlOffTime();
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
	}
	this.getChConf = function(cnf, c, band) {
		var on = self.isFiltEnabled(c, band, 0) && self.factory.chBandEnabled[band];
		for (var b = 0; b < 2; ++b) {
			if (on !== null) {
				cnf.filterEnabled[0][band][b][c] = on;
			}
			cnf.isFilterGrouped[band][b][c] = false;
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
		for (var k=0;k<4;k++){
			var noShow = self.config.latchTimerON[k] && (self.config.latchTimer[k]>=35996400); //hours = 9999
			self.delayLathTimeStatSet(0,k,monitor.delayTimer[k],monitor.delayTimerRunning[k],false);
			self.delayLathTimeStatSet(1,k,monitor.latchTimer[k],monitor.latchTimerRunning[k],noShow);
			self.relayStateSet(k,monitor.relayOpenClosed[k],monitor.relayONOFF[k]);
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
				}
				self.setStatePaOn(b, band, monitor);
				self.bbAgcSet(b, band, monitor.bbAgc[band][b]);
			}
			for (var k=0;k<8;k++)
				self.bandAlarmSet(band, k, monitor.bandAlarm[band][k]);
		}
	}
	this.showStatusCh = function(monitor, b, c, band, nbadj) {
		var isInput = monitor.signalDet[nbadj][band][b][c] && self.config.filterEnabled[nbadj][band][1][c];
		var chInOn = self.computeChInOn(b, c, band, nbadj, monitor);
		var abnSq = false;
		if (self.factory.oscFeatureEnable) abnSq = b==0?monitor.oscDetectCH[nbadj][band][c]:false;
		if (abnSq){
			self.rfSignalLedSet(b, c, band, nbadj, "red");
		} else if (isInput && chInOn) {
			self.rfSignalLedSet(b, c, band, nbadj, "green");
		} else {
			self.rfSignalLedSet(b, c, band, nbadj, "grey");
		}
		if (!chInOn) {
			self.rfChInPowSet(b, c, band, nbadj, monitor.level[nbadj][band][b][c], "#D0D0D0");
		} else if (monitor.overload[band][1]) { //SCA. Overload DL contains overload UL
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
		if (monitor.gralAlarm[5]){ //Comm. Error
			if (!self.config.paEnabled[band][b]) return false; 
		}else{
			if (!monitor.statePaOn[band][b]) return false;
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
		if (monitor.gralAlarm[5]){ //Comm. Error
			if (!self.config.paEnabled[band][b]) return false; 
		}else{
			if (!monitor.statePaOn[band][b]) return false;
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
		fr.style.width = "65px";
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
			fr.style.width = "140px";
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
		cell.innerHTML = "Osc.&nbsp;Delay&nbsp;Threshold";
		cell.className = "thdrht";
		row.appendChild(cell);		
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "abnSqTime";
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "32px";
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
		el.style.width = "32px";
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

	// this.opfModes = ['Automatic Shut Down', 'Run Isolation Meas.', 'Only Alarm'];
	this.opfModes = ['Automatic Shut Down', 'Run Isolation Meas.'];

	var self = this;
	this.pageTypes = {'NB': 0, 'ADJ': 1};
	this.pageType = 'undefined';
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
	this.blocked = false;
}

function createMetCell(id, s) {
	var tdNode = document.createElement("td");
	tdNode.id = "met_"+id;
	tdNode.className = "thr";
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
	tdNode.className = "thr";
	tdNode.style.paddingRight = "10px";
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "met_"+id;
	var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	met.attachTo(tdNode);
	met.valueSet(s.min);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "txt_"+id;
	tdNode.style.minWidth = "30px";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	tdNode.innerHTML = "0";
	tdNode = document.createElement("td");
	tdNode.innerHTML = units;
	tdNode.className = "thdrht";
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
	led.src = "bullet_grey.png";
	led.className = "centered";
	led.align = "center";
	tdNode.appendChild(led);
	return tdNode;
}

function createLedBoxWithText(id) {
	var tdNode = document.createElement("td");
	var led = document.createElement("img");
	led.id = id;
	led.src = "bullet_grey.png";
	led.className = "centered";
	led.align = "left";
	tdNode.appendChild(led);
	var sp = document.createElement("span");
	sp.innerHTML = "&nbsp;&nbsp;&nbsp;";
	tdNode.appendChild(sp);
	var sp = document.createElement("span");
	sp.id = id + "_span";
	sp.style.fontWeight = "bold";
	tdNode.appendChild(sp);
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
	this.mDiv.style.width = "50px";
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
