// Firefox と Chrome でのみ動作確認しました。
// !!重要!!: 現時点(2017/11/09)の IE (バージョン: 11.674.15063.0) では動作しません

/**
 * ユーティリティ
 */
class WndUtils {

	/**
	 * URL プロパティ
	 */
	static get url() {
		return window.location.protocol + "//" + window.location.host;
	}

	/**
	 * 指定のウィンドウが閉じているかを返す
	 *
	 * @param wnd チェックしたい window
	 * @return 閉じている場合は true
	 */
	static isClosed(wnd) {
		if (!wnd) {
			return true;
		}
		if (typeof wnd.closed === "undefined") {
			return true;
		}
		return wnd.closed;
	}
}

/**
 * ウィンドウ情報を保持する
 */
class WndInfo {

	/**
	 * コンストラクタ
	 *
	 * @param wndName ウィンドウ名
	 * @param wnd window
	 * @param callback コールバック関数: function (data) {}
	 */
	constructor(wndName, wnd, callback) {
		this.wndName = wndName;
		this.wnd = wnd;
		this.callback = callback;
	}
}

/**
 * ウィンドウ情報を管理する
 */
class WndInfoHolder {

	/**
	 * コンストラクタ
	 */
	constructor() {
		this.map = new Map();
	}

	/**
	 * ウィンドウ情報を追加する
	 *
	 * @param wndInfo ウィンドウ情報
	 */
	add(wndInfo) {
		this.map.set(wndInfo.wndName, wndInfo);
	}

	/**
	 * ウィンドウ情報をウィンドウ名で探す
	 *
	 * @param ウィンドウ名
	 * @return 見つかったウィンドウ情報。なければ null を返す
	 */
	findByName(wndName) {
		return (this.map.has(wndName)) ? this.map.get(wndName) : null;
	}

	/**
	 * ウィンドウ情報を window で探す
	 *
	 * @param wnd window
	 * @return 見つかったウィンドウ情報。なければ null を返す
	 */
	findByWnd(wnd) {
		let wndName = null;
		this.map.forEach(function(value, key) {
			if (value.wnd === wnd) {
				wndName = key;
			}
		});
		return (wndName !== null) ? this.map.get(wndName) : null;
	}

	/**
	 * ウィンドウ情報を管理対象から除く
	 *
	 * @param wndName 取り除くウィンドウ名
	 */
	removeByName(wndName) {
		this.map.delete(wndName);
	}

	/**
	 * ウィンドウ情報を管理対象から除く
	 *
	 * @param wnd 取り除く window
	 */
	removeByWnd(wnd) {
		let wndInfo = this.findByWnd(wnd);
		if (wndInfo !== null) {
			this.map.delete(wndInfo.wndName);
		}
	}

	/**
	 * 保持しているウィンドウ情報をクリアする
	 */
	removeAll() {
		this.map.clear();
	}

	/**
	 * 繰り返し処理
	 *
	 * @param callback コールバック関数: function (value, key, map) {}
	 * @param callback 実行時の this 値(省略可)
	 */
	forEach(callback, thisArg) {
		this.map.forEach(callback, thisArg);
	}
}

/**
 * ウィンドウを制御する
 */
class WndManger {

	/**
	 * コンストラクタ
	 */
	constructor() {

		// open.window のデフォルト値
		this.openFeatures_ = {
			"width": 780,
			"height": 640,
			"left": 0,
			"top": 0,
			"menubar": "no",
			"toolbar": "no",
			"location": "no",
			"status": "no",
			"resizable": "no",
			"scrollbars": "no"
		};

		this.wndInfos_ = new WndInfoHolder();

		let self = this;

		//window.addEventListener("message", (event) => {	// アロー関数の場合
		window.addEventListener("message", function (event) {

			try {

				let event_origin = event.origin;
				let event_source = event.source;
				let event_data = event.data;

				if (WndUtils.url !== event_origin) {
					return;
				}

				// アロー関数で定義するならば this を定義時に束縛するので this.wndInfos_ と記述可能
				//let wndInfo = this.wndInfos_.findByWnd(event_source);
				let wndInfo = self.wndInfos_.findByWnd(event_source);
				if (wndInfo != null) {
					let data = $.parseJSON(event_data);
					if (typeof wndInfo.callback !== "undefined") {
						wndInfo.callback(data);
					}
				}

			} catch (e) {
				console.error(e);
			}
		});

		window.addEventListener("unload", function (event) {
			self.wndInfos_.forEach(function (wndInfo) {
				if (!WndUtils.isClosed(wndInfo.wnd)) {
					wndInfo.wnd.close();
				}
			});
		});
	}

	/**
	 * ウィンドウを開く
	 *
	 * @param url 対象の URL
	 * @param wndName ウィンドウ名
	 * @param features window.open の features
	 * @param callback コールバック関数: function (data) {}
	 */
	open(url, wndName, features, callback) {

		let wndInfo = this.wndInfos_.findByName(wndName);
		if (wndInfo !== null && WndUtils.isClosed(wndInfo)) {
			this.wndInfos_.removeByName(wndName);
			wndInfo = null;
		}

		if (wndInfo !== null) {
			$(wndInfo.wnd).focus();
		} else {
			let wnd = window.open(url, wndName, this.getFeaturesString_(features));
			$(wnd).focus();
			this.wndInfos_.add(new WndInfo(wndName, wnd, callback));
		}
	}

	// 渡された features とデフォルトの features を合成し文字列にする
	getFeaturesString_(features) {
		features = $.extend({}, this.openFeatures_, features);
		let featuresString = "";
		$.each(features, function (key, value) {
			if (featuresString !== "") {
				featuresString += ",";
			}
			featuresString += key + "=" + value;
		});

		return featuresString;
	}
}

/**
 * 子ウィンドウから親ウィンドウからへメッセージを送信する
 */
class MessageUtils {

	/**
	 * メッセージを送信する
	 *
	 * @param 送信データオブジェクト
	 */
	static postMessage(obj) {
		try {

			if (!window.opener) {
				return;
			}

			if (WndUtils.isClosed(window.opener)) {
				return;
			}

			let jsonString = JSON.stringify(obj);

			window.opener.postMessage(jsonString, WndUtils.url);

		} catch (e) {
			console.error(e);
		}
	}
}
