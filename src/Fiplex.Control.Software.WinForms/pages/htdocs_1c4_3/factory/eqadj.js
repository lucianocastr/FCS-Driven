var eqAdj;
var equAdjStr;
var tmrId;
var countCheck;

function onloadInit() {
	eqAdj = new EquAdj();
	showResultIcon(ERR_NONE);
	eqAdj.createForm();
	equAdjReq();
	cursorWait();
	showResultIcon(ERR_PENDING);
}
function reloadData(){
	equAdjReq();
	cursorWait();
	showResultIcon(ERR_PENDING);
}
function equAdjReq() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_equ_adj(); }, 1000);
				} else {
					if (typeof(tmrId) !== "undefined" && tmrId)
						clearTimeout(tmrId);
					tmrId = setTimeout(function() { equAdjReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { equAdjReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { equAdjReq(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("POST", "/factory/eqad.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("equ_adj_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_equ_adj() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					eqAdj.parse(serverResponse);
					eqAdj.render();
					equAdjStr = serverResponse;
					initFormChangeCheck();
					window.top.submitLocked = false;
					xhrOnEnd();
				} else {
					tmrId = setTimeout(function() { load_equ_adj(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_equ_adj(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_equ_adj(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_eqadj.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function submitform() {
	if (!checkChange())
		return;
	if ((typeof window.top.submitLocked == "undefined") || !window.top.submitLocked) {
		window.top.submitLocked = true;
	} else if (window.top.submitLocked) {
		return;
	}
	var frm = eqAdj.format(equAdjStr);
	equAdjStr = frm;
	document.getElementById("equ_adj_str").value = frm;
	doSubmit(frm);
}
function doSubmit(frm) {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					countCheck = 0;
					setTimeout(function() { check_result(); }, 100);
				} else {
					showResultIcon(ERR_FAIL);
					setTimeout(function() { xhrOnEnd(); }, 1500);
				}
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.open("POST", "/factory/eqad.zhtml", true);
		xhr.timeout = 5000;
		xhrOnStart();
		xhr.send("equ_adj_str="+frm);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}

(function() {
	onunload = function() {
		window.top.submitLocked = false;
		cursorClear();
		showResultIcon(ERR_NONE);
		guiBlocked(false);
	};
})();

function xhrOnStart() {
	window.top.submitLocked = true;
	cursorWait();
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
}

function xhrOnEnd() {
	window.top.submitLocked = false;
	cursorClear();
	showResultIcon(ERR_NONE);
	guiBlocked(false);
}

function check_result() {
	if (typeof countCheck === "undefined")
		countCheck = 0;
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				var error;
				if (this.status === 200) {
					error = parseInt(this.responseText);
					if (error != ERR_OK && error != ERR_FAIL) {
						if (++countCheck < 25) {
							setTimeout(function() { check_result(); }, 1000);
							return;
						} else
							error = ERR_FAIL;
					}
				} else {
					error = ERR_FAIL;
				}
				showResultIcon(error);
				setTimeout(function() { equAdjReq(); }, 100);
			}
		}
		xhr.onerror = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			showResultIcon(ERR_FAIL);
			setTimeout(function() { xhrOnEnd(); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; }; 		
		xhr.open("GET", "/result.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function EquAdj() {
	this.frameStr;
	this.tableLen = 6;
	this.frameLen = this.tableLen * 8;
	this.data = [];
	var self = this;
	this.parse = function(sr) {
		if (sr.length < this.frameLen)
			return;
		this.data = [];
		var p = 0;
		for (var b = 0; b < 2; ++b) {
			this.data.push([]);
			for (var j = 0; j < 2; ++j) {
				this.data[b].push([]);
				for (var i = 0; i < 2; ++i) {
					this.data[b][j].push([]);
					for (var k = 0; k < this.tableLen; ++k) {
						var num = parseInt(sr.substr(p, 4), 16);
						p += 4;
						if (typeof(num) == 'undefined' || isNaN(num))
							num = 0;
						if (num > 32767)
							num -= 65536;
						this.data[b][j][i].push(num);
					}
				}
			}
		}
	}
	this.render = function() {
		for (var b = 0; b < 2; ++b) {
			for (var j = 0; j < 2; ++j) {
				for (var i = 0; i < 2; ++i){
					for (var k = 0; k < this.tableLen; ++k) {
						try {
							var id = 'coeff_'+b+'_'+j+'_'+i+'_'+k;
							var el = document.getElementById(id);
							el.value = this.data[b][j][i][k];
						} catch (err) {}
					}
				}
			}
		}
	}
	this.format = function() {
		var frm = "";
		for (var b = 0; b < 2; ++b) {
			for (var j = 0; j < 2; ++j) {
				for (var i = 0; i < 2; ++i) {
					for (k = 0; k < this.tableLen; ++k) {
						try {
							var id = 'coeff_'+b+'_'+j+'_'+i+'_'+k;
							var el = document.getElementById(id);
							var num = parseInt(el.value);
							if (!(isNaN(num) || num < -32768 || num > 32767))
								this.data[b][j][i][k] = num;
						} catch (err) {}
						var num = this.data[b][j][i][k];
						if (num < 0)
							num +=65536;
						frm += hexformat(num, 4);
					}
				}
			}
		}
		this.frameStr = frm;
		return frm;
	}
	this.createForm = function() {
		var Texts = TextEn;
		var cont = document.getElementById("page");
		var mainTab = document.createElement("table");
		cont.appendChild(mainTab);
		var mainTb = document.createElement("tbody");
		mainTab.appendChild(mainTb);
		mainTb.appendChild(this.createTitleMain());
		mainTb.appendChild(this.createTitleBand());
		mainTb.appendChild(this.createTitleTr());
		mainTb.appendChild(this.createTitleIm());
		for (var k = 0; k < this.tableLen; ++k) {
			mainTb.appendChild(this.createFormRow(k));
		}
		mainTb.appendChild(this.createResetButtons());
	}
	this.createTitleMain = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.colSpan = 8;
		cell.innerHTML = "EQUALIZER&nbsp;COEFFICIENTS";
		cell.style.fontSize = "large";
		row.appendChild(cell);
		return row;		
	}
	this.createTitleBand = function() {
		var row = document.createElement("tr");
		for (var b = 0; b < 2; ++b) {
			var cell = document.createElement("th");
			cell.colSpan = 4;
			cell.style.color = "black";
			cell.style.border = "1px solid #db5902";
			cell.innerHTML = (b == 0 ? "UPLINK" : "DOWNLINK");
			row.appendChild(cell);
		}
		return row;
	}
	this.createTitleTr = function() {
		var row = document.createElement("tr");
		for (var b = 0; b < 2; ++b) {
			for (var j = 0; j < 2; ++j) {
				var cell = document.createElement("th");
				cell.colSpan = 2;
				cell.style.color = "black";
				cell.style.border = "1px solid #db5902";
				cell.innerHTML = (j == 0 ? "RX" : "TX");
				row.appendChild(cell);
			}
		}
		return row;
	}
	this.createTitleIm = function() {
		var row = document.createElement("tr");
		for (var b = 0; b < 2; ++b) {
			for (var j = 0; j < 2; ++j) {
				for (var i = 0; i < 2; ++i) {
					var cell = document.createElement("th");
					cell.style.color = "black";
					cell.style.border = "1px solid #db5902";
					cell.innerHTML = (i == 0 ? "Real" : "Imag.");
					row.appendChild(cell);
				}
			}
		}
		return row;
	}
	this.createFormRow = function(k) {
		var row = document.createElement("tr");
		for (var b = 0; b < 2; ++b) {
			for (var j = 0; j < 2; ++j) {
				for (var i = 0; i < 2; ++i) {
					var el = document.createElement("input");
					el.type = "text";
					el.size = 10;
					el.className = "number";
					el.id = 'coeff_'+b+'_'+j+'_'+i+'_'+k;
					el.name = el.id;
					el.onkeypress = function(ev) {
						ev = ev || window.event;
						return isKeyDecimalNumber(ev);
					}
					var cell = document.createElement("td");
					cell.appendChild(el);
					row.appendChild(cell);
				}
			}
		}
		return row;
	}
	this.createResetButtons = function() {
		var row = document.createElement("tr");
		for (var b = 0; b < 2; ++b) {
			var el = document.createElement("input");
			el.type = "button";
			el.value = "Reset Coefficients";
			el.chain = b;
			el.onclick = function(ev) {
				if (this.chain == null || this.chain == "undefined") {
					return;
				}
				var b = this.chain;
				for (var j = 0; j < 2; ++j) {
					for (var i = 0; i < 2; ++i) {
						for (var k = 0; k < self.tableLen; ++k) {
							var id = 'coeff_'+b+'_'+j+'_'+i+'_'+k;
							var el = document.getElementById(id);
							try {
								el.value = (i == 0 && k == 0 ? 32767 : 0);
							} catch (err) {}
						}
					}
				}
				submitform();
			}
			var cell = document.createElement("th");
			cell.colSpan = 4;
			cell.style.border = "1px solid #db5902";
			cell.appendChild(el);
			row.appendChild(cell);
		}
		return row;
	}
}
