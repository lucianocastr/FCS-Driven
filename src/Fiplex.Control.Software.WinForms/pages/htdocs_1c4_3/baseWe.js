var Prjstr = "_1c4_2_";

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
		last = document.anchors[0];
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

function to_phase(numInt) {
	var num = Number();	
	num = numInt / 64;
	return(num);
}

function to_stab(numInt) {
	var num = Number();	
	num = numInt / 32;
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

function rSignedByte(num) {
	if (typeof(num) !== "undefined" && !isNaN(num)) {
		if (num < 0)
			num += 256;
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
		if (this.el) {
			this.el.style.position = "absolute";
			this.el.style.right = (this.pos.x)+"%";
			this.el.style.width = "25px";
			this.el.style.height = "25px";
			this.el.src = "/bullet_yellow.png";
		}
		this.nr += this.dir;
		if (this.nr <= 0 || this.nr >= ~~Math.round(this.MaxNr*0.8))
			this.dir = -this.dir;
		this.pos.x = ~~Math.round(this.nr * 100 / this.MaxNr);
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
function showResultIcon(num) {
	try {
		var el = window.parent.navi.document.getElementById("cmdResult");
		var waitIcon = window.parent.navi.waitIcon;
		waitIcon.cancel();
		el.style.position = "inherit";
		el.style.width = "45px";
		el.style.height = "45px";
		switch (num) {
		default:
		case ERR_NONE:	el.src = "/blank.gif"; break;
		case ERR_OK: 	el.src = "/tick.png"; break;
		case ERR_FAIL: 	el.src = "/cross.png"; break;
		case ERR_PENDING: waitIcon.redraw(); break;
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
			this.el.src = "/bullet_yellow.png";
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
