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

function Page() {
	this.show = function(tags, fact, version, confs, freqs, serNr) {
		self.tags = tags;
		self.factory = fact;
		self.MAIN_GAIN_MIN[0] = fact.data.band[0].gainLim-20;
		self.MAIN_GAIN_MIN[1] = fact.data.band[1].gainLim-20;
		self.version = version;
		self.confs = confs;
		var currentPageType = self.pageType;
		if (typeof(freqs) === 'undefined') {
			self.pageType = this.pageTypes['ADJ'];
		} else {
			self.pageType = this.pageTypes['NB'];
			self.freqs = freqs;
		}
		self.maxChannels = self.confs.CHNR;
		if (typeof(serNr) !== 'undefined') {
			self.sernr = serNr;
		}
		self.draw(currentPageType != self.pageType);
	}
	this.isAdj = function() {
		return (self.pageType == this.pageTypes['ADJ']);
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
		var redraw = self.computeShowFiltersBitmask() || pageTypeChange;
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
			var unit = self.createUnit();
			rootEl.appendChild(unit);
		}
		if (!document.getElementById(msgEl.id)) {
			document.getElementById(self.parentId).appendChild(msgEl);
		}
		self.showTag();
		if (self.isAdj()) {
			self.showConfAdj();
		} else {
			self.showFreqs();
			self.showConfs();
		}
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
	this.computeShowFiltersBitmask = function() {
		var redraw = false;
		var channelsEnabledMask = self.confs.getChannelsEnabledMask();
		if (!self.showFiltersMask 
		    || self.showFiltersMask != channelsEnabledMask) {
		    	redraw = true;
		}
		if (self.sernr.isFilterUnique180()) {
			self.showFiltersMask = 0x01;
		} else {
			self.showFiltersMask = channelsEnabledMask;
		}
		return redraw;
	}
	this.createUnit = function() {
		nr = 0;
		var unitDiv = document.createElement("div");
		unitDiv.id = "unitDiv"+nr;
		unitDiv.className = "unitbox";
		var headDiv = this.createUnitHead();
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDiv"+nr;
		var tab = this.createContentCtrl();
		contentDiv.appendChild(tab);
		return unitDiv;
	}
	this.blockContent = function(doblock) {
		var contentDiv = document.getElementById("contentDiv0");
		if (contentDiv !== null) {
			contentDiv.style.display = doblock ? "none":"block";
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
	this.createContentCtrl = function() {
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var row = document.createElement("tr");
		tab.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);		
		var tab1 = document.createElement("table");
		tab1.className = "contenttable2";
		tab1.style.width = "100%";
		cell.appendChild(tab1);		
		var row = document.createElement("tr");
		tab1.appendChild(row);		
		for (var i = 0; i < 2; ++i) {
			var cell = document.createElement("td");
			row.appendChild(cell);
			cell.className = "contentcell";
			var el = this.createBandBox(i);
			cell.appendChild(el);
		}
		var row = document.createElement("tr");
		tab.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);
		//cell.colSpan = 2;
		//cell.className = "contentcell";
		var tab1 = document.createElement("table");
		tab1.className = "contenttable2";
		tab1.style.width = "100%";
		cell.appendChild(tab1);
		var row = document.createElement("tr");
		tab1.appendChild(row);
		var cell = document.createElement("td");
		cell.className = "contentcell";
		row.appendChild(cell);
		cell.rowSpan = 3;
		var el = this.createGralCtlBox();
		cell.appendChild(el);
		var cell = document.createElement("td");
		cell.className = "contentcell";
		cell.id = "opfSettingsCell1";
		var el = this.createOpfSettingsAntIsol();
		cell.appendChild(el);
		row.appendChild(cell);
		var row = document.createElement("tr");
		tab1.appendChild(row);
		var cell = document.createElement("td");
		cell.id = "opfSettingsCell2";		
		row.appendChild(cell);		
		row.style.height = "3px";		
		var row = document.createElement("tr");
		tab1.appendChild(row);
		var cell = document.createElement("td");
		cell.id = "opfSettingsCell3";		
		cell.className = "contentcell";	
		var el = this.createOpfSettingsOscDet();
		cell.appendChild(el);
		row.appendChild(cell);	
		row = document.createElement("tr");
		row.id = "filtersRow";
		row.style.display = "none";
		tab.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);
		var tab1 = document.createElement("table");
		tab1.className = "contenttable2";
		tab1.style.width = "100%";
		cell.appendChild(tab1);
		var row = document.createElement("tr");
		tab1.appendChild(row);		
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "contentcell";
		//cell.colSpan = 3;
		cell.style.minHeight = "50px";
		cell.appendChild(this.createFilterTables());
		return tab;
	}
	this.showFilters = function(on) {
		var el = document.getElementById("filtersRow");
		el.style.display = on ? "table-row" : "none";
	}
	this.createFilterTables = function() {
		var mainTbl = document.createElement("table");
		var tb = document.createElement("tb");
		mainTbl.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		for (var b = 0; b < 3; ++b) {
			var cell = document.createElement("td");
			row.appendChild(cell);
			cell.style.color = "black";
			cell.style.fontWeight = "bold";
			cell.style.textAlign = "center";
			cell.className = "cth";
			var str;
			switch(b) {
			case 0: str = "FILTER"; break;
			case 1: str = Texts['FILTUL']; break;
			case 2: str = Texts['FILTDL']; break;
			}
			cell.innerHTML = str;
		}
		row = document.createElement("tr");
		tb.appendChild(row);
		for (var i = 0; i < 3; ++i) {
			var cell = document.createElement("td");
			row.appendChild(cell);
			cell.appendChild(this.createFilterTable(i));
		}
		return mainTbl;
	}
	this.computeChFreq = function(chnr, b) {
		var fo = self.factory.data.band[b].fo;
		var fstep = self.factory.data.fstep;
		var fr = chnr * fstep + fo;
		return fr;
	}
	this.computeChNr = function(fr, b, c) {
		var fo = self.factory.data.band[b].fo;
		var fstep = self.factory.data.fstep;
		var chnr = ~~Math.round((fr - fo)/fstep);
		if (isNaN(chnr)) {
			chnr = self.freqs.getChNr(b, c);
		}
		return chnr;
	}
	this.computeChNrOtherBand = function(chnr, b, c) {
		var fr = self.computeChFreq(chnr, b);
		var diff = fr - self.factory.data.band[b].fStart;
		var a = (b + 1) % 2;
		fr = self.factory.data.band[a].fStart + diff;
		var num = self.computeChNr(fr, a, c);
		return num;
	}
	this.createGralCtlBox = function() {
		var sqmode = this.createMuteMode();
		var temp = this.createTempBoard();
		var hwfail = this.createFpgaError();
		var simplex = this.createSimplex();
		var dualFw = [];
		dualFw.push(this.createDualFw(0));
		dualFw.push(this.createDualFw(1));
		var box = document.createElement("div");
		var tab = document.createElement("table");
		tab.style.marginLeft = "auto";
		tab.style.marginRight = "auto";
		tab.style.paddingLeft = "0px";
		box.appendChild(tab);
		tab.style.borderSpacing = "3px";
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row, cell, el;
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		cell.style.paddingLeft = "10px";
		row.appendChild(cell);
		el = this.createFreqSplit();
		cell.appendChild(el);
		cell = document.createElement("td");
		cell.style.paddingLeft = "10px";
		row.appendChild(cell);
		cell.appendChild(sqmode);
		cell = document.createElement("td");
		cell.style.paddingLeft = "10px";
		row.appendChild(cell);
		el = this.createUnitReset();
		cell.appendChild(el);
		cell = document.createElement("td");
		cell.style.paddingLeft = "10px";
		row.appendChild(cell);
		cell.appendChild(simplex);
		cell = document.createElement("td");
		cell.style.paddingLeft = "10px";
		row.appendChild(cell);
		cell.appendChild(dualFw[0]);

		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		cell.style.paddingLeft = "20px";
		var showSimplex = self.factory.isSimplexAllowed() && self.version.isFwSimplex();
		var showDualFw = self.factory.isDualFwAllowed();
		var sz = self.getGralConfCellSize(showSimplex, showDualFw);
		cell.style.width = sz;
		row.appendChild(cell);
		cell.appendChild(temp);
		cell = document.createElement("td");
		cell.style.paddingLeft = "10px";
		cell.style.width = sz;
		row.appendChild(cell);
		el = this.createTbsError();
		cell.appendChild(el);
		cell = document.createElement("td");
		cell.style.paddingLeft = "10px";
		cell.style.width = "15%";
		row.appendChild(cell);
		cell.appendChild(hwfail);
		cell = document.createElement("td");
		cell.style.paddingLeft = "10px";
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.style.paddingLeft = "10px";
		row.appendChild(cell);
		cell.appendChild(dualFw[1]);

		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		cell.colSpan = 5;
		row.appendChild(cell);
		cell.appendChild(this.createShowFiltTable());
		cell.style.paddingRight = "10px";
		return box;
	}
	this.getGralConfCellSize = function(showSimplex, showDualFw) {
		var sz;
		if (showSimplex) {
			sz = showDualFw ? "25%" : "30%";
		} else {
			sz = showDualFw ? "30%" : "40%";
		}
		return sz;
	}
	this.createShowFiltTable = function() {
		var tab = document.createElement("table");
		tab.style.marginLeft = tab.style.marginRight = "auto";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var n = 0;
		var nrows = self.isAdj() ? 1 : 2;
		var nch = self.isAdj() ? self.confs.CHNR : self.confs.CHNR / 2;
		var ncols = 0;
		for (var r = 0, c = 0; r < nrows; ++r) {
			var row = document.createElement("tr");
			if (self.sernr.isFilterUnique180()) {
				row.style.display = "none";
			}
			tb.appendChild(row);
			var head = document.createElement("th");
			row.appendChild(head);
			var str = Texts['SHOWCH']+"&nbsp;(";
			if (self.isAdj()) {
				str += "1-"+nch+")";
			} else {
				str += (r == 0? "1":"17")+"-"+(r == 0? "16":"32")+")";
			}
			head.innerHTML = str;
			head.className = "thdrht";
			head.style.textAlign = "left";
			head.style.minWidth = "120px";
			for (var n = 0; n < nch; ++n, ++c) {
				var cell = document.createElement("td");
				cell.appendChild(this.createFilterShow(c));
				row.appendChild(cell);
			}
			if (self.isAdj()) {
				var cell = document.createElement("td");
				cell.style.minWidth = "20px";
				row.appendChild(cell);
				var cell = document.createElement("td");
				cell.appendChild(this.createFreqStyleSw(c));
				row.appendChild(cell);
			}
			ncols = row.cells.length;
		}
		return tab;
	}
	this.createFilterShow = function(c) {
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = el.name = "filtShow_"+c;
		el.nr = c;
		el.onclick = function(ev) {
			self.setFilterShow(this.nr, this.checked);
			self.displayFilters();
		}
		return el;
	}
	this.setShowFilter = function(c, on) {
		try {
			var el = document.getElementById("filtShow_"+c);
			el.checked = on;
		} catch(err) {}
	}
	this.getShowFilter = function(c) {
		try {
			var el = document.getElementById("filtShow_"+c);
			return el.checked;
		} catch(err) { return false; }
	}
	this.createFilterTable = function(b) {
		var chFiltTable = document.createElement("table");
		chFiltTable.className = "bt";
		chFiltTable.style.padding = "1px 1px 1px 1px";
		chFiltTable.style.marginBottom = "3px";
		chFiltTable.align = "center";
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
		this.createFilterTableHeader(row, b);
		for (var r = 0; r < this.maxChannels; r++) {
			row = document.createElement("tr");
			row.style.height = "22px";
			row.id = "filterRow_"+r+"_"+b;
			var do_show = this.showFiltersMask & (1 << r);
			if (!do_show) {
				row.style.display ="none";
			}
			tb.appendChild(row);
			if (b == 0) {
				this.createFilterEnable(row, r);
			} else {
				this.createFilterChannel(row, b-1, r);
			}
		}
		return chFiltTable;
	}
	this.setFilterShow = function(r, do_show) {
		var mask = (1 << r);
		if (do_show) {
			self.showFiltersMask |= mask;
		} else {
			self.showFiltersMask &= ~mask;
		}
		try {
			for (var b = 0; b < 3; ++b) {
				var row = document.getElementById("filterRow_"+r+"_"+b);
				row.style.display = do_show ? "table-row" : "none";
			}
		} catch(err) {}
	}
	this.createFilterTableHeader = function(chFiltRow, b) {
		chFiltRow.style.textAlign = "center";
		if (b == 0) {
			var td = document.createElement("td");
			chFiltRow.appendChild(td);
			td.innerHTML = "Nr.";
			td = document.createElement("td");
			chFiltRow.appendChild(td);
			td.innerHTML = "On";
			td = document.createElement("td");
			chFiltRow.appendChild(td);
			return;
		}
		var td = document.createElement("td");
		td.id = "HeaderF1_"+b;
		chFiltRow.appendChild(td);
		if (self.isAdj() && self.freqStyle == 0) {
			td.innerHTML = "Fstart&nbsp;(MHz)";
		} else {
			td.innerHTML = "Fr.&nbsp;(MHz)";
		}
		td = document.createElement("td");
		td.id = "HeaderF2_"+b;
		chFiltRow.appendChild(td);
		if (self.isAdj()) {
			if (self.freqStyle == 0) {
				td.innerHTML = "Fstop&nbsp;(MHz)";
			} else {
				td.innerHTML = "BW&nbsp;(MHz)";
			}
		} else {
			td.innerHTML = "BW&nbsp;(KHz)";
		}
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "G&nbsp;(dB)";
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "Power&nbsp;IN";
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "dBm";	
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "Det";
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "Power&nbsp;OUT";
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "dBm";
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "AGC";
		td = document.createElement("td");
		chFiltRow.appendChild(td);
		td.innerHTML = "dB";	
	}
	this.createFilterEnable = function(chFiltRow, c) {
		var cell = document.createElement("td");
		cell.innerHTML = c+1;
		cell.style.textAlign = "center";
		chFiltRow.appendChild(cell);
		cell = document.createElement("td");
		chFiltRow.appendChild(cell);
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = el.name = "filtEn_"+c;
		cell.appendChild(el);
	}
	this.filtEnableSet = function(c, on) {
		try {
			var el = document.getElementById("filtEn_"+c);
			el.checked = on != 0;
		} catch(err) {}
	}
	this.isFiltEnabled = function(c) {
		var on = false;
		try {
			var el = document.getElementById("filtEn_"+c);
			on = el.checked;
		} catch(err) {}
		return on;
	}
	this.createFilterChannel = function(chFiltRow, b, c) {
		if (this.isAdj()) {
			chFiltRow.appendChild(this.createAdjFr(b, c, 0));
			chFiltRow.appendChild(this.createAdjFr(b, c, 1));
		} else {
			chFiltRow.appendChild(this.createFiltFrequency(b, c));
			chFiltRow.appendChild(this.createChBw(b, c));
		}
		chFiltRow.appendChild(this.createGfine(b, c));
		chFiltRow.appendChild(this.createMetPowIn(b, c));
		chFiltRow.appendChild(this.createTextPowIn(b, c));
		chFiltRow.appendChild(this.createSignalDetect(b, c));
		chFiltRow.appendChild(this.createMetPowOut(b, c));
		chFiltRow.appendChild(this.createTextPowOut(b, c));
		chFiltRow.appendChild(this.createMetAgc(b, c));
		chFiltRow.appendChild(this.createTextAgc(b, c));
	}
	this.createFiltFrequency = function(b, c) {
		var cell = document.createElement("td");
		var fr = document.createElement("input")
		fr.type = "text";
		fr.id = "chFreq_"+c+"_"+b;
		fr.name = fr.id;
		fr.style.width = "65px";
		fr.className = "number";
		fr.channel = c;
		fr.path	= b;
		if (this.factory.hasExcludeFreq(b)){
			fr.title = "Frequency Range: "+(this.factory.data.band[b].fStart/1e6) +
			"-"+(this.factory.data.band[b].fStartExc/1e6)+"MHz / " +
			(this.factory.data.band[b].fStopExc/1e6) + "-" + 
			(this.factory.data.band[b].fStop/1e6)+"MHz";
		}else{
			fr.title = "Frequency Range: "+(this.factory.data.band[b].fStart/1e6) +
			"-"+(this.factory.data.band[b].fStop/1e6)+"MHz";
		}
		fr.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		fr.onchange = function(ev) {
			var b = this.path;
			var c = this.channel;
			var fr = self.getFreqCh(b, c);
			if (fr < self.factory.data.band[b].fStart) {
				fr = self.factory.data.band[b].fStart;
			} else if (fr > self.factory.data.band[b].fStop) {
				fr = self.factory.data.band[b].fStop;
			}
			if (self.factory.hasExcludeFreq(b)){
				var distStart = (fr - self.factory.data.band[b].fStartExc);
				var distStop = (self.factory.data.band[b].fStopExc - fr);
				if (distStart>0 && distStop>0) {
					if (distStart<=distStop) fr = self.factory.data.band[b].fStartExc;
					if (distStart>distStop) fr = self.factory.data.band[b].fStopExc;
				}
			}
			var chnr = self.computeChNr(fr, b, c);
			fr = self.computeChFreq(chnr, b);
			self.setFreqCh(b, c, fr);
			if (!self.isFreqSplitFixed()) {
				return;
			}
			chnr = self.computeChNrOtherBand(chnr, b, c);
			var a = (b + 1) % 2;
			fr = self.computeChFreq(chnr, a);
			self.setFreqCh(a, c, fr);
		}
		cell.appendChild(fr);
		return cell;
	}
	this.setFreqCh = function(b, c, frq) {
		try {
			if (self.factory.isVHF()){
				var val = (5e3*Math.round(frq/5e3)/1e6).toFixed(3);
			}else{
				var val = (frq / 1.0e6).toFixed(6);
			}
			var el = document.getElementById("chFreq_"+c+"_"+b);
			if (el) {
				el.value = val;
			}
		} catch (err) { }
	}
	this.getFreqCh = function(b, c) {
		try {
			var el = document.getElementById("chFreq_"+c+"_"+b);
			if (self.factory.isVHF()){
				return ~~Math.round(parseFloat(el.value) * 1.0e6 / 5e3)*5e3;
			}else{
				return ~~Math.round(parseFloat(el.value) * 1.0e6);
			}			
		} catch (err) { return Number.NaN; }
	}
	this.createGfine = function(b, c) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		cell.appendChild(el);
		el.id = "Gfine_"+c+"_"+b;
		el.name = el.id;
		el.type = "text";
		el.style.width = "20px";
		el.className = "number";
		el.path = b;
		el.chNr = c;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.title = "Min: "+self.confs.GfineRange+", Max: 0 dB";
		el.onchange = function(ev) {
			var num = parseInt(this.value);
			if (isNaN(num)) {
				num = 0;
			}
			if (num < self.confs.GfineRange) {
				this.value = self.confs.GfineRange;
			} else if (num > 0) {
				this.value = 0;
			} else {
				this.value = num;
			}
		}
		cell.appendChild(el);
		return cell;
	}
	this.setGfine = function(b, c, val) {
		try {
			var el = document.getElementById("Gfine_"+c+"_"+b);
			if (el && !isNaN(val)) {
				el.value = val.toString();
			}
		} catch (err) { }
	}
	this.getGfine = function(c, b) {
		try {
			var el = document.getElementById("Gfine_"+c+"_"+b);
			if (el) {
				return parseInt(el.value);
			}
			return 0;
		} catch (err) { return 0; }
	}
	this.createFreqSplit = function() {
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
		el.id = "freqSplit";
		el.name = el.id;
		el.self = this;
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
			for (var c = 0; c < self.maxChannels; ++c) {
				if (self.isAdj) {
					self.adjSplitChRedraw(c, fixed);
				} else {
					self.frSplitChRedraw(c, fixed);
				}
			}
		}
		cell.style.verticalAlign = "middle";
		cell.appendChild(el);
		return box;
	}
	this.setFreqSplit = function(mode) {
		try {
			var el = document.getElementById("freqSplit");
			el.selectedIndex = mode ? 1 : 0;
		} catch (err) { }
	}
	this.isFreqSplitFixed = function() {
		try {
			var el = document.getElementById("freqSplit");
			return el.selectedIndex == 0;
		} catch (err) { return 0;}
	}
	this.frSplitChRedraw = function (c, fixed) {
		var b = 1;
		for (var b = 1; b >= 0; --b) {
			var fr = self.getFreqCh(b, c);
			if (fr < self.factory.data.band[b].fStart) {
				fr = self.factory.data.band[b].fStart;
			} else if (fr > self.factory.data.band[b].fStop) {
				fr = self.factory.data.band[b].fStop;
			}
			if (self.factory.hasExcludeFreq(b)){
				var distStart = (fr - self.factory.data.band[b].fStartExc);
				var distStop = (self.factory.data.band[b].fStopExc - fr);
				if (distStart>0 && distStop>0) {
					if (distStart<distStop) fr = self.factory.data.band[b].fStartExc;
					if (distStart>distStop) fr = self.factory.data.band[b].fStopExc;
				}
			}			
			var chnr = self.computeChNr(fr, b, c);
			fr = self.computeChFreq(chnr, b);
			self.setFreqCh(b, c, fr);
			if (!fixed) {
				continue;
			}
			chnr = self.computeChNrOtherBand(chnr, b, c);
			var a = 0;
			fr = self.computeChFreq(chnr, a);
			self.setFreqCh(a, c, fr);
			break;
		}
	}
	this.createMuteMode = function() {
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
		el.id = "mutemode";
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
	this.isMuteModeLinked = function() {
		try {
			var el = document.getElementById("mutemode");
			return el.selectedIndex == 1;
		} catch (err) { return null;}
	}
	this.setMuteMode = function(mode) {
		try {
			var el = document.getElementById("mutemode");
			el.selectedIndex = mode;
		} catch (err) { }
	}
	this.mutemodeDisable = function(doDisable) {
		try {
			var el = document.getElementById("mutemode");
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
		reset.onclick = function() { submitform(true, false); } 
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
	this.createTbsError = function() {
		var box = document.createElement("div");
		box.id = "tbsBox";
		var row = document.createElement("tr");
		box.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['TBS'];
		cell.className = "thdrht";
		cell = createLedBox("tbsErr");
		cell.style.paddingLeft = "40px";
		row.appendChild(cell);
		return box;
	}
	this.tbsErrSet = function(alarm) {
		ledSetColor("tbsErr", alarm ? "red" : "grey");
	}
	this.rxlowHide = function(doHide) {
		try {
			var box = document.getElementById("tbsBox");
			box.style.visibility = doHide ? "hidden" : "visible";
		} catch(err) {}
	}
	this.createFpgaError = function() {
		var box = document.createElement("div");
		var row = document.createElement("tr");
		box.appendChild(row);
		var cell = document.createElement("th");
		cell.style.width = "70%";
		row.appendChild(cell);
		cell.innerHTML = Texts['FPGA'];
		cell.className = "thdrht";
		cell = createLedBox("fpgaErr");
		cell.style.paddingLeft = "15px";
		cell.style.paddingRight = "20px";
		row.appendChild(cell);
		return box;
	}
	this.fpgaErrSet = function(alarm) {
		ledSetColor("fpgaErr", alarm ? "red" : "grey");
	}
	this.createBandBox = function(dn) {
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
		cell.className = "cth";
		cell.innerHTML = Texts['INPUT'];
		row.appendChild(document.createElement("td"));
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.className = "cth";
		cell.innerHTML = Texts['OUTPUT'];
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "tabbox";
		var el = this.createBandCtrlBox(dn);
		cell.appendChild(el);
		row.appendChild(document.createElement("td"));
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "tabbox";
		el = this.createBandOutBox(dn);
		cell.appendChild(el);
		return box;
	}
	this.createBandCtrlBox = function(dn) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row;
		row = this.createSquelchEnable(dn);
		body.appendChild(row);
		row = this.createSquelchThreshold(dn);
		body.appendChild(row);
		row = this.createMainGainLim(dn);
		body.appendChild(row);
		row = this.createMainPowerLim(dn);
		body.appendChild(row);
		row = this.createInputOverflow(dn);
		body.appendChild(row);
		if (!this.isAdj()) {
			row = this.createEqBw(dn);
		}
		body.appendChild(row);
		return box;
	}
	this.createBandOutBox = function(dn) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row = this.createHpaCtl(dn);
		body.appendChild(row);
		hpa_settings[dn].max = this.factory.data.band[dn].powerLim + 5;
		hpa_settings[dn].min = hpa_settings[dn].max - 45;
		hpa_settings[dn].high_warn = this.factory.data.band[dn].powerLim;
		hpa_settings[dn].high_alarm = this.factory.data.band[dn].powerLim + this.factory.MAX_PWR_DELTA;
		row = createMetRow("rfOutPow"+dn, hpa_settings[dn], Texts['POWER'], "dBm");
		body.appendChild(row);
		row = document.createElement("tr");
		body.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		if (dn == 1) {
			if (this.factory.data.band[dn].fipmon) {
				cell.innerHTML = Texts['COMMERR'];
			} else {
				cell.innerHTML = Texts['DLPASTATUS'];
			}
		} else {
			cell.innerHTML = Texts['ULPASTATUS'];
		}
		cell.className = "thdrht";
		cell = createLedBox("hpaStatusLed_"+dn);
		row.appendChild(cell);
		if (dn == 1 && !this.factory.data.band[dn].fipmon) row.style.display = "none";
		if (dn == 0) {
			return box;
		}
		if (!this.factory.data.band[dn].fipmon) {
			row = document.createElement("tr");
			body.appendChild(row);
		}
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.className = "thdrht";
		cell.innerHTML =  Texts['AGCFAIL'];
		if (this.factory.data.band[dn].fipmon) {
			cell.colSpan = 2;
			cell = document.createElement("th");
			row.appendChild(cell);
		}
		cell = createLedBox("hpaOvf"+dn);
		row.appendChild(cell);
		if (this.factory.data.band[dn].fipmon) {
			row = document.createElement("tr");
			body.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = Texts['VSWR'];
			cell.className = "thdrht";
			cell = createLedBox("hpaVswrLed"+dn);
			row.appendChild(cell);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = Texts['TXLOW'];
			cell.className = "thdrht";
			cell.colSpan = 2;
			cell = document.createElement("th");
			row.appendChild(cell);
			cell = createLedBox("hpaTxLowLed"+dn);
			row.appendChild(cell);
			row = document.createElement("tr");
			body.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = Texts['DLPASTATUS'];
			cell.className = "thdrht";
			cell = createLedBox("paFail_"+dn);
			row.appendChild(cell);
		}
		return box;
	}
	this.statusHpaLedSet  = function(dn, alarm) {
		ledSetColor("hpaStatusLed_"+dn, alarm ? "red" : "grey");
	}
	this.hpaCommerrLedSet = function(alarm) {
		ledSetColor("hpaStatusLed_1", alarm ? "red" : "grey");
	}
	this.paFailLedSet = function(alarm) {
		ledSetColor("paFail_1", alarm ? "red" : "grey");
	}
	this.rfOutPowSet = function(dn, val, isOn) {
		if (isOn && val >= -127) {
			setMetValue("rfOutPow"+dn, val);
		} else {
			setMetValue("rfOutPow"+dn, "OFF");
		}
	}
	this.hpaOvfDL = function(alarm) {
		ledSetColor("hpaOvf1", alarm ? "red" : "grey");
	}
	this.hpaVswrLedSet = function(alarm) {
		ledSetColor("hpaVswrLed1", alarm ? "red" : "grey");
	}
	this.hpaUdfLedSet = function(alarm) {
		ledSetColor("hpaTxLowLed1", alarm ? "red" : "grey");
	}
	this.createSquelchEnable = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['SQUELCH'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "sqEn"+(dn? 1 : 0);
		el.name = el.id;
		el.type = "checkbox";
		cell.appendChild(el);
		return row
	}
	this.squelchEnSet = function(dn, on) {
		try {
			var el = document.getElementById("sqEn"+(dn? 1 : 0));
			el.checked = on? true: false;
		} catch (err) {}
	}
	this.squelchEnIsSet = function(dn) {
		try {
			var el = document.getElementById("sqEn"+(dn? 1 : 0));
			return el.checked;
		} catch (err) {
			return false;
		}
	}
	this.sqEnDisable = function(b, doDisable) {
		try {
			var el = document.getElementById("sqEn"+(b? 1 : 0));
			if (doDisable) {
				el.disabled = true;
				el.style.backgroundColor = "#BBBBBB";
			} else {
				el.disabled = false;
				el.style.backgroundColor = "white";
			}
		} catch (err) {}
	}
	this.createEqBw = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "All&nbsp;Filters&nbsp;Same&nbsp;BW";
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "eqBw"+(dn? 1 : 0);
		el.name = el.id;
		el.title = "All Filters Same BW";
		el.type = "checkbox";
		el.bandNr = dn;
		el.onclick = function(ev) {
			if (this.checked) {
				self.equalBwAllCh(this.bandNr, 0);
			} else {
				self.originalBwAllCh(this.bandNr);
			}
		}
		cell.appendChild(el);
		if (self.sernr.isFilterUnique180()) {
			row.style.visibility = "hidden";
		}
		return row
	}
	this.equalBwAllCh = function(b, c) {
		var id = "chBw_"+c+"_"+b;
		var el = document.getElementById(id);
		var ix;
		try {
			ix = el.selectedIndex;
		} catch(err) { ix = 0; }
		for (var i = 0; i < self.maxChannels; ++i) {
			var id = "chBw_"+i+"_"+b;
			var el = document.getElementById(id);
			try {
				el.selectedIndex = ix;
			} catch(err) {}
		}
	}
	this.originalBwAllCh = function(b) {
		for (var c = 0; c < self.maxChannels; ++c) {
			self.chBwSet(b, c, self.confs.getChBw(b, c));
		}
	}
	this.eqBwSet = function(dn, on) {
		try {
			var el = document.getElementById("eqBw"+(dn? 1 : 0));
			el.checked = on? true: false;
		} catch (err) {}
	}
	this.eqBwIsSet = function(dn) {
		try {
			var el = document.getElementById("eqBw"+(dn? 1 : 0));
			return el.checked;
		} catch (err) {
			return false;
		}
	}
	this.getSquelchThresholdMin = function(b) {
		var simplex = false;
		try {
			var el = document.getElementById('simplex');
			simplex = el.checked;
		} catch(e) { simplex = false;}
		return self.confs.sqThrLimits(simplex, b).MIN;
	}
	this.getSquelchThresholdMax = function(b) {
		var simplex = false;
		try {
			var el = document.getElementById('simplex');
			simplex = el.checked;
		} catch(e) { simplex = false;}
		return self.confs.sqThrLimits(simplex, b).MAX;
	}
	this.updateSquelchThresholdTitles = function(simplex) {
		for (var b = 0; b < 2; ++b) {
			try {
				var min = self.confs.sqThrLimits(simplex, b).MIN;
				var max = self.confs.sqThrLimits(simplex, b).MAX;
				var el = document.getElementById('sqThr'+b);
				el.title = "Min: "+min+", Max: "+max+" dBm";
			} catch(e) {}
		}
	}
	this.createSquelchThreshold = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['THRS'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "sqThr"+(dn? 1 : 0);
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		var simplex = self.isSimplexMode(self.confs.getSimplexMode());
		var min = self.confs.sqThrLimits(simplex, dn).MIN;
		var max = self.confs.sqThrLimits(simplex, dn).MAX;
		el.title = "Min: "+min+", Max: "+max+" dBm";
		el.onchange = function(ev) {
			var target = this;
			var dn = (target.id == "sqThr1" ? 1 : 0);
			var num = self.squelchThrGet(dn);
			var min = self.getSquelchThresholdMin(dn);
			var max = self.getSquelchThresholdMax(dn);
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
	this.squelchThrSet = function(dn, val) {
		try {
			var el = document.getElementById("sqThr"+(dn? 1 : 0));
			if (!isNaN(val))
				el.value = val;
		} catch (err) {}
	}
	this.squelchThrGet = function(dn) {
		try {
			var el = document.getElementById("sqThr"+(dn? 1 : 0));
			return parseInt(el.value);
		} catch (err) {
			return -128;
		}
	}
	this.createMainGainLim = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['GAINLIM'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "mainGainLimit"+(dn? 1 : 0);
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		self.mainGainMax[dn] = self.factory.data.band[dn].gainLim;
		el.title = "Min: "+self.MAIN_GAIN_MIN[dn]+", Max: " +
			self.factory.data.band[dn].gainLim+" dB";
		el.onchange = function(ev) {
			var target = this;
			var dn = (target.id == "mainGainLimit1" ? 1 : 0);
			var num = self.mainGainLimGet(dn);
			if (num < self.MAIN_GAIN_MIN[dn]) {
				target.value = self.MAIN_GAIN_MIN[dn];
			} else if (num > self.mainGainMax[dn]) {
				target.value = self.mainGainMax[dn];
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
	this.mainGainLimSet = function(dn, val) {
		try {
			var el = document.getElementById("mainGainLimit"+(dn? 1 : 0));
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.mainGainLimGet = function(dn) {
		try {
			var el = document.getElementById("mainGainLimit"+(dn? 1 : 0));
			return parseInt(el.value);
		} catch (err) { return -128; }
	}
	this.statGainMainTitle = function(b, g) {
		try {
			var maxgain = self.factory.data.band[b].gainLim;
			if (maxgain > g) {
				maxgain = g;
			}
			if (maxgain < self.MAIN_GAIN_MIN[b]) {
				maxgain = self.factory.data.band[b].gainLim;
			}
			if (maxgain == self.mainGainMax[b]) {
				return;
			}
			self.mainGainMax[b] = maxgain;
			var title = "Min: "+self.MAIN_GAIN_MIN[b]+", Max: " + self.mainGainMax[b]+" dB";
			var id = "mainGainLimit"+(b ? 1 : 0);
			var el = document.getElementById(id);
			el.title = title;
		} catch(err) {}
	}
	this.createMainPowerLim = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['POWERLIM'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "mainPowerLimit"+(dn? 1 : 0);
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		var max = this.factory.data.band[dn].powerLim;
		var min = max - this.MAIN_POWER_RANGE;
		el.title = "Min: "+min+", Max: "+max+" dBm";
		el.onchange = function(ev) {
			var target = this;
			var dn = (target.id == "mainPowerLimit1" ? 1 : 0);
			var num = self.mainPowerLimGet(dn);
			var max = self.factory.data.band[dn].powerLim;
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
	this.mainPowerLimSet = function(dn, val) {
		try {
			var el = document.getElementById("mainPowerLimit"+(dn? 1 : 0));
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.mainPowerLimGet = function(dn) {
		try {
			var el = document.getElementById("mainPowerLimit"+(dn? 1 : 0));
			return parseInt(el.value);
		} catch (err) { return -128; }
	}
	this.createInputOverflow = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['OVF'] + (dn?"&nbsp;DL":"&nbsp;UL");
		cell.className = "thdrht";
		cell = createLedBox("rfOvfLed_"+dn);
		row.appendChild(cell);
		return row;
	}
	this.inputOverloadSet = function(b, alarm) {
		ledSetColor("rfOvfLed_"+b, alarm ? "red" : "grey");
	}
	this.createHpaCtl = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['ENABLE'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createHpaSwitch(dn);
		cell.appendChild(el);
		//cell = this.createPaEnLed(dn);
		//row.appendChild(cell);
		return row
	}
	this.createHpaSwitch = function(dn) {
		var box = document.createElement("div");
		box.id = "hpaSwBox"+(dn? 1 : 0);
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
		lbl.id = "hpaSwLbl"+(dn? 1 : 0);
		lbl.className = "togglebuttonlabel";
		lbl.setAttribute("unselectable", "on");
		lbl.style.whiteSpace = "nowrap";
		lbl.style.fontWeight = "bold";
		lbl.style.display = "inline-block";
		lbl.style.width = "40px";
		lbl.style.height = "12px";
		lbl.innerHTML = "ON";
		var el = document.createElement("input");
		el.id = "hpaSwInp"+(dn? 1 : 0);
		el.name = el.id;
		el.type = "checkbox";
		el.className = "hidden";
		el.style.marginRight = "2px";
		el.checked = true;
		var id = el.id;
		lbl.setAttribute("for", id);
		el.onclick = function() { self.hpaSwToggle(dn); submitform(); };
		box.appendChild(el);
		return box;
	}
	this.hpaSwToggle = function(dn) {
		try {
			var id = dn? 1 : 0;
			var box = document.getElementById("hpaSwBox"+id);
			var lbl = document.getElementById("hpaSwLbl"+id);
			var el =  document.getElementById("hpaSwInp"+id);
			if (el.checked) {
				lbl.innerHTML = "ON";
				box.style.backgroundColor = "#C0FFC0";
				lbl.style.color = "#000000";
				box.style.borderStyle = "inset";
			} else {
				lbl.innerHTML = "OFF";
				box.style.backgroundColor = colAlarm;
				lbl.style.color = "#ffffff";
				box.style.borderStyle = "outset";
			}
		} catch (err) { }
	}
	this.hpaIsOn = function(dn) {
		try {
			var el = document.getElementById("hpaSwInp"+(dn? 1 : 0));
			return el.checked;
		} catch (err) {	return false; }
	}
	this.hpaSwSet= function(dn, on) {
		try {
			var id = dn? 1 : 0;
			var box = document.getElementById("hpaSwBox"+id);
			var lbl = document.getElementById("hpaSwLbl"+id);
			var el =  document.getElementById("hpaSwInp"+id);
			el.checked = on ? true : false;
			if (el.checked) {
				lbl.innerHTML = "ON";
				lbl.style.color = "#000000";
				box.style.backgroundColor = "#D0FFD0";
				box.style.borderStyle = "inset";
			} else {
				lbl.innerHTML = "OFF";
				lbl.style.color = "#ffffff";
				box.style.backgroundColor = colAlarm;
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
	this.setPaEnLed = function(b, statOn) {
		//ledSetColor("paEnLed_"+b, (statOn ? "green" : "red"));
		var confOn = self.confs.getPaEn(b);
		if (statOn != confOn) {
			self.confs.setPaEn(b, statOn);
			self.hpaSwSet(b, statOn);
			initFormChangeCheck();
		}
	}
	this.BWtable = [
		{ix:   0, include: true, value:   0, txt: "90K", khz:  90},
		{ix:   1, include: true, value:   1, txt: "60K", khz:  60},
		{ix:   2, include: true, value:   2, txt: "45K", khz:  45},
		{ix:   3, include: true, value:   3, txt: "30K", khz:  30},
		{ix:   4, include: true, value:   4, txt: "20K", khz:  20},
		{ix:   5, include: true, value:   5, txt: "15K", khz:  15},
		{ix:  -1, include: false, value:   0, txt: "150K", khz:  90},
	];
	this.createChBw = function(b, c) {
		var cell = document.createElement("td");
		var el = document.createElement("select");
		cell.appendChild(el);
		el.id = "chBw_"+c+"_"+b;
		el.name = el.id;
		el.className = "centered";
		el.style.fontSize = "10px";
		el.style.minWidth = "50px";
		var special = self.sernr.isFilterUnique180();
		el.style.disabled = (special ? "true" : "false");
		for (var i = 0; i < this.BWtable.length; i++) {
			if (special) {
				this.BWtable[i].include = (this.BWtable[i].ix < 0);
			} else {
				this.BWtable[i].include = !(this.BWtable[i].ix < 0);
			}
		}
		for (var i = 0; i < this.BWtable.length; i++) {
			if (!this.BWtable[i].include) {
				continue;
			}
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = this.BWtable[i].txt;
			opt.value = this.BWtable[i].value;
			opt.khz = this.BWtable[i].khz;
			opt.index = this.BWtable[i].ix;
		}
		el.selectedIndex = 0;
		el.bandNr = b;
		el.chNr = c;
		el.onchange = function(ev) {
			if (!self.eqBwIsSet(this.bandNr)) {
				return;
			}
			self.equalBwAllCh(this.bandNr, el.chNr);
		}
		return cell;
	}
	this.chBwSet = function(b, c, bw) {
		var el = document.getElementById("chBw_"+c+"_"+b);
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
	this.chBwGet = function(b, c) {
		try {
			var el = document.getElementById("chBw_"+c+"_"+b);
			var k = el.selectedIndex;
			return el.options[k].value;
		} catch (err) {
			return null;
		}
	}
	this.chBwGetKHz = function(b, c) {
		try {
			var el = document.getElementById("chBw_"+c+"_"+b);
			var k = el.selectedIndex;
			return el.options[k].khz;
		} catch (err) {
			return null;
		}
	}
	this.chBwGetIndex = function(b, c) {
		try {
			var el = document.getElementById("chBw_"+c+"_"+b);
			var k = el.selectedIndex;
			return el.options[k].index;
		} catch (err) {
			return null;
		}
	}
	this.createMetPowIn = function(b, c) {
		var simplex = self.isSimplexMode(self.confs.getSimplexMode());
		var settings = simplex ? chRfIn_settings[0] : chRfIn_settings[b];
		return createMetCell("rfInPow_"+c+"_"+b, settings);
	}
	this.createTextPowIn = function(b, c) {
		return createTextCell("rfInPow_"+c+"_"+b);
	}
	this.rfChInPowSet = function(b, c, val, color) {
		setMetValue("rfInPow_"+c+"_"+b, val, color);
	}
	this.createSignalDetect = function(b, c) {
		return createLedBox("rfSignalIn_"+c+"_"+b);
	}
	this.rfSignalLedSet = function(b, c, color) {
		ledSetColor("rfSignalIn_"+c+"_"+b, color);
	}
	this.createMetPowOut = function(b, c) {
		chRfOut_settings[b].max = this.factory.data.band[b].powerLim + 5;
		chRfOut_settings[b].min = this.factory.data.band[b].powerLim - 55;
		chRfOut_settings[b].low_alarm = -128;
		chRfOut_settings[b].low_warn = -128;
		chRfOut_settings[b].high_alarm = 128;
		chRfOut_settings[b].high_warn = 128;
		return createMetCell("rfOutPow_"+c+"_"+b, chRfOut_settings[b]);
	}
	this.createTextPowOut = function(b, c) {
		return createTextCell("rfOutPow_"+c+"_"+b);
	}
	this.rfChOutPowSet = function(b, c, val, isOn) {
		var id = "rfOutPow_"+c+"_"+b;
		if (isOn) {
			setMetValue(id, val, "normal");
		} else {
			setMetValue(id, "OFF", "warning");
		}
	}
	this.createMetAgc = function(b, c) {
		return createMetCell("agc_"+c+"_"+b, agc_settings[b]);
	}
	this.createTextAgc = function(b, c) {
		return createTextCell("agc_"+c+"_"+b);
	}
	this.agcSet = function(b, c, val) {
		setMetValue("agc_"+c+"_"+b, val);
	}
	this.computeFreq = function(freqs, b, c) {
		var chnr = freqs.getChNr(b, c);
		if (chnr === null) {
			return;
		}
		var f = chnr * self.factory.data.fstep 
			+ self.factory.data.band[b].fo;
		var special = self.sernr.isFilterUnique180();
		if (special && c == 0) {
			var c1 = freqs.getChNr(b, 1);
			var f1 = (c1 * self.factory.data.fstep
				+ self.factory.data.band[b].fo);
			f = ~~Math.round((f + f1) / 2);
		}
		return f;
	}
	this.showFreqs = function() {
		var isFixed = self.freqs.isSplitFixed();
		self.setFreqSplit(!isFixed);
		for (var c = 0; c < self.maxChannels; ++c) {
			for (var b = 0; b < 2; ++b) {
				var f = self.computeFreq(self.freqs, b, c);
				self.setFreqCh(b, c, f);
			}
		}
	}
	this.getFreqs = function() {
		if (self.sernr.isFilterUnique180()) {
			return self.getFreqsSpecial();
		}
		var freq = new Frequency(self.freqs);
		var isSplitFixed = self.isFreqSplitFixed();
		freq.setSplit(isSplitFixed);
		for (var c = 0; c < self.maxChannels; ++c) {
			for (var b = 1; b >= 0; --b) {
				var fr = self.getFreqCh(b, c);
				if (fr < self.factory.data.band[b].fStart) {
					fr = self.factory.data.band[b].fStart;
				} else if (fr > self.factory.data.band[b].fStop) {
					fr = self.factory.data.band[b].fStop;
				}
				if (self.factory.hasExcludeFreq(b)){
					var distStart = (fr - self.factory.data.band[b].fStartExc);
					var distStop = (self.factory.data.band[b].fStopExc - fr);
					if (distStart>0 && distStop>0) {
						if (distStart<distStop) fr = self.factory.data.band[b].fStartExc;
						if (distStart>distStop) fr = self.factory.data.band[b].fStopExc;
					}
				}				
				var chnr = self.computeChNr(fr, b, c);
				freq.setFreq(b, c, chnr);
				if (isSplitFixed) {
					chnr = self.computeChNrOtherBand(chnr, b, c);
					var a = (b + 1) % 2;
					fr = self.computeChFreq(chnr, a);
					freq.setFreq(a, c, chnr);
					self.setFreqCh(a, c, fr);
					break;
				}
			}
		}
		return freq;
	}
	this.getFreqsSpecial = function() {
		var freq = new Frequency(self.freqs);
		var isSplitFixed = self.isFreqSplitFixed();
		freq.setSplit(isSplitFixed);

		var fstep = self.factory.data.fstep;
		var k = self.factory.getClkNr();
		var filtSepHz = ~~Math.round(self.FILTSEP90K[k]*1000);
		var c = 0;
		for (var b = 1; b >= 0; --b) {
			var fr = self.getFreqCh(b, 0);
			if (fr < self.factory.data.band[b].fStart) {
				fr = self.factory.data.band[b].fStart;
			} else if (fr > self.factory.data.band[b].fStop) {
				fr = self.factory.data.band[b].fStop;
			}
			if (self.factory.hasExcludeFreq(b)){
				var distStart = (fr - self.factory.data.band[b].fStartExc);
				var distStop = (self.factory.data.band[b].fStopExc - fr);
				if (distStart>0 && distStop>0) {
					if (distStart<distStop) fr = self.factory.data.band[b].fStartExc;
					if (distStart>distStop) fr = self.factory.data.band[b].fStopExc;
				}
			}			
			var f = [];
			f.push(~~Math.round(fr - filtSepHz/2));
			f.push(~~Math.round(fr + filtSepHz/2));
			var fo = self.factory.data.band[b].fo;
			var chnr = [];
			var fn = [];
			for (var c = 0; c < 2; c++) {
				var ch = ~~Math.round((f[c] - fo)/fstep);
				freq.setFreq(b, c, ch);
				chnr.push(ch);
				fn.push(self.computeChFreq(ch, b));
			}
			var fnew = ~~Math.round((fn[0]+fn[1])/2);
			self.setFreqCh(b, 0, fnew);
			if (!isSplitFixed) {
				continue;
			}
			var a = (b + 1) % 2;
			var fa = [];
			for (var c = 0; c < 2; c++) {
				var ch = self.computeChNrOtherBand(chnr[c], b, c);
				freq.setFreq(a, c, ch);
				fa.push(self.computeChFreq(ch, a));
			}
			fnew = ~~Math.round((fa[0]+fa[1])/2);
			self.setFreqCh(a, 0, fnew);
			break;
		}
		return freq;
	}
	this.readFreqsFrm = function() {
		var frm = [];
		var freq = self.getFreqs();
		var fov = self.computeFiltersOverlap(freq);
		var alertMsg = "WARNING:\n"
			+ "Fiter overlapping detected. See details below.\n"
			+ "Please, confirm before applying.";
		if (fov['check'] && !self.sernr.isFilterUnique180()) {
			var k = self.factory.getClkNr();
			var filtSepKhz = this.FILTSEP90K[k];
			if (self.factory.isVHF()) filtSepKhz = 95;
			self.warningBox.setWarningMessage(fov['ovlp'], filtSepKhz, self.maxChannels);
			if (!confirm(alertMsg)) {
				return null;
			}
		} else {
			self.warningBox.hide();
		}
		for (var b = 1; b >= 0; --b) {
			if (self.freqs.frm[b] != freq.frm[b]) {
				frm.push(freq.frm[b]);
			}
			if(self.isFreqSplitFixed()) {
				break;
			}
		}
		return frm;
	}
	this.checkFreqs = function() {
		var freq = self.freqs;
		var fov = self.computeFiltersOverlap(freq);
		if (fov['check'] && !self.sernr.isFilterUnique180()) {
			var k = self.factory.getClkNr();
			var filtSepKhz = this.FILTSEP90K[k];
			if (self.factory.isVHF()) filtSepKhz = 95;
			self.warningBox.setWarningMessage(fov['ovlp'], filtSepKhz, self.maxChannels);
		} else {
			self.warningBox.hide();
		}
	}
	this.displayFilters = function() {
		var mask = 0xFFFFFFFF;
		var show = (self.showFiltersMask & mask) != 0;
		self.showFilters((self.showFiltersMask & mask) != 0);
	}
	this.showConfs = function() {
		self.showOpfSettings(self.confs.isOscPrevFeat());
		self.showRetrySettings(self.confs.getOpfMode()<2);
		self.dualFwSet(self.confs.getRevision());
		var simplex = self.isSimplexMode(self.confs.getSimplexMode());
		self.setSimplexMode(simplex);
		this.updateSquelchThresholdTitles(simplex);
		self.setMuteMode(self.confs.getSqMode());
		self.mutemodeDisable(simplex);
		self.setAbnSqTime(self.confs.getAbnSqTime());
		self.setRetryTime(self.confs.getRetryTime());
		self.opfEnSet(self.confs.getOpfEn());
		self.opfModeSet(self.confs.getOpfMode());
		for (var b = 0; b < 2; ++b) {
			self.hpaSwSet(b, self.confs.getPaEn(b));
			self.squelchEnSet(b, self.confs.getSqEn(b));
			self.eqBwSet(b, self.confs.getEqBw(b));
			self.squelchThrSet(b, self.confs.getSqTh(b));
			self.mainGainLimSet(b, self.confs.getGmain(b));
			self.mainPowerLimSet(b, self.confs.getPmain(b));
		}
		self.displayFilters();
		var maxChannels = self.maxChannels;
		var special = self.sernr.isFilterUnique180();
		for (var c = 0; c < maxChannels; ++c) {
			var show = (self.showFiltersMask & (1 << c)) != 0;
			this.setShowFilter(c, show);
			var active = self.confs.getChActive(c);
			if (special && (c == 0)) {
				if (!self.confs.getChActive(1)) {
					active = false;
				}
			}
			self.filtEnableSet(c, active);
			for (var b = 0; b < 2; ++b) {
				self.setGfine(b, c, self.confs.getChGfine(b, c));
				self.chBwSet(b, c, self.confs.getChBw(b, c));
				var settings = simplex ? chRfIn_settings[0] : chRfIn_settings[b];
				setMetRange("rfInPow_"+c+"_"+b, settings);
			}
		}
		self.uldlLinkedDisable();
		self.simplexSettingsDisable();
		var el = window.parent.head.document.getElementById('maintab');
		var w =  document.getElementById("tagName").getBoundingClientRect().width;
		el.style.width = w+'px';		
	}
	this.computeFiltersCombine = function(freq, b, n) {
		var filts = [];
		for (var c = 0; c < self.maxChannels; ++c) {
			if (c == n) {
				continue;
			}
			if (!self.isFiltEnabled(c)) {
				continue;
			}
			if (self.isFilterCombination(freq, b, n, c)) {
				filts.push(c);
			}
		}
		return filts;
	}
	this.filterBelongsToCombination = function(freq, b, n) {
		if (!self.isFiltEnabled(n)) {
			return false;
		}
		var filts = self.computeFiltersCombine(freq, b, n);
		return (filts.length != 0);
	}
	this.getFilterCombinations = function(freq, b) {
		var filts = [];
		for (var n = 0; n < self.maxChannels; ++n) {
			filts.push([]);
			if (!self.isFiltEnabled(n)) {
				continue;
			}
			for (var c = 0; c < self.maxChannels; ++c) {
				if (c == n) {
					continue;
				}
				if (!self.isFiltEnabled(c)) {
					continue;
				}
				/*if (self.isFilterAlreadyCounted(filts, c)) {
					continue;
				}*/
				if (self.isFilterCombination(freq, b, n, c)) {
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
	this.computeFilterCombineReduction = function(freq, b) {
		var filts = self.getFilterCombinations(freq, b);
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
		var fnr = self.computeNrActiveFilts();
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
	this.computeNrActiveFilts = function() {
		var n = 0;
		for (var c = 0; c < self.maxChannels; ++c) {
			if (self.isFiltEnabled(c)) {
				n++;
			}
		}
		return n;
	}
	this.computeFiltersOverlap = function(freq) {
		var ovlp = [];
		var check = false;
		for (var b = 0; b < 2; ++b) {
			ovlp.push([]);
			for (var c = 0; c < self.maxChannels; ++c) {
				ovlp[b].push([]);
				if (!self.isFiltEnabled(c)) {
					continue;
				}
				ovlp[b][c] = self.findFiltersOverlap(freq, b, c);
				if (ovlp[b][c].length != 0) {
					check = true;
				}
			}
		}
		return {'check': check, 'ovlp': ovlp};
	}
	this.findFiltersOverlap = function(freq, b, n) {
		var filts = [];
		for (var c = n + 1; c < self.maxChannels; ++c) {
			if (!self.isFiltEnabled(c)) {
				continue;
			}
			if (self.isFilterCombination(freq, b, n, c)) {
				continue;
			}
			if (self.isFilterOverlap(freq, b, n, c)) {
				filts.push(c);
			}
		}
		return filts;
	}
	this.isFilterOverlap = function(freq, b, n, c) {
		var f1 = self.computeFreq(freq, b, n);
		var f2 = self.computeFreq(freq, b, c);
		var b1 = self.chBwGetKHz(b, n);
		var b2 = self.chBwGetKHz(b, c);
		var filtSep = Math.abs(f2 - f1);
		var x = self.factory.getClkNr();
		var band = self.FILTSEP90K[x]*1000;
		var band;
		if (b1 == 90 && b2 == 90) {
			band = ~~Math.round(self.FILTSEP90K[x]*1000);
			if (filtSep == band) {
				var g = self.getGfine(n, b);
				var g1 = self.getGfine(c, b);
				return (g != g1);
			} else {
				return (filtSep < band);
			}
		} else {
			band = ~~Math.round((b1 + b2) * 1000 / 2 * 1.25);
			return (filtSep < band);
		}
	}
	this.isFilterCombination = function(freq, b, n, c) {
		if (n == c) {
			return false;
		}
		if (!(self.isFiltEnabled(n) && self.isFiltEnabled(c))) {
			return false;
		}
		if (self.computeCombinedFilters(freq, b, n, c)) {
			return true;
		}
		if (!self.mayBeCombinedFilters(freq, b, n, c)) {
			return false;
		}
		if (!self.checkFiltersInBetween(freq, b, n, c)) {
			return false;
		}
		return true;
	}
	this.computeCombinedFilters = function(freq, b, n, c) {
		if (n == c) {
			return false;
		}
		if (!(self.isFiltEnabled(n) && self.isFiltEnabled(c))) {
			return false;
		}
		var k = self.chBwGetIndex(b, n);
		var k1 = self.chBwGetIndex(b, c);
		if (!(k == 0 && k1 == 0)) {
			return false;
		}
		var g = self.getGfine(n, b);
		var g1 = self.getGfine(c, b);
		if (g != g1) {
			return false;
		}
		var f1 = self.computeFreq(freq, b, n);
		var f2 = self.computeFreq(freq, b, c);
		var filtSep = Math.abs(f2 - f1);
		var x = self.factory.getClkNr();
		var band = self.FILTSEP90K[x]*1000;
		return (filtSep == band);
	}
	this.mayBeCombinedFilters = function(freq, b, n, c) {
		if (n == c) {
			return false;
		}
		if (!(self.isFiltEnabled(n) && self.isFiltEnabled(c))) {
			return false;
		}
		var k = self.chBwGetIndex(b, n);
		var k1 = self.chBwGetIndex(b, c);
		if (!(k == 0 && k1 == 0)) {
			return false;
		}
		var g = self.getGfine(n, b);
		var g1 = self.getGfine(c, b);
		if (g != g1) {
			return false;
		}
		var f1 = self.computeFreq(freq, b, n);
		var f2 = self.computeFreq(freq, b, c);
		var filtSep = Math.abs(f2 - f1);
		var x = self.factory.getClkNr();
		var band = self.FILTSEP90K[x]*1000;
		if (filtSep % band != 0) {
			return false;
		}
		if (filtSep / band > 1) {
			return true;
		}
		return false;
	}
	this.checkFiltersInBetween = function(freq, b, n, c) {
		var f1 = self.computeFreq(freq, b, n);
		var f2 = self.computeFreq(freq, b, c);
		var filtSep = Math.abs(f2 - f1);
		var x = self.factory.getClkNr();
		var band = self.FILTSEP90K[x]*1000;
		if (filtSep % band != 0) {
			return false;
		}
		var steps = ~~Math.round(filtSep / band);
		if (steps == 0) {
			return false;
		}
		if (steps == 1) {
			return true;
		}
		var fst = f2 > f1 ? f1 : f2;
		for (var i = 1; i < steps; ++i) {
			var f = fst + filtSep * i;
			var k = self.hasFilterFreq(freq, b, n, c, f);
			if (k === null) {
				return false;
			}
			if (!self.mayBeCombinedFilters(freq, b, n, k)) {
				return false;
			}
		}
		return true;
	}
	this.hasFilterFreq = function(freq, b, n, c, f) {
		for (var k = 0; k < self.maxChannels; ++k) {
			if (k == n || k == c) {
				continue;
			}
			if (!self.isFiltEnabled(k)) {
				continue;
			}
			if (f != self.computeFreq(freq, b, k)) {
				continue;
			}
			return k;
		}
		return null;
	}
	this.readConfsFrm = function(isReset, isFwChg, isIsolVerif, isIsolClear) {
		var cnf = new Conf(self.confs);
		var frm = [];
		if (isReset) {
			cnf.setReset(0);
			frm.push(cnf.frm[0]);
			return frm;
		}
		if (isFwChg && self.factory.isDualFwAllowed()) {
			cnf.setRevision(0, self.dualFwGet());
			frm.push(cnf.frm[0]);
			return frm;
		}
		if (isIsolVerif) {
			cnf.setOpfExec(0, true);
			frm.push(cnf.frm[0]);
			return frm;
		}
		if (isIsolClear) {
			cnf.setIsolAlarmClear();
			frm.push(cnf.frm[0]);
			return frm;
		}
		cnf.clrReset(0);
		cnf.clrReset(1);
		cnf.setOpfExec(0, false);
		cnf.setOpfExec(1, false);
		cnf.clrIsolAlarmClear();
		var freq = self.getFreqs();
		self.getConf(cnf, freq);
		for (var b = 0; b < 2; ++b) {
			if (self.confs.frm[b] != cnf.frm[b]) {
				frm.push(cnf.frm[b]);
			}
		}
		return frm;
	}
	this.getConf = function(cnf, freq) {
		for (var b = 0; b < 2; ++b) {
			self.getBandConf(cnf, b, freq);
		}
		for (var c = 0; c < self.maxChannels; ++c) {
			self.getChConf(cnf, c, freq);
		}
	}
	this.getBandConf = function(cnf, b, freq) {
		var rev = self.dualFwGet();
		if (!self.factory.isDualFwAllowed()) {
			rev = 0;
		}
		cnf.setRevision(b, rev);
		var simplex = (self.getSimplexMode() && 
			self.factory.isSimplexAllowed() &&
			self.version.isFwSimplex());
		cnf.setSimplexMode(b, simplex);
		var mode = self.isMuteModeLinked() ?
			self.confs.SqModeVals['LINKED'] : self.confs.SqModeVals['NOTLINKED'];
		cnf.setSqMode(b, mode);
		var rednr = self.computeFilterCombineReduction(freq, b);
		cnf.setRedFiltNr(b, rednr);
		cnf.setBandBit(b);
		cnf.setSqEn(b, self.squelchEnIsSet(b));
		cnf.setEqBw(b, self.eqBwIsSet(b));
		cnf.setPaEn(b, self.hpaIsOn(b));
		cnf.setAbnSqTime(b, self.getAbnSqTime());
		cnf.setRetryTime(b, self.getRetryTime());
		cnf.setOpfEn(b, self.opfEnGet());
		cnf.setOpfMode(b, self.opfModeGet());
		var sqth = self.squelchThrGet(b);
		var sqthMin = self.confs.sqThrLimits(simplex, b).MIN;
		var sqthMax = self.confs.sqThrLimits(simplex, b).MAX;
		if (sqth < sqthMin) {
			sqth = sqthMin;
		} else if (sqth > sqthMax) {
			sqth = sqthMax;
		}
		cnf.setSqTh(b, sqth);
		var gmain = self.mainGainLimGet(b);
		var gainMax = self.factory.data.band[b].gainLim;
		var gainMin = self.factory.data.band[b].gainLim-20;
		if (gmain > gainMax) {
			gmain = gainMax;
		} else if (gmain < gainMin) {
			gmain = gainMin;
		}
		cnf.setGmain(b, gmain);
		var pmain = self.mainPowerLimGet(b);
		var powerMax = self.factory.data.band[b].powerLim;
		var powerMin = self.factory.data.band[b].powerLim - self.confs.limitPowerRange[b];
		if (pmain > powerMax) {
			pmain = powerMax;
		} else if (pmain < powerMin) {
			pmain = powerMin;
		}
		cnf.setPmain(b, pmain);
	}
	this.getChConf = function(cnf, c, freq) {
		var on = self.isFiltEnabled(c);
		var special = self.sernr.isFilterUnique180();
		if (special && (c > 0)) {
			if (c == 1) {
				on = self.isFiltEnabled(0);
			} else if (c > 1) {
				on = false;
			}
		}
		for (var b = 0; b < 2; ++b) {
			if (on !== null) {
				cnf.setChStby(b, c, !on);
			}
			var wf = self.filterBelongsToCombination(freq, b, c);
			if (special && c < 2) {
				wf = false; 
			}
			cnf.setFilterCombineBit(b, c, wf);
			var bw = (special ? 0 : self.chBwGet(b, c));
			if (bw !== null) {
				cnf.setChBw(b, c, bw);
			}
			var gfine = self.getGfine(c, b);
			if (special && c == 1) {
				gfine = self.getGfine(0, b);
			}
			if (gfine !== null) {
				if (gfine > self.confs.limitgFine[b].MAX) {
					gfine = self.confs.limitgFine[b].MAX;
				} else if (gfine < self.confs.limitgFine[b].MIN) {
					gfine = self.confs.limitgFine[b].MIN;
				}
				cnf.setGfine(b, c, gfine);
			}
		}
	}
	this.showStatus = function(monitor) {
		self.blockedSet(monitor.stat.blocked);
		if (self.blocked) {
			return;
		}
		for (var b = 0; b < 2; ++b) {
			self.inputOverloadSet(b, monitor.stat.band[b].signal.overflow);
			self.abnSqOpenSet(monitor.isUlAbnSqOpen());
			self.opfRoutineRunningSet(monitor.isOpfRoutineRunning());
			self.opfAntIsolSet(monitor.isOpfAntIsol());
			if (self.sernr.isFilterUnique180()) {
				self.showStatusChSpecial(monitor, b);
			} else {
				for (var c = 0; c < self.maxChannels; ++c) {
					self.showStatusCh(monitor, b, c);
				}
				var oneChOutOn = self.computeOneChOutOn(b, monitor);
				self.rfOutPowSet(b, monitor.stat.band[b].hpa.power, oneChOutOn);
			}
			if (b == 0) {
				self.statusHpaLedSet(b, monitor.stat.band[b].hpa.hiTemp);
			} else {
				self.paFailLedSet(monitor.stat.band[b].hpa.hiTemp)
			}
			if (self.confs.isOscPrevFeat()){
				self.setConfGain(b, monitor.stat.band[b].conf_gain);
				self.statGainMainTitle(b, monitor.stat.isol_gain);
				self.setIsolGain(monitor.stat.isol_gain);
				self.setPaEnLed(b, monitor.stat.band[b].hpa.enabled);
			}
		}
		self.boardTempSet(monitor.stat.band[1].hpa.temperature);
		self.hpaOvfDL(monitor.stat.band[1].hpa.overflow);
		self.hpaCommerrLedSet(monitor.stat.band[1].hpa.commerr);
		self.hpaVswrLedSet(monitor.stat.band[1].hpa.vswr);	   
		self.hpaUdfLedSet(monitor.stat.band[1].hpa.udf);    
		self.tbsErrSet(self.computeTbsErr(monitor));
		self.fpgaErrSet(monitor.stat.fpgaErr);
		self.setLastRetryTime(monitor.stat.retryTimeLapse);
		if (self.doFrequencyCheck) {
			if (!self.isAdj()) {
				self.checkFreqs();
			} else {
				self.checkAdjFreqs();
			}
			self.doFrequencyCheck = false;
		}
	}
	this.showStatusCh = function(monitor, b, c) {
		var isInput = monitor.isSignalIn(b, c) && self.confs.getChActive(c);
		var chInOn = self.computeChInOn(b, c, monitor);
		var abnSq = monitor.isChAbnSqAlarm(b, c);
		if (abnSq){
			self.rfSignalLedSet(b, c, "red");
		} else if (isInput && chInOn) {
			self.rfSignalLedSet(b, c, "green");
		} else {
			self.rfSignalLedSet(b, c, "grey");
		}
		if (!chInOn) {
			self.rfChInPowSet(b, c, monitor.stat.band[b].ch[c].level, "#D0D0D0");
		} else if (monitor.stat.band[b].signal.overflow) {
			self.rfChInPowSet(b, c, monitor.stat.band[b].ch[c].level, "alarm");
		} else {
			self.rfChInPowSet(b, c, monitor.stat.band[b].ch[c].level);
		}
		var chOutOn = self.computeChOutOn(b, c, monitor);
		self.rfChOutPowSet(b, c, monitor.computeChOutPower(b, c), chOutOn);
		var agc = chOutOn ? self.computeAgc(b, c, monitor) : 0;
		self.agcSet(b, c, agc);
	}
	this.showStatusChSpecial = function(monitor, b) {
		var isSignalIn = (monitor.isSignalIn(b, 0)
			|| monitor.isSignalIn(b, 1));
		var isChActive = (self.confs.getChActive(0)
			&& self.confs.getChActive(1));
		var isInput = isSignalIn && isChActive;
		var chInOn = (self.computeChInOn(b, 0, monitor)
			|| self.computeChInOn(b, 1, monitor));
		var abnSq = (monitor.isChAbnSqAlarm(b, 1)
			|| monitor.isChAbnSqAlarm(b, 1));
		if (abnSq){
			self.rfSignalLedSet(b, 0, "red");
		} else if (isInput && chInOn) {
			self.rfSignalLedSet(b, 0, "green");
		} else {
			self.rfSignalLedSet(b, 0, "grey");
		}
		var levelIn = self.computeLevelInSpecial(monitor, b);
		if (!(chInOn && isChActive)) {
			self.rfChInPowSet(b, 0, levelIn, "#D0D0D0");
		} else if (monitor.stat.band[b].signal.overflow) {
			self.rfChInPowSet(b, 0, levelIn, "alarm");
		} else {
			self.rfChInPowSet(b, 0, levelIn);
		}
		var chOutOn = (self.computeChOutOn(b, 0, monitor)
			|| self.computeChOutOn(b, 1, monitor));
		var levelOut = self.computeChOutPowerSpecial(monitor, b);
		self.rfChOutPowSet(b, 0, levelOut, chOutOn);
		var gainConf = self.confs.getGmain(b) + self.confs.getChGfine(b, 0);
		var agc = gainConf - (levelOut - levelIn);
		var isSignalInDL = (monitor.isSignalIn(1, 0)
			|| monitor.isSignalIn(1, 1));
		if ((agc < 0) || !isChActive || !chOutOn
			|| (!isInput && self.confs.getSqEn(b))
			|| (b == 0 && !isSignalInDL && self.confs.getSqMode() == 1))
		{
			agc = 0;
		}
		self.agcSet(b, 0, agc);
		self.rfOutPowSet(b, levelOut, chOutOn);
	}
	this.computeLevelInSpecial = function(monitor, b) {
		var k = 8;
		var pch = [];
		for (var c = 0; c < 2; c++) {
			var level = monitor.stat.band[b].ch[c].level;
			pch.push(level);
		}
		var p = 0;
		for (var c = 0; c < 2; c++) {
			p += Math.pow(10, pch[c]/k);
		}
		p = k*(Math.log(p) / Math.log(10));
		if (isNaN(p)) {
			p = -130;
		}
		return p;
	}
	this.computeChOutPowerSpecial = function(monitor, b) {
		var k = 8;
		var pch = [];
		for (var c = 0; c < 2; c++) {
			var level = monitor.computeChOutPower(b, c);
			pch.push(level);
		}
		var p = 0;
		for (var c = 0; c < 2; c++) {
			p += Math.pow(10, pch[c]/k);
		}
		p = k*(Math.log(p) / Math.log(10));
		if (isNaN(p)) {
			p = -130;
		}
		return p;
	}
	this.computeChOutOn = function(b, c, monitor) {
		if (!self.confs.getPaEn(b)) {
			return false;
		}
		if (!self.confs.getChActive(c)) {
			return false;
		}
		if (!monitor.isSignalIn(b, c)) {
			if (self.confs.getSqEn(b)) {
				return false;
			}
		}
		if (b == 0) {
			if (self.confs.getSqMode() == 1 && !monitor.isSignalIn(1, c)) {
				return false;
			}
		}
		return true;
	}
	this.computeOneChOutOn = function(b, monitor) {
		var oneChOutOn = false;
		for (var c = 0; c < self.maxChannels; ++c) {
			if (self.computeChOutOn(b, c, monitor)) {
				oneChOutOn = true;
				break;
			}
		}
		return oneChOutOn;
	}
	this.computeChInOn = function(b, c, monitor) {
		if (!self.confs.getChActive(c)) {
			return false;
		}
		var simplex = self.isSimplexMode(self.confs.getSimplexMode());
		if (!monitor.isSignalIn(b, c)) {
			if (self.confs.getSqEn(b) || simplex) {
				return false;
			}
		}
		if (b == 0 && !simplex) {
			if (self.confs.getSqMode() == 1 && !monitor.isSignalIn(1, c)) {
				return false;
			}
		}
		return true;
	}
	this.computeAgc = function(b, c, monitor) {
		var agc = self.confs.getGmain(b) + self.confs.getChGfine(b, c) 
			- monitor.stat.band[b].ch[c].gain;
		if (agc < 0) {
			agc = 0;
		}
		if (!monitor.isSignalIn(b, c) && self.confs.getSqEn(b)) {
			agc = 0;
		}
		if (b == 0 && self.confs.getSqMode() == 1 && !monitor.isSignalIn(1, c)) {
			agc = 0;
		}
		if (!self.confs.getChActive(c)) {
			agc = 0;
		}
		return agc;
	}
	this.computeTbsErr = function(monitor) {
		return monitor.stat.rxlow;
	}
	this.createSimplex = function() {
		var box = document.createElement("div");
		box.id = "simplexBox";
		var show = self.factory.isSimplexAllowed() && self.version.isFwSimplex();
		// show = true;
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
		el.id = "simplex";
		el.name = el.id;
		el.type = "checkbox";
		el.onclick = function(ev) {
			self.updateSquelchThresholdTitles(this.checked);
			self.mutemodeDisable(this.checked);
			for (var b = 0; b < 2; ++b) {
				self.sqEnDisable(b, this.checked);
			}
		}
		cell.appendChild(el);
		return box;
	}
	this.displaySimplex = function(doShow) {
		try {
			var el = document.getElementById("simplexBox");
			el.style.display = doShow ? 'block' : 'none';
		} catch(e) {}
	}
	this.setSimplexMode = function(s) {
		try {
			var el = document.getElementById("simplex");
			el.checked = s;
		} catch(e) {}
	}
	this.getSimplexMode = function() {
		try {
			var el = document.getElementById("simplex");
			var s = el && el.checked;
			return s;
		} catch(e) {}
	}
	this.isSimplexMode = function(simplex) {
		return (simplex &&
			self.factory.isSimplexAllowed() &&
			self.version.isFwSimplex());
	}
	this.uldlLinkedDisable = function(){
		//se fuerza a false si bw ul/dl no son iguales
		if (!self.factory.isULDLFreqConsistent()){
			var el = document.getElementById("freqSplit");
			el.value = 1;
			el.disabled = true;
			el.style.backgroundColor = "#CCCCCC";
		}	
	}	
	this.simplexSettingsDisable = function() {
		var simplex = self.isSimplexMode(self.confs.getSimplexMode());
		self.mutemodeDisable(simplex);
		for (var b = 0; b < 2; ++b) {
			self.sqEnDisable(b, simplex);
		}
		self.rxlowHide(simplex);
	}
	this.createDualFw = function(n) {
		var box = document.createElement("div");
		box.id = "fwRevBox_"+n;
		var show = self.factory.isDualFwAllowed();
		box.style.display = show ? "block" : 'none';
		var row = document.createElement("tr");
		box.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		if (n == 0) {
			cell.innerHTML = "32&nbsp;Narrow&nbsp;filters&nbsp;&nbsp;&nbsp;";
		} else {
			cell.innerHTML = "8&nbsp;Adjustable&nbsp;filters";
		}
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "fwRev_"+n;
		el.name = el.id;
		el.type = "checkbox";
		el.nr = n;
		el.state = 'undefined';
		el.onclick = function(ev) {
			try {
				var n = (this.nr == 0 ? 1 : 0);
				var other = document.getElementById("fwRev_"+n);
				this.checked = true;
				other.checked = !this.checked;
				if (this.state == this.checked) {
					return;
				}
				var r = window.confirm("PLEASE, CONFIRM CHANGE OF FILTER MODE");
				if (!r) {
					this.checked = !this.checked;
					other.checked = !this.checked;
					return;
				}
				this.state = this.checked;
				other.state = other.checked;
				submitform(false, true, this.nr);
			} catch(err) {}
		}
		cell.appendChild(el);
		return box;
	}
	this.dualFwSet = function(nr) {
		nr = (nr == 0 ? 0 : 1);
		try {
			for (var n = 0; n < 2; ++n) {
				var el = document.getElementById("fwRev_"+n);
				el.checked = (nr == n);
				el.state = el.checked;
			}
		} catch(e) {}
	}
	this.dualFwGet = function() {
		try {
			for (var n = 0; n < 2; ++n) {
				var el = document.getElementById("fwRev_"+n);
				if (el.checked) {
					return n;
				}
			}
		} catch(e) { return 0; }
		return 0;
	}
	this.showConfAdj = function() {
		self.showOpfSettings(self.confs.isOscPrevFeat());
		self.dualFwSet(self.confs.getRevision());
		self.updateSquelchThresholdTitles(false);
		self.setMuteMode(self.confs.getSqMode());
		var isFixed = self.confs.isSplitFixed();
		self.setFreqSplit(!isFixed);
		for (var b = 0; b < 2; ++b) {
			self.hpaSwSet(b, self.confs.getPaEn(b));
			self.squelchEnSet(b, self.confs.getSqEn(b));
			self.squelchThrSet(b, self.confs.getSqTh(b));
			self.mainGainLimSet(b, self.confs.getGmain(b));
			self.mainPowerLimSet(b, self.confs.getPmain(b));
		}
		self.displayFilters();
		var maxChannels = self.confs.CHNR;;
		for (var c = 0; c < maxChannels; ++c) {
			var show = (self.showFiltersMask & (1 << c)) != 0;
			self.setShowFilter(c, show);
			self.filtEnableSet(c, self.confs.getChActive(c));
			for (var b = 0; b < 2; ++b) {
				var nstart = self.confs.getChStart(b, c);
				var nstop = self.confs.getChStop(b, c);
				var f = [];
				f.push(nstart);
				f.push(nstop);
				self.setAdjFreqCh(b, c, nstart, nstop);
				self.saveAdjFreq(b, c, f);
				self.setGfine(b, c, self.confs.getChGfine(b, c));
				var settings = chRfIn_settings_adj[b];
				setMetRange("rfInPow_"+c+"_"+b, settings);
			}
		}
		var el = window.parent.head.document.getElementById('maintab');
		var w =  document.getElementById("tagName").getBoundingClientRect().width;
		el.style.width = w+'px';		
	}
	this.saveAdjFreq = function(b, c, f) {
		if (self.fadj.length == 0) {
			self.fadj = [];
			for (var c = 0; c < self.confs.CHNR; ++c) {
				var band = [];
				for (var b = 0; b < 2; ++b) {
					band.push(f);
				}
				self.fadj.push(band);
			}
		} else {
			self.fadj[b][c] = f;
		}
	}
	this.createFreqStyleSw = function() {
		var el = document.createElement("input");
		el.id = "freqStyle";
		el.name = el.id;
		el.type = "button";
		el.value = self.freqStyle == 0 ? "Start/Stop" : "Center/Bandwidth";
		el.style.fontWeight = "bold";
		el.style.width = "100%";
		el.style.minWidth = "130px";
		el.style.borderRadius = "10px";
		el.onclick = function(ev) {
			try {
				var fcurr = [];
				for (b = 0; b < 2; ++b) {
					fcurr.push([])
					for (var c = 0; c < self.confs.CHNR; ++c) {
						fcurr[b].push(self.getAdjFreq(b, c));
					}
				}
				self.freqStyle = self.freqStyle == 0 ? 1 : 0;
				localStorage.setItem('freqStyle'+Prjstr+window.location.host, self.freqStyle);
				this.value = self.freqStyle == 0 ? "Start/Stop" : "Center/Bandwidth";
				self.setAdjFreqHeaders();
				self.setAdjFreqTitles();
				for (b = 0; b < 2; ++b) {
					for (var c = 0; c < self.confs.CHNR; ++c) {
						var chnr = [];
						for (var s = 0; s < 2; ++s) {
							chnr.push(self.computeAdjChNr(fcurr[b][c][s], b));
						}
						self.setAdjFreqCh(b, c, chnr[0], chnr[1]);
					}
				}
			} catch (err) {}
		}
		return el;
	}
	this.setAdjFreqHeaders = function() {
		try {
			for (var b = 0; b < 2; ++b) {
				var td1 = document.getElementById("HeaderF1_"+(b+1));
				var td2 = document.getElementById("HeaderF2_"+(b+1));
				if (self.isAdj() && self.freqStyle == 0) {
					td1.innerHTML = "Fstart&nbsp;(MHz)";
					td2.innerHTML = "Fstop&nbsp;(MHz)";
				} else {
					td1.innerHTML = "Fr.&nbsp;(MHz)";
					td2.innerHTML = "BW&nbsp;(MHz)";
				}
			}
			for (var b = 0; b < 2; ++b) {
				for (var c = 0; c < self.confs.CHNR; ++c) {
					var id
				}
			}
		} catch(e) {}
	}
	this.createAdjFr = function(b, c, s) {
		var cell = document.createElement("td");
		var fr = document.createElement("input")
		fr.type = "text";
		fr.id = "chAdjF_"+c+"_"+b+"_"+s;
		fr.name = fr.id;
		fr.style.width = "60px";
		fr.className = "number";
		fr.channel = c;
		fr.path	= b;
		fr.ss = s;
		var titles = this.computeAdjFreqTitles(b);
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
			var v = self.checkAdjFrSetting(b, c, s, this.value);
			this.value = v;
			var f = self.getAdjFreq(b, c);
			var g = [];
			g = self.adjustAdjFreqs(b, s, f);
			var chnr = [];
			for (var s = 0; s < 2; ++s) {
				chnr.push(self.computeAdjChNr(g[s], b));
			}
			self.setAdjFreqCh(b, c, chnr[0], chnr[1]);
			if (!self.isFreqSplitFixed()) {
				return;
			}
			self.adjustFreqLimitsOtherBand(b, c, chnr);
		}
		cell.appendChild(fr);
		return cell;
	}
	this.checkAdjFrSetting = function(b, c, s, value) {
		var fmin = self.factory.data.band[b].fStart;
		var fmax = self.factory.data.band[b].fStop;
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
	this.computeAdjFreqTitles = function(b) {
		var fmin = self.factory.data.band[b].fStart;
		var fmax = self.factory.data.band[b].fStop;
		var bwmax = (fmax - fmin);
		var bwmin = self.BW_ADJ_MIN_HZ;
		var title;
		var title1;
		if (this.factory.hasExcludeFreq(b)){
			title = "Frequency Range: "+(this.factory.data.band[b].fStart/1e6) +
			"-"+(this.factory.data.band[b].fStartExc/1e6)+"MHz / " +
			(this.factory.data.band[b].fStopExc/1e6) + "-" + 
			(this.factory.data.band[b].fStop/1e6)+"MHz";
			var bwmax0 = this.factory.data.band[b].fStartExc-this.factory.data.band[b].fStart;
			var bwmax1 = this.factory.data.band[b].fStop-this.factory.data.band[b].fStopExc;
			if (bwmax0<bwmax1) bwmax0 = bwmax1;
			title1 = "BW Range: "+(bwmin/1e6)+"-"+(bwmax0/1e6)+"MHz";
		}else{
			title = "Frequency Range: "+(this.factory.data.band[b].fStart/1e6) +
			"-"+(this.factory.data.band[b].fStop/1e6)+"MHz";
			title1 = "BW Range: "+(bwmin/1e6)+"-"+(bwmax/1e6)+"MHz";
		}				
		return [title, title1];
	}
	this.setAdjFreqTitles = function() {
		for (var b = 0; b < 2; ++b) {
			var titles = self.computeAdjFreqTitles(b);
			var t = [];
			t.push(titles[0]);
			if (self.freqStyle == 0) {
				t.push(titles[0]);
			} else {
				t.push(titles[1]);
			}
			for (var c = 0; c < self.confs.CHNR; ++c) {
				for (var s = 0; s < 2; ++s) {
					var id = "chAdjF_"+c+"_"+b+"_"+s;
					var el = document.getElementById(id);
					try {
						el.title = t[s];
					} catch(e) {}
				}
			}
		}
	}
	this.setAdjFreqCh = function(b, c, chstart, chstop) {
		var fstart = self.computeAdjChFreq(chstart, b);
		var fstop = self.computeAdjChFreq(chstop, b);
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
			var id = "chAdjF_"+c+"_"+b+"_"+s;
			var el = document.getElementById(id);
			try {
				if (s == 0 || self.freqStyle == 0) {
					el.value = (f[s] / 1.0e6).toFixed(3);
				} else {
					el.value = (f[s] / 1.0e6).toFixed(3);
				}
			} catch(e) {}
		}
	}
	this.getAdjFreq = function(b, c) {
		var f = [];
		for (var s = 0; s < 2; ++s) {
			var id = "chAdjF_"+c+"_"+b+"_"+s;
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
	this.computeAdjChFreq = function(chnr, b) {
		var fo = self.factory.data.band[b].fo;
		var fstep = self.factory.data.fstepAdj;
		var fr = chnr * fstep + fo;
		return fr;
	}
	this.computeAdjChNr = function(fr, b) {
		var fo = self.factory.data.band[b].fo;
		var fstep = self.factory.data.fstepAdj;
		var chnr = ~~Math.round((fr - fo)/fstep);
		return chnr;
	}
	this.computeAdjChNrOtherBand = function(chnr, b) {
		var fr = self.computeAdjChFreq(chnr, b);
		var diff = fr - self.factory.data.band[b].fStart;
		var a = (b + 1) % 2;
		fr = self.factory.data.band[a].fStart + diff;
		var num = self.computeAdjChNr(fr, a);
		return num;
	}
	this.adjustAdjFreqs = function(b, k, f){
		var factS = self.factory.data.band[b].fStart;
		var factP = self.factory.data.band[b].fStop;
		var fcenter = (f[0]+f[1])/2;
		var excFreq = self.factory.hasExcludeFreq(b);
		if (excFreq){
			var fminexc = self.factory.data.band[b].fStartExc;
			var fmaxexc = self.factory.data.band[b].fStopExc;	
			var distStart = Math.abs(fcenter - fminexc);
			var distStop = Math.abs(fmaxexc - fcenter);
			if (distStart<=distStop) factP = fminexc;
			if (distStart>distStop) factS = fmaxexc;
			
		}
		var maxBw = factP - factS;
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
		} else if (bw > maxBw) {
			bw = maxBw;
		}
		var step = ~~Math.round(self.factory.data.fstepAdj*2);
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
			var num = self.computeAdjChNr(f[i], b);
			if (!isNaN(num)) {
				f[i] = self.computeAdjChFreq(num, b);
			}
		}
		return f;		
		

	}

	this.adjustFreqLimitsOtherBand = function(b, c, ch) {
		var d = (b + 1) % 2;
		var g = [];
		for (var k = 0; k < 2; ++k) {
			var chnr = self.computeAdjChNrOtherBand(ch[k], b);
			g.push(chnr);
		}
		self.setAdjFreqCh(d, c, g[0], g[1]);
	}
	this.maxBw = function(b) {
		var bw =  Math.abs(Math.abs(self.factory.data.band[b].fStop
			- self.factory.data.band[b].fStart));
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
	this.readAdjConfsFrm = function(isReset, isFwChg) {
		var cnf = new ConfAdj(self.confs);
		var frm = [];
		if (isReset) {
			cnf.setReset();
			frm.push(cnf.frm);
			return frm;
		}
		if (isFwChg && self.factory.isDualFwAllowed()) {
			cnf.setRevision(self.dualFwGet());
			frm.push(cnf.frm);
			return frm;
		}
		cnf.clrReset();
		self.getAdjConf(cnf);
		var fov = self.computeAdjFiltersOverlap(cnf);
		var alertMsg = "WARNING:\n"
			+ "Fiter overlapping detected. See details below.\n"
			+ "Please, confirm before applying.";
		if (fov['check']) {
			var filtSepKhz = this.FILTSEPADJKHZ;
			self.warningBox.setWarningMessage(fov['ovlp'], filtSepKhz, self.maxChannels, true);
			if (!confirm(alertMsg)) {
				return null;
			}
		} else {
			self.warningBox.hide();
		}
		frm.push(cnf.frm);
		return frm;
	}
	this.getAdjConf = function(cnf) {
		self.getAdjGralConf(cnf);
		for (var b = 0; b < 2; ++b) {
			self.getAdjBandConf(cnf, b);
		}
		var isSplitFixed = self.isFreqSplitFixed();
		for (var c = 0; c < self.confs.CHNR; ++c) {
			self.getAdjChConf(cnf, c);
		}
	}
	this.getAdjGralConf = function(cnf) {
		var rev = self.dualFwGet();
		if (!self.factory.isDualFwAllowed()) {
			rev = 0;
		}
		cnf.setRevision(rev);
		var mode = self.isMuteModeLinked() ?
			self.confs.SqModeVals['LINKED'] : self.confs.SqModeVals['NOTLINKED'];
		cnf.setSqMode(mode);
		cnf.setSplit(self.isFreqSplitFixed());

	}
	this.getAdjBandConf = function(cnf, b) {
		cnf.setSqEn(b, self.squelchEnIsSet(b));
		cnf.setPaEn(b, self.hpaIsOn(b));
		var sqth = self.squelchThrGet(b);
		var sqthMin = self.confs.sqThrLimits(false, b).MIN;
		var sqthMax = self.confs.sqThrLimits(false, b).MAX;
		if (sqth < sqthMin) {
			sqth = sqthMin;
		} else if (sqth > sqthMax) {
			sqth = sqthMax;
		}
		cnf.setSqTh(b, sqth);
		var gmain = self.mainGainLimGet(b);
		var gainMax = self.factory.data.band[b].gainLim;
		var gainMin = self.factory.data.band[b].gainLim-20;
		if (gmain > gainMax) {
			gmain = gainMax;
		} else if (gmain < gainMin) {
			gmain = gainMin;
		}
		cnf.setGmain(b, gmain);
		var pmain = self.mainPowerLimGet(b);
		var powerMax = self.factory.data.band[b].powerLim;
		var powerMin = self.factory.data.band[b].powerLim - self.confs.limitPowerRange[b];
		if (pmain > powerMax) {
			pmain = powerMax;
		} else if (pmain < powerMin) {
			pmain = powerMin;
		}
		cnf.setPmain(b, pmain);
	}
	this.getAdjChConf = function(cnf, c) {
		var on = self.isFiltEnabled(c);
		for (var b = 0; b < 2; ++b) {
			if (on !== null) {
				cnf.setChStby(b, c, !on);
			}
			var gfine = self.getGfine(c, b);
			if (gfine !== null) {
				if (gfine > self.confs.limitgFine[b].MAX) {
					gfine = self.confs.limitgFine[b].MAX;
				} else if (gfine < self.confs.limitgFine[b].MIN) {
					gfine = self.confs.limitgFine[b].MIN;
				}
				cnf.setGfine(b, c, gfine);
			}
			var f = this.getAdjFreq(b, c);
			var chnr = [];
			for (var s = 0; s < 2; ++s) {
				chnr.push(self.computeAdjChNr(f[s], b));
			}
			cnf.setChStart(b, c, chnr[0]);
			cnf.setChStop(b, c, chnr[1]);
		}
	}
	this.checkAdjFreqs = function() {
		var cnf = self.confs;
		var fov = self.computeAdjFiltersOverlap(cnf);
		if (fov['check']) {
			var filtSepKhz = this.FILTSEPADJKHZ;
			self.warningBox.setWarningMessage(fov['ovlp'], filtSepKhz, self.maxChannels, true);
		} else {
			self.warningBox.hide();
		}
	}
	this.computeAdjFiltersOverlap = function(cnf) {
		var ovlp = [];
		var check = false;
		for (var b = 0; b < 2; ++b) {
			ovlp.push([]);
			for (var c = 0; c < self.maxChannels; ++c) {
				ovlp[b].push([]);
				if (!self.isFiltEnabled(c)) {
					continue;
				}
				ovlp[b][c] = self.findAdjFiltersOverlap(cnf, b, c);
				if (ovlp[b][c].length != 0) {
					check = true;
				}
			}
		}
		return {'check': check, 'ovlp': ovlp};
	}
	this.findAdjFiltersOverlap = function(cnf, b, n) {
		var filts = [];
		for (var c = n + 1; c < self.maxChannels; ++c) {
			if (!self.isFiltEnabled(c)) {
				continue;
			}
			if (self.isAdjFilterOverlap(cnf, b, n, c)) {
				filts.push(c);
			}
		}
		return filts;
	}
	this.isAdjFilterOverlap = function(cnf, b, n, c) {
		var f1 = self.adjComputeFreqs(cnf, b, n);
		var f2 = self.adjComputeFreqs(cnf, b, c);
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
	this.adjComputeFreqs = function(cnf, b, c) {
		var chnr = [];
		chnr.push(cnf.getChStart(b, c));
		chnr.push(cnf.getChStop(b, c));
		var f = [];
		for (var i = 0; i < chnr.length; ++i) {
			f.push(self.computeAdjChFreq(chnr[i], b));
		}
		return f;
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
		cell.colSpan = 6;
		row.appendChild(cell);		
		var row = document.createElement("tr");
		tb.appendChild(row);
		this.createIsolVerify(row);
		var cell = document.createElement("td");
		row.appendChild(cell);			
		this.createIsol(row);
		var row = document.createElement("tr");
		this.createAnteIsol(row);
		this.createIsolGain(row);
		tb.appendChild(row);		
		return box;
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
		cell.className = "cth";
		cell.innerHTML = "OSCILLATION&nbsp;DETECTION";
		cell.colSpan = 6;
		row.appendChild(cell);		
		row = document.createElement("tr");
		tb.appendChild(row);
		this.createAbnSqOpen(row);	
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
			for (var i=1;i<=3;i++){
				var el = document.getElementById("opfSettingsCell"+i);
				el.style.display = show ? "table-cell" : "none";
			}
		} catch(err) {}
	}
	this.createAbnSqTime = function(row) {
		var cell = document.createElement("th");
		cell.className = "thdrht";
		cell.innerHTML = "Osc.&nbsp;Delay&nbsp;Threshold";
		row.appendChild(cell);		
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "abnSqTime";
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "32px";
		var max = self.confs.limitAbnSqTime.MAX;
		var min = self.confs.limitAbnSqTime.MIN;
		el.title = "OFF 0sec, Min. 1sec, Max. "+max+"sec";
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var target = this;
			var num = self.getAbnSqTime();
			var max = self.confs.limitAbnSqTime.MAX;
			var min = self.confs.limitAbnSqTime.MIN;
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
	this.createRetryTime = function(row) {
		var cell = document.createElement("th");
		cell.className = "thdrht";
		cell.innerHTML = "Retry&nbsp;timer&nbsp;after&nbsp;auto&nbsp;PA&nbsp;Off";
		row.appendChild(cell);		
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "retryTime";
		el.name = el.id;
		el.type = "text";
		el.className = "number";
		el.style.width = "32px";
		var max = self.confs.limitRetryTime.MAX;
		var min = self.confs.limitRetryTime.MIN;
		el.title = "OFF 0hours, Min. 1hour, Max. "+max+"hours";
		el.onkeypress = function(ev) {
			return numbersOnly(ev);
		}
		el.onchange = function(ev) {
			var target = this;
			var num = self.getRetryTime();
			var max = self.confs.limitRetryTime.MAX;
			var min = self.confs.limitRetryTime.MIN;
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
		cell.id = "lastRetryTitle";
		cell.className = "thdrht";
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
	this.createAbnSqOpen = function(row) {
		var cell = document.createElement("th");
		cell.style.height = "20px";
		cell.className = "thdrht";
		cell.innerHTML = "Oscillation&nbsp;Detection";
		row.appendChild(cell);
		var cell = createLedBox("abnSqOpen");
		row.appendChild(cell);
	}
	this.abnSqOpenSet = function(alarm) {
		ledSetColor("abnSqOpen", alarm ? "red" : "grey");
	}
	this.createIsol = function(row) {
		var cell = document.createElement("th");
		cell.className = "thdrht";
		cell.innerHTML = "Last&nbsp;Isolation&nbsp;Meas.";
		cell.style.height = "20px";
		row.appendChild(cell);
		cell = createTextCell("isol");
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.innerHTML = "dB";
		cell.style.fontWeight = "normal";
		row.appendChild(cell);
	}	
	this.createIsolGain = function(row) {
		var cell = document.createElement("th");
		cell.className = "thdrht";
		cell.innerHTML = "Max.&nbsp;Allowable&nbsp;Gain";
		cell.style.height = "20px";
		row.appendChild(cell);
		cell = createTextCell("isolGain");
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.innerHTML = "dB";
		cell.style.fontWeight = "normal";
		row.appendChild(cell);
	}
	this.setIsolGain = function(g) {
		try {
			var m = self.getIsolGainMargin();
			var isol = g==self.factory.data.band[0].gainLim?">="+(g+m):g+m;
			setTextCell("isol",isol+".0");
			setTextCell("isolGain",(g<self.MAIN_GAIN_MIN[0]?"<"+self.MAIN_GAIN_MIN[0]:g)+".0");
		} catch(err) {}
	}
	this.getIsolGainMargin = function() {
		var vMain = self.VERSION_SW_GAIN_CHANGE['MAIN'];
		var vSub = self.VERSION_SW_GAIN_CHANGE['SUB'];
		if (self.version.compareSw(vMain, vSub) < 0) {
			return self.ISOL_GAIN_MARGIN_OLD;
		} else {
			return self.ISOL_GAIN_MARGIN_NEW;
		}
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
	
	this.setConfGain = function(b, g) {
		try {
			if (g == self.confs.getGmain(b)) {
				return;
			}
			self.confs.setGmain(b, g);
			self.mainGainLimSet(b, g);
			initFormChangeCheck();
		} catch(err) {}
	}
	this.createIsolVerify = function(row) {
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 2;
		var el = document.createElement("input");
		el.id = "isolVerif";
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.value = "Isolation Measurement";
		el.onclick = function(ev) {
			//self.opfRoutineRunningSet(true);
			submitform(false, false, 0, true);
		}
		cell.appendChild(el);
		cell.style.paddingLeft = "10px";
	}
	this.createOpfRoutineStatus = function(row) {
		//var cell = document.createElement("th");
		//cell.innerHTML = "Routine&nbsp;Running";
		//row.appendChild(cell);
		var cell = createLedBox("opfRoutineRunning");
		row.appendChild(cell);
	}
	this.opfRoutineRunningSet = function(alarm) {
		//ledSetColor("opfRoutineRunning", alarm ? "red" : "grey");
		setTextCell("opfrunning",alarm?"BUSY":"");
	}
	this.createAnteIsol = function(row) {
		var cell = document.createElement("th");
		cell.className = "thdrht";
		cell.innerHTML = "Antenna&nbsp;Isolation";
		cell.style.height = "20px";
		row.appendChild(cell);
		cell = createLedBox("opfAntIsol");
		row.appendChild(cell);
		cell = document.createElement("td");
		row.appendChild(cell);
	}
	this.opfAntIsolSet = function(alarm) {
		ledSetColor("opfAntIsol", alarm ? "red" : "grey");
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
	this.opfEnSet = function(on) {
		try {
			var el = document.getElementById("opfEn");
			el.checked = on ? true : false;
			el.onclick();
		} catch(err) {}
	}
	this.opfEnGet = function() {
		try {
			var el = document.getElementById("opfEn");
			return el.checked ? true : false;
		} catch(err) {return true;}
	}
	this.createClearAbnSqAlarm = function(row) {
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 2;
		var el = document.createElement("input");
		el.id = "isolClearAlarm";
		el.name = el.id;
		el.type = "button";
		el.style.fontSize = "10px";
		el.style.fontWeight = "bold";
		el.value = "Clear Alarm";
		el.onclick = function(ev) {
			submitform(false, false, 0, false, true);
		}
		cell.appendChild(el);
		cell.style.paddingLeft = "10px";
	}
	this.createOpfMode = function(row) {
		var cell = document.createElement("th");
		cell.className = "thdrht";
		cell.innerHTML = "Action&nbsp;After&nbsp;Alarm";
		row.appendChild(cell);	
		//this.createOpfRoutineStatus(row);
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
		el.selectedIndex = 0;
		cell.appendChild(el);
		cell = document.createElement("td");
		cell=createTextCell("opfrunning");
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
	this.opfModeGet = function() {
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

	this.opfModes = ['Automatic Shut Down', 'Run Isolation Meas.', 'Only Alarm'];

	var self = this;
	this.pageTypes = {'NB': 0, 'ADJ': 1};
	this.pageType = 'undefined';
	this.FILTSEP90K = FILT90KSTEPKHZ;
	this.FILTSEPADJKHZ = 100;
	this.factory = null;
	this.tags = null;
	this.version = null;
	this.sernr = new SerialNrT();
	var freqStyle = parseInt(localStorage.getItem('freqStyle'+Prjstr+window.location.host));
	if (isNaN(freqStyle) || freqStyle != 0) {
		freqStyle = 1;
	}
	this.freqStyle = freqStyle;
	this.showChannelsBitmask = 0;
	this.showFiltersMask;
	this.id = 'rootElement';
	// this.msgElId = 'msgElement';
	this.parentId = 'page';
	this.fadj = [];
	this.BW_ADJ_MAX_HZ = 18000000;
	this.BW_ADJ_MIN_HZ = 100000;
	this.BW2_ADJ_MIN_HZ = (this.BW_ADJ_MIN_HZ/2);	
	this.maxChannels = 32;
	this.MAIN_GAIN_MIN = [60,60];
	this.mainGainMax = [];
	this.ISOL_GAIN_MARGIN_OLD = 15;
	this.ISOL_GAIN_MARGIN_NEW = 20;
	this.VERSION_SW_GAIN_CHANGE = {
		'MAIN': 6,
		'SUB': 31
	};
	this.MAIN_POWER_RANGE = 20;
	this.doFrequencyCheck = true;
	this.blocked = false;
	this.warningBox = new WarningBox();
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
		box.style.marginTop = "2px";
		el.appendChild(box);

		var titleBox = this.createTitleBox();
		box.appendChild(titleBox);

		var txt = document.createElement("div");
		txt.id = "msgText";
		txt.contentEditable = false;
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
		cell.className = "tdBlankW";
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
		cell.className = "tdBlankW";
		row.appendChild(cell);			
		return box;
	}
	this.createHideButton = function() {
		var hideButton = document.createElement("input");
		hideButton.type = "button";
		hideButton.id = "hideButton";
		hideButton.className = "buttonexpand";
		hideButton.state = true;
		hideButton.style.backgroundImage = "url('/minimize.png')"
		hideButton.onclick = function(ev) {
			try {
				var el = document.getElementById("msgText");
				var currentState = (el.style.display != "none");
				var nextState = !currentState;
				this.state = nextState;
				this.style.backgroundImage = this.state ? "url('/minimize.png')" : "url('/maximize.png')";
				el.style.display = this.state ? "block" : "none";
			} catch(e) {}
		}
		return hideButton;
	}
	this.setWarningMessage = function(fovlp, filtSepKhz, maxChannels, isAdj) {
		var el = document.getElementById(self.id);
		el.style.display = "block";
		var txtel = document.getElementById("msgText");
		txtel.style.paddingLeft = "20px";
		txtel.style.paddingRight = "20px";
		txtel.style.paddingTop = "5px";
		txtel.style.paddingBottom = "10px";
		var warning = "<h3>CONFLICTING FILTERS:</h3>";
		for (var b = 0; b < 2; ++b) {
			for (var c = 0; c < maxChannels; ++c) {
				if (fovlp[b][c].length == 0) {
					continue;
				}
				var msg = (b ? "Downlink":"Uplink") +" Filter "
					+ (c+1) + " conflicts with filter(s) "; 
				for (var n = 0; n < fovlp[b][c].length; ++n) {
					if (n > 0) {
						msg += ", ";
					}
					msg += (fovlp[b][c][n] + 1).toString();
				}
				msg += "</br>";
				warning += msg;
			}
		}
		txtel.innerHTML = warning;
		if (typeof(isAdj) !== 'undefined' && isAdj) {
			txtel.innerHTML += self.filterAdjWarnText(filtSepKhz);
		} else {
			txtel.innerHTML += self.filterWarnText(filtSepKhz);
		}
		//window.location.hash = '#'+self.id;
	}
	this.filterWarnText = function(filtSepKhz) {
		var str =
		"</br><h3>RULES FOR SETTING FILTER FREQUENCIES</h3>"
		+ "As a general rule, the frequency difference between two filters must be "
		+ "equal or greater than 1.25 times the semi-sum of their bandwidths.</br>"
		+ "Example: Consider 2 filters with bandwidths 90 KHz and 30 KHz. "
		+ "The minimum frequency difference between these filters is 1.25·(90 + 30)/2 = 75 KHz.</br>"
		+ "As an exception, several filters with smaller frequency difference "
		+ "can be combined to build a wider one, as long as they meet the following "
		+ "requirements:</br>"
		+ "1) All of them must have the same bandwidth setting.</br>"
		+ "2) The bandwidth setting must be 90 KHz.</br>"
		+ "3) All of them must have the same fine-gain setting.</br>"
		+ "4) The frequency separation must be: " + filtSepKhz +" KHz.";
		return str;
	}
	this.filterAdjWarnText = function(filtSepKhz) {
		var str =
		"</br><h3>RULES FOR SETTING FILTER FREQUENCIES</h3>"
		+ "The frequency separation between two filters must be must be at least "
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
function createTextCell(id) {
	var tdNode = document.createElement("td");
	tdNode.id = "txt_"+id;
	tdNode.style.minWidth = "43px";
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

function setMetValue(id, val, opt) {
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
				txt.innerHTML = val.toFixed(1);
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
	this.colorNormal = colNormal;
	this.colorWarn = colWarning;
	this.colorAlarm = colAlarm;
	this.mDiv = document.createElement("div");
	this.mSpan = document.createElement("span");
	this.mDiv.appendChild(this.mSpan);
	this.mDiv.className = "meter";
	this.mDiv.style.width = "45px";
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
