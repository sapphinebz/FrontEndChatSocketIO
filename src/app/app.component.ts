import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MessageSocketService } from './message-socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MessageSocketService],
})
export class AppComponent {
  title = 'WebSocketMessage';
  joinNameControl = new FormControl('', Validators.required);
  messageControl = new FormControl('', Validators.required);

  constructor(public messageSocket: MessageSocketService) {}

  sendMessage() {
    if (this.messageControl.untouched) {
      this.messageControl.markAsTouched();
    }
    if (this.messageControl.valid) {
      this.messageSocket.sendMessage(this.messageControl.value);
      this.messageControl.setValue('');
      this.messageControl.markAsUntouched();
    }
  }

  joinChatRoom() {
    if (this.joinNameControl.untouched) {
      this.joinNameControl.markAsTouched();
    }
    if (this.joinNameControl.valid) {
      this.messageSocket.joinChatRoom(this.joinNameControl.value);
    }
  }
}
