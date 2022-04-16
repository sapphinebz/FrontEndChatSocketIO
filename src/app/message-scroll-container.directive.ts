import { Directive, ElementRef, OnDestroy } from '@angular/core';
import { AsyncSubject, Observable, takeUntil } from 'rxjs';

@Directive({
  selector: '[appMessageScrollContainer]',
})
export class MessageScrollContainerDirective implements OnDestroy {
  onDestroy$ = new AsyncSubject<void>();
  constructor(private el: ElementRef<HTMLElement>) {
    this.onChildListChange(this.el.nativeElement)
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(() => {
        const element = this.el.nativeElement;
        element.scrollTop = element.scrollHeight;
      });
  }

  onChildListChange(element: HTMLElement) {
    return new Observable<MutationRecord[]>((observer) => {
      const mutate = new MutationObserver((entries) => {
        observer.next(entries);
      });
      const config = {
        characterData: false,
        attributes: false,
        childList: true,
        subtree: false,
      };
      mutate.observe(element, config);
      return {
        unsubscribe: () => {
          mutate.disconnect();
        },
      };
    });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
