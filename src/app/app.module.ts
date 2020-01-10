// angular modules
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { UpgradeModule } from '@angular/upgrade/static';

// cloudlex modules
import { CloudlexComponentsModule } from 'src/angular/cloudlex-components/cloudlex-components.module';

// cloudlex components
import { NewAngularComponent } from '../angular/new-angular/new-angular.component';

// ajs providers
import { TimelineListHelperProvider } from '../angular/ajs-upgraded-providers';
import { timelineDataProvider } from '../angular/ajs-upgraded-providers';
import { MatterModule } from '../angular/matter/matter.module';

// angularjs module declarations
import { bootstrapAngularjsApp } from './app';
import { ClxProvidersModule } from 'src/angular/clx-providers/clx-providers.module';
import { LoggerService } from 'src/angular/clx-providers/logger.service';
import { ClxPipesModule } from 'src/angular/clx-pipes/clx-pipes.module';


@NgModule({
  declarations: [
      NewAngularComponent
  ],
  imports: [
    BrowserModule,
    UpgradeModule,
    // clx modules
    ClxProvidersModule,
    CloudlexComponentsModule,
    MatterModule,
  ],
  providers: [
    //ajs providers
    TimelineListHelperProvider,
    timelineDataProvider
  ],
  entryComponents:[
    NewAngularComponent
  ],
  bootstrap: []
})
export class AppModule {
  constructor(private upgrade: UpgradeModule,private logger:LoggerService) { }
  ngDoBootstrap() {
    this.logger.log("ngDoBootstrap called...");
    bootstrapAngularjsApp(this);
  }
}