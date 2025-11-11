# Извлеченные URL из HAR файла

## 📊 Статистика
- **Всего уникальных URL**: 53
- **API Endpoints**: 9
- **Статические ресурсы**: ~40
- **Сторонние сервисы**: ~4

---

## 🎯 Backend API Endpoints (Priority для Load Testing)

### Base URL
```
https://platform.moya-smena.ru/api/superapp/v1
```

### Endpoints List

#### 1. Конфигурация приложения
```
GET /api/superapp/v1/app-config/
```

#### 2. Типы документов
```
GET /api/superapp/v1/doc_types/
```

#### 3. Данные текущего пользователя
```
GET /api/superapp/v1/employees/me/
```

#### 4. Адреса пользователя
```
GET /api/superapp/v1/employees/me/addresses/
```

#### 5. Документы пользователя
```
GET /api/superapp/v1/employees/me/docs/
```

#### 6. Открытые смены (основной endpoint)
```
GET /api/superapp/v1/shifts/open/?end_date={DATE}&start_date={DATE}&page=1&ordering=is_recommended&lat={LAT}&lon={LON}

Примеры параметров:
- end_date: 2025-10-24
- start_date: 2025-10-24
- lat: 55.889471
- lon: 37.6547987
- page: 1
- ordering: is_recommended
```

#### 7. Счетчики смен по дням
```
GET /api/superapp/v1/shifts/open/days-counters/?end_date={DATE}&start_date={DATE}&lat={LAT}&lon={LON}&page=1&page_size=38

Примеры:
- end_date: 2025-11-30
- start_date: 2025-10-24
- page_size: 38
```

#### 8. Быстрые фильтры для смен
```
GET /api/superapp/v1/shifts/open/quick-filters/?end_date={DATE}&start_date={DATE}&lat={LAT}&lon={LON}

Примеры:
- end_date: 2025-12-31
- start_date: 2025-10-24
```

---

## 🌐 Статические ресурсы (для Load Testing)

### Base URL
```
https://web-superapp.moya-smena.ru
```

### JavaScript бандлы (HIGH PRIORITY)

```
GET /main.dart.js
GET /flutter_bootstrap.js
```

### WebAssembly модули

```
GET /canvaskit/chromium/canvaskit.js
GET /canvaskit/chromium/canvaskit.wasm
```

### Конфигурационные файлы

```
GET /manifest.json
GET /assets/FontManifest.json
GET /hh-loader.json
GET /favicon.png
GET /icons/Icon-192.png
```

### Шрифты (выборочно)

#### Onest Font Family
```
GET /assets/assets/fonts/onest/Onest-Regular.ttf
GET /assets/assets/fonts/onest/Onest-Medium.ttf
GET /assets/assets/fonts/onest/Onest-SemiBold.ttf
GET /assets/assets/fonts/onest/Onest-Bold.ttf
GET /assets/assets/fonts/onest/Onest-ExtraBold.ttf
```

#### Системные шрифты
```
GET /assets/fonts/MaterialIcons-Regular.otf
GET /assets/packages/cupertino_icons/assets/CupertinoIcons.ttf
```

#### Custom Icons Font
```
GET /assets/assets/icons/app_icons_font.otf
```

### SVG Иконки (выборочно для тестирования)

#### Dashboard Tabs
```
GET /assets/assets/icons/dashboard_tabs/home.svg
GET /assets/assets/icons/dashboard_tabs/catalog.svg
GET /assets/assets/icons/dashboard_tabs/favorites.svg
GET /assets/assets/icons/dashboard_tabs/my_shifts.svg
GET /assets/assets/icons/dashboard_tabs/profile.svg
```

#### Common Icons
```
GET /assets/assets/icons/arrow-chevron-right-12.svg
GET /assets/assets/icons/arrow_top.svg
GET /assets/assets/icons/calendar-off.svg
GET /assets/assets/icons/favorite-off.svg
GET /assets/assets/icons/favourite_organisation_stroke.svg
GET /assets/assets/icons/filters-off.svg
GET /assets/assets/icons/metro_msk.svg
GET /assets/assets/icons/pin.svg
```

### Flutter Web Support
```
GET /assets/packages/flutter_inappwebview_web/assets/web/web_support.js
```

---

## 🖼️ CDN ресурсы (опционально)

### Lottie Animations
```
GET https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm
GET https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web@0.54.1/dist/dotlottie-player.wasm
```

### Google Fonts
```
GET https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Me4GZLCzYlKw.woff2
```

### Cloud Storage (Images)
```
https://storage.cloud.croc.ru/outsourcing/ServiceNames.prod/app/outsource_headquater/175_headquater/logo.png
https://storage.cloud.croc.ru/outsourcing/ServiceNames.prod/app/outsource_headquater/178_headquater/logo.png
https://storage.cloud.croc.ru/outsourcing/ServiceNames.prod/app/outsource_headquater/527_headquater/logo.png
```

---

## 🚫 Исключить из тестирования

### Аналитика (Яндекс.Метрика)
```
❌ https://mc.yandex.ru/metrika/tag.js?id=104021012
❌ https://mc.yandex.ru/watch/104021012/...
```

---

## 📝 Рекомендуемый набор для K6 тестов

### Минимальный набор (Smoke Test)
```javascript
// API (5 endpoints)
- GET /api/superapp/v1/app-config/
- GET /api/superapp/v1/employees/me/
- GET /api/superapp/v1/shifts/open/?...
- GET /api/superapp/v1/shifts/open/days-counters/?...
- GET /api/superapp/v1/shifts/open/quick-filters/?...

// Static (3 ресурса)
- GET /main.dart.js
- GET /flutter_bootstrap.js
- GET /manifest.json
```

### Стандартный набор (Load Test)
```javascript
// API (8 endpoints) - все кроме doc_types

// Static (8 ресурсов)
- JavaScript: main.dart.js, flutter_bootstrap.js
- WASM: canvaskit.js, canvaskit.wasm
- Configs: manifest.json, FontManifest.json
- Fonts: Onest-Regular.ttf, MaterialIcons-Regular.otf
```

### Полный набор (Stress Test)
```javascript
// API (9 endpoints) - все

// Static (15+ ресурсов)
- Все из стандартного набора
- + 5 SVG иконок (dashboard tabs)
- + 2-3 шрифта Onest
- + CDN ресурсы (Lottie)
```

---

## 🔧 Параметры для тестирования

### Координаты (из HAR)
```javascript
const locations = [
  { lat: 55.889471, lon: 37.6547987, name: "Moscow" },
  // Добавить другие локации при необходимости
];
```

### Даты (динамические)
```javascript
const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const monthLater = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
```

### Пагинация
```javascript
const pagination = {
  page: 1,
  page_size: 38
};
```

### Сортировка
```javascript
const ordering = 'is_recommended';
```

---

## 💡 Примеры использования в K6

### Пример 1: API Request
```javascript
import http from 'k6/http';

const BASE_URL = 'https://platform.moya-smena.ru/api/superapp/v1';

export default function() {
  const params = {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'k6-load-test',
    },
  };
  
  const response = http.get(`${BASE_URL}/employees/me/`, params);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Пример 2: Batch Requests
```javascript
import http from 'k6/http';

export default function() {
  const requests = [
    { method: 'GET', url: 'https://web-superapp.moya-smena.ru/main.dart.js' },
    { method: 'GET', url: 'https://web-superapp.moya-smena.ru/flutter_bootstrap.js' },
    { method: 'GET', url: 'https://web-superapp.moya-smena.ru/manifest.json' },
  ];
  
  const responses = http.batch(requests);
}
```

---

## 📌 Заметки

1. **Все API endpoints требуют HTTPS**
2. **Координаты являются обязательными для endpoints со сменами**
3. **Даты должны быть в формате YYYY-MM-DD**
4. **Статические ресурсы кэшируются браузером** - учесть при тестировании
5. **WASM файлы могут быть большими** - проверить размер ответа
6. **Flutter Web использует CanvasKit** для рендеринга

