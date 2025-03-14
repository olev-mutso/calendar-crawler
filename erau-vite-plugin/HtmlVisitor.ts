import { HTMLElement, parse } from 'node-html-parser';
import { DateTime } from 'luxon';
import { WorkMode, EventPriority, EventDurationType, CalendarEvent } from '../src/calendar-types';


function getMonthNames(): Record<string, number> {
  const monthNames: Record<string, number> = {};

  const formatter = new Intl.DateTimeFormat('et', { month: 'long' });
  for(let monthNumber = 1; monthNumber <= 12; monthNumber++) {
    const monthName = formatter.format(new Date(2003, monthNumber, 1))
    monthNames[monthName] = monthNumber;
  }
  return monthNames;
}

function toDateNumber(text: string | undefined): number | undefined {
  if(!text) {
    return undefined;
  }
  return parseInt(text.replace('.', '').trim());
}

function toString(text: string | undefined) {
  if(text) {
    return `'${text}'`;
  }

  return undefined
}

function toStringUTC(date: TableDateOnly, time: TableTimeOnly) {
  DateTime.utc(2017, 5, 15, 17, 36)
  const {year, month, day} = date;
  const hour = time.hour;
  const minute = time.minute;

  return `'${DateTime.utc(year, month, day, hour, minute).toISO()}'`;
}

const allModes: WorkMode[] = ['CW', 'SSB', 'FM', 'FT4', 'FT8', 'RTTY'];


interface TableTitle {
  year: number;
  month: number; // starts from 1 - 12 
}

interface TableTimeOnly {
  hour: number
  minute: number;
}

interface TableDateOnly {
  year: number;
  month: number;
  day: number;
} 

interface TableRow {
  startDate: TableDateOnly;
  endDate: TableDateOnly | undefined;
  startTime: TableTimeOnly | undefined; 
  endTime: TableTimeOnly | undefined;

  priority: EventPriority;
  name: string;
  location: string | undefined;
  modes: WorkMode[];
  durationType: EventDurationType;
}

export class HtmlVisitor {
  private _namesByNumber = getMonthNames();
  private _titles: TableTitle[] = [];
  private _rows: TableRow[] = [];
  
  visitHtml(calendar: string): HtmlVisitor {
    const dom = parse(calendar)
    const [main] = dom.getElementsByTagName('main');
    if(!main) {
      throw new Error("main not found!");
    }
    main.children.forEach(mainEntry => this.visitMainChild(mainEntry))
    return this;
  }

  visitMainChild(child : HTMLElement) {
    if(child.tagName === 'DIV') {
      child.children.forEach(mainEntry => this.visitMainChild(mainEntry))
      return;
    }

    if(child.tagName === 'P') {
      this.visitTableHeader(child);
    } else if(child.tagName === 'TABLE') {
      this.visitTable(child);
    }
  }

  visitTableHeader(possiblyTableHeader: HTMLElement) {
    const content = possiblyTableHeader.textContent?.trim();
    if(!content) {
      return;
    }

    const [monthName, year] = content.toLocaleLowerCase().split(' ').filter(entry => !!entry);
    const monthNumber = this._namesByNumber[monthName];
    if(!monthNumber) {
      return;
    }
    try {
      this._titles.push({
        year: parseInt(year),
        month: monthNumber,
      });
    } catch(error) {
      const msg = 'failed to parse month data from title';
      console.error(msg, error);
      throw new Error(msg);
    }
  }

  visitTable(table: HTMLElement) {
    table.getElementsByTagName('TR').forEach(row => {

      try {
        this.visitRow(row)
      } catch(e) {
        console.error(e, row.textContent);
        throw new Error('failed to parse table row')
      }
    })
  }


  visitRow(row: HTMLElement) {
    const [eventDate, eventName, startAndEnd, locationOrMode] = row.getElementsByTagName('TD');

    // tables headers are missing, identify if it's header row or not based on content
    if(eventDate.textContent.trim().toLocaleLowerCase() === 'kuupäev'){
      return;
    }
    
    const extracted: TableRow = {
      ...this.visitEventDate(eventDate),
      ...this.visitEventTime(startAndEnd),
      ...this.visitEventModesAndLocation(locationOrMode),

      name: this.visitEventName(eventName),
      priority: this.visitEventPriority(eventName),
    };

    this._rows.push(extracted);
  }


  visitEventDate(eventDate: HTMLElement): {
    startDate: TableDateOnly;
    endDate: TableDateOnly | undefined;
    durationType: EventDurationType;
  } {
    const { year } = this._titles[this._titles.length-1];
    const cleaned: string = eventDate.textContent.trim();
    const [start, end = ''] = cleaned.split('-');

    const [startDay, startMonth] = start.split('.');
    const [endDay, endMonth] = end.split('.');

    const durationType: EventDurationType = !!end ? 'MULTIPLE_DAYS' : 'ONE_DAY';

    return {
      durationType,
      startDate: {
        day: toDateNumber(startDay)!,
        month: (toDateNumber(startMonth) ?? toDateNumber(endMonth))!,
        year
      },
      endDate: durationType === 'MULTIPLE_DAYS' ? {
        day: toDateNumber(endDay)!,
        month: toDateNumber(endMonth)!,
        year
      } : undefined
    }
  }

  visitEventName(eventName: HTMLElement): string {
    return eventName.textContent.trim();
  }

  visitEventTime(eventDate: HTMLElement): {
    startTime: TableTimeOnly | undefined;
    endTime: TableTimeOnly | undefined;
  } {
    const cleaned: string = eventDate.textContent.trim()
      .replace('.', ':')
      .replace(/[^0-9:-]+/g, '');
    if(!cleaned) {
      return {
        startTime: undefined,
        endTime: undefined
      };
    }

    
    const [start, end = ''] = cleaned.split('-');
    const [startHour, startMinute] = start.split(':');
    const [endHour, endMinute] = end.split(':');

    return {
      startTime: {
        hour: parseInt(startHour),
        minute: parseInt(startMinute)
      },
      endTime: {
        hour: parseInt(endHour),
        minute: parseInt(endMinute)
      }
    }
  }

  visitEventModesAndLocation(element: HTMLElement): {
    location: string | undefined;
    modes: WorkMode[];
  } {
    const cleaned: string[] = element.textContent
      .trim().toLocaleUpperCase()
      .split(',')
      .map(mode => mode.trim());

    const modes =  cleaned.filter(mode => allModes.includes(mode as WorkMode))
      .map(mode => mode as WorkMode);

    const location = cleaned.find(mode => !allModes.includes(mode as WorkMode))
    return { modes, location };
  }


  visitEventPriority(eventDate: HTMLElement): EventPriority {
    return 'NORMAL'
  }

  close() {
    const entries = this._rows.map(row => {
      const result: CalendarEvent = { 
        eventName: row.name,
        location: row.location,
        priority: row.priority,
        duration: row.durationType,
        workModes: row.modes,

        startAt: toStringUTC(row.startDate, row.startTime ?? { hour: 0, minute: 1 }),
        endsAt: toStringUTC(row.endDate ?? row.startDate, { 
          hour: row.endTime?.hour ?? 23, 
          minute: row.endTime?.minute ?? 59 })
      }

      return result;
    });
    console.log(`total events found: ${this._rows.length}`);

    return {
      ts: this.toTs(entries),
      json: this.toJson(entries),
    }
  }
  toJson(events: CalendarEvent[]): string {
    return JSON.stringify(events, null, 2);
  }
  toTs(events: CalendarEvent[]): string {
    const entries = events.map(row => {
      return `
  { 
    eventName: '${row.eventName}',
    location: ${toString(row.location)},
    priority: '${row.priority}',
    duration: '${row.duration}',
    workModes: [${row.workModes.map(toString).join(',')}],

    startAt: ${row.startAt},
    endsAt: ${row.endsAt}
  }`
    }).join(',\r\n')
    return [
      "import { Calendar } from './calendar-types'",
      "",
      "",
      "export const calendar: Calendar = [",
      entries,
      "]"
    ].join('\r\n')
  }
}