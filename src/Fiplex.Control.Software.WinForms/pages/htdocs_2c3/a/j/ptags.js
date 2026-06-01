var tags;
var timerId;
var countCheck;
function onloadInit() {
	tags = new Tags();
	createForm();
	guiBlocked(false);
	reloadData();
}
function reloadData(){
	showResultIcon(ERR_PENDING);
	guiBlocked(true);
	tagsReq();
}
function tagsReq() {
	try {
		if (typeof(timerId) !== "undefined" && timerId)
			clearTimeout(timerId);
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4) {
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
		xhr.send("proj_req="+1);
		xhr = null;
	} catch (err) {}
}
function load_tags() {
	try {
		var xhr = xmlreq();
		xhr.onreadystatechange  = function(ev) {
			if (this.readyState === 4 && this.status === 200) {
				var tagframe = "";
				tagframe = this.responseText;
				if (tagframe.length>=1460) tagframe = tagframe.substr(1400,60);
				window.parent.navi.tagsFrame = tagframe;
				if (tagframe.length<16){//blocked
					guiBlocked(false);
					window.parent.navi.document.getElementById("start").click();
					return;
				}
				tags.parse(this.responseText);
				tags.render();
				ctl_tags_str = tagframe;
				initFormChangeCheck();
				guiBlocked(false);
			}
		}
		Date.now = Date.now || function() { return +new Date; }; 
		xhr.open("GET", "/update_proj.shtml?co="+Date.now(), true);
		xhr.timeout = 5000;
		xhr.send(null);
		xhr = null;
	} catch (err) { }
}
function createForm() {
	var rootNode = document.getElementById("rootNode");
	remove_children(rootNode);
	var tnames = ["Tag","Reserved1","Reserved2","Reserved3","Reserved4","Reserved5","Reserved6","Reserved7","Reserved8"];
	var ml = [30,95,95,95,95,95,95,95,35];
	for (var i=0;i<9;i++){
		var row = document.createElement("tr");
		rootNode.appendChild(row);
		row.id = "remote";
		var header = document.createElement("th");
		row.appendChild(header);
		if (i>0) row.style.display = "none";
		header.style.width = "70px";
		header.style.textAlign = "left";
		header.style.fontSize = "12px";
		header.innerHTML = tnames[i]+":";
		var cell = document.createElement("td");
		row.appendChild(cell);
		var tag = document.createElement("input");
		tag.type = "text";
		cell.appendChild(tag);
		tag.id = "tagEntry_"+i;
		tag.name = tag.id;
		tag.className = "tag";
		tag.size = "33";
		tag.maxLength = ml[i];
		tag.onkeypress = function(ev) {
			ev = ev || window.event;
			if (ev.keyCode == 13)
				return false;
		}
	}
}
function setTag(name) {
	try {
		document.getElementById("tagEntry_0").value = name.substr(700,30).trim();
		for (var i=1;i<8;i++) document.getElementById("tagEntry_"+i).value = name.substr(95*(i-1),95).trim();
		document.getElementById("tagEntry_8").value = name.substr(665,35).trim();
	} catch(err) { }
}

function submitform() {
	if (!checkChange())
		return;
	if (typeof window.top.submitLocked === "undefined")
		window.top.submitLocked = false;
	if (window.top.submitLocked) {
		setTimeout(function() { guiBlocked(false); }, 15000);
		return;
	}
	showResultIcon(ERR_PENDING);
	xhrOnStart();
	var spaces = "";
	var str = "";
	for (var i=0;i<95;i++) spaces+=" ";
	for (var i=1;i<8;i++) str += (document.getElementById("tagEntry_"+i).value+spaces).substr(0,95);
	str += (document.getElementById("tagEntry_8").value+spaces).substr(0,35);
	str += (document.getElementById("tagEntry_0").value+spaces).substr(0,30);
	var tagstr = tags.format(str);
	document.getElementById("proj_str").value = tagstr;
	doSubmit(tagstr);
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
		xhr.open("POST", "/tags.zhtml", true);
		xhr.timeout = 5000;
		xhrOnStart();
		xhr.send("proj_str="+frm);
		xhr = null;
	} catch (err) {
		showResultIcon(ERR_FAIL);
		setTimeout(function() { xhrOnEnd(); }, 1500);
	}
}

(function() {
	onunload = function() {
		guiBlocked(false);
	};
})();

function xhrOnStart() {
	guiBlocked(true);
}
function xhrOnEnd() {
	tagsReq();
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
				setTimeout(function() { xhrOnEnd(); }, 1500);
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
