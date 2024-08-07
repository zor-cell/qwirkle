import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './components/app.component';
import { GameComponent } from './components/game/game.component';
import { HandComponent } from './components/hand/hand.component';
import { StackComponent } from './components/stack/stack.component';

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    HandComponent,
    StackComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
