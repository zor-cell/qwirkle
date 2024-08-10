import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './components/app.component';
import { GameComponent } from './components/game/game.component';
import { HandComponent } from './components/hand/hand.component';
import { StackComponent } from './components/stack/stack.component';
import { EventHandlerComponent } from './components/event-handler/event-handler.component';
import { CameraComponent } from './components/camera/camera.component';

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    HandComponent,
    StackComponent,
    EventHandlerComponent,
    CameraComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
