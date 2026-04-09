import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

// 1. IMPORTACIONES DE LOCALE
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';

// 2. REGISTRO DEL IDIOMA
registerLocaleData(localeEs, 'es');

// 3. ARRANQUE — combinando appConfig.providers (HttpClient + interceptor) con LOCALE_ID
bootstrapApplication(App, {
  providers: [
    ...appConfig.providers,
    { provide: LOCALE_ID, useValue: 'es' },
  ],
}).catch((err) => console.error(err));