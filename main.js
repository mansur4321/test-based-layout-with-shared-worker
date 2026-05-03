const worker = new SharedWorker("shared-worker.js");
const port = worker.port;
const body = document.body;

const pageCounter = document.querySelector(".tab-counter__count");

const themeToggleButton = document.querySelector(".theme-toggle-button"),
	themeToggleButtonThumb = document.querySelector(".theme-toggle-button__thumb");

const emailSubscribeInput = document.querySelector(".email-subscribe-form__input"),
	emailSubscribeButton = document.querySelector(".email-subscribe-form__button"),
	emailSubscribeError = document.querySelector(".email-subscribe-form__error-message"),
	emailList = document.querySelector(".email-list"),
	openFullButton = document.querySelector(".open-full-button");

// #region Изменение счетчика страниц

const updatePageCounter = (tabCount) => {
	pageCounter.innerText = tabCount;
};

// #endregion

// #region Смена темы
const THEME_VALUES = Object.freeze({
	light: "light",
	dark: "dark",
});
const MESSAGE_TYPES = Object.freeze({
	setTheme: "setTheme",
	ping: "ping",
	terminatePort: "terminatePort",
});

const isDarkTheme = (theme) => theme === THEME_VALUES.dark;
const toggleTheme = (theme) => (theme === THEME_VALUES.light ? THEME_VALUES.dark : THEME_VALUES.light);
const setNewTheme = (theme) => {
	body.setAttribute("data-theme", theme);

	if (isDarkTheme(theme)) {
		themeToggleButtonThumb.classList.add(THEME_VALUES.dark);

		return;
	}

	themeToggleButtonThumb.classList.remove(THEME_VALUES.dark);
};

let theme = THEME_VALUES.light;

themeToggleButton.addEventListener("click", () => {
	theme = toggleTheme(theme);
	worker.port.postMessage({ type: MESSAGE_TYPES.setTheme, theme: theme });

	setNewTheme(theme);
});

// #endregion

// #region Добавление email в список, рендер и toggle
const TEST_EMAILS = Object.freeze([
	"example@example.com",
	"mansur.djalalov.110@gmail.com",
	"jet_110@mail.ru",
	"test@test.com",
	"test_110@test.com",
]);
const EMAILS_STORAGE_KEY = "arlant-emails";
const MAX_VISIBLE_EMAILS = 5;
let isFullListVisible = false;

const getLocalStorageEmails = () => {
	const emails = localStorage.getItem(EMAILS_STORAGE_KEY);
	return emails ? JSON.parse(emails) : TEST_EMAILS;
};
const setLocalStorageEmails = (emails) => {
	localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(emails));
};

const emails = getLocalStorageEmails();
const getVisibleEmails = () => (isFullListVisible ? emails : emails.slice(0, MAX_VISIBLE_EMAILS));

// Управление отображением списка email
const renderPartialEmailList = (email) => {
	const listItem = document.createElement("li");
	const listEmail = document.createElement("span");

	listItem.classList.add("email-list__item");
	listEmail.classList.add("email-list__email");
	listEmail.textContent = email;

	listItem.appendChild(listEmail);
	emailList.appendChild(listItem);
};
const renderEmailList = (emails) => {
	emailList.innerHTML = "";

	emails.forEach((email) => {
		renderPartialEmailList(email);
	});
};
const resetEmailSubscribeForm = () => {
	emailSubscribeInput.value = "";
	emailSubscribeError.classList.remove("visible");
};

// Управление формой подписки на email
emailSubscribeButton.addEventListener("click", (e) => {
	e.preventDefault();
	const email = emailSubscribeInput.value.trim();

	if (!isValidEmail(email)) {
		emailSubscribeError.classList.add("visible");
		return;
	}

	emails.unshift(email);

	openFullButtonVisibilityController();

	resetEmailSubscribeForm();
	setLocalStorageEmails(emails);
	renderEmailList(getVisibleEmails()); // Можно реализовать здесь сразу через renderPartialEmailList, но это на будущее :)
});

// Управление кнопкой "Открыть полный список"
const isValidEmail = (email) => /.+@.+\..+/i.test(email);
const isOpenButtonVisible = () => {
	return emails.length > MAX_VISIBLE_EMAILS;
};

const openFullButtonVisibilityController = () => {
	openFullButton.classList.toggle("visible", isOpenButtonVisible());
};

openFullButton.addEventListener("click", () => {
	isFullListVisible = !isFullListVisible;
	renderEmailList(getVisibleEmails());
});

// Инициализация всего функционала
openFullButtonVisibilityController();
renderEmailList(getVisibleEmails());

// #endregion

// #region Обработка сообщений от shared-worker и закрытие порта при выходе из страницы
port.start();
port.onmessage = (e) => {
	const data = e.data;

	theme = data.theme;
	setNewTheme(theme);
	updatePageCounter(data.tabCount);
};
port.postMessage({ type: "ping" });

window.addEventListener("beforeunload", () => {
	port.postMessage({ type: MESSAGE_TYPES.terminatePort });
});
window.addEventListener("unload", () => {
	port.postMessage({ type: MESSAGE_TYPES.terminatePort });
});
// #endregion
