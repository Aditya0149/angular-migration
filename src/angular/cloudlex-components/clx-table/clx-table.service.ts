import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { Columns, TableData } from './table-data.interface';

@Injectable({
  providedIn: 'root'
})
export class ClxTableService {
  public updateTable:BehaviorSubject<any> = new BehaviorSubject([]);
  public updateTableOtions:BehaviorSubject<any> = new BehaviorSubject('');
  public showTable:BehaviorSubject<boolean> = new BehaviorSubject(false);
  public searchKey:BehaviorSubject<string> = new BehaviorSubject('');
  //public paginationEvent:BehaviorSubject<string> = new BehaviorSubject('');
  constructor() { }
}
