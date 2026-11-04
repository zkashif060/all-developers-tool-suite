import { Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-logo',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 48 48"
      fill="none"
      [class]="className()"
    >
      <defs>
        <linearGradient [attr.id]="'dthGrad_' + idSuffix" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4F46E5" />
          <stop offset="50%" stop-color="#3762EA" />
          <stop offset="100%" stop-color="#0284C7" />
        </linearGradient>
        <linearGradient [attr.id]="'dthGlow_' + idSuffix" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
        <filter [attr.id]="'dthShadow_' + idSuffix" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#1E1B4B" flood-opacity="0.35" />
        </filter>
      </defs>
      <!-- Squircle Container -->
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="11"
        [attr.fill]="'url(#dthGrad_' + idSuffix + ')'"
        [attr.filter]="'url(#dthShadow_' + idSuffix + ')'"
      />
      <!-- Specular Top Highlight -->
      <rect
        x="3"
        y="3"
        width="42"
        height="20"
        rx="10"
        [attr.fill]="'url(#dthGlow_' + idSuffix + ')'"
      />
      <!-- Subtle Inner Border -->
      <rect
        x="2.5"
        y="2.5"
        width="43"
        height="43"
        rx="10.5"
        stroke="#ffffff"
        stroke-opacity="0.25"
        stroke-width="1"
      />
      <!-- Code Chevrons < / > -->
      <path
        d="M18 16L11 24L18 32"
        stroke="#ffffff"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M30 16L37 24L30 32"
        stroke="#ffffff"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M26.5 14.5L21.5 33.5"
        stroke="#38BDF8"
        stroke-width="3.2"
        stroke-linecap="round"
      />
    </svg>
  `
})
export class BrandLogoComponent {
  public readonly size = input<number>(32);
  public readonly className = input<string>('shrink-0 drop-shadow-sm');

  // Unique ID suffix to prevent gradient ID collisions in DOM
  protected readonly idSuffix = Math.random().toString(36).substring(2, 7);
}

