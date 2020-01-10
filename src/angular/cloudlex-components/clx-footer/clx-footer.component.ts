import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-clx-footer',
  templateUrl: './clx-footer.component.html',
  styleUrls: ['./clx-footer.component.scss']
})
export class ClxFooterComponent implements OnInit {
  @Input() navId?:any;
  @Input() type?:string;
  private is_workflow_active:boolean = true;
  public links = [];
  constructor() { }

  ngOnInit() {
    this.linksInit();
  }
  private linksInit() {
    switch(this.type) {
      case 'Timeline':
        this.links = [
          {
            title : "Overview",
            url : "#/matter-overview/",
            hidden : false
          },
          {
            title : "All Parties",
            url : "#/allParties/",
            hidden : false
          },
          {
            title : "Details",
            url : "#matter-details/",
            hidden : false
          },
          {
            title : "Documents",
            url : "#/matter-documents/",
            hidden : false
          },
          {
            title : "Notes",
            url : "#/notes/",
            hidden : false
          },
          {
            title : "Events",
            url : "#/events/" ,
            hidden : false
          },
          {
            title : "Tasks",
            url : "#/tasks/" ,
            hidden : false
          },
          {
            title : "Workflow",
            url : "#/workflow/" ,
            hidden : !this.is_workflow_active
          },
          {
            title : "Timeline",
            url : "#/timeline/" ,
            hidden : false
          }
        ] 
        break;
      default:
        break;        
    }
  }
}

