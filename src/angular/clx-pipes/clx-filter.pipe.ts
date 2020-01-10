import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'clxFilter'
})
export class ClxFilterPipe implements PipeTransform {

  transform(inputArray: any, ...args: any[]): any {
    let filteredResult = []
    inputArray.filter(
      elem => {
        Object.keys(elem).forEach( key => {
          let prop = elem[key] ? elem[key].toLowerCase() : '';
          let searchKey = args[0] ? args[0].toLowerCase() : '';
          let ignoreCases = args[1] ? args[1] : [];
          if( typeof(prop) == 'string' ) {
            if ( prop.search(searchKey) != -1 && !ignoreCases.includes(key) ) {
              filteredResult.push(elem);
              // if a any key form object matches the search term then simply break this loop...
              return;
            }
          } 
        })
      }
    )
    return filteredResult;
  }

}
