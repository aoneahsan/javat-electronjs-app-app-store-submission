const { app, BrowserWindow, shell } = require('electron');

const windowStateKeeper = require('electron-window-state');

const { getPopupTarget, setupAlwaysOnTopMain } = require('@jitsi/electron-sdk');
const contextMenu = require('electron-context-menu');
const url = require('url');

app.name = 'Trizlink';
app.setName('Trizlink');

/**
 * Opens the given link in an external browser.
 *
 * @param {string} link - The link (URL) that should be opened in the external browser.
 * @returns {void}
 */
function openExternalLink(link) {
	let u;

	try {
		u = url.parse(link);
	} catch (e) {
		return;
	}

	const proto = u.protocol;
	const href = u.href;

	if (proto === 'http:' || proto === 'https:' || proto === 'mailto:') {
		shell.openExternal(href);
	}
}

const windowOpenHandler = ({ url, frameName }) => {
	const target = getPopupTarget(url, frameName);

	if (!target || target === 'browser') {
		openExternalLink(url);

		return { action: 'deny' };
	}

	if (target === 'electron') {
		return { action: 'allow' };
	}

	return { action: 'deny' };
};

let mainWindow;

contextMenu({
	prepend: (defaultActions, parameters, browserWindow) => [
		{
			label: 'Search Google for “{selection}”',
			// Only show it when right-clicking text
			visible: parameters.selectionText.trim().length > 0,
			click: () => {
				shell.openExternal(
					`https://google.com/search?q=${encodeURIComponent(
						parameters.selectionText
					)}`
				);
			},
		},
		defaultActions.separator(),
		{
			label: 'Reload',
			role: 'reload',
		},
	],
	showInspectElement: false,
});

const gotTheLock = app.requestSingleInstanceLock();

function createWindow() {
	let windowState = windowStateKeeper({
		defaultWidth: 800,
		defaultHeight: 600,
	});

	mainWindow = new BrowserWindow({
		x: windowState.x,
		y: windowState.y,
		width: windowState.width,
		height: windowState.height,
		autoHideMenuBar: true,
		parent: mainWindow,
		show: false,
		frame: true,
		minWidth: 1024,
		minHeight: 600,
		webPreferences: {
			nodeIntegration: false,
			enableRemoteModule: false,
			contextIsolation: true,
			webviewTag: false,
			webSecurity: true,
			devTools: false,
			spellcheck: true,
		},
		title: 'Trizlink',
		icon: '/icon.png',
	});

	mainWindow.title = 'Trizlink';

	mainWindow.loadURL(`https://trizlink.com`, {
		userAgent:
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36',
	});
	mainWindow.maximize();
	mainWindow.once('ready-to-show', () => {
		mainWindow.show(); // show the window once it is ready
	});

	setupAlwaysOnTopMain(mainWindow, null, windowOpenHandler);

	mainWindow.on('closed', () => (mainWindow = null));

	windowState.manage(mainWindow);
}

if (!gotTheLock) {
	app.quit();
} else {
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		// Print out data received from the second instance.

		// Someone tried to run a second instance, we should focus our window.
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.focus();
		}
	});

	app.on('ready', createWindow);
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow();
	}
});
