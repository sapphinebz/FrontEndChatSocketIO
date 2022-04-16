import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MessageSocketService } from './message-socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MessageSocketService],
})
export class AppComponent {
  @ViewChild('messageInput', { static: false, read: ElementRef })
  set inputMessageEl(el: ElementRef<HTMLElement>) {
    if (el) {
      el.nativeElement.focus();
    }
  }
  title = 'WebSocketMessage';
  joinNameControl = new FormControl('', Validators.required);
  messageControl = new FormControl('', Validators.required);

  constructor(public messageSocket: MessageSocketService) {}

  sendMessage() {
    if (this.messageControl.valid) {
      this.messageSocket.sendMessage(this.messageControl.value);
      this.messageControl.setValue('');
      this.messageControl.markAsUntouched();
    }
  }

  joinChatRoom() {
    if (this.joinNameControl.valid) {
      this.messageSocket.joinChatRoom(this.joinNameControl.value);
    }
  }
}
