import { TimelineListHelperService } from '../app/timeline/timeline-list-helper';
import { TimelineDataService } from '../app/timeline/timeline-data-service';

export function timelineListHelperFactory(i: any) {
  return i.get('timelineListHelper');
}

export const TimelineListHelperProvider = {
  provide: TimelineListHelperService,
  useFactory: timelineListHelperFactory,
  deps: ['$injector']
};

export function timelineDataFactory(i: any) {
  return i.get('timelineData');
}

export const timelineDataProvider = {
  provide: TimelineDataService,
  useFactory: timelineDataFactory,
  deps: ['$injector']
};
