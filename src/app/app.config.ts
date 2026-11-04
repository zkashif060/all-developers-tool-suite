import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';

const isElectronOrLocalFile = typeof window !== 'undefined' && (
  window.location.protocol === 'file:' ||
  (typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron'))
);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, ...(isElectronOrLocalFile ? [withHashLocation()] : []))
  ]
};
