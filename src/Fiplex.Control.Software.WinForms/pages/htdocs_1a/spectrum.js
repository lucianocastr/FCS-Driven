<!--
var maxChNr = 8;
var frqStepHz = 25000;
var factory;
var config;
var monit;
var spectrum;
var timerId;

function onloadInit() {
	factory = new Factory();
	config = new Config(maxChNr);
	monit = new Monitor(maxChNr);
	spectrum = new Spectrum(maxChNr);
	factReq();
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
					setTimeout(function() { load_spectrum(); }, 1000);
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
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("POST", "/spectrum.zhtml", true);
		xhr.timeout = 25000;
		xhr.send("spect_req="+1);
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
					spectrum.parse(serverResponse);
				}
				tmrId = setTimeout(function() { load_status(); }, 1000);
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
	this.maxChNr = maxChNr;
	this.inContentbox = document.getElementById("inContentbox");
	this.outContentbox = document.getElementById("outContentbox");
	this.inYscale = {min: -100.0, max: -20.0 };
	this.outYscale = {min: -40, max: 40.0};
	this.divisions = {x: 10, y: 8};
	this.graphsize = {x: 800, y: 240};
	this.barwidth = 4;
	this.BandWidth = 5.0e6;
	this.MinChannels = 200;
	this.nchannels = this.MinChannels;
	this.rawInput = new Array(this.nchannels + 1);
	this.inputSpectrum = new Array(this.nchannels + 1);
	this.outputSpectrum = new Array(this.nchannels + 1);
	this.adjacentChannelsWarn = new Array(this.nchannels + 1);
	this.pointedChannel;
	
	this.parse = function(sr) {
		var dnXscale = {
			min: factory.data.band[1].frqBand,
			max: (factory.data.band[1].frqBand + this.BandWidth),
			step: frqStepHz
		};
		if (!this.inSpectBox) {
			this.nchannels = this.MinChannels + (config.conf.freqOffset == 1 ? 0 : 1);
			this.inSpectBox = this.getNewGraphBox("inSpectBox", this.inYscale, dnXscale);
			document.getElementById("inContentbox").appendChild(this.inSpectBox);
			this.graphAddDivs(this.inSpectBox);
			this.createChannelBars(this.inSpectBox);
		}
		if (!this.outSpectBox) {
			this.nchannels = this.MinChannels + (config.conf.freqOffset == 1 ? 0 : 1);
			this.outSpectBox = this.getNewGraphBox("outSpectBox", this.outYscale, dnXscale);
			document.getElementById("outContentbox").appendChild(this.outSpectBox);
			this.graphAddDivs(outSpectBox);
			this.createChannelBars(this.outSpectBox);
		}
		for (var ch = 0, n = 0; ch < this.nchannels; ++ch) {
			try {
				var num = parseInt(sr.substr(n, 4), 16);
				this.rawInput[ch] = (isNaN(num) ? this.inYscale.min : to_float(num));
				n += 4;
			} catch (err) { }
		}
		this.computeInput(this.rawInput);
		this.computeOutput(this.inputSpectrum);
		this.computeAdjacentChannels(this.outputSpectrum);
		this.render(inSpectBox, this.inputSpectrum);
		this.render(outSpectBox, this.outputSpectrum);
		this.renderPointedChannel(this.pointedChannel);
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
		box.xstep = xScale.step;
		box.xoff = config.conf.freqOffset * xScale.step / 2;
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
		divSize = this.graphsize.x / this.divisions.x;
		divVal = (box.xmax - box.xmin) / this.divisions.x;
		for (var i = 0; i <= this.divisions.x; ++i) {
			if (i > 0 && i < this.divisions.x) {
				var line = document.createElement("div");
				box.appendChild(line);
				line.className = "graphydiv";
				line.style.left = (i*divSize)+"px";
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
		for (var i = 0; i < this.nchannels; ++i) {
			var xpos = config.conf.freqOffset == 0 ? (i*this.barwidth-2) : (i*this.barwidth);
			var bar = document.createElement("div");
			box.appendChild(bar);
			bar.className = "specthidbar";
			bar.style.left = xpos+"px";
			bar.style.height = box.h + "px";
			bar.channelNr = i;
			bar.onmouseover = function(ev) {
				ev = ev || window.event;
				if (spectrum) {
					var target = ev.target ? ev.target : ev.srcElement;
					spectrum.pointedChannel = target.channelNr;
				}
			}
			bar.onmouseout = function(ev) {
				ev = ev || window.event;
				if (spectrum)
					spectrum.pointedChannel = -1;
			}
			bar = document.createElement("div");
			box.appendChild(bar);
			bar.id = box.id == "inSpectBox" ? "inBar"+i : "outBar"+i;
			bar.className = box.id == "inSpectBox" ? "spectinbar" : "spectoutbar";
			bar.fr = (i*box.xstep + box.xmin + box.xoff)/1.0e6;
			bar.style.left = xpos+"px";
			bar.channelNr = i;
			bar.onmouseover = function(ev) {
				ev = ev || window.event;
				if (spectrum) {
					var target = ev.target ? ev.target : ev.srcElement;
					spectrum.pointedChannel = target.channelNr;
				}
			}
			bar.onmouseout = function(ev) {
				ev = ev || window.event;
				if (spectrum)
					spectrum.pointedChannel = -1;
			}
		}
	}
	this.render = function(box, data) {
		for (var i = 0; i < this.nchannels; ++i) {
			this.renderChannel(box, i, data[i]);
		}
	}
	this.renderChannel = function(box, ch, val) {
		var height, bar;
		var isInput = box.id == "inSpectBox";
		if (val < box.ymin)
			height = 0;
		else if (val > box.ymax)
			height = box.h;
		else
			height = box.h * (val - box.ymin)/(box.ymax - box.ymin);
		bar = document.getElementById(isInput ? "inBar"+ch : "outBar"+ch);
		if (!bar)
			return;
		bar.val = val;
		bar.style.height = height+"px";
		var idx = config.conf.channel.indexOf(ch);
		if (idx < 0) {
			if (isInput) {
				bar.className = "spectnormalbar";
			} else {
				if (this.adjacentChannelsWarn[ch])
					bar.className = "warningbar";
				else
					bar.className = "spectnormalbar";
			}
		} else {
			if (this.isChannelOnAndActive(idx))
				bar.className = "activebar";
			else
				bar.className = "spectnormalbar";
		}
	}
	this.renderPointedChannel = function(ch) {
		var tip, bar;
		tip = document.getElementById("outSpectTip");
		if (tip) {
			if (ch < 0) {
				tip.innerHTML = "";
			} else {
				bar = document.getElementById("outBar"+ch);
				if (bar) {
					var msg = bar.val < -60 ? "< -60dBm:" : bar.val.toFixed(1)+"dBm:";
					msg += bar.fr.toFixed(4)+"MHz";
					tip.innerHTML = msg;
				}
			}
		}
		tip = document.getElementById("inSpectTip");
		if (tip) {
			if (ch < 0) {
				tip.innerHTML = "";
			} else {
				bar = document.getElementById("inBar"+ch);
				if (bar) {
					var msg = bar.val.toFixed(1)+"dBm:"+bar.fr.toFixed(4)+"MHz";
					tip.innerHTML = msg;
				}
			}
		}
	}
	this.tableFilters = [[1                   ,
			     0.9885530947         ,
			     0.5956621435         ,
			     0.0954992586         ,
			     0.0223872114         ,
			     0.0069183097         ,
			     0.0022387211         ,
			     0.0006309573         ,
			     7.67361489361819E-05 ,
			     0.0001757924         ,
			     0.0002371374         ,
			     0.0002344229         ,
			     0.0002884032         ,
			     0.0001659587         ,
			     0.0001230269         ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001 ],
			    [1                    ,
			     0.5888436554         ,
			     0.027542287          ,
			     0.0025118864         ,
			     0.0001584893         ,
			     0.0002238721         ,
			     0.0001995262         ,
			     0.0001258925         ,
			     5.01187233627272E-05 ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001 ],
			    [1                    ,
			     0.2238721139         ,
			     0.0035481339         ,
			     0.0001778279         ,
			     0.0001995262         ,
			     8.91250938133746E-05 ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001               ,
			     0.0001 ]
			    ];
	this.computeInput = function(rawData) {
		for (var i = 0; i < this.nchannels; ++i) {
			this.inputSpectrum[i] = rawData[i] + this.computeInputCorrection(i);
		}
	}
	this.computeInputCorrection = function(channel) {
		var idx = this.findNearestActiveChannelIndexInRange(channel, 10);
		if (idx < 0)
			return 0;
		var num = Math.pow(10, (monit.stat.band[1].ch[idx].gain - monit.stat.band[1].ch[idx].isolMod) / 20);
		var g2alpha = new Array(2);
		g2alpha[0] = num * Math.cos(monit.stat.band[1].ch[idx].isolPh * Math.PI / 180);
		g2alpha[1] = num * Math.sin(monit.stat.band[1].ch[idx].isolPh * Math.PI / 180);
		var bw = config.conf.band[1].ch[idx].bandwidth;
		var tau = 0.0000116 * (bw + 1) + 0.0000034 + 0.000004 * factory.data.band[1].delayOffset;
		var ch = config.conf.channel[idx];
		var ch_offset = channel - ch;
		var abs_ch_offset = Math.abs(ch_offset);
		var chcorravg = new Array(2);
		var chcorr = 0;
		for (var k = -1; k <= 1; ++k) {
			chcorravg[0] = 0;
			chcorravg[1] = 0;
			var freq = -(frqStepHz * ch_offset + k * 5000);
			chcorravg[0] = 1 - this.tableFilters[bw][abs_ch_offset] * g2alpha[0] * Math.cos(2 * Math.PI * freq * tau);
			chcorravg[0] += this.tableFilters[bw][abs_ch_offset] * g2alpha[1] * Math.sin(2 * Math.PI * freq * tau);
			chcorravg[1] = -this.tableFilters[bw][abs_ch_offset] * g2alpha[1] * Math.cos(2 * Math.PI * freq * tau);
			chcorravg[1] -= this.tableFilters[bw][abs_ch_offset] * g2alpha[0] * Math.sin(2 * Math.PI * freq * tau);
			chcorr += chcorravg[0] * chcorravg[0] + chcorravg[1] * chcorravg[1];
		}
		fcorr = -10 * Math.log(chcorr / 3) / Math.LN10;
		return fcorr;
	}
	this.findNearestActiveChannelIndexInRange = function(channel, range) {
		var idx = -1;
		for (var i = 0; i < range; ++i) {
			for (j = 0; j < 2; ++j) {
				var ch = channel + i*(j ? 1 : -1);
				if (ch < 0 || ch > this.nchannels)
					continue;
				idx = config.conf.channel.indexOf(ch);
				if (idx < 0)
					continue;
				if (!this.isChannelOnAndActive(idx))
					continue;
				return idx;
			}
		}
		return idx;
	}
	this.isChannelOnAndActive = function(idx) {
		if (idx < 0 || idx > this.maxChNr)
			return false;
		if (!config.conf.band[1].ch[idx].enable)
			return false;
		if (!monit.stat.band[1].ch[idx].signalIn) {
			if (config.conf.band[1].squelchEnable || config.conf.control.tracking)
				return false;
		}
		return true;
	}
	this.computeOutput = function(inData) {
		for (var i = 0; i < this.nchannels; ++i) {
			var gain = this.computeGain(i);
			this.outputSpectrum[i] = inData[i] + 20 * Math.log(gain) / Math.LN10;
		}
	}
	this.computeGain = function(channel) {
		var MINGAIN = 0.0001;
		if (!config.conf.band[1].hpaEnable)
			return (MINGAIN * this.maxChNr);
		var gain = MINGAIN;
		var idx = this.findNearestActiveChannelIndexInRange(channel, 10);
		for (var i = 0; i < this.maxChNr; ++i) {
			if (!this.isChannelOnAndActive(i)) {
				gain += MINGAIN;
				continue;
			}
			var gainch = Math.pow(10, monit.stat.band[1].ch[i].gain / 20);
			if (i == idx) {
				var bw = config.conf.band[1].ch[idx].bandwidth;
				var ch_offset = Math.abs(channel - config.conf.channel[idx]);
				gain += gainch * this.tableFilters[bw][ch_offset];
			} else {
				gain += gainch * MINGAIN;
			}
		}
		return gain;
	}
	this.computeAdjacentChannels = function(outdata) {
		for (var i = 0; i < this.nchannels; ++i) {
			this.adjacentChannelsWarn[i] = false;
			if (!config.conf.band[1].hpaEnable)
				continue;
			var nearestChIndex = this.findNearestActiveChannelIndexInRange(i, 10);
			if (nearestChIndex < 0)
				continue;
			var active_channel = config.conf.channel[nearestChIndex];
			if (outdata[i] > outdata[active_channel] - factory.data.band[1].spectWarn)
				this.adjacentChannelsWarn[i] = true;
		}
	}
}
// -->
