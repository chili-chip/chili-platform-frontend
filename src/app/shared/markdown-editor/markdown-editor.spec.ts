import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type EasyMDE from 'easymde';

import { MarkdownEditorComponent } from './markdown-editor';

@Component({
  imports: [MarkdownEditorComponent, ReactiveFormsModule],
  template: '<app-markdown-editor [formControl]="control" label="Reply" />',
})
class HostComponent {
  readonly control = new FormControl('first', { nonNullable: true });
}

describe('MarkdownEditorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('loads EasyMDE with the form value and writes edits back', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const component = fixture.debugElement.children[0].componentInstance as MarkdownEditorComponent;
    for (let i = 0; i < 100 && !el.querySelector('.EasyMDEContainer'); i++) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    const editor = (component as unknown as { editor: EasyMDE }).editor;
    expect(editor).toBeDefined();
    expect(editor.value()).toBe('first');
    expect(el.querySelector('.editor-toolbar button.md-bold')).not.toBeNull();

    editor.value('**bold** reply');
    expect(fixture.componentInstance.control.value).toBe('**bold** reply');

    fixture.componentInstance.control.reset('');
    fixture.detectChanges();
    expect(editor.value()).toBe('');
  });

  it('renders a sanitized preview with line breaks', () => {
    const component = TestBed.createComponent(MarkdownEditorComponent).componentInstance;
    const html = (component as unknown as { renderPreview(text: string): string }).renderPreview(
      'one\ntwo <img src="data:," onerror="alert(1)">',
    );
    expect(html).toContain('<br>');
    expect(html).not.toContain('onerror');
  });
});
