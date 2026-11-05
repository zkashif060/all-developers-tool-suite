import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ToolMetadata } from '../models/tool.model';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly baseUrl = 'https://zerotrace-tools.vercel.app';

  /**
   * Updates page metadata, OpenGraph, Twitter, canonical, and Schema.org JSON-LD for a tool route.
   */
  public updateToolSeo(tool: ToolMetadata): void {
    const pageTitle = `${tool.name} — ZeroTrace Tools`;
    const fullDescription = `${tool.description} 100% private and client-side with ZeroTrace Tools. Zero server tracking.`;
    const canonicalUrl = `${this.baseUrl}${tool.route}`;

    // 1. Browser Title
    this.titleService.setTitle(pageTitle);

    // 2. Standard Meta Tags
    this.metaService.updateTag({ name: 'description', content: fullDescription });
    this.metaService.updateTag({ name: 'keywords', content: `${tool.keywords.join(', ')}, zero trace, client side, private developer tools` });
    this.metaService.updateTag({ name: 'author', content: 'ZeroTrace Tools' });

    // 3. OpenGraph Tags
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: fullDescription });
    this.metaService.updateTag({ property: 'og:url', content: canonicalUrl });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'ZeroTrace Tools' });

    // 4. Twitter Card
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: pageTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: fullDescription });

    // 5. Canonical Link
    this.updateCanonicalUrl(canonicalUrl);

    // 6. Schema.org WebApplication JSON-LD Structured Data
    this.updateJsonLd(tool, canonicalUrl);
  }

  /**
   * Sets or updates the <link rel="canonical"> element.
   */
  private updateCanonicalUrl(url: string): void {
    if (typeof document === 'undefined') return;

    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /**
   * Inserts or updates the JSON-LD script for Google Search rich snippets.
   */
  private updateJsonLd(tool: ToolMetadata, canonicalUrl: string): void {
    if (typeof document === 'undefined') return;

    const schemaId = 'schema-zerotrace-tool';
    let script = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = schemaId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript. Works in all modern browsers.',
      url: canonicalUrl,
      description: tool.description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      featureList: [
        '100% In-Browser Execution',
        'Zero Server Logging',
        'Offline PWA & Desktop Compatible',
        'Zero Telemetry & Full Data Privacy'
      ],
      author: {
        '@type': 'Organization',
        name: 'ZeroTrace Tools'
      }
    };

    script.textContent = JSON.stringify(schemaData);
  }
}

