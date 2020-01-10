import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudlexTableComponent } from './clx-table/cloudlex-table.component';
import { ClxFooterComponent } from './clx-footer/clx-footer.component';
import { ClxPipesModule } from '../clx-pipes/clx-pipes.module';
import { ClxFilterPipe } from '../clx-pipes/clx-filter.pipe';

@NgModule({
  declarations: [
    // components
    CloudlexTableComponent, 
    ClxFooterComponent
  ],
  imports: [
    CommonModule,
    ClxPipesModule
  ],
  exports: [
    CloudlexTableComponent,
    ClxFooterComponent
  ],
  entryComponents: [
    CloudlexTableComponent,
    ClxFooterComponent
  ]
})
export class CloudlexComponentsModule { }
