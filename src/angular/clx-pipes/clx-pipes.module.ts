import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClxFilterPipe } from './clx-filter.pipe';



@NgModule({
  declarations: [ClxFilterPipe],
  imports: [
    CommonModule
  ],
  exports: [
    ClxFilterPipe
  ]
})
export class ClxPipesModule { }
