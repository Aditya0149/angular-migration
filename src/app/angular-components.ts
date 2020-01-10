declare var angular: angular.IAngularStatic;
import { downgradeComponent, downgradeInjectable } from '@angular/upgrade/static';
import { NewAngularComponent } from 'src/angular/new-angular/new-angular.component';
import { CloudlexTableComponent } from 'src/angular/cloudlex-components/clx-table/cloudlex-table.component';
import { ClxFooterComponent } from 'src/angular/cloudlex-components/clx-footer/clx-footer.component';
import { ClxTableService } from 'src/angular/cloudlex-components/clx-table/clx-table.service';
 

angular
    .module('cloudlex')
    .directive(
        'newAngular',
        downgradeComponent({ component: NewAngularComponent})
    )
    .directive(
        'clxGrid',
        downgradeComponent({ component: CloudlexTableComponent})
    )
    .directive(
        'clxFooter',
        downgradeComponent({ component: ClxFooterComponent })
    )
    .factory(
        'clxTableService',
        downgradeInjectable(ClxTableService)
    )