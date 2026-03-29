export type Locale = 'ru' | 'en';

export type TranslationKeys = {
  nav: { dashboard: string; portfolio: string; bonds: string; marketBonds: string; watchlist: string; ai: string };
  dashboard: {
    title: string;
    aiReport: string;
    loading: string;
    totalValue: string;
    stocks: string;
    bonds: string;
    allocation: string;
    noPositionsAdd: string;
    topPositions: string;
    noPositionsYet: string;
    name: string;
    type: string;
    value: string;
    typeStock: string;
    typeBond: string;
  };
  portfolio: {
    title: string;
    addTrade: string;
    ticker: string;
    qty: string;
    buyPrice: string;
    buyDate: string;
    add: string;
    adding: string;
    positionsByTicker: string;
    trades: string;
    loading: string;
    noTradesYet: string;
    delete: string;
    avgCost: string;
    currentPrice: string;
    pnl: string;
    date: string;
  };
  bonds: {
    title: string;
    addBond: string;
    name: string;
    face: string;
    couponPct: string;
    freq: string;
    price: string;
    maturity: string;
    adding: string;
    add: string;
    noBondsYet: string;
    loading: string;
    metrics: string;
    loadingMetrics: string;
    ytm: string;
    currentYield: string;
    duration: string;
    durationYrs: string;
    cashflows: string;
    date: string;
    amount: string;
    couldNotLoadMetrics: string;
    placeholderName: string;
  };
  watchlist: {
    title: string;
    ticker: string;
    addTicker: string;
    placeholder: string;
    add: string;
    adding: string;
    tickers: string;
    loading: string;
    noTickers: string;
    price: string;
    signal: string;
    signalOk: string;
    signalUnavailable: string;
    delete: string;
  };
  ai: {
    title: string;
    reportTab: string;
    chatTab: string;
    disclaimer: string;
    portfolioReport: string;
    generate: string;
    generating: string;
    bullets: string;
    risks: string;
    questionsToCheck: string;
    askAboutData: string;
    askPlaceholder: string;
    you: string;
    ai: string;
    questionPlaceholder: string;
    send: string;
    sending: string;
    errorDisabled: string;
    errorRateLimit: string;
    errorInvalidKey: string;
    errorRequestFailed: string;
  };
  marketBonds: {
    title: string;
    description: string;
    sourceLabel: string;
    sourceRf: string;
    sourceIntl: string;
    loading: string;
    noData: string;
  };
  notFound: { pageNotFound: string; backHome: string };
};

const ru: TranslationKeys = {
  nav: { dashboard: 'Дашборд', portfolio: 'Портфель', bonds: 'Облигации', marketBonds: 'Рынок облигаций', watchlist: 'Вотчлист', ai: 'ИИ' },
  dashboard: {
    title: 'Дашборд',
    aiReport: 'Отчёт ИИ',
    loading: 'Загрузка…',
    totalValue: 'Общая стоимость',
    stocks: 'Акции',
    bonds: 'Облигации',
    allocation: 'Аллокация (акции / облигации)',
    noPositionsAdd: 'Нет позиций. Добавьте сделки и облигации.',
    topPositions: 'Крупнейшие позиции',
    noPositionsYet: 'Позиций пока нет.',
    name: 'Название',
    type: 'Тип',
    value: 'Стоимость',
    typeStock: 'Акция',
    typeBond: 'Облигация',
  },
  portfolio: {
    title: 'Портфель',
    addTrade: 'Добавить сделку',
    ticker: 'Тикер',
    qty: 'Кол-во',
    buyPrice: 'Цена покупки',
    buyDate: 'Дата покупки',
    add: 'Добавить',
    adding: 'Добавляю…',
    positionsByTicker: 'Позиции по тикеру',
    trades: 'Сделки',
    loading: 'Загрузка…',
    noTradesYet: 'Сделок пока нет. Добавьте выше.',
    delete: 'Удалить',
    avgCost: 'Средняя цена',
    currentPrice: 'Текущая цена',
    pnl: 'П/У',
    date: 'Дата',
  },
  bonds: {
    title: 'Облигации',
    addBond: 'Добавить облигацию',
    name: 'Название',
    face: 'Номинал',
    couponPct: 'Купон %',
    freq: 'Частота',
    price: 'Цена',
    maturity: 'Погашение',
    adding: 'Добавляю…',
    add: 'Добавить',
    noBondsYet: 'Облигаций пока нет. Добавьте выше.',
    loading: 'Загрузка…',
    metrics: 'Метрики',
    loadingMetrics: 'Загрузка метрик…',
    ytm: 'До погашения (YTM)',
    currentYield: 'Текущая доходность',
    duration: 'Дюрация',
    durationYrs: 'лет',
    cashflows: 'Платежи',
    date: 'Дата',
    amount: 'Сумма',
    couldNotLoadMetrics: 'Не удалось загрузить метрики.',
    placeholderName: 'Название облигации',
  },
  watchlist: {
    title: 'Вотчлист',
    ticker: 'Тикер',
    addTicker: 'Добавить тикер',
    placeholder: 'например AAPL.US',
    add: 'Добавить',
    adding: 'Добавляю…',
    tickers: 'Тикеры',
    loading: 'Загрузка…',
    noTickers: 'Тикеров в вотчлисте нет. Добавьте выше.',
    price: 'Цена',
    signal: 'Статус',
    signalOk: 'есть',
    signalUnavailable: 'нет цены',
    delete: 'Удалить',
  },
  ai: {
    title: 'ИИ',
    reportTab: 'Отчёт ИИ',
    chatTab: 'Чат с ИИ',
    disclaimer: 'Это не инвестиционная рекомендация. Только в образовательных и информационных целях.',
    portfolioReport: 'Отчёт по портфелю',
    generate: 'Сформировать',
    generating: 'Формирую…',
    bullets: 'Основное',
    risks: 'Риски',
    questionsToCheck: 'Вопросы для проверки',
    askAboutData: 'Вопросы по вашим данным',
    askPlaceholder: 'Задайте вопрос о портфеле, облигациях или вотчлисте.',
    you: 'Вы',
    ai: 'ИИ',
    questionPlaceholder: 'Ваш вопрос...',
    send: 'Отправить',
    sending: 'Отправляю…',
    errorDisabled: 'ИИ отключён: задайте MISTRAL_API_KEY',
    errorRateLimit: 'Лимит запросов. Попробуйте позже.',
    errorInvalidKey: 'Неверный MISTRAL_API_KEY',
    errorRequestFailed: 'Ошибка запроса',
  },
  marketBonds: {
    title: 'Рынок облигаций',
    description: 'Облигации, доступные на рынке — для анализа и сравнения доходности и дюрации.',
    sourceLabel: 'Источник данных',
    sourceRf: 'Россия (РФ)',
    sourceIntl: 'Зарубеж',
    loading: 'Загрузка…',
    noData: 'Нет данных.',
  },
  notFound: { pageNotFound: 'Страница не найдена.', backHome: 'На главную' },
};

const en: TranslationKeys = {
  nav: { dashboard: 'Dashboard', portfolio: 'Portfolio', bonds: 'Bonds', marketBonds: 'Market bonds', watchlist: 'Watchlist', ai: 'AI' },
  dashboard: {
    title: 'Dashboard',
    aiReport: 'AI Report',
    loading: 'Loading…',
    totalValue: 'Total value',
    stocks: 'Stocks',
    bonds: 'Bonds',
    allocation: 'Allocation (stocks vs bonds)',
    noPositionsAdd: 'No positions. Add trades and bonds.',
    topPositions: 'Top positions',
    noPositionsYet: 'No positions yet.',
    name: 'Name',
    type: 'Type',
    value: 'Value',
    typeStock: 'Stock',
    typeBond: 'Bond',
  },
  portfolio: {
    title: 'Portfolio',
    addTrade: 'Add trade',
    ticker: 'Ticker',
    qty: 'Qty',
    buyPrice: 'Buy price',
    buyDate: 'Buy date',
    add: 'Add',
    adding: 'Adding…',
    positionsByTicker: 'Positions (by ticker)',
    trades: 'Trades',
    loading: 'Loading…',
    noTradesYet: 'No trades yet. Add one above.',
    delete: 'Delete',
    avgCost: 'Avg cost',
    currentPrice: 'Current price',
    pnl: 'P&L',
    date: 'Date',
  },
  bonds: {
    title: 'Bonds',
    addBond: 'Add bond',
    name: 'Name',
    face: 'Face',
    couponPct: 'Coupon %',
    freq: 'Freq',
    price: 'Price',
    maturity: 'Maturity',
    adding: 'Adding…',
    add: 'Add',
    noBondsYet: 'No bonds yet. Add one above.',
    loading: 'Loading…',
    metrics: 'Metrics',
    loadingMetrics: 'Loading metrics…',
    ytm: 'YTM',
    currentYield: 'Current yield',
    duration: 'Duration',
    durationYrs: 'yrs',
    cashflows: 'Cashflows',
    date: 'Date',
    amount: 'Amount',
    couldNotLoadMetrics: 'Could not load metrics.',
    placeholderName: 'Bond name',
  },
  watchlist: {
    title: 'Watchlist',
    ticker: 'Ticker',
    addTicker: 'Add ticker',
    placeholder: 'e.g. AAPL.US',
    add: 'Add',
    adding: 'Adding…',
    tickers: 'Tickers',
    loading: 'Loading…',
    noTickers: 'No tickers in watchlist. Add one above.',
    price: 'Price',
    signal: 'Signal',
    signalOk: 'ok',
    signalUnavailable: 'price unavailable',
    delete: 'Delete',
  },
  ai: {
    title: 'AI',
    reportTab: 'AI Report',
    chatTab: 'AI Chat',
    disclaimer: 'This is not investment advice. For educational and informational use only.',
    portfolioReport: 'Portfolio report',
    generate: 'Generate',
    generating: 'Generating…',
    bullets: 'Bullets',
    risks: 'Risks',
    questionsToCheck: 'Questions to check',
    askAboutData: 'Ask about your data',
    askPlaceholder: 'Ask a question about your portfolio, bonds, or watchlist.',
    you: 'You',
    ai: 'AI',
    questionPlaceholder: 'Your question...',
    send: 'Send',
    sending: 'Sending…',
    errorDisabled: 'AI disabled: set MISTRAL_API_KEY',
    errorRateLimit: 'Rate limited. Try again later.',
    errorInvalidKey: 'Invalid MISTRAL_API_KEY',
    errorRequestFailed: 'Request failed',
  },
  marketBonds: {
    title: 'Market bonds',
    description: 'Bonds available on the market — for analyzing and comparing yield and duration.',
    sourceLabel: 'Data scope',
    sourceRf: 'Russia',
    sourceIntl: 'International',
    loading: 'Loading…',
    noData: 'No data.',
  },
  notFound: { pageNotFound: 'Page not found.', backHome: 'Back to Dashboard' },
};

export const translations: Record<Locale, TranslationKeys> = { ru, en };
