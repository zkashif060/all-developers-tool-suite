import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard — ZeroTrace Tools'
      },
      {
        path: 'tools',
        loadComponent: () => import('./pages/all-tools/all-tools.component').then(m => m.AllToolsComponent),
        title: 'All Developer Utilities — ZeroTrace Tools'
      },
      {
        path: 'favorites',
        loadComponent: () => import('./pages/favorites/favorites.component').then(m => m.FavoritesComponent),
        title: 'Favorites — ZeroTrace Tools'
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent),
        title: 'About & Privacy Guarantee — ZeroTrace Tools'
      },

      // 13 Developer Utilities (Lazy Loaded)
      {
        path: 'tools/json-formatter',
        loadComponent: () => import('./tools/json-formatter/json-formatter.component').then(m => m.JsonFormatterComponent),
        title: 'JSON Formatter & Minifier — ZeroTrace Tools'
      },
      {
        path: 'tools/json-validator',
        loadComponent: () => import('./tools/json-validator/json-validator.component').then(m => m.JsonValidatorComponent),
        title: 'JSON Validator — ZeroTrace Tools'
      },
      {
        path: 'tools/json-to-csv',
        loadComponent: () => import('./tools/json-to-csv/json-to-csv.component').then(m => m.JsonToCsvComponent),
        title: 'JSON to CSV Converter — ZeroTrace Tools'
      },
      {
        path: 'tools/csv-to-json',
        loadComponent: () => import('./tools/csv-to-json/csv-to-json.component').then(m => m.CsvToJsonComponent),
        title: 'CSV to JSON Converter — ZeroTrace Tools'
      },
      {
        path: 'tools/image-base64',
        loadComponent: () => import('./tools/image-base64/image-base64.component').then(m => m.ImageBase64Component),
        title: 'Image to Base64 Converter — ZeroTrace Tools'
      },
      {
        path: 'tools/base64',
        loadComponent: () => import('./tools/base64/base64.component').then(m => m.Base64Component),
        title: 'Base64 Encoder / Decoder — ZeroTrace Tools'
      },
      {
        path: 'tools/url-encoder',
        loadComponent: () => import('./tools/url-encoder/url-encoder.component').then(m => m.UrlEncoderComponent),
        title: 'URL Encoder / Decoder — ZeroTrace Tools'
      },
      {
        path: 'tools/jwt-decoder',
        loadComponent: () => import('./tools/jwt-decoder/jwt-decoder.component').then(m => m.JwtDecoderComponent),
        title: 'JWT Token Decoder — ZeroTrace Tools'
      },
      {
        path: 'tools/uuid-generator',
        loadComponent: () => import('./tools/uuid-generator/uuid-generator.component').then(m => m.UuidGeneratorComponent),
        title: 'UUID Generator — ZeroTrace Tools'
      },
      {
        path: 'tools/timestamp',
        loadComponent: () => import('./tools/timestamp/timestamp.component').then(m => m.TimestampComponent),
        title: 'Unix Timestamp Converter — ZeroTrace Tools'
      },
      {
        path: 'tools/timestamp-converter',
        redirectTo: 'tools/timestamp',
        pathMatch: 'full'
      },
      {
        path: 'tools/regex-tester',
        loadComponent: () => import('./tools/regex-tester/regex-tester.component').then(m => m.RegexTesterComponent),
        title: 'Regex Tester & Matcher — ZeroTrace Tools'
      },
      {
        path: 'tools/cron-builder',
        loadComponent: () => import('./tools/cron-builder/cron-builder.component').then(m => m.CronBuilderComponent),
        title: 'Cron Expression Builder — ZeroTrace Tools'
      },
      {
        path: 'tools/text-diff',
        loadComponent: () => import('./tools/text-diff/text-diff.component').then(m => m.TextDiffComponent),
        title: 'Text Difference Checker — ZeroTrace Tools'
      },
      {
        path: 'tools/text-difference',
        redirectTo: 'tools/text-diff',
        pathMatch: 'full'
      },
      {
        path: 'tools/sha256',
        loadComponent: () => import('./tools/sha256/sha256.component').then(m => m.Sha256Component),
        title: 'SHA-256 Hash Generator — ZeroTrace Tools'
      },

      // 404 Not Found Wildcard
      {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
        title: '404 Utility Not Found — ZeroTrace Tools'
      }
    ]
  }
];
