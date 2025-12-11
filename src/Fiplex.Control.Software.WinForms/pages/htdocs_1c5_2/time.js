function TimeT() {
	this.epoch = 0;
	this.parse = function(sr) {
		try {
			var num = parseInt(sr, 16);
			if (isNaN(num)) {
				return;
			}
			var d1 = new Date("1970");
			var d2 = new Date("1980");
			this.epoch = num*1000 + (d2 - d1);
		} catch(err) { }
	}
	this.render = function(v) {
		var el;
		if (v === "undefined" || !v)
			v = this.epoch;
		var d = new Date(v);
		try {
			if (el = document.getElementById('time')) {
				var t = d.toUTCString();
				var i = t.toUpperCase().indexOf('GMT');
				if (i > 0)
					t = t.substring(0, i);
				el.innerHTML = t;
			}
			if (el = document.getElementById('year'))
				el.value = d.getUTCFullYear();
			if (el = document.getElementById('month'))
				el.value = d.getUTCMonth() + 1;
			if (el = document.getElementById('day'))
				el.value = d.getUTCDate();
			if (el = document.getElementById('hours'))
				el.value = d.getUTCHours();
			if (el = document.getElementById('minutes'))
				el.value = d.getUTCMinutes();
			if (el = document.getElementById('seconds'))
				el.value = d.getUTCSeconds();
		} catch (err) { }
	}
	this.format = function() {
		var year, month, date, hours, minutes, seconds;
		var frm;
		try {
			var el;
			if (el = document.getElementById('year'))
				year = parseInt(el.value);
			if (el = document.getElementById('month'))
				month = parseInt(el.value) - 1;
			if (el = document.getElementById('day'))
				day = parseInt(el.value);
			if (el = document.getElementById('hours'))
				hours = parseInt(el.value);
			if (el = document.getElementById('minutes'))
				minutes = parseInt(el.value);
			if (el = document.getElementById('seconds'))
				seconds = parseInt(el.value);
			if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes) || isNaN(seconds))
				return -1;
			if (month < 0 || month > 11) {
				return -1;
			}
			var daysInMonth = new Date(year, 1+month, 0).getDate();
			if (day < 1 || day > daysInMonth) {
				return -1;
			}
			if (hours < 0 || hours > 23) {
				return -1;
			}
			if (minutes < 0 || minutes > 59) {
				return -1;
			}
			if (seconds < 0 || seconds > 59) {
				return -1;
			}
			var m = Date.UTC(year, month, day, hours, minutes, seconds, 0);
			frm = this.toLocalTime(m);
		} catch (err) { }
		return frm;
	}
	this.toLocalTime = function(d) {
		var d1 = new Date("1970");
		var d2 = new Date("1980");
		var num = (d - (d2 -d1)) / 1000;
		if (num < 0)
			return -1;
		var frm = hexformat(num, 8);
		return frm;
	}
}
