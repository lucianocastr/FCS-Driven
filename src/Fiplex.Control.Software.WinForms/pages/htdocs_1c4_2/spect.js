var factory;
var spectrum;
var timerId;
var confs;
var freqs;
var isSpectPage = true;

function onloadInit() {
	guiBlocked(false);
	showResultIcon(ERR_PENDING);
	factory = new Factory();
	confs = new Conf();
	freqs = new Frequency();
	var frm = window.parent.navi.factoryFrame;
	if (frm) {
		factory.parse(frm);
	} else {
		reloadData();
		return;
	}
	if (typeof(window.parent.navi.confsFrame) !== 'undefined') {
		confs.parseFrameStr(window.parent.navi.confsFrame);
	} else {
		reloadData();
		return;
	}
	if (typeof(window.parent.navi.freqsFrame) !== 'undefined') {
		freqs.parseFrameStr(window.parent.navi.freqsFrame);
	} else {
		reloadData();
		return;
	}
	spectrum = new Spectrum();
	request_spectrum();
}
function reloadData(){
	factReq();
}
function factReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_fact(); }, 1000);
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { factReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { factReq(); }, 2000);
		}
		xhr.open("POST", "/spect.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("fact_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_fact() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					window.parent.navi.factoryFrame = this.responseText;
					factory.parse(this.responseText);
					if (typeof(spectrum) === "undefined" || !spectrum) {
						spectrum = new Spectrum();
					}
					request_spectrum();
				} else {
					timerId = setTimeout(function() { load_fact(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_fact(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { load_fact(); }, 2000);
		}
		Date.now = Date.now || function() { return +new Date; };	
		xhr.open("GET", "/update_fact.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}

function request_spectrum() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					tmrId = setTimeout(function() { load_spectrum(); }, 1000);
				} else {
					if (typeof(tmrId) !== "undefined" && tmrId)
						clearTimeout(tmrId);
					tmrId = setTimeout(function() { request_spectrum(); }, 1000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { request_spectrum(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { request_spectrum(); }, 1000);
		}
		var spectSettings = spectrum.getSettings();
		xhr.open("POST", "/spect.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("spect_band="+spectSettings+"&spect_req=1");
		xhr = null;
	} catch (err) {}
}
function load_spectrum() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					if (serverResponse.length < spectrum.nchannels * 2) {
						if (++spectrum.countGets < spectrum.MAXCOUNTGETS) {
							tmrId = setTimeout(function() { load_spectrum(); }, 1000);
							return;
						}
					} else {
						spectrum.parse(serverResponse);
	 					showResultIcon(ERR_NONE);
	 					guiBlocked(false);
						showRefresh();
					}
					spectrum.countGets = 0;
				}
				tmrId = setTimeout(function() { request_spectrum(); }, 100);
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_spectrum(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_spectrum(); }, 1000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_spct.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}
function stop_loading_spectrum() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId) {
			clearTimeout(tmrId);
		}
	} catch (err) { }
}
function showRefresh() {
	try {
		var img = document.getElementById("spectRefreshed");
		if (!img) {
			img = document.createElement("img");
			img.id = "spectRefreshed";
			document.getElementById("inSpectRefresh").appendChild(img);
		}
		img.src = "/bullet_green.png";
		setTimeout(function() {
			document.getElementById("spectRefreshed").src = "blank.gif";
		}, 1000);
		
	} catch (e) {}
}
function Spectrum() {
	this.parse = function(sr) {
		if (!this.spectBox || this.bandChanged || this.resBwChanged 
		    || this.spanStepChanged || this.chainChanged || this.zspanChanged) {
			var dnXscale = {
				min: this.FreqMinHz,
				max: this.FreqMaxHz,
				step: this.FreqStepHz
			};
			this.spectBox = this.getNewGraphBox("spectBox", this.inYscale, this.outYscale, dnXscale);
			document.getElementById("contentbox").appendChild(this.spectBox);
			this.graphAddDivs(this.spectBox);
			this.drawYScales(this.spectBox);
			this.drawXScale(this.spectBox);
			// this.createChannelBars(this.spectBox);
		}
		this.bandChanged = false;
		this.resBwChanged = false;
		this.spanStepChanged = false;
		this.chainChanged = false;
		this.zspanChanged = false;
		this.rawInput = [];
		for (var ch = 0, n = 0; ch <= this.nchannels && n < sr.length; ++ch) {
			try {
				var num = parseInt(sr.substr(n, 2), 16);
				this.rawInput.push(isNaN(num) ? this.inYscale.min : cSignedByte(num));
				n += 2;
			} catch (err) { }
		}
		if (this.io == 0) {
			this.inputSpectrum = [];
			this.computeInput(this.rawInput);
		} else {
			this.outputSpectrum = [];
			this.computeOutput(this.rawInput);
		}
		var ioSet = this.getIoChecked();
		this.render(this.spectBox, ioSet[0] ? this.inputSpectrum : null, ioSet[1] ? this.outputSpectrum : null);
	}
	this.getNewGraphBox = function(id, yInScale, yOutScale, xScale) {
		var box = document.getElementById(id);
		if (box)
			remove_element(box);
		box = document.createElement("div");
		box.id = id;
		box.style.position = "relative";
		box.style.height = this.graphsize.y+"px";
		box.h = this.graphsize.y;
		box.inMin = yInScale.min;
		box.inMax = yInScale.max;
		box.outMin = yOutScale.min;
		box.outMax = yOutScale.max;
		box.xmin = xScale.min;
		box.xmax = xScale.max;
		box.xstep = ~~Math.round((xScale.max - xScale.min) /this.graphsize.x);
		box.onmousemove = function(ev) {
			ev = ev || window.event;
			var box = document.getElementById("spectBox");
			var n = getCursorRelPosX(box, ev);
			var fr = "";
			if (n >= 0) {
				var f = n * box.xstep + box.xmin;
				f = ~~Math.round(f / xScale.step) * xScale.step;
				fr = (f / 1e6).toFixed(6)+"&nbsp;MHz"
			}
			var tip = document.getElementById("spectTip");
			if (tip) tip.innerHTML = fr;
		}
		box.onmouseout = function(ev) {
			ev = ev || window.event;
			var tip = document.getElementById("spectTip");
			if (tip) tip.innerHTML = "";
		}
		return box;
	}
	this.graphAddDivs = function(box) {
		var divSize = this.graphsize.y / this.divisions.y;
		for (var i = 0; i <= this.divisions.y; ++i) {
			if (i > 0 && i < this.divisions.y) {
				var line = document.createElement("div");
				box.appendChild(line);
				line.className = "graphxdiv";
				line.style.bottom = (i*divSize)+"px";
			}
		}
		divSize = this.graphsize.x / this.divisions.x;
		divVal = (box.xmax - box.xmin) / this.divisions.x;
		for (var i = 0, pos = 0; i <= this.divisions.x; ++i) {
			if (i > 0 && i < this.divisions.x) {
				var line = document.createElement("div");
				box.appendChild(line);
				line.className = "graphydiv";
				pos = ~~Math.round(i * divSize);
				line.style.left = pos+"px";
			}
		}
	}
	this.drawYScales = function(box) {
		var divSize = this.graphsize.y / this.divisions.y;
		var inS = document.getElementById("inScale");
		remove_children(inS);
		var outS = document.getElementById("outScale");
		remove_children(outS);
		for (var i = 0; i <= this.divisions.y; ++i) {
			var txt = document.createElement("div");
			var divVal = (box.inMax - box.inMin) / this.divisions.y;
			txt.innerHTML = (box.inMin + i*divVal).toFixed(0);
			txt.style.position = "absolute";
			txt.style.bottom = (i*divSize-6)+"px";
			txt.style.marginLeft = "3px";
			inS.appendChild(txt);
			txt = document.createElement("div");
			divVal = (box.outMax - box.outMin) / this.divisions.y;
			txt.innerHTML = (box.outMin + i*divVal).toFixed(1);
			txt.style.position = "absolute";
			txt.style.bottom = (i*divSize-6)+"px";
			txt.style.marginLeft = "5px";
			outS.appendChild(txt);
		}
	}
	this.drawXScale = function(box) {
		var divSize = this.graphsize.x / this.divisions.x;
		var divVal = (box.xmax - box.xmin) / this.divisions.x;
		var xS = document.getElementById("xScale");
		remove_children(xS);
		for (var i = 0, pos = 0; i <= this.divisions.x; ++i) {
			var txt = document.createElement("div");
			txt.innerHTML = ((box.xmin + i*divVal)/1.0e6).toFixed(2);
			txt.style.left = ~~Math.round(i*divSize-15)+"px";
			txt.style.position = "absolute";
			txt.style.marginTop = "3px";
			xS.appendChild(txt);
		}
	}
	this.createChannelBars = function(box) {
		var b = this.chain;
		for (var c = 0; c < confs.CHNR; ++c) {
			if (confs.getChStby(b, c)) {
				continue;
			}
			var frNr = freqs.getChNr(b, c);
			var fr = frNr * factory.data.fstep + factory.data.band[b].fo;
			if (fr < this.FreqMinHz || fr > this.FreqMaxHz)
				continue;
			var pos = ~~Math.round(this.graphsize.x * (fr - this.FreqMinHz) / (this.FreqMaxHz - this.FreqMinHz));
			var mark = document.createElement('div');
			mark.className = "spectmarkbar";
			mark.style.left = pos+"px";
			mark.style.height = (this.graphsize.y - 1) + "px";
			box.appendChild(mark);
		}
	}
	this.render = function(cont, dataIn, dataOut) {
		var id = "cont"+cont.id;
		var box = document.getElementById(id);
		if (box)
			remove_element(box);
		box = document.createElement("div");
		box.id = id;
		box.style.position = "relative";
		box.style.height = cont.style.height;
		box.h = cont.h;
		cont.appendChild(box);
		box.ymin = cont.outMin;
		box.ymax = cont.outMax;
		if (dataOut) {
			for (var i = 0; i < dataOut.length; ++i) {
				this.renderChannel(box, i, 'o', dataOut);
			}
		}
		box.ymin = cont.inMin;
		box.ymax = cont.inMax;
		if (dataIn) {
			for (var i = 0; i < dataIn.length; ++i) {
				this.renderChannel(box, i, 'i', dataIn);
			}
		}
	}
	this.renderChannel = function(box, n, d, data) {
		var height, bar;
		var val = data[n];
		if (val < box.ymin)
			height = 0;
		else if (val > box.ymax)
			height = box.h;
		else
			height = box.h * (val - box.ymin)/(box.ymax - box.ymin);
		height = ~~Math.round(height);
		var s = ~~(this.ik / 2 - 1);
		var xpos = ~~Math.round(n * this.graphsize.x / (this.nd - 1)) + s;
		var xnext = ~~Math.round((n+1) * this.graphsize.x / (this.nd - 1)) + s;
		if ((height >= 0)&&(xpos<=this.graphsize.x)) {
			bar = document.createElement('div');
			bar.className = "spectnormalbar";
			bar.style.backgroundColor = d == 'o' ? "#60FF60" : "#E0E030";
			bar.id = box.id+d+n;
			bar.h = height;
			bar.style.width = (xnext - xpos) + "px";
			bar.style.height = "1px";
			bar.style.top = (this.graphsize.y - height).toString()+"px";
			bar.style.left = xpos+"px";
			box.appendChild(bar);
		}
		this.interpolate(box, n, d);
	}
	this.interpolate = function(box, ch, d) {
		if (ch <= 0)
			return;
		var bc = document.getElementById(box.id + d + ch.toString());
		var bp = document.getElementById(box.id + d + (ch-1).toString());
		if (!bc && !bp)
			return;
		var xs = ch > 0 ? ~~Math.round((ch-1) * this.graphsize.x / this.nd) : 0;
		var s = ~~(this.ik / 2 - 1);
		var xp = ~~Math.round(ch * this.graphsize.x / (this.nd - 1)) + s;
		var ys = bp ? bp.h : 0;
		var yp = bc ? bc.h : 0;
		var ln = document.createElement("div");
		ln.className = "spectnormalbar";
		ln.style.backgroundColor = d == 'o' ? "#60FF60" : "#E0E030";
		ln.style.width = "1px";
		ln.style.height = ~~Math.abs(Math.round(yp - ys)) + "px";
		ln.style.left = bc ? bc.style.left : xp+"px";
		var ym = yp > ys ? yp - 1 : ys;
		ln.style.top = (this.graphsize.y - ym).toString() + "px";
		box.appendChild(ln);
	}
	this.computeInput = function(rawData) {
		for (var i = 0; i < rawData.length; ++i) {
			rawData[i] -= this.IN_LEVEL_OFFSET;
		}
		this.inputSpectrum.push(rawData[0]);
		for (var i = 1; i < rawData.length; ++i) {
			var s = rawData[i-1];
			var p = rawData[i];
			var k = (p - s) / this.ik;
			for (var j = 1; j < this.ik; ++j) {
				this.inputSpectrum.push(s + k*j);
			}
			this.inputSpectrum.push(p);
		}
	}
	this.computeOutput = function(rawData) {
		for (var i = 0; i < rawData.length; ++i) {
			rawData[i] -= this.OUT_LEVEL_OFFSET;
		}
		this.outputSpectrum.push(rawData[0]);
		for (var i = 1; i < rawData.length; ++i) {
			var s = rawData[i-1];
			var p = rawData[i];
			var k = (p - s) / this.ik;
			for (var j = 1; j < this.ik; ++j) {
				this.outputSpectrum.push(s + k*j);
			}
			this.outputSpectrum.push(p);
		}
	}
	this.createForm = function() {
		this.createBandLimitsForm();
		this.createRbwForm()
		this.createSweepTime();
		this.createAvgForm();
		this.createChainForm();
		this.createIoForm();
		this.createZspanForm();
		this.zspanSet(this.zSpanSt);
	}
	this.computeSpectBandLimits = function(b) {
		var fm = [];
		var fmin, fmax; 
		fmin = factory.data.band[b].fStart;
		fmax = factory.data.band[b].fStop;
		fm.push(fmin);
		fm.push(fmax);
		return fm;
	}
	this.createBandLimitsForm = function() {
		var cont = [];
		cont.push(document.getElementById("spanStart"));
		cont.push(document.getElementById("spanStop"));
		var b = this.chain;
		var fm = this.computeSpectBandLimits(b);
		var tip = "Min: "+(fm[0]/1e6).toFixed(6)+"MHz, Max: "+(fm[1]/1e6).toFixed(6)+" MHz";
		for (var i = 0; i < 2; ++i) {
			var el = document.createElement("input");
			el.type = "text";
			el.title = tip;
			el.id = i == 0 ? "fstart" : "fstop";
			el.name = el.id;
			el.style.width = "75px";
			el.className = "number";
			el.style.display = "inline-block";
			el.style.marginLeft = "5px";
			el.style.marginRight = "5px";
			el.onkeypress = function(ev) {
				ev = ev || window.event;
				if (ev.keyCode == 13) {
					this.onchange(ev);
					return true;
				} else {
					return isKeyDecimalNumber(ev); 
				}
			}
			el.onchange = function(ev) {
				self.reSetBandLimits(ev);
				localStorage.setItem("spect_fs"+Prjstr+self.chain+window.location.host, self.newFreqMinHz);
				localStorage.setItem("spect_fp"+Prjstr+self.chain+window.location.host, self.newFreqMaxHz);
			}
			var val = i == 0 ? this.FreqMinHz : this.FreqMaxHz;
			el.value = (val / 1e6).toFixed(1);
			var t = document.createElement("span");
			t.innerHTML = i == 0 ? "START" : "STOP";
			t.style.fontWeight = "bold";
			t.style.marginRight = "2px";
			cont[i].appendChild(t);
			cont[i].appendChild(el);
			t = document.createElement("span");
			t.innerHTML = "(MHz)";
			t.style.fontWeight = "bold";
			t.style.marginRight = "2px";
			cont[i].appendChild(t);
			cont[i].style.paddingTop = "1px";
		}
	}
	this.setBandLimits = function(fi, fp) {
		var b = this.chain;
		var fm = this.computeSpectBandLimits(b);
		var tip = "Min: "+(fm[0]/1e6).toFixed(6)+"MHz, Max: "+(fm[1]/1e6).toFixed(6)+" MHz";
		var s = document.getElementById("fstart");
		s.value = (fi / 1e6).toFixed(6);
		s.title = tip;
		var p = document.getElementById("fstop");
		p.value = (fp / 1e6).toFixed(6);
		p.title = tip;
	}
	this.getBandLimits = function() {
		this.bandChanged = this.FreqMinHz != this.newFreqMinHz || this.FreqMaxHz != this.newFreqMaxHz;
		if (this.bandChanged) {
			this.FreqMinHz = this.newFreqMinHz;
			this.FreqMaxHz = this.newFreqMaxHz;
		}
		var r = hexformat(this.FreqMinHz, 8);
		r += hexformat(this.FreqMaxHz, 8);
		return r;
	}
	this.reSetBandLimits = function(ev) {
		var target = ev ? ev.target || false : false;
		var b = self.chain;
		var fm = this.computeSpectBandLimits(b);
		var elS = document.getElementById("fstart");
		var fi;
		if (self.zSpanSt) {
			fi = ~~Math.round(parseFloat(elS.value)*1e6);
			var n = ~~Math.round((fi - factory.data.band[b].fo)/this.FREQ_STEP_HZ);
			fi = n*this.FREQ_STEP_HZ + factory.data.band[b].fo;
		} else {
			fi = ~~Math.round(parseFloat(elS.value)*10)*1e5;
		}
		if (fi < fm[0] || fi > fm[1]) {
			fi = fm[0];
		}
		var elP = document.getElementById("fstop");
		var fp;
		if (self.zSpanSt) {
			fp = fi;
		} else {
			fp = ~~Math.round(parseFloat(elP.value)*10)*1e5;
			if (fp < fm[0] || fp > fm[1]) {
				fp = fm[1];
			}
		}
		var span = fp - fi;
		if (span < this.spanMinMHz*1e6 && span != 0) {
			if (!target || (target && target.id == "fstart")) {
				fi = fp - this.spanMinMHz*1e6;
				if (fi < fm[0]) {
					fi = fm[0];
					fp = fi + this.spanMinMHz*1e6;
				}
			} else {
				fp = fi + this.spanMinMHz*1e6;
				if (fp > fm[1]) {
					fp = fm[1];
					fi = fp - this.spanMinMHz*1e6;
				}
			}
		}
		this.newFreqMinHz = fi;
		this.newFreqMaxHz = fp;
		elS.value = (this.newFreqMinHz / 1e6).toFixed(span != 0 ? 1 : 6);
		elP.value = (this.newFreqMaxHz / 1e6).toFixed(span != 0 ? 1 : 6);
	}
	this.createRbwForm = function() {
		var cont = document.getElementById("resBw");
		if (!cont)
			return;
		var el = document.createElement("select");
		el.id = "sel_resBw";
		el.name = el.id;
		el.style.fontSize = "10px";
		var opts = [];
		for (var i = 0; i < this.MAXRES; ++i) {
			var opt = document.createElement("option");
			opt.text = (this.FREQ_STEP_HZ * (1 << i)).toString();
			opt.value = i;
			el.options.add(opt);
		}
		var str = "RBW";
		//el.disabled = (this.FreqMinHz != this.FreqMaxHz);
		//el.style.backgroundColor = el.disabled ? "#C0C0C0" : "white";
		el.selectedIndex = this.resBw;
		el.onchange = function(ev) {
			localStorage.setItem("spect_rbw"+Prjstr+window.location.host, this.selectedIndex);
		}
		var t = document.createElement("span");
		t.innerHTML = str;
		t.style.fontWeight = "bold";
		t.style.marginRight = "2px";
		cont.appendChild(t);
		cont.appendChild(el);
		t = document.createElement("span");
		t.innerHTML = " (Hz)";
		t.style.fontWeight = "bold";
		cont.appendChild(t);
		cont.style.paddingTop = "1px";
	}
	this.getRbw = function() {
		try {
			var el = document.getElementById("sel_resBw");
			var v = el.selectedIndex;
			this.resBwChanged = this.resBw != v;
			return v;
		} catch(err) {}
	}
	this.setRbw = function(v) {
		if (v < 0 || v >= this.MAXRES) {
			return;
		}
		try {
			var el = document.getElementById("sel_resBw");
			el.selectedIndex = v;
		} catch(err) {}
	}
	this.resBwEnable = function(en) {
		try {
			var el = document.getElementById("sel_resBw");
			el.disabled = !en;
			el.style.backgroundColor = el.disabled ? "#C0C0C0" : "white";
		} catch (err) {}
	}
	this.createSweepTime = function() {
		var cont = document.getElementById("spanStep");
		if (!cont)
			return;
		remove_children(cont);
		var el = document.createElement("span");
		el.id = "sel_spanStep";
		el.name = el.id;
		el.zspan = (this.FreqMinHz == this.FreqMaxHz);
		el.style.fontSize = "10px";
		el.style.width = "40px";
		el.style.eight = "20px";
		el.style.outline = "thin solid grey";
		el.style.backgroundColor = "#C0C0C0";
		el.style.color = "black";
		el.style.display = "inline-block";
		var str = "SWEEP"; 
		var t = document.createElement("span");
		t.innerHTML = str;
		t.style.fontWeight = "bold";
		t.style.marginRight = "2px";
		cont.appendChild(t);
		cont.appendChild(el);
		t = document.createElement("span");
		t.innerHTML = " (ms)";
		t.style.fontWeight = "bold";
		cont.appendChild(t);
		cont.style.paddingTop = "1px";
	}
	this.isZSpan = function() {
		try {
			var el = document.getElementById("sel_spanStep");
			if (el.zspan != "undefined") {
				return el.zspan;
			} else {
				return false;
			}
		} catch(err) {return false;}
	}
	this.setSweepTime = function(v) {
		try {
			var el = document.getElementById("sel_spanStep");
			var v = ~~Math.round(this.nchannels * 1.18 * this.avg / (1 << this.resBw));
			el.innerHTML = v;
		} catch(err) {}
	}
	this.createAvgForm = function() {
		var cont = document.getElementById("avgCnt");
		if (!cont)
			return;
		var tip = "Min: 1, Max: 32";
		var el = document.createElement("input");
		el.type = "text";
		el.title = tip;
		el.id = "spectAvg";
		el.name = el.id;
		el.style.width = "25px";
		el.className = "number";
		el.style.display = "inline-block";
		el.style.marginLeft = "5px";
		el.style.marginRight = "5px";
		el.value = this.avg;
		el.onkeypress = function(ev) {
			ev = ev || window.event;
			if (ev.keyCode == 13) {
				this.onchange();
				return true;
			} else {
				return numbersOnly(ev); 
			}
		}
		el.onchange = function(ev) {
			var v = parseInt(this.value);
			if (typeof(v) === 'undefined' || isNaN(v)) {
				v = 1;
			} else if (v < 1 ) {
				v = 1;
			} else if (v > self.MAXAVG) {
				v = self.MAXAVG;
			}
			this.value = v;
			localStorage.setItem("spect_avg"+Prjstr+window.location.host, v);
		}
		var t = document.createElement("span");
		t.innerHTML = "Avg.";
		t.style.fontWeight = "bold";
		t.style.marginRight = "2px";
		cont.appendChild(t);
		cont.appendChild(el);
		cont.style.paddingTop = "1px";
	}
	this.getAvg = function() {
		try {
			var el = document.getElementById("spectAvg");
			var v = parseInt(el.value);
			if (typeof(v) === 'undefined' || isNaN(v)) {
				v = 1;
			} else if (v < 1 ) {
				v = 1;
			} else if (v > self.MAXAVG) {
				v = self.MAXAVG;
			}
			return v;
		} catch(err) { return 1; }
	}
	this.createChainForm = function() {
		var cont = document.getElementById("signalChain");
		if (!cont)
			return;
		var t = [], el = [];
		this.setChainTitle(this.chain);
		for (var i = 0; i < 2; ++i) {
			el.push(document.createElement("input"));
			el[i].type = "checkbox";
			el[i].id = "sigChain_"+i;
			el[i].name = el.id;
			el[i].checked = i == this.chain;
			el[i].elChain = i;
			el[i].onclick = function(ev) {
				var c = this.elChain == 0 ? 1 : 0;
				var othel = document.getElementById("sigChain_"+c);
				if (!othel)
					return;
				othel.checked = !this.checked;
				self.chain = this.checked ? this.elChain : othel.elChain;
				self.setChainTitle(self.chain);
				localStorage.setItem("spect_chain"+Prjstr+window.location.host, self.chain);
				self.initSettings();
				self.setBandLimits(self.FreqMinHz, self.FreqMaxHz);
				self.zspanSet(self.zSpanSt);
				var zspan = self.FreqMinHz == self.FreqMaxHz;
				//self.resBwEnable(zspan);
				if (zspan) {
					self.setRbw(self.resBw);
				}
				if (self.isZSpan() != zspan) {
					self.createSweepTime();
				}
				self.chainChanged = true;
			}
			t.push(document.createElement("span"));
			t[i].innerHTML = i == 0 ? "UL" : "DL";
			t[i].style.fontWeight = "bold";
			t[i].style.marginRight = "2px";
			t[i].style.marginLeft = "2px";
		}
		cont.appendChild(t[0]);
		for (var i = 0; i < 2; ++i)
			cont.appendChild(el[i]);
		cont.appendChild(t[1]);
	}
	this.getChain = function() {
		var el = document.getElementById("sigChain_0");
		if (el && el.checked) {
			return 0;
		}
		return 1;
	}
	this.setChainTitle = function(chain) {
		try {
			var ttl = document.getElementById("chainTitle");
			ttl.innerHTML =  chain ? "DOWNLINK&nbsp;SPECTRUM" : "UPLINK&nbsp;SPECTRUM";
		} catch(err) {}
	}
	this.createIoForm = function(){
		var cont = document.getElementById("ioSel");
		if (!cont)
			return;
		var t = [], el = [];
		for (var i = 0; i < 2; ++i) {
			el.push(document.createElement("input"));
			el[i].type = "checkbox";
			el[i].id = "ioSel_"+i;
			el[i].name = el.id;
			el[i].checked = this.ioSet[i];
			el[i].side = i;
			el[i].onclick = function(ev) {
				try {
					var c = this.side == 0 ? 1 : 0;
					var othel = document.getElementById("ioSel_"+c);
					if (!this.checked) {
						if (!othel.checked) {
							othel.checked = true;
						}
					}
					var io = self.getIoChecked();
					self.render(self.spectBox, io[0] ? self.inputSpectrum : null, io[1] ? self.outputSpectrum : null);
					localStorage.setItem("spect_io_0"+Prjstr+window.location.host, io[0]? 1 : 0);
					localStorage.setItem("spect_io_1"+Prjstr+window.location.host, io[1]? 1 : 0);
				} catch(err) {}
			}
			t.push(document.createElement("span"));
			t[i].innerHTML = i == 0 ? "In" : "Out";
			t[i].style.fontWeight = "bold";
			t[i].style.marginRight = "2px";
			t[i].style.marginLeft = "2px";
		}
		cont.appendChild(t[0]);
		for (var i = 0; i < 2; ++i)
			cont.appendChild(el[i]);
		cont.appendChild(t[1]);
	}
	this.isIoChecked = function(n) {
		var c = n ? 1 : 0;
		try {
			var el = document.getElementById("ioSel_"+c);
			return el.checked;
		} catch(err) {}
	}
	this.nextIo = function() {
		var n = (this.io == 0 ? 1 : 0);
		if (this.isIoChecked(n)) {
			return n;
		}
		return this.io;
	}
	this.getIoChecked = function() {
		var r = [];
		for (var i = 0; i < 2; ++i) {
			r.push(this.isIoChecked(i) ? true : false);
		}
		return r;
	}
	this.createZspanForm = function() {
		var cont = document.getElementById("zeroSpan");
		if (!cont)
			return;
		var el = document.createElement("input");
		el.type = "checkbox";
		el.id = "zSpan";
		el.name = el.id;
		el.checked = this.zSpanSt;
		el.onclick = function(ev) {
			localStorage.setItem("spect_zspan"+Prjstr+window.location.host, this.checked ? 1 : 0);
			self.zSpanSt = this.checked;
			self.zspanSet(self.zSpanSt);
			self.zspanChanged = true;
		}
		var t = document.createElement("span");
		t.innerHTML = "Z.Span";
		t.style.fontWeight = "bold";
		t.style.marginRight = "2px";
		cont.appendChild(t);
		cont.appendChild(el);
	}
	this.zspanSet = function(zspan) {
		var fst = document.getElementById("fstart");
		var fsp = document.getElementById("fstop");
		if (zspan) { 
			this.FreqMaxHzBak = this.FreqMaxHz;
		} else {
			if (!isNaN(this.FreqMaxHzBak)) {
				this.FreqMaxHz = this.FreqMaxHzBak;
			}
		}
		try {
			fst.value = (this.FreqMinHz / 1e6).toFixed(zspan ? 6 : 1);
			fsp.value = (this.FreqMaxHz / 1e6).toFixed(zspan ? 6 : 1);
			fsp.disabled = !!zspan;
			fsp.style.backgroundColor = zspan ? "grey" : "#FFFFFF"
		} catch (err) {}
		this.reSetBandLimits();
	}
	this.computeRbw = function(rbw1st) {
		for (var rbw = rbw1st; rbw < this.MAXRES; ++rbw) {
			var fstep = this.FREQ_STEP_HZ * (1 << rbw);
			var nch = ~~Math.round((this.FreqMaxHz - this.FreqMinHz) / fstep);
			if (nch <= this.graphsize.x) {
				break;
			}
		}
		if (rbw >= this.MAXRES)
			rbw = this.MAXRES - 1;
		return rbw
	}
	this.getSettings = function() {
		var r = "";
		r += this.getBandLimits();
		var span = Math.abs(this.FreqMaxHz - this.FreqMinHz);
		this.io = this.nextIo();
		this.chain = this.getChain();
		this.avg = this.getAvg();
		var rbw;
		if (span == 0) {
			rbw = this.getRbw();
		} else {
			rbw = this.computeRbw(this.getRbw());
		}
		/*
		} else if (span > 2000000) {
			rbw = 3;
		} else if (span > 1000000) {
			rbw = 2;
		} else if (span > 500000) {
			rbw = 1;
		} else {
			rbw = 0;
		}
		*/
		var zspan = span == 0;
		this.resBwChanged = rbw != this.resBw;
		this.spanStepChanged = this.resBwChanged;
		this.resBw = rbw;
		this.spanStep = this.resBw;
		this.setRbw(this.resBw);
		//this.resBwEnable(zspan);
		this.setSweepTime();
		this.FreqStepHz = this.FREQ_STEP_HZ * (1 << this.spanStep);
		if (span == 0) {
			this.nchannels = this.graphsize.x + 1;
		} else {
			this.nchannels = ~~Math.round((this.FreqMaxHz - this.FreqMinHz) / this.FreqStepHz) + 1;
		}
		var k = ~~(this.graphsize.x / (this.nchannels - 1));
		this.ik = k || 1;
		this.nd = this.nchannels * this.ik;
		this.barwidth = ~~Math.round(this.graphsize.x / (this.nd - 1))+1;
		var s = 0;
		s |= this.io == 1 ? this.settingsBits.io : 0;
		s |= ((this.spanStep << this.settingsBits.fstepS) & this.settingsBits.fstep);
		s |= ((this.resBw << this.settingsBits.rbwS) & this.settingsBits.rbw);
		s |= this.chain == 1 ? this.settingsBits.chain : 0;
		r += hexformat(s, 2);
		s = ((this.avg - 1) & this.settingsBits.avg);
		r += hexformat(s, 2);
		return r;
	}
	this.initSettings = function() {
		this.io = 1;
		var b = parseInt(localStorage.getItem("spect_chain"+Prjstr+window.location.host));
		if (isNaN(b) || b < 0 || b > 1) {
			b = 1;
			localStorage.setItem("spect_chain"+Prjstr+window.location.host, b);
		}
		this.chain = b;
		var fi = parseInt(localStorage.getItem("spect_fs"+Prjstr+b+window.location.host));
		var fp = parseInt(localStorage.getItem("spect_fp"+Prjstr+b+window.location.host));
		var fm = this.computeSpectBandLimits(b);
		var span;
		if (!isNaN(fi) && !isNaN(fp) && fp >= fi
		    && fi >= fm[0] && fi <= fm[1]
		    && fp >= fm[0] && fp <= fm[1]) {
			span = fp - fi;
			this.FreqMinHz = this.newFreqMinHz = fi;
			this.FreqMaxHz = this.newFreqMaxHz = fp;
		} else {
			this.FreqMinHz = this.newFreqMinHz = fm[0];
			this.FreqMaxHz = this.newFreqMaxHz = fm[1];
			localStorage.setItem("spect_fs"+Prjstr+b+window.location.host, this.newFreqMinHz);
			localStorage.setItem("spect_fp"+Prjstr+b+window.location.host, this.newFreqMaxHz);
		}
		var zs = parseInt(localStorage.getItem("spect_zspan"+Prjstr+window.location.host));
		if (isNaN(zs) || zs < 0 || zs > 1) {
			zs = 0;
			localStorage.setItem("spect_zspan"+Prjstr+window.location.host, zs);
		}
		this.zSpanSt = zs != 0;
		var rbw = parseInt(localStorage.getItem("spect_rbw"+Prjstr+window.location.host));
		if (isNaN(rbw) || rbw < 0 || rbw >= this.MAXRES) {
			rbw = this.MAXRES - 1;
			localStorage.setItem("spect_rbw"+Prjstr+window.location.host, rbw);
		}
		this.resBw = rbw;
		this.spanStep = this.resBw;
		var v = parseInt(localStorage.getItem("spect_avg"+Prjstr+window.location.host));
		if (isNaN(v) || v < 1 || v > this.MAXAVG) {
			v = 1;
			localStorage.setItem("spect_avg"+Prjstr+window.location.host, v);
		}
		this.avg = v;
		this.ioSet = [];
		for (var i = 0; i < 2; ++i) {
			var io = parseInt(localStorage.getItem("spect_io"+Prjstr+i+window.location.host));
			if (isNaN(io) || (io != 0 && io != 1)) {
				io = 1;
				localStorage.setItem("spect_io"+Prjstr+i+window.location.host, io);
			}
			this.ioSet.push(io);
		}
	}
	var self = this;
	this.contentbox = document.getElementById("contentbox");
	this.inYscale = {min: -130.0, max: -0.0 };
	this.outYscale = {min: -90, max: 40.0};
	this.divisions = {x: 10, y: 13};
	this.graphsize = {x: 800, y: 480};
	this.FREQ_STEP_HZ = 3125;
	this.FreqStepHz = this.FREQ_STEP_HZ;
	this.spanMinMHz = 0.2;
	this.countGets = 0;
	this.MAXCOUNTGETS = 30;
	this.MAXRES = 4;
	this.MAXAVG = 32;
	this.IN_LEVEL_OFFSET = 10;
	this.OUT_LEVEL_OFFSET = 0;
	this.settingsBits = {
		io: 	0x01,
		fstep: 	0x06,
		fstepS:	1,
		nr: 	0x1F,
		rbw: 	0x18,
		rbwS: 	3,
		chain:  0x20,
		avg: 	0x1F 
	}
	this.avg;
	this.chain;
	this.nr;
	this.FreqMinHz;
	this.FreqMaxHz;
	this.resBw;
	this.spanStep;
	this.newFreqMinHz;
	this.newFreqMaxHz;
	this.FreqMaxHzBak;
	this.nchannels;
	this.barwidth;
	this.ik;
	this.nd;
	this.io;
	this.ioSet;
	this.zSpanSt;
	this.initSettings();
	this.createForm();
	this.bandChanged = false;
	this.resBwChanged = false;
	this.spanStepChanged = false;
	this.chainChanged = false;
	this.zspanChanged = false;
}
function submitform() {
	spectrum.reSetBandLimits();
	if (this.nchannels > 1024)
		return;
	guiBlocked(true);
	showResultIcon(ERR_PENDING);
}
