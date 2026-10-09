import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CreatorComponent } from './creator';

describe('CreatorComponent leave warning', () => {
  let fixture: ComponentFixture<CreatorComponent>;
  let component: CreatorComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CreatorComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(CreatorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => fixture.destroy());

  function editorSays(unsaved: boolean): void {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: { type: 'chili-save-state', state: unsaved ? 'unsaved' : 'saved', unsaved },
      }),
    );
  }

  it('leaves without asking when everything is saved', () => {
    const confirm = spyOn(window, 'confirm');
    editorSays(false);
    expect(component.canLeave('/community')).toBeTrue();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks before leaving with unsaved work', () => {
    const confirm = spyOn(window, 'confirm').and.returnValue(false);
    editorSays(true);
    expect(component.canLeave('/community')).toBeFalse();
    expect(confirm).toHaveBeenCalled();
  });

  it('lets the editor move between creator pages', () => {
    const confirm = spyOn(window, 'confirm');
    editorSays(true);
    expect(component.canLeave('/creator/7')).toBeTrue();
    expect(confirm).not.toHaveBeenCalled();
  });
});
