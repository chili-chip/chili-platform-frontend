import {
  AfterViewInit,
  Component,
  ElementRef,
  effect,
  forwardRef,
  inject,
  input,
  model,
  OnDestroy,
  SecurityContext,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import type EasyMDE from 'easymde';
import { marked } from 'marked';

type Toolbar = NonNullable<EasyMDE.Options['toolbar']>;

/**
 * Markdown editor (EasyMDE) for text people write on the site: forum posts, replies and
 * listing descriptions. Works with reactive forms or with [(value)].
 * The preview renders like app-markdown (marked, line breaks kept, sanitized).
 */
@Component({
  selector: 'app-markdown-editor',
  template: '<textarea #area [attr.aria-label]="label()" [placeholder]="placeholder()"></textarea>',
  styleUrl: './markdown-editor.scss',
  // EasyMDE builds its own DOM, so its styles cannot be scoped.
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MarkdownEditorComponent),
      multi: true,
    },
  ],
})
export class MarkdownEditorComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly area = viewChild.required<ElementRef<HTMLTextAreaElement>>('area');

  readonly value = model('');
  readonly label = input('Text');
  readonly placeholder = input('');
  readonly minHeight = input('140px');

  private editor?: EasyMDE;
  private destroyed = false;
  private disabled = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    // Keep the editor in step when the parent sets the value, e.g. after loading or a reset.
    effect(() => {
      const text = this.value();
      if (this.editor && this.editor.value() !== text) {
        this.editor.value(text);
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    // Loaded on demand so pages without an editor don't download it.
    const { default: EasyMDECtor } = await import('easymde');
    if (this.destroyed) {
      return;
    }
    const editor = new EasyMDECtor({
      element: this.area().nativeElement,
      initialValue: this.value(),
      placeholder: this.placeholder(),
      minHeight: this.minHeight(),
      autoDownloadFontAwesome: false,
      spellChecker: false,
      nativeSpellcheck: true,
      status: false,
      sideBySideFullscreen: false,
      toolbar: toolbar(EasyMDECtor),
      previewClass: ['editor-preview', 'markdown', 'ui-prose'],
      previewRender: (text) => this.renderPreview(text),
    });
    editor.codemirror.on('change', () => {
      const text = editor.value();
      if (text !== this.value()) {
        this.value.set(text);
        this.onChange(text);
      }
    });
    editor.codemirror.on('blur', () => this.onTouched());
    editor.codemirror.setOption('readOnly', this.disabled);
    this.editor = editor;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.editor?.toTextArea();
    this.editor?.cleanup();
    this.editor = undefined;
  }

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.editor?.codemirror.setOption('readOnly', disabled);
  }

  private renderPreview(text: string): string {
    const html = marked.parse(text, { async: false, gfm: true, breaks: true });
    return this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  }
}

/** Text labels instead of Font Awesome, which EasyMDE would load from a CDN. */
function toolbar(E: typeof EasyMDE): Toolbar {
  const button = (
    name: string,
    action: (editor: EasyMDE) => void,
    title: string,
    icon: string,
    noDisable = false,
    noMobile = false,
  ) => ({ name, action, title, icon, className: `md-${name}`, noDisable, noMobile });
  return [
    button('bold', E.toggleBold, 'Bold (Ctrl-B)', '<b>B</b>'),
    button('italic', E.toggleItalic, 'Italic (Ctrl-I)', '<i>I</i>'),
    button('heading', E.toggleHeadingSmaller, 'Heading (Ctrl-H)', 'H'),
    '|',
    button('quote', E.toggleBlockquote, "Quote (Ctrl-')", '&ldquo;'),
    button('unordered-list', E.toggleUnorderedList, 'List (Ctrl-L)', '&bull;'),
    button('ordered-list', E.toggleOrderedList, 'Numbered list (Ctrl-Alt-L)', '1.'),
    '|',
    button('link', E.drawLink, 'Link (Ctrl-K)', 'link'),
    button('code', E.toggleCodeBlock, 'Code (Ctrl-Alt-C)', '&lt;/&gt;'),
    '|',
    button('preview', E.togglePreview, 'Preview (Ctrl-P)', 'preview', true),
    // Editor and preview next to each other. Hidden on phones, where there is no room.
    button('side-by-side', E.toggleSideBySide, 'Split view (F9)', 'split', true, true),
  ];
}
