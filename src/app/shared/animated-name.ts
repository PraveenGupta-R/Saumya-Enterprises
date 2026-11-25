import { Component, computed, input } from '@angular/core';

/**
 * Company name where each letter rises into place, then a soft colour wave keeps
 * travelling through the name. Plain text stays in the DOM (aria-label) for SEO and screen readers.
 * Colours come from CSS variables --an-base and --an-wave set by the parent.
 */
@Component({
  selector: 'app-animated-name',
  template: `
    <span class="name" [attr.aria-label]="text()">
      <span aria-hidden="true">
        @for (w of words(); track $index) {<span class="word">@for (c of w; track $index) {<span class="ch" [style.animation-delay]="c.delay">{{ c.ch }}</span>}</span>}
      </span>
    </span>
  `,
  styles: [
    `
      :host { display: inline-block; }
      .name { display: inline; }
      .word { display: inline-block; white-space: nowrap; margin-right: 0.26em; }
      .word:last-child { margin-right: 0; }
      .ch {
        display: inline-block; opacity: 0; transform: translateY(0.55em) scale(0.96);
        color: var(--an-base, currentColor);
        animation: an-rise 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards, an-wave 6s ease-in-out infinite;
      }
      @keyframes an-rise { to { opacity: 1; transform: none; } }
      @keyframes an-wave {
        0%, 62%, 100% { color: var(--an-base, currentColor); }
        30% { color: var(--an-wave, #f58a25); }
      }
      @media (prefers-reduced-motion: reduce) {
        .ch { opacity: 1 !important; transform: none !important; animation: none !important; }
      }
    `,
  ],
})
export class AnimatedName {
  text = input.required<string>();
  /** delay between letters in ms */
  step = input(55);

  words = computed(() => {
    let i = 0;
    return this.text()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) =>
        [...w].map((ch) => {
          const d = 200 + i * this.step();
          i++;
          // rise-in delay, then the colour wave starts after the reveal and follows the letter order
          return { ch, delay: `${d}ms, ${1400 + d}ms` };
        }),
      );
  });
}
