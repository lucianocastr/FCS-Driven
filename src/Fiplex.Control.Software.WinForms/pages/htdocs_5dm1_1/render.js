var hpa_settings = [{min: -20, low_alarm: -128, low_warn: -128, high_warn: 19, high_alarm: 22, max: 25 },
		    {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 45 }];
var board_temp_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 80, high_alarm: 85, max: 90 };
var chRfIn_settings = [{min: -110, low_alarm: -121, low_warn: -121, high_warn: 0, high_alarm: 0, max: 0 }, 
		       {min:  -80, low_alarm: -121, low_warn: -121, high_warn: 0, high_alarm: 0, max: 0 }];
var chRfOut_settings = [{min: -35, low_alarm: 20, low_warn: 20, high_warn: 36, high_alarm: 40, max: 25 },
			{min: -20, low_alarm: 20, low_warn: 20, high_warn: 36, high_alarm: 40, max: 40 }];
var agc_settings = [{min: 0, low_alarm: 0, low_warn: 0, high_warn: 300, high_alarm: 300, max: 80 },
		    {min: 0, low_alarm: 0, low_warn: 0, high_warn: 300, high_alarm: 300, max: 80 }];
var frameSeparator = "\t\t\t";
function Page() {
	this.show = function(tags, fact, serNr, version, config, fibInfo, basicCfg) {
		self.tags = tags;
		self.factory = fact;
		self.config = config;
		self.fibInfo = fibInfo;
		self.basicCfg = basicCfg;
		self.version = version;
		self.BW_ADJ_MAX_HZ = self.factory[0].commonUl?18000000:20000000;
		self.FilterValidSep = self.factory[0].commonUl? FilterValidSeparation[1]:FilterValidSeparation[0];
		for (var n=0;n<nrOfDevices;n++){
			self.nfpa[n] = new PageNfpa(self.factory[n], self.config[n], n, unitToMon[n]);
			self.maxChannels[n] = self.config[n].CHNR;
		}
		self.maxChannelsADJ = self.config[0].ADJNR;
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
		for (var nr=0;nr<nrOfDevices;nr++){
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
			self.deepDischarge = new createDeepDischargeBox();
			rootEl.appendChild(self.deepDischarge.getBox());
			rootEl.appendChild(self.createDASOverview());
			rootEl.appendChild(self.createDeviceSelector());
			for(var nr=0;nr<nrOfDevices;nr++){
				var unit = self.createUnit(nr);
				rootEl.appendChild(unit);
				self.setMinButtonState(nr);
			}
			rootEl.appendChild(self.createTagTable());
			self.firstStatus = true;
			
		}
		self.showTags();
		self.showFreqs();
		
		self.hideUnit 				= [];
		self.hideOverviewTables 	= false;
		for (var nr=0;nr<nGUIRemotes;nr++){
			self.hideUnit.push(false);
		}
		
		self.showConfs(false);

		self.doFrequencyCheck = [];
		for (var k=0;k<nGUIRemotes;k++) self.doFrequencyCheck.push(true);
		initFormChangeCheck();
	}
	this.drawTableLines = function(){
		for (var k=0;k<5;k++){
			var cnv = document.getElementById("cnv_"+k);
			if (cnv!=null) remove_element(cnv);
		}
		for (var k=0;k<5;k++){ //each DAS Table
			var cnv = document.createElement("canvas");
			document.getElementById("dasContTable_"+k).appendChild(cnv);
			var t = document.getElementById("dasTable_"+k);
			var rect = t.getBoundingClientRect();
			cnv.id = "cnv_"+k;
			cnv.height = rect.height;
			cnv.width = 50;
			cnv.style.position = 'absolute';
			cnv.style.left = rect.left + 'px';
			cnv.style.top = (rect.top + document.documentElement.scrollTop)+ 'px';
			var ctx = cnv.getContext('2d'); 
			ctx.strokeStyle = "black";
			var rows = t.getElementsByTagName('tr');
			var h = [];
			var y = []; y[0]=0;
			var n = rows.length;
			for (var i = 0; i < rows.length; i++) h[i] = rows[i].getBoundingClientRect().height; //heights of each row
			for (var i = 0; i < h.length; i++) y[i+1] = y[i] + h[i]; //coordinate Y of each row
			var nrow = 0;
			for (var j=0;j<=8;j++){ //order master, remotes connected to master, expansion 1, remotes connected to exp1, expansion 2..
				var lastMasterPos = y[1+t.headerRows];
				var lastExpPos;
				for (var nr in self.fibInfo.FOmoduleConnected) {
					var i1 = nr & 0xff; var i2= (nr>>8)&0xff;
					var isExp = i1==0 && i2>0;
					var isRemote = i1!=0;
					var isMaster = nr==0;
					if (isMaster) continue;
					if (i2!=j) continue;
					if (!self.fibInfo.FOmoduleConnected[nr] || typeof(tags[nr])==="undefined" || self.basicCfg[nr].version.isEmpty) continue;
					var p =  nrow + t.headerRows + 1;
					if (isRemote && i2==0){ //remotes hanging from master
							self.drawLine(ctx, 11, y[p]+h[p]/2, 41, y[p]+h[p]/2); //line horiz
							self.drawLine(ctx, 11, lastMasterPos, 11, y[p]+h[p]/2); //line vert
							lastMasterPos = y[p]+h[p]/2;
					}
					if (isExp){	 //expansion hanging from master					
						self.drawLine(ctx, 11, y[p]+h[p]/2, 31, y[p]+h[p]/2); //line horiz
						self.drawLine(ctx, 11, lastMasterPos, 11, y[p]+h[p]/2); //line vert
						lastMasterPos = y[p]+h[p]/2;
						lastExpPos = lastMasterPos;
					}
					if (isRemote && i2>0){ //remote hanging from expansion
						self.drawLine(ctx, 21, y[p]+h[p]/2, 41, y[p]+h[p]/2); //line horiz
						self.drawLine(ctx, 21, lastExpPos, 21, y[p]+h[p]/2); //line vert
					}
					nrow++;
				}
			}
		}
	}
	this.drawLine = function(ctx,x1,y1,x2,y2){
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
	}
	this.setMinButtonState = function(nr){
		for (var k in self.minButtonStates){
			var id = ~~k.substr(-1);
			if (id==nr)	self.setMinimizedState(k,self.minButtonStates[k]);
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
		if (unitToMon[nr]==0) br = 1;
		if (typeof(self.showFiltersMask[nr][adj][band]) === 'undefined' 
			|| self.showFiltersMask[nr][adj][band] === null
			|| !this.areEqual(self.showFiltersMask[nr][adj][band],self.config[nr].filterEnabled[adj][band][br]))
		{
		    	redraw = true;
		}
		self.showFiltersMask[nr][adj][band] = this.copy(self.config[nr].filterEnabled[adj][band][br]);
		return redraw;
	}
	this.deviceInfoToFile = function(){
		var s = ",";
		var f = "DEVICE"+s+"TAG"+s+"SERIAL NUMBER"+s+"FPGA"+s+"uC"+s+"ETH"+"\n";
		for (var j=0;j<=8;j++){ //order master, remotes connected to master, expansion 1, remotes connected to exp1, expansion 2..
			for (var nr in self.fibInfo.FOmoduleConnected) {
				var i1 = nr & 0xff; var i2= (nr>>8)&0xff;
				var isMaster = nr==0;
				if (i2!=j) continue;
				if (!isMaster && (!self.fibInfo.FOmoduleConnected[nr] || typeof(tags[nr])==="undefined" || self.basicCfg[nr].version.isEmpty)) continue;
				f += (nr==0?"MASTER":(i1==0?"EXPANSION "+i2+".0":"REMOTE "+i2+"."+i1)); f+=s;
				f += tags[nr].tag.trim(); f+=s;
				f += nr==0?self.sernr.sernr:self.basicCfg[nr].serNr.sernr.trim();f+=s;
				var v = nr==0?self.version:self.basicCfg[nr].version;
				f += v.fwStr; f+=s;
				f += v.swStr; f+=s;
				f += v.ethStr; f+='\n';
			}
		}
		return f;
	}
	this.downloadFile = function(filename) {
		if (!filename) {
			return;
		}
		var data = self.deviceInfoToFile();
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
	this.createTagTable = function(){
		var unitDiv = document.createElement("div");
		if (window.top.monitorMode != 2) unitDiv.style.display = "none";
		unitDiv.id = "tagTable";
		unitDiv.className = "unitbox";
		var h = document.createElement("h1");
		h.innerHTML = "&nbsp;&nbsp;DEVICE LIST";
		unitDiv.appendChild(h);
		var maint = document.createElement("table");
		unitDiv.appendChild(maint);
		maint.className = "contenttable";
		maint.id = "dasContTable_4";
		var r = document.createElement("tr");maint.appendChild(r); 
		var c = document.createElement("th");
		c.className = "contentcell";
		r.appendChild(c);
		var t = document.createElement("table");
		t.className = "sysTable";
		t.style.width = "100%";
		t.id = "dasTable_4";
		t.headerRows = 2;
		c.appendChild(t);
		//HEADER1
		var r = document.createElement("tr");
		t.appendChild(r); 
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = " DEVICE";c.style.textAlign = "left";c.rowSpan=2;
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = " TAG";c.rowSpan=2;
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "SERIAL NUMBER";c.rowSpan=2;
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "VERSION";c.colSpan = 3;
		//HEADER2
		var r = document.createElement("tr");
		t.appendChild(r); 
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "FPGA";
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "uC";
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "Ethernet";
		//UNIT
		var nrow=0;
		for (var j=0;j<=8;j++){ //order master, remotes connected to master, expansion 1, remotes connected to exp1, expansion 2..
			for (var nr in self.fibInfo.FOmoduleConnected) {
				var i1 = nr & 0xff; var i2= (nr>>8)&0xff;
				var isExp = i1==0 && i2>0;
				var isRemote = i1!=0;
				var isMaster = nr==0;
				if (i2!=j) continue;
				if (!isMaster && (!self.fibInfo.FOmoduleConnected[nr] || typeof(tags[nr])==="undefined" || self.basicCfg[nr].version.isEmpty)) continue;
				var wh = (nrow % 2) == 0;nrow++;
				var r = document.createElement("tr");
				r.id = "dasTagRow_"+nr;
				if (wh)	r.style.backgroundColor = "white";
				this.okColor[nr] = r.style.backgroundColor;
				t.appendChild(r);
				var c = document.createElement("th");c.style.textAlign = "left";
				var a = document.createElement("a");
				var unitName = (nr==0?"MASTER":(i1==0?"EXPANSION "+i2+".0":"REMOTE "+i2+"."+i1));
				if (isExp) unitName = "&emsp;&emsp;" + unitName;
				if (isRemote) unitName = "&emsp;&emsp;&emsp;" + unitName;
				a.innerHTML = unitName;
				a.className = "m";
				a.nr = nr;
				a.href = "javascript:void(0);";
				a.onclick = function(ev){self.goToAdvSetting(this.nr);};
				c.className = "thdrht";
				c.appendChild(a);
				r.appendChild(c);
				var c = document.createElement("td");r.appendChild(c);
				var tag = document.createElement("input");
				tag.type = "text";
				c.appendChild(tag);
				tag.id = "tagEntry_"+nr;tag.name = tag.id;
				tag.className = "tag2";
				tag.size = "40";tag.maxLength = "30";
				tag.value = tags[nr].tag.trim();
				var c = document.createElement("td");r.appendChild(c);
				c.innerHTML = nr==0?self.sernr.sernr:self.basicCfg[nr].serNr.sernr.trim();
				var v = nr==0?self.version:self.basicCfg[nr].version;
				var c = document.createElement("td");r.appendChild(c);
				c.innerHTML = v.fwStr;
				var c = document.createElement("td");r.appendChild(c);
				c.innerHTML = v.swStr;
				var c = document.createElement("td");r.appendChild(c);
				c.innerHTML = v.ethStr;
			}
		}
		//SAVE BUTTON
		var r = document.createElement("tr");
		t.appendChild(r);
		var c = document.createElement("td");r.appendChild(c);
		c.colSpan = 6;
		var btn = document.createElement("input");
		btn.type = "button";
		btn.style.fontSize = "10px";
		btn.style.width = "120px";
		btn.style.height = "20px";
		btn.style.fontWeight = "bold";
		btn.id = btn.name = "saveB";
		btn.value = "SAVE";
		btn.onclick = function(ev) {
			self.downloadFile("DeviceList_"+self.sernr.sernr+".csv");
		}
		c.appendChild(btn);
		return unitDiv;
	}
	this.createDeviceSelector = function(){
		var unitDiv = document.createElement("div");
		unitDiv.id = "deviceSel";
		unitDiv.style.display = window.top.monitorMode == 1?"block":"none";
		unitDiv.className = "unitbox";
		var headDiv = this.createDevSelectorBar();
		unitDiv.appendChild(headDiv);
		return unitDiv;
	}
	this.createDevSelectorBar = function() {
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
		cell.style.width = "5px";
		row.appendChild(cell);			
		var cell = document.createElement("td");		
		row.appendChild(cell);
		cell.className = "nrtitle";
		cell.innerHTML = "DEVICE SELECTION";	
		cell.style.width = "15%";
		cell.style.paddingLeft = "10px";
		for (var k=0;k<nGUIRemotes;k++) this.createUnitSelector(row,k);
		cell = document.createElement("td");
		cell.className = "tdBlank";
		cell.style.width = "5px";
		row.appendChild(cell);
		return box;
	}
	this.createUnitSelector = function(row,n){
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "DEVICE "+(n+1)+":&nbsp;&nbsp;&nbsp;&nbsp;";
		cell.className = "tag";
		cell.style.textAlign = "right";
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "tag";
		var el = document.createElement("select");
		var ind = ~~localStorage.getItem("dev_"+n+"_"+Prjstr+window.location.host);
		var i=-1;
		var val=-1;
		if (n==1){//2nd selection includes "no selection"
			var opt = document.createElement('option');
			el.options.add(opt);
			if (i==ind) val=i;
			opt.value = i;
			opt.innerHTML = "---";
		}
		var cond=false;
		for (var j=0;j<2;j++){ //1st iteration master and expansion with cond = false, 2nd iteration remotes with cond = true
			for (var i in self.fibInfo.FOmoduleConnected) {
				var i1 = i & 0xff; var i2= (i>>8)&0xff;
				if ((i1==0)==cond) continue;
				if (n==1 && i==0) continue; //2nd select without master options
				if (i<=0 || (self.fibInfo.FOmoduleConnected[i] && remoteGlobalConfResponseValid[i])){
					var opt = document.createElement('option');
					el.options.add(opt);
					if (i==ind) val=i;
					opt.value = i;
					opt.innerHTML = (i==0?"MASTER":(i1==0?"EXPANSION "+i2+".0":"REMOTE "+i2+"."+i1))+" - "+tags[i].tag.trim();
				}
			}
			cond = true;
		}
		el.id = el.name = "unitSel_"+n;
		if (val==-1)
			el.selectedIndex=0;
		else
			el.value = val;
		if (window.top.monitorMode == 1){
			unitToMon[n] = ~~el.value;
			self.updateDevicesToMonitor();
		}
		el.onchange = function(ev) {
			forceReload = true;
		}
		cell.appendChild(el);
	}
	this.updateDevicesToMonitor = function(){
		try{
			unitToMon[0] = ~~document.getElementById('unitSel_0').value;
			unitToMon[1] = ~~document.getElementById('unitSel_1').value;
			if ((unitToMon[0]==unitToMon[1])||unitToMon[1]==-1){
				unitToMon[1] =-1;
				document.getElementById('unitSel_1').selectedIndex = 0;
				nrOfDevices = 1;
			}else
				nrOfDevices = 2;
			for (var k=0;k<2;k++) localStorage.setItem("dev_"+k+"_"+Prjstr+window.location.host,unitToMon[k]);
		}catch(err){}
	}

	this.createDASOverview = function(){
		var unitDiv = document.createElement("div");
		unitDiv.style.display = window.top.monitorMode == 0?"block":"none";
		unitDiv.id = "dasOverview";
		unitDiv.className = "unitbox";
		//DAS SYSTEM RF
		var id = "dasSystemRF";
		var headDiv = this.createUnitHead("DAS SYSTEM RF","","","",0,true,id);
		headDiv.id = "dasSystem0";
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		contentDiv.id = id+"0";
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = this.createDASSystemRF();
		contentDiv.appendChild(tab);
		//DAS SYSTEM OPTICAL
		var id = "dasSystemOpt";
		var headDiv = this.createUnitHead("DAS SYSTEM OPTICAL","","","",0,true,id);
		headDiv.id = "dasSystem0";
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		contentDiv.id = id+"0";
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = this.createDASSystemOptical();
		contentDiv.appendChild(tab);
		//DAS MASTER/EXPANSION ALARM TABLE
		var id = "dasAlarmTabCont";
		var headDiv = this.createUnitHead("DAS ALARM OVERVIEW","","","",0,true,id);
		headDiv.id = "dasAlarmTab0";
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		contentDiv.id = id+"0";
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = this.createDASAlarmTable();
		contentDiv.appendChild(tab);
		//DAS CONFIGURATION TABLE
		var id = "dasConfigTabCont";
		var headDiv = this.createUnitHead("DAS CONFIGURATION OVERVIEW","","","",0,true,id);
		headDiv.id = "dasConfigTab0";
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		contentDiv.id = id+"0";
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = this.createDASConfigTable();
		contentDiv.appendChild(tab);
		return unitDiv;
	}
	this.createDASSystemRF = function(){
		var bandON = [self.factory[0].chBandEnabled[0] || self.factory[0].adjBandEnabled[0],self.factory[0].chBandEnabled[1] || self.factory[0].adjBandEnabled[1]];
		var numband=0;
		for (var b=0;b<2;b++){
			if (bandON[b]) numband++;
		}
		if (numband==0) numband=1;//to avoid js error if numband=0
		var maint = document.createElement("table");
		maint.className = "contenttable";
		maint.id = "dasContTable_0";
		var r = document.createElement("tr");maint.appendChild(r); 
		var c = document.createElement("th");
		c.className = "contentcell";
		r.appendChild(c);
		var t = document.createElement("table");
		t.className = "sysTable";
		t.style.width = "100%";
		t.id = "dasTable_0";
		t.headerRows = 3;
		c.appendChild(t);
		//HEADER1
		var r = document.createElement("tr");
		t.appendChild(r); 
		var c = document.createElement("th");
		c.innerHTML = "DEVICE/TAG";
		c.style.width = "180px";
		c.className = "thdrht";
		c.rowSpan = 3;
		r.appendChild(c);
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "RF Broad Band Levels";c.colSpan = 3*numband;
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "RF Enable / Attenuation";c.colSpan = 4*numband;
		//HEADER2
		var r = document.createElement("tr");t.appendChild(r);
		for (var k=0;k<2;k++){
			for (var b=0;b<2;b++){
				var c = document.createElement("th");r.appendChild(c);
				c.innerHTML = self.factory[0].bandNames[b];c.colSpan = k==0 ? 3:4;
				if (!bandON[b]) c.style.display = "none";
			}
		}
		//HEADER3
		var r = document.createElement("tr");t.appendChild(r);
		for (var b=0;b<2;b++){
			var c = document.createElement("th");r.appendChild(c);
			c.innerHTML = "Input";c.colSpan = 2;
			c.style.width = "110px";
			if (!bandON[b]) c.style.display = "none";
			var c = document.createElement("th");r.appendChild(c);
			c.innerHTML = "Output";
			if (!bandON[b]) c.style.display = "none";
		}
		for (var b=0;b<2;b++){
			var c = document.createElement("th");r.appendChild(c);
			c.innerHTML = "Uplink";c.colSpan = 2;
			if (!bandON[b]) c.style.display = "none";
			var c = document.createElement("th");r.appendChild(c);
			c.innerHTML = "Downlink";c.colSpan = 2;
			if (!bandON[b]) c.style.display = "none";
		}
		//UNIT
		var nrow=0;
		for (var j=0;j<=8;j++){ //order master, remotes connected to master, expansion 1, remotes connected to exp1, expansion 2..
			for (var nr in self.fibInfo.FOmoduleConnected) {
				var i1 = nr & 0xff; var i2= (nr>>8)&0xff;
				var isExp = i1==0 && i2>0;
				var isRemote = i1!=0;
				var isMaster = nr==0;
				if (i2!=j) continue;
				if (!isMaster && (!self.fibInfo.FOmoduleConnected[nr] || typeof(tags[nr])==="undefined" || self.basicCfg[nr].version.isEmpty)) continue;
				var wh = (nrow % 2) == 0;nrow++;
				var r = document.createElement("tr");
				r.id = "dasSystemRFRow_"+nr;
				if (wh)	r.style.backgroundColor = "white";
				this.okColor[nr] = r.style.backgroundColor;
				t.appendChild(r);
				var c = document.createElement("th");c.style.textAlign = "left";
				var a = document.createElement("a");
				var unitName = i2+"."+i1+" - "+tags[nr].tag.trim();
				if (isExp) unitName = "&emsp;&emsp;" + unitName;
				if (isRemote) unitName = "&emsp;&emsp;&emsp;" + unitName;
				a.innerHTML = unitName;
				a.className = "m";
				a.nr = nr;
				a.href = "javascript:void(0);";
				a.onclick = function(ev){self.goToAdvSetting(this.nr);};
				c.className = "thdrht";
				c.appendChild(a);
				r.appendChild(c);
				var band,b;
				for (band=0;band<2;band++){
					//LED
					var c = document.createElement("td");r.appendChild(c);
					if (!isExp){
						id = "ledInput_"+band+"_"+nr;
						var led = createLed(id);c.appendChild(led);
					}
					if (!bandON[band]) c.style.display = "none";
					//INPUT/OUTPUT
					for (var b=0;b<2;b++){
						var c = document.createElement("td");r.appendChild(c);c.id = "rfBBLevel_"+b+"_"+band+"_"+nr;
						c.style.minWidth = "80px";
						if (!bandON[band]) c.style.display = "none";
					}
				}
				if (isRemote){
					for (band=0;band<2;band++){
						for (b=0;b<2;b++){
							//RF Enable
							var c = document.createElement("td");r.appendChild(c);
							c.appendChild(self.createRemotePASwitch(band,b,nr));
							if (!bandON[band]) c.style.display = "none";
							//Attenuation
							var c = document.createElement("td");r.appendChild(c);
							if (!bandON[band]) c.style.display = "none";
							var el = document.createElement("input");
							el.type = "text";
							el.id = "sysAtt_"+band+"_"+b+"_"+nr;
							el.name = el.id;
							el.style.width = "30px";
							el.style.textAlign = "right";
							var amin = 0;
							var amax = -self.config[0].GmainRange[b];
							el.title = "Min: 0dB, Max: "+amax+" dB";
							el.onkeypress = function(ev) {
								return isKeyDecimalNumber(ev);
							}
							el.onchange = function(ev) {
								if (this.value < amin) {
									this.value = amin;
								}
								if (this.value > amax) {
									this.value = amax;
								}
							}
							el.value = 	self.basicCfg[nr].att[band][b];
							c.appendChild(el);
							var sp = document.createElement("span");c.appendChild(sp);
							sp.innerHTML = "&nbsp;dB";
						}
					}
					self.currentRemoteAtt[nr] = self.basicCfg[nr].att;
					self.currentPAEnable[nr] = self.basicCfg[nr].paEnabled;
				}else{
					for (b=0;b<(4*numband);b++){
						var c = document.createElement("td");r.appendChild(c);
					}
				}
			}
		}
		return maint;
	}
	this.createRemotePASwitch = function(band,b,nr) {
		var id = "sysPa_"+band+"_"+b+"_"+nr;
		var box = document.createElement("div");
		box.id = "hpaSwBox_"+id;
		box.style.border = "medium solid #00AAAA";
		box.style.width = "40px";
		box.style.height = "10px";
		box.style.verticalAlign = "middle";
		box.style.textAlign = "center";
		box.style.padding = "2px";
		box.style.borderRadius = "3px";
		box.style.marginLeft = "auto";
		box.style.marginRight = "auto";
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
		var el = document.createElement("input");
		el.id = "hpaSwInp_"+id;
		el.name = el.id;
		el.type = "checkbox";
		el.className = "hidden";
		el.style.marginRight = "2px";
		//initial values
		el.checked = !self.basicCfg[nr].paEnabled[band][b];
		lbl.innerHTML = el.checked?"RF OFF":"RF ON";
		box.style.backgroundColor = el.checked?"#e20000":"#C0FFC0";
		lbl.style.color = el.checked?"#ffffff":"#000000";
		box.style.borderStyle = el.checked?"outset":"inset";
		lbl.title = "Click on Apply Changes link to set PA state";
		var idb = el.id;
		lbl.setAttribute("for", idb);
		el.baseId = id;
		el.onclick = function() {	
			self.forceRfOffSwToggle(this.baseId);	
		};
		box.appendChild(el);
		return box;
	}
	this.createDASSystemOptical = function(){
		var maint = document.createElement("table");
		maint.className = "contenttable";
		maint.id = "dasContTable_1";
		var r = document.createElement("tr");maint.appendChild(r); 
		var c = document.createElement("th");
		c.className = "contentcell";
		r.appendChild(c);
		var t = document.createElement("table");
		t.className = "sysTable";
		t.style.width = "100%";
		t.id = "dasTable_1";
		t.headerRows = 3;
		c.appendChild(t);
		//HEADER1
		var r = document.createElement("tr");
		t.appendChild(r); 
		var c = document.createElement("th");
		c.innerHTML = "DEVICE/TAG";
		c.style.width = "180px";
		c.className = "thdrht";
		c.rowSpan = 3;
		r.appendChild(c);
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "Remote<br>Port";c.rowSpan = 3;
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "Active<br>Link";c.rowSpan = 3;
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "Optical Levels";c.colSpan = 2;
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "Delay";c.colSpan = 4;
		//HEADER2
		var r = document.createElement("tr");t.appendChild(r);
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "Master<br>Side";c.rowSpan = 2;
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "Remote<br>Side";c.rowSpan = 2;
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "Meas.";c.rowSpan = 2;
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "Configured";c.colSpan = 2;
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "Total";
		//HEADER3
		var r = document.createElement("tr");t.appendChild(r);
		var c = document.createElement("th");r.appendChild(c);
		c.innerHTML = "Enable";
		for (var b=0;b<2;b++){
			var c = document.createElement("th");r.appendChild(c);
			c.innerHTML = "UL/DL";
		}
		//UNIT
		var nrow=0;
		for (var j=0;j<=8;j++){ //order master, remotes connected to master, expansion 1, remotes connected to exp1, expansion 2..
			for (var nr in self.fibInfo.FOmoduleConnected) {
				var i1 = nr & 0xff; var i2= (nr>>8)&0xff;
				var isExp = i1==0 && i2>0;
				var isRemote = i1!=0;
				var isMaster = nr==0;
				if (i2!=j) continue;
				if (!isMaster && (!self.fibInfo.FOmoduleConnected[nr] || typeof(tags[nr])==="undefined" || self.basicCfg[nr].version.isEmpty)) continue;
				var conf = isMaster?self.config[0]:self.basicCfg[nr];
				var wh = (nrow % 2) == 0;nrow++;
				var r = document.createElement("tr");
				r.id = "dasSystemOpticalRow_"+nr;
				if (wh)	r.style.backgroundColor = "white";
				this.okColor[nr] = r.style.backgroundColor;
				t.appendChild(r);
				var c = document.createElement("th");c.style.textAlign = "left";
				var a = document.createElement("a");
				var unitName = i2+"."+i1+" - "+tags[nr].tag.trim();
				if (isExp) unitName = "&emsp;&emsp;" + unitName;
				if (isRemote) unitName = "&emsp;&emsp;&emsp;" + unitName;
				a.innerHTML = unitName;
				a.className = "m";
				a.nr = nr;
				a.href = "javascript:void(0);";
				a.onclick = function(ev){self.goToAdvSetting(this.nr);};
				c.className = "thdrht";
				c.appendChild(a);
				r.appendChild(c);
				var b;
				//Remote Port
				var c = document.createElement("td");r.appendChild(c);c.id = "genRemotePort_"+nr;
				//Active Link
				var c = document.createElement("td");r.appendChild(c);c.id = "activeLink_"+nr;
				//Optical Levels
				for (b=0;b<2;b++){
					var c = document.createElement("td");r.appendChild(c);c.id = "optLevel_"+b+"_"+nr;
				}
				if (isRemote){
					//Delay Meas
					var c = document.createElement("td");r.appendChild(c);c.id = "measDelay_"+nr;
					//Conf Delay enable
					var c = document.createElement("td");r.appendChild(c);
					var el = document.createElement("input");
					el.type = "checkbox";
					el.id = "confDelayEn_"+nr;
					el.checked = self.basicCfg[nr].FOgroupDelayEnable;
					c.appendChild(el);
					//Conf Delay values
					var c = document.createElement("td");r.appendChild(c);
					var txt = ["&nbsp;/&nbsp;","&nbsp;us"];
					for (b=0;b<2;b++){
						var el = document.createElement("input");
						el.type = "text";
						el.id = "confDelay_"+b+"_"+nr;
						el.name = el.id;
						el.style.width = "30px";
						el.style.textAlign = "right";
						el.max = conf.getDelayMax();
						el.title = "Min: 0 us, Max: "+el.max+" us";
						el.onkeypress = function(ev) {
							return isKeyDecimalNumber(ev);
						}
						el.onchange = function(ev) {
							if (this.value < 0) this.value = "0.0";
							var max = ~~this.max;
							if (this.value > max) this.value = max.toFixed(1);
						}
						el.value = 	self.basicCfg[nr].FOgroupDelay[b].toFixed(1);
						c.appendChild(el);
						var sp = document.createElement("span");c.appendChild(sp);
						sp.innerHTML = txt[b];
					}
					//Total Delay
					var c = document.createElement("td");r.appendChild(c);c.id = "totalDelay_"+nr;
				}else{
					for (b=0;b<4;b++){
						var c = document.createElement("td");r.appendChild(c);
					}
				}
			}
		}
		var r = document.createElement("tr");maint.appendChild(r);
		var c = document.createElement("td");r.appendChild(c);
		c.className = "contentcell";
		c.style.textAlign = "center";
		c.appendChild(self.createCleanTagButton());
		c.appendChild(self.createDelayMeasButton());
		c.appendChild(self.createDelayEqualizeButton());
		return maint;
	}
	this.pathLossExist = function () {
		for (var nr in self.fibInfo.FOmoduleConnected) {
			var i1 = nr & 0xff;
			var isRemote = i1 != 0;
			if (isRemote && self.fibInfo.FOmoduleConnected[nr]) {
				if (self.basicCfg[nr].plaEn) {
					return true;
				}
			}
		}
		return false;
	}
	this.createDASAlarmTable = function(){
		var maint = document.createElement("table");
		maint.className = "contenttable";
		maint.id = "dasContTable_2";
		var r = document.createElement("tr");
		maint.appendChild(r); 
		var c = document.createElement("th");
		c.className = "contentcell";
		r.appendChild(c);
		var t = document.createElement("table");
		t.style.borderCollapse = "collapse";
		t.style.width = "100%";
		t.id = "dasTable_2";
		t.headerRows = 2;
		c.appendChild(t);
		//HEADER
		var r = document.createElement("tr");
		t.appendChild(r); 
		var c = document.createElement("th");
		c.innerHTML = "DEVICE/TAG";
		c.style.width = "180px";
		c.className = "thdrht";
		r.appendChild(c);
		var c = document.createElement("td");
		r.appendChild(c);
		var cfg = new Config();
		var nAlarms = 0;
		//HEADER GLOBAL
		var ordGB = [0,1,2,3,16,17,18,19,20,21,22,23,8,9,10,11,12,13,14];
		if (self.version.compareSw(6,0)>=0 && self.pathLossExist()) {
			ordGB.push(4); //added path loss 1 alarm for master SDRP
			ordGB.push(5); //added path loss 2 alarm for master SDRP
		}
		for (var k=0;k<ordGB.length;k++){
			var c = document.createElement("th");
			c.innerHTML = ordGB[k]<16?cfg.alarmNames[0][ordGB[k]]:"Fiber Optic "+(ordGB[k]-15);
			c.className = "thAlarmTb";
			r.appendChild(c);
			nAlarms++;
		}
		//HEADER BAND
		var bandON = [self.factory[0].chBandEnabled[0] || self.factory[0].adjBandEnabled[0],self.factory[0].chBandEnabled[1] || self.factory[0].adjBandEnabled[1]];
		for (var k=0;k<11;k++){
			for (var b=0;b<2;b++){
				var c = document.createElement("th");
				c.innerHTML = cfg.alarmNames[1][k]+" "+self.factory[0].bandNames[b];
				if (!bandON[b]){
					c.style.display = "none";
				}else if(k==8 && self.version.compareSw(6,0)>=0 && !self.factory[0].masterOTA){
					c.style.display = "none"; //ul pa fail hidden in master SDRP rack mount
				}else{
					nAlarms++;
				}
				c.className = "thAlarmTb";
				r.appendChild(c);
			}
		}
		//HEADER BBU
		for (var k=1;k<cfg.alarmNamesBbu.length;k++){ //normal AC power omitted
			var c = document.createElement("th");
			c.innerHTML = cfg.alarmNamesBbu[k];
			c.className = "thAlarmTb";
			r.appendChild(c);
			nAlarms++;
		}
		//DUMMY ROW BEETWEEN HEADER AND UNITS
		var r = document.createElement("tr");
		r.style.height = "5px";
		t.appendChild(r);
		for (var k=0;k<2;k++){
			var c = document.createElement("th");
			r.appendChild(c);
		}
		for (var k=0;k<nAlarms;k++){
			var c = document.createElement("th");
			c.className = "confth";
			r.appendChild(c);
		}		
		//UNIT
		var nrow=0;
		var nlegacy = 0;
		for (var j=0;j<=8;j++){ //order master, remotes connected to master, expansion 1, remotes connected to exp1, expansion 2..
			for (var nr in self.fibInfo.FOmoduleConnected) {
				var i1 = nr & 0xff; var i2= (nr>>8)&0xff;
				var isExp = i1==0 && i2>0;
				var isRemote = i1!=0;
				var isMaster = nr==0;
				if (i2!=j) continue;
				if (!isMaster && (!self.fibInfo.FOmoduleConnected[nr] || typeof(tags[nr])==="undefined" || self.basicCfg[nr].version.isEmpty)) continue;
				var conf = isMaster?self.config[0]:self.basicCfg[nr];
				var wh = (nrow % 2) == 0;nrow++;
				var r = document.createElement("tr");
				r.id = "dasAlarmRow_"+nr;
				if (wh)	r.style.backgroundColor = "white";
				this.okColor[nr] = r.style.backgroundColor;
				t.appendChild(r);
				var c = document.createElement("th");
				var a = document.createElement("a");
				var unitName = i2+"."+i1+" - "+tags[nr].tag.trim();
				var lblName = unitName;
				if (isExp) lblName = "&emsp;&emsp;" + lblName;
				if (isRemote) lblName = "&emsp;&emsp;&emsp;" + lblName;
				a.innerHTML = lblName;
				a.className = "m";
				a.nr = nr;
				a.href = "javascript:void(0);";
				a.onclick = function(ev){self.goToAdvSetting(this.nr);};
				c.className = "thdrht";
				c.appendChild(a);
				r.appendChild(c);
				if (isMaster){
					for (var k=0;k<8;k++){
						var index = self.fibInfo.isExpansionPort[k]? (k+1)<<8 : k+1;
						conf.globalAlarmsInstalled[k+16] = self.fibInfo.FOmoduleConnected[index];//installed if module connected
					}
				}
				if (isExp){
					for (var k=0;k<7;k++) conf.globalAlarmsInstalled[k+16] = self.fibInfo.FOmoduleConnected[(i2<<8)+k+1];//installed if module connected
					conf.globalAlarmsInstalled[23] = true;
				}
				var c = document.createElement("th");
				c.style.width = "10px";
				if (isRemote && conf.device_version_index<2){
					c.innerHTML = '(*)';
					nlegacy++;
				}
				r.appendChild(c);
				//GLOBAL ALARMS
				for (var k=0;k<ordGB.length;k++){
					var index = ordGB[k];
					if (isRemote && ordGB[k]>=16) index-=10; //for remotes fiber alarms are 6 and 7
					var id = "alarm_"+nr+"_0_"+index;
					var c = document.createElement("td");
					c.className	= "confth";
					r.appendChild(c);
					if (isRemote && ordGB[k]>=18) continue; //only 2 fiber alarms for remotes
					var led = createLed(id); 
					c.appendChild(led);
					var title = unitName + " - " + (ordGB[k]<16?cfg.alarmNames[0][ordGB[k]]:"Fiber Optic "+(ordGB[k]-15));
					var showAlarm = conf.globalAlarmsInstalled[index];
					showAlarm = showAlarm && !(isMaster && ordGB[k]>=2 && ordGB[k]<6);
					if (isExp && ordGB[k]>=2 && ordGB[k]<6) showAlarm = false;//expansion does not have opf and path loss
					if (showAlarm)
						c.title = title;
					else
						led.style.display = "none";
				}
				//BAND ALARMS
				for (var k=0;k<11;k++){
					for (var b=0;b<2;b++){
						var id = "alarm_"+nr+"_1_"+b+"_"+k;
						var c = document.createElement("td");
						c.className	= "confth";
						if (!bandON[b]) c.style.display = "none";
						if (k==8 && self.version.compareSw(6,0)>=0 && !self.factory[0].masterOTA) c.style.display = "none";//ul pa fail hidden in master SDRP rack mount
						var led = createLed(id);
						c.appendChild(led);
						var title = unitName + " - " + (cfg.alarmNames[1][k])+" "+self.factory[0].bandNames[b];
						var showAlarm = conf.bandAlarmsInstalled[k];
						showAlarm = showAlarm && !(isMaster && (k==0 || (k>=2 && k<5) || k==10 || k==6 || k==7 ));
						if (isExp) showAlarm = false;
						if (showAlarm)
							c.title = title;
						else
							led.style.display = "none";
						r.appendChild(c);
					}
				}
				//BBU ALARMS
				for (var k=1;k<cfg.alarmNamesBbu.length;k++){ //normal AC power omitted
					var c = document.createElement("th");
						var id = "alarm_"+nr+"_2_"+k;
						var c = document.createElement("td");
						c.className	= "confth";
						var led = createLed(id);
						c.appendChild(led);
						var title = unitName + " - " + (cfg.alarmNamesBbu[k]);
						var showAlarm = conf.bbu_serial_mode;
						showAlarm = showAlarm && !(k==10 && conf.bbu_type ==2);
						if (showAlarm)
							c.title = title;
						else
							led.style.display = "none";
						r.appendChild(c);
				}
			}
		}
		if (nlegacy>0){
			var r = document.createElement("tr");
			maint.appendChild(r);
			var c = document.createElement("th");
			c.innerHTML = "(*) Legacy remote device: 4th External Input is an Alarm, not Force RF OFF input";
			c.style.textAlign = "left";
			c.style.fontSize = "11px";
			r.appendChild(c);
		}
		return maint;
	}
	this.goToAdvSetting = function(nr){
		document.getElementById('unitSel_0').value = nr;
		document.getElementById('unitSel_1').selectedIndex = 0;
		window.parent.navi.document.getElementById("adv").click();
	}
	this.createDASConfigTable = function(){
		var bandON = [self.factory[0].chBandEnabled[0] || self.factory[0].adjBandEnabled[0],self.factory[0].chBandEnabled[1] || self.factory[0].adjBandEnabled[1]];
		var maint = document.createElement("table");
		maint.className = "contenttable";
		maint.id = "dasContTable_3";
		var r = document.createElement("tr");
		maint.appendChild(r); 
		var c = document.createElement("th");
		c.className = "contentcell";
		r.appendChild(c);
		var t = document.createElement("table");
		t.style.borderCollapse = "collapse";
		t.style.width = "100%";
		t.id = "dasTable_3";
		t.headerRows = 2;
		c.appendChild(t);
		//HEADER
		var r = document.createElement("tr");
		t.appendChild(r); 
		var c = document.createElement("th");
		c.innerHTML = "DEVICE/TAG";
		c.style.width = "180px";
		c.className = "thdrht";
		c.rowSpan = 2;
		r.appendChild(c);
		var c = document.createElement("th");
		c.rowSpan = 2;
		r.appendChild(c);
		var nCtlNames = ["gp","filt0","filt1","squelch","alarm"];
		for (var k=0;k<self.cfgTitles.length;k++){
			var c = document.createElement("th");
			c.className = "confth";
			var txt = self.cfgTitles[k].toUpperCase();
			if (k==1 || k==2){
				txt+=self.factory[0].bandNames[k-1];
				if (!bandON[k-1]) c.style.display = "none";
			}
			c.innerHTML = txt+"<br>CONFIGURATION";
			c.colSpan = 3;
			var sp = document.createElement("span");
			var indParam = k>1?k-1:k;
			var str = self.paramListCfg[indParam];
			sp.innerHTML = str;
			c.appendChild(sp);
			c.style.width = "150px";
			r.appendChild(c);
		}
		//2ND HEADER
		var r = document.createElement("tr");
		t.appendChild(r); 
		for (var k=0;k<self.cfgTitles.length;k++){
			var c = document.createElement("th");
			if ((k==1 || k==2) && !bandON[k-1]) c.style.display = "none";
			c.innerHTML = "From";
			r.appendChild(c);
			c.className = "confth";
			var c = document.createElement("th");
			var el = document.createElement("input");
			el.type = "button";
			el.className = "btCopy";
			el.ctlName = nCtlNames[k];
			el.nCfg = k;
			var txt = self.cfgTitles[k].toLowerCase();
			if (k==1 || k==2){
				txt+=self.factory[0].bandNames[k-1];
				if (!bandON[k-1]) c.style.display = "none";
			}
			el.title = "Click to copy "+txt+" configuration from selected device to selected device(s)";
			el.onclick = function(ev){
				self.copyConf(this.ctlName,this.nCfg);
			};
			c.appendChild(el);
			r.appendChild(c)
			var c = document.createElement("th");
			if ((k==1 || k==2) && !bandON[k-1]) c.style.display = "none";
			c.innerHTML = "Copy<br>To";
			c.className = "cthconf";
			r.appendChild(c);
		}
		//UNIT
		var n=0;
		var nrow=0;
		var nlegacy = 0;
		for (var j=0;j<=8;j++){ //order master, remotes connected to master, expansion 1, remotes connected to exp1, expansion 2..
			for (var nr in self.fibInfo.FOmoduleConnected) {
				var i1 = nr & 0xff; var i2= (nr>>8)&0xff;
				var isExp = i1==0 && i2>0;
				var isRemote = i1!=0;
				var isMaster = nr==0;
				var conf = isMaster?self.config[0]:self.basicCfg[nr];
				if (i2!=j) continue;
				if (nr>0 && (!self.fibInfo.FOmoduleConnected[nr] || typeof(tags[nr])==="undefined" || self.basicCfg[nr].version.isEmpty)) continue;
				var wh = (n % 2) == 0;
				var r = document.createElement("tr");
				r.id = "dasConfigRow_"+nr;
				if (wh)	r.style.backgroundColor = "white";
				this.okColor[nr] = r.style.backgroundColor;
				t.appendChild(r);
				var c = document.createElement("th");
				var a = document.createElement("a");
				var unitName = i2+"."+i1+" - "+tags[nr].tag.trim();
				if (isExp) unitName = "&emsp;&emsp;" + unitName;
				if (isRemote) unitName = "&emsp;&emsp;&emsp;" + unitName;
				a.innerHTML = unitName;
				a.className = "m";
				a.nr = nr;
				a.href = "javascript:void(0);";
				a.onclick = function(ev){self.goToAdvSetting(this.nr);};
				c.className = "thdrht";
				c.appendChild(a);
				r.appendChild(c);
				var c = document.createElement("th");
				if (isRemote && conf.device_version_index<2){
					c.style.width = "10px";
					c.innerHTML = '(*)';
					nlegacy++;
				}
				r.appendChild(c);
				for (var k=0;k<self.cfgTitles.length;k++){
					var isExp = i2>0 && i1==0;
					var showRb = nr>0 || k==1 || k==2;
					var showCheck = true;//master shows checkbox for freq
					if (isExp && k!=4){//expansion shows only alarms
						showRb = false;
						showCheck = false;
					}
					var c = document.createElement("th");
					if ((k==1 || k==2) && !bandON[k-1]) c.style.display = "none";
					if (showRb){
						var el = document.createElement("input");
						el.type = "radio";
						el.name = nCtlNames[k]+"_rb";
						el.value = nr;
						c.appendChild(el);
					}
					c.className = "confth";
					r.appendChild(c);
					var c = document.createElement("th");
					c.id = nCtlNames[k]+"_txt_"+nr;
					if ((k==1 || k==2) && !bandON[k-1]) c.style.display = "none";
					c.className = "cthconf";
					r.appendChild(c);
					var c = document.createElement("th");
					if ((k==1 || k==2) && !bandON[k-1]) c.style.display = "none";
					if (showRb){
						var el = document.createElement("input");
						el.type = "checkbox";
						el.className = "chkConf";
						el.name = nCtlNames[k]+"_chk";
						if (!showCheck) el.style.display = "none";
						el.value = nr;
						c.appendChild(el);
					}
					r.appendChild(c);
				}
				n++;
			}
		}
		if (nlegacy>0){
			var r = document.createElement("tr");
			maint.appendChild(r);
			var c = document.createElement("th");
			c.innerHTML = "(*) Legacy remote device: Squelch and Alarm configuration are not comparable with Flex2.0 remotes due to new configuration parameters in Flex2.0 devices";
			c.style.textAlign = "left";
			c.style.fontSize = "11px";
			r.appendChild(c);
		}
		return maint;
	}
	this.showConfCRC = function(mon){
		var nCtlNames = ["gp","filt0","filt1","squelch","alarm"];
		var cfgNums = this.analyzeCRC(mon);
		var n = 0;
		var cond = false;
		for (var j=0;j<2;j++){ //1st iteration master and expansion with cond = false, 2nd iteration remotes with cond = true
			for (var nr in mon.monitorUnit[0].fibInfo.FOmoduleConnected) {
				var i1 = nr & 0xff; var i2= (nr>>8)&0xff;
				if ((i1==0)==cond) continue;
				if (!mon.monitorUnit[0].fibInfo.FOmoduleConnected[nr] || !remoteGlobalConfResponseValid[nr]) continue;
				if (nr>0 && !mon.remoteResponseValid[nr]) continue;
				var isExp = i2>0 && i1==0;
				for (var k=0;k<self.cfgTitles.length;k++){
					var show = nr>0 || k==1 || k==2;
					if (isExp && k!=4)show = false;
					var c = document.getElementById(nCtlNames[k]+"_txt_"+nr);
					var txt = self.cfgTitles[k]+" CFG " + cfgNums[n][k];
					if (isExp) txt = "Exp " + txt;
					try{
					if (show) c.innerHTML = txt;
					}catch(e){}
				}
				n++;
			}
			cond = true;
		}
	}
	this.analyzeCRC = function(mon){
		var numCfgs = self.cfgTitles.length;
		var cfgNums = [];
		var crcs = [];
		var nr,k,j;
		var n=0;
		var cond = false;
		var firstRemote=-1;
		for (var j=0;j<2;j++){ //1st iteration master and expansion with cond = false, 2nd iteration remotes with cond = true
			for (var nr in mon.monitorUnit[0].fibInfo.FOmoduleConnected) {
				var i1 = nr & 0xff;
				if ((i1==0)==cond) continue;
				var monCrc = mon.monitorUnit[nr];
				if (!mon.monitorUnit[0].fibInfo.FOmoduleConnected[nr] || !remoteGlobalConfResponseValid[nr]) continue;
				if (nr>0 && !mon.remoteResponseValid[nr]) continue;
				cfgNums.push([]);
				crcs.push([]);
				for (k=0;k<numCfgs;k++){
					cfgNums[n][k]=1;
					crcs[n][k]=monCrc.crcConf[k];
				}
				if (firstRemote<0 && cond) firstRemote = n;
				n++;
			}
			cond = true;
		}
		if (cfgNums.length>1){
			for (k=0;k<numCfgs;k++){
				var n_ini = (k==1 || k==2)?0:(k==4?1:firstRemote); //first value to consider is freqs for all units, alarms for expansion and remotes, first remote for gain and squelch
				if (n_ini>=0){
					var uniqueCrc = [crcs[n_ini][k]];
					for (n=n_ini+1;n<cfgNums.length;n++){
						if (k==4 && n==firstRemote) uniqueCrc = [crcs[n][k]]; //remote and expansion alarms are counted independently
						if ((k==1 || k==2) && n<firstRemote) continue; //freqs not analyzed on expansion
						for (j=0;j<uniqueCrc.length;j++){
							if (uniqueCrc[j]==crcs[n][k]){
								cfgNums[n][k] = j+1;
								break;
							}
						}
						if (j>=uniqueCrc.length){
							cfgNums[n][k] = uniqueCrc.length+1;
							uniqueCrc.push(crcs[n][k]);
						}
					}
				}
			}
		}
		return cfgNums;
	}
	this.copyConf = function(nCtl,nCfg){
		var rBs = document.getElementsByName(nCtl+"_rb");
		var fromIndex = -1;
		for (var k=0;k<rBs.length;k++) {
			if (rBs[k].checked) {
				fromIndex = rBs[k].value;
				break;
			}
		}
		if (fromIndex<0){
			alert('Select one device at "From" column');
			return;
		}
		var ctls = document.getElementsByName(nCtl+"_chk");
		toIndex = [];
		for (var k=0;k<ctls.length;k++) {
			if (rBs[k].checked) ctls[k].checked = false;
			if (ctls[k].checked) {
				toIndex.push(ctls[k].value);
			}
		}
		if (toIndex.length==0){
			setTimeout(function() {alert('Select at least one device at "Copy To" column');}, 100);	
			return;
		}
		var txt = self.cfgTitles[nCfg];
		if (nCfg==1 || nCfg==2) txt+=self.factory[0].bandNames[nCfg-1];
		var m = txt + " configuration from " + (fromIndex>>8 & 0xff)+"."+(fromIndex & 0xff)+" - "+tags[fromIndex].tag.trim();
		m+=" will be copied to:";
		for (var k=0;k<toIndex.length;k++){
			m+="\n"+(toIndex[k]>>8 & 0xff)+"."+(toIndex[k] & 0xff)+" - "+tags[toIndex[k]].tag.trim();
			if (nCfg==4 && ((toIndex[k] & 0xff)==0)^((fromIndex & 0xff)==0)){
				alert('It is not possible to copy configurations between expansion and remotes');
				return;
			}
		}
		m+="\nPlease Confirm";
		if (confirm(m)){
			partialConfParams = [fromIndex,nCfg];
			reqPartialConf = true;
		}
	}
	this.createUnit = function(nr) {
		var n1=unitToMon[nr]&0xff;var n2=(unitToMon[nr]>>8)&0xff;
		var isExp = n1==0 && n2>0;
		var auxtitle = unitToMon[nr]==0?"MASTER":(n1==0?"EXPANSION "+n2+".0":("REMOTE "+n2+"."+n1));
		var unitDiv = document.createElement("div");
		if (window.top.monitorMode == 2) unitDiv.style.display = "none";
		unitDiv.id = "unitDiv_"+nr;
		unitDiv.className = "unitbox";
		var id = "unitContentDiv_";
		var headDiv = this.createUnitHead("TAG","tagName_"+nr,auxtitle,"tagsubt_"+nr,nr,true,id);
		unitDiv.appendChild(headDiv);
		var unitContent = document.createElement("div");
		unitContent.id = id+nr;
		unitDiv.appendChild(unitContent);
		//ALARM INTERFACE
		id = "contentDivAlarm_";
		var headDiv = this.createUnitHead("ALARM INTERFACE","",auxtitle,"aisubt_"+nr,nr,true,id);
		headDiv.id = "headDivAlarm_"+nr;
		unitContent.appendChild(headDiv);		
		var contentDiv = document.createElement("div");
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = id+nr;
		contentDiv.min = false;
		var tab = this.createAlarmInterface(nr);
		contentDiv.appendChild(tab);
		headDiv.style.display = "block";
		contentDiv.style.display = "block";
		//FIBER INTERFACE
		id = "contentDivFO_";
		var headDiv = this.createUnitHead("FIBER OPTIC INTERFACE","",auxtitle,"fosubt_"+nr,nr,true,id);
		headDiv.id = "headDivFO_"+nr;
		unitContent.appendChild(headDiv);		
		var contentDiv = document.createElement("div");
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.min = false;
		contentDiv.id = id+nr;
		var tab = this.createFOInterface(nr);
		contentDiv.appendChild(tab);
		//BAND CTRL
		for (var band = 0;band<2;band++){
			id = "contentDiv_"+band+"_";
			var show = self.factory[nr].chBandEnabled[band] || self.factory[nr].adjBandEnabled[band];
			if (isExp) show = false;
			if (!show) localStorage.setItem(self.sernr.sernr +"_min_"+ id+unitToMon[nr],1); //forces frame to minimized state if entire band is not enabled
			var headDiv = this.createUnitHead(self.factory[nr].bandNames[band],"",auxtitle,"bandsubt_"+band+"_"+nr,nr,true,id);
			headDiv.id = "headDiv_"+band+"_"+nr;
			unitContent.appendChild(headDiv);		
			var contentDiv = document.createElement("div");
			unitContent.appendChild(contentDiv);
			contentDiv.className = "contentbox";
			contentDiv.id = id+nr;
			contentDiv.min = false;
			var tab = this.createContentCtrl(nr,band);
			contentDiv.appendChild(tab);
			headDiv.style.display = show? "block" :"none";
			contentDiv.style.display = show? "block" :"none";
		}
		//ALARM CONFIG: POWER MESUREMENTS
		id = "contentDivPow_";
		var show = !isExp;
		if (!show) localStorage.setItem(self.sernr.sernr +"_min_"+ id+unitToMon[nr],1); //forces frame to minimized state
		var headDiv = this.createUnitHead("POWER&nbsp;MEASUREMENTS","",auxtitle,"powsubt_"+nr,nr,true,id);
		headDiv.id = "headDivPow_"+nr;
		unitContent.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = id+nr;
		contentDiv.min = false;
		var tab = self.nfpa[nr].createRowPowerBand(nr);
		contentDiv.appendChild(tab);
		headDiv.style.display = show? "block" :"none";
		contentDiv.style.display = show? "block" :"none";
		//ALARM CONFIG: BBU PARAMETERS
		id = "contentDivBBU_";
		var headDiv = this.createUnitHead("BATTERY&nbsp;BACKUP&nbsp;PARAMETERS","",auxtitle,"bbusubt_"+nr,nr,true,id);
		headDiv.id = "headDivBBU_"+nr;
		unitContent.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = id+nr;
		var tab = self.nfpa[nr].createBatteryBackupParameters(nr);
		contentDiv.appendChild(tab);
		if (!self.nfpa[nr].bbuSerialMode || !self.config[nr].supportsBBU()) {
			localStorage.setItem(self.sernr.sernr +"_min_"+id+unitToMon[nr],1); //forces frame to minimized state if no bbu or dry contact
			self.minButtonStates["min_"+id+nr] = 1;
			headDiv.style.display = "none";
			contentDiv.style.display = "none";
		}
		//ALARM CONFIG: RELAYS
		id = "contentDivAlarmC_";
		var headDiv = this.createUnitHead("ALARM&nbsp;CONFIGURATION","tagcName_"+nr,auxtitle,"confAlarm_"+nr,nr,true,id);
		headDiv.id = "headDivAlarmC_"+nr;
		unitContent.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		contentDiv.id = id+nr;
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = self.nfpa[nr].createRelayConfig(nr);
		contentDiv.appendChild(tab);
		//ALARM CONFIG: ALARM THRESHOLDS
		id = "contentDivThreshold_";
		var headDiv = this.createUnitHead("ALARM&nbsp;THRESHOLDS","",auxtitle,"althres_"+nr,nr,true,id);
		headDiv.id = "headDivThreshold_"+nr;
		unitContent.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		contentDiv.id = id+nr;
		unitContent.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		var tab = self.nfpa[nr].createAlarmThresholds(nr);
		contentDiv.appendChild(tab);
		if (!isExp){
			//WARNING BOX
			id = "filtWarnDiv_";
			var headDiv = this.createUnitHead("FILTER&nbsp;SETTINGS&nbsp;WARNINGS","",auxtitle,"fwsubt_"+nr,nr,true,id);
			headDiv.id = "filtWarnHead_"+nr;
			unitContent.appendChild(headDiv);
			var contentDiv = document.createElement("div");
			unitContent.appendChild(contentDiv);
			contentDiv.className = "contentbox";
			contentDiv.id = id+nr;
			contentDiv.min = false;
			var tab = this.createWarningTab(nr);
			contentDiv.appendChild(tab);
			headDiv.style.display = "none";
			contentDiv.style.display = "none";
		}
		return unitDiv;
	}
	this.displayFOinterface = function(nr,doShow) {
		try {
			var el = document.getElementById("headDivFO_"+nr);
			el.style.display = ( doShow ? "block" : "none" );
			var el = document.getElementById("contentDivFO_"+nr);
			el.style.display = ( doShow ? "block" : "none" );
		} catch(e){}
	}
	this.showUnit = function(nr,show){
		try {
			var el = document.getElementById("unitDiv_"+nr);
			el.style.display = ( show ? "block" : "none" );
		} catch(e){}
	}
	this.blockContent = function(nr,doblock) {
		self.displayFOinterface(nr,!doblock);
		var n = unitToMon[nr];
		if (n==0 || ((n & 0xff)!=0)){//discard expansions
			for (var band = 0;band<2;band++){
				document.getElementById("headDiv_"+band+"_"+nr).style.display = doblock ? "none":"block";
				document.getElementById("contentDiv_"+band+"_"+nr).style.display = doblock ? "none":"block";
			}
			document.getElementById("headDivPow_"+nr).style.display = doblock ? "none":"block";
			document.getElementById("contentDivPow_"+nr).style.display = doblock ? "none":"block";
			document.getElementById("filtWarnHead_"+nr).style.display = doblock ? "none":"block";
			document.getElementById("filtWarnDiv_"+nr).style.display = doblock ? "none":"block";
		}
		document.getElementById("headDivAlarm_"+nr).style.display = doblock ? "none":"block";
		document.getElementById("contentDivAlarm_"+nr).style.display = doblock ? "none":"block";
		document.getElementById("headDivBBU_"+nr).style.display = doblock ? "none":"block";
		document.getElementById("contentDivBBU_"+nr).style.display = doblock ? "none":"block";
		document.getElementById("headDivAlarmC_"+nr).style.display = doblock ? "none":"block";
		document.getElementById("contentDivAlarmC_"+nr).style.display = doblock ? "none":"block";
		document.getElementById("headDivThreshold_"+nr).style.display = doblock ? "none":"block";
		document.getElementById("contentDivThreshold_"+nr).style.display = doblock ? "none":"block";

		if (!doblock) self.setMinButtonState();
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
		cell.style.paddingLeft = "10px";	
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
			cell.appendChild(this.createMinButton(elToMin,nr));
		}
		cell = document.createElement("td");
		cell.className = "tdBlank";
		row.appendChild(cell);
		return box;
	}
	this.setMinimizedState = function(id,min){
		var st = (min==1);
		var el = document.getElementById(id.substring(4));
		try{
			el.style.display = st?"none":"block";
			el.setAttribute("min",st);
			el = document.getElementById(id);
			el.src = (st?"maximize":"minimize") + ".png";
		}catch(err){}
	}
	this.createMinButton = function(elToMin,nr){
		var img = document.createElement("img");
		img.src = "minimize.png";
		img.id = "min_"+elToMin+nr;
		var minState = localStorage.getItem(self.sernr.sernr +"_"+ "min_"+elToMin+unitToMon[nr]);
		if (minState == null) minState = false;
		self.minButtonStates[img.id] = minState;
		img.name = img.id;
		img.idstorage = "min_"+elToMin+unitToMon[nr];
		img.onclick = function(ev) {
			var min = (this.src.search("minimize.png")>=0)?1:0;
			self.setMinimizedState(this.id,min);
			self.minButtonStates[img.id] = min;
			localStorage.setItem(self.sernr.sernr +"_"+ this.idstorage,min);
		}
		return img;
	}
	this.showTags = function() {
		try {
			for (var k=0;k<nrOfDevices;k++){
				var el = document.getElementById("tagName_"+k);
				if(typeof String.prototype.trim !== 'function'){
					String.prototype.trim = function() {
						return this.replace(/^\s+|\s+$/g, '');
					}
				}
				var name = entify(self.tags[unitToMon[k]].tag);
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
			var name = entify(self.tags[unitToMon[nr]].tag);
			el.innerHTML = name.trim();

		} catch (err) {}
	}
	this.showTagNotAvailable = function(nr,txt) {
		try {
			var el = document.getElementById("tagName_"+nr);
			var name = entify(self.tags[unitToMon[nr]].tag);
			el.innerHTML = name.trim()+" "+txt;
		} catch (err) {}
	}
	this.createAlarmInterface = function(nr){
		if (unitToMon[nr]==0) //Master
			return this.createAlarmInterfaceMaster();
		if ((unitToMon[nr] & 0xff)==0) //Expansions
			return this.createAlarmInterfaceExp(nr);
		//Remotes
		return this.createAlarmInterfaceRemote(nr);
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

		var cell = this.createMasterExpContent(0);
		rowb.appendChild(cell);
		cell.className = "contentcell";
		
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

		var cell = this.createAutoPaUlOffContent(nr);
		cell.className = "contentcell";
		rowb.appendChild(cell);
		
		var cell = this.createExtremeTempActionContent(nr);
		cell.className = "contentcell";
		cell.style.display = "none";
		rowb.appendChild(cell);

		var cell = this.createOPFContent(nr);
		cell.className = "contentcell";
		cell.style.display = "none";
		rowb.appendChild(cell);
		
		return tab;
	}
	this.createAlarmInterfaceExp = function(nr){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb);

		var cell = this.createAlarmTable(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = 2;

		var cell = this.createMasterExpContent(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";

		var cell = this.createRelayTable(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = 2;

		var rowb = document.createElement("tr");
		tab.appendChild(rowb);

		var cell = this.createBbuTypeOfConnectionContent(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";

		return tab;
	}
	this.createAlarmInterfaceRemote = function(nr){
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var rowb = document.createElement("tr");
		tab.appendChild(rowb); 
		var num_cells = 0;
		var showPla = self.factory[nr].plaAvailable && self.config[nr].supportsFlex2();
		
		if (self.factory[nr].oscFeatureEnable) num_cells++;
		if (showPla) num_cells++;
		if (self.factory[nr].extremeTempActionEnable) num_cells++;
		var rspan = num_cells>2?2:1;
		
		var cellOpf = this.createOPFContent(nr); cellOpf.className="contentcell";
		var cellTemp = this.createExtremeTempActionContent(nr); cellTemp.className="contentcell";
		var cellPla = this.createPlaContent(nr); cellPla.className="contentcell";
		var cellCnTimer = this.createCnAlarmTimeThresholdContent(nr); cellCnTimer.className="contentcell";
		var cellBbuTypeOfConnection = this.createBbuTypeOfConnectionContent(nr); cellBbuTypeOfConnection.className="contentcell";
		cellBbuTypeOfConnection.colSpan = 2;
		
		var cells = [[cellOpf,self.factory[nr].oscFeatureEnable], [cellPla, showPla], [cellTemp,self.factory[nr].extremeTempActionEnable]];
		
		for (var k=0;k<3;k++){
			if (!cells[k][1]) cells[k][0].style.display = "none";
		}
		for (var j=2;j>=1;j--){
			for (var k=0;k<j;k++){ //loop to show first factory-enabled content (OPF, PLA or EXT TEMP)
				if (!cells[k][1] && cells[k+1][1]){
					var aux = cells[k];
					cells[k] = cells[k+1];
					cells[k+1] = aux;
				}
			}
		}
		if (num_cells==1) cells[0][0].rowSpan = 2;
		
		var cell = this.createAlarmTable(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = rspan;

		var cell = this.createAlarmTableBand(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = rspan;
		
		rowb.appendChild(cells[0][0]);
		
		var cell = this.createRelayTable(nr);
		rowb.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = self.config[nr].supportsFlex2()?rspan:rspan+1; //relay table ocuppies cellCnTimer if remote<flex2.0
		
		var rowToInsertContent = (num_cells<=2)?1:2;
		for (var k=1;k<=2;k++){
			var rowb = document.createElement("tr");
			tab.appendChild(rowb);
			if (rowToInsertContent==k) rowb.appendChild(cellBbuTypeOfConnection);
			rowb.appendChild(cells[k][0]);
			if (rowToInsertContent==k){
				var hide = !self.config[nr].supportsFlex2();
				rowb.appendChild(cellCnTimer);
				if (hide) cellCnTimer.style.display = "none";
			}
		}

		return tab;
	}
	this.createAlarmTableBand = function(nr){
		var show = true;
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
			for (var k=0;k<self.config[nr].bandAlarmsInstalled.length;k++){
				show = show && !(unitToMon[nr]==0 && k==8 && self.version.compareSw(6,0)>=0 && !self.factory[0].masterOTA); //ul pa fail hidden in master SDRP rack mount
				tb.appendChild(this.createBandAlarm(band,k,nr,self.config[nr].alarmNames[1][k],show && self.config[nr].bandAlarmsInstalled[k]));
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
			self.config[nr].globalAlarmsInstalled[4] = false;
			self.config[nr].globalAlarmsInstalled[5] = false;
		}
		//remote fiber alarms 1,2 not avaiable in master
		if (unitToMon[nr]==0){
			self.config[nr].globalAlarmsInstalled[6] = false; //fiber optic 1 remote
			self.config[nr].globalAlarmsInstalled[7] = false; //fiber optic 2 remote
			var pathLossAvailable = self.version.compareSw(6,0)>=0 && self.pathLossExist(); //path loss available in master SDRP
			self.config[nr].globalAlarmsInstalled[4] = pathLossAvailable; //path loss 1
			self.config[nr].globalAlarmsInstalled[5] = pathLossAvailable; //path loss 2
		}
		for (var k=0;k<self.config[nr].globalAlarmsInstalled.length;k++){
			var show = self.config[nr].globalAlarmsInstalled[k];
			if (k>=16) show = false;
			if (k==12 && unitToMon[nr]>0 && !self.config[nr].globalAlarmsEnabled[k]) show=false;
			var alName = self.config[nr].alarmNames[0][k];
			if (k==12 && unitToMon[nr]>0 && getNrOfGralSystemAlarmsSupported(self.config[nr], nr)==1) {	// for legacy remote device
				alName = alName.substr(0, alName.length-2);										// delete '1' from end of general system alarm name
			}
			var isRemote = unitToMon[nr]!=0 && (unitToMon[nr]&0xff)!=0;
			if (k==11 && (!isRemote || self.config[nr].device_version_index>=2 )){ //Ext input 4 is not Force RF OFF in legacy remotes
				alName = "Force RF OFF";
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
		for (var k=0;k<self.config[nr].bbuAlarmsInstalled.length;k++){
			var show = self.config[nr].bbuAlarmsInstalled[k]&&bbuSerialMode;
			tb.appendChild(this.createBbuAlarm(nr,k,self.config[nr].alarmNamesBbu[k],show));
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
		var nrOfRelaysSupported = getNrOfRelaysSupported(self.config[nr], unitToMon[nr], self.version);
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
		if (unitToMon[nr]==0){
			row = document.createElement("tr");
			tb.appendChild(row);
			this.createForceSystemAlarm(row);
		}
		return cellb;
	}
	this.relayStateSet=function(nrelay,nr,openclose,onoff){
		var isNormalACPowerRelay = (unitToMon[nr]==0 || isBbuSerialMode(self.config[nr])) && self.config[nr].isRelayAssignNormalACpowerExclusive(nrelay);
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
		if(unitToMon[nr]>0) cellb.style.display = "none";
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
	this.createMasterExpContent = function(nr){
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
		var el = this.createMasterExpGralCtrl(nr);
		cell.appendChild(el);
		return cellb;
	}
	this.createMasterExpGralCtrl = function(nr) {
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
		if (unitToMon[nr]==0){//Only Master
			//FIRMWARE
			row = document.createElement("tr");
			tb.appendChild(row);
			this.createFirmwareSelect(row);
		}
		//TEMPERATURE
		row = createMetRow("boardTemp0_"+nr, board_temp_settings, "Temperature", "&ordm;C", 50);
		row.style.height = "22px";
		tb.appendChild(row);
		if (unitToMon[nr]==0){//Only Master
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
		}
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
	this.createCnAlarmTimeThresholdContent = function(nr){
		var cellb = document.createElement("td");
		var tab2 = document.createElement("table");
		tab2.style.borderCollapse = "separate";
		tab2.style.borderSpacing = "2px 2px";
		tab2.style.width = "100%";
		tab2.style.paddingLeft = "50px";
		tab2.style.paddingRight = "50px";
		cellb.appendChild(tab2);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		var cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createCnAlarmTimeBox(nr);
		cell.appendChild(el);	
		return cellb;
	}
	this.createCnAlarmTimeBox = function(nr) {
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
		cell.colSpan = 3;
		row.appendChild(cell);		
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = "C/N&nbsp;UL&nbsp;Low&nbsp;Alarm<br>Time&nbsp;Threshold";
		cell.className = "thdrht";
		row.appendChild(cell);		
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "cnUlLowAlarmTimeThreshold_"+nr;
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "45px";
		var max = self.config[nr].limitCnAlarmTime.MAX;
		var min = self.config[nr].limitCnAlarmTime.MIN;
		el.title = "OFF 0sec, Min. "+min+"sec, Max. "+max+"sec";
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var num = parseInt(this.value);
			if (isNaN(num)) num=0;
			var max = self.config[nr].limitCnAlarmTime.MAX;
			var min = self.config[nr].limitCnAlarmTime.MIN;
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
	this.setCnUlLowAlarmTime = function(nr,v) {
		try {
			var el = document.getElementById("cnUlLowAlarmTimeThreshold_"+nr);
			el.value = v;
		} catch(err) {}
	}
	this.getCnUlLowAlarmTime = function(nr) {
		try {
			var el = document.getElementById("cnUlLowAlarmTimeThreshold_"+nr);
			return parseInt(el.value);
		} catch(err) {}
	}
	this.createPlaContent = function(nr){
		var cellb = document.createElement("td");
		var tab2 = document.createElement("table");
		tab2.style.borderCollapse = "collapse";
		tab2.style.width = "100%";
		cellb.appendChild(tab2);
		var row = document.createElement("tr");
		tab2.appendChild(row);		
		var cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createPlaBox(nr);
		cell.appendChild(el);	
		return cellb;
	}
	this.createPlaBox = function(nr) {
		var box = document.createElement("div");
		var tbl = this.createPlaEnableTime(nr);
		box.appendChild(tbl);
		var tbl = this.createPlaLevels(nr);
		box.appendChild(tbl);
		return box;
	}
	this.createPlaLevels = function(nr) {
		var tbl = document.createElement("table");
		tbl.id = "plaLevelTable_"+nr;
		tbl.style.width = "100%";
		tbl.style.borderCollapse = "separate";
		tbl.style.borderSpacing = "2px 2px";
		tbl.style.width = "100%";
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		for (var k=0;k<2;k++){
			var row = createMetRow("rfMeasPla_"+k+"_"+nr, chRfIn_settings[1], "Path Loss Analyzer Meas "+(k+1), "dBm", 40);
			tb.appendChild(row);
		}
		return tbl;
	}
	this.rfPlaPowSet = function(n, val, nr, color) {
		setMetValue("rfMeasPla_"+n+"_"+nr, val, color);
	}
	this.createPlaEnableTime = function(nr) {
		var tbl = document.createElement("table");
		tbl.style.width = "100%";
		tbl.style.borderCollapse = "separate";
		tbl.style.borderSpacing = "2px 2px";
		tbl.style.width = "100%";
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		cell.innerHTML = "PATH&nbsp;LOSS&nbsp;ANALYZER";
		cell.className = "cth";
		cell.colSpan = 6;
		row.appendChild(cell);
		row = document.createElement("tr");
		row.id = "plaRow_0_"+nr;
		tb.appendChild(row);
		cell = document.createElement("td"); 
		row.appendChild(cell);
		cell = document.createElement("td"); 
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = "days";
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = "hours";
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = "min";
		row.appendChild(cell);
		var row = document.createElement("tr");
		tb.appendChild(row);
		cell = document.createElement("th");
		cell.style.fontSize = "11px";
		cell.innerHTML = "Enable";
		row.appendChild(cell);
		row.appendChild(this.createPlaEnable(nr));
		for (var k=2;k>=0;k--) row.appendChild(this.createPlaTime(k,nr));
		var row = document.createElement("tr");
		tb.appendChild(row);
		row.id = "plaRow_1_"+nr;
		cell = document.createElement("th");
		cell.style.fontSize = "11px";
		cell.innerHTML = "Path Loss<br>Bandwidth";
		cell.rowSpan = 2;
		cell.colSpan = 2;
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = "Fstart";
		cell.style.textAlign = "right";
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.appendChild(self.createAdjPlaFr(0,nr));
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.style.textAlign = "left";
		cell.innerHTML = "MHz";
		row.appendChild(cell);
		var row = document.createElement("tr");
		row.id = "plaRow_2_"+nr;
		tb.appendChild(row);
		cell = document.createElement("th");
		cell.innerHTML = "Fstop";
		cell.style.textAlign = "right";
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.appendChild(self.createAdjPlaFr(1,nr));
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.style.textAlign = "left";
		cell.innerHTML = "MHz";
		row.appendChild(cell);
		var row = document.createElement("tr");
		tb.appendChild(row);
		row.id = "plaRow_3_"+nr;
		cell = document.createElement("th");
		cell.style.fontSize = "11px";
		cell.innerHTML = "Time since last<br>measurement";
		cell.colSpan = 2;
		row.appendChild(cell);
		row.appendChild(this.createPlaRemainingTime(nr));
		var row = document.createElement("tr");
		tb.appendChild(row);
		row.id = "plaRow_4_"+nr;
		cell = this.createForcePlaMeas(nr);
		cell.colSpan = 5;
		row.appendChild(cell);
		return tbl;
	}
	this.createAdjPlaFr = function(s,nr) {
		var fr = document.createElement("input");
		fr.type = "text";
		fr.id = "plaAdjF_"+s+"_"+nr;
		fr.name = fr.id;
		fr.style.width = "45px";
		fr.className = "number";
		fr.ss = s;
		fr.nr = nr;
		var titles = this.computeAdjFreqTitles(1, self.factory[nr].plaBand,nr);
		fr.title = titles[0];
		fr.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		fr.onchange = function(ev) {
			var s = this.ss;
			var nr = this.nr;
			var band = self.factory[nr].plaBand;
			var v = self.checkPlaFrSetting(s,band,this.value,nr);
			this.value = v;
			var f = self.getPlaFreq(nr);
			var g = self.adjustFreqLimitsSp(1, s, band, f, nr);
			var chnr = [];
			for (var s = 0; s < 2; ++s) {
				chnr.push(self.computeAdjChNr(g[s], 1, band, nr));
			}
			var fstart = self.computeAdjChFreq(chnr[0], 1, band, nr);
			var fstop = self.computeAdjChFreq(chnr[1], 1, band, nr);
			self.setPlaFreq(nr, fstart, fstop);
			self.config[nr].fstartHzPlaFilter = fstart;
			self.config[nr].fstopHzPlaFilter = fstop;
		}
		return fr;
	}
	this.createForcePlaMeas = function(nr) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		cell.style.textAlign = "center";
		el.value = "Measure Path Loss";
		el.nr = nr;
		el.onclick = function(ev) {
			var forcePa = [[false,false],[false,false]];
			cfgParams = new submitParams();
			cfgParams.ndev = this.nr;
			cfgParams.forcePlaMeas = true;
			submitform(cfgParams);
		}
		cell.appendChild(el);
		return cell;
	}
	this.createPlaRemainingTime = function(nr) {
		var cell = document.createElement("td");
		cell.style.paddingLeft = "2px";
		cell.style.paddingRight = "2px";
		cell.className = "tabval";
		cell.style.width = "85px";
		cell.style.textAlign = "center";
		cell.id = "timerPlaStat_"+nr;
		cell.innerHTML = "0d 00h 00m";
		cell.name = cell.id;
		cell.colSpan = 3;
		return cell;
	}
	this.plaTimeStatSet = function(nr, val){
		var times = [0,0,0];
		var res;
		times[2] = Math.floor(val/1440);
		res = ~~(val-1440*times[2]);
		times[1] = Math.floor(res/60);
		times[0] = res % 60;
		var str = "";
		str += times[2] + "d&nbsp;";
		str += ("0"+times[1]).substr(-2,2) + "h&nbsp;";
		str += ("0"+times[0]).substr(-2,2) + "m";
		document.getElementById("timerPlaStat_"+nr).innerHTML = str;
	}
	this.createPlaTime = function(dhm,nr) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "pla_time_"+dhm+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "32px";
		el.max = dhm==2?45:(dhm==1?23:59);
		el.min = 0;
		el.value = dhm==2?1:0;
		
		if (dhm==0)
			el.title = "Min: 0min, Max: 59min";
		else if (dhm==1)
			el.title = "Min: 0hours, Max: 23hours";
		else{
			var titl = "Min: 0days, Max: 45days";
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
	this.plaTimeSet = function(nr,val){
		var times = [0,0,0];
		var res;
		times[2] = Math.floor(val/1440);
		res = ~~(val-1440*times[2]);
		times[1] = Math.floor(res/60);
		times[0] = res % 60;
		for (var k=0;k<3;k++){
			var el = document.getElementById("pla_time_"+k+"_"+nr);
			el.value = times[k];
		}
	}
	this.plaTimeGet = function(nr){
		var	res = parseInt(document.getElementById("pla_time_0_"+nr).value);
		res +=  60*parseInt(document.getElementById("pla_time_1_"+nr).value);
		res +=  1440*parseInt(document.getElementById("pla_time_2_"+nr).value);
		if (res>0xffff){ //max value
			res = 0xffff; 
			this.plaTimeSet(nr,res);
		}
		return res;
	}
	this.createPlaEnable = function(nr) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "plaEn_"+nr;
		el.name = el.id;
		el.nr = nr;
		el.type = "checkbox";
		cell.appendChild(el);
		el.onclick = function(ev) {
			self.showPla(this.nr, this.checked);
		}
		return cell;
	}
	this.showPla = function(nr,show) {
		document.getElementById("plaLevelTable_"+nr).style.display = show?"table":"none";
		for (var k=0;k<5;k++) document.getElementById("plaRow_"+k+"_"+nr).style.display = show?"table-row":"none";
		for (var k=0;k<3;k++) document.getElementById("pla_time_"+k+"_"+nr).style.display = show?"block":"none";
		for (var k=4;k<6;k++) document.getElementById("generalAlarmRow_"+k+"_"+nr).style.display = show?"table-row":"none";
		document.getElementById("alarmRow_"+nr+"_0_5").style.display = show?"table-row":"none";
		for (var k=5;k<7;k++) document.getElementById("althresrow_"+k+"_"+nr).style.display = show?"table-row":"none";
	}
	this.plaEnSet = function(nr,on) {
		try {
			var el = document.getElementById("plaEn_"+nr);
			el.checked = on ? true : false;
		} catch(err) {}
	}
	this.plaEnGet = function(nr) {
		try {
			var el = document.getElementById("plaEn_"+nr);
			return el.checked ? true : false;
		} catch(err) {return false;}
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
		cell.innerHTML = Texts[unitToMon[nr]==0?'FILTDL':'FILTUL'] + (nbadj==0?"&nbsp;(NARROW&nbsp;BAND&nbsp;FILTERS)":"&nbsp;(ADJ.BW&nbsp;FILTERS)");
		cell.className = "cth";
		row = document.createElement("tr");
		mainTbl.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.appendChild(this.createFilterTable(unitToMon[nr]==0?1:0,band,nbadj,nr));
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
		if (unitToMon[nr]>0){
			this.createFreqSplit(row,nr,band,false);
		}
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "35px";
		if (unitToMon[nr]>0) cell.appendChild(this.createUnitReset(nr, band));
		cell.style.paddingRight = "20px";
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.paddingLeft = "15px";
		if (unitToMon[nr]>0) cell.appendChild(this.createTempBoard(nr,band));		
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		cell.style.paddingLeft = "20px";
		cell.style.width = "40%";

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
			var b = unitToMon[nr]==0? 1:0; //solo UL o DL
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
		var br = unitToMon[nr]==0?1:0;
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
			if (unitToMon[nr]>0 && b==0 && nbadj==0) td.style.display = "none";
			td.colSpan = 2;
			if (nbadj==1 && unitToMon[nr]>0){
				td = document.createElement("td");
				chFiltRow.appendChild(td);
				td.innerHTML = "C/N th(dBm)";
				if (!self.config[nr].supportsFlex2()) td.style.display = "none";
			}
			if (k==0){
				td = document.createElement("td");
				chFiltRow.appendChild(td);
				td.style.width = "60px";
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
		if ( unitToMon[nr]>0 && nbadj==1 && b==0){
			var cell = this.createCNThresholdULadj(band, c, nr);
			if (!self.config[nr].supportsFlex2()) cell.style.display = "none";
			chFiltRow.appendChild(cell);
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
			return parseInt(el.value);
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
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.colSpan = 4;
		cell.innerHTML = "ALARMS CONSIDERED IN AUTOMATIC MASTER MODE";
		cell.className = "cth";
		var alNames = ["HW Fail","High Temp","UL PA Fail","UL PA Fail","Ant. Disconn.","Ant. Disconn.",
		"Overload DL","Overload DL","Rx Power Low","Rx Power Low"];
		for (var k=0;k<5;k++){
			var row = document.createElement("tr");
			tab.appendChild(row);
			row.id = "alarmModeRow_"+k;
			for (var j=0;j<2;j++){
				var cell = document.createElement("th");
				cell.className = "thdrht";
				row.appendChild(cell);
				var str = alNames[2*k+j];
				var bandAlarm = k>0;
				var show = true;
				if (bandAlarm){
					str+=" "+self.factory[0].bandNames[j];
					show = self.factory[0].chBandEnabled[j] || self.factory[0].adjBandEnabled[j];
				}
				cell.style.display = show?"table-cell":"none";
				cell.innerHTML = str;
				var cell = document.createElement("th");
				row.appendChild(cell);
				cell.appendChild(this.createMasterModeAlarmEnable(2*k+j));
				cell.style.display = show?"table-cell":"none";
				
			}
		}
		var row = false;
		var rowNr = 0;
		var extAlarmNr = 0;
		for (var k=0; k<6; k++){    //k=3,4,5 are general system alarms
            var KK=k;
            if (k>=3) KK++;         //KK=0,1,2, 4,5,6 skip "Force RF off" alarm, corresponding to KK=3
			if (!self.config[0].globalAlarmsEnabled[8+KK]){
				continue;
			}
			if (!row) {
				var row = document.createElement("tr");
				tab.appendChild(row);
				row.id = "alarmModeRow_"+(5+rowNr);
				rowNr++;
			}
			var cell = document.createElement("th");
			cell.className = "thdrht";
			row.appendChild(cell);
			cell.innerHTML = self.config[0].alarmNames[0][8+KK];
			cell.style.fontSize = "10px";
			var cell = document.createElement("th");
			row.appendChild(cell);
			cell.appendChild(this.createMasterModeAlarmEnable(10+k));
			extAlarmNr++;
			if (extAlarmNr%2==0){
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
	this.createFreqSplit = function(mRow, nr, band, show) {
		if (unitToMon[nr]>0){
			var mCell = document.createElement("td");
			var box = document.createElement("div");
			if (!show) mCell.style.display = "none";
			mCell.appendChild(box);
			var row = document.createElement("tr");
			box.appendChild(row);
		}
		var r = unitToMon[nr]>0?row:mRow;
		var cell = document.createElement("th");
		if (unitToMon[nr]==0 && !show) cell.style.display = "none";
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
			if (unitToMon[nr]==0){
				self.config[0].uldlLinkedFreq[band] = fixed;
				self.config[0].saveFrameStr(self.config[0].getFrm(self.factory[0])); //para que el tool tenga este valor actualizado
				//window.parent.navi.filtRowDisplay(tool_enable(self.factory,self.config));
				blockRemotes();
			}
		}	
		cell.style.verticalAlign = "middle";
		cell.appendChild(el);
		if (unitToMon[nr]>0) mRow.appendChild(mCell);
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
	this.createUnitReset = function(nr, band) {
		var box = document.createElement("div");
		var reset = document.createElement("input");
		reset.id = "reset"+band;
		reset.name = reset.id;
		reset.type = "button";
		reset.value = "RESET";
		reset.className = "resetbutton";
		reset.nr = nr;
		reset.onclick = function() {
			cfgParams = new submitParams();
			cfgParams.ndev = this.nr;
			cfgParams.isReset = true;
			submitform(cfgParams);
		} 
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
		cell.innerHTML = txt;
		cell.className = "thdrht";
		cell.style.fontSize = "10px";
		cell = createLedBox("gralAlarm_"+num+"_"+nr);
		cell.style.paddingLeft = "10px";
		cell.style.paddingRight = "10px";
		row.appendChild(cell);
		var nosh = (!show)||(num==6)||(num==7);
		if ((unitToMon[nr]>0) && ((num==4)||(num==5))) nosh = true; //remote sin ulpafail ni ant.disconnect
		row.style.display = (nosh)?"none":"table-row";
		return row;
	}
	this.gralAlarmSet = function(num, nr, alarm, alarmremote) {
		ledSetColor("gralAlarm_"+num+"_"+nr, alarm ? "red" : (alarmremote?"yellow":"grey"));
	}
	this.opticalAlarmDisplay = function(opticalLinkNr, nr, show) {
		try {
			var alarmNr;
			if ((unitToMon[nr] & 0xff)>0){
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
			document.getElementById("generalAlarmRow_"+alarmNr+"_"+nr).style.display = show ? "table-row":"none";
			document.getElementById("alarm_0_0_"+alarmNr).style.display = show ? "block":"none";

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
			if (unitToMon[nr]==0 && num>0) {
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
		if (unitToMon[nr]==0) bbuAlarmShowTable = true; //always shown BBU alarm in master
		var nrOfRelaysSupported = getNrOfRelaysSupported(this.config[nr], unitToMon[nr], self.version);
		var el = document.getElementById("BBUalarmsHeaderRow"+"_"+nr);
		try {
			el.style.display = (bbuAlarmShowTable? "table-row":"none");
		} catch(e){}
		for (var k=0;k<self.config[nr].bbuAlarmsInstalled.length;k++){
			var alarmInstalled = self.config[nr].bbuAlarmsInstalled[k];
			if (unitToMon[nr]==0 && window.top.monitorMode ==0) {
				/*for (var i=0;i<nrOfDevices;i++){
					alarmInstalled = alarmInstalled || self.config[i].bbuAlarmsInstalled[k];
				}*/
			}
			var show = alarmInstalled&&bbuAlarmShowTable;
			if (unitToMon[nr]>0 && self.config[nr].bbu_type==2 && k==10) show=false;   // battery bank alarm not available in H.P. bbu, but shown in master
			var el = document.getElementById("BbuAlarmRow_"+k+"_"+nr);
			try {
				el.style.display = (show? "table-row":"none");
			} catch(e){}
		}
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
		if ((unitToMon[nr]>0 && dn==1) || (unitToMon[nr]==0 && dn==0)) cell.style.display = "none";
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
			if (unitToMon[nr]>0){
				row = this.createCNThresholdULnb(band,nr);
				body.appendChild(row);
				if (!self.config[nr].supportsFlex2()) row.style.display = "none";
			}			
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

		body.appendChild(row);
		row = this.createMainPowerLim(dn,band,nr);
		if (unitToMon[nr]==0 && dn==0) row.style.display = "none";
		if (unitToMon[nr]>0 && dn==1){
			row.style.display = "none";
			row = this.createMaxPower(band,nr);
			body.appendChild(row);
		}
		body.appendChild(row);
		hpa_settings[dn].max = this.factory[nr].powerlimit[2*band+dn] + this.factory[nr].MAX_PWR_DELTA;
		hpa_settings[dn].min = hpa_settings[dn].max - 45;
		hpa_settings[dn].high_warn = this.factory[nr].powerlimit[2*band+dn];
		hpa_settings[dn].high_alarm = this.factory[nr].powerlimit[2*band+dn] + this.factory[nr].MAX_PWR_DELTA;
		row = createMetRow("rfOutPow_"+band+"_"+dn+"_"+nr, hpa_settings[dn], "Output Power", "dBm", 40);
		if ((unitToMon[nr]==0 && dn==1) || (unitToMon[nr]>0 && dn==0)) row.style.display = "none"; //Only visible for master UL, remote DL
		body.appendChild(row);
		if (unitToMon[nr]>0 && dn==0){ //Only for remote UL
			row = this.createAgcBandMode(band,nr);
			if (!self.config[nr].supportsFlex2()) row.style.display = "none";
			body.appendChild(row);
		}
		if (!(unitToMon[nr]==0 && dn==1)){  //Visible except for master DL
			var bbAgcSettings = {min: 0, low_alarm: -128, low_warn: -128, high_warn: 127, high_alarm: 127, max: 32};
			row = createMetRow("bbAgcOut_"+band+"_"+dn+"_"+nr, bbAgcSettings, "Output&nbsp;Broadband&nbsp;AGC", "dB" ,40);
			body.appendChild(row);
			if (!self.config[nr].supportsFlex2()) row.style.display = "none";
		}
		return box;
	}
	this.createAgcBandMode = function(band,nr) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "AGC&nbsp;Mode";
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.className = "mlong";
		cell.style.textAlign = "left";
		cell.colSpan = 2;
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "agcBandMode_"+band+"_"+nr;
		el.name = el.id;
		el.band = band;
		var opts = [ "Stable Coverage", "Max. Power", "Hybrid" ];
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
		var sp = document.createElement("span");
		var str = "AGC Mode:<br><br>";
		str += "Stable Coverage: Maximum UL power per channel will be fixed equally by the amount of configured filters. Channel Output power will not vary based on the UL traffic providing the most possible stable coverage<br><br>";
		str += "Max. Power: Maximum UL power per channel will be dependent on the amount of channels that are being transmitted. UL Channel Output power will be dynamic and will vary depending on the UL traffic. The Power per channel will trend to be larger when low traffic is present<br><br>";
		str += "Hybrid: It is an intermediate option. With few configured filters works like stable coverage mode, but power reduction per channel is limited to "+self.factory[nr].agcDeltaHybridMode.toFixed(1)+" dB respect the power limit.";
		sp.innerHTML = str;
		cell.appendChild(sp);
		return row;
	}
	this.agcBandModeSet = function(band, nr, val) {
		try {
			var el = document.getElementById("agcBandMode_"+band+"_"+nr);
			el.selectedIndex = val;
		} catch (err) {el.selectedIndex = 0;}
	}
	this.agcBandModeGet = function(band, nr) {
		try {
			var el = document.getElementById("agcBandMode_"+band+"_"+nr);
			return el.selectedIndex;
		} catch (err) {
			return 0;
		}
	}
	this.bbAgcSet = function(dn, band, nr, val) {
		setMetValue("bbAgc_"+band+"_"+dn+"_"+nr, val, "undefined", 1);
	}
	this.bbOutAgcSet = function(dn,band, nr, val) {
		setMetValue("bbAgcOut_"+band+"_"+dn+"_"+nr, val, "undefined", 1);
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
		return self.config[nr].sqThrLimits(b, self.factory[nr].ULlowGainMode).MIN;
	}
	this.getSquelchThresholdMax = function(b, band, nr) {
		return self.config[nr].sqThrLimits(b, self.factory[nr].ULlowGainMode).MAX;
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
		var min = self.config[nr].sqThrLimits(dn, self.factory[nr].ULlowGainMode).MIN;
		var max = self.config[nr].sqThrLimits(dn, self.factory[nr].ULlowGainMode).MAX;
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
	this.createCNThresholdULnb = function(band,nr) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Filters&nbsp;C/N&nbsp;Threshold";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "cnThrUlNb_"+band+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.title = "Min: "+self.config[0].CNLimitdBm.MIN+", Max: "+self.config[0].CNLimitdBm.MAX+" dBm";
		el.onchange = function(ev) {
			var cn = parseInt(this.value);
			if (cn < self.config[0].CNLimitdBm.MIN) {
				cn = self.config[0].CNLimitdBm.MIN;
				this.value = cn;
			} else if (cn > self.config[0].CNLimitdBm.MAX) {
				cn = self.config[0].CNLimitdBm.MAX;
				this.value = cn;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dBm";
		cell.style.textAlign = "left";
		return row;
	}
	this.createCNThresholdULadj = function(band, ch, nr) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "cnThrUlAdj_"+band+"_"+ch+"_"+nr;
		el.name = el.id;
		el.type = "text";
		el.style.width = "28px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.title = "Min: "+self.config[0].CNLimitdBm.MIN+", Max: "+self.config[0].CNLimitdBm.MAX+" dBm";
		el.onchange = function(ev) {
			var cn = parseInt(this.value);
			if (cn < self.config[0].CNLimitdBm.MIN) {
				cn = self.config[0].CNLimitdBm.MIN;
				this.value = cn;
			} else if (cn > self.config[0].CNLimitdBm.MAX) {
				cn = self.config[0].CNLimitdBm.MAX;
				this.value = cn;
			}
		}
		cell.appendChild(el);
		return cell;
	}
	this.setCNThresholdUlNb = function(band, nr, v) {
		try {
			document.getElementById("cnThrUlNb_"+band+"_"+nr).value = v;
		} catch(e){}
	}
	this.setCNThresholdUlAdj = function(band, ch, nr, v) {
		try {
			document.getElementById("cnThrUlAdj_"+band+"_"+ch+"_"+nr).value = v;
		} catch(e){}
	}
	this.getCNThresholdUlNb = function(band, nr) {
		var v = 0;
		try {
			v = parseInt(document.getElementById("cnThrUlNb_"+band+"_"+nr).value);
		} catch(e){}
		return v;
	}
	this.getCNThresholdUlAdj = function(band, ch, nr) {
		var v = 0;
		try {
			v = parseInt(document.getElementById("cnThrUlAdj_"+band+"_"+ch+"_"+nr).value);
		} catch(e){return self.config[nr].cn_threshold_adj[band][ch];}
		return v;
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
		var min = self.config[nr].sqThrLimits(dn, self.factory[nr].ULlowGainMode).MIN;
		var max = self.config[nr].sqThrLimits(dn, self.factory[nr].ULlowGainMode).MAX;
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
		var br = unitToMon[nr]==0?1:0;
		if (unitToMon[nr]==0) {
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
			var amin = self.factory[nr].gainlimit[2*band+dn]-self.mainGainMax[nr][band][dn];
			var amax = -self.config[nr].GmainRange[dn];
			if (num < amin) {
				num = amin;
			} else if (num > amax) {
				num = amax;
			}
			target.value = num;
			if (unitToMon[nr]==0 ^ dn==0){
				var max = self.factory[nr].powerlimit[2*band+dn]- (self.factory[nr].gainlimit[2*band+dn] - num);
				var min = self.factory[nr].powerlimit[2*band+dn] - self.factory[nr].gainlimit[2*band+dn] - self.config[nr].limitPowerRange[dn]; //Absolute min does not depend on conf.att
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
	this.sysAttSet = function(b, band, nr, val) {
		try {
			var el = document.getElementById("sysAtt_"+band+"_"+b+"_"+nr);
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.sysAttGet = function(b, band, nr) {
		try {
			var el = document.getElementById("sysAtt_"+band+"_"+b+"_"+nr);
			return parseInt(el.value);
		} catch (err) { return 0; }
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
			cell.innerHTML = (unitToMon[nr]==0 && dn==0)?"UL Power Limit":"Input AGC per channel<br>Composite Power Set";
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
		el.onchange = function(ev) {
			var target = this;
			var band = target.band;
			var dn = target.dn;
			var nr = target.nr;
			if (unitToMon[nr]==0 ^ dn==0){
				var att = self.mainGainLimGet(dn,band,nr);
				var num = self.mainPowerLimGet(dn,band,nr);
				var max,min;
				max = self.factory[nr].powerlimit[2*band+dn] - (self.factory[nr].gainlimit[2*band+dn] - att);
				min = self.factory[nr].powerlimit[2*band+dn] - self.factory[nr].gainlimit[2*band+dn] - self.config[nr].limitPowerRange[dn]; //Absolute min does not depend on conf.att
				if (num < min) {
					target.value = min;
				} else if (num > max) {
					target.value = max;
				} else {
					target.value = num;
				}
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
			cfgParams = new submitParams();
			cfgParams.ndev = this.nr;	
			var nr = this.nr;	
			var band = this.band;
			var b = this.dn;			
			if (window.event.ctrlKey) {
				for (var b = 0; b < 2; b++) {
					for (var r = 0; r < 2; r++) {
						self.hpaSwSet(r, b, nr, on);
						if (on){
							cfgParams.forcePaOn[b][r] = true;
						}else{
							cfgParams.forcePaOff[b][r] = true;
						}
					}
				}
				submitform(cfgParams);
			} else {

				self.hpaSwToggle(this.dn,this.band,this.nr);
				if (on){
					cfgParams.forcePaOn[band][b] = true;
				}else{
					cfgParams.forcePaOff[band][b] = true;
				}					
				submitform(cfgParams);
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
		var settings = chRfIn_settings[b];
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
		for (var nr=0;nr<nrOfDevices;nr++){
			for (var band=0;band<2;band++){
				self.setFreqSplit(band,nr,self.config[nr].uldlLinkedFreq[band]);
				for (var c = 0; c < self.maxChannels[nr]; ++c) {
					for (var b = 0; b < 2; ++b) self.setFreqCh(b, c, band, nr, self.config[nr].freqHz[band][b][c]);
				}			
			}
		}
	}
	this.equalFRefs = function(){
		var nrs = [];
		for (var band=0;band<2;band++){
			var masterFRef_4MHz = Math.floor(self.factory[0].fref[2*band]/4e6);
			for (var nr in self.fibInfo.FOmoduleConnected){
				if ((nr & 0xff)==0) continue;//discard master and expansion
				if (!self.fibInfo.FOmoduleConnected[nr] || !remoteGlobalConfResponseValid[nr]) continue;
				if (self.basicCfg[nr].fref_4MHz[band]!=masterFRef_4MHz) nrs.push(nr);
			}
		}
		return nrs;
	}
	this.equalConfFreqs = function(cfg1,cfg2,band){
		if (cfg1.allChSameBW[band][1]!=cfg2.allChSameBW[band][1]) return -1;
		if (band==0 && cfg1.firstADJisFirstNet!=cfg2.firstADJisFirstNet) return -2;
		if (cfg1.numberOfFilterNonGrouped[band][1]!=cfg2.numberOfFilterNonGrouped[band][1]) return -3;
		for (var c = 0; c < self.maxChannels[0]; ++c) {
			if (cfg1.filterEnabled[0][band][1][c]!=cfg2.filterEnabled[0][band][1][c]) return -4;
			if (cfg1.bwKHz[band][1][c]!=cfg2.bwKHz[band][1][c]) return -5;
			if (cfg1.freqHz[band][1][c]!=cfg2.freqHz[band][1][c]) return -6;
			if (cfg1.isFilterGrouped[band][1][c]!=cfg2.isFilterGrouped[band][1][c]) return -7;
			if (cfg1.fineGainFilter[0][band][1][c]!=cfg2.fineGainFilter[0][band][1][c]) return -8;
		}
		for (var c = 0; c < self.maxChannelsADJ; ++c) {
			if (cfg1.filterEnabled[1][band][1][c]!=cfg2.filterEnabled[1][band][1][c]) return -9;
			if (cfg1.fstartHzAdjFilter[band][1][c]!=cfg2.fstartHzAdjFilter[band][1][c]) return -10;
			if (cfg1.fstopHzAdjFilter[band][1][c]!=cfg2.fstopHzAdjFilter[band][1][c]) return -11;
			if (cfg1.fineGainFilter[1][band][1][c]!=cfg2.fineGainFilter[1][band][1][c]) return -12;
		}
		return 0;
	}
	this.equalFreqs = function(mon,band){
		var crcMaster = mon.monitorUnit[0].crcConf[band+1];
		for (var nr in mon.monitorUnit[0].fibInfo.FOmoduleConnected){
			if ((nr & 0xff)==0) continue;//discard master and expansion
			if (!mon.monitorUnit[0].fibInfo.FOmoduleConnected[nr] || !remoteGlobalConfResponseValid[nr]) continue;
			if (!mon.remoteResponseValid[nr]) continue;
			if (crcMaster!= mon.monitorUnit[nr].crcConf[band+1]) return false;
		}
		return true;
	}
	this.getFreqs = function(cnf, ncfg, nr, band) {
		if (unitToMon[nr]==0) cnf.uldlLinkedFreq[band] = self.isFreqSplitFixed(band,nr);	
		var b = unitToMon[nr]==0?1:0; // solo UL o DL
		var br = (unitToMon[nr]==0 || self.isFreqSplitFixed(band,0))?1:0;
		for (var c = 0; c < self.maxChannels[ncfg]; ++c) {
			var fr = self.getFreqCh(br, c, band, ncfg);
			if (fr < self.factory[ncfg].fstart[2*band+br]) fr = self.factory[ncfg].fstart[2*band+br];
			if (fr > self.factory[ncfg].fstop[2*band+br]) fr = self.factory[ncfg].fstop[2*band+br];
			var stp = self.factory[ncfg].fstep;
			if (stp<=1.5e3) stp/=2;
			fr = ~~Math.round(fr/stp);
			fr *= stp;
			if (self.isFreqSplitFixed(band,0) && unitToMon[nr]>0) {
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
			cnf.allSameSquelch[band] = self.eqSqIsSet(band,nr);
			var b = unitToMon[nr]==0?1:0;//solo UL o DL
			for (var nbadj = 0;nbadj<2;nbadj++){
				var cmax = nbadj==0?self.config[nr].CHNR:self.config[nr].ADJNR;
				if (nbadj==0 && b==0) cmax=1;
				for (var c=0;c<self.maxChannels[nr];c++){
					cnf.sqChEnabled[nbadj][band][b][c] = self.squelchChEnIsSet(b,c,band,nbadj,nr);
					var sqth = self.squelchChThrGet(b,c,band,nbadj,nr);
					var sqthMin = self.config[nr].sqThrLimits(b, self.factory[nr].ULlowGainMode).MIN;
					var sqthMax = self.config[nr].sqThrLimits(b, self.factory[nr].ULlowGainMode).MAX;
					if (sqth < sqthMin) sqth = sqthMin;
					if (sqth > sqthMax) sqth = sqthMax;
					cnf.sqChThreshold[nbadj][band][b][c] = sqth;
					if (nbadj==1 && unitToMon[nr]>0){
						var cn = self.getCNThresholdUlAdj(band,c,nr);
						if (cn < self.config[nr].CNLimitdBm.MIN) {
							cn =  self.config[nr].CNLimitdBm.MIN;
						} else if (cn >  self.config[nr].CNLimitdBm.MAX) {
							cn =  self.config[nr].CNLimitdBm.MAX;
						}
						cnf.cn_threshold_adj[band][c] = cn;
					}
				}
			}
		}
		return cnf;
	}
	this.getGralConf = function(cnf,nr){
		if (unitToMon[nr]==0){
			cnf.masterMode = self.masterModeGet();
			for (var k=0;k<self.config[0].masterModeAlarmEnables.length;k++){
				cnf.masterModeAlarmEnables[k] = self.masterModeAlarmEnableGet(k);
			}
		}else{
			cnf.cnAlarmTime = self.getCnUlLowAlarmTime(nr);
			cnf.plaMeasPeriod = self.plaTimeGet(nr);
			cnf.plaEn = self.plaEnGet(nr);
			var f = this.getPlaFreq(nr);
			cnf.fstartHzPlaFilter = f[0];
			cnf.fstopHzPlaFilter = f[1];
		}
		for (var band = 0; band < 2; ++band) {
			if (unitToMon[nr]!=0){
				cnf.agcBandMode[band] = self.agcBandModeGet(band, nr);
				cnf.cn_threshold_nb[band] = self.getCNThresholdUlNb(band,nr);
			}
			for (var b = 0; b < 2; ++b) {
				var att = self.mainGainLimGet(b, band, nr); 
				var aMax = -self.config[nr].GmainRange[b]; 
				var aMin = 0;
				if (att > aMax) att = aMax;
				if (att < aMin) att = aMin;
				cnf.att[band][b] = att;
				var inAgc = self.mainPowerLimGet(b,band,nr);
				if (unitToMon[nr]==0 ^ b==0){
					var iAgcMin = self.factory[nr].powerlimit[2*band+b] - self.factory[nr].gainlimit[2*band+b] - self.config[nr].limitPowerRange[b];
					var iAgcMax = self.factory[nr].powerlimit[2*band+b] - (self.factory[nr].gainlimit[2*band+b] - att);
					if (inAgc < iAgcMin) inAgc = iAgcMin;
					if (inAgc > iAgcMax) inAgc = iAgcMax;
					cnf.inputAgc[band][b] = inAgc; 
				}
			}
		}
		return cnf;
	}
	this.getDelays = function(cnf, nr){
		if (unitToMon[nr]==0) return;
		cnf.FOgroupDelayEnable = self.getDelayAdjustEnableChecked(nr);
		for (var port = 0; port < 2; port++) {
			for (var k = 0; k < 2; k++) {
				cnf.FOgroupDelay[port][k] = self.getDelayAdjust(port, k, nr);
			}
		}
	}
	this.getAlarmConf = function(cnf, nr){
		var isExp = ((unitToMon[nr]&0xff)==0) && !(unitToMon[nr]==0);
		if (!isExp){
			cnf.extremeTempAction = self.readExtremeTemperatureAction(nr);
			cnf.oscTimeThSeconds[0] = self.getAbnSqTime(nr);
			cnf.oscRetryTimeHours[0] = self.getRetryTime(nr);
			cnf.oscActionAfterAlarm[0] = self.opfModeGet(nr);
			cnf.autoUlPaOffTimer = self.getAutoPaUlOffTime(0);
		}
		for (var k=0;k<cnf.NR_OF_RELAYS_MAX;k++){
			cnf.delayTimerON[k] = this.delayLatchOnOffGet(0,k,nr);
			cnf.latchTimerON[k] = this.delayLatchOnOffGet(1,k,nr);
			cnf.delayTimer[k] = this.delayLatchTimeGet(0,k,nr);
			cnf.latchTimer[k] = this.delayLatchTimeGet(1,k,nr);
		}
		if (cnf.supportsBBU()) {
			cnf.bbu_serial_mode = self.readBbuTypeOfConnection(nr);
		}
		return cnf;
	}
	this.checkULAttReduction = function(cnf){
		for (var band=0;band<2;band++){
			if (self.factory[0].chBandEnabled || self.factory[0].adjBandEnabled){
				var diffAtt = cnf.att[band][0]-self.config[0].att[band][0];
				if (diffAtt<0) return true;
			}
		}
		return false;
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
		if (checkOv || checkB && !self.hideUnit[nr]) {
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
	this.analyzeFreqs = function(mon){
		var showWarning;
		for (var band=0;band<2;band++){
			if (!self.factory[0].chBandEnabled[band] && !self.factory[0].adjBandEnabled[band])
				showWarning = false;
			else
				showWarning = (self.isFreqSplitFixed(band,0) && !self.equalFreqs(mon,band));
			document.getElementById("warnFreq_"+band).style.display = showWarning?"table-row":"none";
		}
	}
	this.showConfs = function(onlyFilterFields) {
		//primero parámetros de las tablas de filtros
		for (var nr=0;nr<nrOfDevices;nr++){
			console.log("unitToMon["+nr+"]="+unitToMon[nr]);
			var isMaster = unitToMon[nr]==0;
			var isExp = ((unitToMon[nr]&0xff)==0) && !isMaster;
			var isRemote = (unitToMon[nr]>0) && !isExp;
			//HIDE UNIT CONTENT
			if (!isMaster && !remoteGlobalConfResponseValid[unitToMon[nr]]){
				self.hideSet(nr,true,"NOT AVAILABLE");
			}
			if (self.hideUnit[nr]) return;
			self.bbuAlarmsShow(nr);
			if (isMaster) {
				this.masterFirmwareSet(self.factory[0].commonUl ? 0:1);
			}
			for (var band = 0; band < 2; ++band) {
				for (var c = 0; c < self.maxChannels[nr]; ++c) {
					self.squelchChEnSet(1, c, band, 0, nr, self.config[nr].sqChEnabled[0][band][1][c]);	
					self.squelchChThrSet(1, c, band, 0, nr, self.config[nr].sqChThreshold[0][band][1][c]);	
				}

				for (var b = 0; b < 2; ++b) {
					for (var c = 0; c < self.config[nr].ADJNR; ++c) {
						self.squelchChEnSet(b, c, band, 1, nr, self.config[nr].sqChEnabled[1][band][b][c]);	
						self.squelchChThrSet(b, c, band, 1, nr, self.config[nr].sqChThreshold[1][band][b][c]);	
						if (isRemote && b==0) self.setCNThresholdUlAdj(band, c, nr, self.config[nr].cn_threshold_adj[band][c]);
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
							setMetRange("rfInPow_"+c+"_"+b+"_"+band+"_"+nbadj+"_"+nr, chRfIn_settings[b]);	
						}
					}
				}
			}
		}
		if (onlyFilterFields) return;
		//después el resto de parámetros
		self.masterModeSet(self.config[0].masterMode,false);
		for (var k=0;k<self.config[0].masterModeAlarmEnables.length;k++){
			self.masterModeAlarmEnableSet(k,self.config[0].masterModeAlarmEnables[k]);
		}
		for (var nr=0;nr<nrOfDevices;nr++){
			var isMaster = unitToMon[nr]==0;
			var isExp = ((unitToMon[nr]&0xff)==0) && !isMaster;
			var isRemote = (unitToMon[nr]>0) && !isExp;
			if (!isExp){
				for (var band = 0; band < 2; ++band) {
					if (isRemote){//only remotes
						self.agcBandModeSet(band,nr,self.config[nr].agcBandMode[band]);
						self.setCNThresholdUlNb(band,nr,self.config[nr].cn_threshold_nb[band]);
						self.maxPowerSet(band, nr, self.factory[nr].powerlimit[2*band+1]);
					}
					self.eqSqSet(band, nr, self.config[nr].allSameSquelch[band]);
					self.squelchChEnSet(0, 0, band, 0, nr, self.config[nr].sqChEnabled[0][band][0][0]);			
					self.squelchChThrSet(0, 0, band, 0, nr, self.config[nr].sqChThreshold[0][band][0][0]);
					
					for (var b = 0; b < 2; ++b) {
						self.mainGainLimSet(b, band, nr, self.config[nr].att[band][b]);
						self.mainPowerLimSet(b, band, nr, self.config[nr].inputAgc[band][b]);
						try{
							var min,max;
							max = self.factory[nr].powerlimit[2*band+b] - (self.factory[nr].gainlimit[2*band+b]-self.config[nr].att[band][b]);
							min = self.factory[nr].powerlimit[2*band+b] - self.factory[nr].gainlimit[2*band+b] - self.config[nr].limitPowerRange[b]; //Absolute min does not depend on conf.att
							document.getElementById("mainPowerLimit_"+band+"_"+b+"_"+nr).title = "Min: "+min+", Max: "+max+" dBm";
						} catch(e){}
						self.hpaSwSet(b, band, nr, self.config[nr].paEnabled[band][b]);
						self.eqBwSet(b, band, nr, self.config[nr].allChSameBW[band][b]);
					}
				}
				if (isMaster){
					self.setAutoPaUlOffTime(nr,self.config[nr].autoUlPaOffTimer);
				}
				self.setFirstNet(nr,self.config[nr].firstADJisFirstNet);
				self.showFirstNet(nr,self.config[nr].firstADJisFirstNet);
				self.showOpfSettings(nr,self.computeShowOpfSettings(nr));
				self.opfModeSet(nr,self.config[nr].oscActionAfterAlarm[0]);
				self.setAbnSqTime(nr,self.config[nr].oscTimeThSeconds[0]);
				self.showRetrySettings(nr,self.config[nr].oscActionAfterAlarm[0]<2);
				self.setRetryTime(nr,self.config[nr].oscRetryTimeHours[0]);
				self.showExtremeTempActionBox(nr,self.computeShowExtremeTempAction(nr));
				self.showExtremeTempAction(nr,self.config[nr].extremeTempAction);
				self.forceRfOffSwSet("forceRfOff",self.config[0].system_force_rf_off);
				if (isRemote){
					self.setCnUlLowAlarmTime(nr,self.config[nr].cnAlarmTime);
					self.plaTimeSet(nr,self.config[nr].plaMeasPeriod);
					self.plaEnSet(nr,self.config[nr].plaEn);
					self.showPla(nr,self.factory[nr].plaAvailable && self.config[nr].plaEn && self.config[nr].supportsFlex2());
					self.setPlaFreq(nr,self.config[nr].fstartHzPlaFilter,self.config[nr].fstopHzPlaFilter);
				}
			}
			self.showBbuTypeOfConnection(self.config[nr].bbu_serial_mode, nr);
			//relay timers
			for (var k=0;k<self.config[nr].NR_OF_RELAYS_MAX;k++){
				this.delayLatchOnOffSet(0,k,nr,self.config[nr].delayTimerON[k]);
				this.delayLatchOnOffSet(1,k,nr,self.config[nr].latchTimerON[k]);
				this.delayLatchTimeSet(0,k,nr,self.config[nr].delayTimer[k]);
				this.delayLatchTimeSet(1,k,nr,self.config[nr].latchTimer[k]);
			}
			self.showFOconfig(nr);
		}
		try{
			var el = window.parent.head.document.getElementById('maintab');
			var w =  document.getElementById("headDivAlarm_0").getBoundingClientRect().width;
			el.style.width = w+'px';		
		} catch(e) {}
		for (var sysAlarmNr = 0; sysAlarmNr < NrOfGralSystemAlarms; sysAlarmNr++) {
			self.setForceSystemAlarm(self.config[0].forceSystemAlarm[sysAlarmNr], sysAlarmNr);
		}
		//check frefs are equal
		if (window.top.monitorMode == 0){
			r = self.equalFRefs();
			if (r.length>0){
				var txt = "Some remote(s) have different frequency band:\n";
				for (var k=0;k<r.length;k++){
					txt += (r[k]>>8 & 0xff)+"."+(r[k] & 0xff)+" "+self.tags[r[k]].tag.trim()+"\n";
				}
				txt+="Please desconnect it/them";
				alert(txt);
			}
		}
		for (var nr=0;nr<nrOfDevices;nr++){
			var hide = !isBbuSerialMode(self.config[nr]) && unitToMon[nr]>0;
			self.nfpa[nr].show(self.config[nr],nr,!hide);
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
		var b = unitToMon[nr]==0?1:0;
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
		var br = unitToMon[nr]==0 ? 0:1;
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
	this.readTags = function(){
		var str = document.getElementById("tagEntry_0").value;
		var tagstr = [];
		tagstr.push(tags[0].format(str));
		for (var nr in self.fibInfo.FOmoduleConnected) {
			if (nr==0) continue;
			if (!self.fibInfo.FOmoduleConnected[nr] || !remoteGlobalConfResponseValid[nr]) continue;
			var remoteHeader = hexformat(((nr&0xf00)>>4) | (nr&0xf), 2); //short header
			var str = document.getElementById("tagEntry_"+nr).value;
			var remoteFrame = tags[nr].format(str);
			tagstr[0] += "\t"+remoteHeader+remoteFrame;
		}
		return tagstr;
	}
	this.runEqualizeDelay = function(){
		var maxDelay = 0;
		var n = 0;
		var rs = [];
		var delay = [];
		//compute maximum delay
		for (var nr in self.fibInfo.FOmoduleConnected){
			var i1 = nr & 0xff; var i2= (nr>>8)&0xff;
			if (i1!=0){
				if (!remoteGlobalConfResponseValid[nr]) continue;
				if (!monitor.remoteResponseValid[nr]) continue;
				var res = monitor.monitorUnit[0].delayMeas[nr];
				if (res>=0x3fff) continue; //meas delay timeout or remote disconnected
				rs[n]=nr;
				res -= (self.factory[0].commonUl?5:4);if (res<0) res = 0;
				var wordRate = self.factory[0].fmodulo*self.factory[0].fstep/1e6;
				wordRate*=self.factory[0].commonUl?19.2:24;
				delay[n] = res*48/wordRate/2;
				if (maxDelay<delay[n]) maxDelay = delay[n];
				n++;
			}
		}
		if (n<2) alert("At least 2 connected remotes with enabled delay adjust are necessary to apply delay equalization");
		//set delay proposal
		for (var nr = 0;nr<rs.length;nr++){
			for (var k=0;k<2;k++){
				self.setDelayConfEnabled(rs[nr],true);
				self.setDelayConf(k,rs[nr],maxDelay-delay[nr]);
			}
		}
		if (confirm("Delay adjust will be configured on remotes for a total delay of " + maxDelay.toFixed(1)+"us")){
			submitform();
		}else{
			for (var nr = 0;nr<rs.length;nr++){
				self.setDelayConfEnabled(rs[nr],self.basicCfg[rs[nr]].FOgroupDelayEnable);
				for (var k=0;k<2;k++){
					self.setDelayConf(k,rs[nr],self.basicCfg[rs[nr]].FOgroupDelay[k]);
				}
			}
		}

	}
	this.readConfDelays = function(totalConfFrame){
		var unitFrame = "";
		for (var nr in self.fibInfo.FOmoduleConnected){
			var i1 = nr & 0xff; var i2= (nr>>8)&0xff;
			if (i1!=0){
				if (!remoteGlobalConfResponseValid[nr]) continue;
				if (!monitor.remoteResponseValid[nr]) continue;
				var delay = [0,0];
				var delayEn = false;
				var change = false;
				delayEn = self.getDelayConfEnabled(nr);
				if (delayEn!=self.basicCfg[nr].FOgroupDelayEnable) change = true;
				for (var k=0;k<2;k++){
					delay[k] = self.getDelayConf(k,nr);
					if (delay[k]!=self.basicCfg[nr].FOgroupDelay[k]) change = true;
				}
				if (change){
					unitFrame = ")"+hexformat(nr, 4)+"01"; //subtype command = 7 + header + valid frame
					unitFrame += delayEn?"01":"00";
					for (var k=0;k<2;k++) unitFrame += hexformat(Math.round(delay[k]*10), 4);
					totalConfFrame.push(unitFrame);
				}
			}
		}
		return totalConfFrame;
	}
	this.readAttAndPaEnables = function(totalConfFrame){
		var unitFrame = "";
		for (var nr in self.fibInfo.FOmoduleConnected){
			var i1 = nr & 0xff; var i2= (nr>>8)&0xff;
			if (i1!=0){
				if (!remoteGlobalConfResponseValid[nr]) continue;
				if (!monitor.remoteResponseValid[nr]) continue;
				var cfgToSend = new Config(nr);
				var change = false;
				for (var band=0;band<2;band++){
					for (var b=0;b<2;b++){
						cfgToSend.paEnabled[band][b] = !self.forceRfOffSwGet("sysPa_"+band+"_"+b+"_"+nr);
						cfgToSend.att[band][b] = self.sysAttGet(b,band,nr)
						if (cfgToSend.paEnabled[band][b]!=self.basicCfg[nr].paEnabled[band][b]){
							change = true;
							if (cfgToSend.paEnabled[band][b]) cfgToSend.forcePaOn[band][b] = true;
							if (!cfgToSend.paEnabled[band][b]) cfgToSend.forcePaOff[band][b] = true;
						}
						if (cfgToSend.att[band][b]!=self.basicCfg[nr].att[band][b]) change = true;
					}
				}
				if (change){
					unitFrame = partialConfCommands[0]+hexformat(nr, 4); //header for general configuration partial frame
					unitFrame += "01"; //valid frame
					unitFrame += "10"; //bit 4=1 to force only att and PA enables
					unitFrame += cfgToSend.getFrmGeneral();
					totalConfFrame.push(unitFrame);
				}
			}
		}
		return totalConfFrame;
	}
	this.getNumberOfRemotes = function(){
		var n = 0;
		var fibInfo = monitor.monitorUnit[0].fibInfo;
		for (var nr in fibInfo.FOmoduleConnected){
			if ((nr & 0xff) ==0) continue; //discard master and expansion
			if (!fibInfo.FOmoduleConnected[nr]) continue;
			n++;
		}
		return n;
	}
	this.getNumberOfDisconnectedRemotes = function(){
		var n = 0;
		var fibInfo = monitor.monitorUnit[0].fibInfo;
		for (var nr in fibInfo.FOmoduleConnected){
			if ((nr & 0xff) ==0) continue; //discard master and expansion
			if (!fibInfo.FOmoduleConnected[nr]) continue;
			if (fibInfo.FOlossCommunication[nr]) n++;
		}
		return n;
	}
	this.getRemotesActiveOnThisMaster = function(){
		var n = [];
		var fibInfo = monitor.monitorUnit[0].fibInfo;
		for (var nr in fibInfo.FOmoduleConnected){
			if ((nr & 0xff) ==0) continue; //discard master and expansion
			if (!fibInfo.FOmoduleConnected[nr] || fibInfo.FOlossCommunication[nr]) continue; //discard unconnected remotes
			if (fibInfo.FORemotesOpticalPort[nr]==monitor.monitorUnit[nr].FOActiveOpticalLink) n.push(nr);
		}
		return n;
	}
	this.getNumberOfRedundantRemotes = function(){
		var n = 0;
		var fibInfo = monitor.monitorUnit[0].fibInfo;
		for (var nr in fibInfo.FOmoduleConnected){
			if ((nr & 0xff) ==0) continue; //discard master and expansion
			if (!fibInfo.FOmoduleConnected[nr] || fibInfo.FOlossCommunication[nr]) continue; //discard unconnected remotes
			if (fibInfo.FORemotesOpticalPort[nr]!=monitor.monitorUnit[nr].FOActiveOpticalLink){//remote does not have active port = port connected to this master
				var serial = self.basicCfg[nr].serNr.sernr;
				var equalSerial = false;
				for (var nr2 in fibInfo.FOmoduleConnected){
					if ((nr2 & 0xff) ==0) continue; //discard master and expansion
					if (!fibInfo.FOmoduleConnected[nr2] || fibInfo.FOlossCommunication[nr2]) continue; //discard unconnected remotes
					//Check if other remote has the same serial number and active port = port connected to this master
					if (nr!=nr2 && serial==self.basicCfg[nr2].serNr.sernr && fibInfo.FORemotesOpticalPort[nr2]==monitor.monitorUnit[nr2].FOActiveOpticalLink){
						equalSerial = true;
						break;
					}
				}
				if (equalSerial) n++;
			}
		}
		return n;
	}
	this.getNoRedundantRemotes = function(){
		var n = [];
		var alreadyChecked = [];
		var fibInfo = monitor.monitorUnit[0].fibInfo;
		for (var nr in fibInfo.FOmoduleConnected){
			if ((nr & 0xff) ==0) continue; //discard master and expansion
			if (!fibInfo.FOmoduleConnected[nr] || fibInfo.FOlossCommunication[nr]) continue; //discard unconnected remotes
			if (!self.fibInfo.FOmoduleConnected[nr] || !remoteGlobalConfResponseValid[nr]) continue; //discard remotes with conf not valid
			var isAlreadyCheched = false;
			for (var k=0;k<alreadyChecked.length;k++){
				if (alreadyChecked[k]==nr){
					isAlreadyCheched = true;
					break;
				}
			}
			if (isAlreadyCheched) continue; //discard redundant remotes
			var serial = self.basicCfg[nr].serNr.sernr;
			var equalSerial = false;
			for (var nr2 in fibInfo.FOmoduleConnected){
				if ((nr2 & 0xff) ==0) continue; //discard master and expansion
				if (!fibInfo.FOmoduleConnected[nr2] || fibInfo.FOlossCommunication[nr2]) continue; //discard unconnected remotes
				//Check if other remote has the same serial number
				if (nr!=nr2 && serial==self.basicCfg[nr2].serNr.sernr){
					equalSerial = true;
					break;
				}
			}
			if (equalSerial){ //if redundant remote only is considered first remote
				n.push(nr);
				alreadyChecked.push(nr2);
			}else{
				n.push(nr);
			}

		}
		return n;
	}
	this.readTotalConfsFrm = function(s){
	
		var unitFrame = "";
		var unitHeader = "";
		var totalConfFrame = [];
		var cnfs = [];
		var connected = [];
		var validframe = "01";
		var result = 0;
		var numAlerts = 0;
		var nDisconnected,nRemotes,nActiveRemotes,activeRemotes,redundantRemotes,msgUlAttLower;
		var checkConfRequired = false;
		//read paEnabled and attenutions from DAS System RF Table and read delays from DAS System Optical table, if command is not a master action
		if (!s.isReset && !s.clearErrors && !s.delayMeas && !s.setDefaultRelay){ 
			if (window.top.monitorMode==0){
				totalConfFrame = self.readAttAndPaEnables(totalConfFrame);
				totalConfFrame = self.readConfDelays(totalConfFrame);
			}
		}
		for (var i = 0; i < nrOfDevices; i++) {
			var isMaster = unitToMon[i]==0;
			var isExp = ((unitToMon[i]&0xff)==0) && !isMaster;
			var isRemote = (unitToMon[i]>0) && !isExp;
			cnfs.push(new Config(unitToMon[i]));
			connected.push(true);
			if (!isMaster) connected[i] = remoteGlobalConfResponseValid[unitToMon[i]]; //check condition for remotes connected to expansion
			if (connected[i]){
				cnfs[i] = self.readConfsFrm(i, s.ndev==i, s);
				if (!isMaster) validframe = remoteGlobalConfResponseValid[unitToMon[i]]?"01":"00";
				unitHeader = hexformat(unitToMon[i], 4)+validframe; //header + valid
				unitFrame = cnfs[i].getFrm(self.factory[i]);
				if(unitFrame!=config[i].frm){
					totalConfFrame.push(unitHeader+unitFrame);
					checkConfRequired = true;
				}
			}
			if (!s.isReset && !s.isolVerif && !s.isolClear && !s.clearErrors && !s.delayMeas && !s.setDefaultRelay && !s.forcePlaMeas){ //for actions freqs are not sent to remotes and overlap/classB is not analyzed
				//special case to send same freq config master to remotes
				if (window.top.monitorMode == 0 && i==0 && isMaster && (self.isFreqSplitFixed(0,0) || self.isFreqSplitFixed(1,0))){
					var noRedundant = self.getNoRedundantRemotes();
					for (var k = 0;k<noRedundant.length;k++){
						nr = noRedundant[k];
						var paramFreqFrame = 0;
						for (var band=0;band<2;band++){
							if (!(self.factory[0].chBandEnabled[band] || self.factory[0].adjBandEnabled[band])) continue;
							if (!self.isFreqSplitFixed(band,0)) continue;
							var currentCfg = new Config(0);
							currentCfg.parse(self.config[0].frm,self.factory[0]);
							var masterFreqChanged = self.equalConfFreqs(currentCfg,cnfs[0],band);
							if (!(monitor.monitorUnit[0].crcConf[band+1]!=monitor.monitorUnit[nr].crcConf[band+1] || masterFreqChanged<0)) continue;
							paramFreqFrame |= 0x3<<(band*2);//flags to edig config freq frame
						}
						if (paramFreqFrame!=0){
							var cfg = new Config(nr);
							cfg.genConfigFilterULFromDL(cnfs[0],self.factory[0],self.basicCfg[nr]);
							var frmFreq = cfg.getFrmFilterWithBasicConfig(self.factory[0],self.basicCfg[nr]);
							unitHeader = partialConfCommands[1];//freq partial frame
							unitHeader += hexformat(nr,4) + validframe; //header + valid
							unitFrame = hexformat(paramFreqFrame,2) + frmFreq; //added flags with band freqs to modify
							totalConfFrame.push(unitHeader + unitFrame);
						}
					}
				}
				//Chequeo Overlap y clase B and master UL attenuation reduction
				//Result code:
				//Bit0: filter overlap
				//Bit1: filter class B
				//Bit2: master UL att reduction
				if (checkConfRequired){
					var isExp = ((unitToMon[i]&0xff)==0) && !(unitToMon[i]==0);
					var isMaster = (unitToMon[i]==0);
					if (connected[i] && !isExp){
						result |= self.checkFreqs(true,cnfs[i],i);
						if (result!=0) numAlerts++;
						if ((result&0x3)==0x3) numAlerts++;
					}
					if (isMaster && window.top.monitorMode==0){//ouput UL only can be changed from DAS Overview window
						if (self.checkULAttReduction(cnfs[i])){
							result |= 0x4;
							numAlerts++;
							nRemotes = self.getNumberOfRemotes();
							nDisconnected = self.getNumberOfDisconnectedRemotes();
							activeRemotes = self.getRemotesActiveOnThisMaster();
							redundantRemotes = self.getNumberOfRedundantRemotes();
							nActiveRemotes = activeRemotes.length;
							msgUlAttLower = "You are increasing the UL gain of the system. ";
							if ((nRemotes-nDisconnected)==(nActiveRemotes+redundantRemotes)){//considering disconnected and redundant remotes
								msgUlAttLower += "The system will now automatically measure the isolation of each remote. Depending on the result, the UL and DL attenuation settings may be overwritten. ";
							}else if(nActiveRemotes==0){
								msgUlAttLower += "There are no active remotes at this master, so the user must make active this master in all the remotes and manually measure the isolation. ";
							}else{
								msgUlAttLower += "The system will now automatically measure the isolation of all the remotes that are active in this master. ";
								msgUlAttLower += "Depending on the results, the UL and DL gain settings may be overwritten. The user must make active this master in the remaining remotes and manually measure the isolation. ";
							}
							if (nDisconnected>0) msgUlAttLower += "Unconnected remotes should be checked manually when available.";
							msgUlAttLower += "\n";
							/*msgUlAttLower += nRemotes + " " + nDisconnected + " " + nActiveRemotes + " " + redundantRemotes +"\n";
							for (var r=0;r<nActiveRemotes;r++){
								msgUlAttLower += activeRemotes[r] + ",";
							}
							msgUlAttLower += "\n";*/
							for (var r=0;r<nActiveRemotes;r++){
								unitFrame = '('+hexformat(activeRemotes[r],4)+'0102';
								totalConfFrame.push(unitFrame);
							}
						}
					}
				}
			}
		}
		if (result!=0){
			var alertMsg = "WARNING:\n";
			var num = 1;
			if ((result&0x2)!=0){ //Class B
				if (numAlerts>1){alertMsg += num+'. ';num++;}
				alertMsg += "Filter wider than 75KHz will be configured. This unit will operate as a Class B unit\n";
			}
			if ((result&0x1)!=0){ //Filter overlap
				if (numAlerts>1){alertMsg += num+'. ';num++;}
				alertMsg += "Overlapped filters detected\n";
			}
			if ((result&0x4)!=0){ //Master UL att reduction
				if (numAlerts>1){alertMsg += num+'. ';num++;}
				alertMsg += msgUlAttLower;
			}
			if ((result&0x3)!=0){ //Only for Class B or Filter overlap
				alertMsg += "\nSee filter settings warnings below\n";
			}
			alertMsg += "Please, confirm before applying\n";
			if (!confirm(alertMsg)) {
				return [];
			}
		}
		return totalConfFrame;
	}
	this.readConfsFrm = function(nr, validArgs, s) {
		var cnf = new Config(unitToMon[nr]);
		var isMaster = unitToMon[nr]==0;
		var isExp = ((unitToMon[nr]&0xff)==0) && !isMaster;
		var isRemote = (unitToMon[nr]>0) && !isExp;
		cnf.parse(self.config[nr].frm,self.factory[nr]);
		if (validArgs){
			if (s.isReset) {
				cnf.resetSoft = true;
				return cnf;
			}
			if (s.isolVerif) {
				cnf.runIsolationMeas[0] = true;
				return cnf;
			}
			if (s.isolClear) {
				cnf.clearOscAlarm[0] = true;
				return cnf;
			}
			if (s.clearErrors) {
				cnf.FOclearErrorCounters = true;
				return cnf;
			}
			if (s.delayMeas) {
				cnf.runDelayMeasuarement = true;
				return cnf;
			}
			if (s.setDefaultRelay){
				cnf.bbu_serial_mode = self.readBbuTypeOfConnection(nr);
				cnf.setDefaultRelayAssign(cnf.bbu_serial_mode,unitToMon[nr]);
				return cnf;
			}
			if (s.forcePlaMeas){
				cnf.forcePlaMeas = true;
				return cnf;
			}
			cnf.resetSoft = false;
			for (var k=0;k<2;k++){
				cnf.runIsolationMeas[k] = false;
				cnf.clearOscAlarm[k] = false;
			}
		}
		if (!isExp){
			for (band=0;band<2;band++){
				var confToGet = self.isFreqSplitFixed(band,0)?0:nr;
				cnf = self.getFreqs(cnf, confToGet, nr, band);
			}
			cnf = self.getSqConf(cnf,nr);
			self.getDelays(cnf, nr);
			if (validArgs){
				for (var i=0;i<2;i++){
					for (var j=0;j<2;j++){
						cnf.forcePaOn[i][j] = s.forcePaOn[i][j];
						if (cnf.forcePaOn[i][j]) cnf.paEnabled[i][j] = true;
						cnf.forcePaOff[i][j] = s.forcePaOff[i][j];
						if (cnf.forcePaOff[i][j]) cnf.paEnabled[i][j] = false;
					}
				}
			}
			cnf = self.getGralConf(cnf,nr);
		}
		cnf = self.getAlarmConf(cnf,nr);
		
		if (isMaster) {
			for (var sysAlarmNr = 0; sysAlarmNr < NrOfGralSystemAlarms; sysAlarmNr++) {
				cnf.forceSystemAlarm[sysAlarmNr] = self.getForceSystemAlarm(sysAlarmNr);
			}
			cnf.system_force_rf_off = this.forceRfOffSwGet("forceRfOff");
		}
		self.nfpa[nr].readConf(cnf,nr);
		return cnf; 
	}
	this.enableRowElements = function(r,err){
		var inputs = r.getElementsByTagName('input');
		for (var i = 0; i < inputs.length; i++) {
			inputs[i].disabled = err;
			if (err){
				inputs[i].checked = false;
			}
		};
		var inputs = r.getElementsByTagName('a');
		for (var i = 0; i < inputs.length; i++) {
			inputs[i].disabled = err;
		};
	}
	this.showGeneralStatus = function(mon){
		for (var nr in self.fibInfo.FOmoduleConnected){
			if (nr>0 && (!self.fibInfo.FOmoduleConnected[nr] || typeof(tags[nr])==="undefined" || self.basicCfg[nr].version.isEmpty)) continue;
			var err = nr>0 && (!remoteGlobalConfResponseValid[nr] || !mon.remoteResponseValid[nr] || mon.monitorUnit[0].fibInfo.FOlossCommunication[nr] || self.basicCfg[nr].version.isEmpty);
			document.getElementById("dasAlarmRow_"+nr).style.backgroundColor = err?"#f0a0a0":this.okColor[nr];
			var r = document.getElementById("dasSystemRFRow_"+nr);
			r.style.backgroundColor = err?"#f0a0a0":this.okColor[nr];
			self.enableRowElements(r,err);
			var r = document.getElementById("dasSystemOpticalRow_"+nr);
			r.style.backgroundColor = err?"#f0a0a0":this.okColor[nr];
			self.enableRowElements(r,err);
			var r = document.getElementById("dasConfigRow_"+nr);
			r.style.backgroundColor = err?"#f0a0a0":this.okColor[nr];
			self.enableRowElements(r,err);
			var r = document.getElementById("dasTagRow_"+nr);
			r.style.backgroundColor = err?"#f0a0a0":this.okColor[nr];
			self.enableRowElements(r,err);
			if (err) continue;
			for (var k=0;k<24;k++)	ledSetColor("alarm_"+nr+"_0_"+k, mon.monitorUnit[nr].gralAlarm[k] ? "red":"grey");
			for (var k=1;k<16;k++){
				var ld = "alarm_"+nr+"_2_"+k;
				ledSetColor(ld, mon.monitorUnit[nr].bbuAlarm[k] ? "red":"grey");
				var	showAlarm = mon.monitorUnit[nr].bbu_serial_mode;
				showAlarm = showAlarm && !(k==10 && mon.monitorUnit[nr].bbu_type ==2);
				document.getElementById(ld).style.display = showAlarm?"block":"none";
			}
			for (var band=0;band<2;band++){
				for (var k=0;k<16;k++)	ledSetColor("alarm_"+nr+"_1_"+band+"_"+k, mon.monitorUnit[nr].bandAlarm[band][k] ? "red":"grey");
			}
			if ((nr & 0xff)!=0){//only remotes
				for (var k=0;k<2;k++) document.getElementById("alarm_"+nr+"_0_"+(k+6)).style.display = mon.monitorUnit[nr].FOmoduleConnected[k]?"block":"none";
			}
			if ((nr>0) && ((nr & 0xff)==0)){//only expansion, because master is refreshed in opticalAlarmDisplay function
				for (var k=0;k<8;k++) document.getElementById("alarm_"+nr+"_0_"+(k+16)).style.display = mon.monitorUnit[nr].FOmoduleConnected[k]?"block":"none";
			}
		}
	}
	this.showSysStatus = function(mon){
		for (var nr in self.fibInfo.FOmoduleConnected){
			if (nr>0 && (!self.fibInfo.FOmoduleConnected[nr] || typeof(tags[nr])==="undefined" || self.basicCfg[nr].version.isEmpty )) continue;
			var i1 = nr & 0xff; var i2= (nr>>8)&0xff;
			var isExp = i1==0 && i2>0;
			var isRemote = i1!=0;
			var isMaster = nr==0;
			var val,totdelay="";
			if (mon.remoteResponseValid[nr] && mon.monitorUnit[0].fibInfo.FOmoduleConnected[nr]){
				if (isRemote){
					val = mon.monitorUnit[0].fibInfo.FORemotesOpticalPort[nr]==0 ? 0 : 1;
					document.getElementById("genRemotePort_"+nr).innerHTML = val + 1;
					document.getElementById("activeLink_"+nr).innerHTML = mon.monitorUnit[nr].FOActiveOpticalLink + 1;
					if (i2==0)
						document.getElementById("optLevel_0_"+nr).innerHTML =  mon.monitorUnit[0].FORxPow[i1-1].toFixed(1)+"dBm";
					else
						document.getElementById("optLevel_0_"+nr).innerHTML =  mon.monitorUnit[i2<<8].FORxPow[i1-1].toFixed(1)+"dBm";
					document.getElementById("optLevel_1_"+nr).innerHTML = mon.monitorUnit[nr].FORxPow[val].toFixed(1)+"dBm";
					var res = mon.monitorUnit[0].delayMeas[nr];
					if (res==0xffff){
						val = "---";//remote is not connected
						totdelay = "---";
					}else if (res>=0x3fff){
						val = "---";//timeout
						totdelay = "---";
					}else{
						res -= (self.factory[0].commonUl?5:4);
						var wordRate = self.factory[0].fmodulo*self.factory[0].fstep/1e6;
						wordRate*=self.factory[0].commonUl?19.2:24;
						res = res*48/wordRate/2;
						if (res<0) res=0;
						val = res.toFixed(1);
						var txt = ["&nbsp;/&nbsp;","&nbsp;us"];
						for (var b=0;b<2;b++){
							var confdelay = self.basicCfg[nr].FOgroupDelayEnable?self.basicCfg[nr].FOgroupDelay[b]:0;
							totdelay += (confdelay+res).toFixed(1)+txt[b];
						}
					}
					document.getElementById("measDelay_"+nr).innerHTML = val+"us";
					document.getElementById("totalDelay_"+nr).innerHTML = totdelay;
					for (var band=0;band<2;band++){
						for(var b=0;b<2;b++){
							if (mon.monitorUnit[nr].configAtt[band][b]!=self.currentRemoteAtt[nr][band][b]){
								self.sysAttSet(b,band,nr,mon.monitorUnit[nr].configAtt[band][b]);
								self.currentRemoteAtt[nr][band][b] = mon.monitorUnit[nr].configAtt[band][b];
							}
							if (mon.monitorUnit[nr].statePaOn[band][b]!=self.currentPAEnable[nr][band][b]){
								self.forceRfOffSwSet("sysPa_"+band+"_"+b+"_"+nr,!mon.monitorUnit[nr].statePaOn[band][b]);
								self.currentPAEnable[nr][band][b] = mon.monitorUnit[nr].statePaOn[band][b];
							}
						}
					}
				}
				if (isExp){
					document.getElementById("optLevel_0_"+nr).innerHTML =  mon.monitorUnit[0].FORxPow[i2-1].toFixed(1)+"dBm";
					document.getElementById("optLevel_1_"+nr).innerHTML =  mon.monitorUnit[nr].FORxPow[7].toFixed(1)+"dBm";
				}
				if (!isExp){
					for (var band=0;band<2;band++){
						var sigDetect =  mon.monitorUnit[nr].globalDetection[0][band] || mon.monitorUnit[nr].globalDetection[1][band]; //agg UL sig detection (NB or ADJ)
						ledSetColor("ledInput_"+band+"_"+nr, sigDetect ? "green":"grey");
						for (var b=0;b<2;b++){
							val = mon.monitorUnit[nr].rfBBLevel[band][b].toFixed(1);
							if (b==1 && val<-127)
								val = "OFF";
							else
								val+="dBm";
							val += (b==0 ^ isRemote)?" (DL)":" (UL)";
							document.getElementById("rfBBLevel_"+b+"_"+band+"_"+nr).innerHTML = val;
						}
					}
				}
			}else{ //values if unit is disconnected
				if (isRemote){
					val = mon.monitorUnit[0].fibInfo.FORemotesOpticalPort[nr]==0 ? 0 : 1;
					document.getElementById("genRemotePort_"+nr).innerHTML = val + 1;
					document.getElementById("activeLink_"+nr).innerHTML = "";
					if (i2==0)
						document.getElementById("optLevel_0_"+nr).innerHTML =  mon.monitorUnit[0].FORxPow[i1-1].toFixed(1)+"dBm";
					else{
						if (mon.remoteResponseValid[i2<<8])
							document.getElementById("optLevel_0_"+nr).innerHTML =  mon.monitorUnit[i2<<8].FORxPow[i1-1].toFixed(1)+"dBm";
						else
							document.getElementById("optLevel_0_"+nr).innerHTML = "";
					}						
					document.getElementById("optLevel_1_"+nr).innerHTML = "";
					document.getElementById("measDelay_"+nr).innerHTML = "";
					document.getElementById("totalDelay_"+nr).innerHTML = "";
				}
				if (isExp){
					document.getElementById("optLevel_0_"+nr).innerHTML =  mon.monitorUnit[0].FORxPow[i2-1].toFixed(1)+"dBm";
					document.getElementById("optLevel_1_"+nr).innerHTML =  "";
				}
				if (!isExp){
					for (var band=0;band<2;band++){
						ledSetColor("ledInput_"+band+"_"+nr, "grey");
						for (var b=0;b<2;b++){
							document.getElementById("rfBBLevel_"+b+"_"+band+"_"+nr).innerHTML = "";
						}
					}
				}
			}
		}
	}
	this.checkBbuTypeChange = function(mon,ndev){
		if (mon.isAggBasic){
			for (var nr in self.fibInfo.FOmoduleConnected){
				if (!self.fibInfo.FOmoduleConnected[nr] || !remoteGlobalConfResponseValid[nr]) continue;
				var cfg = nr==0?self.config[0]:self.basicCfg[nr];
				if (cfg.bbu_serial_mode) {
					try{
						if ( mon.monitorUnit[nr].isBbuDisconnectionAlarm() ) {
							self.isBbuConnected[nr] = false;
						} else {
							if ( !self.isBbuConnected[nr] ) {
								self.updateRelayShow(nr, cfg, mon.monitorUnit[nr]);
							}
							self.isBbuConnected[nr] = true;
						}
					}catch(e){}
				}
			}
		}else{
			if (self.config[ndev].bbu_serial_mode) {
				if ( mon.isBbuDisconnectionAlarm() ) {
					self.isBbuConnected[ndev] = false;
				} else {
					if ( !self.isBbuConnected[ndev] ) {
						self.updateRelayShow(unitToMon[ndev], self.config[ndev], mon);
					}
					self.isBbuConnected[ndev] = true;
				}
			}
		}
	}
	this.updateRelayShow = function(nr, cfg, monitor) {
		var bbuSerialMode = isBbuSerialMode(cfg);
		var nrOfRelaysSupported = getNrOfRelaysSupported(cfg, nr, self.version);
		var statusBbuSerialMode = monitor.getBbuSerialMode();
		var statusNrOfRelaysSupported = monitor.getNrOfRelaysSupported(self.version);
		var reloadRequired = cfg.supportsBBU();
		reloadRequired = reloadRequired && ((bbuSerialMode != statusBbuSerialMode) || (nrOfRelaysSupported != statusNrOfRelaysSupported) );
		if (reloadRequired) {
			if (!reloadIcon){
				showResultIcon(ERR_RELOAD);
				window.parent.navi.document.getElementById("cfgprog").innerHTML = "NEW BBU TYPE DETECTED";
				reloadIcon = true;
			}
		}
		return reloadRequired;
	}
	this.checkNewConnection = function(mon){
		for (var nr in mon.monitorUnit[0].fibInfo.FOmoduleConnected){
			if (nr==0) continue;
			var connectState = mon.monitorUnit[0].fibInfo.FOmoduleConnected[nr] && !mon.monitorUnit[0].fibInfo.FOlossCommunication[nr];
			if (!connectState) remoteGlobalConfResponseValid[nr] = false;
			if (connectState && !remoteGlobalConfResponseValid[nr] && !mon.monitorUnit[0].gralAlarm[0]){ //not master hw fail
				remoteGlobalConfResponseValid[nr] = false;
				if (!reloadIcon){
					showResultIcon(ERR_RELOAD);
					window.parent.navi.document.getElementById("cfgprog").innerHTML = "NEW UNIT DETECTED";
					reloadIcon = true;
				}
			}
		}
	}
	this.showStatus = function(mon,nr) {
		var monitor=mon;
		if (mon.isAggBasic){
			self.analyzeFreqs(mon);
			monitor = mon.monitorUnit[0];
			self.showSysStatus(mon);
			self.showGeneralStatus(mon);
			self.showConfCRC(mon);
			self.deepDischarge.showDeepDischargeMvo2(mon);
			self.drawTableLines();
		}
		self.checkBbuTypeChange(mon,nr);
		var isMaster = unitToMon[nr]==0;
		var isExp = ((unitToMon[nr]&0xff)==0) && !isMaster;
		var isRemote = (unitToMon[nr]>0) && !isExp;
		if (isMaster){
			self.masterModeStatusSet(monitor.isPrimary);
		}
		//HIDE UNIT CONTENT
		if (!isMaster && (!monitor.responseValid || !remoteGlobalConfResponseValid[unitToMon[nr]])){
			if (window.parent.navi.isEthernetMode) {
				if (!remoteGlobalConfResponseValid[unitToMon[nr]]) {
					self.hideSet(nr,true,"NOT AVAILABLE")
				} else if (!monitor.responseValid) {
					// do not hide, status may be temporarily not valid in case of simultaneous access from multiple users
					// console.log("showStatus["+unitToMon[nr]+"] monitor valid="+monitor.responseValid+" config valid="+remoteGlobalConfResponseValid[unitToMon[nr]]);
				}
			} else {
				self.hideSet(nr,true,"NOT AVAILABLE");
			}
		}else if (monitor.blocked){
			self.hideSet(nr,true,"BLOCKED");
			self.hideOverviewTablesSet(true);
		}else{
			self.hideSet(nr,false,"");
			self.hideOverviewTablesSet(false);
		}
		if (self.hideUnit[nr]) return;
		if (window.parent.navi.isEthernetMode) {
			if (!monitor.responseValid) return;	// do not show status if response is not valid, but do not hide the unit
		}
		self.showFOstatus(monitor,nr);
		self.boardTempSet(nr,monitor.boardTemp);
		
		for (var k=0;k<monitor.gralAlarm.length;k++){
			var alarmr = isMaster?monitor.gralAlarmR[k]:false;
			self.gralAlarmSet(k, nr, monitor.gralAlarm[k], alarmr);
		}
		for (var k=0;k<self.config[nr].NR_OF_RELAYS_MAX;k++){
			var noShow = self.config[nr].latchTimerON[k] && (self.config[nr].latchTimer[k]>=35996400); //hours = 9999
			self.delayLathTimeStatSet(0,k,nr,monitor.delayTimer[k],monitor.delayTimerRunning[k],false);
			self.delayLathTimeStatSet(1,k,nr,monitor.latchTimer[k],monitor.latchTimerRunning[k],noShow);
			self.relayStateSet(k,nr,monitor.relayOpenClosed[k],monitor.relayONOFF[k]);
		}
		if (!isExp){
			self.opfRoutineRunningSet(nr,monitor.isolMeasRunning[0]);
			self.setIsolGain(nr,monitor.maxAllowGain);	
			self.setLastRetryTime(nr,monitor.retryTime[0]);
			self.showExtremeTempStatus(nr,monitor.extremeTempActionOn);

			for (var band = 0; band < 2; ++band) {
				for (var b = 0; b < 2; ++b) {
					self.setStatePaOn(b, band, nr, monitor);
					if (self.factory[nr].oscFeatureEnable){
						self.setConfAtt(b, band, nr, monitor.configAtt[band][b], monitor.configInputAgc[band]);
						self.statGainMainTitle(b, band, nr, monitor.maxAllowGain[band]);
					}
					for (var nbadj=0;nbadj<2;nbadj++){
						for (var c = 0; c < (nbadj==0?self.maxChannels[nr]:self.config[nr].ADJNR); ++c) {
							self.showStatusCh(monitor, b, c, band, nbadj, nr);
						}		
					}
					var oneChOutOn = self.computeOneChOutOn(b, band, nr, monitor);
					var oneFOlinkOn = isMaster?true:monitor.isOneFOlinkOn(); //master does not use this function
					self.rfOutPowSet(b, band, nr, monitor.rfBBLevel[band][1], oneChOutOn, oneFOlinkOn);
					self.bbAgcSet(b, band, nr, monitor.inputAgc[band]);
					if (isRemote){
						self.bbOutAgcSet(b, band, nr, monitor.statePaOn[band][b]?monitor.bbAgc[band][b]:0);
					}
				}
				if (isMaster) self.bbOutAgcSet(0, band, 0,monitor.statePaOn[band][0]?monitor.bbAgc[band][0]:0);
				for (var k=0;k<16;k++){
					var alarmr = isMaster?monitor.bandAlarmR[band][k]:false;
					self.bandAlarmSet(band, k, nr, monitor.bandAlarm[band][k], alarmr);
				}
			}
			if (self.doFrequencyCheck[nr]) {
				self.checkFreqs(false,null,nr);
				self.doFrequencyCheck[nr] = false;
			}
		}
		for (var k=0;k<16;k++){
			var alarmr = isMaster?monitor.bbuAlarmR[k]:false;
			self.bbuAlarmSet(nr, k, monitor.bbuAlarm[k], alarmr, monitor.bbuChargerErrorCode);
		}
		if (isRemote){
			self.plaTimeStatSet(nr,monitor.plaElapsedTime);
			for (var k=0;k<2;k++){
				var plaAlarm = monitor.plaMeas[k]>0;
				plaAlarm = plaAlarm || monitor.gralAlarm[4+k]; 
				self.rfPlaPowSet(k,monitor.plaMeas[k],nr,plaAlarm?"red":"green");
			}
		}
		self.nfpa[nr].showStatus(monitor,nr);
		if (self.firstStatus){
			self.firstStatus = false;
			self.drawTableLines();
		}
		if (mon.isAggBasic) self.checkNewConnection(mon);
		//self.setScrollPos();
	}
	this.setScrollPos = function(){
		if (self.firstStatus){
			var pos = localStorage.getItem(self.sernr.sernr+"_statposition");
			if (pos!=null) window.scrollTo(0, pos);
		}else{
			localStorage.setItem(self.sernr.sernr+"_statposition",document.documentElement.scrollTop);
		}
	}
	this.showStatusCh = function(monitor, b, c, band, nbadj, nr) {
		var br = unitToMon[nr]==0?1:0;
		var isInput = monitor.signalDet[nbadj][band][b][c] && self.config[nr].filterEnabled[nbadj][band][br][c];
		var chInOn = self.computeChInOn(b, c, band, nbadj, nr, monitor);
		var abnSq = false;
		if (self.factory[nr].oscFeatureEnable) abnSq = b==0?monitor.oscDetectCH[nbadj][band][c]:false;
		if (abnSq){
			self.rfSignalLedSet(b, c, band, nbadj, nr, "red");
		} else if (monitor.cnDet[nbadj][band][c] && (b==0)) {
			self.rfSignalLedSet(b, c, band, nbadj, nr, "yellow");
		} else if (isInput && chInOn) {
			self.rfSignalLedSet(b, c, band, nbadj, nr, "green");
		} else {
			self.rfSignalLedSet(b, c, band, nbadj, nr, "grey");
		}
		if (!chInOn) {
			self.rfChInPowSet(b, c, band, nbadj, nr, monitor.level[nbadj][band][b][c], "#D0D0D0");
		} else if (monitor.bandAlarm[band][br]) { //overload UL for remote, DL for master
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
		var br = unitToMon[nr]==0?1:0;
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
		var br = unitToMon[nr]==0?1:0;
		if (!self.config[nr].filterEnabled[nbadj][band][br][c]) {
			return false;
		}
		if (!monitor.signalDet[nbadj][band][b][c]) {
			if (self.config[nr].sqChEnabled[nbadj][band][b][ch]) {
				return false;
			}
		}
		if (!monitor.statePaOn[band][b]) return false;
		
		return true;
	}
	this.computeAgc = function(b, c, band, nbadj, nr, monitor) {
		var ch = c;
		if ((nbadj==0) && (b==0)) ch=0;
		var br = unitToMon[nr]==0?1:0;
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
				var b = unitToMon[nr]==0?1:0;//solo UL o DL
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
	this.checkPlaFrSetting = function(s,band,value,nr){
		var fmin = self.factory[nr].fstart[2*band+1];
		var fmax = self.factory[nr].fstop[2*band+1];
		var bwmin = self.BW_ADJ_MIN_HZ;
		var bwmax = fmax - fmin;
		var r;
		var v = ~~Math.round(parseFloat(value)*1e6);
		if (v < fmin) {
			v = fmin;
		} else if (v > fmax) {
			v = fmax;
		}
		r = (v / 1e6).toFixed(3);
		return r;
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
	this.setPlaFreq = function(nr,fstart,fstop){
		var f = [];
		f.push(fstart);
		f.push(fstop);
		for (var s = 0; s < 2; ++s) {
			var id = "plaAdjF_"+s+"_"+nr;
			var el = document.getElementById(id);
			try {
				el.value = (f[s] / 1.0e6).toFixed(3);
			} catch(e) {}
		}
	}
	this.getPlaFreq = function(nr){
		try{
			var f = [];
			for (var s = 0; s < 2; ++s) {
				var id = "plaAdjF_"+s+"_"+nr;
				var el = document.getElementById(id);
				var v = ~~Math.round(parseFloat(el.value)*1e6);
				f.push(v);
			}
			return f;
		} catch(e) {return [self.config[nr].fstartHzPlaFilter,self.config[nr].fstopHzPlaFilter];}	
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
		var b = unitToMon[nr]==0?1:0; //solo UL o DL
		var br = (unitToMon[nr]==0 || self.isFreqSplitFixed(band,0))?1:0;
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
			if (self.isFreqSplitFixed(band,0) && unitToMon[nr]>0) {
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
		var br = unitToMon[nr]==0 ? 0:1; //solo UL o DL
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
			var b = unitToMon[nr]==0 ? 1:0; //solo UL o DL
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
		var br = unitToMon[nr]==0 ? 0:1; //solo UL o DL
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
	
	this.setConfAtt = function(b, band, nr, att, iAgc) {
		try {
			if (unitToMon[nr]==0 ^ b==0) {
				if (att == self.config[nr].att[band][b] && (iAgc == self.config[nr].inputAgc[band][b])) return;
			}else{
				if (att == self.config[nr].att[band][b]) return;
			}
			self.config[nr].att[band][b] = att;
			if (unitToMon[nr]==0 ^ b==0){
				self.mainPowerLimSet(b, band, nr, iAgc);
				self.config[nr].inputAgc[band][b] = iAgc;
			}
			self.config[nr].getFrm(self.factory[nr]);
			self.mainGainLimSet(b, band, nr, att);
			var max = self.factory[nr].powerlimit[2*band+b]-(self.factory[nr].gainlimit[2*band+b]-self.config[nr].att[band][b]);
			var min = self.factory[nr].powerlimit[2*band+b] - self.factory[nr].gainlimit[2*band+b] - self.config[nr].limitPowerRange[b]; //Absolute min does not depend on conf.att
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
			cfgParams = new submitParams();
			cfgParams.ndev = this.nr;
			cfgParams.isolVerif = true;
			submitform(cfgParams);
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
			cfgParams = new submitParams();
			cfgParams.ndev = this.nr;
			cfgParams.isolClear = true;
			submitform(cfgParams);
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

	this.hideSet = function(nr,doHide,txt) {
		if ( doHide ) {
			if ( self.hideUnit[nr] ) return;
			self.hideUnit[nr] = true;
			self.blockContent(nr,self.hideUnit[nr]);
			self.showTagNotAvailable(nr,txt);
		} else {
			if ( !self.hideUnit[nr] ) return;
			self.hideUnit[nr] = false;
			self.blockContent(nr,self.hideUnit[nr]);
			self.showTag(nr);
		}
	}
	this.hideOverviewTablesSet = function(doHide) {
		if (window.top.monitorMode!=0) return;
		if (doHide) {
			if (self.hideOverviewTables) return;
			self.hideOverviewTables = true;
			document.getElementById("dasOverview").style.display = "none";
		}else{
			if (!self.hideOverviewTables) return;
			self.hideOverviewTables = false;
			document.getElementById("dasOverview").style.display = "block";
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
		if ((unitToMon[nr]&0xff)!=0){
			var row = document.createElement("tr");
			tb.appendChild(row);
			this.createDelayEnable(row, nr);
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
		"FO Transceiver<br>Status", "Rx Power<br>(dBm)", "Error Count"];
	this.FOalarmBaseID = ["ActiveLink", "remotePort", "LossCommunication", "LossOpticalSignal",
		"FOTransceiverStatus", "FORxPower", "ErrorCount"];
	this.createFOAlarmTable = function(nr) {
		var isMaster = unitToMon[nr]==0;
		var isExp = ((unitToMon[nr]&0xff)==0) && !isMaster;
		var isRemote = (unitToMon[nr]>0) && !isExp;
		var nports = isRemote?2:8;
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
		var nCols = this.FOalarmLabels.length;
		for (var k = 0; k < nCols; k++) {
			var cell = document.createElement("th");
			cell.className = "thdrht";
			cell.innerHTML = this.FOalarmLabels[k];
			cell.style.minWidth = "20pt";
			cell.style.textAlign = "center";
			cell.style.paddingLeft = "inherit";
			cell.id = this.FOalarmLabels[k]+"_"+nr;
			cell.style.display = ((k==0 && !isRemote) || (k==1 && isRemote))?"none":"table-cell";
			row.appendChild(cell);
		}
		if (isRemote){ //delay control only in remotes
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
		var rowsToShow = nports;
		if (isRemote) rowsToShow++;//Added 3rd row to show license message
		for (var port = 0; port < rowsToShow; port++) {
			var row = document.createElement("tr");
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
			var portToShow = port+1;
			if (isRemote && port>=2) portToShow=2;
			var title = "OPTICAL PORT "+portToShow;
			el.innerHTML = title;
			el.id = "linknumbertitle_"+nr;
			cell.appendChild(el);
			var idx = 1;
			el.className = "m";
			el.href = "/optLinkM.html?nr="+unitToMon[nr]+"&port="+portToShow;
			el.oport = portToShow-1;
			el.nr = unitToMon[nr];
			el.onclick = function(ev) {self.optPopup(~~this.nr, ~~this.oport);return false;};
			cell.appendChild(el);
			if (isRemote && port==2){
				row.style.display = "none";
				var cell = document.createElement("td");
				cell.colSpan = 6;
				cell.style.backgroundColor = '#7f7f7f';
				cell.style.textAlign = "center";
				cell.style.fontSize = "14px";
				cell.style.color = "white";
				cell.innerHTML = "LICENSE NOT AVAILABLE";
				row.appendChild(cell);
				continue;
			}else{
				for (var k = 0; k < nCols; k++) {
					var id = this.FOalarmBaseID[k]+"_"+port+"_"+nr;
					if (k < 5 && k!=1) {
						var cell = createLedBox(id);
						if (!isRemote && k==0) cell.style.display = "none"; //active link hidden in master and expansion
					} else {
						var cell = document.createElement("td");
						cell.id = id;
						cell.className = "tabval";
						cell.style.textAlign = "center";
						cell.style.minWidth = "30px";
						if (isRemote && k==1) cell.style.display = "none"; //remote port hidden in remotes 
					}
					row.appendChild(cell);
				}
				if (isRemote){ //delay control only in remotes
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
						el.title = "Min: 0 us, Max: "+self.config[nr].getDelayMax()+" us";
						el.onkeypress = function(ev) {
							return isKeyDecimalNumber(ev);
						}
						el.onchange = function(ev) {
							if (this.value < 0) this.value = "0.0";
							var max = self.config[0].getDelayMax();
							if (this.value > max) this.value = max.toFixed(1);
						}
						cell.appendChild(el);
						row.appendChild(cell);
					}
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
			cfgParams= new submitParams();
			cfgParams.ndev = this.nr;
			cfgParams.clearErrors = true;
			submitform(cfgParams);
		}
		cell.appendChild(el);
		return cell;
	}
	this.createCleanTagButton = function() {
		var el = document.createElement("input");
		el.id = "cleanTag";
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.width = "140px";
		el.style.height = "20px";
		el.style.fontWeight = "bold";
		el.style.marginRight = "20px";
		el.value = "Clear Unconnected Units";
		el.onclick = function(ev) {
			var frmcnf = '(00000102'; //command to master basic actions with bit1=1--> Clean Tag
			var frms = [{type: 'ctl_conf_str=', frame: frmcnf}];
			setConfigFramesToSubmit(frms);
		}
		return el;
	}
	this.createDelayMeasButton = function() {
		var el = document.createElement("input");
		el.id = "runDelayMeas";
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.width = "140px";
		el.style.height = "20px";
		el.style.fontWeight = "bold";
		el.style.marginLeft = "20px";
		el.style.marginRight = "20px";
		el.value = "Measure Delay";
		el.onclick = function(ev) {
			cfgParams = new submitParams();
			cfgParams.ndev = 0;
			cfgParams.delayMeas = true;
			submitform(cfgParams);
		}
		return el;
	}
	this.createDelayEqualizeButton = function() {
		var el = document.createElement("input");
		el.id = "runDelayEq";
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.width = "140px";
		el.style.height = "20px";
		el.style.fontWeight = "bold";
		el.style.marginLeft = "20px";
		el.value = "Equalize Delay";
		el.onclick = function(ev) {
			self.runEqualizeDelay();
		}
		return el;
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
	this.setDelayConfEnabled = function(nr, val){
		try {
			var id = "confDelayEn_"+nr;
			document.getElementById(id).checked = val;
		} catch(e) {}
	}
	this.setDelayConf = function(k, nr, val) {
		try {
			var id = "confDelay_"+k+"_"+nr;
			document.getElementById(id).value = val.toFixed(1);
		} catch(e) {}
	}
	this.getDelayConf = function(k, nr) {
		try {
			var id = "confDelay_"+k+"_"+nr;
			return parseFloat(document.getElementById(id).value);
		} catch(e) {return 0;}
	}
	this.getDelayConfEnabled = function(nr){
		try {
			var id = "confDelayEn_"+nr;
			return document.getElementById(id).checked;
		} catch(e) {return false;}	
	}
	this.showFOstatus = function(monitor,nr) {
		var nports = monitor.fibInfo.nPorts;
		var isMaster = monitor.fibInfo.isMaster;
		var isExp = monitor.fibInfo.isExp;
		var isRemote = monitor.fibInfo.isRemote;
		for ( var port = 0; port < nports; port++ ) {
			var fport = port+1;
			if (isMaster && monitor.fibInfo.isExpansionPort[port]) fport = (port+1)<<8;
			for (var k = 1; k < this.FOalarmBaseID.length; k++) {
				var id = this.FOalarmBaseID[k]+"_"+port+"_"+nr;
				if (k < 5 && k!=1) {
					var color = "grey";
					switch (k) {
						case 2: 
						{
							color = monitor.fibInfo.FOlossCommunication[fport] ? "red" : "green";
							break;
						}
						case 3:
						{
							var alarmOptDev = monitor.FOlossOpticalSignal[port];
							color = alarmOptDev ? "red" : "green";
							break;
						}
						case 4:
						{
							var alarmdev = monitor.FOtransceiverAlarm[port]; 
							var warningdev = monitor.FOtransceiverWarning[port];
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
					if (!monitor.fibInfo.FOmoduleConnected[fport]) {
						color = "grey";
					}
					ledSetColor(id, color);
				} else {
					var cell = document.getElementById(id);
					var val = "";
					switch (k) {
						case 1:
							if (monitor.fibInfo.FOlossCommunication[fport]){
								val = '---';
							}else{
								if (isMaster)
									val = monitor.fibInfo.isExpansionPort[port]?"EXPANSION":monitor.fibInfo.FORemotesOpticalPort[fport]+1;
								else
									val = port==7?"MASTER":monitor.fibInfo.FORemotesOpticalPort[port]+1;
							}
							break;
						case 5: val = monitor.FORxPow[port].toFixed(1); break;
						case 6: val = monitor.FOerrors[port]; break;
					}
					if (!monitor.fibInfo.FOmoduleConnected[fport]) val = "";
					try { cell.innerHTML = val; } catch(e){}
				}
			}
		}
		if (monitor.fibInfo.isRemote) self.setFOactiveOpticalLink(monitor,nr);
		self.twoFibersUpdateDisplay(monitor,nr);
	}
	this.setFOactiveOpticalLink = function(monitor,nr) {
		for (var port = 0; port < 2; port++) {
			var id = this.FOalarmBaseID[0]+"_"+port+"_"+nr;
			var color = "grey";
			if (monitor.fibInfo.FOActiveOpticalLink == 0 && port == 0) {
				color = "green";
			} else if (monitor.fibInfo.FOActiveOpticalLink == 1 && port == 1) {
				color = "green";
			}
			if (!monitor.fibInfo.FOmoduleConnected[port+1]) {
				color = "grey";
			}
			ledSetColor(id, color);
		}
	}
	this.twoFibersUpdateDisplay = function(monitor,nr) {
		var nports = monitor.fibInfo.nPorts;
		var isMaster = monitor.fibInfo.isMaster;
		var isRemote = monitor.fibInfo.isRemote;
		var twofibers = monitor.fibInfo.FOmoduleConnected[1] && monitor.fibInfo.FOmoduleConnected[2];
		var displayValue = (twofibers ? "table-cell":"none");
		if (monitor.fibInfo.isRemote){
			document.getElementById(self.FOalarmLabels[0]+"_"+nr).style.display = displayValue;
			for (var port = 0; port < nports; port++) {
				var id = this.FOalarmBaseID[0]+"_"+port+"_"+nr;
				ledSetDisplay(id, displayValue);
			}
		}
		if (isRemote){
			document.getElementById("FOportInfo_0_"+nr).style.display = monitor.fibInfo.FOmoduleConnected[1]? "table-row":"none";
			document.getElementById("FOportInfo_1_"+nr).style.display = (monitor.fibInfo.FOmoduleConnected[2] && monitor.fibInfo.FOSecondPortLicense)? "table-row":"none";
			document.getElementById("FOportInfo_2_"+nr).style.display = (monitor.fibInfo.FOmoduleConnected[2] && !monitor.fibInfo.FOSecondPortLicense)? "table-row":"none";
		}
		for (var port = 0; port < nports; port++) {
			var fport = port+1;
			if (isMaster && monitor.fibInfo.isExpansionPort[port]) fport = (port+1)<<8;
			if (!isRemote) document.getElementById("FOportInfo_"+port+"_"+nr).style.display = monitor.fibInfo.FOmoduleConnected[fport]? "table-row":"none";
			var nRows = this.FOalarmBaseID.length;
			if (!isMaster) nRows--;
			for (var k = 1; k < nRows; k++) {
				var displayValue = (monitor.fibInfo.FOmoduleConnected[fport]? "table-cell":"none");
				var id = this.FOalarmBaseID[k]+"_"+port+"_"+nr;
				if (k < 5 && k!=1){
					ledSetDisplay(id, displayValue);
				} else {
					var cell = document.getElementById(id);
					cell.style.display = displayValue;
				}
				if (k==1 && monitor.fibInfo.isRemote){
					var cell = document.getElementById(id);
					cell.style.display = "none";
				}
			}
			self.opticalAlarmDisplay(port, nr, monitor.fibInfo.FOmoduleConnected[fport]);
		}
	}
	this.showFOconfig = function(nr) {
		if (unitToMon[nr]==0) return;
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
		var w = 540;
		var h = 240;
		var left = (screen.width/2)-(w/2);
		var top = (screen.height/2)-(h/2);
		var url = "/optLinkM.html?nr="+nr+"&port="+port;
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
		if (!self.config[nr].supportsBBU()) max_opts=1;
		for (var i = 0; i < max_opts; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.onchange = function(ev) {
			var n = unitToMon[this.nr];
			var n1=n&0xff;var n2=(n>>8)&0xff;
			var txt = n==0?"MASTER":n1==0?"EXPANSION "+n2+".0":"REMOTE "+n2+"."+n1;
			var alertMsg = "NOTICE:\nWith this action, relay assignment settings of "+txt+" unit will be configured to default values.\nPlease confirm.";
			if (confirm(alertMsg)) {
				cfgParams = new submitParams();
				cfgParams.ndev = this.nr;
				cfgParams.setDefaultRelay = true;
				submitform(cfgParams);
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
						var b = unitToMon[nr]==0?1:0; //solo UL o DL
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
			var cfgParams = new submitParams();
			cfgParams.ndev = 0;
			submitform(cfgParams);
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
			self.forceRfOffSwToggle(this.baseId);
			cfgParams = new submitParams();
			cfgParams.ndev = this.nr;
			cfgParams.forceSend = true;
			submitform(cfgParams);		
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
	this.forceRfOffSwGet = function(id) {
		try {
			var el = document.getElementById("hpaSwInp_"+id);
			return el.checked;
		} catch (err) {	return false; }
	}
	this.forceRfOffSwSet= function(id,on) {
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
	this.okColor = [];
	this.cfgTitles = ["Att. / Power","Filter ","Filter ","Squelch","Alarm"];
	this.paramListCfg = [
		"This group includes:<ul><li>UL/DL Attenuation<li>Input AGC per channel<li>RF Enable<li>AGC Mode</ul>",
		"This group includes all filter parameters:<ul><li>Enable<li>Center Frequency<li>Bandwidth<li>Fine Gain</ul>",
		"This group includes squelch and C/N UL Low parameters:<ul><li>Squelch Enable<li>Squelch Threshold<li>C/N UL Low Threshold<li>C/N UL Low Time Threshold</ul>",
		"This group includes alarm parameters:<ul><li>Oscillation Prevention Feature<li>Extreme Temperature Action<li>BBU connection<li>Alarm Enables<li>Power Measurement Settings<li>Relay Assignments<li>General System Alarm Assignements<li>Alarm Thresholds<li>Buzzer Settings</ul>"
	];
	this.FilterValidSep;
	this.FILTSEPADJKHZ = 100;
	this.FILTSEPNBADJKHZ = 200;
	this.tags = null;
	this.sernr = new SerialNrT();
	var freqStyle = [[0,0,0],[0,0,0]];
	for (var nr=0;nr<nrOfDevices;nr++){
		for (var band=0;band<2;band++){
			freqStyle[band][unitToMon[nr]] = parseInt(localStorage.getItem('freqStyle_'+band+'_'+unitToMon[nr]+'_'+Prjstr+window.location.host));
			if (isNaN(freqStyle[band][unitToMon[nr]]) || freqStyle[band][unitToMon[nr]] != 0) {
				freqStyle[band][unitToMon[nr]] = 1;
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
	this.minButtonStates = [];
	this.doFrequencyCheck = [];
	this.currentRemoteAtt = [];
	this.currentPAEnable = [];
	this.firstStatus = true;
	for (var nr=0;nr<nGUIRemotes;nr++){
		this.mainGainMax.push([[0,0],[0,0]]);
		this.showFiltersMask.push([[false,false],[false,false]]);
		this.doFrequencyCheck.push(false);
	}
	this.ISOL_GAIN_MARGIN_OLD = 15;
	this.ISOL_GAIN_MARGIN_NEW = 20;

	this.lastFirmwareNr = -1;
	this.deepDischarge;
	this.isBbuConnected = [];
	this.nfpa = [];

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
function setMetLowWarn(id, val) {
	try {
		var met = document.getElementById("met_"+id).mMeter;
		met.mLowWarning = val;
	} catch (err) { }
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
function createLed(id){
	var led = document.createElement("img");
	led.id = id;
	led.src = "bullet_grey.png";
	led.className = "centered";
	led.align = "center";
	return led;
}
function createLedBox(id) {
	var tdNode = document.createElement("td");
	tdNode.id = "ledcell_"+id;
	tdNode.appendChild(createLed(id));
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
	var cfg = new Config(0);
	try{
		for (var nr=0;nr<nrOfDevices;nr++){
			if (unitToMon[nr]>0){
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
		}
	} catch (err) { }
}
function blockRemotSquelch(val){
	var cfg = new Config(0);
	try{
		for (var nr=0;nr<nrOfDevices;nr++){
			if (unitToMon[nr]>0){
				for (var band=0;band<2;band++){
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
		}
	} catch (err) { }
}
function blockRemoteGral(val){
	try{
		for (var nr=0;nr<nrOfDevices;nr++){
			if (unitToMon[nr]>0){
				for (var band=0;band<2;band++){
					for (var dn=0;dn<2;dn++){
						disable_element("mainGainLimit_"+band+"_"+dn+"_"+nr,val);
						disable_element("mainPowerLimit_"+band+"_"+dn+"_"+nr,val);
					}
				}
			}
		}
	} catch (err) { }
}
function blockRemoteAlarm(val){
	try{
		for (var nr=0;nr<nrOfDevices;nr++){
			if (unitToMon[nr]>0){
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
function disableSernrAndVersion() {
	for ( var n in remoteGlobalConfResponseValid) {
		try {
			var id = "versionEntry_"+n;
			document.getElementById(id).disabled = true;
			id = "serialNrEntry_"+n;
			document.getElementById(id).disabled = true;
		} catch(err) {}
	}
}
function refreshEnables(){
	disableSernrAndVersion();
	for (var nr=0;nr<nrOfDevices;nr++){
		if (unitToMon[nr]>0){
			for (var band=0;band<2;band++){
				try{
					var el = document.getElementById("maxPower_"+band+"_"+nr);
					if (el){
						el.disabled = true;
						el.style.backgroundColor = "#CCCCCC";
					}
				} catch (err) {}
			}
		}else if(window.top.monitorMode==1){
			for (var band=0;band<2;band++){
				try{
					var el = document.getElementById("mainGainLimit_"+band+"_0_0");
					if (el){
						el.disabled = true;
						el.style.backgroundColor = "#CCCCCC";
						el.title += "\nTo modify this parameter go to DAS Overview section";
					}
				} catch (err) {}
			}
		}
	}
}
