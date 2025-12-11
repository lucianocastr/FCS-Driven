<!--
var factory;
var config;
var monit;
var spectrum;
var timerId;

function onloadInit() {
	guiBlocked(false);
	monit = new Monitor();
	factory = new Factory();
	var frm = window.parent.navi.factoryFrame;
	if (frm != null) {
		factory.parse(frm);
	} else {
		reloadData();
		return;
	}
	config = new Config();
	var r = window.parent.navi.currentRevision;
	frm = window.parent.navi.configFrame[r];
	if (frm) {
		config.parse(frm);
	} else {
		reloadData();
		return;
	}
	spectrum = new Spectrum(config.maxChannels);
	load_status();
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
		xhr.open("POST", "/spectrum.zhtml", true);
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
					var serverResponse = this.responseText;
					factory.parse(serverResponse);
					confReq(true);
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
function confReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_conf(); }, 1000);
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { confReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { confReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { confReq(); }, 2000);
		}
		xhr.open("POST", "/spectrum.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("conf_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_conf() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					config.parse(serverResponse);
					load_status();
				} else {
					timerId = setTimeout(function() { load_conf(); }, 1500);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_conf(); }, 1500);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_conf(); }, 1500);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_conf.shtml?co="+Date.now(), true);
		xhr.timeout = 10000;
		xhr.send(null);
		xhr = null;
	} catch (err) {}
}
function load_status() {
	try {
		if (typeof(tmrId) !== "undefined" && tmrId)
			clearTimeout(tmrId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					monit.parse(serverResponse);
					request_spectrum();
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_status(); }, 1000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(tmrId) !== "undefined" && tmrId)
				clearTimeout(tmrId);
			tmrId = setTimeout(function() { load_status(); }, 1000);
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update.shtml?co="+Date.now(), true);
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
		var bandspect = spectrum.getBandLimits();
		xhr.open("POST", "/spectrum.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("spect_band="+bandspect+"&spect_req=1");
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
					if (typeof(spectrum) === "undefined" || !spectrum)
						spectrum = new Spectrum(config.maxChannels);
					if (serverResponse.length != (2*spectrum.nchannels + 2)*2) {
						if (++spectrum.countGets < spectrum.MAXCOUNTGETS) {
							tmrId = setTimeout(function() { load_spectrum(); }, 1000);
							return;
						}
					} else {
						spectrum.parse(serverResponse);
					}
					spectrum.countGets = 0;
				}
				tmrId = setTimeout(function() { load_status(); }, 100);
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
function Spectrum(maxChNr) {
	this.parse = function(sr) {
		if (!this.rawInput)
			this.rawInput = new Array(this.nchannels + 1);
		if (!this.inputSpectrum)
			this.inputSpectrum = new Array(this.nchannels + 1);
		if (!this.outputSpectrum)
			this.outputSpectrum = new Array(this.nchannels + 1);
		if (!this.adjacentChannelsWarn)
			this.adjacentChannelsWarn = new Array(this.nchannels + 1);
		if (this.bandChanged) {
			this.rawInput.length = 0;
			this.rawInput = new Array(this.nchannels + 1);
			this.inputSpectrum.length = 0;
			this.inputSpectrum = new Array(this.nchannels + 1);
			this.outputSpectrum.length = 0;
			this.outputSpectrum = new Array(this.nchannels + 1);
			this.adjacentChannelsWarn.length = 0;
			this.adjacentChannelsWarn = new Array(this.nchannels + 1);
		}
		if (!this.inSpectBox || this.bandChanged) {
			var dnXscale = {
				min: this.FreqMinHz,
				max: this.FreqMaxHz,
				step: this.FreqStepHz
			};
			this.inSpectBox = this.getNewGraphBox("inSpectBox", this.inYscale, dnXscale);
			document.getElementById("inContentbox").appendChild(this.inSpectBox);
			this.graphAddDivs(this.inSpectBox);
			this.createChannelBars(this.inSpectBox);
		}
		if (!this.outSpectBox || this.bandChanged) {
			var dnXscale = {
				min: this.FreqMinHz,
				max: this.FreqMaxHz,
				step: this.FreqStepHz
			};
			this.outSpectBox = this.getNewGraphBox("outSpectBox", this.outYscale, dnXscale);
			document.getElementById("outContentbox").appendChild(this.outSpectBox);
			this.graphAddDivs(outSpectBox);
			this.createChannelBars(this.outSpectBox);
		}
		this.bandChanged = false;
		for (var ch = 0, n = 0; ch <= this.nchannels && n < sr.length; ++ch) {
			try {
				var num = parseInt(sr.substr(n, 4), 16);
				this.rawInput[ch] = (isNaN(num) ? this.inYscale.min : to_float(num));
				n += 4;
			} catch (err) { }
		}
		this.computeInput(this.rawInput);
		this.computeOutput(this.inputSpectrum);
		this.render(this.inSpectBox, this.inputSpectrum);
		this.render(this.outSpectBox, this.outputSpectrum);
	}
	this.getNewGraphBox = function(id, yScale, xScale) {
		var box = document.getElementById(id);
		if (box)
			remove_element(box);
		box = document.createElement("div");
		box.id = id;
		box.style.position = "relative";
		box.style.height = this.graphsize.y+"px";
		box.h = this.graphsize.y;
		box.ymin = yScale.min;
		box.ymax = yScale.max;
		box.xmin = xScale.min;
		box.xmax = xScale.max;
		box.xstep = ~~Math.round((xScale.max - xScale.min) /this.graphsize.x);
		box.onmousemove = function(ev) {
			ev = ev || window.event;
			var box = document.getElementById("outSpectBox");
			var n = getCursorRelPosX(box, ev);
			var fr = "";
			if (n >= 0) {
				var f = n * box.xstep + box.xmin;
				f = ~~Math.round(f / xScale.step) * xScale.step;
				fr = (f / 1e6).toFixed(6)+"&nbsp;MHz"
			}
			var tip = document.getElementById("outSpectTip");
			if (tip) tip.innerHTML = fr;
			tip = document.getElementById("inSpectTip");
			if (tip) tip.innerHTML = fr;
		}
		box.onmouseout = function(ev) {
			ev = ev || window.event;
			var tip = document.getElementById("outSpectTip");
			if (tip) tip.innerHTML = "";
			tip = document.getElementById("inSpectTip");
			if (tip) tip.innerHTML = "";
		}
		return box;
	}
	this.graphAddDivs = function(box) {
		var divSize = this.graphsize.y / this.divisions.y;
		var divVal = (box.ymax - box.ymin) / this.divisions.y;
		for (var i = 0; i <= this.divisions.y; ++i) {
			if (i > 0 && i < this.divisions.y) {
				var line = document.createElement("div");
				box.appendChild(line);
				line.className = "graphxdiv";
				line.style.bottom = (i*divSize)+"px";
			}
			var txt = document.createElement("div");
			box.appendChild(txt);
			txt.innerHTML = (box.ymin + i*divVal).toFixed(0);
			txt.style.position = "absolute";
			txt.style.bottom = (i*divSize-5)+"px";
			txt.style.left = "-30px";
			txt.style.textAlign = "right";
		}
		divSize = ~~Math.round(this.graphsize.x / this.divisions.x);
		divVal = (box.xmax - box.xmin) / this.divisions.x;
		for (var i = 0, pos = 0; i <= this.divisions.x; ++i) {
			if (i > 0 && i <= this.divisions.x) {
				var line = document.createElement("div");
				box.appendChild(line);
				line.className = "graphydiv";
				pos = ~~Math.round(i * divSize);
				line.style.left = pos+"px";
			}
			var txt = document.createElement("div");
			box.appendChild(txt);
			txt.innerHTML = ((box.xmin + i*divVal)/1.0e6).toFixed(1);
			txt.style.left = (i*divSize-15)+"px";
			txt.style.bottom = "-20px";
			txt.style.position = "absolute";
		}
	}
	this.createChannelBars = function(box) {
		for (var c = 0; c < config.maxChannels; ++c) {
			b = 1;
			if (!config.conf.band[b].ch[c].enable)
				continue;
			var fr;
			if (config.bwType == 0) {
				var frNr = config.conf.band[b].ch[c].frqNr;
				fr = config.computeChFreq(frNr, 1);
			} else {
				var chnr = [];
				chnr.push(config.conf.band[b].ch[c].frqNr);
				chnr.push(config.conf.band[b].ch[c].frqNrStop);
				var fr = [];
				for (var k = 0; k < 2; ++k) {
					var f = chnr[k] * factory.data.fstepAdj + factory.data.band[b].fo;
					fr.push(~~f);
				}
				fr = ~~Math.round((fr[0] + fr[1])/2);
			}
			if (fr < this.FreqMinHz || fr > this.FreqMaxHz)
				continue;
			var pos = ~~Math.round(this.graphsize.x * (fr - this.FreqMinHz) / (this.FreqMaxHz - this.FreqMinHz) + this.barwidth/2);
			var mark = document.createElement('div');
			mark.className = "spectmarkbar";
			mark.style.left = pos+"px";
			mark.style.height = (this.graphsize.y - 1) + "px";
			box.appendChild(mark);
		}
	}
	this.render = function(cont, data) {
		var id = "cont"+cont.id;
		var box = document.getElementById(id);
		if (box)
			remove_element(box);
		box = document.createElement("div");
		box.id = id;
		box.style.position = "relative";
		box.style.height = cont.style.height;
		box.ymin = cont.ymin;
		box.ymax = cont.ymax;
		box.h = cont.h;
		cont.appendChild(box);
		for (var i = 0; i < this.nchannels; ++i) {
			this.renderChannel(box, i, data[i]);
		}
	}
	this.renderChannel = function(box, ch, val) {
		var height, bar;
		if (val < box.ymin)
			height = 0;
		else if (val > box.ymax)
			height = box.h;
		else
			height = box.h * (val - box.ymin)/(box.ymax - box.ymin);
		height = ~~Math.round(height);
		var xpos = ~~Math.round(ch * this.graphsize.x / this.nchannels);
		if (height > 0) {
			bar = document.createElement('div');
			bar.className = "spectnormalbar"; 
			bar.id = box.id+ch;
			bar.h = height;
			bar.channelNr = ch;
			bar.style.width = this.barwidth + "px";
			bar.style.height = "1px";
			bar.style.top = (this.graphsize.y - height).toString()+"px";
			bar.style.left = xpos+"px";
			box.appendChild(bar);
		}
		this.interpolate(box, ch);
	}
	this.interpolate = function(box, ch) {
		var bc = document.getElementById(box.id + ch.toString());
		var bp = document.getElementById(box.id + (ch-1).toString());
		if (!bc && !bp)
			return;
		var xs = ch > 0 ? ~~Math.round((ch-1) * this.graphsize.x / this.nchannels) : 0;
		var xp = ~~Math.round(ch * this.graphsize.x / this.nchannels);
		var ys = bp ? bp.h : 0;
		var yp = bc ? bc.h : 0;
		var ln = document.createElement("div");
		ln.className = "spectnormalbar";
		ln.channelNr = ch;
		ln.style.width = "1px";
		ln.style.height = ~~Math.abs(Math.round(yp - ys)) + "px";
		ln.style.left = bc ? bc.style.left : xp+"px" ;
		var ym = yp > ys ? yp : ys;
		ln.style.top = (this.graphsize.y - ym).toString() + "px";
		box.appendChild(ln);
	}
	this.tableFilters = [[
				1.00000 ,
				1.01917 ,
				1.06987 ,
				1.12333 ,
				1.12214 ,
				1.02915 ,
				0.88007 ,
				0.72357 ,
				0.57267 ,
				0.42782 ,
				0.30064 ,
				0.20376 ,
				0.13725 ,
				0.09355 ,
				0.06497 ,
				0.04602 ,
				0.03319 ,
				0.02433 ,
				0.01807 ,
				0.01358 ,
				0.01029 ,
				0.00786 ,
				0.00603 ,
				0.00464 ,
				0.00357 ,
				0.00274 ,
				0.00210 ,
				0.00159 ,
				0.00119 ,
				0.00087 ,
				0.00062 ,
				0.00042 ,
				0.00026 ,
				0.00013 ,
				0.00003 ,
				0.00005 ,
				0.00011 ,
				0.00016 ,
				0.00020 ,
				0.00023 ,
				0.00026 ,
				0.00027 ,
				0.00029 ,
				0.00029 ,
				0.00030 ,
				0.00030 ,
				0.00030 ,
				0.00030 ,
				0.00029 ,
				0.00029 ,
				0.00028 ,
				0.00028 ,
				0.00027 ,
				0.00026 ,
				0.00025 ,
				0.00024 ,
				0.00024 ,
				0.00023 ,
				0.00022 ,
				0.00021 ,
				0.00020 ,
				0.00019 ,
				0.00018 ,
				0.00018 ,
				0.00017 ,
				0.00016 ,
				0.00015 ,
				0.00014 ,
				0.00014 ,
				0.00013 ,
				0.00012 ,
				0.00011 ,
				0.00011 ,
				0.00010 ,
				0.00009 ,
				0.00009 ,
				0.00008 ,
				0.00007 ,
				0.00007 ,
				0.00006 ,
				0.00006 
				],
				[
				1.00000	,
				0.98984	,
				1.02811	,
				1.06934	,
				0.54948	,
				0.22802	,
				0.10991	,
				0.05935	,
				0.03457	,
				0.02122	,
				0.01353	,
				0.00888	,
				0.00594	,
				0.00403	,
				0.00276	,
				0.00190	,
				0.00130	,
				0.00088	,
				0.00058	,
				0.00037	,
				0.00021	,
				0.00011	,
				0.00003	,
				0.00003	,
				0.00007	,
				0.00009	,
				0.00011	,
				0.00012	,
				0.00013	,
				0.00013	,
				0.00013	,
				0.00013	,
				0.00012	,
				0.00012	,
				0.00011	,
				0.00010	,
				0.00010	,
				0.00009	,
				0.00008	,
				0.00007	,
				0.00007	,
				0.00006	,
				0.00005	,
				0.00005	,
				0.00004	,
				0.00003	,
				0.00003	,
				0.00002	,
				0.00002	,
				0.00001	,
				0.00001	,
				0.000001	,
				0.000001	,
				0.00001	,
				0.00001	,
				0.00002	,
				0.00002	,
				0.00003	,
				0.00003	,
				0.00003	,
				0.00004	,
				0.00004	,
				0.00004	,
				0.00005	,
				0.00005	,
				0.00005	,
				0.00005	,
				0.00006	,
				0.00006	,
				0.00006	,
				0.00006	,
				0.00007	,
				0.00007	,
				0.00007	,
				0.00007	,
				0.00008	,
				0.00008	,
				0.00008	,
				0.00008	,
				0.00008	,
				0.00008
				],
				[
				1.00000 ,
                                1.04071 ,
				0.97071 ,
				0.39838 ,
				0.13838 ,
				0.05632 ,
				0.02591 ,
				0.01294 ,
				0.00681 ,
				0.00368 ,
				0.00199 ,
				0.00105 ,
				0.00050 ,
				0.00018 ,
				0.00001 ,
				0.00012 ,
				0.00018 ,
				0.00022 ,
				0.00023 ,
				0.00023 ,
				0.00022 ,
				0.00021 ,
				0.00020 ,
				0.00019 ,
				0.00017 ,
				0.00016 ,
				0.00014 ,
				0.00013 ,
				0.00012 ,
				0.00010 ,
				0.00009 ,
				0.00008 ,
				0.00007 ,
				0.00006 ,
				0.00005 ,
				0.00004 ,
				0.00003 ,
				0.00002 ,
				0.00002 ,
				0.00001 ,
				0.000001 ,
				0.000001 ,
				0.00001 ,
				0.00001 ,
				0.00002 ,
				0.00002 ,
				0.00003 ,
				0.00003 ,
				0.00004 ,
				0.00004 ,
				0.00004 ,
				0.00005 ,
				0.00005 ,
				0.00005 ,
				0.00006 ,
				0.00006 ,
				0.00006 ,
				0.00007 ,
				0.00007 ,
				0.00007 ,
				0.00007 ,
				0.00007 ,
				0.00008 ,
				0.00008 ,
				0.00008 ,
				0.00008 ,
				0.00008 ,
				0.00009 ,
				0.00009 ,
				0.00009 ,
				0.00009 ,
				0.00009 ,
				0.00009 ,
				0.00009 ,
				0.00010 ,
				0.00010 ,
				0.00010 ,
				0.00010 ,
				0.00010 ,
				0.00010 ,
				0.00010
				],
				[
				1.00000 ,
                                1.03227 ,
                                0.48929 ,
                                0.08331 ,
                                0.02364 ,
                                0.00865 ,
                                0.00364 ,
                                0.00165 ,
                                0.00077 ,
                                0.00036 ,
                                0.00015 ,
                                0.00005 ,
                                0.000001 ,
                                0.00002 ,
                                0.00003 ,
                                0.00003 ,
                                0.00002 ,
                                0.00002 ,
                                0.00001 ,
                                0.000001 ,
                                0.00001 ,
                                0.00002 ,
                                0.00002 ,
                                0.00003 ,
                                0.00004 ,
                                0.00004 ,
                                0.00005 ,
                                0.00006 ,
                                0.00006 ,
                                0.00006 ,
                                0.00007 ,
                                0.00007 ,
                                0.00008 ,
                                0.00008 ,
                                0.00008 ,
                                0.00008 ,
                                0.00009 ,
                                0.00009 ,
                                0.00009 ,
                                0.00009 ,
                                0.00010 ,
                                0.00010 ,
				0.00010 ,
				0.00010 ,
				0.00010 ,
				0.00010 ,
				0.00010 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
                                0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012
				],
				[
				1.00000 ,
                                1.07924 ,
				0.18925 ,
				0.03310 ,
				0.00941 ,
				0.00334 ,
				0.00133 ,
				0.00056 ,
				0.00023 ,
				0.00009 ,
				0.00003 ,
				0.000001 ,
				0.00001 ,
				0.000001 ,
				0.000001 ,
				0.00001 ,
				0.00002 ,
				0.00003 ,
				0.00004 ,
				0.00005 ,
				0.00005 ,
				0.00006 ,
				0.00006 ,
				0.00007 ,
				0.00007 ,
				0.00008 ,
				0.00008 ,
				0.00009 ,
				0.00009 ,
				0.00009 ,
				0.00010 ,
				0.00010 ,
				0.00010 ,
				0.00010 ,
				0.00010 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00011 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00012 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013 ,
				0.00013
				]];
	this.computeInput = function(rawData) {
		for (var i = 0; i <= this.nchannels; ++i) {
			this.inputSpectrum[i] = rawData[i];
		}
	}
	this.findNearestActiveChannelIndexInRange = function(chNr, range) {
		var minFrqNr = config.computeChNum(factory.data.band[1].fStart, 1);
		var maxFrqNr = config.computeChNum(factory.data.band[1].fStop, 1);
		for (var i = 0; i < range; ++i) {
			for (j = 0; j < 2; ++j) {
				var num = chNr + i*(j ? 1 : -1);
				if (num < minFrqNr || num > maxFrqNr)
					continue;
				var idxList = config.indexOfChannel(1, num);
				for (var k = 0; k < idxList.length; ++k) {
					if (!this.isChannelOnAndActive(idxList[k]))
						continue;
					return idxList[k];
				}					
			}
		}
		return -1;
	}
	this.isChannelOnAndActive = function(idx) {
		return config.isChannelOnAndActive(1, idx, monit.stat.band[1].ch[idx].signalIn);
	}
	this.computeOutput = function(inData) {
		for (var i = 0; i < this.nchannels; ++i) {
			var fr = this.FreqMinHz + this.FreqStepHz * i;
			var gain = this.computeGain(fr);
			this.outputSpectrum[i] = inData[i] + 20 * Math.log(gain) / Math.LN10;
		}
	}
	this.computeGain = function(fr) {
		var MINGAIN = 0.00001;
		if (!config.conf.band[1].hpaEnable)
			return (MINGAIN * this.maxChNr);
		var gain = MINGAIN;
		var frqNr = config.computeChNum(fr, 1);
		var fstepfactor = factory.data.fstep==3125?2:1;
		var idx = this.findNearestActiveChannelIndexInRange(frqNr, 80*fstepfactor);
		for (var i = 0; i < this.maxChNr; ++i) {
			if (!this.isChannelOnAndActive(i)) {
				gain += MINGAIN;
				continue;
			}
			var gainch = Math.pow(10, monit.stat.band[1].ch[i].gain / 20);
			if (i == idx) {
				var bw = config.conf.band[1].ch[idx].bandwidth;
				var ch_offset = ~~Math.round(Math.abs(frqNr - config.conf.band[1].ch[idx].frqNr) / fstepfactor);
				if (config.bwType == 0) {
					gain += gainch * this.tableFilters[bw][ch_offset];
				}
			} else {
				gain += gainch * MINGAIN;
			}
		}
		return gain;
	}
	this.createBandLimitsForm = function() {
		var cont = document.getElementsByTagName("body");
		var tab = document.createElement("table");
		tab.style.marginLeft = "15px";
		tab.style.marginTop = "50px";
		cont[0].appendChild(tab);
		var tb = document.createElement("tbody");
		tab.appendChild(tb);
		var tr = document.createElement("tr");
		tb.appendChild(tr)
		var td = document.createElement("th");
		tr.appendChild(td);
		td.innerHTML = "SPECTRUM&nbsp;FREQUENCY&nbsp;SPAN";
		td = document.createElement("th");
		tr.appendChild(td);
		td.innerHTML = "(1,&nbsp;2,&nbsp;3,&nbsp;4&nbsp;or&nbsp;5&nbsp;MHz)";
		var fs = parseInt(localStorage.getItem("spect_fs_1c3"+window.location.host));
		var fp = parseInt(localStorage.getItem("spect_fp_1c3"+window.location.host));
		var span;
		if (!isNaN(fs) && !isNaN(fp) && fp > fs
		    && fs >= factory.data.band[1].fStart && fs <= factory.data.band[1].fStop
		    && fp >= factory.data.band[1].fStart && fp <= factory.data.band[1].fStop) {
			span = fp - fs;
			if (this.spanMaxMHz * 1e6 < span) {
				span = this.spanMaxMHz * 1e6;
				fp = fs + span;
			}
			this.FreqMinHz = this.newFreqMinHz = fs;
			this.FreqMaxHz = this.newFreqMaxHz = fp;
		} else {
			span = ~~(Math.round((factory.data.band[1].fStop - factory.data.band[1].fStart)/1e5)*1e5);
			if (this.spanMaxMHz * 1e6 < span) {
				span = this.spanMaxMHz * 1e6;
			}
			var halfspan = ~~(Math.floor(span/2e5)*1e5);
			var center = ~~(Math.round((factory.data.band[1].fStart + factory.data.band[1].fStop)/2e5)*1e5);
			this.FreqMinHz = this.newFreqMinHz = center - halfspan;
			this.FreqMaxHz = this.newFreqMaxHz = center + halfspan;

		}
		this.nchannels = ~~Math.round(span / this.FreqStepHz) + 1;
		this.barwidth = ~~Math.round(this.graphsize.x / (this.nchannels - 1));
		for (var i = 0; i < 2; ++i) {
			tr = document.createElement("tr");
			tb.appendChild(tr)
			td = document.createElement("td");
			tr.appendChild(td);
			td.innerHTML = i == 0 ? "START&nbsp;FREQUENCY&nbsp;(MHz)" : "STOP&nbsp;FREQUENCY&nbsp;(MHz)";
			td = document.createElement("td");
			tr.appendChild(td);
			var el = document.createElement("input");
			el.type = "text";
			el.id = i == 0 ? "fstart" : "fstop";
			el.name = el.id;
			el.size = 11;
			el.onkeypress = function(ev) {
				ev = ev || window.event;
				if (ev.keyCode == 13) {
					spectrum.reSetBandLimits(ev);
					return true;
				} else {
					return isKeyDecimalNumber(ev); 
				}
			}
			var val = i == 0 ? this.FreqMinHz : this.FreqMaxHz;
			el.value = (val / 1e6).toFixed(1);
			td.appendChild(el);
		}
	};
	this.setBandLimits = function(fs, fp) {
		var s = document.getElementById("fstart");
		s.value = (fs / 1e6).toFixed(1);
		var p = document.getElementById("fstop");
		var f = Math.min(fp, fs + this.spanMaxMHz*1e6);
		p.value = (f / 1e6).toFixed(1);
	}
	this.getBandLimits = function() {
		this.bandChanged = this.FreqMinHz != this.newFreqMinHz || this.FreqMaxHz != this.newFreqMaxHz;
		if (this.bandChanged) {
			this.FreqMinHz = this.newFreqMinHz;
			this.FreqMaxHz = this.newFreqMaxHz;
			this.nchannels = ~~Math.round((this.FreqMaxHz - this.FreqMinHz) / this.FreqStepHz) + 1;
			this.barwidth = ~~Math.round(this.graphsize.x / (this.nchannels - 1));
			localStorage.setItem("spect_fs_1c3"+window.location.host, this.FreqMinHz);
			localStorage.setItem("spect_fp_1c3"+window.location.host, this.FreqMaxHz);
		}
		var r = hexformat(this.FreqMinHz, 8);
		r += hexformat(this.FreqMaxHz, 8);
		return r;
	}
	this.reSetBandLimits = function(ev) {
		var target = ev ? ev.target || false : false;
		var fs, fp;
		if (!target || (target && target.id == "fstart")) {
			var el = document.getElementById("fstart");
			fs = ~~Math.round(parseFloat(el.value)*10)*1e5;
			if (fs < factory.data.band[1].fStart) {
				fs = factory.data.band[1].fStart;
			} else if (fs >= factory.data.band[1].fStop) {
				fs = this.FreqMinHz;
			}
			el = document.getElementById("fstop");
			fp = ~~Math.round(parseFloat(el.value)*10)*1e5;
			var diff = ~~Math.round((fp - fs)/1e6);
			if (diff < this.spanMinMHz)
				diff = this.spanMinMHz;
			else if (diff > this.spanMaxMHz)
				diff = this.spanMaxMHz;
			fp = fs + diff*1e6;
			if (fp > factory.data.band[1].fStop) {
				fp = factory.data.band[1].fStop;
				fs = fp - diff*1e6;
			}
		} else {
			var el = document.getElementById("fstop");
			fp = ~~Math.round(parseFloat(el.value)*10)*1e5;
			if (fp > factory.data.band[1].fStop) {
				fp = factory.data.band[1].fStop;
			} else if (fp <= factory.data.band[1].fStart) {
				fp = this.FreqMaxHz;
			}
			el = document.getElementById("fstart");
			fs = ~~Math.round(parseFloat(el.value)*10)*1e5;
			var diff = ~~Math.round((fp - fs)/1e6);
			if (diff < this.spanMinMHz)
				diff = this.spanMinMHz;
			else if (diff > this.spanMaxMHz)
				diff = this.spanMaxMHz;
			fs = fp - diff*1e6;
			if (fs < factory.data.band[1].fStart) {
				fs = factory.data.band[1].fStart;
				fp = fs + diff*1e6;
			}
		}
		this.newFreqMinHz = fs;
		this.newFreqMaxHz = fp;
		var el = document.getElementById("fstart");
		el.value = (this.newFreqMinHz / 1e6).toFixed(1);
		el = document.getElementById("fstop");
		el.value = (this.newFreqMaxHz / 1e6).toFixed(1);
	}
	this.maxChNr = maxChNr;
	this.inContentbox = document.getElementById("inContentbox");
	this.outContentbox = document.getElementById("outContentbox");
	this.inYscale = {min: -100.0, max: 0.0 };
	this.outYscale = {min: -50.0, max: 50.0};
	this.divisions = {x: 10, y: 10};
	this.graphsize = {x: 800, y: 240};
	this.FreqStepHz = 6250;
	this.spanMinMHz = 1;
	this.spanMaxMHz = 5;
	this.FreqMinHz;
	this.FreqMaxHz;
	this.newFreqMinHz;
	this.newFreqMaxHz;
	this.nchannels;
	this.createBandLimitsForm();
	this.countGets = 0;
	this.MAXCOUNTGETS = 30;
	this.bandChanged = false;
	this.barwidth;
}
function submitform() {
	spectrum.reSetBandLimits();
}
// -->
