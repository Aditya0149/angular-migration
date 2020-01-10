import { Component, OnInit, Inject } from '@angular/core';
import { LoggerService } from '../clx-providers/logger.service';


@Component({
  selector: 'app-new-angular',
  templateUrl: './new-angular.component.html',
  styleUrls: ['./new-angular.component.scss']
})
export class NewAngularComponent implements OnInit {

  constructor(@Inject('$rootScope') private rootScope, private logger:LoggerService) { }

  ngOnInit() {
    this.logger.log('rootScope',this.rootScope);
  }

}
