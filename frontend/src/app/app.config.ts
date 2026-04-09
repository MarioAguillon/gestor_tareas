import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Providers preexistentes — no sobrescritos
    provideBrowserGlobalErrorListeners(),
    // HttpClient con interceptor de autenticación y fetch API de Angular
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withFetch()
    ),
  ],
};
