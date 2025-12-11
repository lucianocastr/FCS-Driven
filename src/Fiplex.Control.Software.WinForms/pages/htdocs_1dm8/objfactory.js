<!--
function Factory() {
	var self = this;
	this.formCreated = false;
	this.factmap = {
		'DNLNK':	0,
		'FMODULO':	86,
		'FSTEP':	90,
		'DEVCONFIG':	94,
		'NR':		96,
		'PWRMAX': 	96,
		'PACURR': 	98,
		'PAMEASURE': 	100,
		'NR2': 		100,
		'NRMAX': 	102,
		'PACURR2': 	104,
		'PAMEASURE2': 	106
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
		'FSTARTUL':	32,
		'FSTARTDL':	40,
		'FSTOPUL':	48,
		'FSTOPDL':	56,
		'FOUL':		64,
		'FODL':		72,
		'FDUMMY':	80,
		'OSCSEL':	84
	};
	this.factbandmapLen = Object.size(this.factbandmap);
	this.frameMap = [
		{id:'power', 	label:'POWER&nbsp;CORRECTION&nbsp;(RX DL)'		,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'sqThr', 	label:'SQUELCH&nbsp;THRESHOLD&nbsp;CORRECTION&nbsp;(RX DL)',	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'maxGain', 	label:'MAX&nbsp;GAIN&nbsp;CORRECTION&nbsp;(TX UL)'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'maxPow', 	label:'MAX&nbsp;POWER&nbsp;CORRECTION&nbsp;(TX UL)'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'diplex', 	label:'RF&nbsp;OUT&nbsp;CORRECTION&nbsp;(TX UL)'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'ncoRx', 	label:'NCO&nbsp;Rx&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'ncoTx', 	label:'NCO&nbsp;Tx&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'ftw', 	label:'DAC&nbsp;FTW&nbsp;'			,	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fStartUL',	label:'BAND&nbsp;START&nbsp;FREQUENCY&nbsp;UL&nbsp;',	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fStartDL',	label:'BAND&nbsp;START&nbsp;FREQUENCY&nbsp;DL&nbsp;',	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fStopUL',	label:'BAND&nbsp;STOP&nbsp;FREQUENCY&nbsp;UL&nbsp;',	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fStopDL',	label:'BAND&nbsp;STOP&nbsp;FREQUENCY&nbsp;DL&nbsp;',	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'foUL',	label:'BAND&nbsp;REFERENCE&nbsp;FREQUENCY&nbsp;UL&nbsp;',	len: 8, data: [], parse: function(s) {return s;}, 	format: function(s) {return s;} },
		{id:'foDL',	label:'BAND&nbsp;REFERENCE&nbsp;FREQUENCY&nbsp;DL&nbsp;',	len: 8, data: [], parse: function(s) {return s;}, 	format: function(s) {return s;} },
		{id:'fdummy',	label:'FREQUENCY&nbsp;DUMMY&nbsp;'		,	len: 4, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'oscsel',	label:'DAC&nbsp;PRESCALER&nbsp;'		,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fmodulo',	label:'FREQUENCY&nbsp;MODULO&nbsp;'		,	len: 4, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fstep',	label:'CHANNEL&nbsp;FREQUENCY&nbsp;STEP&nbsp;'	,	len: 4, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'devConfig',label:''					,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'pwrRedPmax',label:''					,	len: 2, data: [], parse: function(s) {return cSignedByte(s);}, 	format: function(s) {return rSignedByte(s);} },
		{id:'paCurrent',label:''					,	len: 2, data: [], parse: function(s) {return s*10;}, 		format: function(s) {return Math.round(s/10);} },
		{id:'paMeasure',label:''					,	len: 2, data: [], parse: function(s) {return s*10;}, 		format: function(s) {return Math.round(s/10);} },
		{id:'paCurrent2',label:''					,	len: 2, data: [], parse: function(s) {return s*10;}, 		format: function(s) {return Math.round(s/10);} },
		{id:'paMeasure2',label:''					,	len: 2, data: [], parse: function(s) {return s*10;}, 		format: function(s) {return Math.round(s/10);} }		
	];
	this.devConfig = [
		{id: 'fastAgc',		shift: 0, label: 'FAST&nbsp;AGC&nbsp;',			options: ['OFF', 'ON'] },
		{id: 'uplinkCoupling',	shift: 1, label: 'UPLINK&nbsp;COUPLING&nbsp;',		options: ["COUPLED", "ANTENNA"] },
		{id: 'allowDisableFilt',shift: 2, label: 'ALLOW&nbsp;DISABLE&nbsp;FILTERING&nbsp;', options: ['NO', 'YES'] },
		{id: 'PAMonitor',	shift: 3, label: 'PA&nbsp;MONITOR&nbsp', 		options: ['PA', 'FPGA', 'FIP413'] },
		{id: 'vtunesel',	shift: 4, label: 'OSCILLATOR&nbsp;LOOP&nbsp', 		options: ['OPEN', 'PLL'] },
		{id: 'paCurrentAlarmEnable', shift: 7, label: 'ENABLE&nbsp;PA&nbsp;CURRENT&nbsp;ALARM&nbsp;', options: ['NO', 'YES'] }
	];
	this.data = {
		band: [],
		fmodulo:	0,
		fstep:		0,
		fastAgc:	0,
		uplinkCoupling:	0,
		allowDisableFilt: 0,
		PAMonitor:	0,
		vtunesel: 	0,
		NFPAMonitor: 	0,
		pwrReductionPmax: 0,
		paCurrentAlarmEnable: 0,
		paCurrent: 	0,
		paMeasure: 	0,
		paCurrent2: 	0,
		paMeasure2: 	0
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
		fStartUL:	0,
		fStartDL:	0,
		fStopUL:	0,
		fStopDL:	0,
		foUL:		0,
		foDL:		0,
		fdummy:		0,
		oscsel:		0,
		dacspect:	0,
		ignoreDataSync: 0,
		testMode: 	0,
		pwrReductionCap:0,
		pwrReductionEn: 0,
		ign_tx_low: 	0,
		simplex: 	0
	});
	this.hasPwrReductionPmax = true;
	this.hasPaCurrent = true;
	this.parse = function(sr) {
		if (sr.length < this.factmap['NR']) {
			return;
		}
		if (sr.length > this.factmap['NR']) {
			this.hasPwrReductionPmax = true;
			this.hasPaCurrent = true;
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
			for (var n = this.factbandmapLen; n < this.frameMap.length && p < sr.length; n++) {
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
		this.data.band[i].fStartUL = 	this.frameMap[n++].data[i];
		this.data.band[i].fStartDL = 	this.frameMap[n++].data[i];
		this.data.band[i].fStopUL = 	this.frameMap[n++].data[i];
		this.data.band[i].fStopDL = 	this.frameMap[n++].data[i];
		this.data.band[i].foUL = 	this.frameMap[n++].data[i];
		this.data.band[i].foDL = 	this.frameMap[n++].data[i];
		this.data.band[i].fdummy = 	this.frameMap[n++].data[i];
		var k =	this.frameMap[n++].data[i];
		this.data.band[i].oscsel = 		(k & 0x01);
		this.data.band[i].dacspect = 		(k & 0x02) != 0;
		this.data.band[i].ignoreDataSync = 	(k & 0x04) != 0;
		this.data.band[i].pwrReductionCap = 	(k & 0x08) != 0;
		this.data.band[i].pwrReductionEn = 	(k & 0x10) != 0;
		this.data.band[i].ign_tx_low = 		(k & 0x20) != 0;
		this.data.band[i].testMode = 		(k & 0x40) != 0;
		this.data.band[i].simplex = 		(k & 0x80) != 0;
		var n = this.factbandmapLen;
		this.data.fmodulo = 	this.frameMap[n++].data[0];
		this.data.fstep = 	this.frameMap[n++].data[0];
		var mask = 		this.frameMap[n++].data[0];
		this.data.fastAgc = 		(mask >> this.devConfig[0].shift) & 0x01;
		this.data.uplinkCoupling = 	(mask >> this.devConfig[1].shift) & 0x01;
		this.data.allowDisableFilt = 	(mask >> this.devConfig[2].shift) & 0x01;
		this.data.PAMonitor = 	(mask >> this.devConfig[3].shift) & 0x01;
		this.data.NFPAMonitor = (mask >> (this.devConfig[3].shift+2)) & 0x01;  //special case for FIP413
		this.data.vtunesel = 	(mask >> this.devConfig[4].shift) & 0x01;
		this.data.paCurrentAlarmEnable = ((mask >> this.devConfig[5].shift) & 0x01) && this.hasPaCurrent;
		this.data.eqIm = ((mask >> 6) & 0x01);
		if (this.hasPwrReductionPmax) {
			this.data.pwrReductionPmax = this.frameMap[n++].data[0];
		}
		if (this.hasPaCurrent) {
			this.data.paCurrent = this.frameMap[n++].data[0];
			this.data.paMeasure = this.frameMap[n++].data[0];
			this.data.paCurrent2 = this.frameMap[n++].data[0];
			this.data.paMeasure2 = this.frameMap[n++].data[0];	
		}
	}
	this.isSimplexAllowed = function() {
		return this.data.band[0].simplex;
	}
	this.isEqIm = function() {
		return (this.data.eqIm == 1);
	}
	this.showPaCurrentAlarm = function() {
		return (this.hasPaCurrent && this.data.paCurrentAlarmEnable);
	}
	this.isTestMode = function() {
		return this.data.band[0].testMode;
	}
	this.ignorePaTxLowAlarm = function() {
		return this.data.band[0].ign_tx_low;
	}
	this.isNfpaMonitor = function() {
		return (this.data.NFPAMonitor != 0);
	}
	this.onOffOptions = ["OFF", "ON"];
	this.dacspectOptions = ["INVERTED", "NORMAL"];
	this.uplinkCouplingCorrections = { rfInDL: [0, -40], gainMax: [ 50,  85] };
	this.createForm = function(version) {
		var Texts = TextEn;
		var sne = typeof(version) != "undefined";
		var cont = document.getElementById("page");
		if (this.formCreated && this.showNewElements == sne) {
			return;
		}
		if (this.formCreated) {
			remove_children(cont);
		}
		this.showNewElements = sne;
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
				el.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
			} else {
				el.onkeypress = function(ev) { return hexNumbersOnly(ev); }
			}
		}
		for (var j = 0, i = this.factbandmapLen; j <  2 ; ++j, ++i) {
			row = document.createElement("tr");
			mainTb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = this.frameMap[i].label;
			cell = document.createElement("td");
			row.appendChild(cell);
			el = document.createElement("input");
			el.type = "text";
			el.size = 10;
			el.className = "number";
			el.id = this.frameMap[i].id;
			el.name = el.id;
			cell.appendChild(el);
			if (this.frameMap[i].id == 'ftw' || this.frameMap[i].id == 'fdummy') {
				el.onkeypress = function(ev) { return hexNumbersOnly(ev); }
			} else {
				el.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
			}
		}
		this.createTitles(mainTb, "DEVICE&nbsp;CONFIGURATION");
		for (var i = 0; i < this.devConfig.length; ++i) {
			if (!this.showNewElements) {
				if (this.devConfig[i].id == 'paCurrentAlarmEnable') {
					continue;
				}
			}
			if (this.devConfig[i].id == 'paCurrentAlarmEnable') {
				mainTb.appendChild(this.createPaCurrentAlarmEnable());
				continue;
			}
			row = document.createElement("tr");
			mainTb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = this.devConfig[i].label;
			cell = document.createElement("td");
			row.appendChild(cell);
			el = document.createElement("select"); 
			el.className = "centered";
			for (var k = 0; k < this.devConfig[i].options.length; k++) {
				var opt = document.createElement("option");
				el.options.add(opt);
				opt.text = this.devConfig[i].options[k];
				opt.value = k;
			}
			el.selectedIndex = 0;
			el.id = this.devConfig[i].id;
			el.name = el.id;
			cell.appendChild(el);
		}
		mainTb.appendChild(this.createPaCurrent(1,""));
		mainTb.appendChild(this.createPaCurrent(2,"2"));
		mainTb.appendChild(this.createIgnoreTxLow());
		mainTb.appendChild(this.createIgnoreDSync());
		mainTb.appendChild(this.createPwrReductionEn());
		mainTb.appendChild(this.createPwrReductionPmax());
		
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "FIBER&nbsp;LOOP&nbsp;MODE";
		cell = document.createElement("td");
		row.appendChild(cell);
		el = document.createElement("input");
		el.type = "checkbox";
		el.id = "testMode";
		el.name = el.id;
		el.className = "centered";
		cell.appendChild(el);
		mainTb.appendChild(this.createSimplex());
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
	this.createPaCurrentAlarmEnable = function() {
		var k;
		for (k = 0; k < this.devConfig.length; ++k) {
			if (this.devConfig[k].id == 'paCurrentAlarmEnable') {
				break;
			}
		}
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = this.devConfig[k].label;
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = this.devConfig[k].id;;
		el.name = el.id;
		el.className = "centered";
		cell.appendChild(el);
		el.onchange = function(ev) {
			self.enablePACurrentSetting(this.checked);
		}
		return row;
	}
	this.createIgnoreDSync = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "IGNORE&nbsp;DATA&nbsp;SYNC";
		cell = document.createElement("td");
		row.appendChild(cell);
		el = document.createElement("input");
		el.type = "checkbox";
		el.id = "ignoreDataSync";
		el.name = el.id;
		el.className = "centered";
		cell.appendChild(el);
		return row;
	}
	this.createPaCurrent = function(num,index) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "PA&nbsp;CURRENT&nbsp;ALARM&nbsp;(mA)&nbsp;"+num;
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.type = "text";
		el.id = "paCurrent"+index;
		el.name = el.id;
		el.size = 10;
		el.className = "number";
		el.disabled = true;
		el.style.backgroundColor = "#D8D8D8";
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.id = "paMeasure"+index;
		cell.name = cell.id;
		cell.style.textAlign = "center";
		cell.style.minWidth = "80px";
		cell.style.border = "thin solid #fb7922";
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.style.color = "#fb7922";
		cell.innerHTML = "Measurement"
		return row;
	}
	this.enablePACurrentSetting = function(val) {
		var el = document.getElementById('paCurrent');
		var el1 = document.getElementById('paCurrent2');
		try {
			el.disabled = !val;
			el.style.backgroundColor = val ? 'white' : '#D8D8D8';
			el1.disabled = !val;
			el1.style.backgroundColor = val ? 'white' : '#D8D8D8';			
		} catch(err) {}
	}
	this.createIgnoreTxLow = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "IGNORE&nbsp;TX&nbsp;LOW&nbsp;ALARM";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = "ign_tx_low";
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
		el.type = "checkbox";
		el.id = "simplex";
		el.name = el.id;
		el.className = "centered";
		cell.appendChild(el);
		return row;
	}
	this.createPwrReductionEn = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "POWER&nbsp;REDUCTION&nbsp;ENABLE&nbsp;(RX&nbsp;DL)";
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
	this.createPwrReductionPmax = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "PMAX&nbsp;CHANNEL&nbsp;AGC&nbsp;(RX&nbsp;DL)";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.type = "text";
		el.id = "pwrRedPmax";
		el.name = el.id;
		el.size = 10;
		el.className = "number";
		el.disabled = true;
		el.style.backgroundColor = "#D8D8D8";
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
			el.value = this.data.band[i].fStartUL;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].fStartDL;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].fStopUL;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].fStopDL;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].foUL;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.band[i].foDL;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = hexformat(this.data.band[i].fdummy, 4);
			el = document.getElementById(this.frameMap[n++].id);
			el.selectedIndex = this.data.band[i].oscsel == 0 ? 0 : 1;
			el = document.getElementById("dacspect");
			el.selectedIndex = this.data.band[i].dacspect;
			el = document.getElementById("ignoreDataSync");
			el.checked = this.data.band[i].ignoreDataSync;
			el = document.getElementById("testMode");
			el.checked = this.data.band[i].testMode;
			el = document.getElementById("pwrReductionEn");
			el.disabled = false;
			el.checked = this.data.band[i].pwrReductionEn;
			el = document.getElementById("ign_tx_low");
			el.checked = this.data.band[i].ign_tx_low;
			el = document.getElementById("simplex");
			el.checked = this.data.band[i].simplex;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.fmodulo;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.fstep;
			el = document.getElementById(this.devConfig[i++].id);
			el.selectedIndex = this.data.fastAgc;
			el = document.getElementById(this.devConfig[i++].id);
			el.selectedIndex = this.data.uplinkCoupling;
			el = document.getElementById(this.devConfig[i++].id);
			el.selectedIndex = this.data.allowDisableFilt;
			el = document.getElementById(this.devConfig[i++].id);
			var v = this.data.PAMonitor;
			if (this.data.NFPAMonitor & 0x01) v=2;
			el.selectedIndex = v;			
			el = document.getElementById(this.devConfig[i++].id);
			el.selectedIndex = this.data.vtunesel;
			el = document.getElementById(this.devConfig[i++].id);
			if (typeof(el) != "undefined" && el) {
				el.checked = this.data.paCurrentAlarmEnable;
			}
			if (this.hasPwrReductionPmax) {
				el = document.getElementById(this.frameMap[++n].id);
				el.value = this.data.pwrReductionPmax;
				el.disabled = false;
				el.style.backgroundColor = "white";
			}
			this.enablePACurrentSetting(this.data.paCurrentAlarmEnable);
			if (this.data.paCurrentAlarmEnable) {
				el = document.getElementById(this.frameMap[++n].id);
				if (typeof(el) != "undefined" && el) {
					el.value = this.data.paCurrent;
				}
				el = document.getElementById(this.frameMap[++n].id);
				if (typeof(el) != "undefined" && el) {
					el.innerHTML = this.data.paMeasure+"&nbsp;mA";
				}
				el = document.getElementById(this.frameMap[++n].id);
				if (typeof(el) != "undefined" && el) {
					el.value = this.data.paCurrent2;
				}
				el = document.getElementById(this.frameMap[++n].id);
				if (typeof(el) != "undefined" && el) {
					el.innerHTML = this.data.paMeasure2+"&nbsp;mA";
				}				
			}
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
				else if (this.frameMap[n].id == 'fStartUL') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fStartDL') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fStopUL') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fStopDL') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'foUL') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'foDL') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fdummy') 	num = parseInt(el.value, 16);
				else if (this.frameMap[n].id == 'oscsel') {
					num = el.selectedIndex;
					el = document.getElementById('dacspect');
					if (el) num |= (el.selectedIndex ? 0x02 : 0);
					el = document.getElementById('ignoreDataSync');
					if (el) num |= (el.checked ? 0x04 : 0);
					el = document.getElementById('testMode');
					if (el) num |= (el.checked ? 0x40 : 0);
					el = document.getElementById('simplex');
					if (el) num |= (el.checked ? 0x80 : 0);
					num |= this.data.pwrReductionCap ? 0x08 : 0;
					el = document.getElementById('pwrReductionEn');
					if ((typeof(el) != 'undefined') && el && el.checked) {
						num |= 0x10;
					}
					el = document.getElementById("ign_tx_low");
					if ((typeof(el) != 'undefined') && el && el.checked) {
						num |= 0x20;
					}
				}
				str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
				p += sz;
				frame += str;
			}
			for (var i = 0, n = this.factbandmapLen; i < 2; i++, n++) {
				el = document.getElementById(this.frameMap[n].id);
				var sz = this.frameMap[n].len;
				if (!(typeof(el) != 'undefined' && el)) {
					str = currentStr.substr(p, sz);
					p += sz;
					frame += str;
					continue;
				}
				if (this.frameMap[n].id == 'fmodulo') 		num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fstep') 	num = parseInt(el.value);
				str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
				p += sz;
				frame += str;
			}
			var sz = this.frameMap[n].len;
			num = 0;
			try {
				for (var i = 0; i < this.devConfig.length; ++i) {
					el = document.getElementById(this.devConfig[i].id);
					if (typeof(el) != 'undefined' && el) {
						if (this.devConfig[i].id == 'paCurrentAlarmEnable') {
							if (el.checked) {
								num |= 1 << this.devConfig[i].shift;
							}
						} else {
							num |= ((el.selectedIndex & 0x1)<< this.devConfig[i].shift);
							if ((i==3) && (el.selectedIndex==2)) num|=0x28; //special case for FIP413
						}
					}
				}
				str = hexformat(this.frameMap[n].format(num), sz);
			} catch (e) { str = currentStr.substr(frame.length, sz); }
			frame += str;
			while (++n < this.frameMap.length - 1) {
				el = document.getElementById(this.frameMap[n].id);
				sz = this.frameMap[n].len;
				if (typeof(el) != 'undefined' && el) {
					num = parseInt(el.value);
					if (!isNaN(num)) {
						str = hexformat(this.frameMap[n].format(num), sz);
					} else {
						str = currentStr.substr(frame.length, sz);
					}
					frame += str; 
				} else if (currentStr.length > frame.length) {
					str = currentStr.substr(frame.length, sz);
					frame += str;
				}
			}
			frame += '00'; //relleno para la última medida de corriente
		} catch (err) { }
		return frame;
	}
}
// -->
