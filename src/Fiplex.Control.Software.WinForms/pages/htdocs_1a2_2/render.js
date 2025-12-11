<!--
ch_Bw_Txt = ["90", "45", "30", "20", "15"];

var hpa_settings = [{min: -20, low_alarm: -128, low_warn: -128, high_warn: 19, high_alarm: 22, max: 25 },
		    {min:   0, low_alarm: -128, low_warn:  25, high_warn: 37, high_alarm: 40, max: 45 }];
var board_temp_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 80, high_alarm: 85, max: 90 };
var chRfIn_settings = [{min: -110, low_alarm: -121, low_warn: -121, high_warn: 0, high_alarm: 0, max: 0 }, 
		       {min:  -90, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 }];
var chRfOut_settings = [{min: -35, low_alarm: 20, low_warn: 20, high_warn: 36, high_alarm: 40, max: 25 },
			{min: -20, low_alarm: 20, low_warn: 20, high_warn: 36, high_alarm: 40, max: 40 }];
var chIsolM_settings = {min: 50, low_alarm: 50, low_warn: 60, high_warn: 100, high_alarm: 120, max: 120 };
var agc_settings = [{min: 0, low_alarm: 0, low_warn: 0, high_warn: 80, high_alarm: 80, max: 80 },
		    {min: 0, low_alarm: 0, low_warn: 0, high_warn: 40, high_alarm: 40, max: 40 }];

function View() {
	var self = this;
	this.maxChannels = window.top.MaxChNr;
	this.create = function(fct) {
		this.removeAllElements();
		var rootEl = document.createElement("div");
		rootEl.id = "rootElement";
		document.getElementById("page").appendChild(rootEl);
		var unitDiv = document.createElement("div");
		unitDiv.className = "unitbox";
		rootEl.appendChild(unitDiv);
		var headDiv = this.createHeadDiv();
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDiv";
		unitDiv.appendChild(contentDiv);
		var mainTab = this.createMainTab(window.top.MaxChNr, window.top.showChannelsBitmask, fct);
		contentDiv.appendChild(mainTab);
	}
	this.removeAllElements = function() {
		try {
			remove_element(document.getElementById("rootElement"));
		} catch(e) {}
	}
	this.createHeadDiv = function() {
		var box = document.createElement("div");
		box.className = "headbox";
		var tab = document.createElement("table");
		box.appendChild(tab);
		tab.className = "headtable";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "small";
		cell.style.paddingLeft = "20px";
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.id = "tagName";
		cell.innerHTML = "Tag";
		cell.className = "tag";
		cell.style.width = "100%";
		cell.style.textAlign = "center";
		return box;
	}
	this.showTag = function(name) {
		try {
			var tag = document.getElementById("tagName");
			if(typeof String.prototype.trim !== 'function'){
				  String.prototype.trim = function() {
					return this.replace(/^\s+|\s+$/g, ''); 
				}
			}		
			tag.innerHTML = name.trim();
		} catch (err) {}
	}
	this.createMainTab = function(maxChannels, chMask, fct) {
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var row = document.createElement("tr");
		tab.appendChild(row);
		var cell = document.createElement("th");
		cell.className = "tval";
		cell.innerHTML = "MAIN&nbsp;SETTINGS";
		row.appendChild(cell);
		cell = document.createElement("th");
		cell.className = "tval";
		cell.innerHTML = "FILTERING";
		row.appendChild(cell);
		row = document.createElement("tr");
		tab.appendChild(row);
		cell = document.createElement("td");
		cell.className = "contentcell";
		row.appendChild(cell);
		var el = this.createBandCtlBox(fct);
		cell.appendChild(el);
		cell = document.createElement("td");
		cell.className = "contentcell";
		row.appendChild(cell);
		el = this.createChCtlBox(maxChannels, chMask);
		cell.appendChild(el);
		return tab;
	}
	this.createBandCtlBox = function(fct) {
		var box = document.createElement("div");
		var tbl = document.createElement("table");
		tbl.style.marginLeft = tbl.style.marginRight = "auto";
		box.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		tb.appendChild(this.createMainGainLim(0));
		tb.appendChild(this.createMainPowerLim(0));
		tb.appendChild(this.createSquelchEnable(0));
		tb.appendChild(this.createSquelchThreshold(0));
		tb.appendChild(this.createTrackingEnable());
		tb.appendChild(this.createHpaCtl(0));
		tb.appendChild(this.createPaPwrOut(0));
		tb.appendChild(this.createTempBoard());
		tb.appendChild(this.createInputOverflow(0));
		tb.appendChild(this.createStabRow(0));
		tb.appendChild(this.createFpgaError());
		tb.appendChild(this.createFipCommError(fct));
		tb.appendChild(this.createFipVswr(fct));
		tb.appendChild(this.createFipTxLow(fct));
		tb.appendChild(this.createUnitReset());
		return box;
	}
	this.filtTitles = ["Enable", "Freq.&nbsp;(MHz)", "BW&nbsp;(KHz)", "Fine&nbsp;Gain", 
		"Power&nbsp;In&nbsp;(dBm)", "Power&nbsp;Out&nbsp;(dBm)", "AGC&nbsp;(dB)", "Isolation&nbsp;(dB)",
		"Signal&nbsp;In", "Stability"];

	this.createChCtlBox = function(maxChannels, chMask) {
		var box = document.createElement("div");
		var tbl = document.createElement("table");
		box.appendChild(tbl);
		var tb = document.createElement("tbody");
		tbl.appendChild(tb);
		// tb.appendChild(this.createShowFilters(maxChannels, chMask));
		tb.appendChild(this.createFilterTitles(maxChannels, chMask));
		for (var i = 0; i < window.top.MaxChNr; ++i) {
			tb.appendChild(this.createFilter(i, chMask));
		}
		return box;
	}
	// createBandCtlBox
	this.createMainGainLim = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['GAINLIM'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "mainGainLimit"+(dn? 1 : 0);
		el.name = el.id;
		el.type = "text";
		el.size = "4";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.title = "Min: "+config.conf.band[dn].mainGainMin+", Max: "+factory.data.band[dn].gainLim+" dB";
		el.onchange = function(ev) {
			ev = ev || window.event;
			var target = ev.target ? ev.target : ev.srcElement;
			var dn = (target.id == "mainGainLimit1" ? 1 : 0);
			var num = self.mainGainLimGet(dn);
			if (num < config.conf.band[dn].mainGainMin) {
				target.value = config.conf.band[dn].mainGainMin;
			} else if (num > factory.data.band[dn].gainLim) {
				target.value = factory.data.band[dn].gainLim;
			} else {
				target.value = num;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dB";
		cell.style.textAlign = "left";
		return row;
	}
	this.mainGainLimSet = function(dn, val) {
		try {
			var el = document.getElementById("mainGainLimit"+(dn? 1 : 0));
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.mainGainLimGet = function(dn) {
		try {
			var el = document.getElementById("mainGainLimit"+(dn? 1 : 0));
			return parseInt(el.value);
		} catch (err) { return -128; }
	}
	this.createMainPowerLim = function (dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['POWERLIM'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "mainPowerLimit"+(dn? 1 : 0);
		el.name = el.id;
		el.type = "text";
		el.size = "4";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.title = "Min: "+(factory.data.band[dn].powerLim - config.conf.band[dn].mainPowerRange)+", Max: "+factory.data.band[dn].powerLim+" dBm";
		el.onchange = function(ev) {
			ev = ev || window.event;
			var target = ev.target ? ev.target : ev.srcElement;
			var dn = (target.id == "mainPowerLimit1" ? 1 : 0);
			var num = self.mainPowerLimGet(dn);
			if (num < (factory.data.band[dn].powerLim - config.conf.band[dn].mainPowerRange)) {
				target.value = (factory.data.band[dn].powerLim - config.conf.band[dn].mainPowerRange);
			} else if (num > factory.data.band[dn].powerLim) {
				target.value = factory.data.band[dn].powerLim;
			} else {
				target.value = num;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dBm";
		cell.style.textAlign = "left";
		return row;
	}
	this.mainPowerLimSet = function (dn, val) {
		try {
			var el = document.getElementById("mainPowerLimit"+(dn? 1 : 0));
			if (!isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.mainPowerLimGet = function (dn) {
		try {
			var el = document.getElementById("mainPowerLimit"+(dn? 1 : 0));
			return parseInt(el.value);
		} catch (err) { return -128; }
	}
	this.createSquelchEnable = function (dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['SQUELCH'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "sqEn"+(dn? 1 : 0);
		el.name = el.id;
		el.type = "checkbox";
		el.className = "centered";
		el.isSet;
		el.onclick = function(ev) {
			ev = ev || window.event;
			var ob = ev.target ? ev.target : ev.srcElement;
			ob.isSet = ob.checked;
		}
		cell.appendChild(el);
		return row
	}
	this.squelchEnSet = function(dn, on) {
		try {
			var el = document.getElementById("sqEn"+(dn? 1 : 0));
			var chk = on;
			el.isSet = on;
			el.checked = chk;
		} catch (err) {}
	}
	this.squelchEnIsSet = function(dn) {
		try {
			var el = document.getElementById("sqEn"+(dn? 1 : 0));
			if (dn == 0) {
				return el.checked;
			} else {
				return el.isSet;
			}
		} catch (err) {
			return false;
		}
	}
	this.createSquelchThreshold = function (dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['SQTHRS'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "sqThr"+(dn? 1 : 0);
		el.name = el.id;
		el.type = "text";
		el.size = "4";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.title = "Min: "+config.conf.band[dn].squelchThrMin+", Max: "+config.conf.band[dn].squelchThrMax+" dBm";
		el.onchange = function(ev) {
			ev = ev || window.event;
			var target = ev.target ? ev.target : ev.srcElement;
			var dn = (target.id == "sqThr1" ? 1 : 0);
			var num = self.squelchThrGet(dn);
			if (num < config.conf.band[dn].squelchThrMin) {
				target.value = config.conf.band[dn].squelchThrMin;
			} else if (num > config.conf.band[dn].squelchThrMax) {
				target.value = config.conf.band[dn].squelchThrMax;
			} else {
				target.value = num;
			}
		}
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dBm";
		cell.style.textAlign = "left";
		return row;
	}
	this.squelchThrSet = function(dn, val) {
		try {
			var el = document.getElementById("sqThr"+(dn? 1 : 0));
			if (!isNaN(val))
				el.value = val;
		} catch (err) {}
	}
	this.squelchThrGet = function(dn) {
		try {
			var el = document.getElementById("sqThr"+(dn? 1 : 0));
			return parseInt(el.value);
		} catch (err) {
			return -128;
		}
	}
	this.createTrackingEnable = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts["TRACKING"];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = "tracking";
		el.name = el.id;
		el.className = "centered";
		el.onclick = function(ev) {
			// ev = ev || window.event;
			// var ob = ev.target ? ev.target : ev.srcElement;
			// squelchEnSet(1, squelchEnIsSet(1), ob.checked);
		}
		cell.appendChild(el);
		return row;
	}
	this.setTrackingEnable = function(on) {
		try {
			var el = document.getElementById("tracking");
			el.checked = on;
		} catch (err) { }
	}
	this.isTrackingEnable = function() {
		try {
			var el = document.getElementById("tracking");
			return el.checked;
		} catch (err) { return null;}
	}
	this.createHpaCtl = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "PA&nbsp;Enable";
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createHpaSwitch(dn);
		el.className = "centered";
		cell.appendChild(el);
		return row
	}
	this.createHpaSwitch =function(dn) {
		var box = document.createElement("div");
		box.id = "hpaSwBox"+(dn? 1 : 0);
		box.style.border = "medium solid #00AAAA";
		box.style.width = "40px";
		box.style.height = "10px";
		box.style.verticalAlign = "middle";
		box.style.textAlign = "center";
		box.style.padding = "2px";
		box.style.backgroundColor = "#D0FFD0";
		box.style.borderStyle = "inset";
		box.style.borderRadius = "3px";
		box.onmouseover = function() { this.style.borderColor = "#3030A0"; };
		box.onmouseout = function() { this.style.borderColor = "#30AAAA"; };
		var lbl = document.createElement("label");
		box.appendChild(lbl);
		lbl.id = "hpaSwLbl"+(dn? 1 : 0);
		lbl.className = "togglebuttonlabel";
		lbl.setAttribute("unselectable", "on");
		lbl.style.whiteSpace = "nowrap";
		lbl.style.fontWeight = "bold";
		lbl.style.display = "inline-block";
		lbl.style.width = "40px";
		lbl.style.height = "12px";
		lbl.innerHTML = "ON";
		var el = document.createElement("input");
		el.id = "hpaSwInp"+(dn? 1 : 0);
		el.name = el.id;
		el.type = "checkbox";
		el.className = "hidden";
		el.style.marginRight = "2px";
		el.checked = true;
		var id = el.id;
		lbl.setAttribute("for", id);
		el.onclick = function() { self.hpaSwToggle(dn); submitform(); };
		box.appendChild(el);
		return box;
	}
	this.hpaSwToggle = function(dn) {
		try {
			var id = dn? 1 : 0;
			var box = document.getElementById("hpaSwBox"+id);
			var lbl = document.getElementById("hpaSwLbl"+id);
			var el =  document.getElementById("hpaSwInp"+id);
			if (el.checked) {
				lbl.innerHTML = "ON";
				box.style.backgroundColor = "#C0FFC0";
				lbl.style.color = "#000000";
				box.style.borderStyle = "inset";
			} else {
				lbl.innerHTML = "OFF";
				box.style.backgroundColor = "#df4040";
				lbl.style.color = "#ffffff";
				box.style.borderStyle = "outset";
			}
		} catch (err) { }
	}
	this.hpaIsOn = function(dn) {
		try {
			var el = document.getElementById("hpaSwInp"+(dn? 1 : 0));
			return el.checked;
		} catch (err) {	return false; }
	}
	this.hpaSwSet = function(dn, on) {
		try {
			var id = dn? 1 : 0;
			var box = document.getElementById("hpaSwBox"+id);
			var lbl = document.getElementById("hpaSwLbl"+id);
			var el =  document.getElementById("hpaSwInp"+id);
			el.checked = on ? true : false;
			if (el.checked) {
				lbl.innerHTML = "ON";
				lbl.style.color = "#000000";
				box.style.backgroundColor = "#D0FFD0";
				box.style.borderStyle = "inset";
			} else {
				lbl.innerHTML = "OFF";
				lbl.style.color = "#ffffff";
				box.style.backgroundColor = "#df4040";
				box.style.borderStyle = "outset";
			}
		} catch(err) { }
	}
	this.hpaSwDisableStateSet = function(dn, disable) {
		try {
			var hpaEn = document.getElementById("hpaSwInp"+(dn? 1 : 0));
			hpaEn.disabled = disable? true : false;
		} catch (err) { }
	}
	this.createPaPwrOut = function(dn) {
		var s = {};
		s.max = factory.data.band[dn].powerLim + 5;
		s.min = hpa_settings[dn].max - 45;
		s.high_warn = factory.data.band[dn].powerLim;
		s.high_alarm = factory.data.band[dn].powerLim + factory.MAX_PWR_DELTA;
		var row = createMetRow("rfOutPow"+dn, s, "PA&nbsp;Power", "dBm");
		return row;
	}
	this.rfOutPowSet = function(dn, val) {
		setMetValue("rfOutPow"+dn, val);
	}
	this.createTempBoard = function() {
		var s = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 80, high_alarm: 85, max: 90 };
		var row = createMetRow("boardTemp", s, Texts['TEMPERATURE'], "&ordm;C");
		return row;
	}
	this.boardTempSet = function(val) {
		setMetValue("boardTemp", val);
	}
	this.createInputOverflow = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['OVF'];
		cell.className = "thdrlt";
		cell = createLedBox("rfOvfLed"+dn);
		row.appendChild(cell);
		return row;
	}
	this.ovfLedSet = function(dn, color) {
		ledSetColor("rfOvfLed"+dn, color);
	}
	this.createStabRow = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['STAB'];
		cell.className = "thdrlt";
		cell = createLedBox("loopErr"+dn);
		row.appendChild(cell);
		return row;
	}
	this.loopErrSet = function(dn, color) {
		ledSetColor("loopErr"+dn, color);
	}
	this.createFpgaError = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		cell.innerHTML = Texts['FPGA'];
		cell.className = "thdrlt";
		row.appendChild(cell);
		cell = createLedBox("fpgaErr");
		row.appendChild(cell);
		return row;
	}
	this.fpgaErrSet = function(color) {
		ledSetColor("fpgaErr", color);
	}
	this.createFipCommError = function(fct) {
		var row = document.createElement("tr");
		row.id = "fipCommErrBox";
		row.style.display = fct.isFipPaMon() ? "table-row": "none";
		var cell = document.createElement("th");
		cell.innerHTML = Texts['COMMERR'];
		cell.className = "thdrlt";
		row.appendChild(cell);
		cell = createLedBox("fipCommErr");
		row.appendChild(cell);
		return row;
	}
	this.fipCommErrSet = function(color) {
		ledSetColor("fipCommErr", color);
	}
	this.fipCommErrShow = function(isShow) {
		try {
			var r = document.getElementById("fipCommErrBox");
			r.style.display = isShow ? "table-row" : "none";
		} catch(e) {}
	}
	this.createFipVswr = function(fct) {
		var row = document.createElement("tr");
		row.id = "fipVswrBox";
		row.style.display = fct.isFipPaMon() ? "table-row": "none";
		var cell = document.createElement("th");
		cell.innerHTML = Texts['VSWR'];
		cell.className = "thdrlt";
		row.appendChild(cell);
		cell = createLedBox("fipVswr");
		row.appendChild(cell);
		return row;
	}
	this.fipVswrSet = function(color) {
		ledSetColor("fipVswr", color);
	}
	this.fipVswrShow = function(isShow) {
		try {
			var r = document.getElementById("fipVswrBox");
			r.style.display = isShow ? "table-row" : "none";
		} catch(e) {}
	}
	this.createFipTxLow = function(fct) {
		var row = document.createElement("tr");
		row.id = "fipTxLowBox";
		row.style.display = fct.isFipPaMon() ? "table-row": "none";
		var cell = document.createElement("th");
		cell.innerHTML = Texts['TXLOW'];
		cell.className = "thdrlt";
		row.appendChild(cell);
		cell = createLedBox("fipTxLow");
		row.appendChild(cell);
		return row;
	}
	this.fipTxLowSet = function(color) {
		ledSetColor("fipTxLow", color);
	}
	this.fipTxLowShow = function(isShow) {
		try {
			var r = document.getElementById("fipTxLowBox");
			r.style.display = isShow ? "table-row" : "none";
		} catch(e) {}
	}
	this.createUnitReset = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.className = "centered";
		row.appendChild(cell);
		var box = document.createElement("div");
		var reset = document.createElement("input");
		reset.id = "reset";
		reset.name = reset.id;
		reset.type = "button";
		reset.value = "RESET";
		reset.className = "resetbutton";
		reset.onclick = function() { submitform(true); } 
		box.appendChild(reset);
		cell.appendChild(box);
		return row;
	}
	this.resetDisableStateSet = function(disable) {
		try {
			var el = document.getElementById("reset");
			el.disabled = disable? true : false;
		} catch (err) {}
	}
	// createChCtlBox
	this.nrShowFilters = function(maxChannels, chMask) {
		var nr = 0;
		for (var i = 0, mask = 1; i < maxChannels; ++i, mask <<= 1) {
			if (mask & chMask) {
				nr++;
			}
		}
		return nr;
	}
	this.createShowFilters = function(maxChannels, chMask) {
		var tbl = document.createElement("table");
		tbl.style.marginLeft = tbl.style.marginRight = "auto";
		var tb = document.createElement("tb");
		tbl.appendChild(tb);
		var r = document.createElement("tr");
		tb.appendChild(r);
		var c = document.createElement("th");
		c.innerHTML = "Show&nbsp;Filter&nbsp;(1-8)&nbsp;";
		r.appendChild(c);
		for (var i = 1; i <= maxChannels; ++i) {
			c = document.createElement("td");
			r.appendChild(c);
			var en = document.createElement("input")
			en.type = "checkbox";
			en.id = "chDisplay"+i;
			en.name = en.id;
			en.nr = i-1;
			var mask = (1 << en.nr);
			en.checked = (chMask & mask) != 0;
			en.onclick = function() {
				var mask = (1 << this.nr);
				if (this.checked) {
					window.top.showChannelsBitmask |= mask;
				} else {
					window.top.showChannelsBitmask &= ~mask;
				}
				self.setFilterRowVisibility(this.nr, window.top.showChannelsBitmask);
				self.setFilterTitlesVisibility(self.maxChannels, window.top.showChannelsBitmask);
			}
			c.appendChild(en);
		}
		var row = document.createElement("tr");
		var cell = document.createElement("td");
		cell.colSpan = this.filtTitles.length;
		row.appendChild(cell);
		var box = document.createElement("div");
		cell.appendChild(box);
		box.appendChild(tbl);
		return row;
	}
	this.createFilterTitles = function(maxChannels, chMask) {
		var r = document.createElement("tr");
		r.id = "filtTitles";
		for (var i = 0; i < this.filtTitles.length; ++i) {
			var c = document.createElement("th");
			c.innerHTML = this.filtTitles[i];
			r.appendChild(c);
		}
		return r;
	}
	this.setFilterTitlesVisibility = function(maxChannels, chMask) {
		try {
			var r = document.getElementById("filtTitles");
			if (this.nrShowFilters(maxChannels, chMask) == 0) {
				r.style.display = "none";
			} else {
				r.style.display = "table-row"
			}
		} catch(e) {}
	}
	this.createFilter = function(c, chMask) {
		var row = document.createElement("tr");
		row.id = "filterRow_"+c;
		row.appendChild(this.createFilterEn(c));
		row.appendChild(this.createFilterFreq(c));
		row.appendChild(this.createChBw(c));
		row.appendChild(this.createFineGainLim(c));
		row.appendChild(this.createChPwrIn(c));
		row.appendChild(this.createChPwrOut(c));
		row.appendChild(this.createChAgc(c));
		row.appendChild(this.createChIsol(c));
		row.appendChild(this.createChSignalIn(c));
		row.appendChild(this.createStabAlarm(c));
		return row;
	}
	this.setFilterRowVisibility = function(c, chMask) {
		try {
			var row = document.getElementById("filterRow_"+c);
			if (!(chMask & (1 << c))) {
				row.style.display = "none";
			} else {
				row.style.display = "table-row";
			}
		} catch(e) {}
	}
	this.createFilterEn = function(c) {
		var cell = document.createElement("td");
		var el = document.createElement("input");
		el.id = "chSwInp"+c;
		el.name = el.id;
		el.type = "checkbox";
		el.className = "centered";
		el.nr = c;
		el.onclick = function(ev) {
			self.setFiltEn(this.nr, this.checked);
		}
		cell.appendChild(el);
		return cell;
	}
	this.chSwSet = function(c, on) {
		try {
			var el =  document.getElementById("chSwInp"+c);
			el.checked = on ? true : false;
		} catch(e) {}
	}
	this.chIsOn = function(c) {
		try {
			var el = document.getElementById("chSwInp"+c);
			if (el) {
				return el.checked;
			} 
			return null;
		} catch (err) {	return false; }
	}
	this.setFiltEn = function(c, en) {
		this.setFreqEn(c, en);
		this.setBwEn(c, en);
		this.fineGainEn(c, en);
	}
	this.createFilterFreq = function(c) {
		var b = 0;
		var fr = document.createElement("input")
		fr.type = "text";
		fr.id = "chFreq_"+c+"_"+b;
		fr.name = fr.id;
		fr.size = "11";
		fr.className = "number";
		fr.channel = c;
		fr.path	= b;
		fr.title = "Min: "+(factory.data.band[b].fStart/1e6) +", Max: "+(factory.data.band[b].fStop/1e6)+" MHz";
		fr.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		fr.onchange = function(ev) {
			ev = ev || window.event;
			var target = ev.target ? ev.target : ev.srcElement;
			var b = 0;
			var c = target.channel;
			var fr = ~~Math.round(parseFloat(this.value) * 1.0e6);	// self.getFreqCh(c);
			if (fr < factory.data.band[b].fStart) {
				fr = factory.data.band[b].fStart;
			} else if (fr > factory.data.band[b].fStop) {
				fr = factory.data.band[b].fStop;
			}
			var cfg = new Config(self.maxChannels);
			var num = cfg.computeChNum(fr, b);
			if (isNaN(num)) {
				num = config.conf.band[b].ch[c].frqNr;
			}
			fr = cfg.computeChFreq(num, b);
			this.value = (fr / 1.0e6).toFixed(6);
		}
		var cell = document.createElement("td");
		cell.appendChild(fr);
		return cell;
	}
	this.setFreqCh = function(c, frq) {
		try {
			var b = 0;
			var val = (frq / 1.0e6).toFixed(6);
			var el = document.getElementById("chFreq_"+c+"_"+b);
			if (el) {
				el.value = val;
			}
		} catch (err) { }
	}
	this.getFreqCh = function(c) {
		try {
			var b = 0;
			var el = document.getElementById("chFreq_"+c+"_"+b);
			return ~~Math.round(parseFloat(el.value) * 1.0e6);
		} catch (err) { return Number.NaN; }
	}
	this.setFreqEn = function(c, en) {
		try {
			var b = 0;
			var el = document.getElementById("chFreq_"+c+"_"+b);
			el.disabled = en ? false : true;
			el.style.backgroundColor = en ? "white" : "#C0C0C0";
		} catch (err) { }
	}
	this.createChBw = function(c) {
		var el = document.createElement("select");
		var b = 0;
		el.id = "chBw_"+c+"_"+b;
		el.name = el.id;
		el.className = "centered";
		el.style.fontSize = "10px";
		var sys = config.conf.modsys[c];
		this.chBwAddOptions(el, sys, b);
		var cell = document.createElement("td");
		cell.appendChild(el);
		return cell;
	}
	this.chBwAddOptions = function(el, sys, dn) {
		var parseValid = modsys.parse(sys);
		var bwmask = modsys.data.bwmask;
		for (var i = 0; i < ch_Bw_Txt.length; i++) {
			if (parseValid
			    && !modsys.data.disabled
			    && !((1<<i) & bwmask) 
			    && !((i == 0 || i == 1) && !dn)) {
				continue;
			}
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = ch_Bw_Txt[i];
			opt.value = i;
		}
	}
	this.chBwRemoveOptions = function(el) {
		for (var i = el.options.length - 1; i >= 0; --i)
			el.remove(i);
	}
	this.chBwSet = function(c, bw) {
		if (bw >= ch_Bw_Txt.length)
			return;
		var b = 0;
		var el = document.getElementById("chBw_"+c+"_"+b);
		try {
			var b = 0;
			for (var i = 0; i < el.length; i++) {
				if (bw == el.options.item(i).value) {
					el.selectedIndex = i;
					break;
				}
			}
			if (i == el.length) {
				el.selectedIndex = 0;
			}
		} catch (err) {}
	}
	this.chBwGet = function(c) {
		var b = 0;
		var el = document.getElementById("chBw_"+c+"_"+b);
		try {
			var i = el.selectedIndex;
			return el.options.item(i).value;
		} catch (err) {
			return 0;
		}
	}
	this.setBwEn = function(c, en) {
		try {
			var b = 0;
			var el = document.getElementById("chBw_"+c+"_"+b);
			el.disabled = en ? false : true;
			el.style.backgroundColor = en ? "white" : "#C0C0C0";
		} catch (err) { }
	}
	this.createFineGainLim = function(c) {
		var el = document.createElement("input");
		var b = 0;
		el.id = "fineGainLimit"+c+b;
		el.name = el.id;
		el.type = "text";
		el.size = "4";
		el.className = "number";
		el.path = b;
		el.chNr = c;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.title = "Min: "+config.conf.fineGainRange+", Max: 0 dB";
		el.onchange = function(ev) {
			ev = ev || window.event;
			var target = ev.target ? ev.target : ev.srcElement;
			var b = target.path;
			var c = target.chNr;
			var num = self.fineGainLimGet(c);
			var cfg = new Config(self.maxChannels);
			if (num < cfg.conf.fineGainRange) {
				target.value = cfg.conf.fineGainRange;
			} else if (num > 0) {
				target.value = 0;
			} else {
				target.value = num;
			}
		}
		var cell = document.createElement("td");
		cell.appendChild(el);
		return cell;
	}
	this.fineGainLimSet = function(c, val) {
		try {
			var b = 0;
			var el = document.getElementById("fineGainLimit"+c+b);
			if (el && !isNaN(val))
				el.value = val.toString();
		} catch (err) { }
	}
	this.fineGainLimGet = function(c) {
		try {
			var b = 0;
			var el = document.getElementById("fineGainLimit"+c+b);
			if (el)
				return parseInt(el.value);
			return 0;
		} catch (err) { return 0; }
	}
	this.fineGainEn = function(c, en) {
		try {
			var b = 0;
			var el = document.getElementById("fineGainLimit"+c+b);
			el.disabled = en ? false : true;
			el.style.backgroundColor = en ? "white" : "#C0C0C0";
		} catch (err) { }
	}
	this.createChPwrIn = function(c) {
		var b = 0;
		var el = createMetRow("rfInPow"+c+b, chRfIn_settings[b]);
		var cell = document.createElement("td");
		cell.appendChild(el);
		return cell;
	}
	this.rfChInPowSet = function(c, val, color) {
		var b = 0
		setMetValue("rfInPow"+c+b, val, color);
	}
	this.createChPwrOut = function(c) {
		var b = 0;
		var el = createMetRow("rfOutPow"+c+b, chRfOut_settings[b]);
		var cell = document.createElement("td");
		cell.appendChild(el);
		return cell;
	}
	this.rfChOutPowSet = function(c, val, stby, isOn) {
		var b = 0;
		if (stby) {
			setMetValue("rfOutPow"+c+b, "---");
		} else if (isOn) {
			setMetValue("rfOutPow"+c+b, val, "normal");
		} else {
			setMetValue("rfOutPow"+c+b, "OFF", "warning");
		}
	}
	this.createChAgc = function(c) {
		var b = 0;
		var el = createMetRow("agc"+c+b, agc_settings[b]);
		var cell = document.createElement("td");
		cell.appendChild(el);
		return cell;
	}
	this.agcSet = function(c, val) {
		var b = 0;
		setMetValue("agc"+c+b, val);
	}
	this.createChIsol = function(c) {
		var b = 0;
		var el = createMetRow("rfChIsolM"+c+b, chIsolM_settings);
		var cell = document.createElement("td");
		cell.appendChild(el);
		return cell;
	}
	this.rfChIsolModSet = function(c, val) {
		var b = 0;
		if (val < chIsolM_settings.low_warn || val > chIsolM_settings.high_warn) {
			setMetValue("rfChIsolM"+c+b, val, "warning");
		} else {
			setMetValue("rfChIsolM"+c+b, val);
		}
	}
	this.createChSignalIn = function(c) {
		var b = 0;
		var cell = createLedBox("rfSignalIn"+c+b);
		return cell;
	}
	this.rfSignalLedSet = function(c, color)  {
		var b = 0;
		ledSetColor("rfSignalIn"+c+b, color);
	}
	this.createStabAlarm = function(c) {
		var b = 0;
		var cell = createLedBox("rfChStabAlarm"+c+b);
		return cell;
	}
	this.stabLedSet = function(c, color)  {
		var b = 0;
		ledSetColor("rfChStabAlarm"+c+b, color);
	}
	// show
	this.showConf = function(cfg) {
		try {
			var b = 0;
			this.mainGainLimSet(b, cfg.conf.band[b].mainGain);
			this.mainPowerLimSet(b, cfg.conf.band[b].mainPower);
			this.squelchEnSet(b, cfg.conf.band[b].squelchEnable, 
				cfg.conf.control.tracking);
			this.squelchThrSet(b, cfg.conf.band[b].squelchThr);
			this.setTrackingEnable(cfg.conf.control.tracking);
			this.hpaSwSet(b, cfg.conf.band[b].hpaEnable);
			for (c = 0; c < this.maxChannels; ++c) {
				this.chSwSet(c, cfg.conf.band[b].ch[c].enable);
				var fr = cfg.conf.band[b].ch[c].frqNr * factory.data.fstep + factory.data.band[b].fo;
				this.setFreqCh(c, fr);
				this.chBwSet(c, cfg.conf.band[b].ch[c].bandwidth);
				this.fineGainLimSet(c, cfg.conf.band[b].ch[c].fineGain);
				this.setFiltEn(c, cfg.conf.band[b].ch[c].enable);
			}
		} catch(e) {}
	}
	this.showStatus = function(mtr, cfg) {
		try {
			var b = 0;
			var pwr = mtr.stat.band[b].hpa.power;
			this.rfOutPowSet(b, pwr < -127 ? "---" : pwr);
			this.boardTempSet(mtr.stat.band[1].hpa.temperature);
			this.ovfLedSet(b, mtr.stat.band[b].signal.overflow ? "red" : "grey");
			this.loopErrSet(b, mtr.getLoopErr(b) ? "red" : "grey");
			this.fpgaErrSet(mtr.stat.fpgaErr ? "red" : "grey");
			this.fipCommErrSet(mtr.stat.band[b].hpa.commerr ? "red" : "grey");
			this.fipVswrSet(mtr.stat.band[b].hpa.vswr ? "red" : "grey");
			this.fipTxLowSet(mtr.stat.band[b].hpa.udf ? "red" : "grey");
			for (var c = 0; c < this.maxChannels; ++c) {
				var stby = !cfg.conf.band[b].ch[c].enable;
				if (stby) {
					this.rfChInPowSet(c, "---");
				} else if (mtr.stat.band[b].signal.overflow) {
					this.rfChInPowSet(c, mtr.stat.band[b].ch[c].level, "alarm");
				} else {
					this.rfChInPowSet(c, mtr.stat.band[b].ch[c].level);
				}
				this.rfChOutPowSet(c, mtr.computeChOutPower(b, c), stby, mtr.computeChOutOn(b, c));
				var agc = cfg.conf.band[b].mainGain + cfg.conf.band[b].ch[c].fineGain - mtr.stat.band[b].ch[c].gain;
				this.agcSet(c, stby ? "---" : agc);
				if (!cfg.conf.control.tracking || stby) {
					this.rfChIsolModSet(c, "---");
				} else {
					this.rfChIsolModSet(c, mtr.stat.band[b].ch[c].isolMod);
				}
				this.rfSignalLedSet(c, mtr.stat.band[b].ch[c].signalIn && !stby ? "green" : "grey");
				this.stabLedSet(c, mtr.stat.band[b].ch[c].stability && !stby ? "red" : "grey");
			}
		} catch(e) {}
	}
	// format
	this.formatConf = function(currentConfigFrm) {
		var cfg = new Config(this.maxChannels);
		var frame = "00";
		var num;
		var mode = false; 	// isMuteModeLinked();
		if (mode == null) {
			mode = false;
		}
		var track = this.isTrackingEnable();
		if (track == null) {
			track = false;
		}
		num = mode? cfg.ctrlGrlBits['MUTEMODE'] : 0;
		num |= 0;	// isFreqSplitFixed() ? 0 : cfg.ctrlGrlBits['SPLIT'];
		num |= track ? cfg.ctrlGrlBits['TRACKING'] : 0;
		frame += hexformat(num, 2);
		for (var b = 0; b < 2; ++b) {
			frame += this.formatBandCtrl(b);
			frame += this.formatSqThr(b);
			frame += this.formatMainGain(b);
			frame += this.formatMainPower(b);
			for (var c = 0; c < this.maxChannels; ++c) {
				var fr = this.formatFreq(b, c);
				frame += fr ? fr : currentConfigFrm.substr(frame.length, 4);
				frame += this.formatChCtrl(b, c);
				frame += this.formatFineGain(b, c);
				frame += this.formatFinePower(b, c);
			}
		}
		return frame;
	}
	this.formatBandCtrl = function(b) {
		var cfg = new Config(this.maxChannels);
		var num = this.squelchEnIsSet(b) ? cfg.bandCtrlBits['SQEN'] : 0;
		num |= this.hpaIsOn(b) ? cfg.bandCtrlBits['HPAEN'] : 0;
		var frame = hexformat(num, 2);
		return frame;
	}
	this.formatSqThr = function(b) {
		var cfg = new Config(this.maxChannels);
		var num = this.squelchThrGet(b);
		if (num > cfg.conf.band[b].squelchThrMax) {
			num = cfg.conf.band[b].squelchThrMax;
		} else if (num < cfg.conf.band[b].squelchThrMin) {
			num = cfg.conf.band[b].squelchThrMin;
		}
		num = rSignedByte(num);
		frame = hexformat(num, 2);
		return frame;
	}
	this.formatMainGain = function(b) {
		var cfg = new Config(this.maxChannels);
		var num = this.mainGainLimGet(b);
		if (num > factory.data.band[b].gainLim) {
			num = factory.data.band[b].gainLim;
		} else if (num < cfg.conf.band[b].mainGainMin) {
			num = cfg.conf.band[b].mainGainMin;
		}
		num = rSignedByte(num);
		var frame = hexformat(num, 2);
		return frame;
	}
	this.formatMainPower = function(b) {
		var cfg = new Config(this.maxChannels);
		var num = this.mainPowerLimGet(b);
		if (num > factory.data.band[b].powerLim) {
			num = factory.data.band[b].powerLim;
		} else if (num < factory.data.band[b].powerLim - cfg.conf.band[b].mainPowerRange) {
			num = factory.data.band[b].powerLim - cfg.conf.band[b].mainPowerRange;
		}
		num = rSignedByte(num);
		frame = hexformat(num, 2);
		return frame;
	}
	this.formatFreq = function(b, c) {
		var u = 0
		var fr = this.getFreqCh(c);
		if (fr < factory.data.band[u].fStart) {
			fr = factory.data.band[u].fStart;
		} else if (fr > factory.data.band[u].fStop) {
			fr = factory.data.band[u].fStop;
		}
		var cfg = new Config(this.maxChannels);
		var chnr = cfg.computeChNum(fr, u);
		if (isNaN(chnr)) {
			return null;
		}
		var num;
		if (b == 0) {
			num = chnr;
		} else {
			num = cfg.computeChNrOtherBand(chnr, u);
		}
		if (num < 0) {
			num += 65536;
		}
		var frame = hexformat(num, 4);
		return frame;		
	}
	this.formatChCtrl = function(b, c) {
		var en = this.chIsOn(c);
		var bw = this.chBwGet(c);
		var modsys = 0;		//getModsys(k);
		if (en == null) {
			en = false;
		}
		if (bw == null)  {
			bw = 0;
		}
		if (modsys == null) {
			modsys = 0;
		}
		var num = en ? 0 : 0x40;
		num |= (bw & 0x07);
		if (b == 0) {
			num |= (modsys & 0x08);
		} else {
			num |= ((modsys & 0x07) << 3);
		}
		var frame = hexformat(num, 2);
		return frame;
	}
	this.formatFineGain = function(b, c) {
		var num = this.fineGainLimGet(c);
		var cfg = new Config(this.maxChannels);
		if (num == null) {
			num = 0;
		}
		if (num > 0) {
			num = 0;
		} else if (num < cfg.conf.fineGainRange) {
			num = cfg.conf.fineGainRange;
		}
		num = rSignedByte(num);
		var frame = hexformat(num, 2);
		return frame;
	}
	this.formatFinePower = function(b, c) {
		var num = 0;
		num = rSignedByte(num);
		var frame = hexformat(num, 2);
		return frame;
	}
}

function createMetRow(id, s, title, units) {
	var trNode = document.createElement("tr");
	var tdNode;
	if (typeof(title) != 'undefined' && title) {
		tdNode = document.createElement("th");
		trNode.appendChild(tdNode);
		tdNode.innerHTML = title;
		tdNode.className = "thdrht";
	}
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "met_"+id;
	var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	met.attachTo(tdNode);
	met.valueSet(s.min);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "txt_"+id;
	tdNode.style.width = "40px";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	tdNode.innerHTML = "0";
	if (typeof(units) != 'undefined' && units) {
		tdNode = document.createElement("td");
		tdNode.innerHTML = units;
		tdNode.style.textAlign = "center";
		trNode.appendChild(tdNode);
	}
	return trNode;
}

function setMetValue(id, val, color) {
	try {
		var met = document.getElementById("met_"+id).mMeter;
		if (met) {
			if (typeof(color) !== "undefined") {
				if (color.toLowerCase() == "normal")
					color = met.colorNormal;
				else if (color.toLowerCase() == "warning")
					color = met.colorWarn;
				else if (color.toLowerCase() == "alarm")
					color = met.colorAlarm;
			}
			met.valueSet(val, color);
		}
		var txt = document.getElementById("txt_"+id);
		if (txt && txt.innerHTML) {
			if (isNaN(val))
				txt.innerHTML = val;
			else
				txt.innerHTML = val.toFixed(1);
		}
	} catch (err) { }
}

function createLedBox(id) {
	var tdNode = document.createElement("td");
	var led = document.createElement("img");
	led.id = id;
	led.src = "/bullet_grey.png";
	led.className = "centered";
	led.align = "center";
	tdNode.appendChild(led);
	return tdNode;
}

function ledSetColor(id, color) {
	try {
		var led = document.getElementById(id);
		if (color == "red") {
			led.src = "/bullet_red.png";
		} else if (color == "green") {
			led.src = "/bullet_green.png";
		} else if (color == "yellow") {
			led.src = "/bullet_yellow.png";
		} else if (color == "grey") {
			led.src = "/bullet_grey.png";
		} else {
			led.src = "/bullet_grey.png";
		}
	} catch (err) {}
}

function mMeter(min, max, loA, hiA, loW, hiW) {
	this.mMax = max;
	this.mMin = min;
	this.mVal = max;
	this.mLowAlarm = loA;
	this.mHighAlarm = hiA;
	this.mLowWarning = loW;
	this.mHighWarning = hiW;
	this.colorNormal = "rgb(43,194,83)";
	this.colorWarn = "#f1a165";
	this.colorAlarm = "#df4040";
	this.mDiv = document.createElement("div");
	this.mSpan = document.createElement("span");
	this.mDiv.appendChild(this.mSpan);
	this.mDiv.className = "meter";
	this.mDiv.style.width = "50px";
	this.getDiv = function ()  {
		return this.mDiv;
	}
	this.attachTo = function(parent) {
		try {
			parent.mMeter = this;
			parent.appendChild(this.mDiv);
		} catch (err) {}
	}
	this.valueSet = function(val, color) {
		try {
			var percent;
			if (typeof(val) === "undefined" || val == null || isNaN(val) || isNaN(parseInt(val)) || val <= this.mMin)
				percent = 0;
			else if (val >= this.mMax)
				percent = 100;
			else
				percent = 100*(val - this.mMin)/(this.mMax - this.mMin);
			this.mSpan.style.width = ""+percent.toFixed(0)+"%";
			var bColor;
			if (typeof(color) === 'undefined') {
				if (typeof(val) === "undefined" || val == null || isNaN(val) || isNaN(parseInt(val)))
					bColor = this.colorNormal;
				else if (val < this.mLowAlarm)
					bColor = this.colorAlarm;
				else if (val < this.mLowWarning)
					bColor = this.colorWarn;
				else if (val > this.mHighAlarm)
					bColor = this.colorAlarm;
				else if (val > this.mHighWarning)
					bColor = this.colorWarn;
				else
					bColor = this.colorNormal;
			} else
				bColor = color;
			this.mSpan.style.backgroundColor = bColor;
		} catch (err) {}
	}
}
// -->