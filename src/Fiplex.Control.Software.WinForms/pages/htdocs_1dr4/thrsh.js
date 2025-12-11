var gui;

function onloadInit() {
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
	this.elements = [
		{
			lbl: "DOWNLINK&nbsp;OUTPUT&nbsp;POWER&nbsp;ALARM (dBm)",
			lblaux: "Alarm occurs after 2 minutes below the threshold",
			sign: "<",
			min: -10,
			max: +37,
			id: "dlpwr",
			data: []
		},
		{
			lbl: "OVER&nbsp;TEMPERATURE (&deg;C)",
			lblaux: "",
			sign: ">",
			min: 0,
			max: +85,			
			id: "temp",
			data: []
		},
		{
			lbl: "LOSS&nbsp;OF&nbsp;OPTICAL&nbsp;SIGNAL&nbsp;LINK&nbsp;#1 (dBm)",
			lblaux: "",
			sign: "<",
			min: -30,
			max: 0,				
			id: "los1",
			data: []
		},
		{
			lbl: "LOSS&nbsp;OF&nbsp;OPTICAL&nbsp;SIGNAL&nbsp;LINK&nbsp;#2 (dBm)",
			lblaux: "",
			sign: "<",
			min: -30,
			max: 0,				
			id: "los2",
			data: []
		},
		{
			lbl: "PATH&nbsp;LOSS&nbsp;ANALYZER&nbsp;#1 (dBm)",
			lblaux: "",
			sign: "<",
			min: -100,
			max: -20,				
			id: "pla1",
			data: []
		},
		{
			lbl: "PATH&nbsp;LOSS&nbsp;ANALYZER&nbsp;#2 (dBm)",
			lblaux: "",
			sign: "<",
			min: -100,
			max: -20,				
			id: "pla2",
			data: []
		}
	];
	this.error;
	this.submitLocked = false;
	this.counter;
	this.create = function() {
		var page = document.getElementById("page");
		var h = document.createElement("h1");
		h.innerHTML = "THRESHOLDS";
		page.appendChild(h);
		var tbl = document.createElement("table");
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		tb.appendChild(self.createTitles());
		for (var i = 0; i < self.elements.length; ++i) {
			var row = document.createElement("tr");
			var cell = document.createElement("th");
			cell.innerHTML = self.elements[i].lbl;
			row.appendChild(cell);
			cell = document.createElement("th");
			cell.innerHTML = self.elements[i].sign;
			row.appendChild(cell);
			for (var j = 0; j < 2; ++j) {
				var cell = document.createElement("td");
				row.appendChild(cell);
				var el = document.createElement("input");
				el.type = "text";
				el.id = el.name = self.elementsId(i, j);
				el.isHys = (j == 1);
				el.onkeypress = function(ev) {
					if (this.isHys) {
						return isKeyDecimalNumber(ev);
					}
					return isKeySignedNumber(ev);
				}
				if (el.isHys) {
					el.title = "Min: 0, Max: 10, Resolution: 0.5"
				} else {
					el.title = "Min: "+self.elements[i].min+", Max: "+self.elements[i].max+", Resolution: 1";
				}
				el.size = 5;
				el.className = "centered";
				el.style.textAlign = "right";
				cell.appendChild(el);
				if (!el.isHys) {
					cell = document.createElement("th");
					cell.innerHTML = "&#177;";
					row.appendChild(cell);
				}
			}
			if (self.elements[i].lblaux.length>0){
				cell = document.createElement("th");
				cell.innerHTML = self.elements[i].lblaux;
				row.appendChild(cell);
			}
			tb.appendChild(row);
		}
		page.appendChild(tbl);
	}
	this.createTitles = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = "THRESHOLD";
		cell.style.minWidth = "100px";
		row.appendChild(cell);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.innerHTML = "HYSTERESIS";
		cell.style.minWidth = "100px";
		row.appendChild(cell);
		return row;
	}
	this.destroy = function() {
		var page = document.getElementById("page");
		remove_children(page);
	}
	this.start = function() {
		self.preXhr();
		self.requestData();
	}
	this.requestData = function() {
		var xhr = xmlreq();
		xhr.onreadystatechange = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				self.loadData();
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
				self.processData(sr);
				self.postXhr();
			}
		}
		xhr.onerror = function(ev) {
			self.error = "Error HTTP";
		}
		xhr.ontimeout = function(ev) {
			self.error = "Error Timeout";
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/thrsh.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
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
		self.show();
		initFormChangeCheck();
	}
	this.checkData = function(sr) {
		var len = self.elements.length * 2 * 2;
		if (sr.length != len) {
			return -1;
		}
		for (var i = 0; i < sr.length; ++i) {
			if (!isHex(sr[i])) {
				return -1;
			}
		}
		return 0;
	}
	this.parse = function(sr) {
		for (var n = 0; n < self.elements.length; ++n) {
			for (var i = 0; i < 2; ++i) {
				var str = sr.substr(n*4+i*2, 2);
				var num = parseInt(str, 16);
				if (i == 0) {
					if (num > 127) {
						num -= 256;
					}
				} else {
					num /= 2;
				}
				self.elements[n].data[i] = num;
			}
		}
	}
	this.show = function() {
		for (var n = 0; n < self.elements.length; ++n) {
			for (var i = 0; i < 2; ++i) {
				var id = self.elementsId(n, i);
				var el = document.getElementById(id);
				try {
					var v = self.elements[n].data[i];
					if (i == 0) {
						el.value = v;
					} else {
						el.value = v.toFixed(1);
					}
				} catch(e) {}
			}
		}
	}
	this.format = function() {
		var data = [];
		for (var n = 0; n < self.elements.length; ++n) {
			for (var i = 0; i < 2; ++i) {
				var id = self.elementsId(n, i);
				var el = document.getElementById(id);
				var isTh = (i == 0);
				var v = (isTh ?  parseInt(el.value) : parseFloat(el.value));
				if (isNaN(v)) {
					data.push(self.elements[n].data[i]);
					continue;
				}
				if (isTh) {
					if (v > self.elements[n].max){
						v = self.elements[n].max;
					}
					if (v < self.elements[n].min){
						v = self.elements[n].min;
					}
					el.value = v;
					if (v < 0) {
						v += 256;
					}
				} else {
					if (v < 0) {
						v = 0;
					}
					if (v > 10) {
						v = 10;
					}
					el.value = v.toFixed(1);
					v = ~~Math.round(v * 2);
					if (v > 127) {
						v = 127;
					}
				}
				data.push(v);
			}
		}
		var sr = "";
		var k = 0;
		for (var n = 0; n < self.elements.length; ++n) {
			for (var i = 0; i < 2; ++i, ++k) {
				sr += hexformat(data[k], 2);
			}
		}
		return sr;
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
	this.elementsId = function(n, i) {
		return (self.elements[n].id+"_"+i);
	}
	this.preXhr = function() {
		self.submitLocked = true;
		inputDisable(true);
		cursorWait();
		showResultIcon(ERR_PENDING);
	}
	this.postXhr = function() {
		self.submitLocked = false;
		inputDisable(false);
		cursorClear();
		showResultIcon(ERR_NONE);
	}
	this.apply = function() {
		var sr = self.format();
		if (!checkChange() || sr == self.frm || self.submitLocked) {
			return;
		}
		self.preXhr();
		thrsh_str= sr;
		document.getElementById("thrsh_str").value = sr;
		self.sendData(sr);
	}
	this.sendData = function(sr) {
		var xhr = xmlreq();
		xhr.onreadystatechange = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				self.counter = 0;
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
					if (++self.counter < 10) {
						setTimeout(function() { 
							self.checkResult(); 
							}, 1000);
						return;
					} else {
						error = ERR_FAIL;
					}
				}
				showResultIcon(error);
				setTimeout(function() { self.loadData(); }, 500);
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
	this.create();
}
