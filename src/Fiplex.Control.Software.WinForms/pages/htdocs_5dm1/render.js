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
	this.show = function(tags, fact, version, serNr, config, NFPAcfg) {
		self.tags = tags;
		self.factory = fact;
		self.version = version;
		self.NFPA = NFPAcfg;
		self.config = config;
		var currentPageType = self.pageType;
		self.pageType = this.pageTypes['NB'];
		self.BW_ADJ_MAX_HZ = self.factory[0].commonUl?18000000:20000000;
		self.FilterValidSep = self.factory[0].commonUl? FilterValidSeparation[1]:FilterValidSeparation[0];
		for (var nr=0;nr<=nrOfRemotes;nr++){
			self.maxChannels[nr] = self.config[nr].CHNR;
		}
		self.maxChannelsADJ = self.config[0].ADJNR;
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
		var redraw = pageTypeChange;
		for (var nr=0;nr<=nrOfRemotes;nr++){
			redraw = self.computeShowFiltersBitmask(0,0,nr) || redraw;
			redraw = self.computeShowFiltersBitmask(0,1,nr) || redraw;
			redraw = self.computeShowFiltersBitmask(1,0,nr) || redraw;
			redraw = self.computeShowFiltersBitmask(1,1,nr) || redraw;
			redraw = self.checkFilteringOptions(nr) || redraw;
			redraw = self.checkFirmwareChange() || redraw;
		}

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
			for(var nr=0;nr<=nrOfRemotes;nr++){
				var unit = self.createUnit(nr);
				self.firstStatus = true;
				rootEl.appendChild(unit);
			}
			self.setMinButtonState();
			
		}
		self.showTags();
		self.showFreqs();
		self.showConfs(false);
		self.doFrequencyCheck = true;
		initFormChangeCheck();
	}
	this.setMinButtonState = function(){
		for (var k=0;k<self.minButtonStates.length;k++){
			self.setMinimizedState(self.minButtonStates[k][0],self.minButtonStates[k][1]);
		}
	}
	this.close = function() {
		var rootEl = document.getElementById(self.id);
		if (rootEl) {
			remove_element(rootEl);
		}
		self.showChannelsBitmask = 0;
	}
	this.checkFilteringOptions = function(nr){
		var redraw = false;
		for (var band=0;band<2;band++){
			if (self.filterOptions[0][band]!=self.factory[nr].chBandEnabled[band]){
				self.filterOptions[0][band] = self.factory[nr].chBandEnabled[band];
				redraw = true;
			}
			if (self.filterOptions[1][band]!=self.factory[nr].adjBandEnabled[band]){
				self.filterOptions[1][band] = self.factory[nr].adjBandEnabled[band];
				redraw = true;
			}			
		}
		return redraw;
	}
	this.checkFirmwareChange = function() {
		var redraw = false;
		var firmwareNr = (self.factory[0].commonUl ? 0 : 1);
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
	this.computeShowFiltersBitmask = function(adj, band, nr) {
		var redraw = false;
		var br = 0;
		if (nr==0) br = 1;
		if (typeof(self.showFiltersMask[nr][adj][band]) === 'undefined' 
			|| self.showFiltersMask[nr][adj][band] === null
			|| !this.areEqual(self.showFiltersMask[nr][adj][band],self.config[nr].filterEnabled[adj][band][br]))
		{
		    	redraw = true;
		}
		self.showFiltersMask[nr][adj][band] = this.copy(self.config[nr].filterEnabled[adj][band][br]);
		return redraw;
	}
	this.createUnit = function(nr) {
		var auxtitle = nr==0?"MASTER":("REMOTE " + nr);
		var unitDiv = document.createElement("div");
		unitDiv.id = "unitDiv_"+nr;
		if (nr>0) unitDiv.style.display = "none";
		unitDiv.className = "unitbox";
		var id = "unitContentDiv_"+nr;
		var headDiv = this.createUnitHead("TAG","tagName_"+nr,auxtitle,"tagsubt_"+nr,nr,true,id);
		unitDiv.appendChild(headDiv);
		var unitContent = document.createElement("div");
		unitContent.id = id;
		unitDiv.appendChild(unitContent);
		//ALARM INTERFACE
		id = "contentDivAlarm_"+nr;
		var headDiv = this.createUnitHead(nr==0?"CONFIGURATION":"ALARM INTERFACE","",auxtitle,"aisubt_"+nr,nr,true,id);
		headDiv.id = "headDivAlarm_"+nr;
		unitContent.appendChild(headDiv);		
		var contentDiv = document.createElement("div");
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = id;
		contentDiv.min = false;
		var tab = this.createAlarmInterface(nr);
		contentDiv.appendChild(tab);
		headDiv.style.display = "block";
		contentDiv.style.display = "block";
		//FIBER INTERFACE
		id = "contentDivFO_"+nr;
		var headDiv = this.createUnitHead("FIBER OPTIC INTERFACE","",auxtitle,"fosubt_"+nr,nr,true,id);
		headDiv.id = "headDivFO_"+nr;
		unitContent.appendChild(headDiv);		
		var contentDiv = document.createElement("div");
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.min = false;
		contentDiv.id = id;
		var tab = this.createFOInterface(nr);
		contentDiv.appendChild(tab);
		//headDiv.style.display = "none";
		//contentDiv.style.display = "none";
		//BAND CTRL
		for (var band = 0;band<2;band++){
			id = "contentDiv_"+band+"_"+nr;
			var show = self.factory[nr].chBandEnabled[band] || self.factory[nr].adjBandEnabled[band];
			if (!show) localStorage.setItem(self.sernr.sernr +"_min_"+ id,1); //forces frame to minimized state if entire band is not enabled
			var headDiv = this.createUnitHead(self.factory[nr].bandNames[band],"",auxtitle,"bandsubt_"+band+"_"+nr,nr,true,id);
			headDiv.id = "headDiv_"+band+"_"+nr;
			unitContent.appendChild(headDiv);		
			var contentDiv = document.createElement("div");
			unitContent.appendChild(contentDiv);
			contentDiv.className = "contentbox";
			contentDiv.id = id;
			contentDiv.min = false;
			var tab = this.createContentCtrl(nr,band);
			contentDiv.appendChild(tab);
			headDiv.style.display = show? "block" :"none";
			contentDiv.style.display = show? "block" :"none";
		}
		//WARNING BOX
		id = "filtWarnDiv_"+nr;
		var headDiv = this.createUnitHead("FILTER&nbsp;SETTINGS&nbsp;WARNINGS","",auxtitle,"fwsubt_"+nr,nr,true,id);
		headDiv.id = "filtWarnHead_"+nr;
		unitContent.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = id;
		contentDiv.min = false;
		var tab = this.createWarningTab(nr);
		contentDiv.appendChild(tab);
		headDiv.style.display = "none";
		contentDiv.style.display = "none";
		return unitDiv;
	}
	this.displayFOinterface = function(nr,doShow) {
		try {
			var el = document.getElementById("headDivFO_"+nr);
			el.style.display = ( doShow ? "block" : "none" );
			var el = document.getElementById("contentDivFO_"+nr);
			var min = el.getAttribute("min");
			if (!min) el.style.display = ( doShow ? "block" : "none" );
		} catch(e){}
	}
	this.showUnit = function(nr,show){
		try {
			var el = document.getElementById("unitDiv_"+nr);
			el.style.display = ( show ? "block" : "none" );
		} catch(e){}
	}
	this.blockContent = function(nr,doblock) {

		if (doblock) {
			self.displayFOinterface(nr,false);
		}
		var n_start = nr;
		var n_stop = nr;
		if (nr==0){
			n_start = 0;
			n_stop = nrOfRemotes;
		}
		for (nr=n_start;nr<=n_stop;nr++){
			var id = "headDivAlarm_"+nr;
			var headDiv = document.getElementById(id);
			if ( headDiv !== null ) {
				headDiv.style.display = doblock ? "none":"block";
			}
			id = "contentDivAlarm_"+nr;
			var contentDiv = document.getElementById(id);
			if (contentDiv !== null) {
				contentDiv.style.display = doblock ? "none":"block";
			}
			for (var band = 0;band<2;band++){
				id = "headDiv_"+band+"_"+nr;
				headDiv = document.getElementById(id);
				if ( headDiv !== null ) {
					headDiv.style.display = doblock ? "none":"block";
				}
				id = "contentDiv_"+band+"_"+nr;
				var contentDiv = document.getElementById(id);
				if (contentDiv !== null) {
					contentDiv.style.display = doblock ? "none":"block";
				}
			}
		}
	}
	this.createUnitHead = function(title,idt,titleaux,idsubt,nr,minbutton,elToMin) {
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
		cell.innerHTML = titleaux;
		cell.id = idsubt;
		cell.style.width = "100px";
		cell.style.paddingLeft = "30px";	
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
		cell.style.paddingRight= "10px";
		if (minbutton){
			cell.style.textAlign = "right";
			cell.appendChild(this.createMinButton(elToMin));
		}
		cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);
		return box;
	}
	this.setMinimizedState = function(id,min){
		var st = (min==1);
		var el = document.getElementById(id.substring(4));
		el.style.display = st?"none":"block";
		el.setAttribute("min",st);
		el = document.getElementById(id);
		el.src = (st?"maximize":"minimize") + ".png";
	}
	this.createMinButton = function(elToMin){
		var img = document.createElement("img");
		img.src = "minimize.png";
		img.id = "min_"+elToMin;
		var minState = localStorage.getItem(self.sernr.sernr +"_"+ img.id);
		if (minState == null) minState = false;
		self.minButtonStates.push([img.id,minState]);
		img.name = img.id;
		img.onclick = function(ev) {
			var min = (this.src.search("minimize.png")>=0)?1:0;
			self.setMinimizedState(this.id,min);
			localStorage.setItem(self.sernr.sernr +"_"+ this.id,min);
		}
		return img;
	}
	this.showTags = function() {
		try {
			for (var k=0;k<=nrOfRemotes;k++){
				var el = document.getElementById("tagName_"+k);
				if(typeof String.prototype.trim !== 'function'){
					String.prototype.trim = function() {
						return this.replace(/^\s+|\s+$/g, '');
					}
				}
				var name = entify(self.tags[k].tag);
				el.innerHTML = name.trim();
			}
		} catch (err) {}
	}
	this.showTag = function(nr) {
		try {

			var el = document.getElementById("tagName_"+nr);
			if(typeof String.prototype.trim !== 'function'){
				String.prototype.trim = function() {
					return this.replace(/^\s+|\s+$/g, '');
				}
			}
			var name = entify(self.tags[nr].tag);
			el.innerHTML = name.trim();

		} catch (err) {}
	}
	this.showTagBlocked = function(nr) {
		try {
			var el = document.getElementById("tagName_"+nr);
			el.innerHTML = "BLOCKED";
		} catch (err) {}
	}
	this.createAlarmInterface = function(nr){
		if (nr==0) return this.createAlarmInterfaceMaster();
		return this.createAlarmInterfaceRemote(nr);
		// var tab = document.createElement("table");
		// tab.className = "contenttable";
		// var rowb = document.createElement("tr");
		// tab.appendChild(rowb); 
		// var rspan = nr==0?3:2;
		// if (!self.factory[nr].extremeTempActionEnable) rspan--;
		// if (!self.factory[nr].oscFeatureEnable && nr>0) rspan--; //se sustituye opf content por una celda con reset, temp, UL levels
		// if (nr==0) rspan--; //se elimina AutoPaUlOffContent de master
		// if (rspan<=0) rspan=1;

		// var cell = this.createAlarmTable(nr);
		// rowb.appendChild(cell);
		// cell.className = "contentcell";
		// cell.rowSpan = rspan;
		
		// var cell = this.createAlarmTableBand(nr);
		// rowb.appendChild(cell);
		// cell.className = "contentcell";
		// cell.rowSpan = rspan;
		// if (nr==0)
		// 	var cell = this.createMasterContent();  //se sustituye opf content por una celda con reset, temp, UL levels
		// else
		// 	var cell = self.factory[nr].oscFeatureEnable?this.createOPFContent(nr):this.createExtremeTempActionContent(nr);
		// cell.className = "contentcell";
		// rowb.appendChild(cell);
		
		// var cell = this.createRelayTable(nr);
		// rowb.appendChild(cell);
		// cell.className = "contentcell";
		// cell.rowSpan = rspan;
		
		// var rowb = document.createElement("tr");
		// tab.appendChild(rowb);
		// if (nr==0){
		// 	var cell = this.createExtremeTempActionContent(nr);	
		// }else
		// 	var cell = self.factory[nr].oscFeatureEnable?this.createExtremeTempActionContent(nr):this.createOPFContent(nr);
		// cell.className = "contentcell";
		// rowb.appendChild(cell);	

		
		// var rowb = document.createElement("tr");
		// tab.appendChild(rowb);
		// if (nr==0){
		// 	var cell = this.createOPFContent(nr);
		// 	cell.style.display = "none";
		// 	rowb.appendChild(cell);
		// }else
		// 	var cell = this.createAutoPaUlOffContent(nr);
		// cell.className = "contentcell";
		// rowb.appendChild(cell);
		// return tab;
	}
	this.createAlarmInterfaceMaster = function(){
		var nr = 0;
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb); 

		var cell = this.createAlarmTable(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";
		
		var cell = this.createAlarmTableBand(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";

		var cell = this.createMasterContent();  //se sustituye opf content por una celda con reset, temp, UL levels
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = 2;
		
		var cell = this.createRelayTable(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = 2;
		
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);

		var cell = this.createBbuTypeOfConnectionContent(nr);
		rowb.appendChild(cell);
		cell.className="contentcell";
		cell.colSpan = 2;

		var cell = this.createExtremeTempActionContent(nr);	
		cell.className = "contentcell";
		cell.style.display = "none";
		rowb.appendChild(cell);

		var cell = this.createOPFContent(nr);
		cell.className = "contentcell";
		cell.style.display = "none";
		rowb.appendChild(cell);
	
		var cell = this.createAutoPaUlOffContent(nr);
		cell.className = "contentcell";
		cell.style.display = "none";
		rowb.appendChild(cell);
		return tab;
	}
	this.createAlarmInterfaceRemote = function(nr){		// nr= 1..8
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb); 
		// var isBbuMvo2Mode = uCSupportsBbuMvo2Mode(self.version);
		var rspan = 3;
		if (!self.factory[nr].extremeTempActionEnable && !self.factory[nr].oscFeatureEnable) {
			rspan = 2;
		} else {
			if (!self.factory[nr].extremeTempActionEnable) rspan--;
			if (!self.factory[nr].oscFeatureEnable) rspan--;
		}
		var cellOpf = this.createOPFContent(nr); cellOpf.className="contentcell";
		var cellAutoPaUL = this.createAutoPaUlOffContent(nr); cellAutoPaUL.className="contentcell";
		var cellTemp = this.createExtremeTempActionContent(nr); cellTemp.className="contentcell";
		var cellBbuTypeOfConnection = this.createBbuTypeOfConnectionContent(nr); cellBbuTypeOfConnection.className="contentcell";
		cellBbuTypeOfConnection.colSpan = 2;
		
		var cell = this.createAlarmTable(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = rspan-1;

		var cell = this.createAlarmTableBand(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = rspan-1;

		var cell = self.factory[nr].oscFeatureEnable?cellOpf:cellAutoPaUL;
		cell.className = "contentcell";
		rowb.appendChild(cell);
		
		var cell = this.createRelayTable(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = rspan;

		if (!self.factory[nr].extremeTempActionEnable && !self.factory[nr].oscFeatureEnable) {
			var rowb = document.createElement("tr");
			tab.appendChild(rowb);
			rowb.appendChild(cellBbuTypeOfConnection);
			cellAutoPaUL.rowSpan = 2;
			rowb = document.createElement("tr");
			tab.appendChild(rowb);
			rowb.appendChild(cellOpf);
		}
		else if (self.factory[nr].oscFeatureEnable){
			if (self.factory[nr].extremeTempActionEnable){
				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellAutoPaUL);
				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellBbuTypeOfConnection);
				rowb.appendChild(cellTemp);
			} else {
				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellBbuTypeOfConnection);
				rowb.appendChild(cellAutoPaUL);
				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellTemp);
				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellTemp);
			}
		} else {
			if (self.factory[nr].extremeTempActionEnable){
				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellBbuTypeOfConnection);
				rowb.appendChild(cellTemp);
			} else {
				rowb = document.createElement("tr");
				tab.appendChild(rowb);
				rowb.appendChild(cellBbuTypeOfConnection);
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
	this.createAlarmTableBand = function(nr){
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
			show = self.factory[nr].chBandEnabled[band] || self.factory[nr].adjBandEnabled[band];
			var row = document.createElement("tr");
			row.style.display = show? "table-row" :"none";
			tb.appendChild(row);
			var cell = document.createElement("th");
			cell.className = "cth";
			cell.innerHTML = self.factory[nr].bandNames[band].replace("BAND","")+ "&nbsp;ALARMS";
			cell.style.paddingLeft = "10px";
			cell.style.paddingRight = "10px";
			cell.colSpan = 2;
			cell.style.minWidth = "100pt";
			row.appendChild(cell);
			if (nr==0 && !self.factory[0].commonUl){//VU. Se fuerzan UL Pa Fail / Ant. Disconnection por banda
				self.NFPA[nr].bandAlarmsInstalled[8] = true;
				self.NFPA[nr].bandAlarmsInstalled[9] = true;
			}
			for (var k=0;k<self.NFPA[nr].bandAlarmsInstalled.length;k++){
				tb.appendChild(this.createBandAlarm(band,k,nr,self.NFPA[nr].alarmNames[1][k],show && self.NFPA[nr].bandAlarmsInstalled[k]));
			}
		}	
		return cellb;
	}
	this.createAlarmTable = function(nr){
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
		if (!self.factory[0].commonUl){//VU. Se eliminan UL Pa Fail / Ant. Disconnection como gral alarm (en remoto es incondicional)
			self.NFPA[nr].globalAlarmsInstalled[4] = false;
			self.NFPA[nr].globalAlarmsInstalled[5] = false;
		}
		//fiberAlarms se dejan de tratar como generalAlarms y reciben tratamiento específico en master
		if (nr==0){
			self.NFPA[nr].globalAlarmsInstalled[6] = false;
			self.NFPA[nr].globalAlarmsInstalled[7] = false;
		}
		for (var k=0;k<self.NFPA[nr].globalAlarmsInstalled.length;k++){
			var show = self.NFPA[nr].globalAlarmsInstalled[k];
			if (k>=16) show = false;
			if (k==12 && nr>0 && !self.NFPA[nr].globalAlarmsEnabled[k]) show=false;
			var alName = self.NFPA[nr].alarmNames[0][k];
			if (k==12 && nr>0 && getNrOfGralSystemAlarmsSupported(self.config[nr], nr)==1) {	// for legacy remote device
				alName = alName.substr(0, alName.length-2);										// delete '1' from end of general system alarm name
			}
			tb.appendChild(this.createGralAlarm(k,nr,alName,show));
		}
		var bbuSerialMode = isBbuSerialMode(self.config[nr]);
		var row = document.createElement("tr");
		row.style.minHeight = "20px";
		tb.appendChild(row);
		var row = document.createElement("tr");
		row.id = "BBUalarmsHeaderRow"+"_"+nr;
		if (!bbuSerialMode) {
			row.style.display = "none";
		}
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.className = "cth";
		cell.innerHTML = "BBU ALARMS";
		cell.colSpan = 2;
		row.appendChild(cell);
		for (var k=0;k<self.NFPA[nr].bbuAlarmsInstalled.length;k++){
			var show = self.NFPA[nr].bbuAlarmsInstalled[k]&&bbuSerialMode;
			tb.appendChild(this.createBbuAlarm(nr,k,self.NFPA[nr].alarmNamesBbu[k],show));
		}	
		return cellb;
	}
	this.createRelayTable = function(nr){
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
		var nrOfRelaysSupported = getNrOfRelaysSupported(self.config[nr], nr);
		for (var k=0;k<this.config[nr].NR_OF_RELAYS_MAX*2;k++){
			var row = document.createElement("tr");
			row.id = "RelayRow_"+k+"_"+nr;
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
				cell.id = "timerStat_"+(k/2)+"_0_"+nr;
				row.appendChild(cell);
				for (var j=2;j>=0;j--) row.appendChild(this.createDelayLatchTime(j,nr,0,k/2));
				var cell = this.createDelayLatchButton(0,nr,k/2);
				cell.style.textAlign = "center";
				row.appendChild(cell);			
				var cell = document.createElement("th");
				cell.id = "relStat_"+(k/2)+"_"+nr;
				cell.style.width = "25px";
				cell.style.paddingLeft = "4px";
				row.appendChild(cell);
				cell.rowSpan = 2;
				var cell = document.createElement("td");
				cell.id = "relStatImg_"+(k/2)+"_"+nr;
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
				cell.id = "timerStat_"+((k-1)/2)+"_1_"+nr;		
				row.appendChild(cell);								
				for (var j=2;j>=0;j--) row.appendChild(this.createDelayLatchTime(j,nr,1,(k-1)/2));
				var cell = this.createDelayLatchButton(1,nr,(k-1)/2);
				cell.style.textAlign = "center";
				row.appendChild(cell);
			}
		}
		if (nr==0){
			if (self.version.compareSw(2,0) >= 0) {
				// mostrar botón solamente si la versión del micro es >= 2.00
				row = document.createElement("tr");
				tb.appendChild(row);
				this.createForceSystemAlarm(row);
			}
		}
		return cellb;
	}
	this.relayStateSet=function(nrelay,nr,openclose,onoff){
		var isNormalACPowerRelay = (nr==0 || isBbuSerialMode(self.config[nr])) && self.NFPA[nr].isRelayAssignNormalACpowerExclusive(nrelay, self.factory[nr].commonUl);
		var el = document.getElementById("relStat_"+nrelay+"_"+nr);
		if (!isNormalACPowerRelay) {
			el.innerHTML = onoff?"Alarm<br/>ON":"Alarm<br/>OFF";
		} else {
			el.innerHTML = "";
		}
		el = document.getElementById("relStatImg_"+nrelay+"_"+nr);
		el.innerHTML = "<img src="+(openclose?"open":"closed")+".png><br>"+(openclose?"Open":"Closed");
		if (!isNormalACPowerRelay) {
			el.style.color = onoff?'#ffffff':'#000000';
			el.style.backgroundColor = onoff?"#e20000":"white";
		} else {
			el.style.color = '#000000';
			el.style.backgroundColor = "white";
		}
	}
	this.createDelayLatchButton = function(dl,nr,nrelay){
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "dl_onoff_"+dl+"_"+nrelay+"_"+nr;
		el.name = el.id;
		el.type = "checkbox";
		cell.appendChild(el);
		return cell;		
	}
	this.delayLatchOnOffSet = function(dl,nrelay,nr,val){
		var el = document.getElementById("dl_onoff_"+dl+"_"+nrelay+"_"+nr);
		el.checked = !!val;
	}
	this.delayLatchOnOffGet = function(dl,nrelay,nr){
		var el = document.getElementById("dl_onoff_"+dl+"_"+nrelay+"_"+nr);
		return el.checked;
	}	
	this.createDelayLatchTime = function(hms,nr,dl,nrelay) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "dl_time_"+hms+"_"+dl+"_"+nrelay+"_"+nr;
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
	this.delayLatchTimeSet = function(dl,nrelay,nr,val){
		var times = [0,0,0];
		var res;
		times[2] = Math.floor(val/3600);
		res = ~~(val-3600*times[2]);
		times[1] = Math.floor(res/60);
		times[0] = res % 60;
		for (var k=0;k<3;k++){
			var el = document.getElementById("dl_time_"+k+"_"+dl+"_"+nrelay+"_"+nr);
			el.value = times[k];
		}
	}
	this.delayLatchTimeGet = function(dl,nrelay,nr){
		var	res = parseInt(document.getElementById("dl_time_0_"+dl+"_"+nrelay+"_"+nr).value);
		res +=  60*parseInt(document.getElementById("dl_time_1_"+dl+"_"+nrelay+"_"+nr).value);
		res +=  3600*parseInt(document.getElementById("dl_time_2_"+dl+"_"+nrelay+"_"+nr).value);
		return res;
	}
	this.delayLathTimeStatSet = function(dl,nrelay,nr,val,running,noShow){
		var times = [0,0,0];
		var res;
		if (noShow){
			document.getElementById("timerStat_"+nrelay+"_"+dl+"_"+nr).innerHTML = "--Infinite--";
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
		document.getElementById("timerStat_"+nrelay+"_"+dl+"_"+nr).innerHTML = str;
	}
	this.createAutoPaUlOffContent = function(nr){
		var cellb = document.createElement("td");
		if(nr>0) cellb.style.display = "none";
		var tab2 = document.createElement("table");
		tab2.style.borderCollapse = "separate";
		tab2.style.borderSpacing = "2px 2px";
		tab2.style.width = "100%";	
		cellb.appendChild(tab2);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		var cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createAutoPaUlOff(nr);
		cell.appendChild(el);
		return cellb;
	}
	this.createExtremeTempActionContent = function(nr){
		var cellb = document.createElement("td");
		cellb.id = "extremeTempActionCell_"+nr;
		var tab2 = document.createElement("table");
		tab2.style.borderCollapse = "separate";
		tab2.style.borderSpacing = "2px 2px";
		tab2.style.width = "100%";
		cellb.appendChild(tab2);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		var cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createExtremeTempActionBox(nr);
		cell.appendChild(el);	
		return cellb;
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
		row = createMetRow("boardTemp0_0", board_temp_settings, "Temperature", "&ordm;C", 50);
		row.style.height = "22px";
		tb.appendChild(row);
		//LINKED UL/DL
		for (var band=0;band<2;band++){
			var show = self.factory[0].chBandEnabled[band] || self.factory[0].adjBandEnabled[band];
			row = document.createElement("tr");
			row.style.display = show?"table-row":"none";
			tb.appendChild(row);
			this.createFreqSplit(row,0,band,true);
			row = document.createElement("tr");
			row.style.display = show?"table-row":"none";
			tb.appendChild(row);
			row.style.display = "none";
			row.id = "warnFreq_"+band;
			var cell = document.createElement("td");
			cell.appendChild(this.createFreqWarning(band));
			cell.colSpan = 3;
			row.appendChild(cell);
		}
		row = document.createElement("tr");
		tb.appendChild(row);
		this.createMasterMode(row);
		row = document.createElement("tr");
		row.id = "masterModeStatusRow";
		row.style.height = "22px";
		row.style.display = "none";
		tb.appendChild(row);
		this.createMasterModeStatus(row);
		row = document.createElement("tr");
		row.id = "masterModeAlarmRow";
		tb.appendChild(row);
		this.createMasterModeAlarm(row);
		row = document.createElement("tr");
		row.id = "systemForceRfOffRow";
		tb.appendChild(row);
		this.createForceRfOff(row);
		return box;
	}
	this.createFreqWarning = function(band){
		var tab = document.createElement("table");
		var row = document.createElement("tr");
		tab.appendChild(row);
		var cell = document.createElement("td");
		cell.style.padding = "5px";
		cell.innerHTML = '<img src="warning.png">';
		row.appendChild(cell);
		var cell = document.createElement("th");
		cell.className = "thdrht";
		cell.colSpan = 2;
		cell.innerHTML = 'UL/DL filter configuration<br>are not consistent at '+self.factory[0].bandNames[band] +
		".<br>After Apply Changes remote filter<br>configuration will be updated";
		row.appendChild(cell);
		return tab;
	}
	this.createOPFContent = function(nr){
		var cellb = document.createElement("td");
		cellb.id = "opfSettingsCell_"+nr;
		var tab2 = document.createElement("table");
		tab2.style.borderCollapse = "collapse";
		//tab2.style.borderSpacing = "2px 2px";
		tab2.style.width = "100%";
		cellb.appendChild(tab2);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		var cell = document.createElement("td");
		var el = this.createOpfSettingsAntIsol(nr);
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
		var el = this.createOpfSettingsOscDet(nr);
		cell.appendChild(el);
		row.appendChild(cell);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		return cellb;
	}
	this.createWarningTab = function (nr){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var row = document.createElement("tr");
		tab.appendChild(row);
		var cell = document.createElement("td");
		cell.className = "contentcell";
		row.appendChild(cell);	
		var tab2 = document.createElement("table");
		cell.appendChild(tab2);	
		var row = document.createElement("tr");
		tab2.appendChild(row);
		var cell = document.createElement("td");
		cell.style.padding = "10px";
		cell.innerHTML = '<img src="warning.png">';
		row.appendChild(cell);
		var cell = document.createElement("td");
		cell.className = "msgbox";
		cell.id = "warningBox_"+nr;
		row.appendChild(cell);	
		return tab;
	}
	this.createContentCtrl = function(nr,band) {
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var row = document.createElement("tr");
		tab.appendChild(row);		
		for (var i = 0; i < 2; ++i) {
			var cell = document.createElement("td");
			row.appendChild(cell);
			cell.className = "contentcell";
			var el = this.createBandBox(nr,i,band);
			cell.appendChild(el);
		}
		var row = document.createElement("tr");
		tab.appendChild(row);
		var cell = document.createElement("td");
		cell.className = "contentcell";
		cell.colSpan = 2;
		row.appendChild(cell);
		//cell.rowSpan = 3;
		var el = this.createGralCtlBox(nr,band);
		cell.appendChild(el);
		for (var nbadj=1;nbadj>=0;nbadj--){
			row = document.createElement("tr");
			row.id = "filtersRow_"+band+"_"+nbadj+"_"+nr;
			row.style.display = "none";
			tab.appendChild(row);
			var cell = document.createElement("td");
			row.appendChild(cell);
			cell.colSpan = 2;
			cell.className = "contentcell";
			cell.style.minHeight = "50px";
			cell.id = "filtersCell_"+band+"_"+nbadj+"_"+nr;
			cell.appendChild(this.createFilterTables(band,nbadj,nr));
		}
		return tab;
	}
	this.createFilterTables = function(band,nbadj,nr) {
		var mainTbl = document.createElement("table");
		mainTbl.width = "100%";
		mainTbl.id = "TableFilter_"+band+"_"+nbadj+"_"+nr;
		var row = document.createElement("tr");
		mainTbl.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.color = "black";
		cell.style.fontWeight = "bold";
		cell.style.textAlign = "center";
		cell.innerHTML = Texts[nr==0?'FILTDL':'FILTUL'] + (nbadj==0?"&nbsp;(NARROW&nbsp;BAND&nbsp;FILTERS)":"&nbsp;(ADJ.BW&nbsp;FILTERS)");
		cell.className = "cth";
		row = document.createElement("tr");
		mainTbl.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.appendChild(this.createFilterTable(nr==0?1:0,band,nbadj,nr));
		return mainTbl;
	}
	this.createGralCtlBox = function(nr,band) {
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
		if (nr>0){
			this.createFreqSplit(row,nr,band,false);
		}
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "15px";
		cell.appendChild(this.createMuteMode(nr,band));
		cell.style.display = "none";
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "35px";
		if (nr>0) cell.appendChild(this.createUnitReset(nr, band));
		cell.style.paddingRight = "20px";
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "15px";
		cell.appendChild(this.createSimplex(nr,band));
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "15px";
		if (nr>0) cell.appendChild(this.createTempBoard(nr,band));		
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		cell.style.paddingLeft = "20px";
		var showSimplex = self.factory[nr].Simplex[band];
		var sz = self.getGralConfCellSize(showSimplex);
		cell.style.width = sz;

		row = document.createElement("tr");
		body.appendChild(row);
		if (self.factory[nr].adjBandEnabled[band]){
			var celladj = document.createElement("td");	
			row.appendChild(celladj);
			celladj.appendChild(this.createShowFiltAdjTable(nr,band));			
			celladj.colSpan = 5;
			celladj.style.paddingRight = "10px";			
		}
		if (self.factory[nr].chBandEnabled[band]){
			var cellch = document.createElement("td");	
			row.appendChild(cellch);
			cellch.appendChild(this.createShowFiltTable(nr,band));			
			cellch.colSpan = 5;
			cellch.style.paddingRight = "10px";
		}
		if (self.factory[nr].adjBandEnabled[band] && self.factory[nr].chBandEnabled[band]){
			celladj.colSpan = 1;
			cellch.colSpan = 4;
		}
		if (self.factory[nr].adjBandEnabled[band]) {
			row = document.createElement("tr");
			body.appendChild(row);			
			var cell = document.createElement("td");
			cell.appendChild(this.createFreqStyleSw(band,nr));
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
	this.createShowFiltAdjTable = function(nr,band) {
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
		str += "&nbsp;(1-"+self.factory[nr].numADJFilters+")";
		if (self.factory[nr].numADJFilters==1) str = "On/Off&nbsp;Adj.Bw&nbsp;Filter"
		head.innerHTML = str;
		for (var c = 0; c < self.factory[nr].numADJFilters; ++c) {
			var cell = document.createElement("td");
			cell.appendChild(this.createFilterShow(c,band,1,nr));
			row.appendChild(cell);
		}
		if (band==0){
			var row = document.createElement("tr");
			tb.appendChild(row);
			var head = document.createElement("th");
			row.appendChild(head);
			head.innerHTML = "Assign 1st ADJBW to Band 14";
			head.style.display = self.factory[nr].commonUl?"table-cell":"none";
			head.className = "thdrht";
			var cell = document.createElement("td");
			cell.appendChild(this.createFirstNetCtl(nr));
			cell.style.display = self.factory[nr].commonUl?"table-cell":"none";
			row.appendChild(cell);			
		}
		return tab;
	}
	this.createShowFiltTable = function(nr,band) {
		var tab = document.createElement("table");
		tab.style.marginLeft = tab.style.marginRight = "auto";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var n = 0;
		var nrows = 3;
		var nch = 24;
		var ncols = 0;
		for (var r = 0, c = 0; r < nrows; ++r) {
			var row = document.createElement("tr");
			tb.appendChild(row);
			var head = document.createElement("th");
			row.appendChild(head);
			var str = "On/Off&nbsp;filters&nbsp;(";
			str += (1+c) + "-";
			head.className = "thdrht";
			n=0;
			while (n<nch && c<self.config[nr].CHNR){
				var cell = document.createElement("td");
				cell.appendChild(this.createFilterShow(c,band,0,nr));
				row.appendChild(cell);
				n++;c++;
			}
			str += c +")";
			head.innerHTML = str;
			ncols = row.cells.length;
		}
		return tab;
	}
	this.showFirstNet = function(nr,on){
		try{
			var b = nr==0? 1:0; //solo UL o DL
			document.getElementById("cellAdjF_0_"+b+"_0_0_"+nr).colSpan = on?2:1;
			document.getElementById("cellAdjF_0_"+b+"_1_0_"+nr).style.display = on?"none":"table-cell";	
			document.getElementById("chAdjF_0_"+b+"_0_0_"+nr).style.display = on?"none":"block";
			document.getElementById("firstnet_"+b+"_"+nr).style.display = on?"block":"none";
		} catch (err) {}
	}
	this.createFirstNetCtl = function(nr) {
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = el.name = "firstNetassign_"+nr;
		el.nr = nr;
		var br = nr==0?1:0;
		var optfreq = [["788.000","793.000","798.000","10.000"],["758.000","763.000","768.000","10.000"]];
		el.onclick = function(ev) {
			if (self.showFiltersMask[nr][1][0][0]){
				if (this.checked) {
					document.getElementById("chAdjF_0_"+br+"_0_0_"+nr).value = !self.freqStyle[0][nr]?optfreq[br][0]:optfreq[br][1];
					document.getElementById("chAdjF_0_"+br+"_1_0_"+nr).value = !self.freqStyle[0][nr]?optfreq[br][2]:optfreq[br][3];
				}else{
					for (var b=0;b<2;b++)
						self.setAdjFreqCh(b, 0, 0, nr, self.config[nr].fstartHzAdjFilter[0][b][0], self.config[nr].fstopHzAdjFilter[0][b][0]);
				}
				self.showFirstNet(nr,this.checked);
			}
		}
		return el;
	}
	this.setFirstNet = function(nr,on) {
		try {
			var el = document.getElementById("firstNetassign_"+nr);
			el.checked = on;
		} catch (err) {}
	}
	this.getFirstNet = function(nr) {
		try {
			var el = document.getElementById("firstNetassign_"+nr);
			return el.checked;
		} catch (err) {
			return false;
		}
	}
	this.createFilterShow = function(c, band, nbadj, nr) {
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = el.name = "filtShow_"+nbadj+"_"+band+"_"+c+"_"+nr;
		el.c = c;
		el.nr = nr;
		el.band = band;
		el.nbadj = nbadj;
		el.onclick = function(ev) {
			self.setFilterShow(this.c, this.band, this.nbadj, this.nr, this.checked);
			self.displayFilters(band,nr);
		}
		return el;
	}
	this.setShowFilter = function(c, band, nbadj, nr, on) {
		try {
			var el = document.getElementById("filtShow_"+nbadj+"_"+band+"_"+c+"_"+nr);
			el.checked = on;
		} catch(err) {}
	}
	this.getShowFilter = function(c, band, nbadj, nr) {
		try {
			var el = document.getElementById("filtShow_"+nbadj+"_"+band+"_"+c+"_"+nr);
			return el.checked;
		} catch(err) { return false; }
	}
	this.countNumFilts = function(band, nbadj, nr){
		var num = 0;
		var max = nbadj==0? this.maxChannels[nr] : self.factory[nr].numADJFilters;
		for (var k=0;k<max;k++){
			if (this.showFiltersMask[nr][nbadj][band][k]) num++;
		}
		return num;
	}
	this.createFilterTable = function(b,band,nbadj,nr) {
		var chFiltTable = document.createElement("table");
		chFiltTable.className = "bt";
		chFiltTable.width = "100%";
		chFiltTable.style.padding = "1px 1px 1px 1px";
		var chFiltBody = document.createElement("tbody");
		chFiltTable.appendChild(chFiltBody);
		var row = document.createElement("tr");
		chFiltBody.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);
		var tab = document.createElement("table");
		var num = this.countNumFilts(band, nbadj, nr);
		tab.width = num==1?"55%":"100%";
		tab.align = "center";
		cell.appendChild(tab);
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		row = document.createElement("tr");
		tb.appendChild(row);
		this.createFilterTableHeader(row, b, band, nbadj, nr, num);
		var max = nbadj==0? self.maxChannels[nr] : self.config[nr].ADJNR;
		for (var r = 0, c = 0; r < max; r++) {
			if (this.showFiltersMask[nr][nbadj][band][r]){
				if (c%2==0){
					row = document.createElement("tr");
					row.style.height = "22px";
					tb.appendChild(row);
					this.createFilterChannel(row, b, r, band, nbadj, nr);
					var cell = document.createElement("td");
					row.appendChild(cell);
				}else{
					this.createFilterChannel(row, b, r, band, nbadj, nr);
				}
				c++;
			}
		}
		return chFiltTable;
	}
	this.setFilterShow = function(r, band, nbadj, nr, do_show) {
		self.showFiltersMask[nr][nbadj][band][r] = do_show;
		var el = document.getElementById("TableFilter_"+band+"_"+nbadj+"_"+nr);
		remove_element(el);
		var el = document.getElementById("filtersCell_"+band+"_"+nbadj+"_"+nr);
		el.appendChild(self.createFilterTables(band,nbadj,nr));
		self.showFreqs();
		self.showConfs(true);
	}
	this.createFilterTableHeader = function(chFiltRow, b, band, nbadj, nr, num) {
		var numCols = 1;
		if (num>1) numCols++;
		chFiltRow.style.textAlign = "center";
		for (var k=0;k<numCols;k++){
			var td = document.createElement("td");
			chFiltRow.appendChild(td);
			td.style.paddingRight = "10px";
			td.innerHTML = "Nr.";

			var td = document.createElement("td");
			td.id = "HeaderF1_"+b+"_"+band+"_"+nbadj+"_"+nr;
			chFiltRow.appendChild(td);
			if (nbadj==1 && self.freqStyle[band][nr] == 0) {
				td.innerHTML = "Fstart&nbsp;(MHz)";
			} else {
				td.innerHTML = "Fr.&nbsp;(MHz)";
			}
			td = document.createElement("td");
			td.id = "HeaderF2_"+b+"_"+band+"_"+nbadj+"_"+nr;
			chFiltRow.appendChild(td);
			if (nbadj==1) {
				if (self.freqStyle[band][nr] == 0) {
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
			td = document.createElement("td");
			chFiltRow.appendChild(td);
			td.innerHTML = "Power&nbsp;IN(dBm)";
			td.colSpan = 2;
			td = document.createElement("td");
			chFiltRow.appendChild(td);
			td.innerHTML = "Det";
			td = document.createElement("td");
			chFiltRow.appendChild(td);
			td.innerHTML = "AGC/ch(dB)";
			td.colSpan = 2;
			td = document.createElement("td");
			chFiltRow.appendChild(td);
			td.innerHTML = "SQ(dBm)";
			if (nr>0 && b==0 && nbadj==0) td.style.display = "none";
			td.colSpan = 2;
					if (k==0){
				td = document.createElement("td");
				chFiltRow.appendChild(td);
				td.style.width = "100px";
			}
		}
	}
	this.isFiltEnabled = function(c, band, nbadj, nr) {
		var on = false;	
		try {
			on = self.getShowFilter(c, band, nbadj, nr);
		} catch(err) {}
		return on;
	}
	this.createFilterChannel = function(chFiltRow, b, c, band, nbadj,nr) {
		var cell = document.createElement("td");
		cell.innerHTML = c+1;
		cell.style.textAlign = "center";
		chFiltRow.appendChild(cell);
		if (nbadj==1){
			chFiltRow.appendChild(this.createAdjFr(b, c, 0, band,nr));
			chFiltRow.appendChild(this.createAdjFr(b, c, 1, band,nr));
		}else{
			chFiltRow.appendChild(this.createFiltFrequency(b, c, band, nr));
			chFiltRow.appendChild(this.createChBw(b, c, band, nr));		
		}
		chFiltRow.appendChild(this.createGfine(b, c, band, nbadj,nr));
		chFiltRow.appendChild(this.createMetPowIn(b, c, band, nbadj, nr));
		chFiltRow.appendChild(this.createTextPowIn(b, c, band, nbadj,nr,1));
		chFiltRow.appendChild(this.createSignalDetect(b, c, band, nbadj,nr));
		var cell = this.createMetPowOut(b, c, band, nbadj, nr);
		cell.style.display = "none";
		chFiltRow.appendChild(cell);
		var cell = this.createTextPowOut(b, c, band, nbadj,nr, 0);
		cell.style.display = "none";
		chFiltRow.appendChild(cell);
		chFiltRow.appendChild(this.createMetAgc(b, c, band, nbadj,nr));
		chFiltRow.appendChild(this.createTextAgc(b, c, band, nbadj,nr,0));
		if (nbadj==1 || b==1){
			chFiltRow.appendChild(this.createChSquelchEnable(b, c, band, nbadj,nr));
			chFiltRow.appendChild(this.createChSquelchThreshold(b, c, band, nbadj,nr));
		}
	}
	this.createFiltFrequency = function(b, c, band, nr) {
		var cell = document.createElement("td");
		var fr = document.createElement("input")
		fr.type = "text";
		fr.id = "chFreq_"+c+"_"+b+"_"+band+"_"+nr;
		fr.name = fr.id;
		fr.style.width = "65px";
		fr.className = "number";
		fr.channel = c;
		fr.path	= b;
		fr.band = band;
		fr.nr = nr;
		fr.title = "Min: "+(this.factory[nr].fstart[2*band+b]/1e6) + ", Max: "+(this.factory[nr].fstop[2*band+b]/1e6)+" MHz";
		fr.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		fr.onchange = function(ev) {
			var b = this.path;
			var c = this.channel;
			var band = this.band;
			var nr = this.nr;
			var fr = self.getFreqCh(b, c, band, nr);
			if (fr < self.factory[nr].fstart[2*band+b]) fr = self.factory[nr].fstart[2*band+b];
			if (fr > self.factory[nr].fstop[2*band+b]) fr = self.factory[nr].fstop[2*band+b];
			var stp = self.factory[nr].fstep;
			if (stp<=1.5e3) stp/=2;
			fr = ~~Math.round(fr/stp);
			fr *= stp;
			self.setFreqCh(b, c, band, nr, fr);
			self.config[nr].freqHz[band][b][c] = fr;
			if (!self.isFreqSplitFixed(band,nr)) return;
			if ((b % 2)==0){
				fr += self.factory[nr].uldlFreqSplit[band];
				b++;
			}else{
				fr -= self.factory[nr].uldlFreqSplit[band];
				b--;
			}
			if (fr < self.factory[nr].fstart[2*band+b]) fr = self.factory[nr].fstart[2*band+b];
			if (fr > self.factory[nr].fstop[2*band+b]) fr = self.factory[nr].fstop[2*band+b];
			self.setFreqCh(b, c, band, nr, fr);
			self.config[nr].freqHz[band][b][c] = fr;
		}
		cell.appendChild(fr);
		return cell;
	}
	this.setFreqCh = function(b, c, band, nr, frq) {
		try {
			var val = (frq / 1.0e6).toFixed(6);
			var el = document.getElementById("chFreq_"+c+"_"+b+"_"+band+"_"+nr);
			if (el) {
				el.value = val;
			}
		} catch (err) { }
	}
	this.getFreqCh = function(b, c, band, nr) {
		try {
			var el = document.getElementById("chFreq_"+c+"_"+b+"_"+band+"_"+nr);
			return ~~Math.round(parseFloat(el.value) * 1.0e6);
		} catch (err) { return self.config[nr].freqHz[band][b][c] }
	}
	this.createGfine = function(b, c, band, nbadj, nr) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		cell.appendChild(el);
		el.id = "Gfine_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.style.width = "20px";
		el.className = "number";
		el.path = b;
		el.chNr = c;
		el.band = band;
		el.nbadj = nbadj;
		el.nr = nr;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.title = "Min: "+self.config[nr].GfineRange+", Max: 0 dB";
		el.onchange = function(ev) {
			var nr = this.nr;
			var num = parseInt(this.value);
			if (isNaN(num)) {
				num = 0;
			}
			if (num < self.config[nr].GfineRange) {
				this.value = self.config[nr].GfineRange;
			} else if (num > 0) {
				this.value = 0;
			} else {
				this.value = num;
			}
			self.config[nr].fineGainFilter[this.nbadj][this.band][this.path][this.chNr] = num;
		}
		cell.appendChild(el);
		return cell;
	}
	this.setGfine = function(b, c, band, nbadj, nr, val) {
		try {
			var el = document.getElementById("Gfine_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr);
			if (el && !isNaN(val)) {
				el.value = val.toString();
			}
		} catch (err) { }
	}
	this.getGfine = function(c, b, band, nbadj, nr) {
		try {
			var el = document.getElementById("Gfine_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr);
			if (el) {
				return parseInt(el.value);
			}
			return 0;
		} catch (err) { return self.config[nr].fineGainFilter[nbadj][band][b][c]; }
	}
	this.createMasterModeStatus = function(mRow){
		var cell = document.createElement("th");
		cell.innerHTML = "Current Master Mode";
		cell.className = "thdrht";
		mRow.appendChild(cell);
		cell = document.createElement("th");
		cell.colSpan = 3;
		cell.id  = "masterModeStatus";
		cell.className = "tabval";
		cell.style.paddingLeft = "15px";
		cell.style.textAlign = "left";
		mRow.appendChild(cell);
	}
	this.masterModeStatusSet = function(val){
		try{
			var cell = document.getElementById("masterModeStatus");
			cell.innerHTML = val?"PRIMARY":"SECONDARY";
		}catch(e){}
		
	}
	this.createMasterMode = function(mRow){
		var cell = document.createElement("th");
		cell.innerHTML = "Master Mode";
		cell.className = "thdrht";
		mRow.appendChild(cell);
		cell = document.createElement("td");
		cell.colSpan = 3;
		cell.style.paddingLeft = "15px";
		mRow.appendChild(cell);
		var el = document.createElement("select");
		el.id = "masterMode";
		el.name = el.id;
		var opts = ['PRIMARY','SECONDARY','AUTOMATIC'];
		for (var i = 0; i < opts.length; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.onclick = function(){
			self.masterModeSet(this.selectedIndex,true);
		}
		cell.appendChild(el);
	}
	this.masterModeSet = function(val,notSetSel){
		try {
			if (!notSetSel){
				var el = document.getElementById("masterMode");
				el.selectedIndex = val;
			}
			var row = document.getElementById("masterModeStatusRow");
			row.style.display = val==2?"table-row":"none";
			var row = document.getElementById("masterModeAlarmRow");
			row.style.display = val==2?"table-row":"none";
		} catch (err) { }
	}
	this.masterModeGet = function(){
		try {
			var el = document.getElementById("masterMode");
			return el.selectedIndex;
		} catch (err) { return 0; }
	}
	this.createMasterModeAlarm = function(mRow){
		var mCell = document.createElement("td");
		mCell.colSpan = 4;
		mCell.style.textAlign = "center";
		mRow.appendChild(mCell);
		var tab = document.createElement("table");
		tab.width = "100%";
		mCell.appendChild(tab);
		var row = document.createElement("tr");
		tab.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 4;
		cell.appendChild(this.createShowAlarmButton());
		var alNames = ["HW Fail","High Temp","UL PA Fail","UL PA Fail","Ant. Disconn.","Ant. Disconn.",
		"Overload DL","Overload DL","Rx Power Low","Rx Power Low"];
		if (self.factory[0].commonUl)
			var ord = [0,1,2,4,6,7,8,9,3,5];
		else
			var ord = [0,1,2,3,4,5,6,7,8,9];
		for (var k=0;k<5;k++){
			var row = document.createElement("tr");
			tab.appendChild(row);
			row.style.display = "none";
			row.id = "alarmModeRow_"+k;
			for (var j=0;j<2;j++){
				var cell = document.createElement("th");
				cell.className = "thdrht";
				row.appendChild(cell);
				var str = alNames[ord[2*k+j]];
				var bandAlarm = k>(self.factory[0].commonUl?1:0);
				var show = true;
				if (bandAlarm){
					str+=" "+self.factory[0].bandNames[j];
					show = self.factory[0].chBandEnabled[j] || self.factory[0].adjBandEnabled[j];
				}
				cell.style.display = show?"table-cell":"none";
				cell.innerHTML = str;
				var cell = document.createElement("th");
				row.appendChild(cell);
				cell.appendChild(this.createMasterModeAlarmEnable(ord[2*k+j]));
				cell.style.display = show?"table-cell":"none";
				
			}
		}
		var row = false;
		var rowNr = 0;
		var extAlarmNr = 0;
		for (var k=0; k<3; k++){
			if (!self.NFPA[0].globalAlarmsEnabled[8+k]){
				continue;
			}
			if (!row) {
				var row = document.createElement("tr");
				tab.appendChild(row);
				row.style.display = "none";
				row.id = "alarmModeRow_"+(5+rowNr);
				rowNr++;
			}
			var cell = document.createElement("th");
			cell.className = "thdrht";
			row.appendChild(cell);
			cell.innerHTML = self.NFPA[0].alarmNames[0][8+k];
			var cell = document.createElement("th");
			row.appendChild(cell);
			cell.appendChild(this.createMasterModeAlarmEnable(10+k));
			extAlarmNr++;
			if (extAlarmNr>1){
				row = false;
			}
		}
	}
	this.createMasterModeAlarmEnable = function(num){
		var el = document.createElement("input");
		el.type = "checkbox";
		el.style.height = "12px";
		el.style.margin = "0px";
		el.id = "modeAlarm_"+num;
		el.name = el.id;
		return el;
	}
	this.masterModeAlarmEnableSet = function(num,val){
		try{
			var el = document.getElementById("modeAlarm_"+num);
			el.checked = val;
		}catch(e){}
	}
	this.masterModeAlarmEnableGet = function(num){
		try{
			var el = document.getElementById("modeAlarm_"+num);
			return el.checked;
		}catch(e){return false;}
	}
	this.createShowAlarmButton = function(){
		var el = document.createElement("input");
		el.type = "button";
		el.style.fontWeight = "bold";
		el.style.width = "130px";
		el.style.minWidth = "130px";
		el.style.borderRadius = "10px";
		el.align = "center";
		el.value = "Show Settings";
		el.onclick = function() {
			var show;
			if (this.value.search("Show")>=0){
				this.value = "Hide Settings";
				show = true;
			}else{
				this.value = "Show Settings";
				show = false;
			}
			self.showModeAlarms(show);
		} 
		return el;
	}
	this.showModeAlarms = function(sh){
		try{
			for (var k=0;k<(self.factory[0].commonUl?4:5);k++){
				var row = document.getElementById("alarmModeRow_"+k);
				row.style.display = sh?"table-row":"none";
			}
		}catch(e){}
		for (k=5; k<7; k++){
			try{
				var row = document.getElementById("alarmModeRow_"+k);
				// if uC version is < v3.03 (and !=2.05 for lab testing) do not show this settings
				// correction, v2.x will be used for rev001 of PCB, so if uC version >= 2.5 do not set show=false
				if (self.version.getSwMainNumber() == 3) {
					if (self.version.getSwSecondNumber() < 3) {
						sh = false;
					}
				}
				if (self.version.getSwMainNumber() == 2) {
					if (self.version.getSwSecondNumber() < 5) {
						sh = false;
					}
				}
				if (self.version.getSwMainNumber() < 2) {
					sh = false;
				}
				row.style.display = sh?"table-row":"none";
			}catch(e){}
		}
	}
	this.createFreqSplit = function(mRow, nr, band, show) {
		if (nr>0){
			var mCell = document.createElement("td");
			var box = document.createElement("div");
			if (!show) mCell.style.display = "none";
			mCell.appendChild(box);
			var row = document.createElement("tr");
			box.appendChild(row);
		}
		var r = nr>0?row:mRow;
		var cell = document.createElement("th");
		if (nr==0 && !show) cell.style.display = "none";
		r.appendChild(cell);
		cell.innerHTML = self.factory[nr].bandNames[band] + " Linked<br>UL/DL Frequencies";
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.paddingLeft = "15px";
		r.appendChild(cell);
		var el = document.createElement("select");
		el.id = "freqSplit"+band+"_"+nr;
		el.name = el.id;
		el.self = this;
		el.band = band;
		el.nr = nr;
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
			var nr = this.nr;
			if (nr==0){
				self.config[0].uldlLinkedFreq[band] = fixed;
				self.config[0].saveFrameStr(self.config[0].getFrm(self.factory[0],0),0); //para que el tool tenga este valor actualizado
				window.parent.navi.filtRowDisplay(tool_enable(self.factory,self.config));
				blockRemotes();
				self.analyzeConf();
			}
		}	
		cell.style.verticalAlign = "middle";
		cell.appendChild(el);
		if (nr>0) mRow.appendChild(mCell);
	}
	this.setFreqSplit = function(band,nr, mode) {
		try {
			var el = document.getElementById("freqSplit"+band+"_"+nr);
			el.selectedIndex = mode ? 0 : 1;
		} catch (err) { }
	}
	this.isFreqSplitFixed = function(band,nr) {
		try {
			var el = document.getElementById("freqSplit"+band+"_"+nr);
			return el.selectedIndex == 0;
		} catch (err) { return 0;}
	}
	this.createMuteMode = function(nr,band) {
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
		el.id = "mutemode"+band+"_"+nr;
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
	this.isMuteModeLinked = function(band,nr) {
		try {
			var el = document.getElementById("mutemode"+band+"_"+nr);
			return el.selectedIndex == 1;
		} catch (err) { return null;}
	}
	this.setMuteMode = function(band,nr,mode) {
		try {
			var el = document.getElementById("mutemode"+band+"_"+nr);
			el.selectedIndex = mode;
		} catch (err) { }
	}
	this.mutemodeDisable = function(band, nr, doDisable) {
		try {
			var el = document.getElementById("mutemode"+band+"_"+nr);
			if (doDisable) {
				el.disabled = true;
				el.style.backgroundColor = "#CCCCCC";
			} else {
				el.disabled = false;
				el.style.backgroundColor = "white";
			}
		} catch (err) {}
	}
	this.createUnitReset = function(nr, band) {
		var box = document.createElement("div");
		var reset = document.createElement("input");
		reset.id = "reset"+band;
		reset.name = reset.id;
		reset.type = "button";
		reset.value = "RESET";
		reset.className = "resetbutton";
		reset.onclick = function() { submitform(nr, true); } 
		box.appendChild(reset);
		return box;
	}
	this.resetDisableStateSet = function(disable) {
		try {
			var el = document.getElementById("reset");
			el.disabled = disable? true : false;
		} catch (err) {}
	}
	this.createTempBoard = function(nr,band) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		tab.align = "center";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = createMetRow("boardTemp"+band+"_"+nr, board_temp_settings, "Temperature", "&ordm;C", 40);
		tb.appendChild(row);
		return box;
	}
	this.boardTempSet = function(nr,val) {
		setMetValue("boardTemp0_"+nr, val);
		setMetValue("boardTemp1_"+nr, val);
	}
	
	this.createGralAlarm = function(num,nr,txt,show){
		var row = document.createElement("tr");
		row.id = "generalAlarmRow_"+num+"_"+nr;
		var cell = document.createElement("th");
		cell.style.width = "70%";
		cell.style.maxWidth = "135pt";
		cell.style.overflow = "hidden";
		row.appendChild(cell);
		if (nr==0 & num==11)
			cell.innerHTML = use7relaysInMaster(self.version)? "Force RF OFF/Remote Ext.Input 4":"Force RF OFF";
		else
			cell.innerHTML = txt;
		cell.className = "thdrht";
		cell.style.fontSize = "10px";
		cell = createLedBox("gralAlarm_"+num+"_"+nr);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
		var nosh = (!show)||(num==6)||(num==7);
		if ((nr>0) && ((num==4)||(num==5))) nosh = true; //remote sin ulpafail ni ant.disconnect
		row.style.display = (nosh)?"none":"table-row";
		return row;
	}
	this.gralAlarmSet = function(num, nr, alarm, alarmremote) {
		ledSetColor("gralAlarm_"+num+"_"+nr, alarm ? "red" : (alarmremote?"yellow":"grey"));
	}
	this.opticalAlarmDisplay = function(opticalLinkNr, nr, show) {
		try {
			var alarmNr;
			if (nr>0){
				if (opticalLinkNr == 0) {
					alarmNr = 6;
				} else if (opticalLinkNr == 1) {
					alarmNr = 7;
				} else {
					return;
				}
			}else{
				alarmNr = opticalLinkNr+16; //alarmas de fibra son alarmas generales 16 a 23
			}
			document.getElementById("generalAlarmRow_"+alarmNr+"_"+nr).style.display = (show ? "table-row":"none");

		} catch(e){}
	}	
	this.createBandAlarm = function(band,num,nr,txt,show){
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.style.width = "70%";
		row.appendChild(cell);
		cell.innerHTML = txt;
		cell.className = "thdrht";
		cell.style.fontSize = "10px";
		cell = createLedBox("bandAlarm_"+num+"_"+band+"_"+nr);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
		row.style.display = show?"table-row":"none";
		return row;
	}	
	this.bandAlarmSet = function(band,num,nr,alarm,alarmremote) {
		ledSetColor("bandAlarm_"+num+"_"+band+"_"+nr, alarm ? "red" : (alarmremote?"yellow":"grey"));
	}
	this.createBbuAlarm = function(nr,num,txt,show){
		var row = document.createElement("tr");
		row.id = "BbuAlarmRow_"+num+"_"+nr;
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
			cont.id = "ChargerErrorCodeId"+"_"+nr;
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
		cell = createLedBox("bbuAlarm_"+num+"_"+nr);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
		row.style.display = show?"table-row":"none";
		return row;
	}
	this.bbuAlarmSet = function(nr, num,alarm,alarmremote, ChargerErrorCodeValue) {
		var id = "bbuAlarm_"+num+"_"+nr;
		var color = "grey";
		if (alarm) {
			color = num>0?"red":"green";
		} else {
			if (nr==0 && num>0) {
				if (alarmremote) color = "yellow";
			}
		}
		ledSetColor(id, color);
		if (num == 3) {
			// Battery Charger Fail
			var el = document.getElementById("ChargerErrorCodeId"+"_"+nr);
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
	this.bbuAlarmsShow = function(nr) {
		var bbuSerialMode = isBbuSerialMode(this.config[nr]);
		var bbuAlarmShowTable = bbuSerialMode;
		if (nr==0){
			for (var k=0;k<=nrOfRemotes;k++){
				bbuAlarmShowTable = bbuAlarmShowTable || isBbuSerialMode(self.config[k]);
			}
		}
		var nrOfRelaysSupported = getNrOfRelaysSupported(this.config[nr], nr);
		var el = document.getElementById("BBUalarmsHeaderRow"+"_"+nr);
		try {
			el.style.display = (bbuAlarmShowTable? "table-row":"none");
		} catch(e){}
		for (var k=0;k<self.NFPA[nr].bbuAlarmsInstalled.length;k++){
			var alarmInstalled = self.NFPA[nr].bbuAlarmsInstalled[k];
			if (nr==0) {
				for (var i=0;i<=nrOfRemotes;i++){
					alarmInstalled = alarmInstalled || self.NFPA[i].bbuAlarmsInstalled[k];
				}
			}
			var show = alarmInstalled&&bbuAlarmShowTable;
			if (nr>0 && self.config[nr].bbu_type==2 && k==10) show=false;   // battery bank alarm not available in H.P. bbu, but shown in master
			var el = document.getElementById("BbuAlarmRow_"+k+"_"+nr);
			try {
				el.style.display = (show? "table-row":"none");
			} catch(e){}
		}
		// number of relays to show can be: 4 if dry-contact mode and, 10 (fip519) or 8+1 (fip421) in serial mode
		for (var relayNr=(nr==0?7:4); relayNr < this.config[nr].NR_OF_RELAYS_MAX; relayNr++) {
			var show = (bbuSerialMode && (relayNr < nrOfRelaysSupported));
			for (var i = 0; i < 2; i++) {
				var k = relayNr*2 + i;
				var el = document.getElementById("RelayRow_"+k+"_"+nr);
				try {
					el.style.display = (show?"table-row":"none");
				} catch(e){}
			}
		}
	}
	this.updateRelayShow = function(nr, monitor) {
		var bbuSerialMode = isBbuSerialMode(self.config[nr]);
		var nrOfRelaysSupported = getNrOfRelaysSupported(self.config[nr], nr);
		var statusBbuSerialMode = monitor.getBbuSerialMode();
		var statusNrOfRelaysSupported = monitor.getNrOfRelaysSupported();
		var reloadRequired = ((bbuSerialMode != statusBbuSerialMode) || (nrOfRelaysSupported != statusNrOfRelaysSupported) );
		if (reloadRequired) {
			if (!reloadIcon){
				showResultIcon(ERR_RELOAD);
				reloadIcon = true;
			}
		}
		return reloadRequired;
	}
	this.createBandBox = function(nr,dn,band) {
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
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.verticalAlign = "top";
		var el = this.createBandCtrlBox(nr, dn,band);
		if ((nr>0 && dn==1) || (nr==0 && dn==0)) cell.style.display = "none";
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.verticalAlign = "top";
		el = this.createBandOutBox(nr, dn,band);
		cell.appendChild(el);
		return box;
	}
	this.createBandCtrlBox = function(nr, dn,band) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row;
		if (dn==0){
			row = this.createSquelchEnable(dn,band,0,nr);
			body.appendChild(row);
			row = this.createSquelchThreshold(dn,band,0,nr);
			body.appendChild(row);				
		}
		row = this.createEqBw(dn,band, nr);
		body.appendChild(row);
		if (dn==1){
			row = this.createEqSq(nr, band);
			body.appendChild(row);
		}
		var bbAgcSettings = {min: 0, low_alarm: -128, low_warn: -128, high_warn: 127, high_alarm: 127, max: 32};
		row = createMetRow("bbAgc_"+band+"_"+dn+"_"+nr, bbAgcSettings, "Input&nbsp;Broadband&nbsp;AGC", "dB" ,40);
		body.appendChild(row);
		return box;
	}
	this.createBandOutBox = function(nr,dn,band) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row = this.createHpaCtl(dn,band,nr);
		body.appendChild(row);
		row = this.createMainGainLim(dn,band,nr);
		if (nr==0 && dn==0) row.style.display = "none";
		body.appendChild(row);
		row = this.createMainPowerLim(dn,band,nr);
		if (nr>0 ^ dn==0) row.style.display = "none";
		if (nr>0 && dn==1){
			row = this.createMaxPower(band,nr);
			body.appendChild(row);
		}
		body.appendChild(row);
		hpa_settings[dn].max = this.factory[nr].powerlimit[2*band+dn] + this.factory[nr].MAX_PWR_DELTA;
		hpa_settings[dn].min = hpa_settings[dn].max - 45;
		hpa_settings[dn].high_warn = this.factory[nr].powerlimit[2*band+dn];
		hpa_settings[dn].high_alarm = this.factory[nr].powerlimit[2*band+dn] + this.factory[nr].MAX_PWR_DELTA;
		row = createMetRow("rfOutPow_"+band+"_"+dn+"_"+nr, hpa_settings[dn], "Output Power", "dBm", 40);
		if ((nr==0 && dn==1) || (nr>0 && dn==0)) row.style.display = "none";
		body.appendChild(row);
		if ((nr==0 && dn==0)||(nr>0 && dn==1)){
			var bbAgcSettings = {min: 0, low_alarm: -128, low_warn: -128, high_warn: 127, high_alarm: 127, max: 32};
			row = createMetRow("bbAgcOut_"+band+"_"+nr, bbAgcSettings, "Output&nbsp;Broadband&nbsp;AGC", "dB" ,40);
			body.appendChild(row);
		}
		return box;
	}

	this.bbAgcSet = function(dn, band, nr, val) {
		setMetValue("bbAgc_"+band+"_"+dn+"_"+nr, val, "undefined", 1);
	}
	this.bbOutAgcSet = function(band, nr, val) {
		setMetValue("bbAgcOut_"+band+"_"+nr, val, "undefined", 1);
	}
	this.rfOutPowSet = function(dn, band, nr, val, oneChOutOn, oneFOlinkOn) {
		if ((oneChOutOn || oneFOlinkOn) && val >= -127) {
			setMetValue("rfOutPow_"+band+"_"+dn+"_"+nr, val);
		} else {
			setMetValue("rfOutPow_"+band+"_"+dn+"_"+nr, "OFF");
		}
	}
	this.createSquelchEnable = function(dn,band,nbadj,nr) {
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
		el.id = "sqEn_"+nbadj+"_"+band+"_"+dn+"_0_"+nr;
		el.name = el.id;
		el.type = "checkbox";
		cell.appendChild(el);
		var show = true;
		if (nbadj==0 && !self.factory[nr].chBandEnabled[band]) show = false;
		if (nbadj==1 && !self.factory[nr].adjBandEnabled[band]) show = false;
		row.style.display = show? "table-row":"none";
		return row;
	}
	this.squelchChEnSet = function(dn, ch, band, nbadj, nr, on) {
		try {
			var el = document.getElementById("sqEn_"+nbadj+"_"+band+"_"+dn+"_"+ch+"_"+nr);
			el.checked = on? true: false;
		} catch (err) {}
	}
	this.squelchChEnIsSet = function(dn, ch, band, nbadj, nr) {
		try {
			var el = document.getElementById("sqEn_"+nbadj+"_"+band+"_"+dn+"_"+ch+"_"+nr);
			return el.checked;
		} catch (err) { return self.config[nr].sqChEnabled[nbadj][band][dn][ch];}
	}	
	this.sqEnDisable = function(dn, band, nbadj, doDisable, nr) {
		var kmax = (nbadj==0?self.maxChannels[nr]:self.config[nr].ADJNR);
		if (nbadj==0 && dn==0) kmax = 1;
		try {
			for (var k=0;k<kmax;k++){
				var el = document.getElementById("sqEn_"+nbadj+"_"+band+"_"+dn+"_"+k+"_"+nr);
				if (doDisable) {
					el.disabled = true;
					el.style.backgroundColor = "#BBBBBB";
				} else {
					el.disabled = false;
					el.style.backgroundColor = "white";
				}
			}
		} catch (err) {}
	}
	this.createEqSq = function(nr, band) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "All&nbsp;Filters&nbsp;Same&nbsp;Squelch&nbsp;Settings";
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "eqSq_"+band+"_"+nr;
		el.name = el.id;
		el.title = "All Filters Same Squelch";
		el.type = "checkbox";
		el.band = band;
		el.nr = nr;
		el.onclick = function(ev) {
			if (this.checked) {
				self.equalSqAllCh(0, this.band, this.nr);
			} else {
				self.originalSqAllCh(this.band, this.nr);
			}
		}
		cell.appendChild(el);
		return row
	}	
	this.createEqBw = function(dn, band, nr) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "All&nbsp;Filters&nbsp;Same&nbsp;BW";
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "eqBw_"+band+"_"+dn+"_"+nr;
		el.name = el.id;
		el.title = "All Filters Same BW";
		el.type = "checkbox";
		el.uldl = dn;
		el.band = band;
		el.nr = nr;
		el.onclick = function(ev) {
			if (this.checked) {
				self.equalBwAllCh(this.uldl, 0, this.band, this.nr);
			} else {
				self.originalBwAllCh(this.uldl, this.band, this.nr);
			}
		}
		cell.appendChild(el);
		return row
	}
	this.equalBwAllCh = function(b, c, band, nr) {
		var id = "chBw_"+c+"_"+b+"_"+band+"_"+nr;
		var el = document.getElementById(id);
		var ix;
		try {
			ix = el.selectedIndex;
		} catch(err) { ix = 0; }	
		for (var i = 0; i < self.maxChannels[nr]; ++i) {
			self.config[nr].bwIndex[band][b][i] = ix;
			var id = "chBw_"+i+"_"+b+"_"+band+"_"+nr;
			var el = document.getElementById(id);
			try {
				el.selectedIndex = ix;
			} catch(err) {}
		}
	}
	this.equalSqAllCh = function(c, band, nr) {
		var txt = document.getElementById("sqThr_0_"+band+"_1_"+c+"_"+nr);
		var chk = document.getElementById("sqEn_0_"+band+"_1_"+c+"_"+nr);
		var sqEn, sqTh;
		try {
			sqEn = chk.checked;
			sqTh = parseInt(txt.value);
		} catch(err) {
			sqEn = true;
			sqTh = -80;
		}
		if (isNaN(sqTh)) sqTh = -80;
		for (var i = 0; i < self.maxChannels[nr]; ++i) {
			self.config[nr].sqChEnabled[0][band][1][i] = sqEn;
			self.config[nr].sqChThreshold[0][band][1][i] = sqTh;
			txt = document.getElementById("sqThr_0_"+band+"_1_"+i+"_"+nr);
			chk = document.getElementById("sqEn_0_"+band+"_1_"+i+"_"+nr);
			try {
				chk.checked = sqEn;
				txt.value = sqTh;
			} catch(err) {}
		}
	}	
	this.originalBwAllCh = function(b, band, nr) {
		for (var c = 0; c < self.maxChannels[nr]; ++c) {
			self.chBwSet(b, c, band, nr, self.config[nr].bwIndex[band][b][c]);
		}
	}
	this.originalSqAllCh = function(band, nr) {
		for (var c = 0; c < self.maxChannels[nr]; ++c) {
			self.squelchChEnSet(1, c, band, 0, nr, self.config[nr].sqChEnabled[0][band][1][c]);
			self.squelchChThrSet(1, c, band, 0, nr, self.config[nr].sqChThreshold[0][band][1][c]);
		}
	}
	this.eqBwSet = function(dn, band, nr, on) {
		try {
			var el = document.getElementById("eqBw_"+band+"_"+dn+"_"+nr);
			el.checked = on? true: false;
		} catch (err) {}
	}
	this.eqBwIsSet = function(dn, band, nr) {
		try {
			var el = document.getElementById("eqBw_"+band+"_"+dn+"_"+nr);
			return el.checked;
		} catch (err) {
			return false;
		}
	}
	this.eqSqSet = function(band, nr, on) {
		try {
			var el = document.getElementById("eqSq_"+band+"_"+nr);
			el.checked = on? true: false;
		} catch (err) {}
	}
	this.eqSqIsSet = function(band, nr) {
		try {
			var el = document.getElementById("eqSq_"+band+"_"+nr);
			return el.checked;
		} catch (err) {
			return false;
		}
	}	
	this.getSquelchThresholdMin = function(b, band, nr) {
		var simplex = false;
		try {
			var el = document.getElementById("simplex"+band+"_"+nr);
			simplex = el.checked;
		} catch(e) { simplex = false;}
		return self.config[nr].sqThrLimits(simplex, b, self.factory[nr].ULlowGainMode).MIN;
	}
	this.getSquelchThresholdMax = function(b, band, nr) {
		var simplex = false;
		try {
			var el = document.getElementById("simplex"+band+"_"+nr);
			simplex = el.checked;
		} catch(e) { simplex = false;}
		return self.config[nr].sqThrLimits(simplex, b, self.factory[nr].ULlowGainMode).MAX;
	}
	this.updateSquelchThresholdTitles = function(band, nr, simplex) {
		for (var b = 0; b < 2; ++b) {
			try {
				var min = self.config[nr].sqThrLimits(simplex, b, self.factory[nr].ULlowGainMode).MIN;
				var max = self.config[nr].sqThrLimits(simplex, b, self.factory[nr].ULlowGainMode).MAX;
				for (var nbadj=0;nbadj<2;nbadj++){
					var cmax = (nbadj==0?self.maxChannels[nr]:self.config[nr].ADJNR);
					if (nbadj==0 && b==0) cmax = 1;
					for (var c=0;c<cmax;c++){
						var el = document.getElementById("sqThr_"+nbadj+"_"+band+"_"+b+"_"+c+"_"+nr);
						el.title = "Min: "+min+", Max: "+max+" dBm";
					}
				}
			} catch(e) {}
		}
	}
	this.createChSquelchEnable = function(dn,ch,band,nbadj,nr) {
		var cell = document.createElement("tr");
		var el = document.createElement("input");
		el.style.margin = "2px 2px 2px 2px";
		el.id = "sqEn_"+nbadj+"_"+band+"_"+dn+"_"+ch+"_"+nr;
		el.name = el.id;
		el.type = "checkbox";
		el.dn = dn;
		el.nr = nr;
		el.band = band;
		el.nbadj = nbadj;
		el.ch = ch;
		el.onchange = function(ev) {
			var target = this;
			var dn = target.dn;
			var band = target.band;
			var nbadj = target.nbadj;
			var ch = target.ch;
			var nr = target.nr;
			self.config[nr].sqChEnabled[nbadj][band][dn][ch] = target.checked;
			if (!self.eqSqIsSet(band,nr) || nbadj==1 || dn ==0) {
				return;
			}
			self.equalSqAllCh(ch, band, nr);			
		}		
		cell.appendChild(el);
		return cell;
	}
	this.createChSquelchThreshold = function(dn,ch,band,nbadj,nr) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "sqThr_"+nbadj+"_"+band+"_"+dn+"_"+ch+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.style.width = "28px";
		el.dn = dn;
		el.nr = nr;
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
			var nr = target.nr;
			if (!self.eqSqIsSet(band,nr) || nbadj==1 || dn ==0) {
				return;
			}
			setTimeout(function() {self.equalSqAllCh(ch, band, nr);}, 100);		
		}
		el.className = "number";
		var simplex = self.isSimplexMode(band, nr, self.config[nr].simplexMode[band]);
		var min = self.config[nr].sqThrLimits(simplex, dn, self.factory[nr].ULlowGainMode).MIN;
		var max = self.config[nr].sqThrLimits(simplex, dn, self.factory[nr].ULlowGainMode).MAX;
		el.title = "Min: "+min+", Max: "+max+" dBm";
		el.onchange = function(ev) {
			var target = this;
			var dn = target.dn;
			var band = target.band;
			var nbadj = target.nbadj;
			var ch = target.ch;
			var nr = target.nr;
			var num = self.squelchChThrGet(dn,ch,band,nbadj,nr);
			var min = self.getSquelchThresholdMin(dn, band, nr);
			var max = self.getSquelchThresholdMax(dn, band, nr);
			if (num < min) {
				target.value = min;
			} else if (num > max) {
				target.value = max;
			} else {
				target.value = num;
			}
			self.config[nr].sqChThreshold[nbadj][band][dn][ch] = num;
			if (!self.eqSqIsSet(band,nr) || nbadj==1 || dn ==0) {
				return;
			}
			self.equalSqAllCh(ch, band, nr);			
		}
		cell.appendChild(el);
		return cell;
	}
	this.createSquelchThreshold = function(dn,band,nbadj,nr) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = (nbadj==0? "Filters&nbsp;":"Adj.BW&nbsp;")+Texts['THRS'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "sqThr_"+nbadj+"_"+band+"_"+dn+"_0_"+nr;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.dn = dn;
		el.band = band;
		el.nbadj = nbadj;
		el.nr = nr;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		var simplex = self.isSimplexMode(band, nr, self.config[nr].simplexMode[band]);
		var min = self.config[nr].sqThrLimits(simplex, dn, self.factory[nr].ULlowGainMode).MIN;
		var max = self.config[nr].sqThrLimits(simplex, dn, self.factory[nr].ULlowGainMode).MAX;
		el.title = "Min: "+min+", Max: "+max+" dBm";
		el.onchange = function(ev) {
			var target = this;
			var dn = target.dn;
			var band = target.band;
			var nbadj = target.nbadj;
			var nr = target.nr;
			var num = self.squelchChThrGet(dn,0,band,nbadj,nr);
			var min = self.getSquelchThresholdMin(dn, band, nr);
			var max = self.getSquelchThresholdMax(dn, band, nr);
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
		var show = true;
		if (nbadj==0 && !self.factory[nr].chBandEnabled[band]) show = false;
		if (nbadj==1 && !self.factory[nr].adjBandEnabled[band]) show = false;
		row.style.display = show? "table-row":"none";
		return row;
	}
	this.squelchChThrSet = function(dn, ch, band, nbadj, nr, val) {
		try {
			var el = document.getElementById("sqThr_"+nbadj+"_"+band+"_"+dn+"_"+ch+"_"+nr);
			if (!isNaN(val))
				el.value = val;
		} catch (err) {}
	}
	this.squelchChThrGet = function(dn, ch, band, nbadj, nr) {
		try {
			var el = document.getElementById("sqThr_"+nbadj+"_"+band+"_"+dn+"_"+ch+"_"+nr);
			return parseInt(el.value);
		} catch (err) { return self.config[nr].sqChThreshold[nbadj][band][dn][ch];}
	}
	this.createMaxPower = function (band, nr){
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Maximum Power";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "maxPower_"+band+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.className = "number";
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dBm";
		cell.style.textAlign = "left";
		return row;
	}
	this.maxPowerSet = function(band, nr, val) {
		try {
			var el = document.getElementById("maxPower_"+band+"_"+nr);
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.createMainGainLim = function(dn, band, nr) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		var br = nr==0?1:0;
		if (nr==0) {
			cell.innerHTML = (dn==0?"UL Output ":"DL Input ") + "Attenuation";
		} else {
			cell.innerHTML = (dn==0?"UL Input ":"DL Output ") + "Attenuation";
		}
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "mainGainLimit_"+band+"_"+dn+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.dn = dn;
		el.band = band;
		el.nr = nr;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		// se muestra atenuación en todos los casos, no solamente DL
		var gmin = 0;
		var gmax = -self.config[nr].GmainRange[dn];
		self.mainGainMax[nr][band][dn] = self.factory[nr].gainlimit[2*band+dn];
		el.title = "Min: "+gmin+", Max: " + gmax+" dB";
		el.onchange = function(ev) {
			var target = this;
			var band = target.band;
			var dn = target.dn;
			var nr = target.nr;
			var num = self.mainGainLimGet(dn,band,nr);
			var gmin = self.factory[nr].gainlimit[2*band+dn]-self.mainGainMax[nr][band][dn];
			var gmax = -self.config[nr].GmainRange[dn];
			if (num < gmin) {
				num = gmin;
			} else if (num > gmax) {
				num = gmax;
			}
			target.value = num;
			if (nr==0 ^ dn==0){
				var g = self.factory[nr].gainlimit[2*band+dn]-num;
				var max = self.factory[nr].powerlimit[2*band+dn]-g;
				var min = self.factory[nr].powerlimit[2*band+dn] - self.factory[nr].gainlimit[2*band+dn] - self.MAIN_POWER_RANGE; //El mínimo es absoluto, no depende de conf.gain
				document.getElementById("mainPowerLimit_"+band+"_"+dn+"_"+nr).title = "Min: "+min+", Max: "+max+" dBm";
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dB";
		cell.style.textAlign = "left";
		return row;
	}
	this.mainGainLimSet = function(dn, band, nr, val) {
		try {
			var el = document.getElementById("mainGainLimit_"+band+"_"+dn+"_"+nr);
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.mainGainLimGet = function(dn, band, nr) {
		try {
			var el = document.getElementById("mainGainLimit_"+band+"_"+dn+"_"+nr);
			return parseInt(el.value);
		} catch (err) { return -128; }
	}
	this.statGainMainTitle = function(b, band, nr, g) {
		try {
			var maxgain = self.factory[nr].gainlimit[2*band+b];
			var mingain = self.factory[nr].gainlimit[2*band+b]+self.config[nr].GmainRange[b];
			if (maxgain > g) {
				maxgain = g;
			}
			if (maxgain < mingain) {
				maxgain = self.factory[nr].gainlimit[2*band+b];
			}
			if (maxgain == self.mainGainMax[nr][band][b]) {
				return;
			}
			if (maxgain<mingain) maxgain = self.factory[nr].gainlimit[2*band+b];
			self.mainGainMax[nr][band][b] = maxgain;
			var gmin = self.factory[nr].gainlimit[2*band+b]-self.mainGainMax[nr][band][b];
			var gmax = -self.config[nr].GmainRange[b];
			var title = "Min: "+gmin+", Max: "+gmax+" dB";
			var id = "mainGainLimit_"+band+"_"+b+"_"+nr;
			var el = document.getElementById(id);
			el.title = title;
		} catch(err) {}
	}
	this.createMainPowerLim = function(dn, band, nr) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		if ( this.factory[nr].ULlowGainMode ) {
			cell.innerHTML = dn==0?"Power per channel":"Input AGC per channel<br>Composite Power Set";
		} else {
			cell.innerHTML = "Input AGC per channel<br>Composite Power Set";
		}
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "mainPowerLimit_"+band+"_"+dn+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.dn = dn;
		el.nr = nr;
		el.band = band;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		var max = this.factory[nr].powerlimit[2*band+dn]-this.config[nr].gain[band][dn];
		var min = self.factory[nr].powerlimit[2*band+dn] - self.factory[nr].gainlimit[2*band+dn] - self.MAIN_POWER_RANGE; //El mínimo es absoluto, no depende de conf.gain
		el.title = "Min: "+min+", Max: "+max+" dBm";
		el.onchange = function(ev) {
			var target = this;
			var band = target.band;
			var dn = target.dn;
			var nr = target.nr;
			var g = self.mainGainLimGet(dn,band,nr);
			g = self.factory[nr].gainlimit[2*band+dn]-g; //ATT --> gain
			var num = self.mainPowerLimGet(dn,band,nr);
			var max = self.factory[nr].powerlimit[2*band+dn]-g;
			var min = self.factory[nr].powerlimit[2*band+dn] - self.factory[nr].gainlimit[2*band+dn] - self.MAIN_POWER_RANGE; //El mínimo es absoluto, no depende de conf.gain
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
	this.mainPowerLimSet = function(dn, band, nr, val) {
		try {
			var el = document.getElementById("mainPowerLimit_"+band+"_"+dn+"_"+nr);
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.mainPowerLimGet = function(dn, band, nr) {
		try {
			var el = document.getElementById("mainPowerLimit_"+band+"_"+dn+"_"+nr);
			return parseInt(el.value);
		} catch (err) { return -128; }
	}
	this.createHpaCtl = function(dn,band,nr) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "RF Enable";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createHpaSwitch(dn,band,nr);
		cell.appendChild(el);
		return row;
	}
	this.createHpaSwitch = function(dn,band,nr) {
		var box = document.createElement("div");
		box.id = "hpaSwBox_"+band+"_"+dn+"_"+nr;
		box.style.border = "medium solid #00AAAA";
		box.style.width = "40px";
		box.style.height = "10px";
		box.style.verticalAlign = "middle";
		box.style.textAlign = "center";
		box.style.padding = "2px";
		box.style.backgroundColor = "#D0FFD0";
		box.style.borderStyle = "inset";
		box.style.borderRadius = "3px";
		box.style.marginLeft = "auto";
		box.style.marginRight = "auto";
		box.onmouseover = function() { this.style.borderColor = "#3030A0"; };
		box.onmouseout = function() { this.style.borderColor = "#30AAAA"; };
		var lbl = document.createElement("label");
		box.appendChild(lbl);
		lbl.id = "hpaSwLbl_"+band+"_"+dn+"_"+nr;
		lbl.className = "togglebuttonlabel";
		lbl.setAttribute("unselectable", "on");
		lbl.style.whiteSpace = "nowrap";
		lbl.style.fontWeight = "bold";
		lbl.style.display = "inline-block";
		lbl.style.width = "40px";
		lbl.style.height = "12px";
		lbl.innerHTML = "ON";
		var el = document.createElement("input");
		el.id = "hpaSwInp_"+band+"_"+dn+"_"+nr;
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
		el.nr = nr;
		el.onclick = function() {
			var on = this.checked;
			var forcePaOn = [[false,false],[false,false]];
			var forcePaOff = [[false,false],[false,false]];		
			var nr = this.nr;	
			var band = this.band;
			var b = this.dn;			
			if (window.event.ctrlKey) {
				for (var b = 0; b < 2; b++) {
					for (var r = 0; r < 2; r++) {
						self.hpaSwSet(r, b, nr, on);
						if (on){
							forcePaOn[b][r] = true;
						}else{
							forcePaOff[b][r] = true;
						}
					}
				}
				submitform(this.nr, false, false, false, false, false, true, forcePaOn, forcePaOff);
			} else {

				self.hpaSwToggle(this.dn,this.band,this.nr);
				if (on){
					forcePaOn[band][b] = true;
				}else{
					forcePaOff[band][b] = true;
				}					
				submitform(this.nr, false, false, false, false, false, true, forcePaOn, forcePaOff);
			}
		};
		box.appendChild(el);
		return box;
	}
	this.hpaSwToggle = function(dn,band,nr) {
		try {
			var box = document.getElementById("hpaSwBox_"+band+"_"+dn+"_"+nr);
			var lbl = document.getElementById("hpaSwLbl_"+band+"_"+dn+"_"+nr);
			var el =  document.getElementById("hpaSwInp_"+band+"_"+dn+"_"+nr);
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
	this.hpaIsOn = function(dn,band,nr) {
		try {
			var el = document.getElementById("hpaSwInp_"+band+"_"+dn+"_"+nr);
			return el.checked;
		} catch (err) {	return false; }
	}
	this.hpaSwSet= function(dn, band, nr, on) {
		try {
			var box = document.getElementById("hpaSwBox_"+band+"_"+dn+"_"+nr);
			var lbl = document.getElementById("hpaSwLbl_"+band+"_"+dn+"_"+nr);
			var el =  document.getElementById("hpaSwInp_"+band+"_"+dn+"_"+nr);
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
	this.hpaSwDisableStateSet = function(dn, band, nr, disable) {
		try {
			var hpaEn = document.getElementById("hpaSwInp_"+band+"_"+dn+"_"+nr);
			hpaEn.disabled = disable? true : false;
		} catch (err) { }
	}
	this.setStatePaOn = function(b, band, nr, monitor) {
		var statOn = monitor.statePaOn[band][b];
		var currentState = self.hpaIsOn(b,band,nr);
		if (statOn != currentState) {
			self.hpaSwSet(b, band, nr, statOn);
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
	this.createChBw = function(b, c, band, nr) {
		var cell = document.createElement("td");
		var el = document.createElement("select");
		cell.appendChild(el);
		el.id = "chBw_"+c+"_"+b+"_"+band+"_"+nr;
		el.name = el.id;
		el.className = "centered";
		el.style.fontSize = "10px";
		el.style.minWidth = "69px";
		el.style.disabled = "false";
		for (var i = 0; i < this.BWtable.length; i++) {
			this.BWtable[i].include = !(this.BWtable[i].ix < 0);
			if (i==0 && !self.factory[nr].commonUl) this.BWtable[i].include = false; //no hay filtro 150KHz en V/U
		}
		for (var i = 0; i < this.BWtable.length; i++) {
			if (!this.BWtable[i].include) {
				continue;
			}
			var opt = document.createElement("option");
			el.options.add(opt);
			var v = FilterTypes[self.factory[nr].commonUl?1:0][band][i]['data'][3];
			if (!self.factory[nr].commonUl && self.factory[nr].fmodulo*self.factory[nr].fstep == 10000000) v+=0.3; //delay incremented by 0.3 for clk = 480MHz
			opt.text = this.BWtable[i].txt+" "+v.toFixed(1)+"us";
			opt.style.textAlign = "center";
			opt.value = this.BWtable[i].value;
			opt.khz = this.BWtable[i].khz;
			opt.index = this.BWtable[i].ix;
		}
		el.selectedIndex = 0;
		el.bandNr = b;
		el.chNr = c;
		el.band = band;
		el.nr = nr;
		el.onchange = function(ev) {
			self.config[this.nr].bwIndex[this.band][this.bandNr][this.chNr] = this.value;
			if (!self.eqBwIsSet(this.bandNr,this.band,this.nr)) {
				return;
			}
			self.equalBwAllCh(this.bandNr, el.chNr, this.band, this.nr);
		}
		return cell;
	}
	this.chBwSet = function(b, c, band, nr, bw) {
		var el = document.getElementById("chBw_"+c+"_"+b+"_"+band+"_"+nr);
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
	this.chBwGet = function(b, c, band, nr) {
		try {
			var el = document.getElementById("chBw_"+c+"_"+b+"_"+band+"_"+nr);
			var k = el.selectedIndex;
			return el.options[k].value;
		} catch (err) {return self.config[nr].bwIndex[band][b][c];}
	}
	this.chBwGetKHz = function(b, c, band, nr) {
		try {
			var el = document.getElementById("chBw_"+c+"_"+b+"_"+band+"_"+nr);
			var k = el.selectedIndex;
			return el.options[k].khz;
		} catch (err) {return self.config[nr].bwKHz[band][b][c];}
	}
	this.createMetPowIn = function(b, c, band, nbadj, nr) {
		var simplex = self.isSimplexMode(band, nr, self.config[nr].simplexMode[band]);
		var settings = simplex ? chRfIn_settings[0] : chRfIn_settings[b];
		return createMetCell("rfInPow_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr, settings);
	}
	this.createTextPowIn = function(b, c, band, nbadj,nr, w) {
		return createTextCell("rfInPow_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr,w);
	}
	this.rfChInPowSet = function(b, c, band, nbadj, nr, val, color) {
		setMetValue("rfInPow_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr, val, color);
	}
	this.createSignalDetect = function(b, c, band, nbadj, nr) {
		return createLedBox("rfSignalIn_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr);
	}
	this.rfSignalLedSet = function(b, c, band, nbadj, nr, color) {
		ledSetColor("rfSignalIn_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr, color);
	}
	this.createMetPowOut = function(b, c, band, nbadj, nr) {
		return createMetCell("rfOutPow_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr, chRfOut_settings[b]);
	}
	this.createTextPowOut = function(b, c, band, nbadj, nr, w) {
		return createTextCell("rfOutPow_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr,w);
	}
	this.rfChOutPowSet = function(b, c, band, nbadj, nr, val, isOn) {
		var id = "rfOutPow_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr;
		if (isOn) {
			setMetValue(id, val, "normal");
		} else {
			setMetValue(id, "OFF", "warning");
		}
	}
	this.createMetAgc = function(b, c, band, nbadj, nr) {
		return createMetCell("agc_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr, agc_settings[b]);
	}
	this.createTextAgc = function(b, c, band, nbadj, nr, w) {
		return createTextCell("agc_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr,w);
	}
	this.agcSet = function(b, c, band, nbadj, nr, val) {
		setMetValue("agc_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr, val);
	}
	this.showFreqs = function() {
		for (var nr=0;nr<=nrOfRemotes;nr++){
			for (var band=0;band<2;band++){
				self.setFreqSplit(band,nr,self.config[nr].uldlLinkedFreq[band]);
				for (var c = 0; c < self.maxChannels[nr]; ++c) {
					for (var b = 0; b < 2; ++b) self.setFreqCh(b, c, band, nr, self.config[nr].freqHz[band][b][c]);
				}			
			}
		}
	}
	this.equalFreqs = function(cnf, band){
		for (var nr=1;nr<=nrOfRemotes;nr++){
			var stp = self.factory[nr].fstep;
			if (stp<=1.5e3) stp/=2;
			if (remoteGlobalConfResponseValid[nr-1]){				
				if (cnf[nr].numberOfFilterNonGrouped[band][0]!=cnf[0].numberOfFilterNonGrouped[band][1]) return -2; 
				//if (cnf[nr].allChSameBW[band][0]!=cnf[0].allChSameBW[band][1]) return -3;
				
				for (var c = 0; c < self.maxChannels[nr]; ++c) {
					if (cnf[nr].filterEnabled[0][band][0][c]!=cnf[0].filterEnabled[0][band][1][c]) return -4;
					if (cnf[nr].filterEnabled[0][band][0][c]){
						if (Math.abs(cnf[nr].freqHz[band][0][c]-(cnf[0].freqHz[band][1][c]-self.factory[nr].uldlFreqSplit[band]))>(stp/2+5)) return -5;
						if (cnf[nr].bwIndex[band][0][c]!=cnf[0].bwIndex[band][1][c]) return -6;
						if (cnf[nr].fineGainFilter[0][band][0][c]!=cnf[0].fineGainFilter[0][band][1][c]) return -7;
						if (cnf[nr].isFilterGrouped[band][0][c]!=cnf[0].isFilterGrouped[band][1][c]) return -8;
					}
				}
				for (var c = 0; c < self.maxChannelsADJ; ++c) {
					if (cnf[nr].filterEnabled[1][band][0][c]!=cnf[0].filterEnabled[1][band][1][c]) return -9;
					if (cnf[nr].filterEnabled[1][band][0][c]){
						if (cnf[nr].fineGainFilter[1][band][0][c]!=cnf[0].fineGainFilter[1][band][1][c]) return -10;
						if (cnf[nr].fstartHzAdjFilter[band][0][c]!=(cnf[0].fstartHzAdjFilter[band][1][c]-self.factory[nr].uldlFreqSplit[band])) return -11;
						if (cnf[nr].fstopHzAdjFilter[band][0][c]!=(cnf[0].fstopHzAdjFilter[band][1][c]-self.factory[nr].uldlFreqSplit[band])) return -12;
					}
				}
			}
		}
		return 0;
	}
	this.getFreqs = function(cnf, ncfg, nr, band) {
		if (nr==0) cnf.uldlLinkedFreq[band] = self.isFreqSplitFixed(band,nr);	
		var b = nr==0?1:0; // solo UL o DL
		var br = (nr==0 || self.isFreqSplitFixed(band,0))?1:0;
		for (var c = 0; c < self.maxChannels[ncfg]; ++c) {
			var fr = self.getFreqCh(br, c, band, ncfg);
			if (fr < self.factory[ncfg].fstart[2*band+br]) fr = self.factory[ncfg].fstart[2*band+br];
			if (fr > self.factory[ncfg].fstop[2*band+br]) fr = self.factory[ncfg].fstop[2*band+br];
			var stp = self.factory[ncfg].fstep;
			if (stp<=1.5e3) stp/=2;
			fr = ~~Math.round(fr/stp);
			fr *= stp;
			if (self.isFreqSplitFixed(band,0) && nr>0) {
				fr -= self.factory[ncfg].uldlFreqSplit[band];
				b=0;					
				if (fr < self.factory[ncfg].fstart[2*band+b]) fr = self.factory[ncfg].fstart[2*band+b];
				if (fr > self.factory[ncfg].fstop[2*band+b]) fr = self.factory[ncfg].fstop[2*band+b];
				self.setFreqCh(b, c, band, nr, fr);
			}
			cnf.freqHz[band][b][c] = fr;
		}//Getting first enable, bw and fine gain to compute overlapping properly
		for (var c = 0; c < self.maxChannels[ncfg]; ++c) {
			var on = self.getShowFilter(c, band, 0, ncfg) && self.factory[nr].chBandEnabled[band];
			cnf.filterEnabled[0][band][0][c] = false;
			cnf.filterEnabled[0][band][1][c] = false;
			if (on !== null) {
				cnf.filterEnabled[0][band][b][c] = on;
			}
			var bw = ~~self.chBwGet(br, c, band,ncfg);
			if (bw !== null) {
				cnf.bwIndex[band][b][c] = bw;
			}
			var gfine = self.getGfine(c, br, band, 0, ncfg);
			if (gfine !== null) {
				if (gfine > self.config[ncfg].limitgFine[b].MAX) gfine = self.config[ncfg].limitgFine[b].MAX;
				if (gfine < self.config[ncfg].limitgFine[b].MIN) gfine = self.config[ncfg].limitgFine[b].MIN;
				cnf.fineGainFilter[0][band][b][c] = gfine;
			}
		}
		for (var c = 0; c < self.maxChannels[ncfg]; ++c) {
			cnf.isFilterGrouped[band][b][c] = self.filterBelongsToCombination(cnf, b, c, band, nr);
		}
		cnf.numberOfFilterNonGrouped[band][b] = self.computeFilterCombineReduction(cnf, b, band, nr);
		cnf.allChSameBW[band][b] = self.eqBwIsSet(br,band,ncfg);

		for (var c = 0; c < self.config[ncfg].ADJNR; ++c) {
			self.getAdjChConf(cnf, c, band, ncfg, nr);
		}
		for (var c = self.factory[ncfg].numADJFilters; c < self.maxChannelsADJ; ++c) {
			cnf.filterEnabled[1][band][b][c] = false; //only affects master DL and remote UL
		}
		if (band==0) cnf.firstADJisFirstNet = self.getFirstNet(ncfg);
		return cnf;
	}
	this.getSqConf = function(cnf,nr){
		for (var band = 0; band < 2; ++band) {
			var simplex = (self.getSimplexMode(band,nr) && self.factory[nr].Simplex[band]);
			cnf.simplexMode[band] = simplex;
			cnf.muteModeLinked[band] = self.isMuteModeLinked(band,nr);
			cnf.allSameSquelch[band] = self.eqSqIsSet(band,nr);
			var b = nr==0?1:0;//solo UL o DL
			for (var nbadj = 0;nbadj<2;nbadj++){
				var cmax = nbadj==0?self.config[nr].CHNR:self.config[nr].ADJNR;
				if (nbadj==0 && b==0) cmax=1;
				for (var c=0;c<self.maxChannels[nr];c++){
					cnf.sqChEnabled[nbadj][band][b][c] = self.squelchChEnIsSet(b,c,band,nbadj,nr);
					var sqth = self.squelchChThrGet(b,c,band,nbadj,nr);
					var sqthMin = self.config[nr].sqThrLimits(simplex, b, self.factory[nr].ULlowGainMode).MIN;
					var sqthMax = self.config[nr].sqThrLimits(simplex, b, self.factory[nr].ULlowGainMode).MAX;
					if (sqth < sqthMin) sqth = sqthMin;
					if (sqth > sqthMax) sqth = sqthMax;
					cnf.sqChThreshold[nbadj][band][b][c] = sqth;
				}
			}
			if (simplex){
				cnf.muteModeLinked[band] = false;
				for (var nbadj = 0;nbadj<2;nbadj++){
					var cmax = nbadj==0?self.maxChannels[nr]:self.config[nr].ADJNR;
					if (nbadj==0 && b==0) cmax=1;
					for (var c=0;c<self.config[nr].CHNR;c++) cnf.sqChEnabled[nbadj][band][b][c] = true;
				}
			}
		}
		return cnf;
	}
	this.getGralConf = function(cnf,nr){
		if (nr==0){
			cnf.masterMode = self.masterModeGet();
			for (var k=0;k<self.config[0].masterModeAlarmEnables.length;k++){
				cnf.masterModeAlarmEnables[k] = self.masterModeAlarmEnableGet(k);
			}
		}
		for (var band = 0; band < 2; ++band) {
			for (var b = 0; b < 2; ++b) {
				//cnf.paEnabled[band][b] = self.config[nr].paEnabled[band][b];
				var gmain = self.mainGainLimGet(b, band, nr);
				gmain = self.factory[nr].gainlimit[2*band+b]-gmain; //ATT
				var gainMax = self.factory[nr].gainlimit[2*band+b];
				var gainMin = self.factory[nr].gainlimit[2*band+b]+self.config[nr].GmainRange[b];
				if (gmain > gainMax) gmain = gainMax;
				if (gmain < gainMin) gmain = gainMin;
				cnf.gain[band][b] = gmain;
				var pmain = self.mainPowerLimGet(b,band,nr);
				if (nr==0 ^ b==0){
					var agcSensMin = self.factory[nr].powerlimit[2*band+b] - self.factory[nr].gainlimit[2*band+b] - self.MAIN_POWER_RANGE;
					//El mínimo se establece sobre AGC sensitiviy antes de hacer el cambio de variable
					if (pmain < agcSensMin) pmain = agcSensMin;
					pmain+=gmain;
					var powerMax = self.factory[nr].powerlimit[2*band+b];
					if (pmain > powerMax) pmain = powerMax;
					cnf.power[band][b] = pmain; //unused values master UL and remote DL are kept
				}

			}
		}
		return cnf;
	}
	this.getDelays = function(cnf, nr){
		if (nr==0) return;
		cnf.FOgroupDelayEnable = self.getDelayAdjustEnableChecked(nr);
		for (var port = 0; port < 2; port++) {
			for (var k = 0; k < 2; k++) {
				cnf.FOgroupDelay[port][k] = self.getDelayAdjust(port, k, nr);
			}
		}
	}
	this.getAlarmConf = function(cnf, nr){
		cnf.extremeTempAction = self.readExtremeTemperatureAction(nr);
		cnf.oscTimeThSeconds[0] = self.getAbnSqTime(nr);
		cnf.oscRetryTimeHours[0] = self.getRetryTime(nr);
		cnf.oscFeatureEnabled[0] = true;
		cnf.oscActionAfterAlarm[0] = self.opfModeGet(nr);
		cnf.autoUlPaOffTimer = self.getAutoPaUlOffTime(0);

		for (var k=0;k<cnf.NR_OF_RELAYS_MAX;k++){
			cnf.delayTimerON[k] = this.delayLatchOnOffGet(0,k,nr);
			cnf.latchTimerON[k] = this.delayLatchOnOffGet(1,k,nr);
			cnf.delayTimer[k] = this.delayLatchTimeGet(0,k,nr);
			cnf.latchTimer[k] = this.delayLatchTimeGet(1,k,nr);
		}
		if (nr==0 || (nr>0 && cnf.received_data_frame_index>0)) {
			cnf.bbu_serial_mode = self.readBbuTypeOfConnection(nr);
		}
		return cnf;
	}
	this.checkFreqs = function(cnfValid, cnf, nr) {
		if (!cnfValid) cnf = self.config[nr];
		var fov = [];
		var result = 0;
		for (var band=0;band<2;band++) fov.push(self.computeFiltersOverlap(cnf, band, nr));
		for (var band=0;band<2;band++) fov.push(self.computeAdjFiltersOverlap(cnf, band, nr));
		for (var band=0;band<2;band++) fov.push(self.computeNBAdjFiltersOverlap(cnf, band, nr));
		for (var band=0;band<2;band++) fov.push(self.checkClassBFilters(cnf, band, nr));
		var filtSepKhz = this.FilterValidSep;
		var filtAdjSepKhz = this.FILTSEPADJKHZ;
		var filtNbAdjSepKhz = this.FILTSEPNBADJKHZ;
		var checkOv = false, checkB = false;
		for (var i=0;i<6;i++){
			if (fov[i]['check']) checkOv=true;
		}
		for (var i=6;i<8;i++){
			if (fov[i]['check']) checkB=true;
		}
		if (checkOv || checkB && !self.blocked[nr]) {
			var uldlLinked = [self.isFreqSplitFixed(0,nr),self.isFreqSplitFixed(1,nr)];
			self.setWarningMessage(fov, filtSepKhz, filtAdjSepKhz, filtNbAdjSepKhz, self.maxChannels[nr], self.factory[nr], uldlLinked, nr);
			if (checkOv) result |= 0x1; //Filter Overlapping
			if (checkB) result |= 0x2; //Class B Filters
		} else {
			self.hideWarning(nr);
		}
		return result;
	}
	this.displayFilters = function(band,nr) {
		var shownb = false;
		var showadj = false;
		for (var c=0;c<self.maxChannels[nr];c++){
			if (self.showFiltersMask[nr][0][band][c]) shownb = true;
		}
		shownb = (self.factory[nr].chBandEnabled[band]) && shownb;
		for (var c=0;c<self.config[nr].ADJNR;c++){
			if (self.showFiltersMask[nr][1][band][c]) showadj = true;
		}
		showadj = (self.factory[nr].adjBandEnabled[band]) && showadj;
		el = document.getElementById("filtersRow_"+band+"_1_"+nr);
		el.style.display = (showadj) ? "table-row" : "none";
		el = document.getElementById("filtersRow_"+band+"_0_"+nr);
		el.style.display = (shownb) ? "table-row" : "none";

	}
	this.computeShowOpfSettings = function(nr) {
		return self.factory[nr].oscFeatureEnable;
	}
	this.computeShowExtremeTempAction = function(nr) {
		return self.factory[nr].extremeTempActionEnable;
	}
	this.showConfWarnMessage= function(warning,str){
		var el = document.getElementById("warnConfCell_0");
		el.style.display = warning?"table-cell":"none";
		var el = document.getElementById("warnConfCell_1");
		el.style.display = warning?"table-cell":"none";
		el.innerHTML = "Different settings of type "+str+" detected between main and fiber fed BDAs";
		
	}
	this.analyzeConf = function(){
		for (var band=0;band<2;band++){
			var showWarning = (self.isFreqSplitFixed(band,0) && (self.equalFreqs(self.config,band)<0));
			document.getElementById("warnFreq_"+band).style.display = showWarning?"table-row":"none";
		}
	}
	this.showConfs = function(onlyFilterFields) {
		this.analyzeConf();
		//primero parámetros de las tablas de filtros
		for (var nr=0;nr<=nrOfRemotes;nr++){
			self.bbuAlarmsShow(nr);
			if (nr==0) {
				this.masterFirmwareSet(self.factory[0].commonUl ? 0:1);
			}
			for (var band = 0; band < 2; ++band) {
				//se hace aquí también por si se ha activado simplex
				var simplex = self.isSimplexMode(band, nr, self.config[nr].simplexMode[band]);
				this.updateSquelchThresholdTitles(band,nr,simplex);
				self.mutemodeDisable(band,nr,simplex);
				
				for (var c = 0; c < self.maxChannels[nr]; ++c) {
					self.squelchChEnSet(1, c, band, 0, nr, self.config[nr].sqChEnabled[0][band][1][c]);	
					self.squelchChThrSet(1, c, band, 0, nr, self.config[nr].sqChThreshold[0][band][1][c]);	
				}

				for (var b = 0; b < 2; ++b) {
					for (var c = 0; c < self.config[nr].ADJNR; ++c) {
						self.squelchChEnSet(b, c, band, 1, nr, self.config[nr].sqChEnabled[1][band][b][c]);	
						self.squelchChThrSet(b, c, band, 1, nr, self.config[nr].sqChThreshold[1][band][b][c]);	
					}
				}
				for (var c = 0; c < self.maxChannels[nr]; ++c) {
					for (var b = 0; b < 2; ++b) {
						self.chBwSet(b, c, band, nr, self.config[nr].bwIndex[band][b][c]);

					}
				}
				self.displayFilters(band,nr);
				for (var nbadj = 0;nbadj<2;nbadj++){
					for (var c = 0; c < (nbadj==0?self.maxChannels[nr]:self.config[nr].ADJNR); ++c) {
						var show = self.showFiltersMask[nr][nbadj][band][c];
						this.setShowFilter(c, band, nbadj, nr, show);
						for (var b = 0; b < 2; ++b) {
							self.setAdjFreqCh(b, c, band, nr, self.config[nr].fstartHzAdjFilter[band][b][c], self.config[nr].fstopHzAdjFilter[band][b][c]);
							self.setGfine(b, c, band, nbadj, nr, self.config[nr].fineGainFilter[nbadj][band][b][c]);
							var settings = simplex ? chRfIn_settings[0] : chRfIn_settings[b];
							setMetRange("rfInPow_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr, settings);	
						}
					}
				}
				self.simplexSettingsDisable(nr,band);	
			}
		}
		if (onlyFilterFields) return;
		//después el resto de parámetros
		self.masterModeSet(self.config[0].masterMode,false);
		for (var k=0;k<self.config[0].masterModeAlarmEnables.length;k++){
			self.masterModeAlarmEnableSet(k,self.config[0].masterModeAlarmEnables[k]);
		}
		for (var nr=0;nr<=nrOfRemotes;nr++){
			for (var band = 0; band < 2; ++band) {
				if (nr>0) self.maxPowerSet(band, nr, self.factory[nr].powerlimit[2*band+1]);
				self.setMuteMode(band,nr,self.config[nr].muteModeLinked[band]);
				var simplex = self.isSimplexMode(band, nr, self.config[nr].simplexMode[band]);
				self.setSimplexMode(band,nr,simplex);
				self.eqSqSet(band, nr, self.config[nr].allSameSquelch[band]);
				self.squelchChEnSet(0, 0, band, 0, nr, self.config[nr].sqChEnabled[0][band][0][0]);			
				self.squelchChThrSet(0, 0, band, 0, nr, self.config[nr].sqChThreshold[0][band][0][0]);
				
				for (var b = 0; b < 2; ++b) {
					var gatt = self.config[nr].gain[band][b];
					// el cambio de variable gain --> atenuación se aplica en todos los casos
					gatt = self.factory[nr].gainlimit[2*band+b]-gatt;
					self.mainGainLimSet(b, band, nr, gatt);
					self.mainPowerLimSet(b, band, nr, self.config[nr].power[band][b]-self.config[nr].gain[band][b]);
					try{
						var max = self.factory[nr].powerlimit[2*band+b]-self.config[nr].gain[band][b];
						var min = self.factory[nr].powerlimit[2*band+b] - self.factory[nr].gainlimit[2*band+b] - self.MAIN_POWER_RANGE; //El min es absoluto, no depende de conf.gain
						document.getElementById("mainPowerLimit_"+band+"_"+b+"_"+nr).title = "Min: "+min+", Max: "+max+" dBm";
					} catch(e){}
					self.hpaSwSet(b, band, nr, self.config[nr].paEnabled[band][b]);
					self.eqBwSet(b, band, nr, self.config[nr].allChSameBW[band][b]);
				}
				self.simplexSettingsDisable(nr,band);
			}
			self.showBbuTypeOfConnection(self.config[nr].bbu_serial_mode, nr);
			//relay timers
			for (var k=0;k<self.config[nr].NR_OF_RELAYS_MAX;k++){
				this.delayLatchOnOffSet(0,k,nr,self.config[nr].delayTimerON[k]);
				this.delayLatchOnOffSet(1,k,nr,self.config[nr].latchTimerON[k]);
				this.delayLatchTimeSet(0,k,nr,self.config[nr].delayTimer[k]);
				this.delayLatchTimeSet(1,k,nr,self.config[nr].latchTimer[k]);
			}
			// for (var k=0;k<4;k++){
			// 	this.delayLatchOnOffSet(0,k,nr,self.config[nr].delayTimerON[k]);
			// 	this.delayLatchOnOffSet(1,k,nr,self.config[nr].latchTimerON[k]);
			// 	this.delayLatchTimeSet(0,k,nr,self.config[nr].delayTimer[k]);
			// 	this.delayLatchTimeSet(1,k,nr,self.config[nr].latchTimer[k]);
			// }
			// if (nr==0 && use7relaysInMaster(self.version)) {
			// 	for (var k=4;k<7;k++){
			// 		this.delayLatchOnOffSet(0,k,nr,self.config[nr].delayTimerON[k]);
			// 		this.delayLatchOnOffSet(1,k,nr,self.config[nr].latchTimerON[k]);
			// 		this.delayLatchTimeSet(0,k,nr,self.config[nr].delayTimer[k]);
			// 		this.delayLatchTimeSet(1,k,nr,self.config[nr].latchTimer[k]);
			// 	}
			// }
			self.setAutoPaUlOffTime(nr,self.config[nr].autoUlPaOffTimer);
			self.setFirstNet(nr,self.config[nr].firstADJisFirstNet);
			self.showFirstNet(nr,self.config[nr].firstADJisFirstNet);
			self.showOpfSettings(nr,self.computeShowOpfSettings(nr));
			self.opfModeSet(nr,self.config[nr].oscActionAfterAlarm[0]);
			self.setAbnSqTime(nr,self.config[nr].oscTimeThSeconds[0]);
			self.showRetrySettings(nr,self.config[nr].oscActionAfterAlarm[0]<2);
			self.setRetryTime(nr,self.config[nr].oscRetryTimeHours[0]);
			self.showExtremeTempActionBox(nr,self.computeShowExtremeTempAction(nr));
			self.showExtremeTempAction(nr,self.config[nr].extremeTempAction);
			self.showFOconfig(nr);
			self.forceRfOffSwSet(self.config[0].system_force_rf_off);
		}
		try{
			var el = window.parent.head.document.getElementById('maintab');
			var w =  document.getElementById("headDivAlarm_0").getBoundingClientRect().width;
			el.style.width = w+'px';		
		} catch(e) {}
		for (var sysAlarmNr = 0; sysAlarmNr < NrOfGralSystemAlarms; sysAlarmNr++) {
			self.setForceSystemAlarm(self.config[0].forceSystemAlarm[sysAlarmNr], sysAlarmNr);
		}
	}
	this.computeFiltersCombine = function(cnf, b, n, band, nr) {
		var filts = [];
		for (var c = 0; c < self.maxChannels[nr]; ++c) {
			if (c == n) {
				continue;
			}
			if (!cnf.filterEnabled[0][band][b][c]) {
				continue;
			}
			if (self.isFilterCombination(cnf, b, n, c, band, nr)) {
				filts.push(c);
			}
		}
		return filts;
	}
	this.filterBelongsToCombination = function(cnf, b, n, band, nr) {
		if (!cnf.filterEnabled[0][band][b][n]) {
			return false;
		}
		var filts = self.computeFiltersCombine(cnf, b, n, band, nr);
		return (filts.length != 0);
	}
	this.getFilterCombinations = function(cnf, b, band, nr) {
		var filts = [];
		for (var n = 0; n < self.maxChannels[nr]; ++n) {
			filts.push([]);
			if (!cnf.filterEnabled[0][band][b][n]) {
				continue;
			}
			for (var c = 0; c < self.maxChannels[nr]; ++c) {
				if (c == n) {
					continue;
				}
				if (!cnf.filterEnabled[0][band][b][c]) {
					continue;
				}
				if (self.isFilterCombination(cnf, b, n, c, band, nr)) {
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
	this.computeFilterCombineReduction = function(cnf, b, band, nr) {
		var filts = self.getFilterCombinations(cnf, b, band, nr);
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
		var fnr = self.computeNrActiveFilts(cnf, band,nr);
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
	this.computeNrActiveFilts = function(cnf, band, nr) {
		var n = 0;
		var b = nr==0?1:0;
		for (var c = 0; c < cnf.CHNR; ++c) {
			if (cnf.filterEnabled[0][band][b][c]) {
				n++;
			}
		}
		return n;
	}
	this.computeFiltersOverlap = function(cnf, band, nr) {
		var ovlp = [];
		var check = false;
		var br = nr==0 ? 0:1;
		for (var b = 0; b < 2; ++b) {
			ovlp.push([]);
			for (var c = 0; c < self.maxChannels[nr]; ++c) {
				ovlp[b].push([]); 
				if (b==br) continue; //solo se analiza o UL o DL
				if (!self.factory[nr].chBandEnabled[band] || !cnf.filterEnabled[0][band][b][c]) {
					continue;
				}
				ovlp[b][c] = self.findFiltersOverlap(cnf, b, c, band, nr);
				if (ovlp[b][c].length != 0) {
					check = true;
				}
			}
		}
		return {'check': check, 'ovlp': ovlp};
	}
	this.findFiltersOverlap = function(cnf, b, n, band, nr) {
		var filts = [];
		for (var c = n + 1; c < self.maxChannels[nr]; ++c) {
			if (!cnf.filterEnabled[0][band][b][c]) {
				continue;
			}
			if (self.isFilterCombination(cnf, b, n, c, band, nr)) {
				continue;
			}
			if (self.isFilterOverlap(cnf, b, n, c, band, nr)) {
				filts.push(c);
			}
		}
		return filts;
	}
	this.isFilterOverlap = function(cnf, b, n, c, band, nr) {
		var f1 = cnf.freqHz[band][b][n];
		var f2 = cnf.freqHz[band][b][c];
		var b1 = cnf.bwKHz[band][b][n];
		var b2 = cnf.bwKHz[band][b][c];
		var filtSep = Math.abs(f2 - f1);
		var bandSep;
		var filtMax = self.factory[nr].commonUl? 150:100;
		var stp = self.factory[nr].fstep;
		if (stp<=1.5e3) stp/=2;
		filtSep /= stp;
		if (b1 == filtMax && b2 == filtMax) {
			bandSep = ~~Math.round(self.FilterValidSep[band]*1000);
			var exactstp = (bandSep % stp) == 0;
			bandSep /= stp;
			bandSep = Math.floor(bandSep);
			if ((filtSep == bandSep) || (!exactstp && (filtSep == (bandSep+1)))) { //comparison done in steps. If bandSep is not a multiple integer of fstep, next integer is also considered
				var g = cnf.fineGainFilter[0][band][b][n];
				var g1 = cnf.fineGainFilter[0][band][b][c];
				return (g != g1);
			} else {
				return (filtSep < bandSep);
			}
		} else {
			bandSep = ~~Math.round((b1 + b2) * 1000 / 2 * 1.6);
			bandSep /= stp;
			return (filtSep < bandSep);
		}
	}
	this.isFilterCombination = function(cnf, b, n, c, band, nr) {
		if (n == c) {
			return false;
		}
		if (!(cnf.filterEnabled[0][band][b][n] && cnf.filterEnabled[0][band][b][c])) {
			return false;
		}
		if (self.computeCombinedFilters(cnf, b, n, c, band, nr)) {
			return true;
		}
		return false;
	}
	this.computeCombinedFilters = function(cnf, b, n, c, band, nr) {
		if (n == c) {
			return false;
		}
		if (!(cnf.filterEnabled[0][band][b][n] && cnf.filterEnabled[0][band][b][c])) {
			return false;
		}
		var k = cnf.bwIndex[band][b][n];
		var k1 = cnf.bwIndex[band][b][c];
		var bwIndex = self.factory[nr].commonUl? 0:1;
		if (!(k == bwIndex && k1 == bwIndex)) {
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
		var bandSep = self.FilterValidSep[band]*1000;
		var stp = self.factory[nr].fstep;
		if (stp<=1.5e3) stp/=2;
		filtSep = ~~Math.round(filtSep/stp);
		var exactstp = (bandSep % stp) == 0;
		bandSep /= stp;
		bandSep = Math.floor(bandSep);
		return ((filtSep == bandSep) || (!exactstp && (filtSep == (bandSep+1)))); //comparison done in steps. If bandSep is not a multiple integer of fstep, next integer is also considered
	}
	this.readTotalConfsFrm = function(ndev, isReset, isIsolVerif, isIsolClear, isClearErrors, isDelayMeas, forceSend, isForcePaOn, isForcePaOff, doSetDefaultRelay) {
		var remoteFrame = "";
		var totalConfFrame = [];
		var cnfs = [];
		for (var i=0;i<=nrOfRemotes;i++)
			cnfs.push(new Config());
		cnfs[0] = self.readConfsFrm(0, ndev==0, isReset, isIsolVerif, isIsolClear, isClearErrors, isDelayMeas, forceSend, isForcePaOn, isForcePaOff, doSetDefaultRelay);
		masterFrm = cnfs[0].getFrm(self.factory[0],0);
		var remoteHeader = hexformat(0, 2);    // master + valid==true
		remoteHeader += hexformat(1, 2);
		if(masterFrm!=config[0].frm){
			totalConfFrame.push(remoteHeader+masterFrm);
		}
		for (var i = 0; i < nrOfRemotes; i++) {
			remoteHeader = hexformat(i+1, 2);

			if ( monitor.monitorUnit[0].FOmoduleConnected[i] && remoteGlobalConfResponseValid[i] ){
				cnfs[i+1] = self.readConfsFrm(i+1,ndev==(i+1), isReset, isIsolVerif, isIsolClear, isClearErrors, isDelayMeas, forceSend, isForcePaOn, isForcePaOff, doSetDefaultRelay);
				remoteHeader += hexformat(1, 2);
				remoteFrame = cnfs[i+1].getFrm(self.factory[i+1],i+1);
				if(remoteFrame!=config[i+1].frm){
					totalConfFrame.push(remoteHeader+remoteFrame);
				}
			}
		}
		if (!isReset && !isIsolVerif && !isIsolClear && !isClearErrors && !isDelayMeas && totalConfFrame.length>0 && !doSetDefaultRelay){ //si son acciones no se chequea overlap ni clase B
			//Chequeo Overlap y clase B
			var result = self.checkFreqs(true,cnfs[0],0);
			for (var i = 0; i < nrOfRemotes; i++) {
				if ( monitor.monitorUnit[0].FOmoduleConnected[i] && remoteGlobalConfResponseValid[i] ){
					result |= self.checkFreqs(true,cnfs[i+1],i+1);
				}
			}
			if (result!=0){
				var alertMsg = "NOTICE:\n";
				if ((result&0x2)!=0){
					if ((result&0x3)==0x3) alertMsg += '1. ';
					alertMsg += "You selected a filter wider than 75KHz. This unit will operate as a Class B unit\n";
				}
				if ((result&0x1)!=0){
					if ((result&0x3)==0x3) alertMsg += '2. ';
					alertMsg += "Fiter overlapping detected.\n";
				}
				alertMsg += "See details below. Please, confirm before applying.\n";
				if (!confirm(alertMsg)) {
					return [];
				}
			}
		}
		return totalConfFrame;
	}
	this.readConfsFrm = function(nr, validArgs, isReset, isIsolVerif, isIsolClear, isClearErrors, isDelayMeas, forceSend, isForcePaOn, isForcePaOff, doSetDefaultRelay) {
		var cnf = new Config();
		cnf.parse(self.config[nr].frm,self.factory[nr],nr);
		if (validArgs){
			if (isReset) {
				cnf.resetSoft = true;
				return cnf;
			}
			if (isIsolVerif) {
				cnf.runIsolationMeas[0] = true;
				return cnf;
			}
			if (isIsolClear) {
				cnf.clearOscAlarm[0] = true;
				return cnf;
			}
			if (isClearErrors) {
				cnf.FOclearErrorCounters = true;
				return cnf;
			}
			if (isDelayMeas) {
				cnf.runDelayMeasuarement = true;
				return cnf;
			}
			if (doSetDefaultRelay){
				cnf.bbu_serial_mode = self.readBbuTypeOfConnection(nr);
				return cnf;
			}
			cnf.resetSoft = false;
			for (var k=0;k<2;k++){
				cnf.runIsolationMeas[k] = false;
				cnf.clearOscAlarm[k] = false;
			}
		}
		for (band=0;band<2;band++){
			var confToGet = self.isFreqSplitFixed(band,0)?0:nr;
			cnf = self.getFreqs(cnf, confToGet, nr, band);
		}
		cnf = self.getSqConf(cnf,nr);
		cnf = self.getGralConf(cnf,nr);
		cnf = self.getAlarmConf(cnf,nr);
		self.getDelays(cnf, nr);
		
		if (validArgs){
			for (var i=0;i<2;i++){
				for (var j=0;j<2;j++){
					cnf.forcePaOn[i][j] = isForcePaOn[i][j];
					if (cnf.forcePaOn[i][j]) cnf.paEnabled[i][j] = true;
					cnf.forcePaOff[i][j] = isForcePaOff[i][j];
					if (cnf.forcePaOff[i][j]) cnf.paEnabled[i][j] = false;
				}
			}
		}
		//Se fuerza a 0 porque autoULPaOff no deber interferir en medida aislamiento
		cnf.autoUlPaOffTimer = 0;
		if (nr==0) {
			for (var sysAlarmNr = 0; sysAlarmNr < NrOfGralSystemAlarms; sysAlarmNr++) {
				cnf.forceSystemAlarm[sysAlarmNr] = self.getForceSystemAlarm(sysAlarmNr);
			}
		}
		if (nr==0){
			cnf.system_force_rf_off = this.forceRfOffSwGet();
		}
		return cnf; //se devuelve el objeto config
	}

	this.showStatus = function(monitor) {
		self.masterModeStatusSet(monitor[0].isPrimary);
		for (var nr=0;nr<=nrOfRemotes;nr++){
			self.blockedSet(nr,monitor[nr].blocked);
			if (self.blocked[nr]) {
				if (nr==0)
					return;
				else
					continue;
			}
			self.boardTempSet(nr,monitor[nr].boardTemp);
			self.opfRoutineRunningSet(nr,monitor[nr].isolMeasRunning[0]);
			self.setIsolGain(nr,monitor[nr].maxAllowGain);	
			self.setLastRetryTime(nr,monitor[nr].retryTime[0]);
			self.showExtremeTempStatus(nr,monitor[nr].extremeTempActionOn);
			
			for (var k=0;k<monitor[nr].gralAlarm.length;k++){
				if (nr==0 && (k<6 || (use7relaysInMaster(self.version) && k>=8 && k<12))){ //Se descartan external inputs de remotes en caso de 4 relays, y alarmas de fibra
					var alarmr = false;
					for (var i=1;i<=nrOfRemotes;i++){
						if (monitor[i].gralAlarm[k]) alarmr=true;
					}
					self.gralAlarmSet(k, 0, monitor[0].gralAlarm[k],alarmr);
					
				}else{
					self.gralAlarmSet(k, nr, monitor[nr].gralAlarm[k],false);
				}
			}
			for (var k=0;k<self.config[nr].NR_OF_RELAYS_MAX;k++){
				var noShow = self.config[nr].latchTimerON[k] && (self.config[nr].latchTimer[k]>=35996400); //hours = 9999
				self.delayLathTimeStatSet(0,k,nr,monitor[nr].delayTimer[k],monitor[nr].delayTimerRunning[k],false);
				self.delayLathTimeStatSet(1,k,nr,monitor[nr].latchTimer[k],monitor[nr].latchTimerRunning[k],noShow);
				self.relayStateSet(k,nr,monitor[nr].relayOpenClosed[k],monitor[nr].relayONOFF[k]);
			}
			
			for (var band = 0; band < 2; ++band) {
				for (var b = 0; b < 2; ++b) {
					self.setStatePaOn(b, band, nr, monitor[nr]);
					if (self.config[nr].oscFeatureEnabled[0] && self.factory[nr].oscFeatureEnable){
						self.setConfGain(b, band, nr, monitor[nr].configGain[band][b]);
						self.statGainMainTitle(b, band, nr, monitor[nr].maxAllowGain[band]);
					}
					for (var nbadj=0;nbadj<2;nbadj++){
						for (var c = 0; c < (nbadj==0?self.maxChannels[nr]:self.config[nr].ADJNR); ++c) {
							self.showStatusCh(monitor[nr], b, c, band, nbadj, nr);
						}		
					}
					var oneChOutOn = self.computeOneChOutOn(b, band, nr, monitor[nr]);
					var oneFOlinkOn = monitor[nr].isOneFOlinkOn();
					self.rfOutPowSet(b, band, nr, monitor[nr].estTxPow[band][b], oneChOutOn, oneFOlinkOn);
					self.bbAgcSet(b, band, nr, monitor[nr].bbAgc[band][b]);
				}
				if (nr==0)
					self.bbOutAgcSet(band, 0,monitor[0].statePaOn[band][0]?monitor[0].gain[1][band][0][0]:0);//AGC BB en ADJ1 UL de cada banda
				else
					self.bbOutAgcSet(band, nr, monitor[nr].statePaOn[band][1]?monitor[nr].gain[1][band][1][0]:0);//AGC BB en ADJ1 DL de cada banda
			}
			for (var k=0;k<16;k++){
				var alarmr = false;
				if (nr==0){
					for (var i=1;i<=nrOfRemotes;i++){
						if (monitor[i].bbuAlarm[k]) alarmr=true;
					}
				}
				self.bbuAlarmSet(nr, k, monitor[nr].bbuAlarm[k], alarmr, monitor[nr].bbuChargerErrorCode);
			}
			if (self.config[nr].bbu_serial_mode) {
				if ( monitor[nr].isBbuDisconnectionAlarm() ) {
					self.isBbuConnected[nr] = false;
				} else {
					if ( !self.isBbuConnected[nr] ) {
						self.updateRelayShow(nr, monitor[nr]);
					}
					self.isBbuConnected[nr] = true;
				}
			}
		}

		for (var band = 0; band < 2; ++band) {
			for (var nr=0;nr<=nrOfRemotes;nr++){
				for (var k=0;k<16;k++){
					if (nr==0){
						var alarmr = false;
						for (var i=1;i<=nrOfRemotes;i++){
							if (monitor[i].bandAlarm[band][k]) alarmr=true;
						}
						self.bandAlarmSet(band, k, 0, monitor[0].bandAlarm[band][k],alarmr);
					}else{
						self.bandAlarmSet(band, k, nr, monitor[nr].bandAlarm[band][k],false);
					}
				}
			}
		}
		self.showFOstatus(monitor);
		self.deepDischarge.showDeepDischargeMvo2(monitor, self.config, self.factory);
		if (self.doFrequencyCheck) {
			for (var nr=0;nr<=nrOfRemotes;nr++)
				self.checkFreqs(false,null,nr);
			self.doFrequencyCheck = false;
		}
		self.setScrollPos();
	}
	this.setScrollPos = function(){
		if (self.firstStatus){
			self.firstStatus = false;
			var pos = localStorage.getItem(self.sernr.sernr+"_statposition");
			if (pos!=null) window.scrollTo(0, pos);
		}else{
			localStorage.setItem(self.sernr.sernr+"_statposition",document.documentElement.scrollTop);
		}
	}
	this.showStatusCh = function(monitor, b, c, band, nbadj, nr) {
		var br = nr==0?1:0;
		var isInput = monitor.signalDet[nbadj][band][b][c] && self.config[nr].filterEnabled[nbadj][band][br][c];
		var chInOn = self.computeChInOn(b, c, band, nbadj, nr, monitor);
		var abnSq = false;
		if (self.factory[nr].oscFeatureEnable) abnSq = b==0?monitor.oscDetectCH[nbadj][band][c]:false;
		if (abnSq){
			self.rfSignalLedSet(b, c, band, nbadj, nr, "red");
		} else if (isInput && chInOn) {
			self.rfSignalLedSet(b, c, band, nbadj, nr, "green");
		} else {
			self.rfSignalLedSet(b, c, band, nbadj, nr, "grey");
		}
		if (!chInOn) {
			self.rfChInPowSet(b, c, band, nbadj, nr, monitor.level[nbadj][band][b][c], "#D0D0D0");
		} else if (monitor.overload[band][b]) {
			self.rfChInPowSet(b, c, band, nbadj, nr, monitor.level[nbadj][band][b][c], "alarm");
		} else {
			self.rfChInPowSet(b, c, band, nbadj, nr, monitor.level[nbadj][band][b][c]);
		}
		var chOutOn = self.computeChOutOn(b, c, band, nbadj, nr, monitor);
		self.rfChOutPowSet(b, c, band, nbadj, nr, monitor.level[nbadj][band][b][c]+monitor.gain[nbadj][band][b][c], chOutOn);
		var agc = self.computeAgc(b, c, band, nbadj, nr, monitor);
		self.agcSet(b, c, band, nbadj, nr, agc);
	}
	this.computeChOutOn = function(b, c, band, nbadj, nr, monitor) {
		var ch = c;
		if (nbadj==0 && b==0) ch=0;
		var br = nr==0?1:0;
		if (!monitor.statePaOn[band][b]) {
			return false;
		}
		if (!self.config[nr].filterEnabled[nbadj][band][br][c]) {
			return false;
		}
		if (!monitor.signalDet[nbadj][band][b][c]) {
			if (self.config[nr].sqChEnabled[nbadj][band][b][ch]) {
				return false;
			}
		}
		if (b == 0) {
			if (self.config[nr].muteModeLinked[band] && !monitor.signalDet[nbadj][band][1][c]) {
				return false;
			}
		}
		return true;
	}
	this.computeOneChOutOn = function(b, band, nr, monitor) {
		var oneChOutOn = false;
		for (var c = 0; c < self.maxChannels[nr]; ++c) {
			if (self.computeChOutOn(b, c, band, 0, nr, monitor)) {
				oneChOutOn = true;
				break;
			}
		}
		for (var c = 0; c < self.config[nr].ADJNR; ++c) {
			if (self.computeChOutOn(b, c, band, 1, nr, monitor)) {
				oneChOutOn = true;
				break;
			}
		}		
		
		return oneChOutOn;
	}
	this.computeChInOn = function(b, c, band, nbadj, nr, monitor) {
		var ch = c;
		if (nbadj==0 && b==0) ch=0;
		var br = nr==0?1:0;
		if (!self.config[nr].filterEnabled[nbadj][band][br][c]) {
			return false;
		}
		var simplex = self.isSimplexMode(band, nr, self.config[nr].simplexMode[band]);
		if (!monitor.signalDet[nbadj][band][b][c]) {
			if (self.config[nr].sqChEnabled[nbadj][band][b][ch] || simplex) {
				return false;
			}
		}
		if (b == 0 && !simplex) {
			if (self.config[nr].muteModeLinked[band] && !monitor.signalDet[nbadj][band][1][c]) {
				return false;
			}
		}
		if (!monitor.statePaOn[band][b]) return false;
		
		return true;
	}
	this.computeAgc = function(b, c, band, nbadj, nr, monitor) {
		var ch = c;
		if ((nbadj==0) && (b==0)) ch=0;
		var br = nr==0?1:0;
		agc = monitor.gain[nbadj][band][b][c];
		if (agc < 0) {
			agc = 0;
		}
		if (!monitor.signalDet[nbadj][band][b][c] && self.config[nr].sqChEnabled[nbadj][band][b][ch]) {
			agc = 0;
		}
		if (!self.config[nr].filterEnabled[nbadj][band][br][c]) {
			agc = 0;
		}
		return agc;
	}

	this.createSimplex = function(nr,band) {
		var box = document.createElement("div");
		box.id = "simplexBox"+band+"_"+nr;
		box.align = "center";
		var show = self.factory[nr].Simplex[band];
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
		el.id = "simplex"+band+"_"+nr;
		el.name = el.id;
		el.nr = nr;
		el.type = "checkbox";
		el.band = band;
		el.onclick = function(ev) {
			self.config[nr].simplexMode[band] = this.checked;
			self.updateSquelchThresholdTitles(this.band, this.nr, this.checked);
			self.mutemodeDisable(this.band, this.nr, this.checked);
			for (var b = 0; b < 2; ++b) {
				self.sqEnDisable(b, this.band, 0, this.checked, this.nr);
				self.sqEnDisable(b, this.band, 1, this.checked, this.nr);
			}
		}
		cell.appendChild(el);
		return box;
	}
	this.setSimplexMode = function(band,nr,s) {
		try {
			var el = document.getElementById("simplex"+band+"_"+nr);
			el.checked = s;
		} catch(e) {}
	}
	this.getSimplexMode = function(band,nr) {
		try {
			var el = document.getElementById("simplex"+band+"_"+nr);
			var s = el && el.checked;
			return s;
		} catch(e) {}
	}
	this.isSimplexMode = function(band, nr, simplex) {
		return (simplex && self.factory[nr].Simplex[band]);
	}
	this.uldlLinkedDisable = function(nr,band){
		//se fuerza a false si bw ul/dl no son iguales
		try {
			if ((self.factory[nr].fstop[2*band+1]-self.factory[nr].fstart[2*band+1])!=(self.factory[nr].fstop[2*band]-self.factory[nr].fstart[2*band])){
				var el = document.getElementById("freqSplit"+band+"_"+nr);
				el.disabled = true;
				el.style.backgroundColor = "#CCCCCC";
			}
		} catch(e){}
	}
	this.simplexSettingsDisable = function(nr,band) {
		var simplex = self.isSimplexMode(band, nr, self.config[nr].simplexMode[band]);
		self.mutemodeDisable(band,nr,simplex);
		for (var b = 0; b < 2; ++b) {
			self.sqEnDisable(b, band, 0, simplex, nr);
			self.sqEnDisable(b, band, 1, simplex, nr);
		}
	}

	this.createFreqStyleSw = function(band,nr) {
		var el = document.createElement("input");
		el.id = "freqStyle_"+band+"_"+nr;
		el.name = el.id;
		el.type = "button";
		el.value = self.freqStyle[band][nr] == 0 ? "Start/Stop" : "Center/Bandwidth";
		el.style.fontWeight = "bold";
		el.style.width = "130px";
		el.style.minWidth = "130px";
		el.style.borderRadius = "10px";
		el.align = "center";
		el.band = band;
		el.nr = nr;
		el.onclick = function(ev) {
			try {
				var fcurr = [];
				var band = this.band;
				var nr = this.nr;
				var b = nr==0?1:0;//solo UL o DL
				for (var c = 0; c < self.config[nr].ADJNR; ++c) {
					fcurr.push(self.getAdjFreq(b, c, band, nr));
				}
				self.freqStyle[band][nr] = self.freqStyle[band][nr] == 0 ? 1 : 0;
				localStorage.setItem('freqStyle_'+band+'_'+nr+'_'+Prjstr+window.location.host, self.freqStyle[band][nr]);
				this.value = self.freqStyle[band][nr] == 0 ? "Start/Stop" : "Center/Bandwidth";
				self.setAdjFreqHeaders(band,nr);
				self.setAdjFreqTitles(band,nr);
				for (var c = 0; c < self.config[nr].ADJNR; ++c) {
					var chnr = [];
					for (var s = 0; s < 2; ++s) {
						chnr.push(self.computeAdjChNr(fcurr[c][s], b, band,nr));
					}
					if (self.showFiltersMask[nr][1][band][c]){
						var fstart = self.computeAdjChFreq(chnr[0], b, band, nr);
						var fstop = self.computeAdjChFreq(chnr[1], b, band, nr);
						self.setAdjFreqCh(b, c, band, nr, fstart, fstop);
						self.config[nr].fstartHzAdjFilter[band][b][c] = fstart;
						self.config[nr].fstopHzAdjFilter[band][b][c] = fstop;
					}
				}

			} catch (err) {}
		}
		return el;
	}
	this.setAdjFreqHeaders = function(band,nr) {
		try {
			for (var b = 0; b < 2; ++b) {
				var td1 = document.getElementById("HeaderF1_"+(b+1)+"_"+band+"_1_"+nr);
				var td2 = document.getElementById("HeaderF2_"+(b+1)+"_"+band+"_1_"+nr);
				if (self.freqStyle[band][nr] == 0) {
					td1.innerHTML = "Fstart&nbsp;(MHz)";
					td2.innerHTML = "Fstop&nbsp;(MHz)";
				} else {
					td1.innerHTML = "Fr.&nbsp;(MHz)";
					td2.innerHTML = "BW&nbsp;(MHz)";
				}
			}
		} catch(e) {}
	}
	this.createAdjFr = function(b, c, s, band, nr) {
		var cell = document.createElement("td");
		cell.id = "cellAdjF_"+c+"_"+b+"_"+s+"_"+band+"_"+nr;
		cell.align = "center";
		var fr = document.createElement("input");
		fr.type = "text";
		fr.id = "chAdjF_"+c+"_"+b+"_"+s+"_"+band+"_"+nr;
		fr.name = fr.id;
		fr.style.width = "65px";
		fr.className = "number";
		fr.channel = c;
		fr.path	= b;
		fr.ss = s;
		fr.nr = nr;
		fr.band = band;
		var titles = this.computeAdjFreqTitles(b, band, nr);
		if (s == 0) {
			fr.title = titles[0];
		} else {
			fr.title = self.freqStyle[band][nr] == 0 ? titles[0] : titles[1];
		}
		fr.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		fr.onchange = function(ev) {
			var b = this.path;
			var c = this.channel;
			var s = this.ss;
			var band = this.band;
			var nr = this.nr;
			var v = self.checkAdjFrSetting(b, c, s, band, nr, this.value);
			this.value = v;
			var f = self.getAdjFreq(b, c, band, nr);
			var g = [];
			if (self.freqStyle[band][nr] == 0) {
				g = self.adjustFreqLimitsSp(b, s, band, f, nr);
			} else if (s == 0) {
				g = self.adjustFreqLimitsFc(b, band, f, nr);
			} else {
				g = self.adjustFreqLimitsBw(b, c, band, f, nr);
			}
			var chnr = [];
			for (var s = 0; s < 2; ++s) {
				chnr.push(self.computeAdjChNr(g[s], b, band, nr));
			}
			var fstart = self.computeAdjChFreq(chnr[0], b, band, nr);
			var fstop = self.computeAdjChFreq(chnr[1], b, band, nr);
			self.setAdjFreqCh(b, c, band, nr, fstart, fstop);
			self.config[nr].fstartHzAdjFilter[band][b][c] = fstart;
			self.config[nr].fstopHzAdjFilter[band][b][c] = fstop;
			if (!self.isFreqSplitFixed(band,nr)) {
				return;
			}
			self.adjustFreqLimitsOtherBand(b, c, band, chnr, nr);
		}
		cell.appendChild(fr);
		if (c==0 && s==0 && band==0){
			fr = document.createElement("input");
			fr.id = "firstnet_"+b+"_"+nr;
			fr.readOnly = true;
			fr.style.display = "none";
			fr.style.width = "150px";
			fr.value = "BAND 14 "+(b==0?"788-798MHz":"758-768MHz");
			fr.style.textAlign = "center";
			cell.appendChild(fr);
		}
		return cell;
	}
	this.checkAdjFrSetting = function(b, c, s, band, nr, value) {
		var fmin = self.factory[nr].fstart[2*band+b];
		var fmax = self.factory[nr].fstop[2*band+b];
		var bwmin = self.BW_ADJ_MIN_HZ;
		var bwmax = fmax - fmin;
		var r;
		if (s == 0 || self.freqStyle[band][nr] == 0) {
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
	this.computeAdjFreqTitles = function(b, band, nr) {
		var fmin = self.factory[nr].fstart[2*band+b];
		var fmax = self.factory[nr].fstop[2*band+b];
		var bwmax = (fmax - fmin);
		if (bwmax > self.maxBw(b, band, nr)) {
			bwmax = self.maxBw(b, band, nr);
		}
		var bwmin = self.BW_ADJ_MIN_HZ;
		var title = "Min: "+(fmin/1e6)+", Max: "+(fmax/1e6)+" MHz";
		var title1 = "Min: "+(bwmin/1e6)+", Max: "+(bwmax/1e6)+" MHz";
		return [title, title1];
	}
	this.setAdjFreqTitles = function(band,nr) {
		for (var b = 0; b < 2; ++b) {
			var titles = self.computeAdjFreqTitles(b, band, nr);
			var t = [];
			t.push(titles[0]);
			if (self.freqStyle[band][nr] == 0) {
				t.push(titles[0]);
			} else {
				t.push(titles[1]);
			}
			for (var c = 0; c < self.config[nr].ADJNR; ++c) {
				for (var s = 0; s < 2; ++s) {
					var id = "chAdjF_"+c+"_"+b+"_"+s+"_"+band+"_"+nr;
					var el = document.getElementById(id);
					try {
						el.title = t[s];
					} catch(e) {}
				}
			}
		}
	}
	this.setAdjFreqCh = function(b, c, band, nr, fstart, fstop) {
		var fc = (fstart + fstop) / 2;
		var bw = Math.abs(fstop - fstart);
		var f = [];
		if (self.freqStyle[band][nr] == 0) {
			f.push(fstart);
			f.push(fstop);
		} else {
			f.push(fc);
			f.push(bw);
		}
		for (var s = 0; s < 2; ++s) {
			var id = "chAdjF_"+c+"_"+b+"_"+s+"_"+band+"_"+nr;
			var el = document.getElementById(id);
			try {
				if (s == 0 || self.freqStyle[band][nr] == 0) {
					el.value = (f[s] / 1.0e6).toFixed(3);
				} else {
					el.value = (f[s] / 1.0e6).toFixed(3);
				}
			} catch(e) {}
		}
	}
	this.getAdjFreq = function(b, c, band, nr) {
		try{
			if (band==0 && c==0 && self.getFirstNet(nr)){
				if (b==0)
					return [788000000,798000000];
				else
					return [758000000,768000000];
			}
			var f = [];
			for (var s = 0; s < 2; ++s) {
				var id = "chAdjF_"+c+"_"+b+"_"+s+"_"+band+"_"+nr;
				var el = document.getElementById(id);
				try {
					var v;
					if (s == 0 || self.freqStyle[band][nr] == 0) {
						v = ~~Math.round(parseFloat(el.value)*1e6);
					} else {
						v = ~~Math.round(parseFloat(el.value)*1e6);
					}
					f.push(v);
				} catch(e) {}
			}
			if (self.freqStyle[band][nr] != 0) {
				var fstart = ~~Math.round(f[0]-f[1]/2);
				var fstop = ~~Math.round(f[0]+f[1]/2);
				f = [];
				f.push(fstart);
				f.push(fstop);
			}
			return f;
		} catch(e) {return [self.config[nr].fstartHzAdjFilter[band][b][c],self.config[nr].fstopHzAdjFilter[band][b][c]];}
	}
	this.computeAdjChFreq = function(chnr, b, band, nr) {
		var fo = self.factory[nr].fref[2*band+b];
		var fstep = self.factory[nr].fstepAdj;
		var fr = chnr * fstep + fo;
		return fr;
	}
	this.computeAdjChNr = function(fr, b, band, nr) {
		var fo = self.factory[nr].fref[2*band+b];
		var fstep = self.factory[nr].fstepAdj;
		var chnr = ~~Math.round((fr - fo)/fstep);
		return chnr;
	}
	this.computeAdjChNrOtherBand = function(chnr, b, band, nr) {
		var fr = self.computeAdjChFreq(chnr, b, band, nr);
		var diff = fr - self.factory[nr].fstart[2*band+b];
		var a = (b + 1) % 2;
		fr = self.factory[nr].fstart[2*band+a] + diff;
		var num = self.computeAdjChNr(fr, a, band, nr);
		return num;
	}
	this.adjustFreqLimitsSp = function(b, k, band, f, nr) {
		var factS = self.factory[nr].fstart[2*band+b];
		var factP = self.factory[nr].fstop[2*band+b];
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
		} else if (bw > self.maxBw(b, band, nr)) {
			bw = self.maxBw(b, band, nr);
		}
		var step = ~~Math.round(self.factory[nr].fstepAdj*2);
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
			var num = self.computeAdjChNr(f[i], b, band, nr);
			if (!isNaN(num)) {
				f[i] = self.computeAdjChFreq(num, b, band, nr);
			}
		}
		return f;
	}
	this.adjustFreqLimitsFc = function(b, band, f, nr) {
		if (f[0] > f[1]) {
			var fr = f[0];
			f[0] = f[1];
			f[1] = fr;
		}
		var fc = ~~Math.round((f[0] + f[1]) / 2);
		var bw2 = ~~Math.round(Math.abs(f[1] - f[0]) / 2);
		var factS = self.factory[nr].fstart[2*band+b];
		var factP = self.factory[nr].fstop[2*band+b];
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
		} else if (bw > self.maxBw(b, band, nr)) {
			bw = self.maxBw(b, band, nr);
		}
		f[0] = ~~Math.round(fc - bw / 2);
		f[1] = ~~Math.round(fc + bw / 2);
		var bw = f[1] - f[0];
		var step = ~~Math.round(self.factory[nr].fstepAdj*2);
		bw = ~~Math.round(bw / step) * step;
		f[1] = f[0] + bw;
		for (var i = 0; i < 2; ++i) {
			var num = self.computeAdjChNr(f[i], b, band, nr);
			if (!isNaN(num)) {
				f[i] = self.computeAdjChFreq(num, b, band, nr);
			}
		}
		return f;
	}
	this.adjustFreqLimitsBw = function(b, c, band, f, nr) {
		if (f[0] > f[1]) {
			var fr = f[0];
			f[0] = f[1];
			f[1] = fr;
		}
		var fc = ~~Math.round((f[0] + f[1]) / 2);
		var fconf = [0,0];
		fconf[0] = self.config[nr].fstartHzAdjFilter[band][b][c];
		fconf[1] = self.config[nr].fstopHzAdjFilter[band][b][c];
		var fcp = ~~Math.round((fconf[0] + fconf[1]) / 2);
		if (fc % self.BW2_ADJ_MIN_HZ != fcp % self.BW2_ADJ_MIN_HZ) {
			fc = fcp;
		}
		var bw = Math.abs(f[1] - f[0]);
		var step = ~~Math.round(self.factory[nr].fstepAdj*2);
		bw = ~~Math.round(bw / step) * step;
		if (bw > self.maxBw(b, band, nr)) {
			bw = self.maxBw(b, band, nr);
		} else if (bw < self.BW2_ADJ_MIN_HZ) {
			bw = self.BW2_ADJ_MIN_HZ;
		}
		var bw2 = ~~Math.round(bw / 2);
		var factS = self.factory[nr].fstart[2*band+b];
		var factP = self.factory[nr].fstop[2*band+b];
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
			var num = self.computeAdjChNr(f[i], b, band, nr);
			if (!isNaN(num)) {
				f[i] = self.computeAdjChFreq(num, b, band, nr);
			}
		}
		return f;
	}
	this.adjustFreqLimitsOtherBand = function(b, c, band, ch, nr) {
		var d = (b + 1) % 2;
		var g = [];
		for (var k = 0; k < 2; ++k) {
			var chnr = self.computeAdjChNrOtherBand(ch[k], b, band, nr);
			g.push(chnr);
		}
		self.setAdjFreqCh(d, c, band, nr, self.computeAdjChFreq(g[0], d, band, nr), self.computeAdjChFreq(g[1], d, band, nr));
	}
	this.maxBw = function(b, band, nr) {
		var bw =  Math.abs(Math.abs(self.factory[nr].fstop[2*band+b] - self.factory[nr].fstart[2*band+b]));
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
	this.getAdjChConf = function(cnf, c, band, ncfg, nr) {
		var f = [];
		var on = self.getShowFilter(c, band, 1, ncfg) && self.factory[nr].adjBandEnabled[band];
		var b = nr==0?1:0; //solo UL o DL
		var br = (nr==0 || self.isFreqSplitFixed(band,0))?1:0;
		if (on !== null) {
			cnf.filterEnabled[1][band][b][c] = on;
		}
		var gfine = self.getGfine(c, br, band, 1, ncfg);
		if (gfine !== null) {
			if (gfine > self.config[ncfg].limitgFine[b].MAX) {
				gfine = self.config[ncfg].limitgFine[b].MAX;
			} else if (gfine < self.config[ncfg].limitgFine[b].MIN) {
				gfine = self.config[ncfg].limitgFine[b].MIN;
			}
			cnf.fineGainFilter[1][band][b][c] = gfine;
		}
		if (on) {
			var f = self.getAdjFreq(br, c, band, ncfg);
			if (self.isFreqSplitFixed(band,0) && nr>0) {
				f[0] -= self.factory[ncfg].uldlFreqSplit[band];
				f[1] -= self.factory[ncfg].uldlFreqSplit[band];
			}
			cnf.fstartHzAdjFilter[band][b][c] = f[0];
			cnf.fstopHzAdjFilter[band][b][c] = f[1];
		}
	}
	this.computeAdjFiltersOverlap = function(cnf,band,nr) {
		var ovlp = [];
		var check = false;
		var br = nr==0 ? 0:1; //solo UL o DL
		for (var b = 0; b < 2; ++b) {
			ovlp.push([]);
			for (var c = 0; c < self.factory[nr].numADJFilters; ++c) {
				ovlp[b].push([]);
				if (b==br) continue; //solo se analiza o UL o DL
				if (!self.factory[nr].adjBandEnabled[band] || !cnf.filterEnabled[1][band][b][c]) {
					continue;
				}
				ovlp[b][c] = self.findAdjFiltersOverlap(cnf, b, c, band, nr);
				if (ovlp[b][c].length != 0) {
					check = true;
				}
			}
		}
		return {'check': check, 'ovlp': ovlp};
	}
	this.checkClassBFilters = function(cnf,band,nr) {
		if (!self.factory[nr].agcModeUSA[0]) return {'check': false}; //class B verification is skipped for Public Safety Europe
		if (self.factory[nr].chBandEnabled[band]){
			var b = nr==0 ? 1:0; //solo UL o DL
			for (var c = 0; c < self.factory[nr].numADJFilters; ++c) {
				if (cnf.filterEnabled[1][band][b][c]) return {'check': true};
			}
			for (var c = 0; c < self.maxChannels[nr]; ++c) {
				if (cnf.filterEnabled[0][band][b][c] && cnf.bwKHz[band][b][c]>75) return {'check': true};
			}
		}
		return {'check': false};
	}
	this.computeNBAdjFiltersOverlap = function(cnf,band,nr) {
		var ovlp = [];
		var check = false;
		var br = nr==0 ? 0:1; //solo UL o DL
		for (var b = 0; b < 2; ++b) {
			ovlp.push([]);
			for (var c = 0; c < self.factory[nr].numADJFilters; ++c) {
				ovlp[b].push([]);
				if (b==br) continue; //solo se analiza o UL o DL
				if (!self.factory[nr].chBandEnabled[band] || !self.factory[nr].adjBandEnabled[band] || !cnf.filterEnabled[1][band][b][c]) {
					continue;
				}
				ovlp[b][c] = self.findNBAdjFiltersOverlap(cnf, b, c, band, nr);
				if (ovlp[b][c].length != 0) {
					check = true;
				}
			}
		}
		return {'check': check, 'ovlp': ovlp};
	}	
	this.findAdjFiltersOverlap = function(cnf, b, n, band, nr) {
		var filts = [];
		for (var c = n + 1; c < self.factory[nr].numADJFilters; ++c) {
			if (!cnf.filterEnabled[1][band][b][c]) {
				continue;
			}
			if (self.isAdjFilterOverlap(cnf, b, n, c, band, nr)) {
				filts.push(c);
			}
		}
		return filts;
	}
	this.findNBAdjFiltersOverlap = function(cnf, b, n, band, nr) {
		var filts = [];
		for (var c = 0; c < self.maxChannels[nr]; ++c) {
			if (!cnf.filterEnabled[0][band][b][c]) {
				continue;
			}
			if (self.isNBAdjFilterOverlap(cnf, b, n, c, band)) {
				filts.push(c);
			}
		}
		return filts;
	}	
	this.isAdjFilterOverlap = function(cnf, b, n, c, band, nr) {
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

	this.createOpfSettingsAntIsol = function(nr) {
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
		this.createIsolVerify(nr, row);
		var row = document.createElement("tr");
		tb.appendChild(row);			
		this.createIsol(nr,row);
		row.style.display = "none";
		for (band=0;band<2;band++){
			var row = document.createElement("tr");
			this.createIsolGain(nr,row,band);
			tb.appendChild(row);
		}
		return box;
	}
	this.createAutoPaUlOff = function(nr) {
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
		this.createAutoPaUlOffTime(nr,row);
		return box;
	}

	this.createExtremeTempActionBox = function(nr) {
		var box = document.createElement("div");
		box.id = 'extremeTempActionBox_'+nr;
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
		this.createExtremeTempAction(nr,row);
		return box;
	}
	this.showExtremeTempActionBox = function(nr,doShow) {
		try {
			var el = document.getElementById('extremeTempActionCell_'+nr);
			el.style.display = doShow ? "table-cell":"none";
		} catch(err) {}		

	}
	this.createExtremeTempAction = function(nr,row) {
		var cell = document.createElement('th');
		cell.innerHTML = "Action";
		cell.className = "thdrht";
		row.appendChild(cell);
		cell = document.createElement('td');
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "extremeTempAction_"+nr;
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
		cell.id = "extremeTempActionStatus_"+nr;
		cell.className = "tabval";
		//cell.style.minWidth = "100px";
		row.appendChild(cell);
	}
	this.showExtremeTempAction = function(nr,value) {
		if ( typeof(value) === 'undefined' || isNaN(value) ) {
			return;
		}
		value = ~~value;
		try {
			var el = document.getElementById('extremeTempAction_'+nr);
			if ( value >= el.options.length ) {
				value = 0;
			}
			el.selectedIndex = value;
		} catch(err) {}
	}
	this.readExtremeTemperatureAction = function(nr) {
		if ( !self.factory[nr].extremeTempActionEnable ) {
			return 0;
		}
		try {
			var el = document.getElementById('extremeTempAction_'+nr);
			return el.selectedIndex;
		} catch(err) { return 0; }
	}
	this.showExtremeTempStatus = function(nr,on) {
		on = on || false;
		try {
			var el = document.getElementById("extremeTempActionStatus_"+nr);
			if ( on ) {
				el.innerHTML = "EXTREME&nbsp;TEMP.";
			} else {
				el.innerHTML = "";
			}
		} catch(err) {}
	}

	this.createOpfSettingsOscDet = function(nr) {
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
		this.createClearAbnSqAlarm(nr, row);
		row = document.createElement("tr");
		tb.appendChild(row);			
		this.createAbnSqTime(nr,row);
		row = document.createElement("tr");
		tb.appendChild(row);	
		this.createOpfMode(nr,row);
		row = document.createElement("tr");
		row.id = "retryMode_"+nr;
		tb.appendChild(row);			
		this.createRetryTime(nr,row);
		this.createLastRetryTime(nr,row);
		return box;
	}	
	this.showRetrySettings = function(nr,show){
		var el = document.getElementById("retryMode_"+nr);
		el.style.display = show ? "table-row" : "none";
	}
	this.showOpfSettings = function(nr,show) {
		try {
			var el = document.getElementById("opfSettingsCell_"+nr);
			el.style.display = show ? "table-cell" : "none";
		} catch(err) {}
	}
	this.createAutoPaUlOffTime = function(nr,row) {
		var cell = document.createElement("th");
		cell.innerHTML = "Auto&nbsp;UL&nbsp;PA&nbsp;OFF&nbsp;Timer";
		cell.className = "thdrht";
		row.appendChild(cell);		
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "autoUlPaOff_"+nr;
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "45px";
		el.nr = nr;
		var max = self.config[nr].limitAutoPaUlOffTime.MAX;
		var min = self.config[nr].limitAutoPaUlOffTime.MIN;
		el.title = "OFF 0min, Min. "+min+"min, Max. "+max+"min";
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var target = this;
			var nr = target.nr;
			var num = self.getAutoPaUlOffTime(nr);
			var max = self.config[nr].limitAutoPaUlOffTime.MAX;
			var min = self.config[nr].limitAutoPaUlOffTime.MIN;
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
	this.createAbnSqTime = function(nr,row) {
		var cell = document.createElement("th");
		cell.innerHTML = "Osc.&nbsp;Delay&nbsp;Threshold";
		cell.className = "thdrht";
		row.appendChild(cell);		
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "abnSqTime_"+nr;
		el.nr = nr;
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "32px";
		var max = self.config[nr].limitAbnSqTime.MAX;
		var min = self.config[nr].limitAbnSqTime.MIN;
		el.title = "OFF 0sec, Min. "+min+"sec, Max. "+max+"sec";
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var target = this;
			var num = self.getAbnSqTime(target.nr);
			var max = self.config[nr].limitAbnSqTime.MAX;
			var min = self.config[nr].limitAbnSqTime.MIN;
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
	this.setAbnSqTime = function(nr,v) {
		try {
			var el = document.getElementById("abnSqTime_"+nr);
			el.value = v;
		} catch(err) {}
	}
	this.getAbnSqTime = function(nr) {
		try {
			var el = document.getElementById("abnSqTime_"+nr);
			return parseInt(el.value);
		} catch(err) {}
	}
	this.setAutoPaUlOffTime = function(nr,v) {
		try {
			var el = document.getElementById("autoUlPaOff_"+nr);
			el.value = v;
		} catch(err) {}
	}
	this.getAutoPaUlOffTime = function(nr) {
		try {
			var el = document.getElementById("autoUlPaOff_"+nr);
			return parseInt(el.value);
		} catch(err) {}
	}	
	this.createRetryTime = function(nr,row) {
		var cell = document.createElement("th");
		cell.innerHTML = "Retry&nbsp;timer&nbsp;after<br>auto&nbsp;PA&nbsp;Off";
		cell.className = "thdrht";
		row.appendChild(cell);		
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "retryTime_"+nr;
		el.name = el.id;
		el.nr = nr;
		el.type = "text";
		el.className = "number";
		el.style.width = "32px";
		var max = self.config[nr].limitRetryTime.MAX;
		var min = self.config[nr].limitRetryTime.MIN;
		el.title = "OFF 0hours, Min. 1hour, Max. "+max+"hours";
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var target = this;
			var num = self.getRetryTime(this.nr);
			var max = self.config[nr].limitRetryTime.MAX;
			var min = self.config[nr].limitRetryTime.MIN;
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
	this.createLastRetryTime = function(nr,row) {
		cell = document.createElement("th");
		cell.className = "thdrht";
		cell.id = "lastRetryTitle_"+nr;
		cell.innerHTML = "Next&nbsp;retry&nbsp;in";
		cell.style.visibility = "hidden";
		row.appendChild(cell);				
		cell = document.createElement("td");
		cell.id = "lastRetry_"+nr;
		cell.name = cell.id;
		cell.style.minWidth = "43px";
		cell.style.visibility = "hidden";
		cell.innerHTML = "";
		row.appendChild(cell);	
	}
	this.setLastRetryTime = function(nr,v) {
		try {
			var t = document.getElementById("lastRetryTitle_"+nr);
			var el = document.getElementById("lastRetry_"+nr);
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
	this.setRetryTime = function(nr,v) {
		try {
			var el = document.getElementById("retryTime_"+nr);
			el.value = v;
		} catch(err) {}
	}
	this.getRetryTime = function(nr) {
		try {
			var el = document.getElementById("retryTime_"+nr);
			return parseInt(el.value);
		} catch(err) {}
	}	
	this.createIsol = function(nr,row) {
		var cell = document.createElement("th");
		cell.className = "thdrht";
		var b = [false,false];
		for (var k=0;k<2;k++)
			b[k] = self.factory[nr].adjBandEnabled[k]||self.factory[nr].chBandEnabled[k];
		var dual = b[0] && b[1];
		if (dual){
			cell.innerHTML = "Last&nbsp;Isolation&nbsp;Meas.("+self.factory[nr].bandNames[0]+"/"+self.factory[nr].bandNames[1]+")";
		}else{
			cell.innerHTML = "Last&nbsp;Isolation&nbsp;Meas.";	
		}
		cell.style.height = "20px";
		row.appendChild(cell);
		cell = createTextCell("isol_"+nr,1);
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.innerHTML = "dB";
		cell.style.fontWeight = "normal";
		row.appendChild(cell);
	}	
	this.createIsolGain = function(nr,row,band) {
		var cell = document.createElement("th");
		var b = [false,false];
		for (var k=0;k<2;k++)
			b[k] = self.factory[nr].adjBandEnabled[k]||self.factory[nr].chBandEnabled[k];
		if (!b[band]) row.style.display="none";
		cell.innerHTML = "Min.&nbsp;Allowable&nbsp;Attenuation&nbsp;("+self.factory[nr].bandNames[band]+")<br/>for&nbsp;20dB&nbsp;Isolation&nbsp;Margin";
		cell.className = "thdrht";
		cell.style.height = "20px";
		row.appendChild(cell);
		cell = createTextCell("isolGain_"+nr+"_"+band,1);
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.innerHTML = "dB";
		cell.style.fontWeight = "normal";
		row.appendChild(cell);
	}
	this.setIsolGain = function(nr,g) {
		try {
			var m = self.getIsolGainMargin(nr);
			var isol = [0,0];
			var gainAllow = [0,0];
			var attAllow = [0,0];
			var maxGLimits = [0,0];
			var uldlMax = [0,0];
			//Se determina el max(gainlimits) para cada banda
			for (var k=0;k<2;k++){
				for (var j=0;j<2;j++){
					if (maxGLimits[k]<self.factory[nr].gainlimit[2*k+j]){
						maxGLimits[k] = self.factory[nr].gainlimit[2*k+j];
						uldlMax[k] = j;
					}
				}
			}
			for (var k=0;k<2;k++){
				var gmin = maxGLimits[k]+self.config[nr].GmainRange[uldlMax[k]];
				isol[k] = ((g[k]>=self.factory[nr].gainlimit[2*k+uldlMax[k]])?">="+(g[k]+m[k]):g[k]+m[k])+".0";
				gainAllow[k] = (g[k]<gmin?"<"+gmin:g[k])+".0"
				var att = maxGLimits[k] - g[k];
				var attmax = -self.config[nr].GmainRange[uldlMax[k]];
				attAllow[k] = (att>attmax?">"+attmax:att);
			}
			var b = [false,false];
			for (k=0;k<2;k++)
				b[k] = self.factory[nr].adjBandEnabled[k]||self.factory[nr].chBandEnabled[k];
			var dual = b[0] && b[1];

			if (dual){
				setTextCell("isol_"+nr,isol[0] + " / " + isol[1]);
			}else{
				var ind = b[0]?0:1;
				setTextCell("isol_"+nr,isol[ind]);
			}
			for (k=0;k<2;k++){
				setTextCell("isolGain_"+nr+"_"+k,attAllow[k]);
			}
		} catch(err) {}
	}
	this.getIsolGainMargin = function(nr) {
		return self.config[nr].gainIsolMargin;
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
	
	this.setConfGain = function(b, band, nr, g) {
		try {
			if (g == self.config[nr].gain[band][b]) {
				return;
			}
			self.config[nr].gain[band][b] = g;
			self.config[nr].getFrm(self.factory[nr],nr);
			var gatt = g;
			// el cambio de variable gain --> atenuación se aplica en todos los casos
			 gatt = self.factory[nr].gainlimit[2*band+b]-gatt;
			self.mainGainLimSet(b, band, nr, gatt);
			// al cambiar ganancia desde status (por aislamiento) hay que modificar la parte de potencia
			self.mainPowerLimSet(b, band, nr, self.config[nr].power[band][b]-self.config[nr].gain[band][b]);
			var max = self.factory[nr].powerlimit[2*band+b]-self.config[nr].gain[band][b];
			var min = self.factory[nr].powerlimit[2*band+b] - self.factory[nr].gainlimit[2*band+b] - self.MAIN_POWER_RANGE; //El min es absoluto, no depende de conf.gain
			document.getElementById("mainPowerLimit_"+band+"_"+b+"_"+nr).title = "Min: "+min+", Max: "+max+" dBm";
			initFormChangeCheck();
		} catch(err) {}
	}
	this.createIsolVerify = function(nr, row) {
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
		el.nr = nr;
		el.onclick = function(ev) {
			submitform(this.nr,false, true);
		}
		cell.appendChild(el);
	}
	this.createOpfRoutineStatus = function(row) {
		var cell = createLedBox("opfRoutineRunning");
		row.appendChild(cell);
	}
	this.opfRoutineRunningSet = function(nr,alarm) {
		setTextCell("opfrunning_"+nr,alarm?"BUSY":"");
	}

	this.createClearAbnSqAlarm = function(nr, row) {
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
		el.nr = nr;
		el.onclick = function(ev) {
			submitform(this.nr, false, false, true);
		}
		cell.appendChild(el);
	}
	this.createOpfMode = function(nr,row) {
		var cell = document.createElement("th");
		cell.innerHTML = "Action&nbsp;After&nbsp;Alarm";
		cell.className = "thdrht";
		row.appendChild(cell);	
		cell = document.createElement("td");
		row.appendChild(cell);	
		cell.colSpan = 3;		
		var el = document.createElement("select");
		el.id = "opfMode_"+nr;
		el.name = el.id;
		el.nr = nr;
		for (var i = 0; i < this.opfModes.length; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = this.opfModes[i];
			opt.value = i;
		}
		el.onchange = function(ev) {
			self.showRetrySettings(this.nr,this.value<2);
		}		
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.style.width = "140px";
		el.selectedIndex = 1;
		cell.appendChild(el);
		cell = document.createElement("td");
		cell=createTextCell("opfrunning_"+nr,1);
		row.appendChild(cell);			
	}
	
	this.opfModeSet = function(nr,mode) {
		if (mode < 0 || mode >= this.opfModes.length) {
			return;
		}
		try {
			var el = document.getElementById("opfMode_"+nr);
			el.selectedIndex = mode;
		} catch(err) {}
	}
	this.opfModeGet = function(nr) {
		try {
			var el = document.getElementById("opfMode_"+nr);
			return el.selectedIndex;
		} catch(err) { return 0;}
	}

	this.blockedSet = function(nr,doblock) {
		if ( doblock ) {
			if ( self.blocked[nr] ) {
				return;
			}
			self.blocked[nr] = true;
			self.blockContent(nr,self.blocked[nr]);
			self.showTagBlocked(nr);

		} else {
			if ( !self.blocked[nr] ) {
				return;
			}
			self.blocked[nr] = false;
			self.blockContent(nr,self.blocked[nr]);
			self.showTag(nr);
		}
	}

	this.createFOInterface = function(nr) {
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);
		
		var cell = this.createFOAlarmTable(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";
		
		var cell = this.createFOCtrlTable(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";

		return tab;
	}
	this.createFOCtrlTable = function(nr) {
		var cellb = document.createElement("td");
		cellb.style.verticalAlign = "middle";
		var tbl = document.createElement("table");
		tbl.align = "center";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		row.appendChild(this.createClearFiberErrors(nr));
		if (nr>0){
			var row = document.createElement("tr");
			tb.appendChild(row);
			this.createDelayEnable(row, nr);
		}else{ //botón para forzar medida de delay en master
			var row = document.createElement("tr");
			tb.appendChild(row);
			row.appendChild(this.createDelayMeasButton());
		}
		return cellb;
	}
	this.createDelayEnable = function(row, nr){
		var cell = document.createElement("th");
		cell.innerHTML = "Delay Adjust";
		cell.className = "thdrht";
		row.appendChild(cell);
		var cell = document.createElement("td");
		cell.style.textAlign = "left";
		row.appendChild(cell);
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = "delayAdjustEnable_"+nr;
		el.name = el.id;
		el.nr = nr;
		el.onclick = function(ev) {
			try {
				for (var k = 0; k < 3; k++) {
					for (var b = 0; b < 2; b++) {
						document.getElementById("delayCell_"+k+"_"+b+"_"+this.nr).style.display = this.checked?"table-cell":"none";
					}
				}
			} catch(e){}
		}
		cell.appendChild(el);
	}
	this.FOalarmLabels = ["Active Link", "Remote Port", "Loss<br>Communication", "Loss Optical<br>Signal",
		"FO Transceiver<br>Status", "Rx Power<br>(dBm)", "Error Count", "Delay Meas.(us)"];
	this.FOalarmBaseID = ["ActiveLink", "remotePort", "LossCommunication", "LossOpticalSignal",
		"FOTransceiverStatus", "FORxPower", "ErrorCount", "DelayMeas"];
	this.createFOAlarmTable = function(nr) {
		var nports = nr==0?nrOfRemotes:2;
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
		cell.id = "portCell_0_"+nr;
		row.appendChild(cell);
		var nRows = this.FOalarmLabels.length;
		if (nr>0) nRows--;
		for (var k = 0; k < nRows; k++) {
			var cell = document.createElement("th");
			cell.className = "thdrht";
			cell.innerHTML = this.FOalarmLabels[k];
			cell.style.minWidth = "20pt";
			cell.style.textAlign = "center";
			cell.style.paddingLeft = "inherit";
			cell.id = this.FOalarmLabels[k]+"_"+nr;
			cell.style.display = ((k==0 && nr==0) || (k==1 && nr>0))?"none":"table-cell";
			row.appendChild(cell);
		}
		if (nr>0){ //no hay control de delay en master
			for (var k = 0; k < 2; k++) {
				var cell = document.createElement("th");
				cell.className = "thdrht";
				cell.style.textAlign = "center";
				cell.style.padding = "2px";
				cell.innerHTML = (k==0?"UL":"DL")+" Delay (us)";
				cell.id = "delayCell_0_"+k+"_"+nr;
				row.appendChild(cell);
			}
		}
		for (var port = 0; port < nports; port++) {
			var row = document.createElement("tr");
			row.style.display = port==1?"none":"table-row";
			row.id = "FOportInfo_"+port+"_"+nr;
			row.style.display = "none";
			row.style.minHeight = "20px";
			tb.appendChild(row);
			var cell = document.createElement("th");
			cell.id = "portCell_"+(port+1)+"_"+nr;
			cell.className = "thdrht";
			cell.style.minWidth = "10pt";
			row.appendChild(cell);
			var el = document.createElement("a");
			var title = "OPTICAL "+(nr==0?"LINK ":"PORT ")+(port+1);
			el.innerHTML = title;
			el.id = "linknumbertitle_"+nr;
			cell.appendChild(el);
			var idx = 1;
			el.className = "m";
			el.href = "/optLinkM.html?nr="+(nr==0?port+1:nr);
			el.oport = port;
			el.nr = nr;
			el.onclick = function(ev) {self.optPopup(~~this.nr, ~~this.oport);return false;};
			cell.appendChild(el);
			for (var k = 0; k < nRows; k++) {
				var id = this.FOalarmBaseID[k]+"_"+port+"_"+nr;
				if (k < 5 && k!=1) {
					var cell = createLedBox(id);
					if (nr==0 && k==0) cell.style.display = "none"; //se oculta active link en master
				} else {
					var cell = document.createElement("td");
					cell.id = id;
					cell.className = "tabval";
					cell.style.textAlign = "center";
					cell.style.minWidth = "30px";
					if (nr>0 && k==1) cell.style.display = "none"; //se oculta remote port en remotos
				}
				row.appendChild(cell);
			}
			if (nr>0){ //no hay control de delay en master
				for (var k = 0; k < 2; k++) {
					var cell = document.createElement("td");
					cell.id = "delayCell_"+(port+1)+"_"+k+"_"+nr;
					cell.style.textAlign = "center";
					row.appendChild(cell);
					var el = document.createElement("input");
					el.type = "text";
					el.id = this.DelayAdjustValueId(port, k, nr);
					el.name = el.id;
					el.style.width = "40px";
					el.style.textAlign = "right";
					el.title = "Min: "+self.config[nr].delayLims.min+" us, Max: "+self.config[nr].delayLims.max+" us";
					el.onkeypress = function(ev) {
						return isKeyDecimalNumber(ev);
					}
					el.onchange = function(ev) {
						if (this.value < self.config[nr].delayLims.min) {
							this.value = self.config[nr].delayLims.min.toFixed(1);
						}
						if (this.value > self.config[nr].delayLims.max) {
							this.value = self.config[nr].delayLims.max.toFixed(1);
						}
					}
					cell.appendChild(el);
					row.appendChild(cell);
				}
			}
		}
		return cellb;
	}
	this.createFODelayTable = function(nr) {
		var cellb = document.createElement("td");
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		cellb.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = "Delay Adjust";
		cell.className = "thdrht";
		row.appendChild(cell);
		var cell = document.createElement("td");
		cell.style.textAlign = "left";
		cell.style.width = "100%";
		row.appendChild(cell);
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = "delayAdjustEnable_"+nr;
		el.name = el.id;
		el.onclick = function(ev) {
			try {

			} catch(e){}
		}
		cell.appendChild(el);
		return cellb;
	}
	this.createClearFiberErrors = function(nr) {
		var cell = document.createElement("td");
		cell.colSpan = 2;
		cell.style.textAlign = "center";
		var el = document.createElement("input");
		el.id = "clearFiberErrors_"+nr;
		el.nr = nr;
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.width = "120px";
		el.style.height = "20px";
		el.style.fontWeight = "bold";
		el.value = "Clear Error Counters";
		el.onclick = function(ev) {
			submitform(this.nr,false,false,false,true);
		}
		cell.appendChild(el);
		return cell;
	}
	this.createDelayMeasButton = function() {
		var cell = document.createElement("td");
		cell.colSpan = 2;
		cell.style.textAlign = "center";
		var el = document.createElement("input");
		el.id = "runDelayMeas";
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.width = "120px";
		el.style.height = "20px";
		el.style.fontWeight = "bold";
		el.value = "Measure Delay";
		el.onclick = function(ev) {
			submitform(0,false,false,false,false,true);
		}
		cell.appendChild(el);
		return cell;
	}
	this.DelayAdjustValueId = function(port, k, nr) {
		return ("delayAdjustValue_"+port+"_"+k+"_"+nr);
	}
	this.getDelayAdjustEnableChecked = function(nr) {
		try {
			return document.getElementById("delayAdjustEnable_"+nr).checked;
		} catch(e) {return false;}
	}
	this.setDelayAdjustEnableChecked = function(val, nr) {
		try {
			document.getElementById("delayAdjustEnable_"+nr).checked = !!val;
		} catch(e) {}
	}
	this.getDelayAdjust = function(port, k, nr) {
		try {
			var id = self.DelayAdjustValueId(port, k, nr);
			return parseFloat(document.getElementById(id).value);
		} catch(e) {return 0;}
	}
	this.showFOstatus = function(monitor) {
		var alarmOpt = [];
		var alarm = []; 
		var warning = [];
		for (var nr=0;nr<nrOfRemotes;nr++){
			alarmOpt.push(false); //ha de haber 1 por remoto
			alarm.push(false); //ha de haber 1 por remoto
			warning.push(false); //ha de haber 1 por remoto
		}
		for (var nr=nrOfRemotes;nr>=0;nr--){
			self.displayFOinterface(nr,!monitor[nr].blocked);
			var nports = nr==0?nrOfRemotes:2;
			for ( var port = 0; port < nports; port++ ) {
				if (nr==0){
					var connectState = monitor[nr].FOmoduleConnected[port] && !monitor[nr].FOlossCommunication[port];
					if (!connectState) remoteGlobalConfResponseValid[port] = false;
					if (connectState && !remoteGlobalConfResponseValid[port] && !monitor[nr].fpgaErr){
						remoteGlobalConfResponseValid[port] = false;
						if (!reloadIcon){
							showResultIcon(ERR_RELOAD);
							reloadIcon = true;
						}
					}
					self.showUnit(port+1, connectState && remoteGlobalConfResponseValid[port]);
					
				}
				for (var k = 1; k < this.FOalarmBaseID.length; k++) {
					var id = this.FOalarmBaseID[k]+"_"+port+"_"+nr;
					if (k < 5 && k!=1) {
						var color = "grey";
						switch (k) {
							case 2: 
							{
								color = monitor[nr].FOlossCommunication[port] ? "red" : "green";
								break;
							}
							case 3:
							{
								var alarmOptDev = monitor[nr].FOlossOpticalSignal[port];
								//si almacenan para el lado master las alarmas/warnings de remoto si es relativo al puerto al que está conectado el master
								if (nr>0 && monitor[0].FOmoduleConnected[nr-1] && !monitor[0].FOlossCommunication[nr-1]
								&& port==monitor[0].FORemotesOpticalPort[nr-1]){	
									alarmOpt[nr-1] = alarmOpt[nr-1] || alarmOptDev;
								}
								if (nr==0){
									alarmOptDev = alarmOptDev || alarmOpt[port];
								}
								color = alarmOptDev ? "red" : "green";
								break;
							}
							case 4:
							{
								var alarmdev = monitor[nr].FOtransceiverAlarm[port]; 
								var warningdev = monitor[nr].FOtransceiverWarning[port];
								//si almacenan para el lado master las alarmas/warnings de remoto si es relativo al puerto al que está conectado el master
								if (nr>0 && monitor[0].FOmoduleConnected[nr-1] && !monitor[0].FOlossCommunication[nr-1]
								&& port==monitor[0].FORemotesOpticalPort[nr-1]){	
									alarm[nr-1] = alarm[nr-1] || alarmdev;
									warning[nr-1] = warning[nr-1] || warningdev;
								}
								if (nr==0){
									alarmdev = alarmdev || alarm[port];
									warningdev = warningdev || warning[port];
								}
								if ( alarmdev ) {
									color = "red";
								} else if ( warningdev ) {
									color = "yellow";
								} else {
									color = "green";
								}
								break;
							}
						}
						if (!monitor[nr].FOmoduleConnected[port]) {
							color = "grey";
						}
						ledSetColor(id, color);
					} else {
						var cell = document.getElementById(id);
						var val = "";
						switch (k) {
							case 1: val = monitor[nr].FOlossCommunication[port]?'---':monitor[nr].FORemotesOpticalPort[port]+1; break;
							case 5: val = monitor[nr].FORxPow[port].toFixed(1); break;
							case 6: val = monitor[nr].FOerrors[port]; break;
							case 7: 
								if (nr==0){
									if (monitor[0].FOlossCommunication[port]){
										val =  "---";
									}else{
										var res = monitor[0].delayMeas[port];
										if (res==0xffff)
											val = "---";//remote is not connected
										else if (res>=0x1fff)
											val = "---";//timeout
										else{
											res -= (self.factory[0].commonUl?5:4);
											var wordRate = self.factory[0].fmodulo*self.factory[0].fstep/1e6;
											wordRate*=self.factory[0].commonUl?19.2:24;
											res = res*48/wordRate/2;
											if (res<0) res=0;
											val = (res).toFixed(1);
										}
									}
								}
								break;
						}
						if (!monitor[nr].FOmoduleConnected[port]) {
							val = "";
						}
						try { cell.innerHTML = val; } catch(e){}
					}
				}
			}
		}
		self.setFOactiveOpticalLink(monitor);
		self.twoFibersUpdateDisplay(monitor);
	}
	this.setFOactiveOpticalLink = function(monitor) {
		for (var nr=0;nr<=nrOfRemotes;nr++){
			for (var port = 0; port < 2; port++) {
				var id = this.FOalarmBaseID[0]+"_"+port+"_"+nr;
				var color = "grey";
				if (monitor[nr].FOActiveOpticalLink == 0 && port == 0) {
					color = "green";
				} else if (monitor[nr].FOActiveOpticalLink == 1 && port == 1) {
					color = "green";
				}
				if (!monitor[nr].FOmoduleConnected[port]) {
					color = "grey";
				}
				ledSetColor(id, color);
			}
		}
	}
	this.twoFibersUpdateDisplay = function(monitor) {
		for (var nr=0;nr<=nrOfRemotes;nr++){
			var twofibers = monitor[nr].FOmoduleConnected[0] && monitor[nr].FOmoduleConnected[1];
			var displayValue = (twofibers ? "table-cell":"none");
			// ocultar Port labels
			// for (var i = 0; i <= 2; i++) {
			// 	var id = "portCell_"+i+"_"+nr;
			// 	document.getElementById(id).style.display = displayValue;
			// }
			if (nr>0){
				document.getElementById(self.FOalarmLabels[0]+"_"+nr).style.display = displayValue;
				for (var port = 0; port < 2; port++) {
					var id = this.FOalarmBaseID[0]+"_"+port+"_"+nr;
					ledSetDisplay(id, displayValue);
				}
			}
			var nports = nr==0?nrOfRemotes:2;
			for (var port = 0; port < nports; port++) {
				// var displayValue = (port == portToHide? "none":"table-row");
				var displayValue = (monitor[nr].FOmoduleConnected[port]? "table-row":"none");
				var rowId = "FOportInfo_"+port;
				document.getElementById("FOportInfo_"+port+"_"+nr).style.display = displayValue;
				var nRows = this.FOalarmBaseID.length;
				if (nr>0) nRows--;
				for (var k = 1; k < nRows; k++) {
					// var displayValue = (port == portToHide? "none":"table-cell");
					var displayValue = (monitor[nr].FOmoduleConnected[port]? "table-cell":"none");
					var id = this.FOalarmBaseID[k]+"_"+port+"_"+nr;
					if (k < 5 && k!=1){
						ledSetDisplay(id, displayValue);
					} else {
						var cell = document.getElementById(id);
						cell.style.display = displayValue;
					}
					if (k==1 && nr>0){
						var cell = document.getElementById(id);
						cell.style.display = "none";
					}
				}
			}
			// idem general alarms
			var nports = nr==0?nrOfRemotes:2;
			for (var port = 0; port < nports; port++) {
				self.opticalAlarmDisplay(port, nr, monitor[nr].FOmoduleConnected[port]);
			}
		}
	}
	this.showFOconfig = function(nr) {
		if (nr==0) return;
		var el = document.getElementById("delayAdjustEnable_"+nr);
		try {
			el.checked = self.config[nr].FOgroupDelayEnable;
			el.onclick();
		} catch(e){}
		for (var port = 0; port < 2; port++) {
			for (var k = 0; k < 2; k++) {
				var id = self.DelayAdjustValueId(port, k, nr);
				var val = self.config[nr].FOgroupDelay[port][k]
				try {document.getElementById(id).value = val.toFixed(1);} catch(e){}
			}
		}
	}

	this.optPopup = function(nr,port) {
		if (self.optPopupWindow && !self.optPopupWindow.closed)
			self.optPopupWindow.close();
		var w = 640;
		var h = 280;
		var left = (screen.width/2)-(w/2);
		var top = (screen.height/2)-(h/2);
		var url = "/optLinkM.html?nr="+(nr==0?port+1:nr);
		var name = "Optical_Link";
		var wspecs = 'resizable=1,scrollbars=1,toolbar=no,menubar=no,directories=no,status=no,titlebar=no,height='+h+',width='+w+',left='+left+',top='+top;
		self.optPopupWindow = window.open(url, name, wspecs);
	}
	this.createBbuTypeOfConnectionContent = function(nr){
		var cellb = document.createElement("td");
		cellb.id = "bbuTypeOfConnectionCell"+"_"+nr;
		var tab2 = document.createElement("table");
		tab2.style.borderCollapse = "separate";
		tab2.style.borderSpacing = "2px 2px";
		tab2.style.width = "100%";
		cellb.appendChild(tab2);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		var cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createBbuTypeOfConnectionBox(nr);
		cell.appendChild(el);	
		return cellb;
	}
	this.createBbuTypeOfConnectionBox = function(nr) {
		var box = document.createElement("div");
		box.id = 'bbuTypeOfConnectionBox'+'_'+nr;
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
		this.createBbuTypeOfConnection(row, nr);
		return box;
	}
	this.showBbuTypeBox = function(doShow, nr) {
		try {
			var el = document.getElementById('bbuTypeOfConnectionCell'+'_'+nr);
			el.style.display = doShow ? "table-cell":"none";
		} catch(err) {}		
	}
	this.createBbuTypeOfConnection = function(row, nr) {
		var cell = document.createElement('th');
		cell.innerHTML = "Type of BBU Connection";
		cell.className = "thdrht";
		row.appendChild(cell);
		cell = document.createElement('td');
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "bbuTypeOfConnection"+"_"+nr;
		el.name = el.id;
		el.self = this;
		el.nr = nr;
		var opts = [ "Dry Contacts", "Serial" ];
		var max_opts = opts.length;
		if (self.config[nr].received_data_frame_index==0) max_opts=1;
		for (var i = 0; i < max_opts; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.onchange = function(ev) {
			var alertMsg = "NOTICE:\nWith this action, relay assignment settings of "+(this.nr==0?"MASTER":"REMOTE "+this.nr)+" unit will be configured to default values.\nPlease confirm.";
			if (confirm(alertMsg)) {
				var forcePa = [[false,false],[false,false]];
				submitform(this.nr, false, false, false, false, false, false, forcePa, forcePa, true);
			}else{
				self.showBbuTypeOfConnection(self.config[this.nr].bbu_serial_mode,this.nr);
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
	this.showBbuTypeOfConnection = function(value, nr) {
		if ( typeof(value) === 'undefined' || isNaN(value) ) {
			return;
		}
		value = ~~value;
		try {
			var el = document.getElementById('bbuTypeOfConnection'+'_'+nr);
			if ( value >= el.options.length ) {
				value = 0;
			}
			el.selectedIndex = value;
		} catch(err) {}
	}
	this.readBbuTypeOfConnection = function(nr) {
		try {
			var el = document.getElementById('bbuTypeOfConnection'+'_'+nr);
			return el.selectedIndex;
		} catch(err) { return 0; }
	}
	this.hideWarning = function(nr){
		var el = document.getElementById("filtWarnHead_"+nr);
		el.style.display = "none";
		el = document.getElementById("filtWarnDiv_"+nr);
		el.style.display = "none";
	}
	this.setWarningMessage = function(fovlp, filtSepKhz, filtAdjSepKhz, filtNbAdjSepKhz, maxch, fact, uldlLinked,nr) {
		var el = document.getElementById("filtWarnHead_"+nr)
		el.style.display = "block";
		el = document.getElementById("filtWarnDiv_"+nr);
		el.style.display = "block";
		el = document.getElementById("min_filtWarnDiv_"+nr);
		el.src = "minimize.png";
		el = document.getElementById("warningBox_"+nr);
		el.style.paddingLeft = "20px";
		el.style.paddingRight = "20px";
		el.style.paddingTop = "5px";
		el.style.paddingBottom = "10px";		
		var message = "";
		var checkOv = false, checkB = false;
		for (var i=0;i<6;i++){
			if (fovlp[i]['check']) checkOv=true;
		}
		for (var i=6;i<8;i++){
			if (fovlp[i]['check']) checkB=true;
		}
		if (checkB){
			message += '<table style="width:100%"><body><tr><td style="width:32%;">';
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
			message += '</td><td><img src="FccLogo.png"></img></td></tr><body></table>';
			message += '</tr><body></table>';
		}
		if (checkOv){
			var titles = ["<h3>CONFLICTING NARROW BAND FILTERS:</h3>","<h3>CONFLICTING ADJ.BW FILTERS:</h3>","<h3>CONFLICT BETWEEN NARROW AND ADJ.BW FILTERS:</h3>"];
			for (var k=0;k<3;k++){
				if (fovlp[2*k]['check'] || fovlp[2*k+1]['check']){
					message += titles[k];
					
					for (var band = 0; band < 2; ++band) {
						var showOnlyOneBand = (k>0) && uldlLinked[band];
						var b = nr==0?1:0; //solo UL o DL
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
					if (k==0) message += self.filterWarnText(filtSepKhz,fact);
					if (k==1) message += self.filterAdjWarnText(filtAdjSepKhz);
					if (k==2) message += self.filterNBAdjWarnText(filtNbAdjSepKhz);
				}				
			}
		}
		el.innerHTML = message;
	}
	this.filterWarnText = function(filtSepKhz,fact) {
		var filtmax = fact.commonUl ? 150:100;
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
		+ "2) The bandwidth setting must be " + filtmax + " KHz.</br>"
		+ "3) All of them must have the same fine-gain setting.</br>"
		if (fact.chBandEnabled[0] && fact.chBandEnabled[1] && !fact.commonUl){
			str += "4) The frequency separation must be: " + filtSepKhz[0] +" KHz for "+ fact.bandNames[0]+" and " 
			+ filtSepKhz[1] +" KHz for "+ fact.bandNames[1]+".";
		}else{
			if (fact.chBandEnabled[0]){
				str += "4) The frequency separation must be: " + filtSepKhz[0] + " KHz.";
			}else{
				str += "4) The frequency separation must be: " + filtSepKhz[1] + " KHz.";
			}
		}
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
				color = (self.factory[0].commonUl ? "white":"yellow");
			} else {
				color = (self.factory[0].commonUl ? "yellow":"white");
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
				color = (self.factory[0].commonUl ? "white":"yellow");
			} else {
				color = (self.factory[0].commonUl ? "yellow":"white");
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
		var currentFw =  (self.factory[0].commonUl ? 0:1);
		var selectedFw = this.masterFirmwareGet();
		return (currentFw != selectedFw);
	}
	this.createForceSystemAlarm = function(row){
		var cell = document.createElement("th");
		cell.innerHTML = "Force General System Alarm";
		cell.className = "thdrht";
		cell.colSpan = 3;
		row.appendChild(cell);
		for (var sysAlarmNr = 0; sysAlarmNr < NrOfGralSystemAlarms; sysAlarmNr++) {
			cell = document.createElement("td");
			cell.colSpan = 2;
			row.appendChild(cell);
			cell.appendChild(this.createForceSystemAlarmButton(sysAlarmNr));
		}
	}
	this.createForceSystemAlarmButton = function(sysAlarmNr) {
		var box = document.createElement("div");
		box.id = "forceSystemAlarmDiv_"+sysAlarmNr;
		box.style.border = "medium solid #aaaaaa";
		box.style.width = "40px";
		box.style.height = "10px";
		box.style.verticalAlign = "middle";
		box.style.textAlign = "center";
		box.style.padding = "1px";
		box.style.backgroundColor = "#bbbbbb";
		box.style.borderStyle = "inset";
		box.style.borderRadius = "3px";
		box.onmouseover = function() { this.style.borderColor = "#555555"; };
		box.onmouseout = function() { this.style.borderColor = "#aaaaaa"; };
		var lbl = document.createElement("label");
		box.appendChild(lbl);
		lbl.id = "forceSystemAlarmLabel_"+sysAlarmNr;
		lbl.className = "togglebuttonlabel";
		lbl.setAttribute("unselectable", "on");
		lbl.style.fontWeight = "bold";
		lbl.style.display = "inline-block";
		lbl.innerHTML = (sysAlarmNr+1)+" - "+"OFF";

		var el = document.createElement("input");
		el.id = "forceSystemAlarm_"+sysAlarmNr;
		el.name = el.id;
		el.type = "checkbox";
		el.label = lbl;
		lbl.htmlFor = el.id;
		el.box = box;
		el.onclick = function(){
			this.label.innerHTML = (this.checked?"ON":"OFF");
			this.label.style.color = (this.checked?"white":"black");
			this.box.style.backgroundColor = (this.checked?"red":"#bbbbbb");
			submitform(0);
		}
		el.className = "hidden";
		box.appendChild(el);
		return box;
	}
	this.setForceSystemAlarm = function(on, sysAlarmNr){
		try {
			document.getElementById("forceSystemAlarm_"+sysAlarmNr).checked = !!on;
			document.getElementById("forceSystemAlarmLabel_"+sysAlarmNr).innerHTML = (sysAlarmNr+1)+" - "+(on?"ON":"OFF");
			document.getElementById("forceSystemAlarmLabel_"+sysAlarmNr).style.color = (on?"white":"black");
			document.getElementById("forceSystemAlarmDiv_"+sysAlarmNr).style.backgroundColor = (on?"red":"#bbbbbb");
		} catch(e){}
	}
	this.getForceSystemAlarm = function(sysAlarmNr){
		try { return document.getElementById("forceSystemAlarm_"+sysAlarmNr).checked;} catch(e){return false;}
	}
	this.createForceRfOff = function(mRow){
		var cell = document.createElement("th");
		cell.innerHTML = "Force RF Off";
		cell.className = "thdrht";
		mRow.appendChild(cell);
		cell = document.createElement("td");
		cell.colSpan = 3;
		cell.style.paddingLeft = "15px";
		mRow.appendChild(cell);
		var id = "forceRfOff";
		var el = this.createForceRfOffSwitch(id);
		cell.appendChild(el);
	}
	this.createForceRfOffSwitch = function(id) {
		var box = document.createElement("div");
		box.id = "hpaSwBox_"+id;
		box.style.border = "medium solid #00AAAA";
		box.style.width = "40px";
		box.style.height = "10px";
		box.style.verticalAlign = "middle";
		box.style.textAlign = "center";
		box.style.padding = "2px";
		box.style.backgroundColor = "#D0FFD0";
		box.style.borderStyle = "inset";
		box.style.borderRadius = "3px";
		// box.style.marginLeft = "auto";
		// box.style.marginRight = "auto";
		box.onmouseover = function() { this.style.borderColor = "#3030A0"; };
		box.onmouseout = function() { this.style.borderColor = "#30AAAA"; };
		var lbl = document.createElement("label");
		box.appendChild(lbl);
		lbl.id = "hpaSwLbl_"+id;
		lbl.className = "togglebuttonlabel";
		lbl.setAttribute("unselectable", "on");
		lbl.style.whiteSpace = "nowrap";
		lbl.style.fontWeight = "bold";
		lbl.style.display = "inline-block";
		lbl.style.width = "40px";
		lbl.style.height = "12px";
		lbl.innerHTML = "ON";
		var el = document.createElement("input");
		el.id = "hpaSwInp_"+id;
		el.name = el.id;
		el.type = "checkbox";
		el.className = "hidden";
		el.style.marginRight = "2px";
		el.checked = true;
		var id = el.id;
		lbl.setAttribute("for", id);
		// lbl.title = "Control-Click for all PAs";
		// el.band = band;
		// el.dn = dn;
		el.nr = 0;
		el.baseId = id;
		el.onclick = function() {
			var on = this.checked;
			// var forcePaOn = [[false,false],[false,false]];
			// var forcePaOff = [[false,false],[false,false]];		
			// var nr = this.nr;	
			// var band = this.band;
			// var b = this.dn;			
			self.forceRfOffSwToggle(this.baseId);
			// if (on){
			// 	forcePaOn[band][b] = true;
			// }else{
			// 	forcePaOff[band][b] = true;
			// }					
			submitform(this.nr, false, false, false, false, false, true);
		};
		box.appendChild(el);
		return box;
	}
	this.forceRfOffSwToggle = function(id) {
		try {
			var box = document.getElementById("hpaSwBox_"+id);
			var lbl = document.getElementById("hpaSwLbl_"+id);
			var el =  document.getElementById("hpaSwInp_"+id);
			if (!el.checked) {	// not checked == RF on
				lbl.innerHTML = "RF ON";
				box.style.backgroundColor = "#C0FFC0";
				lbl.style.color = "#000000";
				box.style.borderStyle = "inset";
			} else {			// checked == RF off
				lbl.innerHTML = "RF OFF";
				box.style.backgroundColor = "#e20000";
				lbl.style.color = "#ffffff";
				box.style.borderStyle = "outset";
			}
		} catch (err) { }
	}
	this.forceRfOffSwGet = function() {
		var id = "forceRfOff";
		try {
			var el = document.getElementById("hpaSwInp_"+id);
			return el.checked;
		} catch (err) {	return false; }
	}
	this.forceRfOffSwSet= function(on) {
		var id = "forceRfOff";
		try {
			var box = document.getElementById("hpaSwBox_"+id);
			var lbl = document.getElementById("hpaSwLbl_"+id);
			var el =  document.getElementById("hpaSwInp_"+id);
			el.checked = on ? true : false;
			if (!el.checked) {	// not checked == RF on
				lbl.innerHTML = "RF ON";
				lbl.style.color = "#000000";
				box.style.backgroundColor = "#D0FFD0";
				box.style.borderStyle = "inset";
			} else {			// checked == RF off
				lbl.innerHTML = "RF OFF";
				lbl.style.color = "#ffffff";
				box.style.backgroundColor = "#e20000";
				box.style.borderStyle = "outset";
			}
		} catch(err) { }
	}
	this.forceRfOffSwDisableStateSet = function(disable) {
		var id = "forceRfOff";
		try {
			var hpaEn = document.getElementById("hpaSwInp_"+id);
			hpaEn.disabled = disable? true : false;
		} catch (err) { }
	}

	// this.opfModes = ['Automatic Shut Down', 'Run Isolation Meas.', 'Only Alarm'];
	this.opfModes = ['Automatic Shut Down', 'Run Isolation Meas.'];

	var self = this;
	this.pageTypes = {'NB': 0, 'ADJ': 1};
	this.pageType = 'undefined';
	this.FilterValidSep;
	this.FILTSEPADJKHZ = 100;
	this.FILTSEPNBADJKHZ = 200;
	this.tags = null;
	this.version = null;
	this.sernr = new SerialNrT();
	var freqStyle = [[0,0,0],[0,0,0]];
	for (var nr=0;nr<=nrOfRemotes;nr++){
		for (var band=0;band<2;band++){
			freqStyle[band][nr] = parseInt(localStorage.getItem('freqStyle_'+band+'_'+nr+'_'+Prjstr+window.location.host));
			if (isNaN(freqStyle[band][nr]) || freqStyle[band][nr] != 0) {
				freqStyle[band][nr] = 1;
			}
		}
	}
	
	this.freqStyle = freqStyle;
	this.showChannelsBitmask = 0;
	this.filterOptions = [[true,true],[true,true]];
	this.id = 'rootElement';
	// this.msgElId = 'msgElement';
	this.parentId = 'page';
	this.BW_ADJ_MAX_HZ = 18000000;
	this.BW_ADJ_MIN_HZ = 100000;
	this.BW2_ADJ_MIN_HZ = (this.BW_ADJ_MIN_HZ/2);	
	this.maxChannels = [];
	this.mainGainMax = [];
	this.showFiltersMask = [];
	this.blocked = [];
	this.minButtonStates = [];
	this.firstStatus = true;
	for (var nr=0;nr<=nrOfRemotes;nr++){
		this.mainGainMax.push([[0,0],[0,0]]);
		this.showFiltersMask.push([[false,false],[false,false]]);
		this.blocked.push(false);
	}
	this.ISOL_GAIN_MARGIN_OLD = 15;
	this.ISOL_GAIN_MARGIN_NEW = 20;
	this.VERSION_SW_GAIN_CHANGE = {
		'MAIN': 6,
		'SUB': 31
	};
	this.MAIN_POWER_RANGE = 20;
	this.doFrequencyCheck = true;
	this.lastFirmwareNr = -1;
	this.deepDischarge = new createDeepDischargeBox();
	this.isBbuConnected = [false,false,false,false,false,false,false,false,false,];
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
function createStringFromChar(len, char) {
    return Array.prototype.join.call({length: (len || -1) + 1}, char || 'x');
}
function blockRemotes(){
	try{
		for (band=0;band<2;band++)
			blockRemoteFreqs(page.isFreqSplitFixed(band,0),band);
	} catch (err) { }
}
function blockRemoteFreqs(val,band){
	var cfg = new Config();
	try{
		for (var nr=1;nr<=nrOfRemotes;nr++){
			if (band==0) disable_element("firstNetassign_"+nr,val);
			for (var nbadj=0;nbadj<2;nbadj++){
				if (band==0) disable_element("firstnet_"+nbadj+"_"+nr,val);//es un parámetro UL/DL pero se usa nbadj por simplicidad
				if (nbadj==0){
					//disable_element("freqSplit"+band+"_"+nr,val);
					for (var b=0;b<2;b++){
						disable_element("eqBw_"+band+"_"+b+"_"+nr,val);
						for (var c=0;c<cfg.CHNR*2;c++){
							disable_element("chFreq_"+c+"_"+b+"_"+band+"_"+nr,val);
							disable_element("chBw_"+c+"_"+b+"_"+band+"_"+nr,val);
							disable_element("Gfine_"+c+"_"+b+"_"+band+"_0_"+nr,val);
							if (b==0) disable_element("filtShow_0_"+band+"_"+c+"_"+nr,val);
						}
					}
				}else{
					for (var b=0;b<2;b++){
						for (var c=0;c<cfg.ADJNR;c++){
							disable_element("Gfine_"+c+"_"+b+"_"+band+"_1_"+nr,val);
							if (b==0) disable_element("filtShow_1_"+band+"_"+c+"_"+nr,val);
							for (var s=0;s<2;s++){
								disable_element("chAdjF_"+c+"_"+b+"_"+s+"_"+band+"_"+nr,val);
							}
						}
					}
				}
			}
		}
	} catch (err) { }
}
function blockRemotSquelch(val){
	var cfg = new Config();
	try{
		for (var nr=1;nr<=nrOfRemotes;nr++){
			for (var band=0;band<2;band++){
				disable_element("simplex"+band+"_"+nr,val);
				disable_element("mutemode"+band+"_"+nr,val);
				disable_element("eqSq_"+band+"_"+nr,val);
				for (var nbadj=0;nbadj<2;nbadj++){
					for (var dn=0;dn<2;dn++){
						for (var c=0;c<cfg.CHNR*2;c++){
							disable_element("sqEn_"+nbadj+"_"+band+"_"+dn+"_"+c+"_"+nr,val);
							disable_element("sqThr_"+nbadj+"_"+band+"_"+dn+"_"+c+"_"+nr,val);
						}
					}
				}
			}
		}
	} catch (err) { }
}
function blockRemoteGral(val){
	try{
		for (var nr=1;nr<=nrOfRemotes;nr++){
			for (var band=0;band<2;band++){
				for (var dn=0;dn<2;dn++){
					disable_element("mainGainLimit_"+band+"_"+dn+"_"+nr,val);
					disable_element("mainPowerLimit_"+band+"_"+dn+"_"+nr,val);
				}
			}
		}
	} catch (err) { }
}
function blockRemoteAlarm(val){
	try{
		for (var nr=1;nr<=nrOfRemotes;nr++){
			disable_element('extremeTempAction_'+nr,val);
			disable_element('abnSqTime_'+nr,val);
			disable_element('retryTime_'+nr,val);
			disable_element('opfMode_'+nr,val);
			for (var dl=0;dl<2;dl++){
				for (var nrelay=0;nrelay<7;nrelay++){
					disable_element("dl_onoff_"+dl+"_"+nrelay+"_"+nr,val);
					for (var hms=0;hms<3;hms++){
						disable_element("dl_time_"+hms+"_"+dl+"_"+nrelay+"_"+nr,val);
					}
				}
			}
		}
	} catch (err) { }
}
function disable_element(id, val){
	try{
		var el = document.getElementById(id);
		if (el){
			el.disabled = val;
			el.style.backgroundColor = val?"#CCCCCC":"white";
		}
	} catch (err) {}
}
function refreshEnables(){
	for (var nr=1;nr<=nrOfRemotes;nr++){
		for (var band=0;band<2;band++){
			try{
				var el = document.getElementById("maxPower_"+band+"_"+nr);
				if (el){
					el.disabled = true;
					el.style.backgroundColor = "#CCCCCC";
				}
			} catch (err) {}
		}
	}
}