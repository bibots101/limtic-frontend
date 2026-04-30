import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { customXsrfInterceptor } from './interceptors/custom-xsrf.interceptor';
import { ThemeService } from './services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([customXsrfInterceptor]) // uniquement le custom
    ),
    ThemeService
  ]
};
