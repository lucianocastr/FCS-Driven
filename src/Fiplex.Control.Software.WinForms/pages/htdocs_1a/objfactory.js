<!--
function Factory() {
	this.factmap = {
		'UPLNK':	0,
		'DNLNK':	54,
		'NR':		108
	};
	this.factbandmap = {
		'POWER':	0,
		'SQTRH':	4,
		'MAXGAIN':	8,
		'MAXPOWER':	12,
		'DIPLEXER':	16,
		'DELAY':	20,
		'FASTTRACK':	22,
		'MUMAX':	24,
		'SPECT':	26,
		'TAUTRACK90K':	28,
		'TAUTRACK45K':	30,
		'TAUTRACK30K':	32,
		'NCORX':	34,
		'NCOTX':	36,
		'FTW':		38,
		'FRQBAND':	46
	};
	this.frameMap = [
		{id:'power', 	label:'POWER&nbsp;CORRECTION&nbsp;'		,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'sqThr', 	label:'SQUELCH&nbsp;THRESHOLD&nbsp;CORRECTION&nbsp;',	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'maxGain', 	label:'MAX&nbsp;GAIN&nbsp;CORRECTION&nbsp;'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'maxPow', 	label:'MAX&nbsp;POWER&nbsp;CORRECTION&nbsp;'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'diplex', 	label:'RF&nbsp;OUT&nbsp;CORRECTION&nbsp;'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'delay', 	label:'DELAY&nbsp;CORRECTION&nbsp;'		,	len: 2, data: [], parse: function(s) {return cSignedByte(s)/4;},format: function(s) {return rSignedByte(Math.round(s*4));} },
		{id:'fastTrack',label:'FAST&nbsp;TRACK&nbsp;THRESHOLD&nbsp;'	,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'muMax', 	label:'MU&nbsp;MAX&nbsp;'			,	len: 2, data: [], parse: function(s) {return cSignedByte(s)/4;},format: function(s) {return rSignedByte(Math.round(s*4));} },
		{id:'spectWarn',label:'HPA&nbsp;UL&nbsp;CURRENT&nbsp;/&nbsp;SPECTRUM&nbsp;DL&nbsp;WARNING&nbsp;',len: 2, data: [], parse: function(s) {return cSignedByte(s);}, format: function(s) {return rSignedByte(s);} },
		{id:'tauTrack90', label:'TAU&nbsp;TRACK&nbsp;90&nbsp;KHz&nbsp;'	,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'tauTrack45', label:'TAU&nbsp;TRACK&nbsp;45&nbsp;KHz&nbsp;'	,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'tauTrack30', label:'TAU&nbsp;TRACK&nbsp;30&nbsp;KHz&nbsp;'	,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'ncoRx', 	label:'NCO&nbsp;Rx&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'ncoTx', 	label:'NCO&nbsp;Tx&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'ftw', 	label:'DAC&nbsp;FTW&nbsp;'			,	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'frqBand', 	label:'BAND&nbsp;START&nbsp;FREQUENCY&nbsp;'	,	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} }
	];
	this.data = {
		band: []
	};
	for (var i = 0; i < 2; ++i) {
		this.data.band.push({
			powerCorr:	0,
			sqTrhCorr:	0,
			maxGainCorr:	0,
			maxPowerCorr:	0,
			diplexerLoss:	0,
			delayOffset:	0,
			fastTrack:	0,
			muMax:		0,
			spectWarn:	0,
			tauTrack90:	0,
			tauTrack45:	0,
			tauTrack30:	0,
			ncoRx:		0,
			ncoTx:		0,
			ftw:		0,
			frqBand:	0
		});
	}
	this.parse = function(sr) {
		if (sr.length < this.factmap['NR']) {
			return;
		}
		try {
			for (var n = 0, p = 0; n < this.frameMap.length; n++) {
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
			this.data.band[i].delayOffset = this.frameMap[n++].data[i];
			this.data.band[i].fastTrack = 	this.frameMap[n++].data[i];
			this.data.band[i].muMax = 	this.frameMap[n++].data[i];
			this.data.band[i].spectWarn = 	this.frameMap[n++].data[i];
			this.data.band[i].tauTrack90 = 	this.frameMap[n++].data[i];
			this.data.band[i].tauTrack45 = 	this.frameMap[n++].data[i];
			this.data.band[i].tauTrack30 = 	this.frameMap[n++].data[i];
			this.data.band[i].ncoRx = 	this.frameMap[n++].data[i];
			this.data.band[i].ncoTx = 	this.frameMap[n++].data[i];
			this.data.band[i].ftw = 	this.frameMap[n++].data[i];
			this.data.band[i].frqBand = 	this.frameMap[n++].data[i];
		}
	}
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
		for (var i = 0; i < 2; ++i) {
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = (i == 0 ? Texts['UPLINK'] : Texts['DNLINK']);
		}
		for (var i = 0; i < this.frameMap.length; ++i) {
			row = document.createElement("tr");
			mainTb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = this.frameMap[i].label;
			for (var j = 0; j < 2; ++j) {
				cell = document.createElement("td");
				row.appendChild(cell);
				el = document.createElement("input");
				cell.appendChild(el);
				el.type = "text";
				el.size = 10;
				el.className = "number";
				el.id = this.frameMap[i].id + j;
				el.name = el.id;
				if (this.frameMap[i].id != 'ftw') {
					el.onkeypress = function(ev) {
						return isKeyDecimalNumber(ev);
					}
				} else {
					el.onkeypress = function(ev) {
						return hexNumbersOnly(ev);
					}
				}
			}
		}
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "HPA&nbsp;UL&nbsp;CURRENT";
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.id = "hpaULcurrent";
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 3;
		cell.style.height = "40px";
		cell.style.verticalAlign = "bottom";
		cell.style.textAlign = "center";
		if (window.parent.navi.document.getElementById("pass").style.display == "none") {
			return;
		}
		el = document.createElement('a');
		cell.appendChild(el);
		el.href = "/factory/fact.zhtml?showPass=true";
		el.title = 'Change Factory Password';
		el.target = "content";
		var txt = document.createTextNode("Change Factory Password");
		el.appendChild(txt);
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
				el.value = this.data.band[i].delayOffset.toFixed(2);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].fastTrack;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].muMax.toFixed(2);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = i == 1 ?this.data.band[i].spectWarn : this.data.band[i].spectWarn * 10;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].tauTrack90;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].tauTrack45;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].tauTrack30;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].ncoRx;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].ncoTx;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = hexformat(this.data.band[i].ftw, 8);
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].frqBand;
			}
		} catch(err) { }
	}
	this.format = function(currentStr) {
		var frame = "";
		var el, num, str;
		try {
			for (var n = 0, p = 0; n < this.frameMap.length; n++) {
				var sz = this.frameMap[n].len;
				for (var i = 0; i < 2; ++i) {
					el = document.getElementById(this.frameMap[n].id+i);
					if (this.frameMap[n].id == 'power') 		num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'sqThr') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'sqThr') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'maxGain') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'maxPow') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'diplex') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'delay') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'fastTrack') 	num = parseInt(el.value);
					else if (this.frameMap[n].id == 'muMax') 	num = parseFloat(el.value);
					else if (this.frameMap[n].id == 'spectWarn') 	num = i== 1? parseInt(el.value) : parseInt(el.value/10);
					else if (this.frameMap[n].id == 'tauTrack90') 	num = parseInt(el.value);
					else if (this.frameMap[n].id == 'tauTrack45') 	num = parseInt(el.value);
					else if (this.frameMap[n].id == 'tauTrack30') 	num = parseInt(el.value);
					else if (this.frameMap[n].id == 'ncoRx') 	num = parseInt(el.value);
					else if (this.frameMap[n].id == 'ncoTx') 	num = parseInt(el.value);
					else if (this.frameMap[n].id == 'ftw') 		num = parseInt(el.value, 16);
					else if (this.frameMap[n].id == 'frqBand') 	num = parseInt(el.value);
					str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
					p += sz;
					frame += str;
				}
			}
		} catch (err) { }
		return frame;
	}
}
// -->
