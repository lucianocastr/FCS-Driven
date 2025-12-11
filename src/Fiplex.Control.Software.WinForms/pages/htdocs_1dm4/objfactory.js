<!--
function Factory() {
	this.factmap = {
		'DNLNK':	0,
		'FMODULO':	86,
		'FSTEP':	90,
		'DEVCONFIG':	94,
		'NR':		96
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
		{id:'devConfig',label:''					,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} }
	];
	this.devConfig = [
		{id: 'fastAgc',		shift: 0, label: 'FAST&nbsp;AGC&nbsp;',			options: ['OFF', 'ON'] },
		{id: 'uplinkCoupling',	shift: 1, label: 'UPLINK&nbsp;COUPLING&nbsp;',		options: ["COUPLED", "ANTENNA"] },
		{id: 'allowDisableFilt',shift: 2, label: 'ALLOW&nbsp;DISABLE&nbsp;FILTERING&nbsp;', options: ['NO', 'YES'] },
		{id: 'PAMonitor',	shift: 3, label: 'PA&nbsp;MONITOR&nbsp', 		options: ['PA', 'FPGA', 'FIP413'] },
		{id: 'vtunesel',	shift: 4, label: 'OSCILLATOR&nbsp;LOOP&nbsp', 		options: ['OPEN', 'PLL'] }
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
		NFPAMonitor:0
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
		dacspect:	0
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
		this.data.band[i].fStartUL = 	this.frameMap[n++].data[i];
		this.data.band[i].fStartDL = 	this.frameMap[n++].data[i];
		this.data.band[i].fStopUL = 	this.frameMap[n++].data[i];
		this.data.band[i].fStopDL = 	this.frameMap[n++].data[i];
		this.data.band[i].foUL = 	this.frameMap[n++].data[i];
		this.data.band[i].foDL = 	this.frameMap[n++].data[i];
		this.data.band[i].fdummy = 	this.frameMap[n++].data[i];
		var k =	this.frameMap[n++].data[i];
		this.data.band[i].oscsel = (k & 0x01);
		this.data.band[i].dacspect = (k & 0x02) != 0;
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
	}
	this.onOffOptions = ["OFF", "ON"];
	this.dacspectOptions = ["INVERTED", "NORMAL"];
	this.uplinkCouplingCorrections = { rfInDL: [0, -40], gainMax: [ 50,  85] };
	this.createForm = function() {
		var Texts = TextEn;
		var row, cell, el;
		var cont = document.getElementById("page");
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
		for (var i = this.factbandmapLen; i < this.frameMap.length - 1 ; ++i) {
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
				}
				str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
				p += sz;
				frame += str;
			}
			for (var n = this.factbandmapLen; n < this.frameMap.length - 1; n++) {
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
				str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
				p += sz;
				frame += str;
			}
			var n = this.frameMap.length - 1;
			var sz = this.frameMap[n].len;
			num = 0;
			try {
				for (var i = 0; i < this.devConfig.length; ++i) {
					el = document.getElementById(this.devConfig[i].id);
					num |= ((el.selectedIndex & 0x1)<< this.devConfig[i].shift);
					if ((i==3) && (el.selectedIndex==2)) num|=0x28; //special case for FIP413
				}
				str = hexformat(this.frameMap[n].format(num), sz);
			} catch (e) { str = currentStr.substr(frame.length, sz); }
			frame += str;
		} catch (err) { }
		return frame;
	}
}
// -->
