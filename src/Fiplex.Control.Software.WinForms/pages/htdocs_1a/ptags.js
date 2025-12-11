<!--
var TAGLEN = 30;
var maxChNr = 8;
var tags;
var timerId;
function onloadInit() {
	tags = new Tags(maxChNr, TAGLEN);
	createForm();
	tagsReq();
}
function reloadData(){
	tagsReq();
}
function tagsReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					setTimeout(function() { load_tags(); }, 1000);
				} else {
					if (typeof(timerId) !== "undefined" && timerId)
						clearTimeout(timerId);
					timerId = setTimeout(function() { tagsReq(); }, 2000);
				}
			}
		}
		xhr.onerror = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { tagsReq(); }, 2000);
		}
		xhr.ontimeout = function(ev) {
			if (typeof(timerId) !== "undefined" && timerId)
				clearTimeout(timerId);
			timerId = setTimeout(function() { tagsReq(); }, 2000);
		}
		xhr.open("POST", "/tags.zhtml", true);
		xhr.timeout = 10000;
		xhr.send("tags_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_tags() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState==4) {
				if (this.status === 200) {
					var serverResponse = this.responseText;
					tags.parse(serverResponse);
					tags.render();
				}
			}
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_tags.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}
function createForm() {
	var rootNode = document.getElementById("rootNode");
	remove_children(rootNode);
	var row = document.createElement("tr");
	rootNode.appendChild(row);
	row.id = "remote";
	var header = document.createElement("th");
	row.appendChild(header);
	header.style.width = "100px";
	header.style.textAlign = "left";
	header.innerHTML = "LOCATION&nbsp;TAG";
	var cell = document.createElement("td");
	row.appendChild(cell);
	var tag = document.createElement("input");
	tag.type = "text";
	cell.appendChild(tag);
	tag.id = "tagEntry";
	tag.className = "tag";
	tag.size = "33";
	tag.maxLength = "30";
	tag.onkeypress = function(ev) {
		ev = ev || window.event;
		if (ev.keyCode == 13)
			return false;
	}
}
function setTag(name) {
	try {
		var tag = document.getElementById("tagEntry");
		if(typeof String.prototype.trim !== 'function'){
			  String.prototype.trim = function() {
				return this.replace(/^\s+|\s+$/g, ''); 
			}
		}
		tag.value = name.trim();
	} catch(err) { }
}
function submitform() {
	var tagstr = '';
	var tag = document.getElementById("tagEntry").value;
	tag = tag.trim();
	for (var j = 0; j < TAGLEN; ++j)
		tag += ' ';
	tag = tag.slice(0, TAGLEN);
	for (var j = 0; j < TAGLEN; ++j) {
		var num = tag.charCodeAt(j);
		var hexnum;
		if (!isNaN(num))
			hexnum = '00' + num.toString(16);
		else
			hexnum =  '20';
		tagstr += hexnum.slice(-2);
	}
	document.getElementById("ctl_tags_str").value = tagstr;
	document.getElementById("tags_form").submit();
}
// -->