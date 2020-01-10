import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cloudlex-table',
  templateUrl: './cloudlex-table.component.html',
  styleUrls: ['./cloudlex-table.component.scss']
})
export class CloudlexTableComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    console.log('CloudlexTableComponent init...');
  }

}
