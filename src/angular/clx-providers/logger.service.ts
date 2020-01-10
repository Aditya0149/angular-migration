import { Injectable } from '@angular/core';

@Injectable()
export class LoggerService {
  constructor() { }
  public log(message,param?) {
    if (param) console.log(`${message} :`, param);
    else console.log(message);
  }
}