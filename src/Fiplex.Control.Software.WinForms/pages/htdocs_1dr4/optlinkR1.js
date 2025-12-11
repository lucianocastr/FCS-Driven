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
	
	config = localStorage.getItem("cfg_"+prjname+"_"+window.location.host);
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
	header.innerHTML = "Loss&nbsp;of&nbsp;Optical&nbsp;Signal";
	header.className = "thdrht";
	row.appendChild(header);
	for (i=1;i<=imax;i++){
		tdNode = createLedBox("optLossSignal_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	header = document.createElement("th");
	header.innerHTML = "Loss&nbsp;of&nbsp;Communications";
	header.className = "thdrht";
	row.appendChild(header);
	for (i=1;i<=imax;i++){
		tdNode = createLedBox("optLossComm_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	header = document.createElement("th");
	header.innerHTML = 'FO&nbsp;Transc.&nbsp;Status';
	header.className = "thdrht";
	row.appendChild(header);
	for (i=1;i<=imax;i++){
		tdNode = createLedBox("foStatus_"+i);
		row.appendChild(tdNode);
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
	header.innerHTML = "FO&nbsp;Tx&nbsp;Fault";
	header.className = "thdrht";
	row.appendChild(header);
	for (i=1;i<=imax;i++){
		tdNode = createLedBox("txFault_"+i);
		row.appendChild(tdNode);
	}
	row = document.createElement("tr");
	rootNode.appendChild(row);
	header = document.createElement("th");
	header.innerHTML = "GTP&nbsp;PLL&nbsp;Lock";
	header.className = "thdrht";
	row.appendChild(header);
	for (i=1;i<=imax;i++){
		tdNode = createLedBox("gtpPllLock_"+i);
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
	header.innerHTML = "Error&nbsp;Count";
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
	var serverResponse = localStorage.getItem("stat_"+prjname+"_"+window.location.host);
	optParseStatus(serverResponse);
	tmrIdOptStat = setTimeout(function() { optLoadStatus(); }, 2000);
}
function optParseStatus(serverResponse) {
	var shift,bitmask, num, warning, alarm, temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm;
	var imax = (twofibers)?2:1;
	if (twofibers && mode==0){
		num = parseInt(serverResponse.substr(12,2),16);
		num &= 0x01;
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
		var el = document.getElementById("temperat_"+i);
		el.innerHTML = temp.toFixed(1);
		alarm = computeFoAlarmTemp(temp);
		el.style.color = (alarm==2) ? "#df4040" : (alarm==1)?"#eeee88":"#802000";
		shift+=4;
		volt = parseInt(serverResponse.substr(shift,4),16) / 10000;
		el = document.getElementById("voltage_"+i);
		el.innerHTML = volt.toFixed(2);
		alarm = computeFoAlarmVolt(volt);
		el.style.color = (alarm==2) ? "#df4040" : (alarm==1)?"#eeee88":"#802000";
		shift+=4;
		bias = parseInt(serverResponse.substr(shift,4),16) / 500;
		el = document.getElementById("bias_"+i);
		el.innerHTML = bias.toFixed(1);
		alarm = computeFoAlarmBias(bias);
		el.style.color = (alarm==2) ? "#df4040" : (alarm==1)?"#eeee88":"#802000";
		shift+=4;
		txpow = 10 * Math.log(parseInt(serverResponse.substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
		el = document.getElementById("txpower_"+i);
		el.innerHTML = txpow.toFixed(1);
		alarm=computeFoAlarmTxpow(txpow);
		el.style.color = (alarm==2) ? "#df4040" : (alarm==1)?"#eeee88":"#802000";
		shift+=4;
		rxpow = 10 * Math.log(parseInt(serverResponse.substr(shift,4),16) + 1e-9) / Math.LN10 - 40;
		el = document.getElementById("rxPowTxt_"+i);
		el.innerHTML = rxpow.toFixed(1);
		shift+=4;
		sfpalarm = parseInt(serverResponse.substr(shift,2),16);
		shift+=2;
		gtpalarm = parseInt(serverResponse.substr(shift,2),16);
		alarm=computeFoAlarmRxpow(rxpow);
		if (gtpalarm & 0x10) {
			document.getElementById("optLossSignal_"+i).src = "/bullet_red.png";
			el.style.color = "#df4040";
		} else {
			document.getElementById("optLossSignal_"+i).src = "/bullet_green.png";
			el.style.color = alarm!=0?"#df4040":"#802000";
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
		if (gtpalarm & 0x0E) {
			document.getElementById("optLossComm_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("optLossComm_"+i).src = "/bullet_green.png";
		}
		var alarm = computeFoStatAlarm(temp, volt, bias, txpow, rxpow, sfpalarm, gtpalarm);
		document.getElementById("foStatus_"+i).src = (alarm==2)?"/bullet_red.png":(alarm==1)?"/bullet_yellow.png":"/bullet_green.png";

		if (sfpalarm & 0x01) {
			document.getElementById("txFault_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("txFault_"+i).src = "/bullet_green.png";
		}
		if (gtpalarm & 0x01) {
			document.getElementById("gtpPllLock_"+i).src = "/bullet_red.png";
		} else {
			document.getElementById("gtpPllLock_"+i).src = "/bullet_green.png";
		}
	}
}

var foDataLimitsAlarm = {
	temperature: 	{min: -45,	max: 90	},
	voltage: 	{min: 2.7, 	max: 3.8},
	bias: 		{min: 0, 	max: 100},
	txpow: 		{min: -6, 	max: 8	},
	rxpow: 	{min: -140, 	max: 4.5}
}
var foDataLimitsWarning = {
	temperature: 	{min: -40,	max: 85	},
	voltage: 	{min: 2.8, 	max: 3.7},
	bias: 		{min: 0.1, 	max: 90	},
	txpow: 		{min: -5, 	max: 7	},
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
	if (rxpow > foDataLimitsAlarm.rxpow.max)
	{
		alarm = 2;
	}
	return alarm;
}
