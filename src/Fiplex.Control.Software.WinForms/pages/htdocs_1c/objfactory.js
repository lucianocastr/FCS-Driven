<!--
function Factory() {
	this.factmap = {
		'UPLNK':	0,
		'DNLNK':	70,
		'FMODULO':	140,
		'FSTEP':	144,
		'FASTAGC':	148,
		'BANDWIDTHS':	150,
		'NR':		152
	};
	this.factbandmap = {
		'POWER':	0,
		'SQTRH':	4,
		'MAXGAIN':	8,
		'MAXPOWER':	12,
		'DIPLEXER':	16,
		'SPECT':	20,
		'ATTOUT':	22,
		'POWERLIM':	24,
		'GAINLIM':	26,
		'NCORX':	28,
		'NCOTX':	30,
		'FTW':		32,
		'FSTART':	40,
		'FSTOP':	48,
		'FO':		56,
		'FDUMMY':	64,
		'OSCSEL':	68
	};
	this.factbandmapLen = Object.size(this.factbandmap);
	this.frameMap = [
		{id:'power', 	label:'POWER&nbsp;CORRECTION&nbsp;'		,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'sqThr', 	label:'SQUELCH&nbsp;THRESHOLD&nbsp;CORRECTION&nbsp;',	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'maxGain', 	label:'MAX&nbsp;GAIN&nbsp;CORRECTION&nbsp;'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'maxPow', 	label:'MAX&nbsp;POWER&nbsp;CORRECTION&nbsp;'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'diplex', 	label:'RF&nbsp;OUT&nbsp;CORRECTION&nbsp;'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'spectWarn',label:'HPA&nbsp;UL&nbsp;CURRENT&nbsp;/&nbsp;SPECTRUM&nbsp;DL&nbsp;WARNING&nbsp;',len: 2, data: [], parse: function(s) {return cSignedByte(s);}, format: function(s) {return rSignedByte(s);} },
		{id:'attout', 	label:'OUTPUT&nbsp;ATTENUATOR&nbsp;'		,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'powerLim',	label:'POWER&nbsp;LIMIT&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;},		format: function(s) {return s;} },
		{id:'gainLim',	label:'GAIN&nbsp;LIMIT&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
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
		{id:'bandwidths',label:'CHANNEL&nbsp;BANDWIDTHS'		,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} }
	];
	this.data = {
		band: [],
		fmodulo:	0,
		fstep:		0,
		fastAgc:	0,
		dacspect:	0,
		dacmode:	0,
		pwrReductionEn:	0,
		bwmask:		0
	};
	for (var i = 0; i < 2; ++i) {
		this.data.band.push({
			powerCorr:	0,
			sqTrhCorr:	0,
			maxGainCorr:	0,
			maxPowerCorr:	0,
			diplexerLoss:	0,
			spectWarn:	0,
			attout:		0,
			powerLim:	0,
			gainLim:	0,
			ncoRx:		0,
			ncoTx:		0,
			ftw:		0,
			fStart:		0,
			fStop:		0,
			fo:		0,
			fdummy:		0,
			oscsel:		0
		});
	}
	this.parse = function(sr) {
		if (sr.length < this.factmap['NR']) {
			return;
		}
		try {
			var p = 0;
			for (var n = 0; n < this.factbandmapLen; n++) {
				var sz = this.frameMap[n].len;
				for (var i = 0; i < 2; ++i) {
					var num = parseInt(sr.substr(p, sz), 16);
					p += sz;
					if (!isNaN(num))
						this.frameMap[n].data[i] = this.frameMap[n].parse(num);
				}
			}
			for (var n = this.factbandmapLen; n < this.frameMap.length; n++) {
				var sz = this.frameMap[n].len;
				var num = parseInt(sr.substr(p, sz), 16);
				p += sz;
				if (!isNaN(num))
					this.frameMap[n].data[0] = this.frameMap[n].parse(num);
			}
		} catch(err) { }
		for (var i = 0; i < 2; ++i) {
			var n = 0;
			this.data.band[i].powerCorr = 	this.frameMap[n++].data[i];
			this.data.band[i].sqTrhCorr = 	this.frameMap[n++].data[i];
			this.data.band[i].maxGainCorr = this.frameMap[n++].data[i];
			this.data.band[i].maxPowerCorr = this.frameMap[n++].data[i];
			this.data.band[i].diplexerLoss = this.frameMap[n++].data[i];
			this.data.band[i].spectWarn = 	this.frameMap[n++].data[i];
			this.data.band[i].attout = 	this.frameMap[n++].data[i];
			this.data.band[i].powerLim = 	this.frameMap[n++].data[i];
			if (i == 0) {
				this.data.pwrReductionEn = (this.data.band[i].powerLim & 0x80) != 0;
			}
			this.data.band[i].powerLim &= 0x7F;
			this.data.band[i].gainLim = 	this.frameMap[n++].data[i];
			this.data.band[i].ncoRx = 	this.frameMap[n++].data[i];
			this.data.band[i].ncoTx = 	this.frameMap[n++].data[i];
			this.data.band[i].ftw = 	this.frameMap[n++].data[i];
			this.data.band[i].fStart = 	this.frameMap[n++].data[i];
			this.data.band[i].fStop = 	this.frameMap[n++].data[i];
			this.data.band[i].fo = 		this.frameMap[n++].data[i];
			this.data.band[i].fdummy = 	this.frameMap[n++].data[i];
			var k =	this.frameMap[n++].data[i];
			this.data.band[i].oscsel = (k & 0x01);
			this.data.dacspect = (k & 0x02) != 0;
			this.data.dacmode = (k & 0x04) != 0;
		}
		var n = this.factbandmapLen;
		this.data.fmodulo = 	this.frameMap[n++].data[0];
		this.data.fstep = 	this.frameMap[n++].data[0];
		this.data.fastAgc = 	this.frameMap[n++].data[0];
		this.data.bwmask = 	this.frameMap[n++].data[0];
	}
	this.offOnOptions = ["OFF", "ON"];
	this.dacspectOptions = ["INVERTED", "NORMAL"];
	this.dacmodeOptions = ["2C", "08"];
	this.bwOptions = ["90 KHz", "45 KHz", "30 KHz", "20 KHz", "15 KHz"];
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
		for (var i = 0; i < this.factbandmapLen; ++i) {
			if (this.frameMap[i].id == 'power') {
				this.createTitles(mainTb, "LEVEL&nbsp;ADJUSTMENTS", 2);
			} else if (this.frameMap[i].id == 'ncoRx') {
				this.createULcurrent(mainTb);
				this.createTitles(mainTb, "BAND&nbsp;FREQUENCY", 2);
			}
			row = document.createElement("tr");
			mainTb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = this.frameMap[i].label;
			for (var j = 0; j < 2; ++j) {
				cell = document.createElement("td");
				row.appendChild(cell);
				if (this.frameMap[i].id == 'oscsel') {
					el = document.createElement("select"); 
					el.className = "centered";
					for (var k = 0; k < this.offOnOptions.length; k++) {
						var opt = document.createElement("option");
						el.options.add(opt);
						opt.text = this.offOnOptions[k];
						opt.value = k;
					}
					el.selectedIndex = 1;
				} else {
					el = document.createElement("input");
					el.type = "text";
					el.size = 10;
					el.className = "number";
				}
				el.id = this.frameMap[i].id + j;
				el.name = el.id;
				cell.appendChild(el);
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
			if (this.frameMap[i].id == 'powerLim') {
				row = document.createElement("tr");
				mainTb.appendChild(row);
				cell = document.createElement("th");
				row.appendChild(cell);
				cell.innerHTML = 'UPLINK&nbsp;REDUCTION&nbspENABLE&nbsp;';
				cell = document.createElement("td");
				row.appendChild(cell);
				el = document.createElement("select"); 
				el.className = "centered";
				for (var k = 0; k < this.offOnOptions.length; k++) {
					var opt = document.createElement("option");
					el.options.add(opt);
					opt.text = this.offOnOptions[k];
					opt.value = k;
				}
				el.selectedIndex = 0;
				el.id = "powerReductionEnableUL";
				el.name = el.id;
				cell.appendChild(el);
			}
		}
		for (var i = this.factbandmapLen; i < this.frameMap.length; ++i) {
			row = document.createElement("tr");
			mainTb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = this.frameMap[i].label;
			if (this.frameMap[i].id == 'fastAgc') {
				cell = document.createElement("td");
				row.appendChild(cell);
				el = document.createElement("select"); 
				el.className = "centered";
				for (var k = 0; k < this.offOnOptions.length; k++) {
					var opt = document.createElement("option");
					el.options.add(opt);
					opt.text = this.offOnOptions[k];
					opt.value = k;
				}
				el.selectedIndex = 0;
				el.id = this.frameMap[i].id;
				el.name = el.id;
				cell.appendChild(el);
			} else if (this.frameMap[i].id == 'bandwidths') {
				var wd;
				for (var j = 0; j < this.bwOptions.length; ++j) {
					cell = document.createElement("td");
					cell.style.textAlign = "center";
					row.appendChild(cell);
					if (j == 0)
						wd = cell.clientWidth;
					else
						cell.width = wd+"px";
					var txt = document.createTextNode(this.bwOptions[j]);
					cell.appendChild(txt);
					el = document.createElement("input"); 
					el.type = "checkbox";
					el.id = this.frameMap[i].id+j;
					el.name = el.id;
					el.style.display = "inline";
					el.style.marginLeft = "10px";
					cell.appendChild(el);
				}
			} else {
				cell = document.createElement("td");
				row.appendChild(cell);
				el = document.createElement("input");
				el.type = "text";
				el.size = 10;
				el.className = "number";
				el.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
				el.id = this.frameMap[i].id;
				el.name = el.id;
				cell.appendChild(el);
			}
		}
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
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "DAC&nbsp;MODE";
		cell = document.createElement("td");
		row.appendChild(cell);
		el = document.createElement("select"); 
		el.className = "centered";
		for (var k = 0; k < this.dacmodeOptions.length; k++) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = this.dacmodeOptions[k];
			opt.value = k;
		}
		el.selectedIndex = 0;
		el.id = "dacmode";
		el.name = el.id;
		cell.appendChild(el);
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
	this.createTitles = function(mainTb, titleTxt, n) {
		var Texts = TextEn;
		var row = document.createElement("tr");
		row.style = "height: 20px";
		mainTb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.colSpan = 2;
		cell.innerHTML = titleTxt;
		cell.style.color = "black";
		row.appendChild(cell);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		for (var i = 0; i < n; ++i) {
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = (i == 0 ? Texts['UPLINK'] : Texts['DNLINK']);
		}
	}
	this.createULcurrent = function(mainTb) {
		var row = document.createElement("tr");
		mainTb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "HPA&nbsp;UL&nbsp;CURRENT";
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.id = "hpaULcurrent";
	}
	this.render = function() {
		var el;
		try {
			for (var i = 0, n = 0; i < 2; ++i) {
				var n = 0;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].powerCorr.toFixed(1);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].sqTrhCorr.toFixed(1);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].maxGainCorr.toFixed(1);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].maxPowerCorr.toFixed(1);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].diplexerLoss.toFixed(1);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = i == 1 ?this.data.band[i].spectWarn : this.data.band[i].spectWarn * 10;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].attout;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].powerLim;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].gainLim;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].ncoRx;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].ncoTx;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = hexformat(this.data.band[i].ftw, 8);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].fStart;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].fStop;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].fo;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = hexformat(this.data.band[i].fdummy, 4);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.selectedIndex = this.data.band[i].oscsel == 0 ? 0 : 1;
			}
			el = document.getElementById("powerReductionEnableUL");
			el.selectedIndex = this.data.pwrReductionEn ? 1 : 0;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.fmodulo;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.fstep;
			el = document.getElementById(this.frameMap[n++].id);
			el.selectedIndex = this.data.fastAgc == 0 ? 1 : 0;
			el = document.getElementById("dacspect");
			el.selectedIndex = this.data.dacspect;
			el = document.getElementById("dacmode");
			el.selectedIndex = this.data.dacmode;
			for (var i = 0, mask = 1; i < this.bwOptions.length; ++i, mask <<= 1) {
				el = document.getElementById(this.frameMap[n].id+i);
				el.checked = (mask & this.data.bwmask) != 0;
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
				for (var i = 0; i < 2; ++i) {
					el = document.getElementById(this.frameMap[n].id+i);
					if (!el) {
						str = currentStr.substr(p, sz);
						p += sz;
						frame += str;
						continue;
					}
					if (this.frameMap[n].id == 'power') 		num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'sqThr') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'maxGain') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'maxPow') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'diplex') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'spectWarn') 	num = i== 1? parseInt(el.value) : parseInt(el.value/10);
					else if (this.frameMap[n].id == 'attout') 	num = parseInt(el.value);
					else if (this.frameMap[n].id == 'powerLim') {
						num = parseInt(el.value) & 0x7F;
						if (i == 0) {
							el = document.getElementById('powerReductionEnableUL');
							num |= el.selectedIndex > 0 ? 0x80 : 0;
						}
					}
					else if (this.frameMap[n].id == 'gainLim') 	num = parseInt(el.value);
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
						el = document.getElementById('dacmode');
						if (el) num |= (el.selectedIndex ? 0x04 : 0);
					}
					str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
					p += sz;
					frame += str;
				}
			}
			for (var n = this.factbandmapLen; n < this.frameMap.length; n++) {
				el = document.getElementById(this.frameMap[n].id);
				var sz = this.frameMap[n].len;
				if (!el && n < this.frameMap.length - 1) {
					str = currentStr.substr(p, sz);
					p += sz;
					frame += str;
					continue;
				}
				if (this.frameMap[n].id == 'fmodulo') 		num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fstep') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fastAgc') 	num = (el.selectedIndex == 0 ? 1 : 0);
				else if (this.frameMap[n].id == 'bandwidths') {
					num = 0;
					for (var i = 0, mask = 1; i < this.bwOptions.length; ++i, mask <<= 1) {
						el = document.getElementById(this.frameMap[n].id+i);
						if (el.checked)
							num |= mask;
					}
				}
				str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
				p += sz;
				frame += str;
			}
		} catch (err) { }
		return frame;
	}
}
// -->