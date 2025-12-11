var gui;

function onloadInit() {
	tags = new Array();
	parse_tags(window.top.fiplexTagsStr);
	showResultIcon(ERR_NONE);
	gui = new GuiThr();
	gui.start();
}

function reloadData() {
	if (!gui) {
		gui = new GuiThr();
	}
	gui.start();
}

function submitform() {
	if (!gui) {
		return;
	}
	gui.apply();
}

function GuiThr() {
	var self = this;
	this.elements = [];

	this.error;
	this.submitLocked = false;
	this.created = false;
	this.counter;
	this.NR_EXP = 3;
	this.NR_RPU = 6;
	this.NR_REM = 24;
	this.NR_TOT = 28;
	this.thrTypes = [
		{
			name: "OPTICAL&nbsp;LOSS&nbsp;(dBm)",
			min: -30,
			max: 0
		},
		{
			name: "TEMPERATURE&nbsp;(&deg;C)",
			min: 0,
			max: +85
		},
		{
			name: "DL&nbsp;OUTPUT&nbsp;POWER&nbsp;(dBm)",
			min: -10,
			max: +37			
		},
		{
			name: "PATH&nbsp;LOSS&nbsp;1&nbsp;(dBm)",
			min: -100,
			max: -20				
		},
		{
			name: "PATH&nbsp;LOSS&nbsp;2&nbsp;(dBm)",
			min: -100,
			max: -20				
		}
	];
	this.thrTypeIdx = {
		optLocal: 	0,
		temp: 		1,
		dlPower: 	2,
		pla1: 		3,
		pla2: 		4
	};
	this.devices = [];
	this.frmsend;
	this.results;
	this.initDevices = function() {
		self.devices.push({
			lbl: "MASTER",
			datalen: 9,
			frmlen: 36,
			detected: true,
			nopt: 7,
			data: []
		});
		for (var i = 0; i < self.NR_EXP; ++i) {
			self.devices.push({
				lbl: "EXPANSION"+(i+1),
				datalen: 10,
				frmlen: 40,
				detected: false,
				nopt: 8,
				data: []
			})
		}
		for (var i = 0; i < self.NR_REM; ++i) {
			self.devices.push({
				lbl: "REMOTE"+(i+1),
				datalen: 7,
				frmlen: 28,
				detected: false,
				nopt: 2,
				data: []
			})
		}
	}
	this.masterAppendThrTypes = function() {
		if (self.devices.length == 0) {
			self.initDevices();
		}
		self.devices[0].thrType = [];
		for (var i = 0; i < self.thrTypes.length; ++i) {
			self.devices[0].thrType.push({
				exists: false,
				lbl: "",
				data: []
			});
			if (i == 1) {
				self.devices[0].thrType[i].lbl = ">";
			}
			else{
				self.devices[0].thrType[i].lbl = "<";
			}
			for (var p = 0; p < 2; ++p) {
				self.devices[0].thrType[i].data.push({
					id: self.elementsId(0, i, p),
					val: 0
				});
			}
		}
		self.devices[0].thrType[0].exists = true;
		self.devices[0].thrType[1].exists = true;
	}
	this.expAppendThrTypes = function() {
		if (self.devices.length == 0) {
			self.initDevices();
		}
		for (var j = 0; j < self.NR_EXP; ++j) {
			var n = j+1;
			self.devices[n].thrType = [];
			for (var i = 0; i < self.thrTypes.length; ++i) {
				self.devices[n].thrType.push({
					exists: false,
					lbl: "",
					data: []
				});
				if (i == 0 || i == 1 ) {
					self.devices[n].thrType[i].exists = true;
				}
				if (i == this.thrTypeIdx.temp) {
					self.devices[n].thrType[i].lbl = ">";
				}else{
					self.devices[n].thrType[i].lbl = "<";
				}
				for (var p = 0; p < 2; ++p) {
					self.devices[n].thrType[i].data.push({
						id: self.elementsId(n, i, p),
						val: 0
					});
				}
			}
		}
	}
	this.remAppendThrTypes = function() {
		if (self.devices.length == 0) {
			self.initDevices();
		}
		var remlink = self.computeStatusRem();
		for (var j = 0; j < self.NR_REM; ++j) {
			var c = self.portConnected(j, remlink);
			var n = j+4;
			self.devices[n].thrType = [];
			for (var i = 0; i < self.thrTypes.length; ++i) {
				var txt = "";

				if (i == 1) {
					txt = ">";
				} else {
					txt = "<"
				}
				self.devices[n].thrType.push({
					exists: true,
					lbl: txt,
					data: []
				});
				for (var p = 0; p < 2; ++p) {
					self.devices[n].thrType[i].data.push({
						id: self.elementsId(n, i, p),
						val: 0
					});
				}
			}
		}
	}
	this.portConnected = function(j, remlink) {
		var e = ~~Math.floor(j / self.NR_RPU);
		var r = j % self.NR_RPU;
		if (e >= remlink.length) {
			return 1;
		}
		var mask = 1 << r;
		var p = (mask & remlink[e]) ? 2 : 1;
 		return p;
	}
	this.elementsId = function(n, t, p) {
		return ("thrid_"+n+"_"+t+"_"+p);
	}
	this.titleId = function(n, t) {
		return ("titleid_"+n+"_"+t);
	}
	this.initData = function() {
		self.initDevices();
		self.masterAppendThrTypes();
		self.expAppendThrTypes();
		self.remAppendThrTypes();
	}
	this.create = function() {
		var page = document.getElementById("page");
		var h = document.createElement("h1");
		h.innerHTML = "ALARM&nbsp;THRESHOLDS";
		var box = document.createElement("div");
		box.appendChild(h);
		page.appendChild(box);
		var tbl = document.createElement("table");
		tbl.style.borderCollapse = "collapse";
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		tb.appendChild(self.createTitlesRow());
		tb.appendChild(self.createSubTitlesRow());
		for (var i = 0; i < self.devices.length; ++i) {
			self.devices[i].row = self.createDeviceRow(i);
			tb.appendChild(self.devices[i].row);
		}
		tb.appendChild(self.createLegend());
		page.appendChild(tbl);
		self.created = true;
	}
	this.createTitlesRow = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.colSpan = 2;
		cell.innerHTML = "DEVICE";
		cell.style.border = "thin solid #db5902";
		row.appendChild(cell);		
		for (var i = 0; i < self.thrTypes.length; ++i) {
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = self.thrTypes[i].name;
			cell.colSpan = i==0?7:6;
			cell.style.border = "thin solid #db5902";
		}
		return row;
	}
	this.createSubTitlesRow = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.style.border = "thin solid #db5902";
		cell.innerHTML = "Number";
		cell.style.minWidth = "120px";
		row.appendChild(cell);
		var cell = document.createElement("th");
		cell.style.border = "thin solid #db5902";
		cell.innerHTML = "Tag";	
		cell.style.minWidth = "120px";		
		row.appendChild(cell);		
		for (var i = 0; i < self.thrTypes.length; ++i) {
			cols =  i==0?7:6;
			txt_th = i==0?3:2;
			txt_hys =i==0?5:4;
			for (var j = 0; j < cols; ++j) {
				cell = document.createElement("th");
				row.appendChild(cell);
				if (j == txt_th) {
					cell.innerHTML = i==2?"Threshold(**)":"Threshold";
					cell.style.minWidth = "70px";
				} else if (j == txt_hys) {
					cell.innerHTML = "Hysteresis";
					cell.style.minWidth = "70px";
				} else if ((j == 1) 
					&& (i == 0 || i == 1 || i == 2))
				{
					cell.style.minWidth = "1px";
					cell.style.whiteSpace = "nowrap";
				} else if(j == 0 && i == 0){
					cell.style.minWidth = "60px";
				} else {
					cell.style.minWidth = "1px";
				}
				if (j == 0) {
					cell.style.borderLeft = "thin solid #db5902";
				} else if (j == (i==0?6:5)) {
					cell.style.borderRight = "thin solid #db5902";
				}
				cell.style.borderBottom = "thin solid #db5902";
			}
		}
		return row;
	}
	this.createLegend = function(){
		var row = document.createElement("tr");
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan=5;
		var tbl = document.createElement("table");
		tbl.style.borderCollapse = "collapse";
		cell.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		var rowt = document.createElement("tr");
		var cellt = document.createElement("td");
		cellt.innerHTML = "(*)&nbsp;&nbsp;Remote port connected to this master";
		cellt.style.align = "left";
		cellt.style.fontWeight = "bold";
		rowt.appendChild(cellt);
		tb.appendChild(rowt);
		rowt = document.createElement("tr");
		cellt = document.createElement("td");
		cellt.innerHTML = "(**)&nbsp;Alarm occurs after 2 minutes below the threshold";
		cellt.style.align = "left";
		cellt.style.fontWeight = "bold";
		rowt.appendChild(cellt);	
		tb.appendChild(rowt);		
		return row;
	}
	this.createDeviceRow = function(n) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.innerHTML = self.devices[n].lbl;
		cell.style.border = "thin solid #db5902";
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = tags[n];
		cell.style.border = "thin solid #db5902";
		row.appendChild(cell);
		var remlink = self.computeStatusRem();		
		var k = 0;
		for (var i = 0; i < self.thrTypes.length; ++i) {
			if (i==0){
				var cellt = document.createElement("td");
				cellt.style.borderLeft = "thin solid #db5902";
				cellt.style.borderTop = "thin solid #db5902";
				cellt.style.borderBottom = "thin solid #db5902";
				cellt.colSpan = 7;
				var tbl = document.createElement("table");
				tbl.style.borderCollapse = "collapse";
				cellt.appendChild(tbl);
				var tb = document.createElement("tbody");
				tbl.appendChild(tb);
				for (var j=0;j<self.devices[n].nopt;j++){
					var rowt = document.createElement("tr");
					var notShow = !self.devices[n].thrType[i].exists;
					cell = document.createElement("th");
					cell.style.minWidth="60px";
					if (j<self.devices[n].nopt-1) cell.style.borderBottom = "thin solid #db5902";
					
					if (n==0 && j==6)
						cell.innerHTML = "PORT8";
					else{
						var c = self.portConnected(n-4, remlink);
						if (n>=4 && c==(j+1)){
							cell.innerHTML = "PORT"+(j+1)+"(*)";					
						}else
							cell.innerHTML = "PORT"+(j+1);				
					}			
					rowt.appendChild(cell);					
					cell = document.createElement("td");
					if (j<self.devices[n].nopt-1) cell.style.borderBottom = "thin solid #db5902";
					cell.style.minWidth="1px";
					rowt.appendChild(cell);
					cell = document.createElement("th");
					if (j<self.devices[n].nopt-1) cell.style.borderBottom = "thin solid #db5902";
					cell.style.minWidth="1px";
					cell.innerHTML = self.devices[n].thrType[i].lbl;
					cell.id = self.titleId(n, k);
					rowt.appendChild(cell);
					cell = document.createElement("td");
					if (j<self.devices[n].nopt-1) cell.style.borderBottom = "thin solid #db5902";
					cell.style.minWidth="70px";
					var el = self.createDeviceInput(n, k, 0, i);
					cell.appendChild(el);
					rowt.appendChild(cell);
					cell = document.createElement("th");
					if (j<self.devices[n].nopt-1) cell.style.borderBottom = "thin solid #db5902";
					cell.style.minWidth="15px";
					cell.innerHTML = "&#177;"
					rowt.appendChild(cell);
					cell = document.createElement("td");
					if (j<self.devices[n].nopt-1) cell.style.borderBottom = "thin solid #db5902";
					cell.style.minWidth="70px";
					el = self.createDeviceInput(n, k, 1, i);
					cell.appendChild(el);
					rowt.appendChild(cell);
					cell = document.createElement("td");
					if (j<self.devices[n].nopt-1) cell.style.borderBottom = "thin solid #db5902";
					cell.style.minWidth="1px";
					rowt.appendChild(cell);
					tbl.appendChild(rowt);
					k++;
				}
				row.appendChild(cellt);
				
			}else{
				var notShow = !self.devices[n].thrType[i].exists;
				if (!notShow){
					cell = document.createElement("td");
					cell.style.borderLeft = "thin solid #db5902";
					cell.style.borderTop = "thin solid #db5902";
					cell.style.borderBottom = "thin solid #db5902";
					row.appendChild(cell);
					cell = document.createElement("th");
					cell.innerHTML = self.devices[n].thrType[i].lbl;
					cell.style.borderTop = "thin solid #db5902";
					cell.style.borderBottom = "thin solid #db5902";
					cell.id = self.titleId(n, k); 
					row.appendChild(cell);
					cell = document.createElement("td");
					var el = self.createDeviceInput(n, k, 0, i);
					cell.appendChild(el);
					cell.style.borderTop = "thin solid #db5902";
					cell.style.borderBottom = "thin solid #db5902";
					row.appendChild(cell);
					cell = document.createElement("th");
					cell.innerHTML = "&#177;"
					cell.style.borderTop = "thin solid #db5902";
					cell.style.borderBottom = "thin solid #db5902";
					row.appendChild(cell);
					cell = document.createElement("td");
					el = self.createDeviceInput(n, k, 1, i);
					cell.appendChild(el);
					cell.style.borderTop = "thin solid #db5902";
					cell.style.borderBottom = "thin solid #db5902";
					row.appendChild(cell);
					cell = document.createElement("td");
					cell.style.borderRight = "thin solid #db5902";
					cell.style.borderTop = "thin solid #db5902";
					cell.style.borderBottom = "thin solid #db5902";
					row.appendChild(cell);
				}else{
					cell = document.createElement("td");
					cell.style.borderLeft = "thin solid #db5902";
					cell.style.borderTop = "thin solid #db5902";
					cell.style.borderRight = "thin solid #db5902";
					cell.style.borderBottom = "thin solid #db5902";
					cell.colSpan = 6;
					row.appendChild(cell);
				}
				k++;
			}
		}
		return row;
	}
	this.createDeviceInput = function(d, t, p, m) {
		//m indica qué thrTypes maneja el input
		var el = document.createElement("input");
		el.type = "text";
		el.id = el.name = self.elementsId(d, t, p);
		el.isHys = (p == 1);
		el.onkeypress = function(ev) {
			if (this.isHys) {
				return isKeyDecimalNumber(ev);
			}
			return isKeySignedNumber(ev);
		}
		if (el.isHys) {
			el.title = "Min: 0, Max: 10, Resolution: 0.5";
			el.min = 0;
			el.max = 10;
		} else {
			el.min = this.thrTypes[m].min;
			el.max = this.thrTypes[m].max;
			el.title = "Min: "+el.min+", Max: "+el.max+", Resolution: 1";
		}
		el.size = 4;
		el.className = "centered";
		el.style.textAlign = "right";
		return el;
	}
	this.destroy = function() {
		var page = document.getElementById("page");
		remove_children(page);
		self.created = false;
	}
	this.start = function() {
		self.preXhr();
		self.requestData();
	}
	this.requestData = function() {
		if (isPCstyle){
			self.loadData();
			return;
		}
		var xhr = xmlreq();
		xhr.onreadystatechange = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				setTimeout(function() {self.loadData(); }, 2000);
			}
		}
		xhr.onerror = function(ev) {
			self.loadData();
		}
		xhr.ontimeout = function(ev) {
			self.loadData();
		}
		document.getElementById("thrsh_req").value = "1";
		xhr.open("POST", "/thrsh.zhtml", true);
		xhr.timeout = 5000;
		xhr.send("thrsh_req="+1);
		xhr = null;
	}
	this.loadData = function() {
		var xhr = xmlreq();
		xhr.onreadystatechange = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				self.error = "OK";
				var sr = this.responseText;
				if (sr.substr(-1, 1) == "\t") {
					sr = sr.substr(0, sr.length-1);
				}
				self.processData(sr);
				self.postXhr();
			}
		}
		xhr.onerror = function(ev) {
			self.error = "Error HTTP";
			showResultIcon(ERR_FAIL);
			setTimeout(function() { showResultIcon(ERR_NONE); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			self.error = "Error Timeout";
			showResultIcon(ERR_FAIL);
			setTimeout(function() { showResultIcon(ERR_NONE); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/thrsh.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	}
	this.processData = function(sr) {
		var err = self.checkData(sr);
		if (err < 0) {
			self.error = "Error data";
			return;
		}
		self.save(sr);
		self.frm = sr;
		self.parse(sr);
		if (!self.created) {
			self.create();
		}
		self.showRows()
		self.showData();
		initFormChangeCheck();
	}
	this.checkData = function(frm) {
		var sr = frm.split('\t');
		for (var i = 0; i < sr.length; ++i) {
			n = self.computeDevNr(sr[i]);
			if (n < 0) {
				return -1;
			}
			var len = self.devices[n].frmlen;
			if (sr[i].length != len) {
				return -1;
			}
			if (!ishex(sr[i])) {
				return -1;
			}
		}
		return 0;
	}
	this.computeDevNr = function(sr) {
		if (sr.length < 4) {
			return -1;
		}
		var first = parseInt(sr.substr(0, 2), 16);
		var second = parseInt(sr.substr(2, 2), 16);
		if (isNaN(first) || isNaN(second)) {
			return -1;
		}
		var n;
		if (first == 0) {
			if (n > self.NR_EXP) {
				return -1;
			}
			n = second;
		} else {
			if (first > self.NR_REM) {
				return -1;
			}
			n = self.NR_EXP + first;
		}
		return n;
	}
	this.parse = function(frm) {
		for (var i = 0; i < self.NR_TOT; ++i) {
			self.devices[i].detected = false;
		}
		var sr = frm.split('\t');
		for (var i = 0; i < sr.length; ++i) {
			if (!this.checkAllZeroFrame(sr[i])){
				n = self.computeDevNr(sr[i]);
				self.parseSubFrm(sr[i], n);
				self.devices[n].detected = true;				
			}
		}
	}
	this.checkAllZeroFrame = function(sr){
		var isZero = true;
		for (var i=4;i<sr.length;i++){
			if (sr.substr(i,1)!="0") isZero=false;
		}
		return isZero;
	}
	this.parseSubFrm = function(sr, n) {
		self.devices[n].data = [];
		for (var i = 4; i < sr.length; i += 4) {
			var t = parseInt(sr.substr(i, 2), 16);
			var h = parseInt(sr.substr(i+2, 2), 16);
			if (t > 127) {
				t -= 256;
			}
			h /= 2;
			self.devices[n].data.push({
				thr: t,
				hys: h
			});
		}
	}
	this.showRows = function() {
		var showRow = [];
		for (var n = 0; n < self.NR_TOT; ++n) {
			showRow.push(false);
		}
		for (var n = 0; n < self.NR_TOT; ++n) {
			if (!self.devices[n].detected) {
				continue;
			}
			var rows;
			if (n == 0) {
				rows = self.computeRowsMaster();
			} else if (n <= self.NR_EXP) {
				rows = self.computeRowsExp(n);
			} else {
				rows = self.computeRowsRem(n);
			}
			for (var i = 0; i < rows.length; ++i) {
				r = rows[i];
				showRow[r] = true;
			}
		}
		for (var n = 0; n < self.NR_TOT; ++n) {
			self.devices[n].row.style.display = showRow[n] ? "table-row":"none";
		}
	}
	this.showData = function() {
		for (var n = 0; n < self.NR_TOT; ++n) {
			if (!self.devices[n].detected) {
				continue;
			}
			if (n == 0) {
				self.showDeviceDataMaster();
			} else if (n <= self.NR_EXP) {
				self.showDeviceDataExp(n);
			} else {
				self.showDeviceDataRem(n);
			}
		}
	}
	this.showDeviceDataMaster = function() {
		for (var i = 0; i < self.devices[0].data.length; ++i) {
			for (var p = 0; p < 2; ++p) {
				var val;
				if (p == 0) {
					val = self.devices[0].data[i].thr;
				} else {
					val = self.devices[0].data[i].hys;
				}
				var id = self.computeDataCellMasterId(i, p);
				if (!id) {
					return;
				}
				var el = document.getElementById(id);
				if (!el) {
					return;
				}
				if (p == 0) {
					el.value = val;
				} else {
					el.value = val.toFixed(1);
				}
			}
		}
	}
	this.computeDataCellMasterId = function(x, p) {
		/*if (x < 6) {
			//var r = 1 + this.NR_EXP + x;
			return self.elementsId(r, self.thrTypeIdx.optLocal, p);
		}
		if (x == 6) {
			return self.elementsId(1, self.thrTypeIdx.optLocal, p);
		}
		if (x == 7) {
			return self.elementsId(0, self.thrTypeIdx.temp, p);
		}
		return null;*/
		return self.elementsId(0, x, p);
	}
	this.computeRowsMaster = function() {
		var r = [];
		r.push(0);
		return r;
	}
	this.showDeviceDataExp = function(n) {
		for (var i = 0; i < self.devices[n].data.length; ++i) {
			for (var p = 0; p < 2; ++p) {
				var val;
				if (p == 0) {
					val = self.devices[n].data[i].thr;
				} else {
					val = self.devices[n].data[i].hys;
				}
				var id = self.computeDataCellExpId(n, i, p);
				if (!id) {
					return;
				}
				var el = document.getElementById(id);
				if (!el) {
					return;
				}
				if (p == 0) {
					el.value = val;
				} else {
					el.value = val.toFixed(1);
				}
			}
		}
	}
	this.computeDataCellExpId = function(n, x, p) {
		/*if (x < 6) {
			var r = 1 + this.NR_EXP + n*self.NR_RPU + x;
			return self.elementsId(r, self.thrTypeIdx.optLocal, p);
		}
		if (x == 6) {
			return self.elementsId(n, self.thrTypeIdx.optRem, p);
		}
		if (x == 7 && n < self.NR_EXP) {
			return self.elementsId(n+1, self.thrTypeIdx.optLocal, p);
		}
		if (x == 8) {
			return self.elementsId(n, self.thrTypeIdx.temp, p);
		}
		return null;*/
		return self.elementsId(n, x, p);
	}
	this.computeRowsExp = function(n) {
		var r = [];
		r.push(n);
		return r;
	}
	this.showDeviceDataRem = function(n) {
		for (var i = 0; i < self.devices[n].data.length; ++i) {
			for (var p = 0; p < 2; ++p) {
				var val;
				if (p == 0) {
					val = self.devices[n].data[i].thr;
				} else {
					val = self.devices[n].data[i].hys;
				}
				var id = self.computeDataCellRemId(n, i, p);
				if (!id) {
					return;
				}
				var el = document.getElementById(id);
				if (!el) {
					return;
				}
				if (p == 0) {
					el.value = val;
				} else {
					el.value = val.toFixed(1);
				}
			}
		}
	}
	this.computeDataCellRemId = function(n, x, p) {
		switch(x) {
		/*case 0: return self.elementsId(n, self.thrTypeIdx.dlPower, p);
		case 1: return self.elementsId(n, self.thrTypeIdx.temp, p);
		case 2: return self.elementsId(n, self.thrTypeIdx.optRem, p);
		case 3: return self.elementsId(n, self.thrTypeIdx.optOth, p);
		case 4: return self.elementsId(n, self.thrTypeIdx.pla1, p);
		case 5: return self.elementsId(n, self.thrTypeIdx.pla2, p);*/
		case 0: return self.elementsId(n, 3, p);
		case 1: return self.elementsId(n, 2, p);
		case 2: return self.elementsId(n, 0, p);
		case 3: return self.elementsId(n, 1, p);
		case 4: return self.elementsId(n, 4, p);
		case 5: return self.elementsId(n, 5, p);	
		default: return null;
		}
	}
	this.computeTitleCellRemId = function(n, x) {
		switch(x) {
		case 2: return self.titleId(n, self.thrTypeIdx.optRem);
		case 3: return self.titleId(n, self.thrTypeIdx.optOth);
		default: return null;
		}
	}
	this.computeRowsRem = function(n) {
		var r = [];
		r.push(n);
		return r;
	}
	this.disableUnusedCells = function() {
		for (var n = 0; n < self.NR_TOT; ++n) {
			if (self.devices[n].detected) {
				continue;
			}
			self.disableDeviceCells(n);
			//self.deleteTitleCells(n);
		}
	}
	this.disableDeviceCells = function(n) {
		var type;
		if (n == 0) {
			type = 0;
		} else if (n <= self.NR_EXP) {
			type = 1;
		} else {
			type = 2;
		}
		for (var i = 0; i < self.devices[n].datalen; ++i) {
			for (var p = 0; p < 2; ++p) {
				var id;
				switch(type) {
				case 0: id = self.computeDataCellMasterId(n, i, p); break;
				case 1: id = self.computeDataCellExpId(n, i, p); break;
				case 2: id = self.computeDataCellRemId(n, i, p); break;
				}
				if (!id) {
					return;
				}
				var el = document.getElementById(id);
				if (!el) {
					return;
				}
				el.style.backgroundColor = "#D8D8D8";
				el.disabled = true;
			}
		}
	}
	this.deleteTitleCells = function(n) {
		if (n <= self.NR_EXP) {
			return;
		}
		var id = [];
		id.push(self.titleId(n, self.thrTypeIdx.optRem));
		id.push(self.titleId(n, self.thrTypeIdx.optOth));
		for (var i = 0; i < id.length; ++i) {
			var el = document.getElementById(id[i]);
			el.innerHTML = "";
		}
	}
	this.computeStatusRem = function() {
		var remlink = []
		var stat = localStorage.getItem("stat_"+prjname+window.location.host);
		var starr = stat.split("\t");
		for (var n = 0; n < starr.length; ++n) {
			var first = parseInt(starr[n].substr(0, 2), 16);
			var second = parseInt(starr[n].substr(2, 2), 16);
			if (!first == 0) {
				break;
			}
			var mask;
			if (second == 0) {
				mask = parseInt(starr[n].substr(388, 2), 16);
			} else {
				mask = parseInt(starr[n].substr(232, 2), 16);
			}
			remlink.push(mask);
		}
		return remlink;
	}
	this.format = function() {
		var devdata = [];
		var newfrm = [];
		var currfrm = self.frm.split('\t');
		var sendfrm = [];
		for (var n = k = 0; n < self.NR_TOT; ++n) {
			if (!self.devices[n].detected) {
				continue;
			}
			var newdata = self.getDeviceData(n);
			devdata.push(newdata);
			newfrm.push(self.formatSubFrm(newdata, n));
			if (newfrm[k] != currfrm[k]) {
				sendfrm.push(newfrm[k]);
			}
			k++;
		}
		return sendfrm;
	}
	this.getDeviceData = function(n) {
		var newdata = [];
		for (var i = 0; i < self.devices[n].data.length; ++i) {
			newdata.push({
				thr: self.devices[n].data[i].thr,
				hys: self.devices[n].data[i].hys
			});
			for (var p = 0; p < 2; ++p) {
				var id;
				if (n == 0) {
					id = self.computeDataCellMasterId(i, p);
				} else if (n <= self.NR_EXP) {
					id = self.computeDataCellExpId(n, i, p);
				} else {
					id = self.computeDataCellRemId(n, i, p);
				}
				if (!id) {
					continue;
				}
				var el = document.getElementById(id);
				if (!el) {
					continue;
				}			
				if (p == 0) {
					var val = parseInt(el.value);
					if (val > parseInt(el.max)){
						val = parseInt(el.max);
						el.value = val;
					}
					if (val < parseInt(el.min)){
						val = parseInt(el.min);
						el.value = val;
					}	
					if (!isNaN(val)) {
						newdata[i].thr = val;
					}
				} else {
					var val = parseFloat(el.value);
					if (val > parseFloat(el.max)){
						val = parseFloat(el.max);
						el.value = val.toFixed(1);
					}
					if (val < parseFloat(el.min)){
						val = parseFloat(el.min);
						el.value = val.toFixed(1);
					}						
					if (!isNaN(val)) {
						newdata[i].hys = val;
					}
				}
			}
		}
		return newdata;
	}
	this.formatSubFrm = function(data, n) {
		var frm = "";
		if (n <= self.NR_EXP) {
			frm += "00"+hexformat(n, 2);
		} else {
			frm += hexformat(n-self.NR_EXP, 2)+"01";
		}
		self.devices[n].data = [];
		for (var i = 0; i < data.length; ++i) {
			var t = data[i].thr;
			var h = data[i].hys;
			if (t < 0) {
				t += 256;
			}
			if (h < 0) {
				h = 0;
			}
			h = ~~Math.round(h * 2);
			if (h > 127) {
				h = 127;
			}
			frm += hexformat(t, 2);
			frm += hexformat(h, 2);
		}
		return frm;
	}
	this.save = function(sr) {
		var id = self.localStorageId();
		localStorage.setItem(id, sr);
	}
	this.retrieve = function() {
		var id = self.localStorageId();
		var sr = localStorage.getItem(id);
		return sr;
	}
	this.localStorageId = function() {
		var id = "thresholds_"+prjname+"_"+window.location.host;
		return id;
	}
	this.preXhr = function() {
		self.submitLocked = true;
		showResultIcon(ERR_PENDING);
		guiBlocked(true);
	}
	this.postXhr = function() {
		self.submitLocked = false;
		showResultIcon(ERR_NONE);
		guiBlocked(false);
		self.disableUnusedCells();
	}
	this.apply = function() {
		if (!checkChange() || self.submitLocked) {
			return;
		}
		self.frmsend = self.format();
		if (self.frmsend.length == 0) {
			return;
		}
		self.preXhr();
		self.results = [];
		self.counter = 0;
		self.sendData();
	}
	this.sendData = function() {
		var sr = self.frmsend[0];
		thrsh_str = sr;
		document.getElementById("thrsh_str").value = sr;
		self.frmsend.splice(0, 1);
		var xhr = xmlreq();
		xhr.onreadystatechange = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				self.checkResult();
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { self.postXhr(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { self.postXhr(); }, 1500);
		}
		xhr.open("POST", "/thrsh.zhtml", true);
		xhr.timeout = 5000;
		xhr.send("thrsh_str="+sr);
		xhr = null;
	}
	this.checkResult = function() {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var error = parseInt(this.responseText);
				if (error != ERR_OK && error != ERR_FAIL) {
					if (++self.counter < 40) {
						setTimeout(function() { 
							self.checkResult(); 
							}, 1000);
						return;
					} else {
						error = ERR_FAIL;
					}
				}
				self.results.push(error);
				if (self.frmsend.length == 0) {
					var error = ERR_OK;
					for (var i = 0; i < self.results.length; ++i) {
						if (self.results[i] == ERR_FAIL) {
							error = ERR_FAIL;
							break;
						}
					}
					showResultIcon(error);
					setTimeout(function() { self.loadData(); }, 500);
				} else {
					self.sendData();
				}
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { self.postXhr(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { self.postXhr(); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; };
		xhr.open("GET", "/result.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	}
	this.initData();
}
function tag_read(hextag) {
	var tag = '';
	var pos = 0;
	for (var i = 0; i < hextag.length; i += 2) {
		try {
			var hexnum = hextag.substr(i, 2);
			var num = parseInt(hexnum, 16);
			if (isNaN(num)) {
				num = 0x20;
			}
		} catch(e) {}
		tag += String.fromCharCode(num);
	}
	return tag;
}
function parse_tags(serverResponse) {
	try {
		var TAGLEN = window.top.TAGLEN;
		var LOCLEN = window.top.LOCLEN;
		var str = tag_read(serverResponse);
		var strlen = str.length;
		var len = TAGLEN + LOCLEN + 4;
		var tagstrs = [];
		for (var p = 0; p < strlen; p += len + 1) {
			if (strlen - p < len) {
				break;
			}
			try {
				tagstrs.push(str.substr(p, len));
			} catch(e) {}
		}
		var n;
		//master se asume que siempre es el primer elemento
		tags[0] = (tagstrs[0].substr(4,TAGLEN));
		//expansores
		for (n=1; n<=window.top.MaxExpansorNr; ++n)
		{
			var hfound = false;
			for (var i=1;i<tagstrs.length;i++){
				if (parseInt(tagstrs[i].substr(2,2),16)==n && tagstrs[i].substr(0,2)=="00"){
					tags[n] = (tagstrs[i].substr(4,TAGLEN));
					hfound = true;
				}
				
			}
			if (!hfound) tags[n] = "";
		}
		//remotos
		for (n=1; n<=window.top.MaxRemotesNr; ++n){
			var hfound = false;
			for (var i=1;i<tagstrs.length;i++){
				
				if (parseInt(tagstrs[i].substr(0,2),16)==n && tagstrs[i].substr(2,2)=="01"){
					tags[n+3] = (tagstrs[i].substr(4,TAGLEN));
					hfound = true;
				}
			}
			if (!hfound) tags[n+3] = "";
		}
	} catch(e) {}
}