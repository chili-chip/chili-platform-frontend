import { TestBed } from '@angular/core/testing';

import { MarkdownComponent } from './markdown';

function render(text: string, breaks = false): HTMLElement {
  const fixture = TestBed.createComponent(MarkdownComponent);
  fixture.componentRef.setInput('text', text);
  fixture.componentRef.setInput('breaks', breaks);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('MarkdownComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MarkdownComponent] }).compileComponents();
  });

  it('renders markdown to HTML', () => {
    const el = render('## Patch notes\n\n- **faster** saves\n- [docs](https://chilichip.eu)');
    expect(el.querySelector('h2')?.textContent).toBe('Patch notes');
    expect(el.querySelectorAll('li').length).toBe(2);
    expect(el.querySelector('strong')?.textContent).toBe('faster');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('https://chilichip.eu');
  });

  it('keeps single line breaks when asked', () => {
    expect(render('one\ntwo', true).querySelector('br')).not.toBeNull();
    expect(render('one\ntwo').querySelector('br')).toBeNull();
  });

  it('drops scripts and event handlers', () => {
    const el = render(
      '<img src="data:," onerror="alert(1)"><script>alert(2)</script> hi\n\n[x](javascript:alert(3))',
    );
    expect(el.querySelector('script')).toBeNull();
    expect(el.querySelector('img')?.getAttribute('onerror')).toBeNull();
    // Angular neutralises the link by prefixing it with "unsafe:".
    expect(
      (el.querySelector('a')?.getAttribute('href') ?? '').startsWith('javascript:'),
    ).toBeFalse();
  });

  it('renders nothing for empty text', () => {
    expect(render('   ').innerHTML).toBe('');
  });
});
