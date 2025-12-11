<!--
var remotesNr, MaxRemotesNr, remotesMask,config,mode,fiberMask,twofibers;
function optOnLoadFunc() {
	var q = param();
	if (q['remotesNr'])
		remotesNr = entify(q['remotesNr']);
	if (q['MaxRemotesNr'])
		MaxRemotesNr = entify(q['MaxRemotesNr']);
	if (q['remotesMask'])
		remotesMask = entify(q['remotesMask']);
	var header = document.getElementById("header");
	
	config = localStorage.getItem("cfg_1dr2"+window.location.host);
	fiberMask = parseFiberMask(config);
	twofibers = (fiberMask==3);
	mode = parseMode(config);
	header.innerHTML = "REMOTE&nbsp;LINK";
	renderOpticalTable();
	//renderMeters();
	optLoadStatus();
}
function renderOpticalTable(){
	var i;
	var imax = (twofibers)?2:1;
	var rootNode = document.getElementById("tableleds");
	var row = document.createElement("tr");
	rootNode.appendChild(row);	
	var header;
	if (twofibers){
		header = document.createElement("th");
		row.appendChild(header);
		header = document.createElement("th");
		header.innerHTML = "PORT1";
		header.className = "thd";		
		row.appendChild(header);
		header = document.createElement("th");
		header.innerHTML = "PORT2";
		header.className = "thd";
		row.appendChild(header);
		if (mode==0){
			row = document.createElement("tr");
			rootNode.appendChild(row);	
			header = document.createElement("th");
			header.innerHTML = "Active&nbsp;Link";
			header.className = "thdrht";		
			row.appendChild(header);
			for (i=1;i<=imax;i++){
				tdNode = createLedBox("optActLnk_"+i);
				row.appendChild(tdNode);
			}
		}
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	header = document.createElement("th");
	header.innerHTML = "Sync&nbsp;to&nbsp;Master";
	header.className = "thdrht";		
	row.appendChild(header);
	for (i=1;i<=imax;i++){
		tdNode = createLedBox("optFrSync_"+i);
		row.appendChild(tdNode);
	}		
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	header = document.createElement("th");
	header.innerHTML = "Tx/Rx&nbsp;status";
	header.className = "thdrht";		
	row.appendChild(header);
	for (i=1;i<=imax;i++){
		tdNode = createLedBox("txrxStat_"+i);
		row.appendChild(tdNode);
	}		
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	header = document.createElement("th");
	header.innerHTML = "Data&nbsp;Lock";
	header.className = "thdrht";		
	row.appendChild(header);
	for (i=1;i<=imax;i++){
		tdNode = createLedBox("dataLock_"+i);
		row.appendChild(tdNode);
	}	
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	header = document.createElement("th");
	header.innerHTML = "Data&nbsp;Sync";
	header.className = "thdrht";		
	row.appendChild(header);
	for (i=1;i<=imax;i++){
		tdNode = createLedBox("dataSync_"+i);
		row.appendChild(tdNode);
	}	
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	header = document.createElement("th");
	header.innerHTML = "Module&nbsp;status";
	header.className = "thdrht";		
	row.appendChild(header);
	for (i=1;i<=imax;i++){
		tdNode = createLedBox("optModKO_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	header = document.createElement("th");
	header.innerHTML = "Optical&nbsp;Tx&nbsp;Error";
	header.className = "thdrht";		
	row.appendChild(header);
	for (i=1;i<=imax;i++){
		tdNode = createLedBox("optTxErr_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	header = document.createElement("th");
	header.innerHTML = "Optical&nbsp;Rx&nbsp;Error";
	header.className = "thdrht";		
	row.appendChild(header);
	for (i=1;i<=imax;i++){
		tdNode = createLedBox("optRxErr_"+i);
		row.appendChild(tdNode);
	}	
	rootNode = document.getElementById("tablemeas");
	row = document.createElement("tr");
	rootNode.appendChild(row);	
	if (twofibers){
		header = document.createElement("th");
		row.appendChild(header);
		header = document.createElement("th");
		header.innerHTML = "PORT1";
		header.className = "thd";		
		row.appendChild(header);
		header = document.createElement("th");
		header.innerHTML = "PORT2";
		header.className = "thd";
		row.appendChild(header);
	}	
	row = document.createElement("tr");
	rootNode.appendChild(row);
	header = document.createElement("th");
	row.appendChild(header);
	header.innerHTML = "Errors";
	header.className = "thdrht";
	for (i=1;i<=imax;i++){
		tdNode = createTextBox("errors_"+i);
		row.appendChild(tdNode);
	}
	
	row = document.createElement("tr");
	rootNode.appendChild(row);
	header = document.createElement("th");
	row.appendChild(header);
	header.innerHTML = "Supply&nbsp;Voltage(V)";
	header.className = "thdrht";
	for (i=1;i<=imax;i++){
		tdNode = createTextBox("voltage_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	header = document.createElement("th");
	row.appendChild(header);
	header.innerHTML = "Bias&nbsp;Current(mA)";
	header.className = "thdrht";
	for (i=1;i<=imax;i++){
		tdNode = createTextBox("bias_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	header = document.createElement("th");
	row.appendChild(header);
	header.innerHTML = "Temperature(&deg;C)";
	header.className = "thdrht";
	for (i=1;i<=imax;i++){
		tdNode = createTextBox("temperat_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	header = document.createElement("th");
	row.appendChild(header);
	header.innerHTML = "Tx&nbsp;Power(dBm)";
	header.className = "thdrht";
	for (i=1;i<=imax;i++){
		tdNode = createTextBox("txpower_"+i);
		row.appendChild(tdNode);
	}	
	row = document.createElement("tr");
	rootNode.appendChild(row);
	header = document.createElement("th");
	row.appendChild(header);
	header.innerHTML = "Rx&nbsp;Power(dBm)";
	header.className = "thdrht";
	for (i=1;i<=imax;i++){
		tdNode = createTextBox("rxPowTxt_"+i);
		row.appendChild(tdNode);
	}		
	
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
function createTextBox(id) {
	var tdNode = document.createElement("td");
	tdNode.id = id;
	tdNode.className = "tval";
	tdNode.innerHTML ="0";
	return tdNode;
}
function renderMeters() {
	for (var i = 0; i < 2; ++i) {
		var td = document.getElementById("rxPowMet_"+i);
		var s = optRxPow_settings;
		var el = new mMeter(s.min, s.max, s.low_alarm, s.high_alarm, s.low_warn, s.high_warn);
		el.attachTo(td);
		el.valueSet(s.min);
	}
}
var tmrIdOptStat;
function optLoadStatus() {
	var serverResponse = localStorage.getItem("stat_1dr2");
	optParseStatus(serverResponse);
	tmrIdOptStat = setTimeout(function() { optLoadStatus(); }, 2000);
}
function optParseStatus(serverResponse) {
	var shift,bitmask, num, warning, alarm, temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm;
	var imax = (twofibers)?2:1;
	if (twofibers && mode==0){
		num = parseInt(serverResponse.substr(12,2),16);
		if (num==0) {
			document.getElementById("optActLnk_1").src = "/bullet_green.png";
			document.getElementById("optActLnk_2").src = "/bullet_grey.png";
		}
		else{
			document.getElementById("optActLnk_2").src = "/bullet_green.png";
			document.getElementById("optActLnk_1").src = "/bullet_grey.png";
		}
	}	
	for (var i=1;i<=imax;i++)
	{
		shift = (i==1)?14:42;
		shift+=22;
		bitmask = parseInt(serverResponse.substr(shift,2),16);
		document.getElementById("optFrSync_1").src = (bitmask & 0x08)? "/bullet_red.png" : "/bullet_green.png";
		if (twofibers) document.getElementById("optFrSync_2").src = (bitmask & 0x08)? "/bullet_red.png" : "/bullet_green.png";
		shift+=2;
		num  =  parseInt(serverResponse.substr(shift,4),16);
		document.getElementById("errors_"+i).innerHTML = num;
		warning = false;
		alarm = false;
		shift-=24;
		temp = to_float(parseInt(serverResponse.substr(shift,4),16));
		setText("temperat_"+i, temp.toFixed(1), computeFoAlarmTemp(temp));
		// document.getElementById("temperat_"+i).innerHTML = temp.toFixed(1);
		shift+=4;
		volt = parseInt(serverResponse.substr(shift,4),16) / 10000;
		// document.getElementById("voltage_"+i).innerHTML = volt.toFixed(1);
		setText("voltage_"+i, volt.toFixed(2), computeFoAlarmVolt(volt));
		shift+=4;
		bias = parseInt(serverResponse.substr(shift,4),16) / 500;
		// document.getElementById("bias_"+i).innerHTML = bias.toFixed(1);
		setText("bias_"+i, bias.toFixed(1), computeFoAlarmBias(bias));
		shift+=4;
		txpow = 10 * Math.log(parseInt(serverResponse.substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
		// document.getElementById("txpower_"+i).innerHTML = txpow.toFixed(1);
		setText("txpower_"+i,txpow.toFixed(1),computeFoAlarmTxpow(txpow));
		shift+=4;
		rxpow = 10 * Math.log(parseInt(serverResponse.substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
		// document.getElementById("rxPowTxt_"+i).innerHTML = rxpow.toFixed(1);
		//document.getElementById("rxPowMet_"+1).mMeter.valueSet(rxpow);
		setText("rxPowTxt_"+i,rxpow.toFixed(1),computeFoAlarmRxpow(rxpow));
		shift+=4;
		sfpalarm = parseInt(serverResponse.substr(shift,2),16);
		shift+=2;
		gtpalarm = parseInt(serverResponse.substr(shift,2),16);
		if (sfpalarm & 0x01) {
			document.getElementById("optTxErr_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("optTxErr_"+i).src = "/bullet_green.png";
		}
		if (sfpalarm & 0x02) {
			document.getElementById("optRxErr_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("optRxErr_"+i).src = "/bullet_green.png";
		}
		alarm = computeFoStatAlarm(temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm);
		setColor("optModKO_"+i,(alarm == 2)?"red": (alarm == 1)?"yellow":"green");
		if (gtpalarm & 0x01) {
			document.getElementById("txrxStat_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("txrxStat_"+i).src = "/bullet_green.png";
		}
		if (gtpalarm & 0x02) {
			document.getElementById("dataLock_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("dataLock_"+i).src = "/bullet_green.png";
		}
		if (gtpalarm & 0x04) {
			document.getElementById("dataSync_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("dataSync_"+i).src = "/bullet_green.png";
		}
	}
}

function setText(element,text,color){ //color=0/normal, color=1/warning, color=2/alarm
	var el=document.getElementById(element);
	try{
		el.innerHTML = text;
		el.style.color = (color==2) ? "#df4040" : (color==1)?"#eeee88":"#802000";
	} catch (err) {}	
}
function setColor(element,color){
	try{
		document.getElementById(element).src = "/bullet_"+color+".png";
	} catch (err) {}
}
var foDataLimitsAlarm = {
	temperature: 	{min: -45,	max: 90	},
	voltage: 	{min: 2.7, 	max: 3.8},
	bias: 		{min: 0, 	max: 100},
	txpow: 		{min: -6, 	max: 8	},
	rxpow: 		{min: -29.5, 	max: 4.5}
}
var foDataLimitsWarning = {
	temperature: 	{min: -40,	max: 85	},
	voltage: 	{min: 2.8, 	max: 3.7},
	bias: 		{min: 0.1, 	max: 90	},
	txpow: 		{min: -5, 	max: 7	},
	rxpow: 		{min: -24.5, 	max: 2.5}
}

function computeFoStatAlarm(temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm) {
	var alarm = 0;
	if ((temp < foDataLimitsWarning.temperature.min) 
		|| (temp > foDataLimitsWarning.temperature.max))
	{
		alarm = 1;
	}
	if ((volt < foDataLimitsWarning.voltage.min) 
		|| (volt > foDataLimitsWarning.voltage.max))
	{
		alarm = 1;
	}
	if ((bias < foDataLimitsWarning.bias.min) 
		|| (bias > foDataLimitsWarning.bias.max))
	{
		alarm = 1;
	}
	if ((txpow < foDataLimitsWarning.txpow.min) 
		|| (txpow > foDataLimitsWarning.txpow.max))
	{
		alarm = 1;
	}
	if ((temp < foDataLimitsAlarm.temperature.min) 
		|| (temp > foDataLimitsAlarm.temperature.max))
	{
		alarm = 2;
	}
	if ((volt < foDataLimitsAlarm.voltage.min) 
		|| (volt > foDataLimitsAlarm.voltage.max))
	{
		alarm = 2;
	}
	if ((bias < foDataLimitsAlarm.bias.min) 
		|| (bias > foDataLimitsAlarm.bias.max))
	{
		alarm = 2;
	}
	if ((txpow < foDataLimitsAlarm.txpow.min) 
		|| (txpow > foDataLimitsAlarm.txpow.max))
	{
		alarm = 2;
	}
	if (rxpow > foDataLimitsAlarm.rxpow.max) 
	{
		alarm = 2;
	}
	if (sfpalarm & 0x01) {
		alarm = 2;
	}
	if (gtpalarm & 0x01) {
		alarm = 2;
	}
	return alarm;
}

function computeFoAlarmTemp(temp) {
	var alarm = 0;

	if ((temp < foDataLimitsWarning.temperature.min) 
		|| (temp > foDataLimitsWarning.temperature.max))
	{
		alarm = 1;
	}
	if ((temp < foDataLimitsAlarm.temperature.min) 
		|| (temp > foDataLimitsAlarm.temperature.max))
	{
		alarm = 2;
	}	
	return alarm;
}

function computeFoAlarmVolt(volt) {
	var alarm = 0;
	if ((volt < foDataLimitsWarning.voltage.min) 
		|| (volt > foDataLimitsWarning.voltage.max))
	{
		alarm = 1;
	}
	if ((volt < foDataLimitsAlarm.voltage.min) 
		|| (volt > foDataLimitsAlarm.voltage.max))
	{
		alarm = 2;
	}
	return alarm;
}

function computeFoAlarmBias(bias) {
	var alarm = 0;
	if ((bias < foDataLimitsWarning.bias.min) 
		|| (bias > foDataLimitsWarning.bias.max))
	{
		alarm = 1;
	}
	if ((bias < foDataLimitsAlarm.bias.min) 
		|| (bias > foDataLimitsAlarm.bias.max))
	{
		alarm = 2;
	}
	return alarm;
}

function computeFoAlarmTxpow(txpow) {
	var alarm = 0;
	if ((txpow < foDataLimitsWarning.txpow.min) 
		|| (txpow > foDataLimitsWarning.txpow.max))
	{
		alarm = 1;
	}
	if ((txpow < foDataLimitsAlarm.txpow.min) 
		|| (txpow > foDataLimitsAlarm.txpow.max))
	{
		alarm = 2;
	}
	return alarm;
}
function computeFoAlarmRxpow(rxpow) {
	var alarm = 0;
	if (rxpow < foDataLimitsWarning.rxpow.min)
	{
		alarm = 1;
	}
	if ((rxpow <= foDataLimitsAlarm.rxpow.min)
		|| (rxpow > foDataLimitsAlarm.rxpow.max))
	{
		alarm = 2;
	}
	return alarm;
}
// -->