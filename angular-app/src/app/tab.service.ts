import { Injectable } from '@angular/core';
import { Tab } from './tab.model';
import { LessonsComponent } from './components/lessons.component';
import { StudentsComponent } from './components/students.component';
import {BehaviorSubject, Observable, Subject} from 'rxjs';

@Injectable()
export class TabService {
  private tabChange = new Subject<void>();

  public tabs: Tab[] = [
    new Tab(StudentsComponent, 'Students', { parent: 'AppComponent', reload: this.tabChange }),
    new Tab(LessonsComponent, 'Lessons', { parent: 'AppComponent', reload: this.tabChange }),
  ];
  public tabSub = new BehaviorSubject<Tab[]>(this.tabs);

  public changeTab(){
    this.tabChange.next();
  }

  public removeTab(index: number) {
    this.tabs.splice(index, 1);
    if (this.tabs.length > 0) {
      this.tabs[this.tabs.length - 1].active = true;
    }
    this.tabSub.next(this.tabs);
  }

  public addTab(tab: Tab) {
    for (let i = 0; i < this.tabs.length; i++) {
      if (this.tabs[i].active === true) {
        this.tabs[i].active = false;
      }
    }
    tab.id = this.tabs.length + 1;
    tab.active = true;
    this.tabs.push(tab);
    this.tabSub.next(this.tabs);
  }
}
