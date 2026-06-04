var Prjstr = "_2c3_";

/*var FilterTypes = [
			{'name': "150", 'bw3dB': [ 172.9, 330.1, 489.5, 652.1, 814.7], 'delay': 11.0, 'ftool': true, 'validSep': 162.5},
			{'name': "100", 'bw3dB': [ 118.4], 'delay': 13.2, 'ftool': false},
			{'name': "75",  'bw3dB': [  99.0, 191.4, 291.1, 391.1, 491.1], 'delay': 14.5, 'ftool': true, 'validSep': 100.0},
			{'name': "62.5",'bw3dB': [  73.8], 'delay': 17.4, 'ftool': false},
			{'name': "50",  'bw3dB': [  59.2], 'delay': 20.1, 'ftool': false},
			{'name': "37.5",'bw3dB': [  44.2], 'delay': 24.8, 'ftool': false},
			{'name': "25",  'bw3dB': [  29.2], 'delay': 34.3, 'ftool': false},
			{'name': "12.5",'bw3dB': [  15.2], 'delay': 61.4, 'ftool': false}
];*/
var FilterTypes = [ //with BW3dB being actually BW1.5dB to improve grouped filters behaviors with AGC
			{'name': "150", 'bw3dB': [ 154.6, 308.8, 465.1, 627.8, 790.4], 'delay': 11.0, 'ftool': true, 'validSep': 162.5},
			{'name': "100", 'bw3dB': [ 118.4], 'delay': 13.2, 'ftool': false},
			{'name': "75",  'bw3dB': [  88.8], 'delay': 14.5, 'ftool': false},
			{'name': "62.5",'bw3dB': [  73.8], 'delay': 17.4, 'ftool': false},
			{'name': "50",  'bw3dB': [  59.2], 'delay': 20.1, 'ftool': false},
			{'name': "37.5",'bw3dB': [  44.2], 'delay': 24.8, 'ftool': false},
			{'name': "25",  'bw3dB': [  29.2], 'delay': 34.3, 'ftool': false},
			{'name': "12.5",'bw3dB': [  15.2], 'delay': 61.4, 'ftool': false}
];
function tryConsole(m) {
	if (typeof console !== "undefined")
		console.log(m);
}
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
(function() {
	if (!Array.prototype.indexOf) {
		Array.prototype.indexOf = function (searchElement, fromIndex) {
			if ( this === undefined || this === null ) {
				throw new TypeError( '"this" is null or not defined' );
			}
			var length = this.length >>> 0;
			fromIndex = +fromIndex || 0;
			if (Math.abs(fromIndex) === Infinity) {
				fromIndex = 0;
			}
			if (fromIndex < 0) {
				fromIndex += length;
				if (fromIndex < 0) {
					fromIndex = 0;
				}
			}
			for (;fromIndex < length; fromIndex++) {
				if (this[fromIndex] === searchElement) {
					return fromIndex;
				}
			}
			return -1;
		};
	}
})();
(function() {
	if(typeof String.prototype.isPrintable !== 'function'){
		String.prototype.isPrintable=function(){
			var re=/[^ -~]/;
			return !re.test(this);
		}
	}
})();
(function() {
	if(typeof String.prototype.trim !== 'function'){
		  String.prototype.trim = function() {
			return this.replace(/^\s+|\s+$/g, ''); 
		}
	}
})();

var last;
function h(t) {
	if (typeof last == "undefined") {
		last = window.parent.navi.document.getElementById('start');
	}
	last.className = 'n';
	t.className = 'nh';
	t.blur();
	last = t;
}

function getFrameSizeById(frameID) {
	var result = {height:0, width:0};
	var frame = parent.document.getElementById(frameID);
	if (!frame)
		frame = parent.parent.document.getElementById(frameID);
        if (frame && frame.scrollWidth) {
		result.height = frame.scrollHeight;
		result.width = frame.scrollWidth;
        }
	return result;
}

function getWindowPosition() {
	var result = {x:0, y:0};
	if (navigator.appName.indexOf("Netscape")!=-1 && parseInt(navigator.appVersion)>=5) {
		result.x = window.screenX;
		result.y = window.screenY;
	} else if (navigator.appName.indexOf("Microsoft")!= -1 && parseInt(navigator.appVersion)>=4) {
		result.x = window.screenLeft;
		result.y = window.screenTop;
	}
	return result;
}

function remove_element(el)
{
	if (!el)
		return;
	while (el.lastChild)
		el.removeChild(el.lastChild);
	var parent = el.parentNode;
	parent.removeChild(el);
}

function remove_children(node)
{
	if (!node)
		return;
	while (node.lastChild)
		node.removeChild(node.lastChild);
}

function ptq(q) {
	var x = q.replace(/;/g, '&').split('&'), i, name, t;
	for (q={}, i=0; i<x.length; i++) {
		t = x[i].split('=', 2);
		name = unescape(t[0]);
		if (!q[name])
			q[name] = [];
		if (t.length > 1)
			q[name][q[name].length] = unescape(t[1]);
		else
			q[name][q[name].length] = true;
	}
	return q;
}

function loadPageVar(sVar) {
	return decodeURI(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURI(sVar).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
}

function param() {
	return ptq(location.search.substring(1).replace(/\+/g, ' '));
}

function entify(s) {
	return (''+s).
	replace(/&/g, '&amp;').
	replace(/</g, '&lt;').
	replace(/"/g, '&quot;').
	replace(/>/g, '&gt;');
}

function cursorWait() {
	document.body.style.cursor = 'wait';
}

function cursorClear() {
	document.body.style.cursor = 'default';
}

var ERR_OK = 0;
var ERR_FAIL = -1;
var ERR_PENDING = -2;
var ERR_NONE = -3;

function to_float(numInt) {
	var num = Number();	
	if (numInt > 32767)
		numInt -= 65536;
	num = numInt / 256;
	return(num);
}

function to_ufloat(numInt) {
	var num = Number();	
	num = numInt / 256;
	return(num);
}

function cSignedByte(num) {
	if (typeof(num) !== "undefined" && !isNaN(num)) {
		if (num > 127)
			num -= 256;
	} else {
		num = -128;
	}
	return num;
}
function cSignedInt(num) {
	if (typeof(num) !== "undefined" && !isNaN(num)) {
		if (num > 32767)
			num -= 65536;
	} else {
		num = -65536;
	}
	return num;
}
function rSignedByte(num) {
	if (typeof(num) !== "undefined" && !isNaN(num)) {
		if (num < 0)
			num += 256;
	}
	return num;
}
function rSignedInt(num) {
	if (typeof(num) !== "undefined" && !isNaN(num)) {
		if (num < 0)
			num += 65536;
	}
	return num;
}
function hexformat(number, width) {
	var num = new Number(number);
	var str = num.toString(16);
	while (str.length < width) str = "0" + str;
	if (str.length > width) str = str.substring(str.length - width);
	return str.toUpperCase();
}
function double_to_uint(fval)
{
	var v = Math.round(fval * 256);
	if (v > 32767)
		v = 32767;
	else if (v < -32767)
		v = -32767;
	if (v < 0)
		v += 65536;
	return v;
}
function isKeyDecimalNumber(ev) {
	ev = ev || window.event;
	var c = ev.which || ev.keyCode;
	var charcode = ev.charCode ? ev.charCode : ev.keyCode;
	var isvalid = (c == 8 || c == 9 || c == 16 || c == 20 || 
		c == 35 || c == 36 || c == 37  || c == 39 || c == 46);
	var ispunct = (c == 43 || c == 45 || c == 46 || c == 190 || c==109 || c==189);
	if ((c >= 48 && c <= 57) || isvalid || ispunct)
		return true;
	else
		return charcode === 0;
}
function isKeyDecimalPositive(ev) {
	ev = ev || window.event;
	var c = ev.which || ev.keyCode;
	var charcode = ev.charCode ? ev.charCode : ev.keyCode;
	var isnavi = (c >= 33 && c <= 40);
	var isdel = (c == 8 || c == 46);
	var ispunct = (c == 110 || c == 190);
	var isdec = (c >= 48 && c <= 57);
	if (isdec || ispunct || isnavi || isdel) {
		return true;
	} else {
		return charcode === 0;
	}
}
function isSpaceChar(ev) {
	ev = ev || window.event;
	var c = ev.which || ev.keyCode;
	var charcode = ev.charCode ? ev.charCode : ev.keyCode;
	var isSpace = (c == 9 || c == 32 || c == 13);
	if (isSpace) {
		return true;
	} else {
		return charcode === 0;
	}
}
function isCtrlVC(ev) {
	ev = ev || window.event;
	var c = ev.which || ev.keyCode;
	var charcode = ev.charCode ? ev.charCode : ev.keyCode;
	var ctrlDown = false;
	var ctrlKey = 17, vKey = 86, cKey = 67;
	if (c === ctrlKey){
		ctrlDown = true;
	}
	var isc = (c === ctrlKey) || (c === vKey || c === cKey) && ctrlDown;
	if (isc) {
		return true;
	} else {
		return charcode === 0;
	}
}

function isText(ev) {
	ev = ev || window.event;
	var c = ev.which || ev.keyCode;
	var charcode = ev.charCode ? ev.charCode : ev.keyCode;
	var isAscii = (c >= 0x20 && c < 0x7F);
	var isBs = (c == 0x08);
	var isDel = (c == 0x7F);
	if (isAscii || isBs || isDel) {
		return true;
	} else {
		return charcode === 0;
	}
}

function numbersOnly(ev) {
	ev = ev || window.event;
	var c = ev.which || ev.keyCode;
	var charcode = ev.charCode ? ev.charCode : ev.keyCode;
	var isvalid = (c == 8 || c == 9 || c == 16 || c == 20 || 
		c == 35 || c == 36 || c == 37  || c == 39 || c == 46);
	var ispunct = (c == 45 || c == 109 || c == 189);
	if ((c >= 48 && c <= 57) || isvalid)
		return true;
	else
		return charcode === 0;
}
function hexNumbersOnly(ev) {
	ev = ev || window.event;
	var c = ev.which || ev.keyCode;
	var charcode = ev.charCode ? ev.charCode : ev.keyCode;
	var isvalid = (c == 8 || c == 9 || c == 16 || c == 20 || 
		c == 35 || c == 36 || c == 37  || c == 39);
	if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102) || isvalid)
		return true;
	else
		return charcode === 0;
}

function isHex(str){
	var re = /^[0-9a-fA-F]+$/;
	return re.test(str);
}

var fList = new Object();
function initFormChangeCheck() {
	for (var fOi = 0; fOi < document.forms[0].elements.length; fOi++) {
		var el = document.forms[0].elements[fOi];
		switch (el.type) {
		case "password":
		case "hidden":
		case "text": fList[el.name] = el.value; break;
		case "button": fList[el.name] = el.value; break;
		case "checkbox": fList[el.name] = el.checked; break;
		case "select-one": fList[el.name] = el.selectedIndex; break;
		}
	}
}
function inputDisable(val)
{
	try {
		for (var fOi = 0; fOi < document.forms[0].elements.length; fOi++) {
			var el = document.forms[0].elements[fOi];
			el.disabled = val;
		}
	}catch(err){}
}
function checkChange() {
	var changed = false;
	for (var fOi = 0; fOi < document.forms[0].elements.length; fOi++) {
		var el = document.forms[0].elements[fOi];
		if (el.name == "")
			continue;
		switch (el.type) {
		case "password":
		case "hidden":
		case "text": changed = (fList[el.name] != el.value); break;
		case "button": changed = (fList[el.name] != el.value); break;
		case "checkbox": changed = (fList[el.name] != el.checked); break;
		case "select-one": changed = (fList[el.name] != el.selectedIndex); break;
		}
		if (changed)
			break;
	}
	return changed;
}
function MovingIcon(el) {
	this.redraw = function() {
		if (this.el){
			this.el.src = "/i/processing.png";
			this.nr += 22.5;
			this.el.setAttribute('style','transform:rotate('+this.nr+'deg)');
		}
		var self = this;
		this.tmr = setTimeout(function(ev) { self.redraw(); }, 100);
	}
	this.cancel = function() {
		if (typeof(this.tmr) !== "undefined")
			clearTimeout(this.tmr);
		this.nr = 0;
		this.pos.x = 0;
		this.dir = 1;
	}
	this.nr = 0;
	this.MaxNr = 10;
	this.dir = 1;
	this.tmr;
	this.pos = {x: 0};
	this.el = el || 0;
}
function showResultIcon(num,index) {
	try {
		if (typeof index === "undefined") index="";
		var waitIcon;
		var el = document.getElementById("cmdResult"+index);
		if (el){
			waitIcon = window.waitIcon;
		} else {
			el = window.parent.navi.document.getElementById("cmdResult"+index);
			waitIcon = window.parent.navi.waitIcon;
		}
		waitIcon.cancel();
		el.style.position = "inherit";
		el.style.width = "45px";
		el.style.height = "45px";
		switch (num) {
		default:
		case ERR_NONE:  el.src = "/i/blank.gif"; break;
		case ERR_OK: 	el.setAttribute('style','transform:rotate(0deg)'); el.src = "/i/tick.png"; break;
		case ERR_FAIL: 	el.setAttribute('style','transform:rotate(0deg)'); el.src = "/i/cross.png"; break;
		case ERR_PENDING: el.src = "/i/processing.png"; waitIcon.redraw(); break;
		}
	} catch (err) {}
}
function anchorsDisable(doDisable) {
	try {
		var aa = window.parent.navi.document.getElementsByTagName("a");
		if (doDisable) {
			for (var i = 0; i < aa.length; ++i) {
				if (aa[i].disabled === true) {
					continue;
				}
				aa[i].disabled = true;
				var href = aa[i].href;
				aa[i].setAttribute("rel", href);
				aa[i].href = "javascript:void(0);";
			}
		} else {
			for (var i = 0; i < aa.length; ++i) {
				if (aa[i].disabled === false) {
					continue;
				}
				aa[i].disabled = false;
				var href = aa[i].getAttribute("rel");
				if (!href || href.substr(-4) == "null") {
					continue;
				}
				aa[i].removeAttribute("rel");
				aa[i].href = href;
			}
		}
	} catch(e) {}
}
function guiBlocked(doBlock) {
	if (doBlock) {
		window.top.submitLocked = true;
		if (typeof(cliksDisable) !== "undefined")
			clicksDisable(true);
		inputDisable(true);
		anchorsDisable(true);
		cursorWait();
	} else {
		window.top.submitLocked = false;
		if (typeof(cliksDisable) !== "undefined")
			clicksDisable(false);
		inputDisable(false);
		anchorsDisable(false);
		if (typeof(refreshEnables) !== "undefined")
			refreshEnables();
		cursorClear();
		showResultIcon(ERR_NONE);
	}
}
function xmlreq() {
	if (window.XMLHttpRequest) {
		req = new XMLHttpRequest();
	} else if (window.ActiveXObject) {
		try {
			req = new ActiveXObject("Microsoft.XMLHTTP");
		} catch (e) {
			try {
				req = new ActiveXObject("MSXML2.XMLHTTP");
			} catch (e) {}
		}
	}
	return(req);
}
function getCursorPosX(e) {
	var posx = 0;
	e = e || window.event;
	if (e.pageX) {
		posx = e.pageX;
	} else if (e.clientX) {
		posx = e.clientX + document.body.scrollLeft
			+ document.documentElement.scrollLeft;
	}
	return posx;
}
function getCursorRelPosX(el, ev) {
	var bound = el.getBoundingClientRect();
	var x = getCursorPosX(ev);
	if (x < bound.left || x > bound.right)
		return -1;
	return x - bound.left;
}

function BallIcon(el, lim) {
	var self = this;
	this.el = el || 0;
	this.lim = lim || 0;
	this.nr = 0;
	this.MaxNr = 10;
	this.Ref = this.MaxNr*(1+this.lim/100);
	this.dir = 1;
	this.tmr;
	this.pos = {x: 0};
	this.redraw = function() {
		if (this.el) {
			this.el.style.position = "relative";
			this.el.style.right = (this.pos.x)+"%";
			this.el.style.width = "25px";
			this.el.style.height = "25px";
			this.el.src = "/i/processing.png";
		}
		this.nr += this.dir;
		if (this.nr <= 0 || this.nr >= 2*this.MaxNr) {
			this.dir = -this.dir;
		}
		this.pos.x = ~~Math.round((self.nr - this.MaxNr) * 100 / this.Ref);
		this.tmr = setTimeout(function(ev) { self.redraw(); }, 100);
	}
	this.cancel = function() {
		if (typeof(this.tmr) !== "undefined")
			clearTimeout(this.tmr);
		this.nr = 0;
		this.pos.x = 0;
		this.dir = 1;
	}
}

function inArray(arr, val) {
	for (var i = 0; i < arr.length; ++i) {
		if (arr[i] == val) {
			return true;
		}
	}
	return false;
}

function correctASCII(str){
	var aux = "";
	for (var k=0;k<str.length;k++){
		if (str.charCodeAt(k)>0x7f)
			aux += " ";
		else
			aux += str.substr(k,1);
	}
	return aux;
}
function correctASCIIOnlyText(str){
	var aux = "";
	for (var k=0;k<str.length;k++){
		if (str.charCodeAt(k)>0x7f || str.charCodeAt(k)<0x20)
			aux += " ";
		else
			aux += str.substr(k,1);
	}
	return aux;
}
function getCurrentDate(formatfile){
	var d = new Date();
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var lbl="";
	if (!formatfile){
		lbl += d.getDate()+"/"+months[d.getMonth()]+"/"+d.getFullYear()+"  ";
		lbl += d.getHours()+":"+("0"+d.getMinutes()).substr(-2,2)+":"+("0"+d.getSeconds()).substr(-2,2);	
	}else{
		lbl += ("0"+d.getFullYear()).substr(-4,4)+("0"+(d.getMonth()+1)).substr(-2,2)+("0"+(d.getDate())).substr(-2,2)+"_";
		lbl += ("0"+d.getHours()).substr(-2,2)+("0"+d.getMinutes()).substr(-2,2)+("0"+(d.getSeconds())).substr(-2,2);
	}

	return lbl;
}
function numEnabledFilts(band, na, cfg, fact) {
	var n=0;
	var num;
	if (na==0){
		num = cfg.CHNR;
	}else{
		num = fact.numADJFilters;
	}
	for(var b=0;b<2;b++){
		for (var k=0;k<=num;k++){
			if (cfg.filterEnabled[na][b][1][k] && cfg.filterBand[na][b][1][k]==band) n++;
		}
	}
	return n;
}
function reorganizeChFilters(currentCnf, newCnf, otherBand, nstartOtherBand){
	//place the other band filters staring in nstartOtherBand
	//disable all filters first
	var N = currentCnf.CHNR;
	var ncch = currentCnf.controlChannel[otherBand];
	for (var b=0; b<2; ++b){
		for (var fb=0; fb<2; ++fb){
			for (var c = 0; c < N; ++c) {
				newCnf.filterEnabled[0][fb][b][c] = false;
			}
		}
	}
	//copy filter info of the other band existing filters to nstartOtherBand position
	for (var b=0; b<2; ++b){
		var bandch = Math.floor(nstartOtherBand/N);
		var nch = nstartOtherBand % N;
		for (var fb=0; fb<2; ++fb){
			for (var c = 0; c < N; ++c) {
				if (currentCnf.filterEnabled[0][fb][b][c] && currentCnf.filterBand[0][fb][b][c]==otherBand) { //skip filter enabled in the own band
					newCnf.filterEnabled[0][bandch][b][nch] = true;
					newCnf.filterBand[0][bandch][b][nch] = otherBand;
					newCnf.freqHz[bandch][b][nch]=currentCnf.freqHz[fb][b][c];
					newCnf.bwIndex[bandch][b][nch]=currentCnf.bwIndex[fb][b][c];
					newCnf.fineGainFilter[0][bandch][b][nch]=currentCnf.fineGainFilter[0][fb][b][c];
					newCnf.isFilterGrouped[bandch][b][nch]=currentCnf.isFilterGrouped[fb][b][c];
					if (b==1){
						newCnf.sqChEnabled[0][bandch][1][nch]=currentCnf.sqChEnabled[0][fb][1][c];
						newCnf.sqChThreshold[0][bandch][1][nch]=currentCnf.sqChThreshold[0][fb][1][c];
						//assigning new control channel position
						if ((N*fb+c+1) == ncch){
							newCnf.controlChannel[otherBand] = N*bandch+nch+1;
						}
					}
					nch++;
					if (nch>=N){
						bandch++;
						nch=0;
					}
				}
			}
		}
	}
}
function reorganizeAdjFilters(factory, currentCnf, newCnf, otherBand, nstartOtherBand){
	//place the other band filters staring in nstartOtherBand
	//disable all filters first
	var N = currentCnf.ADJNR;
	var ncch = currentCnf.controlChannel[otherBand];
	for (var b=0; b<2; ++b){
		for (var fb=0; fb<2; ++fb){
			for (var c = 0; c < N; ++c) {
				newCnf.filterEnabled[1][fb][b][c] = false;
			}
		}
	}
	N = factory.numADJFilters;
	//copy filter info of the other band existing filters to nstartOtherBand position
	for (var b=0; b<2; ++b){
		var bandch = Math.floor(nstartOtherBand/N);
		var nch = nstartOtherBand % N;
		for (var fb=0; fb<2; ++fb){
			for (var c = 0; c < N; ++c) {
				if (!currentCnf.filterEnabled[1][fb][b][c] || currentCnf.filterBand[1][fb][b][c]!=otherBand) continue; //skip filter enabled in the own band
				if (bandch>=2) continue; //to avoid this condition when nstartOtherBand > 0
				newCnf.filterEnabled[1][bandch][b][nch] = true;
				newCnf.filterBand[1][bandch][b][nch] = otherBand;
				newCnf.fstartHzAdjFilter[bandch][b][nch]=currentCnf.fstartHzAdjFilter[fb][b][c];
				newCnf.fstopHzAdjFilter[bandch][b][nch]=currentCnf.fstopHzAdjFilter[fb][b][c];
				newCnf.fineGainFilter[1][bandch][b][nch]=currentCnf.fineGainFilter[1][fb][b][c];
				newCnf.sqChEnabled[1][bandch][b][nch]=currentCnf.sqChEnabled[1][fb][b][c];
				newCnf.sqChThreshold[1][bandch][b][nch]=currentCnf.sqChThreshold[1][fb][b][c];
				newCnf.cn_threshold_adj[bandch][nch]=currentCnf.cn_threshold_adj[fb][c];
				//assigning new control channel position
				if ((config.ADJNR*fb+c+1) == -ncch){
					newCnf.controlChannel[otherBand] = -(config.ADJNR*bandch+nch+1);
				}
				nch++;
				if (nch>=N){
					bandch++;
					nch=0;
				}
			}
		}
	}

}