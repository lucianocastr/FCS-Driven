<!--

function xmlreq()
{
	if (window.XMLHttpRequest) {
		req = new XMLHttpRequest();
	}else if (window.ActiveXObject) {
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

// -->