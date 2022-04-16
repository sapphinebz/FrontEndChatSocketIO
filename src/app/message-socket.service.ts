import { Injectable, OnDestroy } from '@angular/core';
import {
  AsyncSubject,
  concatMap,
  connectable,
  debounceTime,
  distinctUntilChanged,
  filter,
  mapTo,
  merge,
  Observable,
  ReplaySubject,
  shareReplay,
  Subject,
  switchMap,
  switchMapTo,
  takeUntil,
  tap,
} from 'rxjs';
import { io } from 'socket.io-client';

interface SenderMessage {
  message: string;
  name: string;
}

@Injectable()
export class MessageSocketService implements OnDestroy {
  onIdentity = new Subject<{ name: string }>();
  onSendMessage = new Subject<{ message: string }>();
  onTyping = new Subject<void>();
  onDestroy$ = new AsyncSubject<void>();
  socket = io('http://localhost:3001');

  private onIdentitiedUser$ = this.onIdentity.pipe(
    switchMap((event) =>
      this.socketEmit<{ name: string; id: string }>('identity', {
        name: event.name,
      })
    ),
    tap((_) => (this.isIdentity = true)),
    this.stateful()
  );

  typingName = '';
  isTyping = false;

  messages$ = this.onIdentitiedUser$.pipe(
    switchMapTo(
      merge(
        this.socketEmit<SenderMessage[]>('findAllMessage'),
        this.socketOn<SenderMessage[]>('messages')
      )
    ),
    this.stateful()
  );

  isIdentity = false;

  constructor() {
    this.effectOnSendMessage();
    this.effectOnTyping();
    this.effectSocketOnTyping();
  }

  private effectSocketOnTyping() {
    this.socketOn<{ name: string; isTyping: boolean }>('onTyping')
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((event) => {
        this.isTyping = event.isTyping;
        this.typingName = event.name;
      });
  }

  private effectOnSendMessage() {
    this.onSendMessage
      .pipe(
        concatMap((event) => {
          return this.socketEmit<SenderMessage[]>('createMessage', {
            message: event.message,
          });
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe();
  }

  private effectOnTyping() {
    const typeStart$ = this.onTyping.pipe(mapTo(true));
    const typeEnd$ = this.onTyping.pipe(debounceTime(1000), mapTo(false));

    merge(typeStart$, typeEnd$)
      .pipe(
        distinctUntilChanged(),
        switchMap((isTyping) => this.socketEmit('typing', { isTyping })),
        takeUntil(this.onDestroy$)
      )
      .subscribe();
  }

  private socketOn<T>(eventName: string): Observable<T> {
    return new Observable<T>((observer) => {
      const listener = (response: any) => {
        observer.next(response);
      };
      this.socket.on(eventName, listener);
      return {
        unsubscribe: () => {
          this.socket.off(eventName, listener);
        },
      };
    });
  }

  /**
   * socket.io response with Acknowledgements
   * https://socket.io/docs/v3/emitting-events/#acknowledgements
   * @param eventName
   * @param payload
   * @returns Observable
   */
  private socketEmit<T>(eventName: string, payload: any = null): Observable<T> {
    return new Observable<T>((observer) => {
      let isClose = false;
      this.socket.emit(eventName, payload, (response: any) => {
        if (!isClose) {
          observer.next(response);
          observer.complete();
        }
      });

      return {
        unsubscribe: () => {
          isClose = true;
        },
      };
    });
  }

  stateful<T>() {
    return (source: Observable<T>) => {
      const con$ = connectable(
        source.pipe(
          filter((state) => state !== undefined),
          distinctUntilChanged(),
          takeUntil(this.onDestroy$)
        ),
        { connector: () => new ReplaySubject(1), resetOnDisconnect: false }
      );

      con$.connect();
      return con$;
    };
  }

  joinChatRoom(name: string) {
    this.onIdentity.next({ name });
  }

  sendMessage(message: string) {
    this.onSendMessage.next({ message });
  }

  broadcastTyping() {
    this.onTyping.next();
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
