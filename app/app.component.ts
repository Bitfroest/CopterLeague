import { Component } from '@angular/core';
import { RouteConfig, ROUTER_DIRECTIVES } from '@angular/router-deprecated';

import { PilotsComponent } from './pilots.component';
import { PilotService } from './pilot.service';

@Component({
  selector: 'my-app',
  templateUrl: 'app.component.pug',
  directives: [ROUTER_DIRECTIVES],
  providers: [PilotService]
})
@RouteConfig([
  // {path: '/', redirectTo: ['Dashboard'] },
  {path: '/p', name: 'Pilots', component: PilotsComponent, useAsDefault: true}
])
export class AppComponent { }