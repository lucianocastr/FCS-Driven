function Factory() {
	var self = this;
	this.formCreated = false;
	this.factmap = {
		'UPLNK':	0,
		'FMODULO':	62,
		'FSTEP':	66,
		'FASTAGC':	70,
		'PMAX':		72,
		'OPTIONS':	74,
		'FSTART_DL': 	76,
		'FSTOP_DL': 	84,
		'FREF_DL': 	92,
		'NCORX_DL': 	100,
		'PLA_MS': 	102,
		'ATTIN1': 	104,
		'ATTIN2': 	106,
		'LEVEL_DL1': 	108,
		'LEVEL_DL2': 	112,
		'NR':		116
	};
	this.factbandmap = {
		'POWER':	0,
		'SQTRH':	4,
		'MAXGAIN':	8,
		'MAXPOWER':	12,
		'DIPLEXER':	16,
		'NCORX':	20,
		'NCOTX':	22,
		'FTW':		24,
		'FSTART':	32,
		'FSTOP':	40,
		'FO':		48,
		'FDUMMY':	56,
		'OSCSEL':	60
	};
	this.factbandmapLen = Object.size(this.factbandmap);
	this.frameMap = [
		{id:'power', 	label:'POWER&nbsp;CORRECTION&nbsp;(RX UL)'		,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'sqThr', 	label:'SQUELCH&nbsp;THRESHOLD&nbsp;CORRECTION&nbsp;(RX UL)',	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'maxGain', 	label:'MAX&nbsp;GAIN&nbsp;CORRECTION&nbsp;(TX DL)'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'maxPow', 	label:'MAX&nbsp;POWER&nbsp;CORRECTION&nbsp;(TX DL)'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'diplex', 	label:'RF&nbsp;OUT&nbsp;CORRECTION&nbsp;(TX DL)'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'ncoRx', 	label:'NCO&nbsp;Rx&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'ncoTx', 	label:'NCO&nbsp;Tx&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'ftw', 	label:'DAC&nbsp;FTW&nbsp;'			,	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fStart', 	label:'BAND&nbsp;START&nbsp;FREQUENCY&nbsp;'	,	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fStop', 	label:'BAND&nbsp;STOP&nbsp;FREQUENCY&nbsp;'	,	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fo', 	label:'BAND&nbsp;REFERENCE&nbsp;FREQUENCY&nbsp;',	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fdummy', 	label:'FREQUENCY&nbsp;DUMMY&nbsp;'		,	len: 4, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'oscsel',	label:'DAC&nbsp;PRESCALER&nbsp;'		,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fmodulo',	label:'FREQUENCY&nbsp;MODULO&nbsp;'		,	len: 4, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fstep',	label:'CHANNEL&nbsp;FREQUENCY&nbsp;STEP&nbsp;'	,	len: 4, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fastAgc',	label:'FAST&nbsp;AGC&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'pmax',	label:'PMAX&nbsp;CHANNEL&nbsp;AGC&nbsp;(RX UL)'	,	len: 2, data: [], parse: function(s) {return cSignedByte(s);}, 	format: function(s) {return rSignedByte(s);} },
		{id:'confOptions',label:'PA&nbsp;POWER&nbsp;MONITOR&nbsp;'	,	len: 2, data: [], parse: function(s) {return s;},		format: function(s) {return s;} },
		{id:'fStartDL',	label:'DOWNLINK&nbsp;START&nbsp;FREQUENCY&nbsp;',	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fStopDL', 	label:'DOWNLINK&nbsp;STOP&nbsp;FREQUENCY&nbsp;'	,	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'foDL', 	label:'DOWNLINK&nbsp;REFERENCE&nbsp;FREQUENCY&nbsp;',	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'ncoRxDL', 	label:'DOWNLINK&nbsp;NCO&nbsp;Rx&nbsp;'		,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'plaMs', 	label:'PATH&nbsp;LOSS&nbsp;MEASURING&nbsp;TIME&nbsp;(ms)',len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'attinDL1',	label:'DOWNLINK&nbsp;ATTENUATOR&nbsp;RF&nbsp;IN&nbsp;1',len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'attinDL2',	label:'DOWNLINK&nbsp;ATTENUATOR&nbsp;RF&nbsp;IN&nbsp;2',len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'levelDL1',	label:'DOWNLINK&nbsp;LEVEL&nbsp;CORRECTION&nbsp;1',	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'levelDL2',	label:'DOWNLINK&nbsp;LEVEL&nbsp;CORRECTION&nbsp;2',	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} }
	];
	this.data = {
		band: [],
		fmodulo:	0,
		fstep:		0,
		fastAgc:	0,
		pmax:		0,
		noHpaMonitor:	0,
		NFPAMonitor: 	0,
		allowDisFilt: 	0,
		persistEnable: 	0,
		pwrReductionCap:0,
		pwrReductionEn: 0,
		pla_en: 	0,
		fstartDL: 	0,
		fstopDL: 	0,
		foDL: 		0,
		ncoRxDL: 	0,
		plaMs: 		0,
		attinDL1: 	0,
		attinDL2: 	0,
		levelDL1: 	0,
		levelDL2: 	0
	};
	this.data.band.push({
		powerCorr:	0,
		sqTrhCorr:	0,
		maxGainCorr:	0,
		maxPowerCorr:	0,
		diplexerLoss:	0,
		ncoRx:		0,
		ncoTx:		0,
		ftw:		0,
		fStart:		0,
		fStop:		0,
		fo:		0,
		fdummy:		0,
		oscsel:		0,
		dacspect:	0,
		testMode: 	0,
		mbCtrl: 	0,
		simplex: 	0
	});
	this.parse = function(sr) {
		if (sr.length < this.factmap['NR']) {
			return;
		}
		try {
			var p = 0;
			for (var n = 0; n < this.factbandmapLen; n++) {
				var sz = this.frameMap[n].len;
				var num = parseInt(sr.substr(p, sz), 16);
				p += sz;
				if (!isNaN(num))
					this.frameMap[n].data[0] = this.frameMap[n].parse(num);
			}
			for (var n = this.factbandmapLen; n < this.frameMap.length; n++) {
				var sz = this.frameMap[n].len;
				var num = parseInt(sr.substr(p, sz), 16);
				p += sz;
				if (!isNaN(num))
					this.frameMap[n].data[0] = this.frameMap[n].parse(num);
			}
		} catch(err) { }
		var i = 0;
		var n = 0;
		this.data.band[i].powerCorr = 	this.frameMap[n++].data[i];
		this.data.band[i].sqTrhCorr = 	this.frameMap[n++].data[i];
		this.data.band[i].maxGainCorr = this.frameMap[n++].data[i];
		this.data.band[i].maxPowerCorr = this.frameMap[n++].data[i];
		this.data.band[i].diplexerLoss = this.frameMap[n++].data[i];
		this.data.band[i].ncoRx = 	this.frameMap[n++].data[i];
		this.data.band[i].ncoTx = 	this.frameMap[n++].data[i];
		this.data.band[i].ftw = 	this.frameMap[n++].data[i];
		this.data.band[i].fStart = 	this.frameMap[n++].data[i];
		this.data.band[i].fStop = 	this.frameMap[n++].data[i];
		this.data.band[i].fo = 		this.frameMap[n++].data[i];
		this.data.band[i].fdummy = 	this.frameMap[n++].data[i];
		var k =	this.frameMap[n++].data[i];
		this.data.band[i].oscsel = (k & 0x01);
		this.data.band[i].dacspect = (k & 0x02) != 0;
		this.data.testMode = (k & 0x40) != 0;
		this.data.mbCtrl = (k & 0x80) != 0;
		this.data.simplex = (k & 0x08) != 0;
		var n = this.factbandmapLen;
		this.data.fmodulo = 	this.frameMap[n++].data[0];
		this.data.fstep = 	this.frameMap[n++].data[0];
		this.data.fastAgc = 	this.frameMap[n++].data[0] & 0x1;
		this.data.pmax = 	this.frameMap[n++].data[0];
		k = this.frameMap[n++].data[0];
		this.data.noHpaMonitor = (k & this.asmOptionBits.noHpaMonitorBit) != 0;
		this.data.NFPAMonitor = (k & this.asmOptionBits.nfpaMonitorBit) != 0;
		this.data.allowDisFilt =  (k & this.asmOptionBits.allowDisFiltBit) == 0;
		this.data.persistEnable = (k & this.asmOptionBits.persistAlarmEnableBit) != 0;
		this.data.pwrReductionCap = (k & this.asmOptionBits.pwrReductionCapBit) != 0;
		this.data.pwrReductionEn = (k & this.asmOptionBits.pwrReductionEnBit) != 0;
		this.data.pla_en = (k & this.asmOptionBits.pla_enBit) != 0;
		this.data.fstartDL = this.frameMap[n++].data[0];
		this.data.fstopDL = this.frameMap[n++].data[0];
		this.data.foDL = this.frameMap[n++].data[0];
		this.data.ncoRxDL = this.frameMap[n++].data[0];
		this.data.plaMs = this.frameMap[n++].data[0];
		this.data.attinDL1 = this.frameMap[n++].data[0];
		this.data.attinDL2 = this.frameMap[n++].data[0];
		this.data.levelDL1 = this.frameMap[n++].data[0];
		this.data.levelDL2 = this.frameMap[n++].data[0];
	}
	this.asmOptionBits = {
		noHpaMonitorBit: 	0x01,
		nfpaMonitorBit: 	0x02,
		eqComplexBit: 		0x04,
		allowDisFiltBit: 	0x08,
		persistAlarmEnableBit: 	0x10,
		pwrReductionCapBit: 	0x20,
		pwrReductionEnBit: 	0x40,
		pla_enBit: 		0x80
	};
	this.isTestMode = function() {
		return this.data.testMode;
	}
	this.isStandard = function() {
		return !this.data.mbCtrl;
	}
	this.isSimplex = function() {
		return this.data.simplex;
	}
	this.onOffOptions = ["OFF", "ON"];
	this.dacspectOptions = ["INVERTED", "NORMAL"];
	this.PAMonitorOptions = ["PA","FPGA","FIP413"];
	this.allowDisFiltOptions = ["YES", "NO"];
	this.createForm = function() {
		var Texts = TextEn;
		var cont = document.getElementById("page");
		if (this.formCreated) {
			return;
		}
		if (this.formCreated) {
			remove_children(cont);
		}
		this.formCreated = true;
		var row, cell, el;
		var frm = document.createElement("input");
		frm.type = "hidden";
		frm.name = "factory_str";
		frm.id = frm.name;
		frm.value = "";
		cont.appendChild(frm);
		var mainTab = document.createElement("table");
		cont.appendChild(mainTab);
		var mainTb = document.createElement("tbody");
		mainTab.appendChild(mainTb);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['FACTORY'];
		for (var i = 0; i < this.factbandmapLen; ++i) {
			if (this.frameMap[i].id == 'power') {
				this.createTitles(mainTb, "LEVEL&nbsp;ADJUSTMENTS");
			} else if (this.frameMap[i].id == 'ncoRx') {
				this.createTitles(mainTb, "BAND&nbsp;FREQUENCY");
			}
			row = document.createElement("tr");
			mainTb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = this.frameMap[i].label;
			cell = document.createElement("td");
			row.appendChild(cell);
			if (this.frameMap[i].id == 'oscsel') {
				el = document.createElement("select"); 
				el.className = "centered";
				for (var k = 0; k < this.onOffOptions.length; k++) {
					var opt = document.createElement("option");
					el.options.add(opt);
					opt.text = this.onOffOptions[k];
					opt.value = k;
				}
				el.selectedIndex = 0;
				el.id = this.frameMap[i].id;
				el.name = el.id;
				cell.appendChild(el);
				row = document.createElement("tr");
				mainTb.appendChild(row);
				cell = document.createElement("th");
				row.appendChild(cell);
				cell.innerHTML = "SPECTRUM&nbsp;INVERSION";
				cell = document.createElement("td");
				row.appendChild(cell);
				el = document.createElement("select"); 
				el.className = "centered";
				for (var k = 0; k < this.dacspectOptions.length; k++) {
					var opt = document.createElement("option");
					el.options.add(opt);
					opt.text = this.dacspectOptions[k];
					opt.value = k;
				}
				el.selectedIndex = 0;
				el.id = "dacspect";
				el.name = el.id;
				cell.appendChild(el);
			} else {
				el = document.createElement("input");
				el.type = "text";
				el.size = 10;
				el.className = "number";
				el.id = this.frameMap[i].id;
				el.name = el.id;
				cell.appendChild(el);
			}
			if (this.frameMap[i].id != 'ftw' && this.frameMap[i].id != 'fdummy') {
				el.onkeypress = function(ev) {
					return isKeyDecimalNumber(ev);
				}
			} else {
				el.onkeypress = function(ev) {
					return hexNumbersOnly(ev);
				}
			}
		}
		for (var i = this.factbandmapLen; i < this.frameMap.length; ++i) {
			if (this.frameMap[i].id == 'fastAgc') {
				this.createTitles(mainTb, "CONFIGURATION&nbsp;OPTIONS");
			} else if (this.frameMap[i].id == 'fStartDL') {
				this.createTitles(mainTb, "PATH&nbsp;LOSS&nbsp;ANALIZER&nbsp;SETTINGS");
				mainTb.appendChild(this.createPlaEn());
			}
			row = document.createElement("tr");
			mainTb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = this.frameMap[i].label;
			cell = document.createElement("td");
			row.appendChild(cell);
			if (this.frameMap[i].id == 'fastAgc') {
				el = document.createElement("select"); 
				el.className = "centered";
				for (var k = 0; k < this.onOffOptions.length; k++) {
					var opt = document.createElement("option");
					el.options.add(opt);
					opt.text = this.onOffOptions[k];
					opt.value = k;
				}
				el.selectedIndex = 0;
				el.id = this.frameMap[i].id;
				el.name = el.id;
				cell.appendChild(el);
			} else if (this.frameMap[i].id == 'confOptions') {
				el = document.createElement("select"); 
				el.className = "centered";
				for (var k = 0; k < this.PAMonitorOptions.length; k++) {
					var opt = document.createElement("option");
					el.options.add(opt);
					opt.text = this.PAMonitorOptions[k];
					opt.value = k==2?3:k;
				}
				el.selectedIndex = 0;	
				el.id = this.frameMap[i].id;
				el.name = el.id;
				cell.appendChild(el);

				row = document.createElement("tr");
				mainTb.appendChild(row);
				cell = document.createElement("th");
				row.appendChild(cell);
				cell.innerHTML = "ALLOW DISABLE FILTERING";
				cell = document.createElement("td");
				row.appendChild(cell);
				el = document.createElement("select"); 
				el.className = "centered";
				for (var k = 0; k < this.allowDisFiltOptions.length; k++) {
					var opt = document.createElement("option");
					el.options.add(opt);
					opt.text = this.allowDisFiltOptions[k];
					opt.value = k;
				}
				el.id = "allowDisFilt";
				el.name = el.id;
				cell.appendChild(el);
				el.selectedIndex = 0;

				mainTb.appendChild(this.createPersistAlarmEn());
				mainTb.appendChild(this.createTestMode());
				mainTb.appendChild(this.createMbCtrl());
				mainTb.appendChild(this.createSimplex());
			} else {
				el = document.createElement("input");
				el.type = "text";
				el.size = 10;
				el.className = "number";
				el.id = this.frameMap[i].id;
				el.name = el.id;
				cell.appendChild(el);
			}
			if (this.frameMap[i].id == 'pmax') {
				mainTb.appendChild(this.createPwrReductionEn());
			}
			if (this.frameMap[i].id != 'ftw' && this.frameMap[i].id != 'fdummy' && this.frameMap[i].id != 'confOptions') {
				el.onkeypress = function(ev) {
					return isKeyDecimalNumber(ev);
				}
			} else {
				el.onkeypress = function(ev) {
					return hexNumbersOnly(ev);
				}
			}
		}
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 3;
		cell.style.height = "40px";
		cell.style.verticalAlign = "bottom";
		cell.style.textAlign = "center";
		try {
			el = window.parent.navi.document.getElementById("pass");
			if (!el || el.style.display == "none")
				return;
		} catch (err) { return; }
		el = document.createElement('a');
		cell.appendChild(el);
		el.href = "/factory/fact.zhtml?showPass=true";
		el.title = 'Change Factory Password';
		el.target = "content";
		var txt = document.createTextNode("Change Factory Password");
		el.appendChild(txt);
	}
	this.createPlaEn = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "PATH&nbsp;LOSS&nbsp;ANALIZER&nbsp;ENABLE";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = "plaEn";
		el.name = el.id;
		el.className = "centered";
		cell.appendChild(el);
		return row;
	}
	this.isPlaAllowed = function() {
		return (this.data.pla_en ? true : false);
	}
	this.setPlaEn = function(on) {
		try {
			document.getElementById("plaEn").checked = on ? true : false;
		} catch(e) {}
	}
	this.isPlaEn = function() {
		try {
			return document.getElementById("plaEn").checked;
		} catch(e) { return false; }
	}
	this.createPersistAlarmEn = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "PERSISTENT-INPUT ALARM ENABLE";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = "persistAlarmEn";
		el.name = el.id;
		el.className = "centered";
		cell.appendChild(el);
		return row;
	}
	this.createTestMode = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "FIBER&nbsp;LOOP&nbsp;MODE";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "testMode";
		el.type = "checkbox";
		el.name = el.id;
		el.className = "centered";
		cell.appendChild(el);
		return row;
	}
	this.createMbCtrl = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "MAIN&nbsp;/&nbsp;BACKUP&nbsp;CONTROL";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "mbCtrl";
		el.type = "checkbox";
		el.name = el.id;
		el.className = "centered";
		cell.appendChild(el);
		return row;
	}
	this.createSimplex = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "SIMPLEX&nbsp;MODE&nbsp;PERMITTED";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "simplex";
		el.type = "checkbox";
		el.name = el.id;
		el.className = "centered";
		cell.appendChild(el);
		return row;
	}
	this.createPwrReductionEn = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "POWER&nbsp;REDUCTION&nbsp;ENABLE&nbsp;(RX&nbsp;UL)";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = "pwrReductionEn";
		el.name = el.id;
		el.className = "centered";
		cell.appendChild(el);
		return row;
	}
	this.createTitles = function(mainTb, titleTxt) {
		var Texts = TextEn;
		var row = document.createElement("tr");
		row.style = "height: 20px";
		mainTb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = titleTxt;
		cell.style.color = "black";
		row.appendChild(cell);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
	}
	this.render = function() {
		var el;
		try {
			var i = 0;
			var n = 0;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].powerCorr.toFixed(1);
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].sqTrhCorr.toFixed(1);
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].maxGainCorr.toFixed(1);
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].maxPowerCorr.toFixed(1);
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].diplexerLoss.toFixed(1);
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].ncoRx;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].ncoTx;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = hexformat(this.data.band[i].ftw, 8);
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].fStart;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].fStop;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].fo;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = hexformat(this.data.band[i].fdummy, 4);
			el = document.getElementById(this.frameMap[n++].id);
			el.selectedIndex = this.data.band[i].oscsel == 0 ? 0 : 1;
			el = document.getElementById("dacspect");
			el.selectedIndex = this.data.band[i].dacspect;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.fmodulo;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.fstep;
			el = document.getElementById(this.frameMap[n++].id);
			el.selectedIndex = this.data.fastAgc;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.pmax;
			el = document.getElementById(this.frameMap[n++].id);
			var v = this.data.noHpaMonitor & 0x01;
			if (this.data.NFPAMonitor & 0x01) v=2;
			el.selectedIndex = v;
			el = document.getElementById("allowDisFilt");
			el.selectedIndex = this.data.allowDisFilt ? 0 : 1;
			el = document.getElementById("persistAlarmEn");
			el.disabled = false;
			el.checked = this.data.persistEnable;
			var disp = el.style.display;
			el.style.display = 'none';
			var trick = el.offsetHeight;
			el.style.display = disp;
			el = document.getElementById("testMode");
			el.checked = this.data.testMode;
			el = document.getElementById("mbCtrl");
			el.checked = this.data.mbCtrl;
			el = document.getElementById("simplex");
			el.checked = this.data.simplex;
			el = document.getElementById("pwrReductionEn");
			if (typeof(el) != "undefined" && el) {
				if (this.data.pwrReductionCap) {
					el.disabled = false;
					el.checked = this.data.pwrReductionEn;
				} else {
					el.disabled = true;
					el.checked = false;
				}
			}
			self.setPlaEn(this.data.pla_en);
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.fstartDL;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.fstopDL;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.foDL;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.ncoRxDL;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.plaMs;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.attinDL1;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.attinDL2;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.levelDL1.toFixed(1);
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.levelDL2.toFixed(1);
		} catch(err) { }
	}
	this.format = function(currentStr) {
		var frame = "";
		var el, num, str;
		try {
			var p = 0;
			for (var n = 0; n < this.factbandmapLen; n++) {
				var sz = this.frameMap[n].len;
				var i = 0;
				el = document.getElementById(this.frameMap[n].id);
				if (!el) {
					str = currentStr.substr(p, sz);
					p += sz;
					frame += str;
					continue;
				}
				if (this.frameMap[n].id == 'power') 		num = parseFloat(el.value);
				else if (this.frameMap[n].id == 'sqThr') 	num = parseFloat(el.value);
				else if (this.frameMap[n].id == 'sqThr') 	num = parseFloat(el.value);
				else if (this.frameMap[n].id == 'maxGain') 	num = parseFloat(el.value);
				else if (this.frameMap[n].id == 'maxPow') 	num = parseFloat(el.value);
				else if (this.frameMap[n].id == 'diplex') 	num = parseFloat(el.value);
				else if (this.frameMap[n].id == 'ncoRx') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'ncoTx') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'ftw') 		num = parseInt(el.value, 16);
				else if (this.frameMap[n].id == 'fStart') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fStop') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fo') 		num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fdummy') 	num = parseInt(el.value, 16);
				else if (this.frameMap[n].id == 'oscsel') {
					num = el.selectedIndex;
					el = document.getElementById('dacspect');
					if (el) num |= (el.selectedIndex ? 0x02 : 0);
					el = document.getElementById("testMode");
					if (el && el.checked) {
						num |= 0x40;
					}
					el = document.getElementById("mbCtrl");
					if (el && el.checked) {
						num |= 0x80;
					}
					el = document.getElementById("simplex");
					if (el && el.checked) {
						num |= 0x08;
					}
				}
				str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
				p += sz;
				frame += str;
			}
			for (var n = this.factbandmapLen; n < this.frameMap.length; n++) {
				el = document.getElementById(this.frameMap[n].id);
				var sz = this.frameMap[n].len;
				if (!el) {
					str = currentStr.substr(p, sz);
					p += sz;
					frame += str;
					continue;
				}
				if (this.frameMap[n].id == 'fmodulo') 		num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fstep') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fastAgc') 	num = el.selectedIndex;
				else if (this.frameMap[n].id == 'pmax') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'confOptions') {
					num = parseInt(currentStr.substr(p, sz), 16);
					var mask = (this.asmOptionBits.eqComplexBit | this.asmOptionBits.pwrReductionCapBit);
					num &= mask;
					mask = (this.asmOptionBits.noHpaMonitorBit | this.asmOptionBits.nfpaMonitorBit);
					num |= el.selectedIndex & mask; 
					el = document.getElementById('allowDisFilt');
					if (el.selectedIndex == 1) {
						num |= this.asmOptionBits.allowDisFiltBit;
					}
					el = document.getElementById('persistAlarmEn');
					if (el && el.checked) {
						num |= this.asmOptionBits.persistAlarmEnableBit;
					}
					num |= this.data.pwrReductionCap ? this.asmOptionBits.pwrReductionCapBit : 0;
					el = document.getElementById('pwrReductionEn');
					if (el && el.checked) {
						num |= this.asmOptionBits.pwrReductionEnBit;
					}
					if (self.isPlaEn()) {
						num |= this.asmOptionBits.pla_enBit;
					}
				} else if (this.frameMap[n].id == 'levelDL1' || 
					this.frameMap[n].id == 'levelDL2' ) 
				{
					num = parseFloat(el.value);
				} else {
					num = parseInt(el.value);
				}
				str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
				p += sz;
				frame += str;
			}
		} catch (err) { }
		return frame;
	}
	this.computeFrefDl = function() {
		var fstart = this.data.fstartDL;
		var fstop = this.data.fstopDL;
		var fRefDL = this.data.foDL;
		var BW = ~~Math.round(Math.abs((fstop - fstart)/2));
		return {fREFDL: fRefDL, bwDL: BW};
	}
	// this.computeFrefDl = function() {
	// 	var fModulo = this.data.fmodulo;
	// 	var fStep = this.data.fstep;
	// 	var fStart = this.data.band[0].fStart;
	// 	var fStop = this.data.band[0].fStop;
	// 	var fRef = this.data.band[0].fo;
	// 	var ncoRx = this.data.band[0].ncoRx;
	// 	var ncoTx = this.data.band[0].ncoTx;
	// 	var FTW = this.data.band[0].ftw;
	// 	var K = this.data.band[0].oscsel == 1 ? 0.5 : 1;
	// 	var P = this.data.band[0].dacspect ? 1 : -1;
	// 	var fIQ = fModulo * fStep * 2;
	// 	var oscType = this.computeOscType(~~Math.round(fModulo));
	// 	var except = (fRef == 487500000) 
	// 			&& (fStart == 485500000)
	// 			&& (fStop == 487500000);
	// 	var fSysclk = this.computeSysclk(oscType, except);
	// 	var OL = this.computeOL(fRef, fSysclk);
	// 	var ifDac = (FTW / Math.pow(2, 32)) * fSysclk * K;
	// 	var rfDac =  OL + ifDac * P;
	// 	var NCOtxP;
	// 	if (oscType == "OSC67.5") {
	// 		NCOtxP = ncoTx * 4 + ((ncoRx & 0xC0) >> 6);
	// 	} else {
	// 		NCOtxP = ncoTx;
	// 	}
	// 	var MOD = this.computeMod(oscType);
	// 	var NCOtxPP;
	// 	if (NCOtxP < MOD / 2) {
	// 		NCOtxPP = NCOtxP;
	// 	} else {
	// 		NCOtxPP = NCOtxP - MOD;
	// 	}
	// 	var fRefDL = rfDac + NCOtxPP * fIQ / MOD;
	// 	var BW = this.computeBwDL(oscType);
	// 	return {fREFDL: fRefDL, bwDL: BW};
	// }
	// this.computeOscType = function(f) {
	// 	if (f % 1600 == 0) {
	// 		return "OSC160";
	// 	} else if (f % 1500 == 0) {
	// 		return "OSC150";
	// 	} else if (f % 1350 == 0) {
	// 		return "OSC67.5";
	// 	} else if (f % 1536 == 0) {
	// 		return "OSC153";
	// 	}		
	// }
	// this.computeSysclk = function(oscType, except) {
	// 	if (oscType == "OSC160") {
	// 		return 960000000;
	// 	} else if (oscType == "OSC150") {
	// 		return 900000000;
	// 	} else if (oscType == "OSC153") {		
	// 		return 921600000;
	// 	} else if (oscType == "OSC67.5") {
	// 		if (!except) {
	// 			return 945000000;
	// 		} else {
	// 			return 810000000;
	// 		}
	// 	}
	// }
	// this.computeOL = function(fRef, fSysclk) {
	// 	if (fRef < 200000000) {
	// 		return 0;
	// 	}
	// 	if (fRef < 600000000) {
	// 		return fSysclk / 2;
	// 	}
	// 	return fSysclk;
	// }
	// this.computeMod = function(oscType) {
	// 	if (oscType == "OSC160" || oscType == "OSC153") {
	// 		return 256;
	// 	} else if (oscType == "OSC150") {
	// 		return 240;
	// 	} else if (oscType == "OSC67.5") {
	// 		return 864;
	// 	}
	// }
	// this.computeBwDL = function(oscType) {
	// 	if (oscType == "OSC160") {
	// 		return 9E6;
	// 	} else if (oscType == "OSC150" || oscType == "OSC153") {
	// 		return 8.5E6;
	// 	} else if (oscType == "OSC67.5") {
	// 		return 7.5E6;
	// 	}
	// }
}
