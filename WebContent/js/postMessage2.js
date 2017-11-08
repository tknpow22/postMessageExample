
var Tknpow22 = Tknpow22 || {};

/**
 * 共通
 */
(function(this_) {

	// postMessage() の受送信を許す URL を自身のホストに限定する
	this_.targetOrigin = window.location.protocol + "//" + window.location.host;




})(Tknpow22.common = Tknpow22.common || {});

/**
 * 親画面側用
 */
(function(this_) {

	// window.open パラメーター(features)
	var windowOpenFeatures = {
		width: 780,
		height: 640,
		left: 0,
		top: 0,
		menubar: "no",
		toolbar: "no",
		location: "no",
		status: "no",
		resizable: "no",
		scrollbars: "no"
	};

	// 子画面の情報を保持する
	var wndInfos = [];

	// window.open パラメーター(features)を取得する
	function getWindowOpenFeatures(features) {
		var features = $.extend({}, windowOpenFeatures, features);
		var featuresParam = "";
		$.each(features, function(key, value){
			if (featuresParam !== "") {
				featuresParam += ",";
			}
			featuresParam += key + "=" + value;
		});
		return featuresParam;
	}

	// 子画面の情報を追加する
	function addWndInfo(wndName, wnd, callback) {
		wndInfos.push({
			wndName: wndName,
			wnd: wnd,
			callback: callback
		});
	}

	// 子画面の情報を削除する
	function removeWndInfo(wndInfo) {
		for (var i = 0; i < wndInfos.length; ++i) {
			if (wndInfos[i] === wndInfo) {
				wndInfos.splice(i, 1);
			}
		}
	}

	// 子画面の情報を名前で検索する
	function _getWndInfoByWndName(wndName) {
		for (var i = 0; i < wndInfos.length; ++i) {
			if (wndInfos[i].wndName === wndName) {
				return wndInfos[i];
			}
		}
		return null;
	}

	// 子画面の情報をウィンドウハンドルで検索する
	function getWndInfoByWnd(wnd) {
		for (var i = 0; i < wndInfos.length; ++i) {
			if (wndInfos[i].wnd === wnd) {
				return wndInfos[i];
			}
		}
		return null;
	}

	// 子画面を開く
	function windowOpen(regist, url, wndName, features, callback) {

		var wndInfo = getWndInfoByWndName(wndName);
		if (wndInfo != null) {
			if (isClosed(wndInfo.wnd)) {
				removeWndInfo(wndInfo);
				wndInfo = null;
			}
		}

		if (wndInfo != null) {
			$(wndInfo.wnd).focus();
		} else {
			var wnd = window.open(url, wndName, features);
			wnd.focus();
			if (regist) {
				addWndInfo(wndName, wnd, callback);
			}
		}
	}

	// 指定のウィンドウにメッセージを送信する
	function postMessage(wnd, json) {

		try {

			if (isClosed(wnd)) {
				return;
			}

			var jsonstr = JSON.stringify(json);

			wnd.postMessage(jsonstr, _postUrl);

		} catch (e) {
			console.error(e);
		}
	}

	// 対象のウィンドウが閉じられているかを判定する
	function isClosed(wnd) {
		if (!wnd) {
			return true;
		}
		if (typeof wnd.closed === "undefined") {
			return true;
		}
		return wnd.closed;
	}

	// 子画面からのメッセージを受信するハンドラ
	function receiveMessageHandler(event) {

		try {

			var event_origin = event.origin;
			var event_source = event.source;
			var event_data = event.data;

			if (event_origin !== Tknpow22.common.targetOrigin) {
			//if (_postUrl !== event_origin) {
				return;
			}

			var wndInfo = _getWndInfoByWnd(event_source);
			if (wndInfo != null) {
				var data = $.parseJSON(event_data);
				wndInfo.callback(data);
				removeWndInfo(wndInfo);
			}

		} catch (e) {
			console.error(e);
		}
	}



	this_.init = function() {

		//
		// リスナーを登録する
		//

		window.addEventListener("message", receiveMessageHandler, false);
		window.addEventListener("unload", function(event) {
			for (var i = 0; i < wndInfo.length; ++i) {
				if (!isClosed(wndInfo[i].wnd)) {
					wndInfo[i].wnd.close();
				}
			}
		});

	};


})(Tknpow22.parent = Tknpow22.parent || {});

/**
 * 子画面側用
 */
(function(this_) {



})(Tknpow22.child = Tknpow22.child || {});
