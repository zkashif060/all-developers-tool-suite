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
      {
        path: 'tools/api-tester',
        loadComponent: () => import('./tools/api-tester/api-tester.component').then(m => m.ApiTesterComponent),
        title: 'API Tester / REST Client — ZeroTrace Tools'
      },
      {
        path: 'tools/rest-client',
        redirectTo: 'tools/api-tester',
        pathMatch: 'full'
      },
      {
        path: 'tools/sql-formatter',
        loadComponent: () => import('./tools/sql-formatter/sql-formatter.component').then(m => m.SqlFormatterComponent),
        title: 'SQL Formatter — ZeroTrace Tools'
      },
      {
        path: 'tools/sql',
        redirectTo: 'tools/sql-formatter',
        pathMatch: 'full'
      },
      {
        path: 'tools/json-to-typescript',
        loadComponent: () => import('./tools/json-to-typescript/json-to-typescript.component').then(m => m.JsonToTypescriptComponent),
        title: 'JSON to TypeScript — ZeroTrace Tools'
      },
      {
        path: 'tools/json-to-ts',
        redirectTo: 'tools/json-to-typescript',
        pathMatch: 'full'
      },
      {
        path: 'tools/yaml-json-converter',
        loadComponent: () => import('./tools/yaml-json-converter/yaml-json-converter.component').then(m => m.YamlJsonConverterComponent),
        title: 'YAML to JSON / JSON to YAML — ZeroTrace Tools'
      },
      {
        path: 'tools/yaml-to-json',
        redirectTo: 'tools/yaml-json-converter',
        pathMatch: 'full'
      },
      {
        path: 'tools/json-to-yaml',
        redirectTo: 'tools/yaml-json-converter',
        pathMatch: 'full'
      },
      {
        path: 'tools/code-formatter',
        loadComponent: () => import('./tools/code-formatter/code-formatter.component').then(m => m.CodeFormatterComponent),
        title: 'HTML / CSS / JavaScript Formatter — ZeroTrace Tools'
      },
      {
        path: 'tools/html-css-js-formatter',
        redirectTo: 'tools/code-formatter',
        pathMatch: 'full'
      },
      {
        path: 'tools/html-formatter',
        redirectTo: 'tools/code-formatter',
        pathMatch: 'full'
      },
      {
        path: 'tools/css-formatter',
        redirectTo: 'tools/code-formatter',
        pathMatch: 'full'
      },
      {
        path: 'tools/javascript-formatter',
        redirectTo: 'tools/code-formatter',
        pathMatch: 'full'
      },
      {
        path: 'tools/js-formatter',
        redirectTo: 'tools/code-formatter',
        pathMatch: 'full'
      },
      {
        path: 'tools/html-css-javascript-formatter',
        redirectTo: 'tools/code-formatter',
        pathMatch: 'full'
      },
      {
        path: 'tools/json-tree-viewer',
        loadComponent: () => import('./tools/json-tree-viewer/json-tree-viewer.component').then(m => m.JsonTreeViewerComponent),
        title: 'JSON Tree Viewer — ZeroTrace Tools'
      },
      {
        path: 'tools/json-tree',
        redirectTo: 'tools/json-tree-viewer',
        pathMatch: 'full'
      },
      {
        path: 'tools/json-viewer',
        redirectTo: 'tools/json-tree-viewer',
        pathMatch: 'full'
      },
      {
        path: 'tools/json-explorer',
        redirectTo: 'tools/json-tree-viewer',
        pathMatch: 'full'
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
