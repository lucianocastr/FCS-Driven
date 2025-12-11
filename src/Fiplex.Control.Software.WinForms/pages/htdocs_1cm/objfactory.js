<!--
function Factory() {
	this.factmap = {
		'DNLNK':	0,
		'FMODULO':	86,
		'FSTEP':	90,
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
		'FSTART':	32,             	       	
		'FSTOP':	48,             		
		'FO':		64,             		
		'FDUMMY':	80,
		'OSCSEL':	84,
		'FASTAGC':	86,
		'DEVCONFIG':	88,
		'GAINLIM':	90,
		'POWLIM':	92,
		'ATTOUT':	94,
		'RFOUTSPEC':	96,
	};

	this.factbandmapLen = Object.size(this.factbandmap);
	this.frameMap = [
		{id:'power', 	label:'POWER&nbsp;CORRECTION&nbsp;'		,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'sqThr', 	label:'SQUELCH&nbsp;THRESHOLD&nbsp;CORRECTION&nbsp;',	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'maxGain', 	label:'MAX&nbsp;GAIN&nbsp;CORRECTION&nbsp;'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'maxPow', 	label:'MAX&nbsp;POWER&nbsp;CORRECTION&nbsp;'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'diplex', 	label:'RFOUT&nbsp;CORRECTION&nbsp;'	,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },
		{id:'ncoRx', 	label:'NCO&nbsp;Rx&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'ncoTx', 	label:'NCO&nbsp;Tx&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'ftw', 	label:'DAC&nbsp;FTW&nbsp;'			,	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fStart',	label:'BAND&nbsp;START&nbsp;FREQUENCY&nbsp;',	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fStop',	label:'BAND&nbsp;STOP&nbsp;FREQUENCY&nbsp;',	len: 8, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fo',	label:'BAND&nbsp;REFERENCE&nbsp;FREQUENCY&nbsp;',	len: 8, data: [], parse: function(s) {return s;}, 	format: function(s) {return s;} },
		{id:'fdummy',	label:'FREQUENCY&nbsp;DUMMY&nbsp;'		,	len: 4, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'oscsel',	label:'DAC&nbsp;PRESCALER&nbsp;'		,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fastAgc',	label:'FAST&nbsp;AGC&nbsp;'		,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'devConfig',label:'PA&nbsp;MONITOR&nbsp;'		,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'gainLim', 	label:'GAIN&nbsp;LIMIT&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'powLim', 	label:'POWER&nbsp;LIMIT&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'attOut', 	label:'OUTPUT&nbsp;ATTENUATOR&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'rfOutSpec', 	label:'RFOUT&nbsp;SPECTRUM&nbsp;CORRECTION&nbsp;'		,	len: 4, data: [], parse: function(s) {return to_float(s);}, 	format: function(s) {return double_to_uint(s);} },		
		{id:'fmodulo',	label:'FREQUENCY&nbsp;MODULO&nbsp;'		,	len: 4, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'fstep',	label:'CHANNEL&nbsp;FREQUENCY&nbsp;STEP&nbsp;'	,	len: 4, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'paCurrent', 	label:'PA&nbsp;CURRENT&nbsp;'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} },
		{id:'paCurrOpt', 	label:'PA&nbsp;CURRENT&nbsp;MONITOR'			,	len: 2, data: [], parse: function(s) {return s;}, 		format: function(s) {return s;} }
	];
	this.data = {
		band: [],
		fmodulo:	0,
		fstep:		0,
		paCurrent:	0,
		PACurrMonitor:	0
	};
	for (var i=0;i<2;i++){
		this.data.band.push({
			powerCorr:	0,
			sqTrhCorr:	0,
			maxGainCorr:	0,
			maxPowerCorr:	0,
			diplexerLoss:	0,
			ncoRx:		0,
			ncoTx:		0,
			ftw:		0,
			fStart:	0,
			fStop:	0,
			fo:		0,
			fdummy:		0,
			oscsel:		0,
			dacspect:	0,
			fastAgc:	0,
			PAMonitor:	0,
			NFPAMonitor:	0,
			gainLim:	0,
			powLim:	0,
			attOut:	0,
			rfOutSpec:	0,
		});
	}
	this.parse = function(factframe) {
		var sr = this.combineFrames(factframe);
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
		var i = 0;
		for (i = 0; i < 2; ++i) {
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
			this.data.band[i].fo = 	this.frameMap[n++].data[i];
			this.data.band[i].fdummy = 	this.frameMap[n++].data[i];
			var k =	this.frameMap[n++].data[i];
			this.data.band[i].oscsel = (k & 0x01);
			this.data.band[i].dacspect = (k & 0x02) != 0;
			k =	this.frameMap[n++].data[i];
			this.data.band[i].fastAgc = (k & 0x01);
			k =	this.frameMap[n++].data[i];
			if (i==0){
				this.data.band[i].PAMonitor = (k & 0x08) >>3;
				this.data.band[i].NFPAMonitor = (k & 0x20) >>5;
				this.data.PACurrMonitor = (k & 0x80) >>7;
			}else{
				this.data.band[i].PAMonitor = (k & 0x01);
				this.data.band[i].NFPAMonitor = (k & 0x02) >>1;				
			}
			this.data.band[i].gainLim = this.frameMap[n++].data[i];
			this.data.band[i].powLim = this.frameMap[n++].data[i];
			this.data.band[i].attOut = this.frameMap[n++].data[i];
			this.data.band[i].rfOutSpec = this.frameMap[n++].data[i];
		}

		var n = this.factbandmapLen;
		this.data.fmodulo = 	this.frameMap[n++].data[0];
		this.data.fstep = 	this.frameMap[n++].data[0];
		this.data.paCurrent = 	this.frameMap[n++].data[0];
	}
	this.onOffOptions = ["OFF", "ON"];
	this.dacspectOptions = ["INVERTED", "NORMAL"];
	this.PAOptions = ['PA', 'FPGA', 'FIP413'];
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
		cell.colSpan=2;
		var j;
		for (var i = 0; i < this.factbandmapLen; ++i) {
			if (this.frameMap[i].id == 'power') {
				this.createTitles(mainTb, "LEVEL&nbsp;ADJUSTMENTS");
			} else if (this.frameMap[i].id == 'ncoRx') {
				this.createTitles(mainTb, "BAND&nbsp;FREQUENCY");
			}
			row = document.createElement("tr");
			mainTb.appendChild(row);
			if ((this.frameMap[i].id == 'oscsel')||(this.frameMap[i].id == 'fastAgc')) {
				cell = document.createElement("th");
				row.appendChild(cell);
				cell.innerHTML = this.frameMap[i].label;	
				for (j=0;j<2;j++){					
					cell = document.createElement("td");
					row.appendChild(cell);
					el = document.createElement("select"); 
					el.className = "centered";
					for (var k = 0; k < this.onOffOptions.length; k++) {
						var opt = document.createElement("option");
						el.options.add(opt);
						opt.text = this.onOffOptions[k];
						opt.value = k;
					}
					el.selectedIndex = 0;
					el.id = this.frameMap[i].id+j;
					el.name = el.id;
					cell.appendChild(el);
				}
				if (this.frameMap[i].id == 'oscsel'){
					row = document.createElement("tr");
					mainTb.appendChild(row);				
					cell = document.createElement("th");
					row.appendChild(cell);
					cell.innerHTML = "SPECTRUM&nbsp;INVERSION";
					for (j=0;j<2;j++){						
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
						el.id = "dacspect"+j;
						el.name = el.id;
						cell.appendChild(el);
					}
				}
			}else if((this.frameMap[i].id == 'devConfig')){
				row = document.createElement("tr");
				mainTb.appendChild(row);
				cell = document.createElement("th");
				row.appendChild(cell);
				cell.innerHTML = this.frameMap[i].label;
				for (j=0;j<2;j++){		
					cell = document.createElement("td");
					row.appendChild(cell);
					el = document.createElement("select"); 
					el.className = "centered";
					for (var k = 0; k < this.PAOptions.length; k++) {
						var opt = document.createElement("option");
						el.options.add(opt);
						opt.text = this.PAOptions[k];
						opt.value = k;
					}
					el.selectedIndex = 0;
					el.id = this.frameMap[i].id + j;
					el.name = el.id;
					cell.appendChild(el);	
				}									
			}else {
				cell = document.createElement("th");
				row.appendChild(cell);
				cell.innerHTML = this.frameMap[i].label;
				for (j=0;j<2;j++){					
					cell = document.createElement("td");
					row.appendChild(cell);
					el = document.createElement("input");
					el.type = "text";
					el.size = 10;
					el.className = "number";
					el.id = this.frameMap[i].id+j;
					el.name = el.id;
					cell.appendChild(el);
				}
			}
			if (this.frameMap[i].id != 'ftw' && this.frameMap[i].id != 'fdummy') {
				el.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
			} else {
				el.onkeypress = function(ev) { return hexNumbersOnly(ev); }
			}
		}

		for (var i = this.factbandmapLen; i < this.frameMap.length; ++i) {
			
			if (this.frameMap[i].id == 'paCurrOpt'){
				row = document.createElement("tr");
				mainTb.appendChild(row);				
				cell = document.createElement("th");
				row.appendChild(cell);
				cell.innerHTML = this.frameMap[i].label;					
				cell = document.createElement("td");
				row.appendChild(cell);
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
				cell = document.createElement("td");
				row.appendChild(cell);				
			}else{
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
			}
			
			
			
			/*if (this.frameMap[i].id == 'ftw' || this.frameMap[i].id == 'fdummy') {
				el.onkeypress = function(ev) { return hexNumbersOnly(ev); }
			} else {
				el.onkeypress = function(ev) { return isKeyDecimalNumber(ev); }
			}*/
		}
	
		/*this.createTitles(mainTb, "DEVICE&nbsp;CONFIGURATION");
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
		}*/
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "PA CURRENT MEASURE";
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.id = "paCurrentMeas";
		cell.style.textAlign = "center";

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
		cell.colSpan = 2;
		row.appendChild(cell);
		row = document.createElement("tr");
		mainTb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = "UPLINK";
		cell.style.color = "black";
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = "DOWNLINK";
		cell.style.color = "black";		
		row.appendChild(cell);
	}
	this.render = function() {
		var el;
		try {
			for (var i=0;i<2;i++){
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
				el = document.getElementById("dacspect" + i);
				el.selectedIndex = this.data.band[i].dacspect;
				el = document.getElementById(this.frameMap[n++].id + i);
				el.selectedIndex = this.data.band[i].fastAgc == 0 ? 0 : 1;				
				el = document.getElementById(this.frameMap[n++].id + i);
				el.selectedIndex = this.data.band[i].fastAgc == 0 ? 0 : 1;	
				var v = this.data.band[i].PAMonitor;
				if (this.data.band[i].NFPAMonitor & 0x01) v=2;
				el.selectedIndex = v;	
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].gainLim;				
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].powLim;					
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].attOut;	
				el = document.getElementById(this.frameMap[n++].id + i);
				el.value = this.data.band[i].rfOutSpec;					
			}
			
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.fmodulo;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.fstep;
			el = document.getElementById(this.frameMap[n++].id);
			el.value = this.data.paCurrent*10;		
			el = document.getElementById(this.frameMap[n++].id);
			el.selectedIndex = this.data.PACurrMonitor == 0 ? 0 : 1;	
			
			var statstr = localStorage.getItem("stat_1cm"+window.location.host);
			var statstrs = statstr.split('\t');
			var num = (parseInt(statstrs[0].substr(392,4),16) & 0x7fff);
			document.getElementById("paCurrentMeas").innerHTML = num.toFixed(0)+"mA";

		} catch(err) { }
	}
	this.format = function(factframe) {
		var currentStr = this.combineFrames(factframe);
		var frame = "";
		var el, num, str;
		try {
			var p = 0;
			for (var n = 0; n < this.factbandmapLen; n++) {
				var sz = this.frameMap[n].len;
				for (var i = 0; i < 2; ++i) {
					el = document.getElementById(this.frameMap[n].id + i);
					if (!el) {
						str = currentStr.substr(p, sz);
						p += sz;
						frame += str;
						alert("no existe "+this.frameMap[n].id);
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
					else if (this.frameMap[n].id == 'fo') 	num = parseInt(el.value);
					else if (this.frameMap[n].id == 'fdummy') 	num = parseInt(el.value, 16);
					else if (this.frameMap[n].id == 'oscsel') {
						num = el.selectedIndex;
						el = document.getElementById('dacspect' + i);
						if (el) num |= (el.selectedIndex ? 0x02 : 0);
					}
					else if (this.frameMap[n].id == 'fastAgc')	num = parseInt(el.selectedIndex, 16);
					else if (this.frameMap[n].id == 'devConfig'){
						if (i==0){
							num = 0x42;
							num |= (parseInt(el.selectedIndex, 16)&0x1)<<3;
							num |= (parseInt(el.selectedIndex, 16)==2?1:0)<<5;
							el = document.getElementById('fastAgc1');							
							num |= parseInt(el.selectedIndex, 16);
							el = document.getElementById('paCurrOpt');
							num |= parseInt(el.selectedIndex, 16)<<7;
						}else{
							num = 0xC;
							num |= parseInt(el.selectedIndex, 16);
						}
					}	
					else if (this.frameMap[n].id == 'gainLim') 	num = parseInt(el.value);
					else if (this.frameMap[n].id == 'powLim') 	num = parseInt(el.value);
					else if (this.frameMap[n].id == 'attOut') 	num = parseInt(el.value);
					else if (this.frameMap[n].id == 'rfOutSpec') 	num = parseFloat(el.value);
					
					str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
					p += sz;
					frame += str;
				}
				
			}
			
			for (var n = this.factbandmapLen; n < this.frameMap.length-1; n++) {
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
				else if (this.frameMap[n].id == 'paCurrent') 	num = (parseInt(el.value)/10).toFixed(0);
				str = isNaN(num) ? currentStr.substr(p, sz) : hexformat(this.frameMap[n].format(num), sz);
				p += sz;
				frame += str;
			}
			frs = this.splitFrames(frame);
			frame = frs[0]+"\t"+frs[1];
		} catch (err) { }
		return frame;
	}
	this.combineFrames = function(factframe){
		var factarr = factframe.split('\t');
		var frmmaster,frmremote;
		frmmaster = factarr[0].substr(4);
		if (factarr.length>1){
			frmremote = factarr[1].substr(4);
			if (frmremote=="00000000000000000000000000000000000000000000000000000000000000000000000000000000000000") alert("Connection lost with auxiliar board");
		}else
			frmremote = "0000000000000000000000000000000000000000000000000000000000000000000000000000";
		var frmresult="";
		var shift=0;
		//offsets
		for (var i=0;i<4;i++){
			frmresult+=frmremote.substr(shift,4)+frmmaster.substr(shift,4);
			shift+=4;
		}
		//rfoutcorrection
		frmresult+=frmmaster.substr(shift,4)+frmremote.substr(shift,4);
		shift+=4;		
		//ncorx
		frmresult+=frmremote.substr(shift,2)+frmmaster.substr(shift,2);
		shift+=2;
		//ncotx
		frmresult+=frmmaster.substr(shift,2)+frmremote.substr(shift,2);
		shift+=2;
		//dac
		frmresult+=frmmaster.substr(shift,8)+frmremote.substr(shift,8);
		shift+=8;		
		//freqs
		frmresult+=frmmaster.substr(shift,48);
		shift+=48;
		//dummy
		frmresult+=frmmaster.substr(shift,4)+frmremote.substr(shift-24,4);
		shift+=4;
		//dacoptions
		frmresult+=frmmaster.substr(shift,2)+frmremote.substr(shift-24,2);
		shift+=2;
		//fast AGC
		frmresult+=frmremote.substr(70,2)+frmmaster.substr(94,2);
		//options
		frmresult+=frmmaster.substr(94,2)+frmremote.substr(74,2);
		//gain limit
		frmresult+=frmmaster.substr(96,4);
		//power limit
		frmresult+=frmmaster.substr(100,4);	
		//output attenuator
		frmresult+=frmmaster.substr(104,2)+frmremote.substr(80,2);	
		//rfout spectrum correction
		frmresult+=frmmaster.substr(106,4)+frmremote.substr(82,4);	
		//fmodulo+fstep
		frmresult+=frmmaster.substr(86,8);
		//pa current value
		frmresult+=frmmaster.substr(110,2);		
		return frmresult;
		
	}
	this.splitFrames = function(factframe){
		var frames = new Array([2]);
		var shift=0;
		frames[0]='0000';
		frames[1]='0101';
		//offsets
		for (var i=0;i<4;i++){
			frames[1]+=	factframe.substr(shift,4);
			shift+=4;
			frames[0]+=	factframe.substr(shift,4);
			shift+=4;
		}
		//rfoutcorrection
		frames[0]+=	factframe.substr(shift,4);
		shift+=4;
		frames[1]+=	factframe.substr(shift,4);
		shift+=4;
		//ncorx
		frames[1]+=	factframe.substr(shift,2);
		shift+=2;		
		frames[0]+=	factframe.substr(shift,2);
		shift+=2;
		//ncotx
		frames[0]+=	factframe.substr(shift,2);
		shift+=2;		
		frames[1]+=	factframe.substr(shift,2);
		shift+=2;	
		//dac
		frames[0]+=	factframe.substr(shift,8);
		shift+=8;		
		frames[1]+=	factframe.substr(shift,8);
		shift+=8;			
		//freqs
		frames[0]+=	factframe.substr(shift,48);
		for (var i=0;i<3;i++){		
			frames[1]+=	factframe.substr(shift,8);
			shift+=16;			
		}
		//dummy
		frames[0]+=	factframe.substr(shift,4);
		shift+=4;
		frames[1]+=	factframe.substr(shift,4);
		shift+=4;		
		//dacoptions	
		frames[0]+=	factframe.substr(shift,2);
		shift+=2;		
		frames[1]+=	factframe.substr(shift,2);
		shift+=2;		
		//modulo+fstep
		frames[0]+=	factframe.substr(152,8);
		frames[1]+=	factframe.substr(152,8);		
		//fastAGC remote
		frames[1]+=	factframe.substr(shift,2)+"D8";		//pmax channel sin uso
		shift+=4;				
		//PA options + fast AGC(master)
		frames[0]+=	factframe.substr(shift,2);	
		shift+=2;
		frames[1]+=	factframe.substr(shift,2);
		shift+=2;
		//gain Limit
		frames[0]+=	factframe.substr(shift,4);	
		frames[1]+=	factframe.substr(shift,2);	
		shift+=4;	
		//power Limit
		frames[0]+=	factframe.substr(shift,4);	
		shift+=2;
		frames[1]+=	factframe.substr(shift,2);	
		shift+=2;	
		//output attenuator
		frames[0]+=	factframe.substr(shift,2);	
		shift+=2;					
		frames[1]+=	factframe.substr(shift,2);	
		shift+=2;
		//rfout spectrum correction
		frames[0]+=	factframe.substr(shift,4);	
		shift+=4;					
		frames[1]+=	factframe.substr(shift,4);	
		shift+=12;	
		//pa current value
		frames[0]+=	factframe.substr(shift,2);			
		return frames;
	}
}
// -->
