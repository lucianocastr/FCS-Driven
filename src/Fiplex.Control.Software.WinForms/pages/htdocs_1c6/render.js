<!--
var ch_Bw_Txt = ["180", "90", "45", "30", "20", "15"];
var chBwNrNew = 1;

var hpa_settings = [{min: -20, low_alarm: -128, low_warn: -128, high_warn: 19, high_alarm: 22, max: 25 },
		    {min:   0, low_alarm: -128, low_warn:  -128, high_warn: 37, high_alarm: 40, max: 45 }];
var board_temp_settings = {min: -40, low_alarm: -40, low_warn: -40, high_warn: 80, high_alarm: 85, max: 90 };
var chRfIn_settings = [{min: -110, low_alarm: -121, low_warn: -121, high_warn: 0, high_alarm: 0, max: 0 }, 
		       {min:  -80, low_alarm: -121, low_warn: -121, high_warn: -20, high_alarm: -20, max: -20 }];
var chRfOut_settings = [{min: -35, low_alarm: 20, low_warn: 20, high_warn: 36, high_alarm: 40, max: 25 },
			{min: -20, low_alarm: 20, low_warn: 20, high_warn: 36, high_alarm: 40, max: 40 }];
var agc_settings = [{min: 0, low_alarm: 0, low_warn: 0, high_warn: 300, high_alarm: 300, max: 80 },
		    {min: 0, low_alarm: 0, low_warn: 0, high_warn: 300, high_alarm: 300, max: 80 }];

function Page() {
	this.show = function(cnf, tags, fact, version) {
		self.config = cnf;
		self.tags = tags;
		self.factory = fact;
		self.version = version;
		self.draw(false);
	}
	this.redraw = function() {
		self.draw(true);
	}
	this.drawMsg = function(msg) {
		var rootEl = document.getElementById(self.id);
		if (!rootEl) {
			rootEl = document.createElement("div");
			rootEl.id = self.id;
		}
		rootEl.innerHTML = msg;
		rootEl.style.fontWeight = "bold";
		rootEl.style.fontSize = "20px";
		document.getElementById(self.parentId).appendChild(rootEl);
	}
	this.draw = function(isKeepChMask) {
		var redraw = self.computeShowChannelsBitmask(isKeepChMask);
		if (typeof(self.bwType) == 'undefined' || typeof(self.revision) == 'undefined'
		    || self.bwType != self.config.bwType
		    || self.revision != self.config.conf.control.revision) {
			redraw = true;
		}
		self.bwType = self.config.bwType;
		self.revision = self.config.conf.control.revision;
		var rootEl = document.getElementById(self.id);
		if (!rootEl) {
			rootEl = document.createElement("div");
			rootEl.id = self.id;
			redraw = true;
		} else if (redraw) {
			remove_element(rootEl);
			rootEl = document.createElement("div");
			rootEl.id = self.id;
		}
		if (redraw) {
			document.getElementById(self.parentId).appendChild(rootEl);
			var unit = self.createUnit(0, self.config.maxChannels, self.showChannelsBitmask);
			rootEl.appendChild(unit);
			for (var i = 1, mask = 1; i <= this.config.maxChannels; ++i) {
				if (self.showChannelsBitmask & mask) {
					var unit = self.createUnit(i);
					rootEl.appendChild(unit);
				}
				mask <<= 1;
			}
		}
		self.config.render();
		self.setChannelsDisplay();
		self.tags.render();
		initFormChangeCheck();
	}
	this.close = function() {
		var rootEl = document.getElementById(self.id);
		if (rootEl) {
			remove_element(rootEl);
		}
		self.showChannelsBitmask = 0;
	}
	this.computeShowChannelsBitmask = function(isKeepChMask) {
		var redraw = false;
		if (isKeepChMask) {
			var displayedMask = self.getChannelsDisplay();
			if (self.showChannelsBitmask != displayedMask) {
				self.showChannelsBitmask = displayedMask;
				redraw = true;
			}
			return redraw;
		}
		var channelsEnabledMask = self.config.getChannelsEnabledMask();
		if (!self.showChannelsBitmask 
		    || self.showChannelsBitmask != channelsEnabledMask
		    || self.bwType != self.config.bwType) {
		    	redraw = true;
		}
		self.showChannelsBitmask = channelsEnabledMask;
		return redraw;
	}
	this.getChannelsDisplay = function() {
		var currentMask = 0;
		try {
			for (var i = 1, mask = 1; i <= this.config.maxChannels; ++i) {
				var show = document.getElementById("chDisplay"+i).checked;
				if (show) {
					currentMask |= mask;
				}
				mask <<= 1;
			}
		} catch (err) {}
		return currentMask;
	}
	this.setChannelsDisplay = function() {
		try {
			var currentMask = 0;
			for (var i = 0, mask = 1; i < self.config.maxChannels; ++i) {
				var c = i + 1;
				var el = document.getElementById("chDisplay"+c);
				var mask = (1 << i);
				var on = (self.showChannelsBitmask & mask) != 0;
				el.checked = on;
				if (on) {
					currentMask |= mask;
				}
				mask <<= 1;
			}
		} catch (err) {}
	}
	this.createUnit = function(nr, maxChNr, showChMask) {
		var unitDiv = document.createElement("div");
		unitDiv.id = "unitDiv"+nr;
		unitDiv.className = "unitbox";
		var headDiv = this.createUnitHead(nr);
		unitDiv.appendChild(headDiv);
		var contentDiv = document.createElement("div");
		unitDiv.appendChild(contentDiv);
		contentDiv.className = "contentbox";
		contentDiv.id = "contentDiv"+nr;
		var tab = (nr == 0 ? this.renderContentCtrl(maxChNr, showChMask) : this.renderContentChannel(nr));
		contentDiv.appendChild(tab);
		return unitDiv;
	}
	this.createUnitHead = function(nr) {
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
		if (nr > 0)
			cell.innerHTML = Texts['FILTER']+"&nbsp;"+nr;
		cell = document.createElement("td");
		row.appendChild(cell);
		if (nr == 0) {
			cell.id = "tagName";
			cell.innerHTML = "Tag";
		} else {
			var el = this.createChannelEnable(nr);
			cell.appendChild(el);
		}
		cell.className = "tag";
		cell.style.width = "100%";
		cell.style.textAlign = "center";
		cell = document.createElement("td");
		row.appendChild(cell);
		var hideButton = document.createElement("input");
		hideButton.type = "button";
		cell.appendChild(hideButton);
		hideButton.channelNr = nr;
		hideButton.hiddenState = false;
		hideButton.className = "buttonexpand";
		hideButton.onclick = function hideContent(ev) {
			var el = this;
			var nr = el.channelNr;
			el.hiddenState = !el.hiddenState || false;
			el.style.backgroundImage = el.hiddenState? "url('maximize.png')" : "url('minimize.png')";
			var contentDiv = document.getElementById("contentDiv"+nr);
			contentDiv.style.display = el.hiddenState? "none" : "block";
		}
		return box;
	}
	this.renderContentCtrl = function(maxChannels, chMask) {
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var row = document.createElement("tr");
		tab.appendChild(row);
		var cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "contentcell";
		cell.rowSpan = 2;
		var el = this.createChFreqCtlBox(maxChannels, chMask);
		cell.appendChild(el);
		for (var i = 0; i < 2; ++i) {
			cell = document.createElement("td");
			row.appendChild(cell);
			cell.className = "contentcell";
			el = this.createBandBox(i);
			cell.appendChild(el);
		}
		row = document.createElement("tr");
		tab.appendChild(row);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.colSpan = 2;
		cell.className = "contentcell";
		el = this.createGralCtlBox();
		cell.appendChild(el);
		return tab;
	}
	this.renderContentChannel = function(nr) {
		var tab = document.createElement("table");
		tab.className = "contenttable";
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		for (var i = 0; i < 2; ++i) {
			var cell = document.createElement("td");
			row.appendChild(cell);
			cell.className = "contentcell";
			var chPathTable = document.createElement("table");
			cell.appendChild(chPathTable);
			var r = document.createElement("tr");
			chPathTable.appendChild(r);
			r.colSpan = 2;
			var c = document.createElement("th");
			r.appendChild(c);
			c.innerHTML = (i == 0 ? Texts['UPLINK'] : Texts['DNLINK']);
			c.className = 'nh';
			c.style.color = '#fb7922';
			c.colSpan = 2;
			r = document.createElement("tr");
			chPathTable.appendChild(r);
			c = document.createElement("td");
			r.appendChild(c);
			var el = this.createChCtrl(nr, i);
			c.appendChild(el);
			c = document.createElement("td");
			r.appendChild(c);
			el = this.createChStat(nr, i);
			c.appendChild(el);
		}
		return tab;
	}
	this.createChannelEnable = function(nr) {
		var box = document.createElement("div");
		box.id = "chSwBox"+nr;
		box.style.border = "medium solid #00AAAA";
		box.style.width = "50%";
		box.style.height = "10px";
		box.style.verticalAlign = "middle";
		box.style.textAlign = "center";
		box.style.padding = "2px";
		box.style.backgroundColor = "#D0FFD0";
		box.style.borderStyle = "inset";
		box.style.borderRadius = "3px";
		box.style.marginLeft = "auto";
		box.style.marginRight = "auto";
		box.onmouseover = function(ev) {
			try {
				this.style.borderColor = "#3030A0";
			} catch (err) {}
		}
		box.onmouseout = function(ev) {
			try {
				this.style.borderColor = "#30AAAA";
			} catch (err) {}
		}
		var lbl = document.createElement("label");
		box.appendChild(lbl);
		lbl.id = "chSwLbl"+nr;
		lbl.className = "togglebuttonlabel";
		lbl.setAttribute("unselectable", "on");
		lbl.style.whiteSpace = "nowrap";
		lbl.style.fontWeight = "bold";
		lbl.style.display = "inline-block";
		lbl.style.width = "100%";
		lbl.style.height = "100%";
		lbl.innerHTML = "ON";
		var el = document.createElement("input");
		el.id = "chSwInp"+nr;
		el.name = el.id;
		el.type = "checkbox";
		el.className = "hidden";
		el.nr = nr;
		box.appendChild(el);
		el.style.marginRight = "2px";
		el.checked = true;
		var id = el.id;
		lbl.setAttribute("for", id);
		el.onclick = function(ev) {
			self.chSwToggle(this.nr);
			submitform();
		}
		return box;
	}
	this.chSwToggle = function(nr) {
		try {
			var box = document.getElementById("chSwBox"+nr);
			var lbl = document.getElementById("chSwLbl"+nr);
			var el =  document.getElementById("chSwInp"+nr);
			if (!box || !lbl || !el)
				return;
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
	this.createChFreqCtlBox = function(maxChannels, chMask) {
		var box = document.createElement("div");
		if (this.config.bwType == 1 && self.factory.data.bwAdjFiltNr < 4) {
			var t = document.createElement("div");
			t.className = "fhd";
			box.appendChild(t);
			t.innerHTML = TextEn['FILTER'];
			if (self.factory.data.bwAdjFiltNr > 1) {
				t.innerHTML += "S";
			}
		}
		var tab = document.createElement("table");
		box.appendChild(tab);
		var row = document.createElement("tr");
		tab.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = "Filter";
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['DISPLAY'];
		cell = document.createElement("td");
		row.appendChild(cell);
		for (var i = 0; i < 2; ++i) {
			cell = document.createElement("th");
			cell.id = "freqTitle_"+i;
			row.appendChild(cell);
			cell.innerHTML = this.chFreqTitle(i, this.freqStyle, this.config.bwType);
		}
		for (var i = 1; i <= maxChannels; ++i) {
			if (this.config.bwType == 0) {
				row = this.createChFreq(i, chMask);
				tab.appendChild(row);
			} else {
				if (i > this.factory.data.bwAdjFiltNr) {
					continue;
				}
				if (i > 0) {
					tab.appendChild(document.createElement("tr"));
				}
				var tb = document.createElement("tbody");
				tb.style.outline = "thin solid #db5902";
				for (var j = 0; j < 2; ++j) {
					row = this.createBvFreq(i, j, chMask);
					tb.appendChild(row);
				}
				tab.appendChild(tb);
			}
		}
		if (this.config.bwType == 1) {
			row = this.createFreqStyleSw();
			tab.appendChild(row);
		}
		return box;
	}
	this.chFreqTitle = function(n, style, bwType) {
		var lbl;
		if (bwType == 0) {
			lbl = n == 0 ? "UL&nbsp;(MHz)" : "DL&nbsp;(MHz)";
			return lbl;
		}
		if (style == 0) {
			lbl = n == 0 ? "START&nbsp;(MHz)" : "STOP&nbsp;(MHz)";
		} else {
			lbl = n == 0 ? "FREQ.&nbsp;(MHz)" : "BW.&nbsp;(MHz)"
		}
		return lbl;
	}
	this.setFreqTitle = function() {
		for (var i = 0; i < 2; ++i) {
			var lbl = self.chFreqTitle(i, self.freqStyle, self.config.bwType);
			var el = document.getElementById("freqTitle_"+i);
			el.innerHTML = lbl;
		}
		if (self.config.bwType == 0) {
			return;
		}
		for (var c = 0; c < self.config.maxChannels; ++c) {
			var nr = c + 1;
			for (var b = 0; b < 2; ++b) {
				for (var i = 0; i < 2; ++i) {
					el = document.getElementById("chFreq_"+nr+"_"+b+"_"+i);
					if (!el) {
						continue;
					}
					if (i == 0 || self.freqStyle == 0) {
						var min = self.factory.data.band[b].fStart / 1e6;
						var max = self.factory.data.band[b].fStop / 1e6;
						el.title = "Min: "+min.toFixed(6)
							+", Max: "+max.toFixed(6)+" MHz";
					} else {
						var min = self.config.bwVarStepHz / 1e6;
						var max = Math.round(self.maxBw(b) / self.config.bwVarStepHz) 
							* self.config.bwVarStepHz / 1e6;
						el.title = "Min: "+min.toFixed(3)
							+", Max: "+max.toFixed(3)+" MHz";
					}
				}
			}
		}
	}
	this.createChFreq = function(nr, chMask) {
		var row = document.createElement("tr");
		this.createFiltCtl(row, nr, chMask, 1);
		var mask = (1 << (nr-1));
		var cell = document.createElement("td");
		row.appendChild(cell);
		for (i = 0; i < 2; ++i) {
			cell = document.createElement("td");
			row.appendChild(cell);
			var fr = document.createElement("input")
			fr.type = "text";
			fr.id = "chFreq_"+nr+"_"+i;
			fr.name = fr.id;
			fr.style.width = "75px";
			fr.className = "number";
			fr.channel = nr;
			fr.path	= i;
			fr.title = "Min: "+(this.factory.data.band[i].fStart/1e6) +", Max: "+(this.factory.data.band[i].fStop/1e6)+" MHz";
			var on = (chMask & mask) != 0;
			fr.disabled = !on;
			fr.style.backgroundColor =  on ? "white" : "#CCCCCC";
			fr.onkeypress = function(ev) {
				return isKeyDecimalNumber(ev);
			}
			fr.onchange = function(ev) {
				var target = this;
				var b = target.path;
				var c = target.channel - 1;
				var fr = getFreqCh(c + 1, b);
				if (fr < self.factory.data.band[b].fStart) {
					fr = self.factory.data.band[b].fStart;
				} else if (fr > self.factory.data.band[b].fStop) {
					fr = self.factory.data.band[b].fStop;
				}
				var num = self.config.computeChNum(fr, b);
				if (isNaN(num))
					num = self.config.conf.band[b].ch[c].frqNr;
				fr = self.config.computeChFreq(num, b);
				setFreqCh(target.channel, target.path, fr);
				if (isFreqSplitFixed()) {
					num = self.config.computeChNrOtherBand(num, b);
					b = (b + 1) % 2;
					fr = self.config.computeChFreq(num, b);
					setFreqCh(target.channel, b, fr);
				}
			}
			cell.appendChild(fr);
		}
		return row;
	}
	this.createBvFreq = function(nr, b, chMask) {
		var row = document.createElement("tr");
		var cell;
		var mask = (1 << (nr-1));
		if (b == 0) {
			self.createFiltCtl(row, nr, chMask, 2);
		}
		cell = document.createElement("th");
		cell.innerHTML = b == 0 ? "UL" : "DL";
		row.appendChild(cell);
		for (i = 0; i < 2; ++i) {
			cell = document.createElement("td");
			row.appendChild(cell);
			var fr = document.createElement("input")
			fr.type = "text";
			fr.id = "chFreq_"+nr+"_"+b+"_"+i;
			fr.name = fr.id;
			fr.className = "number";
			fr.channel = nr;
			fr.path	= b;
			fr.st = i;
			if (i == 0 || this.freqStyle == 0) {
				fr.title = "Min: "+(self.factory.data.band[b].fStart/1e6).toFixed(6)
					+", Max: "+(self.factory.data.band[b].fStop/1e6).toFixed(6)+" MHz";
				fr.style.width = "70px";
			} else {
				var min = self.config.bwVarStepHz / 1e6;
				var max = Math.round(self.maxBw(b) / self.config.bwVarStepHz) 
					* self.config.bwVarStepHz / 1e6;
				fr.title = "Min: "+min.toFixed(3)+", Max: "+max.toFixed(3)+" MHz";
				fr.style.width = "70px";
			}
			var on = (chMask & mask) != 0;
			fr.disabled = !on;
			fr.style.backgroundColor =  on ? "white" : "#CCCCCC";
			fr.onkeypress = function(ev) {
				return isKeyDecimalNumber(ev);
			}
			fr.onchange = function(ev) {
				var target = this;
				var b = target.path;
				var n = target.channel;
				var c = n - 1;
				var k = target.st;
				var f = self.getBandBv(n, b);
				var g;
				if (self.freqStyle == 0) {
					g = self.adjustFreqLimitsSp(b, k, f);
				} else if (k == 0) {
					g = self.adjustFreqLimitsFc(b, f);
				} else {
					g = self.adjustFreqLimitsBw(c, b, f);
				}
				self.setFreqBv(n, b, g);
				if (isFreqSplitFixed()) {
					self.adjustFreqLimitsOb(n, b, g);
				}
			}
			cell.appendChild(fr);
		}
		return row;
	}
	this.updateFreq = function(b, c) {
		try {
			var n = c + 1;
			var el = document.getElementById("chFreq_"+n+"_"+b+"_0");
			el.onchange();
		} catch(err) {}
	}
	this.updateAllFreqs = function() {
		for (var i = 0; i < self.config.maxChannels; ++i) {
			self.updateFreq(1, i);
		}
	}
	this.getBandBv = function(nr, dn) {
		var f = [];
		try {
			for (var i = 0; i < 2; ++i) {
				var el = document.getElementById("chFreq_"+nr+"_"+(dn? 1 : 0)+"_"+i);
				var fr = ~~Math.round(Math.abs(parseFloat(el.value)) * 1.0e6);
				f.push(fr);
			}
			if (self.freqStyle == 1) {
				var fs = f[0] - f[1] / 2;
				var fp = f[0] + f[1] / 2;
				f[0] = ~~Math.round(fs);
				f[1] = ~~Math.round(fp);
			}
		} catch (err) {}
		return f;
	}
	this.setFreqBv = function(nr, dn, f) {
		var c = nr - 1;
		var fc = ~~Math.round((f[0] + f[1]) / 2);
		var bw = ~~Math.round(Math.abs(f[1] - f[0]));
		if (self.freqStyle == 0) {
			for (var k = 0; k < 2; ++k) {
				var val = (f[k] / 1.0e6).toFixed(6);
				var el = document.getElementById("chFreq_"+nr+"_"+(dn? 1: 0)+"_"+k);
				if (el)
					el.value = val;
			}
		} else {
			var val = (fc / 1.0e6).toFixed(6);
			var el = document.getElementById("chFreq_"+nr+"_"+(dn? 1: 0)+"_0");
			if (el)
				el.value = val;
			val = (bw / 1.0e6).toFixed(3);
			el = document.getElementById("chFreq_"+nr+"_"+(dn? 1: 0)+"_1");
			if (el)
				el.value = val;
		}
		var val = (fc / 1.0e6).toFixed(6);
		var disp = document.getElementById("chFreqDisp_"+nr+"_"+(dn? 1: 0));
		if (disp)
			disp.innerHTML = val;
		val = (bw / 1.0e6).toFixed(3);
		disp = document.getElementById("chBwDisp_"+nr+"_"+(dn? 1: 0));
		if (disp)
			disp.innerHTML = val;
	}
	this.saveFreq = function(c, b, f) {
		if (self.fadj.length == 0) {
			self.fadj = [];
			for (var c = 0; c < self.config.maxChannels; ++c) {
				var band = [];
				for (var b = 0; b < 2; ++b) {
					band.push(f);
				}
				self.fadj.push(band);
			}
		} else {
			self.fadj[c][b] = f;
		}
	}
	this.adjustFreqLimitsSp = function(b, k, f) {
		var factS = self.factory.data.band[b].fStart;
		var factP = self.factory.data.band[b].fStop;
		if (f[0] < factS) {
			f[0] = factS;
		} else if (f[0] >= factP) {
			f[0] = factP - self.config.bwVarStepHz;
		}
		if (f[1] > factP) {
			f[1] = factP;
		} else if (f[1] <= factS) {
			f[1] = factS + self.config.bwVarStepHz;
		}
		if (f[0] >= f[1]) {
			if (k == 0) {
				f[1] = f[0] + self.config.bwVarStepHz;
			} else {
				f[0] = f[1] - self.config.bwVarStepHz;
			}
		}
		var bw = Math.abs(f[1] - f[0]);
		if (bw < self.config.bwVarStepHz) {
			bw = self.config.bwVarStepHz;
		} else if (bw > self.maxBw(b)) {
			bw = self.maxBw(b);
		}
		bw = ~~Math.round(bw / self.config.bwVarStepHz) * self.config.bwVarStepHz;
		if (k == 0) {
			f[1] = f[0] + bw;
			if (f[1] > factP) {
				f[1] = factP;
			}
			if (f[0] >= factP) {
				f[0] = factP - self.config.bwVarStepHz;
			}
		} else {
			f[0] = f[1] - bw;
			if (f[0] < factS) {
				f[0] = factS;
			}
			if (f[1] <= factS) {
				f[1] = factS + self.config.bwVarStepHz;
			}
		}
		for (var i = 0; i < 2; ++i) {
			var num = self.config.computeChNum(f[i], b);
			if (!isNaN(num)) {
				f[i] = self.config.computeChFreq(num, b);
			}
		}
		return f;
	}
	this.adjustFreqLimitsFc = function(b, f) {
		if (f[0] > f[1]) {
			var fr = f[0];
			f[0] = f[1];
			f[1] = fr;
		}
		var fc = ~~Math.round((f[0] + f[1]) / 2);
		var bw2 = ~~Math.round(Math.abs(f[1] - f[0]) / 2);
		var factS = self.factory.data.band[b].fStart;
		var factP = self.factory.data.band[b].fStop;
		if (fc <= factS) {
			fc = factS + self.config.bwVarStepHz / 2;
		} else if (fc >= factP) {
			fc = factP - self.config.bwVarStepHz / 2;
		}
		if (fc - bw2 < factS) {
			bw2 = fc - factS;
		} else if (fc + bw2 > factP) {
			bw2 = factP - fc;
		}
		var bw = bw2 * 2;
		if (bw < self.config.bwVarStepHz) {
			bw = self.config.bwVarStepHz;
		} else if (bw > self.maxBw(b)) {
			bw = self.maxBw(b);
		}
		f[0] = ~~Math.round(fc - bw / 2);
		f[1] = ~~Math.round(fc + bw / 2);
		var bw = f[1] - f[0];
		bw = ~~Math.round(bw / self.config.bwVarStepHz) * self.config.bwVarStepHz;
		f[1] = f[0] + bw;
		for (var i = 0; i < 2; ++i) {
			var num = self.config.computeChNum(f[i], b);
			if (!isNaN(num)) {
				f[i] = self.config.computeChFreq(num, b);
			}
		}
		return f;
	}
	this.adjustFreqLimitsBw = function(c, b, f) {
		if (f[0] > f[1]) {
			var fr = f[0];
			f[0] = f[1];
			f[1] = fr;
		}
		var fc = ~~Math.round((f[0] + f[1]) / 2);
		var fcp = ~~Math.round((self.fadj[c][b][0] + self.fadj[c][b][1]) / 2);
		if (fc % self.config.bwVarStepHz != fcp % self.config.bwVarStepHz) {
			fc = fcp;
		}
		var bw = Math.abs(f[1] - f[0]);
		bw = ~~Math.round(bw / self.config.bwVarStepHz) * self.config.bwVarStepHz;
		if (bw > self.maxBw(b)) {
			bw = self.maxBw(b);
		} else if (bw < self.config.bwVarStepHz) {
			bw = self.config.bwVarStepHz;
		}
		var bw2 = ~~Math.round(bw / 2);
		var factS = self.factory.data.band[b].fStart;
		var factP = self.factory.data.band[b].fStop;
		if (fc <= factS) {
			fc = factS + self.config.bwVarStepHz / 2;
		} else if (fc >= factP) {
			fc = factP - self.config.bwVarStepHz / 2;
		}
		if (fc - bw2 < factS) {
			fc = factS + bw2;
		} else if (fc + bw2 > factP) {
			fc = factP - bw2;
		}
		f[0] = ~~Math.round(fc - bw2);
		f[1] = ~~Math.round(fc + bw2);
		for (var i = 0; i < 2; ++i) {
			var num = self.config.computeChNum(f[i], b);
			if (!isNaN(num)) {
				f[i] = self.config.computeChFreq(num, b);
			}
		}
		return f;
	}
	this.adjustFreqLimitsOb = function(n, b, f) {
		var d = (b + 1) % 2;
		var g = [];
		for (var k = 0; k < 2; ++k) {
			var num = self.config.computeChNum(f[k], b);
			num = self.config.computeChNrOtherBand(num, b);
			var fr = self.config.computeChFreq(num, d);
			g.push(fr);
		}
		self.setFreqBv(n, d, g);
	}
	this.createFiltCtl = function(row, nr, chMask, s) {
		var mask = (1 << (nr-1));
		var cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		cell.innerHTML = nr.toString();
		if (typeof(s) != "undefined") {
			cell.rowSpan = s;
		}
		cell = document.createElement("td");
		row.appendChild(cell);
		var en = document.createElement("input")
		en.type = "checkbox";
		en.id = "chDisplay"+nr;
		en.name = en.id;
		en.nr = nr;
		en.checked = (chMask & mask) != 0;
		en.onclick = function(ev) {
			self.redraw();
		}
		cell.appendChild(en);
		if (typeof(s) != "undefined") {
			cell.rowSpan = s;
		}
	}
	this.createFreqStyleSw = function() {
		var row = document.createElement("tr");
		var cell = document.createElement("td");
		cell.colSpan = 3;
		row.appendChild(cell);
		cell = document.createElement("td");
		cell.colSpan = 2;
		var el = document.createElement("input");
		el.id = "freqStyle";
		el.name = el.id;
		el.type = "button";
		el.value = this.freqStyle == 0 ? "Start/Stop" : "Center/Bandwidth";
		el.style.fontWeight = "bold";
		el.style.width = "100%";
		el.style.borderRadius = "10px";
		el.self = this;
		el.onclick = function(ev) {
			try {
				var fb = self.getAllFreq();
				self.freqStyle = self.freqStyle == 0 ? 1 : 0;
				localStorage.setItem('freqStyle_1c3_'+window.location.host, self.freqStyle);
				this.value = self.freqStyle == 0 ? "Start/Stop" : "Center/Bandwidth";
				self.setFreqTitle();
				for (var c = 0; c < self.config.maxChannels; ++c) {
					var n = c + 1;
					for (var b = 0; b < 2; ++b) {
						var el = document.getElementById("chFreq_"+n+"_"+b+"_1");
						if (!el) {
							continue;
						}
					}
				}
				self.setAllFreq(fb);
			} catch (err) {}
		}
		cell.appendChild(el);
		row.appendChild(cell);
		return row;
	}
	this.getAllFreq = function() {
		var fb = [];
		for (var c = 0; c < self.config.maxChannels; ++c) {
			var n = c + 1;
			var g = [];
			for (var b = 0; b < 2; ++b) {
				if (self.config.bwType == 0) {
					g.push(getFreqCh(n, b));
				} else {
					g.push(self.getBandBv(n, b));
				}
			}
			fb.push(g);
		}
		return fb;
	}
	this.setAllFreq = function(fb) {
		for (var c = 0; c < self.config.maxChannels; ++c) {
			var n = c + 1;
			var g = fb[c];
			for (var b = 0; b < 2; ++b) {
				var f = g[b];
				if (self.config.bwType == 0) {
					setFreqCh(n, b, f);
				} else {
					self.setFreqBv(n, b, f);
				}
			}
		}
	}
	this.isSimplexMode = function() {
		if (self.config.bwType == 1) {
			return false;
		}
		if (self.factory.data.dualFw && self.config.conf.control.revision == 1) {
			return false;
		}
		if (self.factory.data.simplex && self.version.isFwSimplex()) {
			return true;
		}
		return false;
	}
	this.createGralCtlBox = function() {
		var sqmode = this.createMuteMode();
		var temp = this.createTempBoard();
		var hwfail = this.createFpgaError();
		var box = document.createElement("div");
		var tab = document.createElement("table");
		tab.style.marginLeft = "auto";
		tab.style.marginRight = "auto";
		//tab.style.tableLayout = "fixed";
		tab.style.paddingLeft = "0px";
		box.appendChild(tab);
		tab.style.borderSpacing = "3px";
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row, cell, el;
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		cell.style.paddingLeft = "20px";
		if (this.isSimplexMode()) {
			cell.rowSpan = 2;
		}
		row.appendChild(cell);
		el = this.createFreqSplit();
		cell.appendChild(el);
		cell = document.createElement("td");
		cell.style.paddingLeft = "10px";
		if (this.isSimplexMode()) {
			cell.rowSpan = 2;
		}
		row.appendChild(cell);
		if (this.isSimplexMode()) {
			cell.appendChild(temp);
			cell = document.createElement("td");
			cell.style.paddingLeft = "10px";
			cell.style.width = "15%";
			if (this.factory.data.dualFw) {
				cell.rowSpan = 2;
			}
			row.appendChild(cell);
			cell.appendChild(hwfail);
		} else {
			cell.appendChild(sqmode);
		}
		cell = document.createElement("td");
		cell.style.paddingLeft = "10px";
		if (this.isSimplexMode()) {
			cell.rowSpan = 2;
		}
		row.appendChild(cell);
		el = this.createUnitReset();
		cell.appendChild(el);
		if (this.factory.data.dualFw) {
			cell = document.createElement("th");
			cell.style.paddingLeft = "10px";
			cell.innerHTML = "12&nbsp;Narrow&nbsp;filters";
			cell.className = "thdrht";
			row.appendChild(cell);
			cell = document.createElement("td");
			cell.style.paddingLeft = "10px";
			cell.style.paddingRight = "20px";
			row.appendChild(cell);
			el = this.createFwRev(0);
			el.style.cssFloat = "right";
			cell.appendChild(el);
		}
		if (this.factory.data.simplex && !this.factory.data.dualFw) {
			return box;
		}
		row = document.createElement("tr");
		body.appendChild(row);
		if (!this.isSimplexMode()) {
			cell = document.createElement("td");
			cell.style.paddingLeft = "20px";
			cell.style.width = this.factory.data.dualFw ? "25%" : "40%";
			row.appendChild(cell);
			cell.appendChild(temp);
			cell = document.createElement("td");
			cell.style.paddingLeft = "10px";
			cell.style.width = this.factory.data.dualFw ? "25%" : "40%";
			row.appendChild(cell);
			el = this.createTbsError();
			cell.appendChild(el);
			cell = document.createElement("td");
			cell.style.paddingLeft = "10px";
			cell.style.width = "15%";
			row.appendChild(cell);
			cell.appendChild(hwfail);
		}
		if (this.factory.data.dualFw) {
			cell = document.createElement("th");
			cell.style.paddingLeft = "10px";
			cell.innerHTML = "4&nbsp;Adjustable&nbsp;filters";
			cell.className = "thdrht";
			cell.style.width = "30%";
			row.appendChild(cell);
			cell = document.createElement("td");
			cell.style.paddingLeft = "10px";
			cell.style.paddingRight = "20px";
			cell.style.width = "5%";
			row.appendChild(cell);
			el = this.createFwRev(1);
			el.style.cssFloat = "right";
			cell.appendChild(el);
		}
		return box;
	}
	this.createFreqSplit = function() {
		var box = document.createElement("div");
		var row = document.createElement("tr");
		box.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts["FREQSPLIT"];
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.paddingLeft = "15px";
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "freqSplit";
		el.name = el.id;
		el.self = this;
		var opts = [ Texts['FIXED'], Texts['VARIABLE'] ];
		for (var i = 0; i < 2; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.selectedIndex = 0;
		el.onchange = function(ev) {
			var fixed = this.selectedIndex == 0;
			for (var c = 0; c < self.config.maxChannels; ++c) {
				if (self.config.bwType == 0) {
					self.frSplitChRedraw(c, fixed);
				} else {
					self.frSplitBandRedraw(c, fixed);
				}
			}
		}
		cell.style.verticalAlign = "middle";
		cell.appendChild(el);
		return box;
	}
	this.frSplitChRedraw = function (c, fixed) {
		var n = c + 1;
		var b = 1;
		var f = getFreqCh(n, b);
		if (f < self.factory.data.band[b].fStart) {
			f = self.factory.data.band[b].fStart;
		} else if (f > self.factory.data.band[b].fStop) {
			f = self.factory.data.band[b].fStop;
		}
		var num = self.config.computeChNum(f, b);
		if (isNaN(num))
			num = self.config.conf.band[b].ch[c].frqNr;
		f = self.config.computeChFreq(num, b);
		setFreqCh(n, b, f);
		if (fixed) {
			num = self.config.computeChNrOtherBand(num, b);
			b = (b + 1) % 2;
			f = self.config.computeChFreq(num, b);
		} else {
			b = (b + 1) % 2;
			f = self.config.conf.band[b].ch[c].frqNr * self.factory.data.fstep 
				+ self.factory.data.band[b].fo;
		}
		setFreqCh(n, b, f);
	}
	this.frSplitBandRedraw = function(c, fixed) {
		var n = c + 1;
		var b = 1;
		var fr = self.getBandBv(n, b);
		var chnr = [];
		for (var i = 0; i < 2; ++i) {
			if (fr[i] < self.factory.data.band[b].fStart) {
				fr[i] = self.factory.data.band[b].fStart;
			} else if (fr[i] > self.factory.data.band[b].fStop) {
				fr[i] = self.factory.data.band[b].fStop;
			}
			var num = self.config.computeChNum(fr[i], b);
			if (isNaN(num))
				num = self.config.conf.band[b].ch[c].frqNr;
			chnr.push(num);
			fr[i] = self.config.computeChFreq(num, b);
		}
		self.setFreqBv(n, b, fr);
		var d = (b + 1) % 2;
		var f = [];
		if (fixed) {
			for (var i = 0; i < 2; ++i) {
				var num = self.config.computeChNrOtherBand(chnr[i], b);
				f.push(self.config.computeChFreq(num, d));
			}
			self.setFreqBv(n, d, f);
		}
	}
	this.createMuteMode = function() {
		var box = document.createElement("div");
		var row = document.createElement("tr");
		box.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts["MUTEMODE"];
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.paddingLeft = "5px";
		row.appendChild(cell);
		var el = document.createElement("select");
		el.id = "mutemode";
		el.name = el.id;
		var opts = [ Texts['INDEPENDENT'], Texts['LINKED'] ];
		for (var i = 0; i < 2; ++i) {
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = opts[i];
			opt.value = i;
		}
		el.selectedIndex = 0;
		cell.appendChild(el);
		return box;
	}
	this.createUnitReset = function() {
		var box = document.createElement("div");
		var reset = document.createElement("input");
		reset.id = "reset";
		reset.name = reset.id;
		reset.type = "button";
		reset.value = "RESET";
		reset.className = "resetbutton";
		reset.onclick = function() { submitform(true, true); } 
		box.appendChild(reset);
		return box;
	}
	this.createFwRev = function(n) {
		var el = document.createElement("input");
		el.id = "fwRev_"+n;
		el.name = el.id;
		el.type = "checkbox";
		el.nr = n;
		el.checked = (this.config.conf.control.revision == n);
		el.onclick = function(ev) {
			try {
				var n = (this.nr == 0 ? 1 : 0);
				var other = document.getElementById("fwRev_"+n);
				other.checked = !this.checked;
				var r = window.confirm("PLEASE, CONFIRM CHANGE OF FILTER MODE");
				if (!r) {
					this.checked = !this.checked;
					other.checked = !this.checked;
					return;
				}
				submitform(false, true);
			} catch(err) {}
		}
		return el;
	}
	this.getFwRev = function() {
		try {
			var el = document.getElementById("fwRev_0");
			return (el.checked ? 0 : 1);
		} catch(err) {}
	}
	this.setFwRev = function(n) {
		try {
			for (var i = 0; i < 2; ++i) {
				var el = document.getElementById("fwRev_"+i);
				el.checked = (i == 0 && !n) || (i == 1 && n);
			}
		} catch(err) {}
	}
	this.createTempBoard = function() {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = createMetRow("boardTemp", board_temp_settings, Texts['TEMPERATURE'], "&ordm;C");
		tb.appendChild(row);
		return box;
	}
	this.createTbsError = function() {
		var box = document.createElement("div");
		var row = document.createElement("tr");
		box.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['TBS'];
		cell.className = "thdrht";
		cell = createLedBox("tbsErr");
		cell.style.paddingLeft = "40px";
		row.appendChild(cell);
		return box;
	}
	this.createFpgaError = function() {
		var box = document.createElement("div");
		var row = document.createElement("tr");
		box.appendChild(row);
		var cell = document.createElement("th");
		cell.style.width = "90%";
		row.appendChild(cell);
		cell.innerHTML = Texts['FPGA'];
		cell.className = "thdrht";
		cell = createLedBox("fpgaErr");
		cell.style.paddingLeft = "15px";
		row.appendChild(cell);
		return box;
	}
	this.createBandBox = function(dn) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row = document.createElement("tr");
		body.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = dn ? Texts['DNLINK'] : Texts['UPLINK'];
		cell.colSpan = 3;
		cell.className = 'nh';
		cell.style.color = '#fb7922';
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['INPUT'];
		row.appendChild(document.createElement("td"));
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['OUTPUT'];
		row = document.createElement("tr");
		body.appendChild(row);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "tabbox";
		var el = this.createBandCtrlBox(dn);
		cell.appendChild(el);
		row.appendChild(document.createElement("td"));
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.className = "tabbox";
		el = this.createBandOutBox(dn);
		cell.appendChild(el);
		return box;
	}
	this.createBandCtrlBox = function(dn) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row;
		row = this.createSquelchEnable(dn);
		if (this.isSimplexMode()) {
			row.style.display = "none";
		}
		body.appendChild(row);
		row = this.createSquelchThreshold(dn);
		body.appendChild(row);
		row = this.createMainGainLim(dn);
		body.appendChild(row);
		row = this.createMainPowerLim(dn);
		body.appendChild(row);
		row = this.createInputOverflow(dn);
		body.appendChild(row);
		return box;
	}
	this.createBandOutBox = function(dn) {
		var box = document.createElement("div");
		var tab = document.createElement("table");
		box.appendChild(tab);
		var body = document.createElement("tbody");
		tab.appendChild(body);
		var row = this.createHpaCtl(dn);
		body.appendChild(row);
		hpa_settings[dn].max = this.factory.data.band[dn].powerLim + 5;
		hpa_settings[dn].min = hpa_settings[dn].max - 45;
		hpa_settings[dn].high_warn = this.factory.data.band[dn].powerLim;
		hpa_settings[dn].high_alarm = this.factory.data.band[dn].powerLim + this.factory.MAX_PWR_DELTA;
		row = createMetRow("rfOutPow"+dn, hpa_settings[dn], Texts['POWER'], "dBm");
		body.appendChild(row);
		row = document.createElement("tr");
		body.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = (dn == 1 && this.factory.data.band[dn].fipmon) ? Texts['COMMERR'] : Texts['PASTATUS'];
		cell.className = "thdrht";
		cell = createLedBox("hpaStatusLed"+dn);
		row.appendChild(cell);
		if (dn == 0) {
			return box;
		}
		if (!this.factory.data.band[dn].fipmon) {
			row = document.createElement("tr");
			body.appendChild(row);
		}
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.className = "thdrht";
		if (this.factory.data.band[dn].fipmon) {
			cell.innerHTML =  Texts['AGCFAIL'];
			cell.colSpan = 2;
			cell = document.createElement("th");
			row.appendChild(cell);
		} else {
			cell.innerHTML =  Texts['PAOVF'];
		}
		cell = createLedBox("hpaOvf"+dn);
		row.appendChild(cell);
		if (this.factory.data.band[dn].fipmon) {
			row = document.createElement("tr");
			body.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = Texts['VSWR'];
			cell.className = "thdrht";
			cell = createLedBox("hpaVswrLed"+dn);
			row.appendChild(cell);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = Texts['TXLOW'];
			cell.className = "thdrht";
			cell.colSpan = 2;
			cell = document.createElement("th");
			row.appendChild(cell);
			cell = createLedBox("hpaTxLowLed"+dn);
			row.appendChild(cell);
		}
		return box;
	}
	this.createSquelchEnable = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['SQUELCH'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		cell.style.textAlign = "center";
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "sqEn"+(dn? 1 : 0);
		el.name = el.id;
		el.type = "checkbox";
		cell.appendChild(el);
		return row
	}
	this.createSquelchThreshold = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = this.isSimplexMode() ? Texts['SQTHRS'] : Texts['THRS'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = document.createElement("input");
		el.id = "sqThr"+(dn? 1 : 0);
		el.name = el.id;
		el.type = "text";
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.title = "Min: "+config.conf.band[dn].squelchThrMin+", Max: "+config.conf.band[dn].squelchThrMax+" dBm";
		el.onchange = function(ev) {
			var target = this;
			var dn = (target.id == "sqThr1" ? 1 : 0);
			var num = squelchThrGet(dn);
			if (num < self.config.conf.band[dn].squelchThrMin) {
				target.value = self.config.conf.band[dn].squelchThrMin;
			} else if (num > self.config.conf.band[dn].squelchThrMax) {
				target.value = self.config.conf.band[dn].squelchThrMax;
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
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.title = "Min: "+config.conf.band[dn].mainGainMin+", Max: "+factory.data.band[dn].gainLim+" dB";
		el.onchange = function(ev) {
			var target = this;
			var dn = (target.id == "mainGainLimit1" ? 1 : 0);
			var num = mainGainLimGet(dn);
			if (num < self.config.conf.band[dn].mainGainMin) {
				target.value = self.config.conf.band[dn].mainGainMin;
			} else if (num > self.factory.data.band[dn].gainLim) {
				target.value = self.factory.data.band[dn].gainLim;
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
	this.createMainPowerLim = function(dn) {
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
		el.style.width = "32px";
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.className = "number";
		el.title = "Min: "+(factory.data.band[dn].powerLim - config.conf.band[dn].mainPowerRange)+", Max: "+factory.data.band[dn].powerLim+" dBm";
		el.onchange = function(ev) {
			var target = this;
			var dn = (target.id == "mainPowerLimit1" ? 1 : 0);
			var num = mainPowerLimGet(dn);
			if (num < (self.factory.data.band[dn].powerLim - self.config.conf.band[dn].mainPowerRange)) {
				target.value = (self.factory.data.band[dn].powerLim - self.config.conf.band[dn].mainPowerRange);
			} else if (num > self.factory.data.band[dn].powerLim) {
				target.value = self.factory.data.band[dn].powerLim;
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
	this.createInputOverflow = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['OVF'] + (dn?"&nbsp;DL":"&nbsp;UL");
		cell.className = "thdrht";
		cell = createLedBox("rfOvfLed"+dn);
		row.appendChild(cell);
		return row;
	}
	this.createHpaCtl = function(dn) {
		var row = document.createElement("tr");
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['ENABLE'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createHpaSwitch(dn);
		cell.appendChild(el);
		return row
	}
	this.createHpaSwitch = function(dn) {
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
	this.createChCtrl = function(nr, dn) {
		var tab = document.createElement("table");
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['FREQUENCY'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.id = "chFreqDisp_"+nr+"_"+dn;
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "MHz";
		if (this.config.bwType == 1) {
			row = document.createElement("tr");
			tb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = Texts['BW'];
			cell.className = "thdrht";
			cell = document.createElement("td");
			cell.id = "chBwDisp_"+nr+"_"+dn;
			cell.style.textAlign = "right";
			row.appendChild(cell);
			cell = document.createElement("td");
			row.appendChild(cell);
			cell.innerHTML = "MHz";
		}
		row = document.createElement("tr");
		tb.appendChild(row);
		cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['FINEGAIN'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		var el = this.createFineGainLim(nr, dn);
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dB";
		row = document.createElement("tr");
		tb.appendChild(row);
		/*cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = Texts['FINEPOWER'];
		cell.className = "thdrht";
		cell = document.createElement("td");
		row.appendChild(cell);
		el = this.createFinePowerLim(nr, dn);
		cell.appendChild(el);
		cell = document.createElement("td");
		row.appendChild(cell);
		cell.innerHTML = "dB";*/
		if (this.config.bwType == 0) {
			row = document.createElement("tr");
			tb.appendChild(row);
			cell = document.createElement("th");
			row.appendChild(cell);
			cell.innerHTML = Texts['BW'];
			cell.className = "thdrht";
			cell = document.createElement("td");
			row.appendChild(cell);
			el = this.createChBw(nr, dn);
			cell.appendChild(el);
			cell = document.createElement("td");
			row.appendChild(cell);
			cell.innerHTML = "KHz";
		}
		return tab;
	}
	this.createChStat = function(ch, b) {
		var c = ch - 1;
		var tab = document.createElement("table");
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var row = document.createElement("tr");
		tb.appendChild(row);
		var cell = document.createElement("th");
		row.appendChild(cell);
		cell.innerHTML = this.isSimplexMode() ? TextEn['FILTON'] : Texts['SIGNAL'];
		cell.style.textAlign = "right";
		cell = createLedBox("rfSignalIn"+ch+b);
		row.appendChild(cell);
		row = createMetRow("rfInPow"+ch+b, chRfIn_settings[b], Texts['POWIN'], "dBm");
		tb.appendChild(row);
		var maxGain = this.config.conf.band[b].mainGain + this.config.conf.band[b].ch[c].fineGain;
		var minGain = maxGain - 30;
		var chRfGainSettings = {min: minGain, low_alarm: minGain, low_warn: minGain, high_warn: maxGain, high_alarm: maxGain, max: maxGain };
		row = createMetRow("rfChGain"+ch+b, chRfGainSettings, Texts['GAIN'], "dB");
		tb.appendChild(row);
		row = createMetRow("rfOutPow"+ch+b, chRfOut_settings[b], Texts['POWOUT'], "dBm");
		tb.appendChild(row);
		row = createMetRow("agc"+ch+b, agc_settings[b], Texts['AGC'], "dB");
		tb.appendChild(row);
		return tab;
	}
	this.createFineGainLim = function(nr, dn) {
		var box = document.createElement("div");
		var el = document.createElement("input");
		box.appendChild(el);
		el.id = "fineGainLimit"+nr+(dn? 1 : 0);
		el.name = el.id;
		el.type = "text";
		el.style.width = "35px";
		el.className = "number";
		el.path = dn;
		el.chNr = nr;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.title = "Min: "+this.config.conf.fineGainRange+", Max: 0 dB";
		el.onchange = function(ev) {
			var target = this;
			var dn = target.path;
			var nr = target.chNr;
			var num = fineGainLimGet(nr, dn);
			if (num < self.config.conf.fineGainRange) {
				target.value = self.config.conf.fineGainRange;
			} else if (num > 0) {
				target.value = 0;
			} else {
				target.value = num;
			}
		}
		return box;
	}
	this.createFinePowerLim = function(nr, dn) {
		var box = document.createElement("div");
		var el = document.createElement("input");
		box.appendChild(el);
		el.id = "finePowerLimit"+nr+(dn? 1 : 0);
		el.name = el.id;
		el.type = "text";
		el.style.width = "35px";
		el.className = "number";
		el.path = dn;
		el.chNr = nr;
		el.onkeypress = function(ev) {
			return isKeyDecimalNumber(ev);
		}
		el.title = "Min: "+this.config.conf.finePowerRange+", Max: 0 dB";
		el.onchange = function(ev) {
			var target = this;
			var dn = target.path;
			var nr = target.chNr;
			var num = 0;//finePowerLimGet(nr, dn);
			if (num < self.config.conf.finePowerRange) {
				target.value = self.config.conf.finePowerRange;
			} else if (num > 0) {
				target.value = 0;
			} else {
				target.value = num;
			}
		}
		return box;
	}
	this.createChBw = function(nr, dn) {
		var box = document.createElement("div");
		var el = document.createElement("select");
		box.appendChild(el);
		el.id = "chBw"+nr+(dn? 1 : 0);
		el.name = el.id;
		el.className = "centered";
		el.style.fontSize = "10px";
		el.style.width = "45px";
		for (var i = 0, j = 0; i < this.factory.bwOptions.length; i++) {
			if (!(this.factory.bwOptions[i].mask & this.factory.data.bwmask)) {
				continue;
			}
			var opt = document.createElement("option");
			el.options.add(opt);
			opt.text = this.factory.bwOptions[i].lbl;
			opt.value = this.factory.bwOptions[i].cfg;
		}
		el.selectedIndex = 0;
		return box;
	}
	this.chBwSet = function(ch, dn, bw) {
		var el = document.getElementById("chBw"+ch+(dn? 1 : 0));
		try {
			for (var i = 0; i < el.options.length; ++i) {
				if (!(this.factory.bwOptions[i].mask & this.factory.data.bwmask)) {
					continue;
				}
				if (bw != el.options[i].value) {
					continue;
				}
				el.selectedIndex = i;
				break;
			}
		} catch (err) {}
	}
	this.chBwGet = function(ch, dn) {
		try {
			var el = document.getElementById("chBw"+ch+(dn? 1 : 0));
			var k = el.selectedIndex;
			return el.options[k].value;
		} catch (err) {
			return null;
		}
	}
	this.maxBw = function(b) {
		var bw =  Math.abs(Math.abs(self.factory.data.band[b].fStop
			- self.factory.data.band[b].fStart));
		if (bw > self.config.bwVarMaxHz) {
			bw = self.config.bwVarMaxHz;
		}
		return bw;
	}
	this.config = null;
	this.factory = null;
	this.tags = null;
	this.version = null;
	this.bwType = 'undefined';
	this.revision = 'undefined';
	var freqStyle = parseInt(localStorage.getItem('freqStyle_1c3_'+window.location.host));
	if (isNaN(freqStyle) || freqStyle != 0) {
		freqStyle = 1;
	}
	this.freqStyle = freqStyle;
	this.showChannelsBitmask = 0;
	this.id = 'rootElement';
	this.parentId = 'page';
	this.fadj = [];
	var self = this;
}

function setTag(name) {
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

function chIsOn(nr) {
	try {
		var el = document.getElementById("chSwInp"+nr);
		if (el)
			return el.checked;
		else
			return null;
	} catch (err) {	return false; }
}

function chSwSet(nr, on) {
	try {
		var box = document.getElementById("chSwBox"+nr);
		var lbl = document.getElementById("chSwLbl"+nr);
		var el =  document.getElementById("chSwInp"+nr);
		if (!box || !lbl || !el)
			return;
		el.checked = on ? true : false;
		if (el.checked) {
			lbl.innerHTML = Texts['CHON'];
			lbl.style.color = "#000000";
			box.style.backgroundColor = "#D0FFD0";
			box.style.borderStyle = "inset";
		} else {
			lbl.innerHTML = Texts['CHOFF'];
			lbl.style.color = "#ffffff";
			box.style.backgroundColor = "#df4040";
			box.style.borderStyle = "outset";
		}
	} catch(err) { }
}

function setFreqCh(nr, dn, frq) {
	try {
		var val = (frq / 1.0e6).toFixed(6);
		var el = document.getElementById("chFreq_"+nr+"_"+(dn? 1: 0));
		if (el)
			el.value = val;
		var disp = document.getElementById("chFreqDisp_"+nr+"_"+(dn? 1: 0));
		if (disp)
			disp.innerHTML = val;
	} catch (err) { }
}

function getFreqCh(nr, dn) {
	try {
		var el = document.getElementById("chFreq_"+nr+"_"+(dn? 1: 0));
		return ~~Math.round(parseFloat(el.value) * 1.0e6);
	} catch (err) { return Number.NaN; }
}

function setBwBandSt(nr, dn, bw) {
	try {
		var val = (bw / 1.0e3).toFixed(0);
		var el = document.getElementById("chFreq_"+nr+"_"+(dn? 1: 0)+"_1");
		if (el)
			el.value = val;
		el = document.getElementById("chBwDisp_"+nr+"_"+(dn? 1: 0));
		if (el)
			el.innerHTML = val;
	} catch (err) {}
}

function getBwBand(nr, dn) {
	try {
		var el = document.getElementById("chFreq_"+nr+"_"+(dn? 1: 0)+"_1");
		return ~~Math.round(parseFloat(el.value) * 1.0e3);
	} catch (err) { return Number.NaN; }
}

function squelchEnSet(dn, on) {
	try {
		var el = document.getElementById("sqEn"+(dn? 1 : 0));
		el.checked = on? true: false;
	} catch (err) {}
}

function squelchEnIsSet(dn) {
	try {
		var el = document.getElementById("sqEn"+(dn? 1 : 0));
		return el.checked;
	} catch (err) {
		return false;
	}
}

function squelchThrSet(dn, val) {
	try {
		var el = document.getElementById("sqThr"+(dn? 1 : 0));
		if (!isNaN(val))
			el.value = val;
	} catch (err) {}
}

function squelchThrGet(dn) {
	try {
		var el = document.getElementById("sqThr"+(dn? 1 : 0));
		return parseInt(el.value);
	} catch (err) {
		return -128;
	}
}

function mainGainLimSet(dn, val) {
	try {
		var el = document.getElementById("mainGainLimit"+(dn? 1 : 0));
		if (!isNaN(val))
			el.value = val.toString();
	} catch (err) { }
}

function mainGainLimGet(dn) {
	try {
		var el = document.getElementById("mainGainLimit"+(dn? 1 : 0));
		return parseInt(el.value);
	} catch (err) { return -128; }
}

function mainPowerLimSet(dn, val) {
	try {
		var el = document.getElementById("mainPowerLimit"+(dn? 1 : 0));
		if (!isNaN(val))
			el.value = val.toString();
	} catch (err) { }
}

function mainPowerLimGet(dn) {
	try {
		var el = document.getElementById("mainPowerLimit"+(dn? 1 : 0));
		return parseInt(el.value);
	} catch (err) { return -128; }
}

function ovfLedSet(dn, color) {
	ledSetColor("rfOvfLed"+dn, color);
}

function tbsErrSet(color) {
	ledSetColor("tbsErr", color);
}

function hpaIsOn(dn) {
	try {
		var el = document.getElementById("hpaSwInp"+(dn? 1 : 0));
		return el.checked;
	} catch (err) {	return false; }
}

function hpaSwSet(dn, on) {
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

function hpaSwDisableStateSet(dn, disable) {
	try {
		var hpaEn = document.getElementById("hpaSwInp"+(dn? 1 : 0));
		hpaEn.disabled = disable? true : false;
	} catch (err) { }
}
	
function createMetRow(id, s, title, units) {
	var trNode = document.createElement("tr");
	var tdNode = document.createElement("th");
	trNode.appendChild(tdNode);
	tdNode.innerHTML = title;
	tdNode.className = "thdrht";
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "met_"+id;
	var met = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
	met.attachTo(tdNode);
	met.valueSet(s.min);
	tdNode = document.createElement("td");
	trNode.appendChild(tdNode);
	tdNode.id = "txt_"+id;
	tdNode.style.minWidth = "50px";
	tdNode.style.textAlign = "center";
	tdNode.className = "tabval";
	tdNode.innerHTML = "0";
	tdNode = document.createElement("td");
	tdNode.innerHTML = units;
	tdNode.style.textAlign = "center";
	trNode.appendChild(tdNode);
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

function rfOutPowSet(dn, val, isOn) {
	if (isOn && val >= -127) {
		setMetValue("rfOutPow"+dn, val);
	} else {
		setMetValue("rfOutPow"+dn, "OFF");
	}
}

function statusHpaLedSet(dn, val) {
	ledSetColor("hpaStatusLed"+dn, val);
}

function hpaOvfDL(color) {
	ledSetColor("hpaOvf1", color);
}

function hpaCommerrLedSet(color) {
	ledSetColor("hpaStatusLed1", color);
}

function hpaVswrLedSet(color) {
	ledSetColor("hpaVswrLed1", color);
}

function hpaUdfLedSet(val) {
	ledSetColor("hpaTxLowLed1", val);
}

function resetDisableStateSet(disable) {
	try {
		var el = document.getElementById("reset");
		el.disabled = disable? true : false;
	} catch (err) {}
}

function fpgaErrSet(color) {
	ledSetColor("fpgaErr", color);
}

function setMuteMode(mode) {
	try {
		var el = document.getElementById("mutemode");
		el.selectedIndex = mode;
	} catch (err) { }
}

function isMuteModeLinked() {
	try {
		var el = document.getElementById("mutemode");
		return el.selectedIndex == 1;
	} catch (err) { return null;}
}
	
function setFreqSplit(mode) {
	try {
		var el = document.getElementById("freqSplit");
		el.selectedIndex = mode ? 1 : 0;
	} catch (err) { }
}

function isFreqSplitFixed() {
	try {
		var el = document.getElementById("freqSplit");
		return el.selectedIndex == 0;
	} catch (err) { return 0;}
}

function boardTempSet(val) {
	setMetValue("boardTemp", val);
}

function fineGainLimSet(nr, dn, val) {
	try {
		var el = document.getElementById("fineGainLimit"+nr+(dn? 1 : 0));
		if (el && !isNaN(val))
			el.value = val.toString();
	} catch (err) { }
}

function fineGainLimGet(nr, dn) {
	try {
		var el = document.getElementById("fineGainLimit"+nr+(dn? 1 : 0));
		if (el)
			return parseInt(el.value);
		return 0;
	} catch (err) { return 0; }
}

function finePowerLimSet(nr, dn, val) {
	try {
		var el = document.getElementById("finePowerLimit"+nr+(dn? 1 : 0));
		if (el && !isNaN(val))
			el.value = val.toString();
	} catch (err) { }
}

function finePowerLimGet(nr, dn) {
	try {
		var el = document.getElementById("finePowerLimit"+nr+(dn? 1 : 0));
		if (el)
			return parseInt(el.value);
		return 0;
	} catch (err) { return 0; }
}

function rfSignalLedSet(ch, dn, color) {
	ledSetColor("rfSignalIn"+ch+dn, color);
}
function rfChInPowSet(ch, dn, val, color) {
	setMetValue("rfInPow"+ch+dn, val, color);
}
function rfChGainSet(ch, dn, val) {
	setMetValue("rfChGain"+ch+dn, val, "normal");
}
function rfChOutPowSet(ch, dn, val, isOn) {
	if (isOn)
		setMetValue("rfOutPow"+ch+dn, val, "normal");
	else
		setMetValue("rfOutPow"+ch+dn, "OFF", "warning");
}
function agcSet(ch, dn, val) {
	setMetValue("agc"+ch+dn, val);
}

function createLedBox(id) {
	var tdNode = document.createElement("td");
	var led = document.createElement("img");
	led.id = id;
	led.src = "bullet_grey.png";
	led.className = "centered";
	led.align = "center";
	tdNode.appendChild(led);
	return tdNode;
}

function ledSetColor(id, color) {
	try {
		var led = document.getElementById(id);
		if (color == "red") {
			led.src = "bullet_red.png";
		} else if (color == "green") {
			led.src = "bullet_green.png";
		} else if (color == "yellow") {
			led.src = "bullet_yellow.png";
		} else if (color == "grey") {
			led.src = "bullet_grey.png";
		} else {
			led.src = "bullet_grey.png";
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
	this.mDiv.style.width = "45px";
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