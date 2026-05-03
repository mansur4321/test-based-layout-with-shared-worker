const ports = new Set();
let tabCount = 0;
let theme = "light";

function broadcast(message, ports) {
	for (const port of ports) {
		try {
			port.postMessage(message);
		} catch (e) {
			console.error("Error broadcasting message: ", e);
		}
	}
}
function broadcastStateData(port = null) {
	const filteredPorts = !!port ? Array.from(ports).filter((p) => p !== port) : ports;
	console.log({ tabCount: tabCount, theme: theme });
	broadcast({ tabCount: tabCount, theme: theme }, filteredPorts);
}

self.onconnect = (e) => {
	const port = e.ports[0];
	ports.add(port);
	tabCount += 1;

	broadcastStateData();

	port.onmessage = (event) => {
		const message = event.data;

		switch (message.type) {
			case "setTheme":
				if (message.theme === "light" || message.theme === "dark") {
					theme = message.theme;
					broadcastStateData(port);
				}
				break;
			case "ping":
				port.postMessage({ tabCount: tabCount, theme: theme });
				break;
			case "terminatePort":
				if (!ports.has(port)) {
					return;
				}

				ports.delete(port);
				tabCount = Math.max(0, tabCount - 1);
				broadcastStateData();

				port.close();

				if (ports.size === 0) {
					self.close();
				}
				break;
			default:
				console.error(`Unknown message type: ${message.type}`, message);
				break;
		}
	};
	port.onmessageerror = (e) => {
		console.error("Message error: ", e);
	};

	port.start();
};
