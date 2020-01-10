import { Component, Input, SimpleChanges, OnChanges, ElementRef, ViewChild } from '@angular/core';
import { LoggerService } from 'src/angular/clx-providers/logger.service';
import { ClxTableService } from './clx-table.service';

@Component({
  selector: 'app-cloudlex-table',
  templateUrl: './cloudlex-table.component.html',
  styleUrls: ['./cloudlex-table.component.scss']
})
export class CloudlexTableComponent implements OnChanges {
  @Input() tableData = [];
  @Input() tableOptions = [];
  @Input() searchKey = '';
  private footerPresent = true;
  @ViewChild('table',{static:false}) table:ElementRef;

  constructor(private logger:LoggerService, public clxTableService:ClxTableService) { }
  
  ngOnChanges(changes:SimpleChanges) {
    for (let propName in changes) {
      if(propName == 'tableData' || propName == 'tableOptions') {
        if (this.tableData.length) this.setDisplayTableData();
      }
    }
  }

  // get all the column keys from user provided table options
  getAllColumnKeys() {
    let allKeys:string[] = [];
    this.tableOptions.forEach( option => {
      option.keys.forEach ( key => allKeys.push(key.name) )
    });
    return allKeys;
  }

  // this function modifies the input table data - removes all unwanted columns.
  setDisplayTableData() {
    let allColumnKeys:string[] = this.getAllColumnKeys();
    this.tableData.forEach ( record => {
        Object.keys(record).forEach( key => {
          // if key does not exist in user provided table options then remove that property.
          if(!allColumnKeys.includes(key)) {
            delete record[key];
          }
        })
    })
    setTimeout( () => this.changeTableHeight(),0);
  }

  changeTableHeight() {
    let table = this.table.nativeElement;
    let tableTopPos = table.offsetTop;
    let tbody =  table.childNodes[1];
    let tbodyTopPos = tbody.offsetTop + tableTopPos; // reason of adding tableTopPos is tbody.offsetTop only returns realtive top postion.
    let tableEndPosition = this.footerPresent ? 570 : -10;
    let tableHeight = tableEndPosition - tbodyTopPos;
    tbody.style.height = tableHeight + 'px';
  }

}