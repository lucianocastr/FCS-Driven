<!--
function Factory() {
	this.factmap = {
		'UPLNK':	0,
		'DNLNK':	70,
		'FMODULO':	140,
		'FSTEP':	144,
		'FASTAGC':	148,
		'BANDWIDTHS':	150,
		'FMODULOADJ':	152,
		'FSTEPADJ':	156,
		'FBANDADJ': 	160,
		'NR':		216
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
	this.factmapLenAdj = 2;
	this.factbandmapAdj = {
		'POWER':	0,
		'SQTRH':	4,
		'MAXGAIN':	8,
		'MAXPOWER':	12,
		'DIPLEXER':	16,
		'SPECTHW': 	20,
		'DCOFFSET': 	24
	};
	this.factbandmapLenAdj = Object.size(this.factbandmapAdj);
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
		{id:'bandwidths',label:'CHANNEL&nbsp;BANDWIDTHS&nbsp;'		,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fmoduloAdj',label:'FREQUENCY&nbsp;MODULO&nbsp;ADJ&nbsp;'	,	len: 4, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fstepAdj',	label:'CHANNEL&nbsp;FREQUENCY&nbsp;STEP&nbsp;ADJ&nbsp;',len: 4, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'powerAdj', label:'POWER&nbsp;CORRECTION&nbsp;ADJ&nbsp;'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'sqThrAdj', label:'SQUELCH&nbsp;THRESHOLD&nbsp;CORRECTION&nbsp;ADJ&nbsp;',len: 4, data: [], parse: function(s) {return to_float(s);}, format: function(s) {return double_to_uint(s);} },
		{id:'maxGainAdj',label:'MAX&nbsp;GAIN&nbsp;CORRECTION&nbsp;ADJ&nbsp;',	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'maxPowAdj',label:'MAX&nbsp;POWER&nbsp;CORRECTION&nbsp;ADJ&nbsp;',	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'diplexAdj',label:'RF&nbsp;OUT&nbsp;CORRECTION&nbsp;ADJ&nbsp;',	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'spectCorr',label:'SPECTRUM&nbsp;OUTPUT&nbsp;CORRECTION&nbsp',	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'dcOffset',	label:'DC&nbsp;OFFSET&nbsp',				len: 4, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} }
	];
	this.data = {
		band: [],
		fmodulo:	0,
		fstep:		0,
		fastAgc:	0,
		dacspect:	0,
		dacmode:	0,
		pwrReductionEn:	0,
		bwmask:		0,
		dualFw: 	0,
		bwAdjFiltNr: 	4,
		ulPaCurrMon: 	false,
		simplex: 	false,
		ln: 		false,
		fmoduloAdj:	0,
		fstepAdj: 	0,
		bandAdj: 	[]
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
			oscsel:		0,
			hpamon:		0,
			fipmon: 	0
		});
		this.data.bandAdj.push({
			powerCorr:	0,
			sqTrhCorr:	0,
			maxGainCorr:	0,
			maxPowerCorr: 	0,
			diplexerLoss: 	0,
			spectHwCorr: 	0,
			dcOffset: 	0
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
			var lim = this.frameMap.length - this.factbandmapLenAdj;
			for (var n = this.factbandmapLen; n < lim; n++) {
				var sz = this.frameMap[n].len;
				var num = parseInt(sr.substr(p, sz), 16);
				p += sz;
				if (!isNaN(num))
					this.frameMap[n].data[0] = this.frameMap[n].parse(num);
			}
			for (var n = lim; n < this.frameMap.length; ++n) {
				var sz = this.frameMap[n].len;
				for (var i = 0; i < 2; ++i) {
					var num = parseInt(sr.substr(p, sz), 16);
					p += sz;
					if (!isNaN(num))
						this.frameMap[n].data[i] = this.frameMap[n].parse(num);
				}
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
			this.data.band[i].hpamon = (k & 0x08) != 0;
			this.data.band[i].fipmon = (k & 0x10) != 0;
		}
		var n = this.factbandmapLen;
		this.data.fmodulo = 	this.frameMap[n++].data[0];
		this.data.fstep = 	this.frameMap[n++].data[0];
		var reg = 		this.frameMap[n++].data[0];
		this.data.fastAgc = reg & 0x01;
		this.data.dualFw = (reg >> 1) & 0x01;
		this.data.bwAdjFiltNr = 1 + ((reg >> 2) & 0x03);
		this.data.ulPaCurrMon = (reg >> 4) & 0X01;
		this.data.simplex = (reg >> 6) & 0x01;
		this.data.ln = (reg >> 7) & 0x01;
		this.data.bwmask = 	this.frameMap[n++].data[0];
		this.data.fmoduloAdj = 	this.frameMap[n++].data[0];
		this.data.fstepAdj = 	this.frameMap[n++].data[0];
		for (var i = 0; i < 2; ++i) {
			n = this.frameMap.length - this.factbandmapLenAdj;
			this.data.bandAdj[i].powerCorr = this.frameMap[n++].data[i];
			this.data.bandAdj[i].sqTrhCorr = this.frameMap[n++].data[i];
			this.data.bandAdj[i].maxGainCorr = this.frameMap[n++].data[i];
			this.data.bandAdj[i].maxPowerCorr = this.frameMap[n++].data[i];
			this.data.bandAdj[i].diplexerLoss = this.frameMap[n++].data[i];
			this.data.bandAdj[i].spectHwCorr = this.frameMap[n++].data[i];
			this.data.bandAdj[i].dcOffset = this.frameMap[n++].data[i];
		}
	}
	this.offOnOptions = ["OFF", "ON"];
	this.dacspectOptions = ["INVERTED", "NORMAL"];
	this.dacmodeOptions = ["2C", "08"];
	this.bwOptions = [
		{lbl: "180", mask: 0x20, cfg: 5}, 
		{lbl: "90", mask: 0x01, cfg: 0},
		{lbl: "45", mask: 0x02, cfg: 1},
		{lbl: "30", mask: 0x04, cfg: 2},
		{lbl: "20", mask: 0x08, cfg: 3},
		{lbl: "15", mask: 0x10, cfg: 4}
	];
	this.hpamonOptions = [["PA", "FPGA"], ["PA", "FPGA", "FIP413"]];
	this.MAX_PWR_DELTA = 3;
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
				this.createSpectCorr(mainTb);
				this.createDcOffset(mainTb);
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
					el.size = 13;
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
			if (this.frameMap[i].id == 'gainLim') {
				row = document.createElement("tr");
				mainTb.appendChild(row);
				cell = document.createElement("th");
				row.appendChild(cell);
				cell.innerHTML = 'PA&nbsp;POWER&nbsp;MONITOR&nbsp;';
				for (var j = 0; j < 2; ++j) {
					cell = document.createElement("td");
					row.appendChild(cell);
					el = document.createElement("select"); 
					el.className = "centered";
					for (var k = 0; k < this.hpamonOptions[j].length; k++) {
						var opt = document.createElement("option");
						el.options.add(opt);
						opt.text = this.hpamonOptions[j][k];
						opt.value = k;
					}
					el.selectedIndex = 0;
					el.id = "paMonitorSel_"+j;
					el.name = el.id;
					cell.appendChild(el);
				}
			}
		}
		var lim = this.frameMap.length - this.factbandmapLenAdj - this.factmapLenAdj;
		for (var i = this.factbandmapLen; i < lim; ++i) {
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
					var txt = document.createTextNode(this.bwOptions[j].lbl + " KHz");
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
				el.size = 13;
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
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "LOW&nbsp;NOISE";
		cell = document.createElement("td");
		row.appendChild(cell);
		el = document.createElement("input");
		el.type = "checkbox";
		el.className = "centered"; 
		el.id = "lowNoise";
		el.name = el.id;
		cell.appendChild(el);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "FORCED&nbsp;UL&nbsp;PA&nbsp;CURRENT&nbsp;MONITOR";
		cell = document.createElement("td");
		row.appendChild(cell);
		el = document.createElement("input");
		el.type = "checkbox";
		el.className = "centered"; 
		el.id = "ForcedUlPaCurrMonitor";
		el.name = el.id;
		cell.appendChild(el);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "SIMPLEX";
		cell = document.createElement("td");
		row.appendChild(cell);
		el = document.createElement("input");
		el.type = "checkbox";
		el.className = "centered"; 
		el.id = "simplex";
		el.name = el.id;
		cell.appendChild(el);
		this.createTitles(mainTb, "ADJUSTABLE&nbsp;BANDWIDTHS", 2);
		for (var i = lim; i < this.frameMap.length - this.factbandmapLenAdj; ++i) {
			row = document.createElement("tr");
			mainTb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = this.frameMap[i].label;
			cell = document.createElement("td");
			row.appendChild(cell);
			el = document.createElement("input");
			el.type = "text";
			el.size = 13;
			el.className = "number";
			el.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
			el.id = this.frameMap[i].id;
			el.name = el.id;
			cell.appendChild(el);
		}
		lim = this.frameMap.length - this.factbandmapLenAdj;
		for (var i = lim; i < this.frameMap.length - 2; ++i) {
			row = document.createElement("tr");
			mainTb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = this.frameMap[i].label;
			for (var j = 0; j < 2; ++j) {
				cell = document.createElement("td");
				row.appendChild(cell);
				el = document.createElement("input");
				el.type = "text";
				el.size = 13;
				el.className = "number";
				el.id = this.frameMap[i].id + j;
				el.name = el.id;
				cell.appendChild(el);
				el.onkeypress = function(ev) {
					return isKeyDecimalNumber(ev);
				}
			}
		}
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "NR.&nbsp;ADJUSTABLE&nbsp;FILTERS";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		el = document.createElement("select"); 
		el.className = "centered";
		for (var k = 0; k < 4; k++) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.value = k + 1;
			opt.text = opt.value;
		}
		el.selectedIndex = 0;
		el.id = "bwAdjFiltNr";
		el.name = el.id;
		cell.appendChild(el);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "DUAL&nbsp;FIRMWARE";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		el = document.createElement("input"); 
		el.type = "checkbox";
		el.id = "dualFw";
		el.name = el.id;
		el.style.display = "inline";
		el.style.marginLeft = "10px";
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
	this.createSpectCorr = function(mainTb) {
		var row = document.createElement("tr");
		mainTb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		var n = this.frameMap.length - 2;
		cell.innerHTML = this.frameMap[n].label;
		for (var j = 0; j < 2; ++j) {
			cell = document.createElement("td");
			row.appendChild(cell);
			var el = document.createElement("input");
			el.type = "text";
			el.size = 13;
			el.className = "number";
			el.id = 'spectCorr'+j;
			el.name = el.id;
			cell.appendChild(el);
			el.onkeypress = function(ev) {
				return isKeyDecimalNumber(ev);
			}
		}
	}
	this.createDcOffset = function(mainTb) {
		var row = document.createElement("tr");
		mainTb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		var n = this.frameMap.length - 1;
		cell.innerHTML = this.frameMap[n].label;
		for (var j = 0; j < 2; ++j) {
			cell = document.createElement("td");
			row.appendChild(cell);
			var el = document.createElement("input");
			el.type = "text";
			el.size = 13;
			el.className = "number";
			el.id = 'dcOffset'+j;
			el.name = el.id;
			cell.appendChild(el);
			el.onkeypress = function(ev) {
				return hexNumbersOnly(ev);
			}
		}
	}
	this.render = function() {
		var el, n;
		try {
			for (var i = 0; i < 2; ++i) {
				n = 0;
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
			for (var i = 0; i < 2; ++i) {
				el = document.getElementById("paMonitorSel_"+i);
				if (this.data.band[i].fipmon) {
					el.selectedIndex = 2;
				} else if (this.data.band[i].hpamon) {
					el.selectedIndex = 1;
				} else {
					el.selectedIndex = 0;
				}
			}
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
			el = document.getElementById("lowNoise");
			el.checked = this.data.ln != 0;
			el = document.getElementById("ForcedUlPaCurrMonitor");
			el.checked = this.data.ulPaCurrMon != 0;
			el = document.getElementById("simplex");
			el.checked = this.data.simplex != 0;
			for (var i = 0; i < this.bwOptions.length; ++i) {
				el = document.getElementById(this.frameMap[n].id+i);
				el.checked = (this.bwOptions[i].mask & this.data.bwmask) != 0;
//				tryConsole(i+":("+this.bwOptions[i].mask+", "+this.data.bwmask+") "+ ((this.bwOptions[i].mask & this.data.bwmask) != 0 ? "T":"F"));
			}
			n++;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.fmoduloAdj;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.fstepAdj;
			var N = n;
			for (var i = 0; i < 2; ++i) {
				n = N;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.bandAdj[i].powerCorr.toFixed(1);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.bandAdj[i].sqTrhCorr.toFixed(1);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.bandAdj[i].maxGainCorr.toFixed(1);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.bandAdj[i].maxPowerCorr.toFixed(1);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.bandAdj[i].diplexerLoss.toFixed(1);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.bandAdj[i].spectHwCorr.toFixed(1);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = hexformat(this.data.bandAdj[i].dcOffset, 4);
			}
			el = document.getElementById("dualFw");
			el.checked = this.data.dualFw != 0;
			el = document.getElementById("bwAdjFiltNr");
			el.selectedIndex = this.data.bwAdjFiltNr - 1;
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
						el = document.getElementById('paMonitorSel_'+i);
						if (el) {
							switch (el.selectedIndex) {
							case 0: default: break;
							case 1: num |= 0x08; break;
							case 2: num |= 0x10; break;
							}
						}
					}
					str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
					p += sz;
					frame += str;
				}
			}
			var lim = this.frameMap.length - this.factbandmapLenAdj;
			for (var n = this.factbandmapLen; n < lim; n++) {
				el = document.getElementById(this.frameMap[n].id);
				var sz = this.frameMap[n].len;
				if (!el && n < this.frameMap.length - 1 && this.frameMap[n].id != 'bandwidths') {
					str = currentStr.substr(p, sz);
					p += sz;
					frame += str;
					continue;
				}
				if (this.frameMap[n].id == 'fmodulo') 		num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fstep') 	num = parseInt(el.value);
				else if (this.frameMap[n].id == 'fastAgc') {
					num = (el.selectedIndex == 0 ? 1 : 0);
					el = document.getElementById("dualFw");
					num |= (el.checked ? 1 : 0) << 1;
					el = document.getElementById("bwAdjFiltNr");
					num |= (el.selectedIndex & 0x03) << 2;
					if (el.selectedIndex != this.data.bwAdjFiltNr - 1) {
						window.parent.navi.document.alreadyLoaded = false;
					}
					el = document.getElementById("lowNoise");
					num |= (el.checked ? 1 : 0) << 7;
					el = document.getElementById("ForcedUlPaCurrMonitor");
					num |= (el.checked ? 1 : 0) << 4;
					el = document.getElementById("simplex");
					num |= (el.checked ? 1 : 0) << 6;
				} else if (this.frameMap[n].id == 'bandwidths') {
					num = 0;
					for (var i = 0; i < this.bwOptions.length; ++i) {
						el = document.getElementById(this.frameMap[n].id+i);
						if (el.checked) {
							num |= this.bwOptions[i].mask;
						}
					}
				} else if (this.frameMap[n].id == 'fmoduloAdj') {
					num = parseInt(el.value);
				} else if (this.frameMap[n].id == 'fstepAdj') {
					num = parseInt(el.value);
				} else {
//					tryConsole("error factory format "+this.frameMap[n].id);
				}
				str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
				p += sz;
				frame += str;
			}
			for (var n = lim; n < this.frameMap.length; ++n) {
				var sz = this.frameMap[n].len;
				for (var i = 0; i < 2; ++i) {
					el = document.getElementById(this.frameMap[n].id+i);
					if (!el) {
						str = currentStr.substr(p, sz);
						p += sz;
						frame += str;
						continue;
					}
					if (this.frameMap[n].id == 'powerAdj') 		num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'sqThrAdj') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'maxGainAdj') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'maxPowAdj') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'diplexAdj') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'spectCorr') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'dcOffset') 	num = parseInt(el.value, 16);
					str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
					p += sz;
					frame += str;
				}
			}
		} catch (err) { }
		return frame;
	}
	this.serialize = function(currentStr) {
		var frame = "";
		var num, str, p = 0;
		for (var n = 0; n < this.factbandmapLen; n++) {
			var sz = this.frameMap[n].len;
			for (var i = 0; i < 2; ++i) {
				if (this.frameMap[n].id == 'power') 		num = this.data.band[i].powerCorr;
				else if (this.frameMap[n].id == 'sqThr') 	num = this.data.band[i].sqTrhCorr;
				else if (this.frameMap[n].id == 'maxGain') 	num = this.data.band[i].maxGainCorr;
				else if (this.frameMap[n].id == 'maxPow') 	num = this.data.band[i].maxPowerCorr;
				else if (this.frameMap[n].id == 'diplex') 	num = this.data.band[i].diplexerLoss;
				else if (this.frameMap[n].id == 'spectWarn') 	num = this.data.band[i].spectWarn;
				else if (this.frameMap[n].id == 'attout') 	num = this.data.band[i].attout;
				else if (this.frameMap[n].id == 'powerLim') {
					num = this.data.band[i].powerLim & 0x7F;
					if (i == 0) {
						num |= this.data.pwrReductionEn ? 0x80 : 0;
					}
				}
				else if (this.frameMap[n].id == 'gainLim') 	num = this.data.band[i].gainLim;
				else if (this.frameMap[n].id == 'ncoRx') 	num = this.data.band[i].ncoRx;
				else if (this.frameMap[n].id == 'ncoTx') 	num = this.data.band[i].ncoTx;
				else if (this.frameMap[n].id == 'ftw') 		num = this.data.band[i].ftw;
				else if (this.frameMap[n].id == 'fStart') 	num = this.data.band[i].fStart;
				else if (this.frameMap[n].id == 'fStop') 	num = this.data.band[i].fStop;
				else if (this.frameMap[n].id == 'fo') 		num = this.data.band[i].fo;
				else if (this.frameMap[n].id == 'fdummy') 	num = this.data.band[i].fdummy;
				else if (this.frameMap[n].id == 'oscsel') {
					num = this.data.band[i].oscsel & 0x01;
					num |= this.data.dacspect ? 0x02 : 0;
					num |= this.data.dacmode ? 0x04 : 0;
					num |= this.data.band[i].hpamon ? 0x08 : 0;
					num |= this.data.band[i].fipmon ? 0x10 : 0;
				}
				str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
				p += sz;
				frame += str;
			}
		}
		var lim = this.frameMap.length - this.factbandmapLenAdj;
		for (var n = this.factbandmapLen; n < lim; n++) {
			el = document.getElementById(this.frameMap[n].id);
			var sz = this.frameMap[n].len;
			if (this.frameMap[n].id == 'fmodulo') 		num = this.data.fmodulo;
			else if (this.frameMap[n].id == 'fstep') 	num = this.data.fstep;
			else if (this.frameMap[n].id == 'fastAgc') {
				num = this.data.fastAgc ? 1 : 0;
				num |= (this.data.dualFw ? 1 : 0) << 1;
				num |= ((this.data.bwAdjFiltNr - 1) & 0x03) << 2;
				num |= (this.data.ln ? 1 : 0) << 7;
				num |= (this.data.ulPaCurrMon ? 1 : 0) << 4;
				num |= (this.data.simplex ? 1 : 0) << 6;
			}
			else if (this.frameMap[n].id == 'bandwidths')   num = this.data.bwmask;
			else if (this.frameMap[n].id == 'fmoduloAdj') 	num = this.data.fmoduloAdj;
			else if (this.frameMap[n].id == 'fstepAdj') 	num = this.data.fstepAdj;
			str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
			p += sz;
			frame += str;
		}
		for (var n = lim; n < this.frameMap.length; ++n) {
			var sz = this.frameMap[n].len;
			for (var i = 0; i < 2; ++i) {
				if (this.frameMap[n].id == 'powerAdj') 		num = this.data.bandAdj[i].powerCorr;
				else if (this.frameMap[n].id == 'sqThrAdj') 	num = this.data.bandAdj[i].sqTrhCorr;
				else if (this.frameMap[n].id == 'maxGainAdj') 	num = this.data.bandAdj[i].maxGainCorr;
				else if (this.frameMap[n].id == 'maxPowAdj') 	num = this.data.bandAdj[i].maxPowerCorr;
				else if (this.frameMap[n].id == 'diplexAdj') 	num = this.data.bandAdj[i].diplexerLoss;
				else if (this.frameMap[n].id == 'spectCorr') 	num = this.data.bandAdj[i].spectHwCorr;
				else if (this.frameMap[n].id == 'dcOffset') 	num = this.data.bandAdj[i].dcOffset;
				str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
				p += sz;
				frame += str;
			}
		}
		return frame;
	}
}
// -->