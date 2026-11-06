import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToolSearchComponent } from './tool-search.component';

describe('ToolSearchComponent', () => {
  let fixture: ComponentFixture<ToolSearchComponent>;
  let component: ToolSearchComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolSearchComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ToolSearchComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should not display modal dialog when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).toBeNull();
  });

  it('should display modal dialog when isOpen is true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
  });

  it('should emit closed when Escape is pressed on the window', () => {
    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(closedEmitted).toBe(true);
  });

  it('should emit closed when Escape is pressed on the input', () => {
    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(closedEmitted).toBe(true);
  });

  it('should emit closed when ESC button is clicked', () => {
    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const escButton = fixture.nativeElement.querySelector('button[aria-label="Close search (Escape)"]') as HTMLButtonElement;
    expect(escButton).toBeTruthy();
    escButton.click();
    expect(closedEmitted).toBe(true);
  });

  it('should emit closed when backdrop is clicked', () => {
    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    backdrop.click();
    expect(closedEmitted).toBe(true);
  });

  it('should filter tools by query', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'json';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThan(0);
  });
});
